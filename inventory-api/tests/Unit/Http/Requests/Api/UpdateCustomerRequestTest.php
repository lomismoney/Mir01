<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\UpdateCustomerRequest;
use App\Models\Customer;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

class UpdateCustomerRequestTest extends TestCase
{
    use RefreshDatabase;

    protected $request;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new UpdateCustomerRequest();
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
        $this->assertArrayHasKey('phone', $rules);
        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('is_company', $rules);
        $this->assertArrayHasKey('tax_id', $rules);
        $this->assertArrayHasKey('industry_type', $rules);
        $this->assertArrayHasKey('payment_type', $rules);
        $this->assertArrayHasKey('contact_address', $rules);
        $this->assertArrayHasKey('addresses', $rules);
        $this->assertArrayHasKey('addresses.*.id', $rules);
        $this->assertArrayHasKey('addresses.*.address', $rules);
        $this->assertArrayHasKey('addresses.*.is_default', $rules);
    }

    public function test_messages_method_returns_custom_messages(): void
    {
        $messages = $this->request->messages();
        
        $this->assertIsArray($messages);
        $this->assertArrayHasKey('name.required', $messages);
        $this->assertArrayHasKey('name.max', $messages);
        $this->assertArrayHasKey('phone.unique', $messages);
        $this->assertArrayHasKey('phone.max', $messages);
        $this->assertArrayHasKey('email.email', $messages);
        $this->assertArrayHasKey('email.unique', $messages);
        $this->assertArrayHasKey('email.max', $messages);
        $this->assertArrayHasKey('is_company.required', $messages);
        $this->assertArrayHasKey('is_company.boolean', $messages);
        $this->assertArrayHasKey('tax_id.unique', $messages);
        $this->assertArrayHasKey('tax_id.required_if', $messages);
        $this->assertArrayHasKey('tax_id.max', $messages);
        $this->assertArrayHasKey('industry_type.required', $messages);
        $this->assertArrayHasKey('industry_type.max', $messages);
        $this->assertArrayHasKey('payment_type.required', $messages);
        $this->assertArrayHasKey('payment_type.max', $messages);
        $this->assertArrayHasKey('contact_address.max', $messages);
        $this->assertArrayHasKey('addresses.array', $messages);
        $this->assertArrayHasKey('addresses.*.id.integer', $messages);
        $this->assertArrayHasKey('addresses.*.id.exists', $messages);
        $this->assertArrayHasKey('addresses.*.address.required', $messages);
        $this->assertArrayHasKey('addresses.*.address.max', $messages);
        $this->assertArrayHasKey('addresses.*.is_default.required', $messages);
        $this->assertArrayHasKey('addresses.*.is_default.boolean', $messages);
    }

    public function test_body_parameters_method_returns_documentation(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertIsArray($bodyParameters);
        $this->assertArrayHasKey('name', $bodyParameters);
        $this->assertArrayHasKey('phone', $bodyParameters);
        $this->assertArrayHasKey('email', $bodyParameters);
        $this->assertArrayHasKey('is_company', $bodyParameters);
        $this->assertArrayHasKey('tax_id', $bodyParameters);
        $this->assertArrayHasKey('industry_type', $bodyParameters);
        $this->assertArrayHasKey('payment_type', $bodyParameters);
        $this->assertArrayHasKey('contact_address', $bodyParameters);
        $this->assertArrayHasKey('addresses', $bodyParameters);
        $this->assertArrayHasKey('addresses.*.id', $bodyParameters);
        $this->assertArrayHasKey('addresses.*.address', $bodyParameters);
        $this->assertArrayHasKey('addresses.*.is_default', $bodyParameters);
    }

    public function test_valid_individual_customer_data_passes_validation(): void
    {
        $validData = [
            'name' => '更新的客戶名稱',
            'phone' => '0987654321',
            'email' => 'updated@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'contact_address' => '台北市信義區',
            'addresses' => [
                [
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市信義區市府路45號',
                    'is_default' => false,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_valid_company_customer_data_passes_validation(): void
    {
        $validData = [
            'name' => '更新的公司名稱',
            'phone' => '0987654321',
            'email' => 'company@example.com',
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => '科技業',
            'payment_type' => '月結30天',
            'contact_address' => '台北市信義區',
            'addresses' => [
                [
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_missing_required_name_fails_validation(): void
    {
        $invalidData = [
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_missing_required_is_company_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('is_company', $validator->errors()->toArray());
    }

    public function test_missing_required_industry_type_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('industry_type', $validator->errors()->toArray());
    }

    public function test_missing_required_payment_type_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('payment_type', $validator->errors()->toArray());
    }

    public function test_company_customer_missing_tax_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試公司',
            'phone' => '0987654321',
            'email' => 'company@example.com',
            'is_company' => true,
            'industry_type' => '科技業',
            'payment_type' => '月結30天',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('tax_id', $validator->errors()->toArray());
    }

    public function test_individual_customer_without_tax_id_passes_validation(): void
    {
        $validData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_invalid_email_format_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'invalid-email',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    public function test_non_boolean_is_company_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => 'not_boolean',
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('is_company', $validator->errors()->toArray());
    }

    public function test_long_name_fails_validation(): void
    {
        $invalidData = [
            'name' => str_repeat('A', 256),
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
    }

    public function test_long_phone_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => str_repeat('1', 51),
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('phone', $validator->errors()->toArray());
    }

    public function test_long_email_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => str_repeat('a', 250) . '@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    public function test_long_tax_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試公司',
            'phone' => '0987654321',
            'email' => 'company@example.com',
            'is_company' => true,
            'tax_id' => str_repeat('1', 51),
            'industry_type' => '科技業',
            'payment_type' => '月結30天',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('tax_id', $validator->errors()->toArray());
    }

    public function test_long_industry_type_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => str_repeat('A', 51),
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('industry_type', $validator->errors()->toArray());
    }

    public function test_long_payment_type_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => str_repeat('A', 51),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('payment_type', $validator->errors()->toArray());
    }

    public function test_long_contact_address_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'contact_address' => str_repeat('A', 256),
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('contact_address', $validator->errors()->toArray());
    }

    public function test_non_array_addresses_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => 'not_an_array',
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses', $validator->errors()->toArray());
    }

    public function test_missing_address_content_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'id' => 1,
                    'is_default' => true,
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses.0.address', $validator->errors()->toArray());
    }

    public function test_missing_address_is_default_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'id' => 1,
                    'address' => '台北市大安區復興南路一段100號',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses.0.is_default', $validator->errors()->toArray());
    }

    public function test_non_boolean_address_is_default_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'id' => 1,
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => 'not_boolean',
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses.0.is_default', $validator->errors()->toArray());
    }

    public function test_non_integer_address_id_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'id' => 'not_integer',
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses.0.id', $validator->errors()->toArray());
    }

    public function test_long_address_content_fails_validation(): void
    {
        $invalidData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'id' => 1,
                    'address' => str_repeat('A', 256),
                    'is_default' => true,
                ],
            ],
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('addresses.0.address', $validator->errors()->toArray());
    }

    public function test_nullable_fields_allow_null(): void
    {
        $validData = [
            'name' => '測試客戶',
            'phone' => null,
            'email' => null,
            'is_company' => false,
            'tax_id' => null,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'contact_address' => null,
            'addresses' => null,
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_empty_addresses_array_passes_validation(): void
    {
        $validData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_multiple_addresses_pass_validation(): void
    {
        $validData = [
            'name' => '測試客戶',
            'phone' => '0987654321',
            'email' => 'customer@example.com',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市信義區市府路45號',
                    'is_default' => false,
                ],
                [
                    'address' => '新北市板橋區文化路一段188號',
                    'is_default' => false,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_non_string_fields_fail_validation(): void
    {
        $invalidData = [
            'name' => 123,
            'phone' => 123,
            'email' => 123,
            'is_company' => false,
            'tax_id' => 123,
            'industry_type' => 123,
            'payment_type' => 123,
            'contact_address' => 123,
        ];

        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
        $this->assertArrayHasKey('phone', $validator->errors()->toArray());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
        $this->assertArrayHasKey('tax_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('industry_type', $validator->errors()->toArray());
        $this->assertArrayHasKey('payment_type', $validator->errors()->toArray());
        $this->assertArrayHasKey('contact_address', $validator->errors()->toArray());
    }

    public function test_minimal_valid_data(): void
    {
        $validData = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_valid_boolean_values(): void
    {
        $testCases = [
            ['is_company' => true, 'tax_id' => '12345678'],
            ['is_company' => false],
            ['is_company' => 1, 'tax_id' => '12345678'],
            ['is_company' => 0],
            ['is_company' => '1', 'tax_id' => '12345678'],
            ['is_company' => '0'],
        ];

        foreach ($testCases as $testCase) {
            $validData = array_merge([
                'name' => '測試客戶',
                'industry_type' => '設計師',
                'payment_type' => '現金付款',
            ], $testCase);

            $validator = Validator::make($validData, $this->request->rules());
            $this->assertTrue($validator->passes(), 'Boolean value should pass validation: ' . json_encode($testCase));
        }
    }

    public function test_valid_address_boolean_values(): void
    {
        $testCases = [true, false, 1, 0, '1', '0'];

        foreach ($testCases as $booleanValue) {
            $validData = [
                'name' => '測試客戶',
                'is_company' => false,
                'industry_type' => '設計師',
                'payment_type' => '現金付款',
                'addresses' => [
                    [
                        'address' => '台北市大安區復興南路一段100號',
                        'is_default' => $booleanValue,
                    ],
                ],
            ];

            $validator = Validator::make($validData, $this->request->rules());
            $this->assertTrue($validator->passes(), 'Boolean value should pass validation: ' . json_encode($booleanValue));
        }
    }

    public function test_sometimes_rule_for_address_id(): void
    {
        $validData = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    // No ID provided for new address
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_mixed_existing_and_new_addresses(): void
    {
        $validData = [
            'name' => '測試客戶',
            'is_company' => false,
            'industry_type' => '設計師',
            'payment_type' => '現金付款',
            'addresses' => [
                [
                    // New address without ID
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
                [
                    // New address without ID
                    'address' => '台北市信義區市府路45號',
                    'is_default' => false,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_comprehensive_valid_data(): void
    {
        $validData = [
            'name' => '更新的綜合測試客戶',
            'phone' => '0987654321',
            'email' => 'comprehensive@example.com',
            'is_company' => true,
            'tax_id' => '12345678',
            'industry_type' => '綜合服務業',
            'payment_type' => '月結60天',
            'contact_address' => '台北市信義區信義路五段7號',
            'addresses' => [
                [
                    'address' => '台北市大安區復興南路一段100號',
                    'is_default' => true,
                ],
                [
                    'address' => '台北市信義區市府路45號',
                    'is_default' => false,
                ],
                [
                    'address' => '新北市板橋區文化路一段188號',
                    'is_default' => false,
                ],
            ],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}