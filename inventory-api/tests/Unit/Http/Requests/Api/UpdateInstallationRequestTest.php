<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\UpdateInstallationRequest;
use App\Models\Installation;
use App\Models\User;
use App\Models\Customer;
use App\Models\ProductVariant;
use App\Models\InstallationItem;
use Carbon\Carbon;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class UpdateInstallationRequestTest extends TestCase
{
    use RefreshDatabase;

    protected $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new UpdateInstallationRequest();
    }

    public function test_authorize_always_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_method_returns_validation_rules(): void
    {
        $rules = $this->request->rules();
        
        $this->assertIsArray($rules);
        $this->assertArrayHasKey('installer_user_id', $rules);
        $this->assertArrayHasKey('customer_name', $rules);
        $this->assertArrayHasKey('customer_phone', $rules);
        $this->assertArrayHasKey('installation_address', $rules);
        $this->assertArrayHasKey('status', $rules);
        $this->assertArrayHasKey('scheduled_date', $rules);
        $this->assertArrayHasKey('actual_start_time', $rules);
        $this->assertArrayHasKey('actual_end_time', $rules);
        $this->assertArrayHasKey('notes', $rules);
        $this->assertArrayHasKey('items', $rules);
        $this->assertArrayHasKey('items.*.id', $rules);
        $this->assertArrayHasKey('items.*.product_variant_id', $rules);
        $this->assertArrayHasKey('items.*.product_name', $rules);
        $this->assertArrayHasKey('items.*.sku', $rules);
        $this->assertArrayHasKey('items.*.quantity', $rules);
        $this->assertArrayHasKey('items.*.specifications', $rules);
        $this->assertArrayHasKey('items.*.status', $rules);
        $this->assertArrayHasKey('items.*.notes', $rules);
    }

    public function test_messages_method_returns_custom_messages(): void
    {
        $messages = $this->request->messages();
        
        $this->assertIsArray($messages);
        $this->assertArrayHasKey('customer_name.required', $messages);
        $this->assertArrayHasKey('customer_phone.required', $messages);
        $this->assertArrayHasKey('installation_address.required', $messages);
        $this->assertArrayHasKey('status.in', $messages);
        $this->assertArrayHasKey('scheduled_date.after_or_equal', $messages);
        $this->assertArrayHasKey('actual_start_time.date_format', $messages);
        $this->assertArrayHasKey('actual_end_time.date_format', $messages);
        $this->assertArrayHasKey('items.*.product_name.required', $messages);
        $this->assertArrayHasKey('items.*.sku.required', $messages);
        $this->assertArrayHasKey('items.*.quantity.required', $messages);
        $this->assertArrayHasKey('items.*.quantity.min', $messages);
        $this->assertArrayHasKey('items.*.status.in', $messages);
    }

    public function test_body_parameters_method_returns_documentation(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertIsArray($bodyParameters);
        $this->assertArrayHasKey('installer_user_id', $bodyParameters);
        $this->assertArrayHasKey('customer_name', $bodyParameters);
        $this->assertArrayHasKey('customer_phone', $bodyParameters);
        $this->assertArrayHasKey('installation_address', $bodyParameters);
        $this->assertArrayHasKey('status', $bodyParameters);
        $this->assertArrayHasKey('scheduled_date', $bodyParameters);
        $this->assertArrayHasKey('actual_start_time', $bodyParameters);
        $this->assertArrayHasKey('actual_end_time', $bodyParameters);
        $this->assertArrayHasKey('notes', $bodyParameters);
        $this->assertArrayHasKey('items', $bodyParameters);
        $this->assertArrayHasKey('items.*.id', $bodyParameters);
        $this->assertArrayHasKey('items.*.product_variant_id', $bodyParameters);
        $this->assertArrayHasKey('items.*.product_name', $bodyParameters);
        $this->assertArrayHasKey('items.*.sku', $bodyParameters);
        $this->assertArrayHasKey('items.*.quantity', $bodyParameters);
        $this->assertArrayHasKey('items.*.specifications', $bodyParameters);
        $this->assertArrayHasKey('items.*.status', $bodyParameters);
        $this->assertArrayHasKey('items.*.notes', $bodyParameters);
    }

    public function test_valid_data_passes_validation(): void
    {
        $validData = [
            'customer_name' => '王大明',
            'customer_phone' => '0987654321',
            'installation_address' => '新北市板橋區文化路一段1號',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5)->toDateString(),
            'actual_start_time' => now()->addHours(1)->format('Y-m-d H:i:s'),
            'actual_end_time' => now()->addHours(3)->format('Y-m-d H:i:s'),
            'notes' => '安裝單備註',
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'specifications' => '黑色，右手開門',
                    'status' => 'pending',
                    'notes' => '項目備註',
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

    public function test_invalid_status_fails_validation(): void
    {
        $invalidData = [
            'status' => 'invalid_status',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('status', $validator->errors()->toArray());
    }

    public function test_past_scheduled_date_fails_validation(): void
    {
        $invalidData = [
            'scheduled_date' => now()->subDays(1)->toDateString(),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('scheduled_date', $validator->errors()->toArray());
    }

    public function test_invalid_actual_start_time_format_fails_validation(): void
    {
        $invalidData = [
            'actual_start_time' => 'invalid_date_format',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('actual_start_time', $validator->errors()->toArray());
    }

    public function test_invalid_actual_end_time_format_fails_validation(): void
    {
        $invalidData = [
            'actual_end_time' => 'invalid_date_format',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('actual_end_time', $validator->errors()->toArray());
    }

    public function test_long_customer_name_fails_validation(): void
    {
        $invalidData = [
            'customer_name' => str_repeat('A', 256),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('customer_name', $validator->errors()->toArray());
    }

    public function test_long_customer_phone_fails_validation(): void
    {
        $invalidData = [
            'customer_phone' => str_repeat('1', 21),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('customer_phone', $validator->errors()->toArray());
    }

    public function test_zero_quantity_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 0,
                    'status' => 'pending',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.quantity', $validator->errors()->toArray());
    }

    public function test_negative_quantity_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => -1,
                    'status' => 'pending',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.quantity', $validator->errors()->toArray());
    }

    public function test_missing_required_item_fields_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    // Missing required fields
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.product_name', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.sku', $validator->errors()->toArray());
        $this->assertArrayHasKey('items.0.quantity', $validator->errors()->toArray());
    }

    public function test_long_product_name_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'product_name' => str_repeat('A', 256),
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'status' => 'pending',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.product_name', $validator->errors()->toArray());
    }

    public function test_long_sku_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => str_repeat('A', 101),
                    'quantity' => 1,
                    'status' => 'pending',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.sku', $validator->errors()->toArray());
    }

    public function test_invalid_item_status_fails_validation(): void
    {
        $invalidData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'status' => 'invalid_status',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items.0.status', $validator->errors()->toArray());
    }

    public function test_valid_status_values(): void
    {
        $validStatuses = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
        
        foreach ($validStatuses as $status) {
            $data = ['status' => $status];
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_valid_item_status_values(): void
    {
        $validStatuses = ['pending', 'completed'];
        
        foreach ($validStatuses as $status) {
            $data = [
                'items' => [
                    [
                        'product_name' => 'A500 智能電子鎖',
                        'sku' => 'LOCK-A500-BLK',
                        'quantity' => 1,
                        'status' => $status,
                    ],
                ],
            ];
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_today_as_scheduled_date_passes_validation(): void
    {
        $validData = [
            'scheduled_date' => now()->toDateString(),
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_future_scheduled_date_passes_validation(): void
    {
        $validData = [
            'scheduled_date' => now()->addDays(10)->toDateString(),
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_valid_datetime_format_passes_validation(): void
    {
        $validData = [
            'actual_start_time' => now()->format('Y-m-d H:i:s'),
            'actual_end_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_nullable_fields_allow_null_values(): void
    {
        $validData = [
            'installer_user_id' => null,
            'customer_phone' => null,
            'scheduled_date' => null,
            'actual_start_time' => null,
            'actual_end_time' => null,
            'notes' => null,
            'items' => [
                [
                    'id' => null,
                    'product_variant_id' => null,
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    'specifications' => null,
                    'status' => 'pending',
                    'notes' => null,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_optional_status_field_in_items(): void
    {
        $validData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 1,
                    // status field is optional (sometimes rule)
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_valid_integer_types_pass_validation(): void
    {
        $validData = [
            'items' => [
                [
                    'product_name' => 'A500 智能電子鎖',
                    'sku' => 'LOCK-A500-BLK',
                    'quantity' => 5,
                    'status' => 'pending',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_non_integer_fails_validation(): void
    {
        $invalidData = [
            'installer_user_id' => 'not_an_integer',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('installer_user_id', $validator->errors()->toArray());
    }

    public function test_sometimes_rule_allows_partial_updates(): void
    {
        $partialData = [
            'customer_name' => '更新的客戶名稱',
            'status' => 'scheduled',
        ];

        $validator = Validator::make($partialData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_array_validation_for_items(): void
    {
        $invalidData = [
            'items' => 'not_an_array',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('items', $validator->errors()->toArray());
    }

    public function test_empty_items_array_passes_validation(): void
    {
        $validData = [
            'items' => [],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_string_validation_for_text_fields(): void
    {
        $validData = [
            'customer_name' => 'Valid String Name',
            'customer_phone' => '0987654321',
            'installation_address' => 'Valid Installation Address',
            'notes' => 'Valid notes content',
            'items' => [
                [
                    'product_name' => 'Valid Product Name',
                    'sku' => 'VALID-SKU-123',
                    'quantity' => 1,
                    'specifications' => 'Valid specifications',
                    'status' => 'pending',
                    'notes' => 'Valid item notes',
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_non_string_text_fields_fail_validation(): void
    {
        $invalidData = [
            'customer_name' => 123,
            'customer_phone' => 123,
            'installation_address' => 123,
            'notes' => 123,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('customer_name', $validator->errors()->toArray());
        $this->assertArrayHasKey('customer_phone', $validator->errors()->toArray());
        $this->assertArrayHasKey('installation_address', $validator->errors()->toArray());
        $this->assertArrayHasKey('notes', $validator->errors()->toArray());
    }

    public function test_proper_date_format_validation(): void
    {
        $testCases = [
            'scheduled_date' => [
                'valid' => now()->toDateString(),
                'invalid' => 'invalid-date-format',
            ],
            'actual_start_time' => [
                'valid' => now()->format('Y-m-d H:i:s'),
                'invalid' => 'invalid-datetime-format',
            ],
            'actual_end_time' => [
                'valid' => now()->format('Y-m-d H:i:s'),
                'invalid' => 'invalid-datetime-format',
            ],
        ];

        foreach ($testCases as $field => $cases) {
            // Test valid case
            $validData = [$field => $cases['valid']];
            $validator = Validator::make($validData, $this->request->rules());
            $this->assertTrue($validator->passes(), "Field '{$field}' should pass with valid format");

            // Test invalid case
            $invalidData = [$field => $cases['invalid']];
            $validator = Validator::make($invalidData, $this->request->rules());
            $this->assertFalse($validator->passes(), "Field '{$field}' should fail with invalid format");
        }
    }
}