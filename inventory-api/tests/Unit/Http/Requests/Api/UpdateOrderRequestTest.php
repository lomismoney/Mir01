<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\UpdateOrderRequest;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class UpdateOrderRequestTest extends TestCase
{
    use RefreshDatabase;

    protected $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new UpdateOrderRequest();
    }

    public function test_authorize_always_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_method_returns_validation_rules(): void
    {
        $rules = $this->request->rules();
        
        $this->assertIsArray($rules);
        $this->assertArrayHasKey('customer_id', $rules);
        $this->assertArrayHasKey('shipping_status', $rules);
        $this->assertArrayHasKey('payment_status', $rules);
        $this->assertArrayHasKey('items', $rules);
        $this->assertArrayHasKey('items.*.id', $rules);
        $this->assertArrayHasKey('items.*.product_variant_id', $rules);
        $this->assertArrayHasKey('items.*.is_stocked_sale', $rules);
        $this->assertArrayHasKey('items.*.status', $rules);
        $this->assertArrayHasKey('items.*.quantity', $rules);
        $this->assertArrayHasKey('items.*.price', $rules);
        $this->assertArrayHasKey('items.*.cost', $rules);
        $this->assertArrayHasKey('items.*.tax_rate', $rules);
        $this->assertArrayHasKey('items.*.discount_amount', $rules);
        $this->assertArrayHasKey('items.*.custom_product_name', $rules);
        $this->assertArrayHasKey('items.*.custom_specifications', $rules);
        $this->assertArrayHasKey('items.*.custom_product_image', $rules);
        $this->assertArrayHasKey('items.*.custom_product_category', $rules);
        $this->assertArrayHasKey('items.*.custom_product_brand', $rules);
    }

    public function test_messages_method_returns_custom_messages(): void
    {
        $messages = $this->request->messages();
        
        $this->assertIsArray($messages);
        $this->assertArrayHasKey('items.required', $messages);
        $this->assertArrayHasKey('items.*.quantity.min', $messages);
        $this->assertArrayHasKey('items.*.is_stocked_sale.required_with', $messages);
        $this->assertArrayHasKey('shipping_status.in', $messages);
        $this->assertArrayHasKey('payment_status.in', $messages);
        $this->assertArrayHasKey('items.*.status.in', $messages);
    }

    public function test_body_parameters_method_returns_documentation(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertIsArray($bodyParameters);
        $this->assertArrayHasKey('customer_id', $bodyParameters);
        $this->assertArrayHasKey('shipping_status', $bodyParameters);
        $this->assertArrayHasKey('payment_status', $bodyParameters);
        $this->assertArrayHasKey('items', $bodyParameters);
        $this->assertArrayHasKey('items.*.id', $bodyParameters);
        $this->assertArrayHasKey('items.*.product_variant_id', $bodyParameters);
        $this->assertArrayHasKey('items.*.is_stocked_sale', $bodyParameters);
        $this->assertArrayHasKey('items.*.status', $bodyParameters);
    }

    public function test_valid_data_passes_validation(): void
    {
        $validData = [
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 100.00,
            'tax' => 50.00,
            'discount_amount' => 0.00,
            'payment_method' => '現金',
            'shipping_address' => '台北市信義區信義路五段7號',
            'billing_address' => '台北市信義區信義路五段7號',
            'notes' => '請小心輕放',
            'po_number' => 'PO-2025-001',
            'reference_number' => 'REF-123',
            'subtotal' => 5000.00,
            'grand_total' => 5250.00,
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 2,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 100.00,
                    'custom_product_name' => '訂製辦公桌',
                    'custom_specifications' => '{"寬度": "180cm", "高度": "75cm"}',
                    'custom_product_image' => 'https://example.com/image.jpg',
                    'custom_product_category' => '辦公家具',
                    'custom_product_brand' => '自訂品牌',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_empty_data_passes_validation_due_to_sometimes_rule(): void
    {
        $emptyData = [];
        
        $validator = Validator::make($emptyData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_invalid_shipping_status_fails_validation(): void
    {
        $invalidData = [
            'shipping_status' => 'invalid_status',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('shipping_status', $validator->errors()->toArray());
    }

    public function test_invalid_payment_status_fails_validation(): void
    {
        $invalidData = [
            'payment_status' => 'invalid_status',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('payment_status', $validator->errors()->toArray());
    }

    public function test_negative_shipping_fee_fails_validation(): void
    {
        $invalidData = [
            'shipping_fee' => -100.00,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('shipping_fee', $validator->errors()->toArray());
    }

    public function test_negative_tax_fails_validation(): void
    {
        $invalidData = [
            'tax' => -50.00,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('tax', $validator->errors()->toArray());
    }

    public function test_negative_discount_amount_fails_validation(): void
    {
        $invalidData = [
            'discount_amount' => -100.00,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('discount_amount', $validator->errors()->toArray());
    }

    public function test_negative_subtotal_fails_validation(): void
    {
        $invalidData = [
            'subtotal' => -5000.00,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('subtotal', $validator->errors()->toArray());
    }

    public function test_negative_grand_total_fails_validation(): void
    {
        $invalidData = [
            'grand_total' => -5250.00,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('grand_total', $validator->errors()->toArray());
    }

    public function test_empty_items_array_fails_validation(): void
    {
        $invalidData = [
            'items' => [],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items', $validator->errors()->toArray());
    }

    public function test_invalid_item_status_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'invalid_status',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.status', $validator->errors()->toArray());
    }

    public function test_zero_quantity_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 0,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.quantity', $validator->errors()->toArray());
    }

    public function test_negative_item_price_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => -1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.price', $validator->errors()->toArray());
    }

    public function test_negative_item_cost_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => -800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.cost', $validator->errors()->toArray());
    }

    public function test_tax_rate_exceeds_100_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 150.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.tax_rate', $validator->errors()->toArray());
    }

    public function test_negative_tax_rate_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => -5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.tax_rate', $validator->errors()->toArray());
    }

    public function test_negative_item_discount_amount_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => -100.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.discount_amount', $validator->errors()->toArray());
    }

    public function test_long_payment_method_fails_validation(): void
    {
        $invalidData = [
            'payment_method' => str_repeat('A', 51),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('payment_method', $validator->errors()->toArray());
    }

    public function test_long_po_number_fails_validation(): void
    {
        $invalidData = [
            'po_number' => str_repeat('A', 51),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('po_number', $validator->errors()->toArray());
    }

    public function test_long_reference_number_fails_validation(): void
    {
        $invalidData = [
            'reference_number' => str_repeat('A', 51),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('reference_number', $validator->errors()->toArray());
    }

    public function test_long_custom_product_name_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => str_repeat('A', 256),
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.custom_product_name', $validator->errors()->toArray());
    }

    public function test_long_custom_product_image_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                    'custom_product_image' => str_repeat('A', 2049),
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.custom_product_image', $validator->errors()->toArray());
    }

    public function test_long_custom_product_category_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                    'custom_product_category' => str_repeat('A', 101),
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.custom_product_category', $validator->errors()->toArray());
    }

    public function test_long_custom_product_brand_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                    'custom_product_brand' => str_repeat('A', 101),
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.custom_product_brand', $validator->errors()->toArray());
    }

    public function test_invalid_custom_specifications_json_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                    'custom_specifications' => 'invalid json',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.custom_specifications', $validator->errors()->toArray());
    }

    public function test_missing_required_with_items_fields_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    // Missing required_with:items fields
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.is_stocked_sale', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.status', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.quantity', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.price', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.cost', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.tax_rate', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.discount_amount', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.custom_product_name', $validator->errors()->toArray());
    }

    public function test_valid_shipping_status_values(): void
    {
        $validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
        
        foreach ($validStatuses as $status) {
            $data = ['shipping_status' => $status];
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_valid_payment_status_values(): void
    {
        $validStatuses = ['pending', 'paid', 'failed', 'refunded'];
        
        foreach ($validStatuses as $status) {
            $data = ['payment_status' => $status];
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_valid_item_status_values(): void
    {
        $validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
        
        foreach ($validStatuses as $status) {
            $data = [
                'items' => [
                    [
                        'is_stocked_sale' => true,
                        'status' => $status,
                        'quantity' => 1,
                        'price' => 1000.00,
                        'cost' => 800.00,
                        'tax_rate' => 5.00,
                        'discount_amount' => 0.00,
                        'custom_product_name' => '商品名稱',
                    ],
                ],
            ];
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_valid_json_specifications_passes_validation(): void
    {
        $validData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 5.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                    'custom_specifications' => '{"寬度": "180cm", "高度": "75cm", "材質": "實木"}',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_zero_tax_rate_passes_validation(): void
    {
        $validData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 0.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_hundred_tax_rate_passes_validation(): void
    {
        $validData = [
            'items' => [
                [
                    'is_stocked_sale' => true,
                    'status' => 'pending',
                    'quantity' => 1,
                    'price' => 1000.00,
                    'cost' => 800.00,
                    'tax_rate' => 100.00,
                    'discount_amount' => 0.00,
                    'custom_product_name' => '商品名稱',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}