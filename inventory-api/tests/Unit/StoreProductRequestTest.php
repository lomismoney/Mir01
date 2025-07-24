<?php

namespace Tests\Unit;

use App\Http\Requests\Api\StoreProductRequest;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class StoreProductRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    #[Test]
    public function it_authorizes_admin_to_store_product()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $request = new StoreProductRequest();
        $request->setUserResolver(fn() => $admin);
        
        $this->assertTrue($request->authorize());
    }
    
    #[Test]
    public function it_denies_viewer_to_store_product()
    {
        $viewer = User::factory()->create();
        $viewer->assignRole('viewer');
        
        $request = new StoreProductRequest();
        $request->setUserResolver(fn() => $viewer);
        
        $this->assertFalse($request->authorize());
    }
    
    #[Test]
    public function it_allows_staff_to_store_product()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');
        
        $request = new StoreProductRequest();
        $request->setUserResolver(fn() => $staff);
        
        $this->assertTrue($request->authorize());
    }

    public function test_validation_rules_are_correct()
    {
        $request = new StoreProductRequest();
        $rules = $request->rules();

        $expectedRules = [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'category_id'   => 'nullable|integer|exists:categories,id',
            'attributes'    => 'array', // 🎯 允許空陣列，支援單規格商品
            'attributes.*'  => 'integer|exists:attributes,id',
            'variants'      => 'required|array|min:1',
            'variants.*.sku' => 'required|string|unique:product_variants,sku|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            // 支援舊格式
            'variants.*.attribute_value_ids' => 'array', // 🎯 允許空陣列，支援單規格商品
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
            // 支援新格式
            'variants.*.attribute_values' => 'array',
            'variants.*.attribute_values.*.attribute_id' => 'integer|exists:attributes,id',
            'variants.*.attribute_values.*.value' => 'required|string|max:255',
        ];

        $this->assertEquals($expectedRules, $rules);
    }

    public function test_validation_passes_with_valid_data()
    {
        $category = Category::factory()->create();
        $attribute = Attribute::factory()->create();
        $attributeValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);

        $data = [
            'name' => 'Test Product',
            'description' => 'Test Description',
            'category_id' => $category->id,
            'attributes' => [$attribute->id],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [$attributeValue->id]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_name_is_missing()
    {
        $data = [
            'description' => 'Test Description',
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_name_exceeds_max_length()
    {
        $data = [
            'name' => str_repeat('a', 256), // 超過 255 字元
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_category_id_does_not_exist()
    {
        $data = [
            'name' => 'Test Product',
            'category_id' => 99999, // 不存在的分類 ID
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('category_id', $validator->errors()->toArray());
    }

    public function test_validation_passes_when_attributes_is_missing()
    {
        $data = [
            'name' => 'Test Product',
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => []
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        // 🎯 支援單規格商品，attributes 可以缺失
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_attributes_contains_non_existent_id()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [99999], // 不存在的屬性 ID
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('attributes.0', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_variants_is_empty()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => []
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_variant_sku_is_missing()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => [
                [
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_variant_sku_exceeds_max_length()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => str_repeat('a', 256), // 超過 255 字元
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_variant_sku_is_duplicate()
    {
        // 建立一個已存在的商品變體
        $existingVariant = ProductVariant::factory()->create(['sku' => 'EXISTING-SKU']);

        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'EXISTING-SKU', // 重複的 SKU
                    'price' => 99.99,
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_variant_price_is_negative()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => -10.00, // 負數價格
                    'attribute_value_ids' => [1]
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.price', $validator->errors()->toArray());
    }

    public function test_validation_passes_when_variant_attribute_value_ids_is_missing()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99
                    // 🎯 缺少 attribute_value_ids 在單規格商品中是允許的
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        // 🎯 支援單規格商品，attribute_value_ids 可以缺失
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_attribute_value_does_not_exist()
    {
        $data = [
            'name' => 'Test Product',
            'attributes' => [1],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [99999] // 不存在的屬性值 ID
                ]
            ]
        ];

        $request = new StoreProductRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.attribute_value_ids.0', $validator->errors()->toArray());
    }

    public function test_body_parameters_returns_correct_structure()
    {
        $request = new StoreProductRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertIsArray($bodyParams);
        $this->assertArrayHasKey('name', $bodyParams);
        $this->assertArrayHasKey('description', $bodyParams);
        $this->assertArrayHasKey('category_id', $bodyParams);
        $this->assertArrayHasKey('attributes', $bodyParams);
        $this->assertArrayHasKey('variants', $bodyParams);
        $this->assertArrayHasKey('variants.*.sku', $bodyParams);
        $this->assertArrayHasKey('variants.*.price', $bodyParams);
        $this->assertArrayHasKey('variants.*.attribute_value_ids', $bodyParams);

        // 驗證參數有正確的描述和範例
        $this->assertArrayHasKey('description', $bodyParams['name']);
        $this->assertArrayHasKey('example', $bodyParams['name']);
    }
} 