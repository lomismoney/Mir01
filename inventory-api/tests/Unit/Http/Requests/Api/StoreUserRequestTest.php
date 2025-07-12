<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\StoreUserRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StoreUserRequestTest extends TestCase
{
    use RefreshDatabase;

    private StoreUserRequest $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new StoreUserRequest();
        
        // 創建角色
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'viewer']);
    }

    /**
     * 測試授權方法返回 true
     */
    public function test_authorize_returns_true()
    {
        $this->assertTrue($this->request->authorize());
    }

    /**
     * 測試有效資料通過驗證
     */
    public function test_valid_data_passes_validation()
    {
        $validData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['admin'],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試姓名為必填
     */
    public function test_name_is_required()
    {
        $invalidData = [
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試姓名必須是字串
     */
    public function test_name_must_be_string()
    {
        $invalidData = [
            'name' => 123,
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試姓名長度限制
     */
    public function test_name_max_length()
    {
        $invalidData = [
            'name' => str_repeat('a', 256), // 超過 255 字元
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名為必填
     */
    public function test_username_is_required()
    {
        $invalidData = [
            'name' => 'Test User',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名必須是字串
     */
    public function test_username_must_be_string()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 123,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名長度限制
     */
    public function test_username_max_length()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => str_repeat('a', 256), // 超過 255 字元
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());
    }

    /**
     * 測試用戶名唯一性
     */
    public function test_username_must_be_unique()
    {
        // 創建現有用戶
        User::factory()->create(['username' => 'existinguser']);

        $invalidData = [
            'name' => 'Test User',
            'username' => 'existinguser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('username', $validator->errors()->toArray());
    }

    /**
     * 測試密碼為必填
     */
    public function test_password_is_required()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * 測試密碼必須是字串
     */
    public function test_password_must_be_string()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 123,
            'password_confirmation' => 'password123',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * 測試密碼最短長度
     */
    public function test_password_min_length()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => '1234567', // 少於 8 字元
            'password_confirmation' => '1234567',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * 測試密碼確認
     */
    public function test_password_confirmation_required()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'different_password',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * 測試角色陣列為可選
     */
    public function test_roles_is_optional()
    {
        $validData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            // 沒有 roles 欄位
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試角色必須是陣列
     */
    public function test_roles_must_be_array()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => 'admin', // 應該是陣列
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles', $validator->errors()->toArray());
    }

    /**
     * 測試角色必須是有效值
     */
    public function test_roles_must_be_valid()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['invalid_role'],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles.0', $validator->errors()->toArray());
    }

    /**
     * 測試有效的角色值
     */
    public function test_valid_roles()
    {
        $validData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['admin', 'staff'],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試空的角色陣列
     */
    public function test_empty_roles_array()
    {
        $validData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => [],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages()
    {
        $messages = $this->request->messages();
        
        $this->assertArrayHasKey('name.required', $messages);
        $this->assertArrayHasKey('username.required', $messages);
        $this->assertArrayHasKey('password.required', $messages);
        $this->assertArrayHasKey('username.unique', $messages);
        $this->assertArrayHasKey('password.confirmed', $messages);
        
        $this->assertEquals('姓名為必填欄位', $messages['name.required']);
        $this->assertEquals('用戶名為必填欄位', $messages['username.required']);
        $this->assertEquals('密碼為必填欄位', $messages['password.required']);
    }

    /**
     * 測試自定義屬性名稱
     */
    public function test_custom_attributes()
    {
        $attributes = $this->request->attributes();
        
        $this->assertArrayHasKey('name', $attributes);
        $this->assertArrayHasKey('username', $attributes);
        $this->assertArrayHasKey('password', $attributes);
        $this->assertArrayHasKey('role', $attributes);
        
        $this->assertEquals('姓名', $attributes['name']);
        $this->assertEquals('用戶名', $attributes['username']);
        $this->assertEquals('密碼', $attributes['password']);
        $this->assertEquals('角色', $attributes['role']);
    }

    /**
     * 測試 bodyParameters 方法
     */
    public function test_body_parameters()
    {
        $parameters = $this->request->bodyParameters();
        
        $this->assertArrayHasKey('name', $parameters);
        $this->assertArrayHasKey('username', $parameters);
        $this->assertArrayHasKey('password', $parameters);
        $this->assertArrayHasKey('password_confirmation', $parameters);
        $this->assertArrayHasKey('roles', $parameters);
        
        $this->assertEquals('用戶姓名', $parameters['name']['description']);
        $this->assertEquals('用戶名（唯一）', $parameters['username']['description']);
        $this->assertTrue($parameters['name']['required']);
        $this->assertTrue($parameters['username']['required']);
    }

    /**
     * 測試邊界值情況
     */
    public function test_boundary_values()
    {
        // 測試最大長度的有效值
        $validData = [
            'name' => str_repeat('a', 255), // 正好 255 字元
            'username' => str_repeat('b', 255), // 正好 255 字元
            'password' => 'password', // 正好 8 字元
            'password_confirmation' => 'password',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試特殊字元處理
     */
    public function test_special_characters()
    {
        $validData = [
            'name' => 'Test User 測試用戶',
            'username' => 'test_user-123',
            'password' => 'password123!@#',
            'password_confirmation' => 'password123!@#',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試多個角色
     */
    public function test_multiple_roles()
    {
        $validData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['admin', 'staff', 'viewer'],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試混合有效和無效角色
     */
    public function test_mixed_valid_invalid_roles()
    {
        $invalidData = [
            'name' => 'Test User',
            'username' => 'testuser',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['admin', 'invalid_role', 'staff'],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('roles.1', $validator->errors()->toArray());
    }
}