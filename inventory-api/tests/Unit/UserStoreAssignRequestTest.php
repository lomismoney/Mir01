<?php

namespace Tests\Unit;

use App\Http\Requests\Api\UserStoreAssignRequest;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class UserStoreAssignRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorize_returns_true_for_admin_user()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $request = new UserStoreAssignRequest();
        $request->setUserResolver(fn() => $admin);

        $this->assertTrue($request->authorize());
    }

    public function test_authorize_returns_false_for_staff_user()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');

        $request = new UserStoreAssignRequest();
        $request->setUserResolver(fn() => $staff);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_for_viewer_user()
    {
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');

        $request = new UserStoreAssignRequest();
        $request->setUserResolver(fn() => $viewer);

        $this->assertFalse($request->authorize());
    }

    public function test_authorize_returns_false_for_unauthenticated_user()
    {
        $request = new UserStoreAssignRequest();
        $request->setUserResolver(fn() => null);

        $this->assertFalse($request->authorize());
    }

    public function test_validation_rules_are_correct()
    {
        $request = new UserStoreAssignRequest();
        $rules = $request->rules();

        $expectedRules = [
            'store_ids' => ['present', 'array'],
            'store_ids.*' => ['integer', 'exists:stores,id'],
        ];

        $this->assertEquals($expectedRules, $rules);
    }

    public function test_validation_passes_with_valid_store_ids()
    {
        $store1 = Store::factory()->create();
        $store2 = Store::factory()->create();

        $data = [
            'store_ids' => [$store1->id, $store2->id]
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_passes_with_empty_store_ids_array()
    {
        $data = [
            'store_ids' => []
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_store_ids_is_missing()
    {
        $data = [];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_store_ids_is_not_array()
    {
        $data = [
            'store_ids' => 'not-an-array'
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_store_ids_contains_non_integer()
    {
        $data = [
            'store_ids' => ['not-integer', 1]
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_ids.0', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_store_ids_contains_non_existent_store()
    {
        $store = Store::factory()->create();
        
        $data = [
            'store_ids' => [$store->id, 99999] // 99999 不存在
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_ids.1', $validator->errors()->toArray());
    }

    public function test_validation_allows_duplicate_store_ids()
    {
        $store = Store::factory()->create();
        
        $data = [
            'store_ids' => [$store->id, $store->id] // 重複的 ID
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_custom_messages_are_correct()
    {
        $request = new UserStoreAssignRequest();
        $messages = $request->messages();

        $expectedMessages = [
            'store_ids.present' => 'store_ids 欄位為必填',
            'store_ids.array' => '分店必須以陣列形式提供',
            'store_ids.*.integer' => '分店ID必須是整數',
            'store_ids.*.exists' => '選擇的分店不存在',
        ];

        $this->assertEquals($expectedMessages, $messages);
    }

    public function test_validation_error_uses_custom_messages()
    {
        $data = [
            'store_ids' => 'not-an-array'
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('分店必須以陣列形式提供', $errors->get('store_ids'));
    }

    public function test_validation_error_for_missing_store_ids_uses_custom_message()
    {
        $data = [];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('store_ids 欄位為必填', $errors->get('store_ids'));
    }

    public function test_validation_error_for_non_integer_store_id_uses_custom_message()
    {
        $data = [
            'store_ids' => ['not-integer']
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('分店ID必須是整數', $errors->get('store_ids.0'));
    }

    public function test_validation_error_for_non_existent_store_uses_custom_message()
    {
        $data = [
            'store_ids' => [99999]
        ];

        $request = new UserStoreAssignRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('選擇的分店不存在', $errors->get('store_ids.0'));
    }

    public function test_body_parameters_returns_correct_structure()
    {
        $request = new UserStoreAssignRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertIsArray($bodyParams);
        $this->assertArrayHasKey('store_ids', $bodyParams);
        $this->assertArrayHasKey('store_ids.*', $bodyParams);

        // 驗證參數有正確的描述、範例和必填標記
        $this->assertArrayHasKey('description', $bodyParams['store_ids']);
        $this->assertArrayHasKey('example', $bodyParams['store_ids']);
        $this->assertArrayHasKey('required', $bodyParams['store_ids']);
        $this->assertTrue($bodyParams['store_ids']['required']);

        $this->assertArrayHasKey('description', $bodyParams['store_ids.*']);
        $this->assertArrayHasKey('example', $bodyParams['store_ids.*']);
        $this->assertArrayHasKey('required', $bodyParams['store_ids.*']);
        $this->assertTrue($bodyParams['store_ids.*']['required']);
    }

    public function test_body_parameters_have_correct_examples()
    {
        $request = new UserStoreAssignRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertEquals([1, 2, 3], $bodyParams['store_ids']['example']);
        $this->assertEquals(1, $bodyParams['store_ids.*']['example']);
    }
} 