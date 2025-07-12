<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\UpdateProductRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class UpdateProductRequestTest extends TestCase
{
    use RefreshDatabase;

    protected $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new UpdateProductRequest();
    }

    public function test_authorize_always_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_method_returns_validation_rules(): void
    {
        $rules = $this->request->rules();
        
        $this->assertIsArray($rules);
        $this->assertArrayHasKey('name', $rules);
        $this->assertArrayHasKey('description', $rules);
        $this->assertArrayHasKey('category_id', $rules);
        $this->assertArrayHasKey('attributes', $rules);
        $this->assertArrayHasKey('attributes.*', $rules);
        $this->assertArrayHasKey('variants', $rules);
        $this->assertArrayHasKey('variants.*.id', $rules);
        $this->assertArrayHasKey('variants.*.sku', $rules);
        $this->assertArrayHasKey('variants.*.price', $rules);
        $this->assertArrayHasKey('variants.*.attribute_value_ids', $rules);
        $this->assertArrayHasKey('variants.*.attribute_value_ids.*', $rules);
    }

    public function test_body_parameters_method_returns_documentation(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertIsArray($bodyParameters);
        $this->assertArrayHasKey('name', $bodyParameters);
        $this->assertArrayHasKey('description', $bodyParameters);
        $this->assertArrayHasKey('category_id', $bodyParameters);
        $this->assertArrayHasKey('attributes', $bodyParameters);
        $this->assertArrayHasKey('attributes.*', $bodyParameters);
        $this->assertArrayHasKey('variants', $bodyParameters);
        $this->assertArrayHasKey('variants.*.id', $bodyParameters);
        $this->assertArrayHasKey('variants.*.sku', $bodyParameters);
        $this->assertArrayHasKey('variants.*.price', $bodyParameters);
        $this->assertArrayHasKey('variants.*.attribute_value_ids', $bodyParameters);
        $this->assertArrayHasKey('variants.*.attribute_value_ids.*', $bodyParameters);
    }

    public function test_valid_data_passes_validation(): void
    {
        $validData = [
            'name' => '高階人體工學辦公椅',
            'description' => '具備可調節腰靠和 4D 扶手',
            'attributes' => [],
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_missing_required_name_fails_validation(): void
    {
        $invalidData = [
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_missing_required_variants_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants', $validator->errors()->toArray());
    }

    public function test_empty_variants_array_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants', $validator->errors()->toArray());
    }

    public function test_missing_required_variant_sku_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_missing_required_variant_price_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.price', $validator->errors()->toArray());
    }

    public function test_negative_price_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => -100.00,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.price', $validator->errors()->toArray());
    }

    public function test_zero_price_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 0.00,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_long_name_fails_validation(): void
    {
        $invalidData = [
            'name' => str_repeat('A', 256),
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_long_sku_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => str_repeat('A', 256),
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_non_string_name_fails_validation(): void
    {
        $invalidData = [
            'name' => 123,
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_non_string_sku_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 123,
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.sku', $validator->errors()->toArray());
    }

    public function test_non_numeric_price_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 'not_a_number',
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.price', $validator->errors()->toArray());
    }

    public function test_non_integer_category_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'category_id' => 'not_an_integer',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('category_id', $validator->errors()->toArray());
    }

    public function test_non_integer_variant_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'id' => 'not_an_integer',
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.id', $validator->errors()->toArray());
    }

    public function test_non_array_attributes_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'attributes' => 'not_an_array',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('attributes', $validator->errors()->toArray());
    }

    public function test_non_array_attribute_value_ids_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => 'not_an_array',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.attribute_value_ids', $validator->errors()->toArray());
    }

    public function test_non_integer_attribute_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'attributes' => ['not_an_integer'],
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('attributes.0', $validator->errors()->toArray());
    }

    public function test_non_integer_attribute_value_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => ['not_an_integer'],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('variants.0.attribute_value_ids.0', $validator->errors()->toArray());
    }

    public function test_nullable_description_allows_null(): void
    {
        $validData = [
            'name' => '測試商品',
            'description' => null,
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_nullable_category_id_allows_null(): void
    {
        $validData = [
            'name' => '測試商品',
            'category_id' => null,
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_empty_attributes_array_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'attributes' => [],
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_empty_attribute_value_ids_array_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_multiple_variants_pass_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
                [
                    'sku' => 'CHAIR-ERG-BLUE-M',
                    'price' => 349.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_duplicate_sku_in_same_request_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 349.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $request = new UpdateProductRequest();
        $request->replace($invalidData);
        
        $validator = Validator::make($invalidData, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue(
            $validator->errors()->has('variants.0.sku') || 
            $validator->errors()->has('variants.1.sku')
        );
    }

    public function test_non_string_description_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試商品',
            'description' => 123,
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('description', $validator->errors()->toArray());
    }

    public function test_string_description_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'description' => '這是一個測試商品的描述',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_float_price_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_integer_price_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 400,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_large_price_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 999999.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_small_decimal_price_passes_validation(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 0.01,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_sometimes_rule_for_variant_id(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    // No ID provided for new variant
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_minimal_valid_data(): void
    {
        $validData = [
            'name' => '測試商品',
            'variants' => [
                [
                    'sku' => 'TEST-SKU',
                    'price' => 100,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_comprehensive_valid_data(): void
    {
        $validData = [
            'name' => '高階人體工學辦公椅',
            'description' => '具備可調節腰靠和 4D 扶手的高階辦公椅',
            'attributes' => [],
            'variants' => [
                [
                    'sku' => 'CHAIR-ERG-RED-L',
                    'price' => 399.99,
                    'attribute_value_ids' => [],
                ],
                [
                    'sku' => 'CHAIR-ERG-BLUE-M',
                    'price' => 349.99,
                    'attribute_value_ids' => [],
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}