<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class StoreCategoryRequestTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function authorize_returns_true()
    {
        $request = new StoreCategoryRequest();
        
        $this->assertTrue($request->authorize());
    }

    #[Test]
    public function validation_rules_are_correct()
    {
        $request = new StoreCategoryRequest();
        $rules = $request->rules();
        
        $expectedRules = [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|integer|exists:categories,id',
        ];
        
        $this->assertEquals($expectedRules, $rules);
    }

    #[Test]
    public function validation_passes_with_valid_data()
    {
        $parent = Category::factory()->create();
        $data = [
            'name' => '電子產品',
            'description' => '所有電子相關產品',
            'parent_id' => $parent->id,
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function validation_passes_with_minimal_data()
    {
        $data = [
            'name' => '電子產品',
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function validation_fails_when_name_is_missing()
    {
        $data = [
            'description' => '所有電子相關產品',
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    #[Test]
    public function validation_fails_when_name_exceeds_max_length()
    {
        $data = [
            'name' => str_repeat('a', 256), // 超過 255 字符
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    #[Test]
    public function validation_fails_when_parent_id_does_not_exist()
    {
        $data = [
            'name' => '電子產品',
            'parent_id' => 99999, // 不存在的 ID
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('parent_id', $validator->errors()->toArray());
    }

    #[Test]
    public function validation_fails_when_parent_id_is_not_integer()
    {
        $data = [
            'name' => '電子產品',
            'parent_id' => 'not-a-number',
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('parent_id', $validator->errors()->toArray());
    }

    #[Test]
    public function validation_passes_with_null_parent_id()
    {
        $data = [
            'name' => '電子產品',
            'parent_id' => null,
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function validation_passes_with_null_description()
    {
        $data = [
            'name' => '電子產品',
            'description' => null,
        ];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules());
        
        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function attributes_returns_correct_mapping()
    {
        $request = new StoreCategoryRequest();
        $attributes = $request->attributes();
        
        $expectedAttributes = [
            'name' => '分類名稱',
            'description' => '分類描述',
            'parent_id' => '父分類',
        ];
        
        $this->assertEquals($expectedAttributes, $attributes);
    }

    #[Test]
    public function messages_returns_correct_custom_messages()
    {
        $request = new StoreCategoryRequest();
        $messages = $request->messages();
        
        $expectedMessages = [
            'name.required' => '分類名稱為必填項目',
            'name.string' => '分類名稱必須是文字格式',
            'name.max' => '分類名稱不能超過 255 個字符',
            'description.string' => '分類描述必須是文字格式',
            'parent_id.integer' => '父分類 ID 必須是數字',
            'parent_id.exists' => '指定的父分類不存在',
        ];
        
        $this->assertEquals($expectedMessages, $messages);
    }

    #[Test]
    public function validation_error_uses_custom_messages()
    {
        $data = [];
        
        $request = new StoreCategoryRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());
        
        $this->assertTrue($validator->fails());
        $errors = $validator->errors()->toArray();
        $this->assertStringContainsString('分類名稱為必填項目', $errors['name'][0]);
    }

    #[Test]
    public function body_parameters_returns_correct_structure()
    {
        $request = new StoreCategoryRequest();
        $bodyParams = $request->bodyParameters();
        
        $this->assertArrayHasKey('name', $bodyParams);
        $this->assertArrayHasKey('description', $bodyParams);
        $this->assertArrayHasKey('parent_id', $bodyParams);
        
        // 檢查 name 參數
        $this->assertEquals('分類名稱', $bodyParams['name']['description']);
        $this->assertEquals('電子產品', $bodyParams['name']['example']);
        $this->assertTrue($bodyParams['name']['required']);
        
        // 檢查 description 參數
        $this->assertEquals('分類描述', $bodyParams['description']['description']);
        $this->assertEquals('包含所有電子相關產品', $bodyParams['description']['example']);
        $this->assertFalse($bodyParams['description']['required']);
        
        // 檢查 parent_id 參數
        $this->assertEquals('父分類ID，必須是存在的分類ID', $bodyParams['parent_id']['description']);
        $this->assertEquals(1, $bodyParams['parent_id']['example']);
        $this->assertFalse($bodyParams['parent_id']['required']);
    }

    #[Test]
    public function body_parameters_have_correct_examples()
    {
        $request = new StoreCategoryRequest();
        $bodyParams = $request->bodyParameters();
        
        $this->assertEquals('電子產品', $bodyParams['name']['example']);
        $this->assertEquals('包含所有電子相關產品', $bodyParams['description']['example']);
        $this->assertEquals(1, $bodyParams['parent_id']['example']);
    }

    #[Test]
    public function body_parameters_have_correct_descriptions()
    {
        $request = new StoreCategoryRequest();
        $bodyParams = $request->bodyParameters();
        
        $this->assertEquals('分類名稱', $bodyParams['name']['description']);
        $this->assertEquals('分類描述', $bodyParams['description']['description']);
        $this->assertEquals('父分類ID，必須是存在的分類ID', $bodyParams['parent_id']['description']);
    }
} 