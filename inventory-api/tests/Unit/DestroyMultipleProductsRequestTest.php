<?php

namespace Tests\Unit;

use App\Http\Requests\Api\DestroyMultipleProductsRequest;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class DestroyMultipleProductsRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorize_returns_true()
    {
        $request = new DestroyMultipleProductsRequest();
        
        $this->assertTrue($request->authorize());
    }

    public function test_validation_rules_are_correct()
    {
        $request = new DestroyMultipleProductsRequest();
        $rules = $request->rules();

        $expectedRules = [
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|exists:products,id',
        ];

        $this->assertEquals($expectedRules, $rules);
    }

    public function test_validation_passes_with_valid_product_ids()
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();

        $data = [
            'ids' => [$product1->id, $product2->id]
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_ids_is_missing()
    {
        $data = [];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_ids_is_not_array()
    {
        $data = [
            'ids' => 'not-an-array'
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_ids_is_empty_array()
    {
        $data = [
            'ids' => []
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('ids', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_ids_contains_non_integer()
    {
        $data = [
            'ids' => ['not-integer', 1]
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('ids.0', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_ids_contains_non_existent_product()
    {
        $product = Product::factory()->create();
        
        $data = [
            'ids' => [$product->id, 99999] // 99999 不存在
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('ids.1', $validator->errors()->toArray());
    }

    public function test_validation_allows_duplicate_product_ids()
    {
        $product = Product::factory()->create();
        
        $data = [
            'ids' => [$product->id, $product->id] // 重複的 ID
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_custom_messages_are_correct()
    {
        $request = new DestroyMultipleProductsRequest();
        $messages = $request->messages();

        $expectedMessages = [
            'ids.required'      => '請提供要刪除的商品 ID 列表',
            'ids.array'         => '商品 ID 列表必須是陣列格式',
            'ids.min'           => '至少需要選擇一個商品進行刪除',
            'ids.*.integer'     => '商品 ID 必須是整數',
            'ids.*.exists'      => '商品 ID :input 不存在，請檢查後重試',
        ];

        $this->assertEquals($expectedMessages, $messages);
    }

    public function test_validation_error_uses_custom_message_for_missing_ids()
    {
        $data = [];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('請提供要刪除的商品 ID 列表', $errors->get('ids'));
    }

    public function test_validation_error_uses_custom_message_for_non_array()
    {
        $data = [
            'ids' => 'not-an-array'
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('商品 ID 列表必須是陣列格式', $errors->get('ids'));
    }

    public function test_validation_error_for_empty_array_returns_appropriate_message()
    {
        $data = [
            'ids' => []
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        
        // 驗證確實產生了錯誤，內容是我們自定義訊息中的一個
        $this->assertTrue($errors->has('ids'));
        $errorMessage = $errors->first('ids');
        
        // 可能是 min 規則的錯誤訊息或其他相關的自定義訊息
        $this->assertNotEmpty($errorMessage);
        
        // 確保錯誤訊息是中文的（我們的自定義訊息）
        $this->assertMatchesRegularExpression('/[\x{4e00}-\x{9fff}]/u', $errorMessage, 'Error message should contain Chinese characters');
    }

    public function test_validation_error_uses_custom_message_for_non_integer()
    {
        $data = [
            'ids' => ['not-integer']
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        $this->assertContains('商品 ID 必須是整數', $errors->get('ids.0'));
    }

    public function test_validation_error_uses_custom_message_for_non_existent_product()
    {
        $data = [
            'ids' => [99999]
        ];

        $request = new DestroyMultipleProductsRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        
        // 檢查錯誤訊息包含自定義文字（:input 會被 Laravel 替換為實際值）
        $errorMessage = $errors->first('ids.0');
        $this->assertStringContainsString('不存在，請檢查後重試', $errorMessage);
    }

    public function test_get_product_ids_returns_validated_ids()
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();

        $request = new DestroyMultipleProductsRequest();
        
        // 模擬驗證過的資料
        $request->merge(['ids' => [$product1->id, $product2->id]]);
        $request->setValidator(
            Validator::make(['ids' => [$product1->id, $product2->id]], $request->rules())
        );

        $result = $request->getProductIds();

        $this->assertEquals([$product1->id, $product2->id], $result);
    }

    public function test_get_product_ids_returns_empty_array_when_no_ids()
    {
        $request = new DestroyMultipleProductsRequest();
        
        // 模擬沒有 ids 的情況
        $request->merge([]);
        $request->setValidator(
            Validator::make([], ['ids' => 'sometimes|array'])
        );

        $result = $request->getProductIds();

        $this->assertEquals([], $result);
    }

    public function test_get_product_count_returns_correct_count()
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        $product3 = Product::factory()->create();

        $request = new DestroyMultipleProductsRequest();
        
        // 模擬驗證過的資料
        $request->merge(['ids' => [$product1->id, $product2->id, $product3->id]]);
        $request->setValidator(
            Validator::make(['ids' => [$product1->id, $product2->id, $product3->id]], $request->rules())
        );

        $result = $request->getProductCount();

        $this->assertEquals(3, $result);
    }

    public function test_get_product_count_returns_zero_when_no_ids()
    {
        $request = new DestroyMultipleProductsRequest();
        
        // 模擬沒有 ids 的情況
        $request->merge([]);
        $request->setValidator(
            Validator::make([], ['ids' => 'sometimes|array'])
        );

        $result = $request->getProductCount();

        $this->assertEquals(0, $result);
    }

    public function test_body_parameters_returns_correct_structure()
    {
        $request = new DestroyMultipleProductsRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertIsArray($bodyParams);
        $this->assertArrayHasKey('ids', $bodyParams);
        $this->assertArrayHasKey('ids.*', $bodyParams);

        // 驗證參數有正確的描述、範例和必填標記
        $this->assertArrayHasKey('description', $bodyParams['ids']);
        $this->assertArrayHasKey('example', $bodyParams['ids']);
        $this->assertArrayHasKey('required', $bodyParams['ids']);
        $this->assertTrue($bodyParams['ids']['required']);

        $this->assertArrayHasKey('description', $bodyParams['ids.*']);
        $this->assertArrayHasKey('example', $bodyParams['ids.*']);
        $this->assertArrayHasKey('required', $bodyParams['ids.*']);
        $this->assertTrue($bodyParams['ids.*']['required']);
    }

    public function test_body_parameters_have_correct_examples()
    {
        $request = new DestroyMultipleProductsRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertEquals([1, 2, 3], $bodyParams['ids']['example']);
        $this->assertEquals(1, $bodyParams['ids.*']['example']);
    }

    public function test_body_parameters_have_correct_descriptions()
    {
        $request = new DestroyMultipleProductsRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertEquals('要刪除的商品 ID 列表', $bodyParams['ids']['description']);
        $this->assertEquals('商品 ID，必須存在於資料庫中', $bodyParams['ids.*']['description']);
    }
} 