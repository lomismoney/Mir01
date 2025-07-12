<?php

namespace Tests\Unit\Http\Requests\Api;

use App\Http\Requests\Api\BatchUpdateStatusRequest;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class BatchUpdateStatusRequestTest extends TestCase
{
    use RefreshDatabase;

    protected BatchUpdateStatusRequest $request;
    protected Order $order1;
    protected Order $order2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new BatchUpdateStatusRequest();
        
        // 創建測試訂單
        $this->order1 = Order::factory()->create();
        $this->order2 = Order::factory()->create();
    }

    public function test_authorize_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_are_defined_correctly(): void
    {
        $rules = $this->request->rules();
        
        $this->assertArrayHasKey('ids', $rules);
        $this->assertArrayHasKey('ids.*', $rules);
        $this->assertArrayHasKey('status_type', $rules);
        $this->assertArrayHasKey('status_value', $rules);
        $this->assertArrayHasKey('notes', $rules);
    }

    public function test_valid_request_passes_validation(): void
    {
        $data = [
            'ids' => [$this->order1->id, $this->order2->id],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
            'notes' => '批量標記為已付款',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_required_fields_are_missing(): void
    {
        $data = [];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors();
        $this->assertTrue($errors->has('ids'));
        $this->assertTrue($errors->has('status_type'));
        $this->assertTrue($errors->has('status_value'));
    }

    public function test_validation_fails_when_ids_is_not_array(): void
    {
        $data = [
            'ids' => 'not_an_array',
            'status_type' => 'payment_status',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('ids'));
    }

    public function test_validation_fails_when_ids_is_empty_array(): void
    {
        $data = [
            'ids' => [],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('ids'));
    }

    public function test_validation_fails_when_ids_contains_non_integer(): void
    {
        $data = [
            'ids' => [$this->order1->id, 'not_integer'],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('ids.1'));
    }

    public function test_validation_fails_when_ids_contains_non_existent_order(): void
    {
        $data = [
            'ids' => [$this->order1->id, 99999],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('ids.1'));
    }

    public function test_validation_fails_when_status_type_is_invalid(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'invalid_status_type',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('status_type'));
    }

    public function test_validation_passes_with_valid_status_types(): void
    {
        $validStatusTypes = ['payment_status', 'shipping_status'];

        foreach ($validStatusTypes as $statusType) {
            $data = [
                'ids' => [$this->order1->id],
                'status_type' => $statusType,
                'status_value' => 'test_value',
            ];

            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status type '{$statusType}' should be valid");
        }
    }

    public function test_validation_fails_when_status_value_exceeds_max_length(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => str_repeat('a', 51),
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('status_value'));
    }

    public function test_validation_passes_with_null_notes(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
            'notes' => null,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_notes_exceeds_max_length(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
            'notes' => str_repeat('a', 501),
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    public function test_custom_messages_are_correct(): void
    {
        $messages = $this->request->messages();
        
        $this->assertArrayHasKey('ids.required', $messages);
        $this->assertArrayHasKey('ids.array', $messages);
        $this->assertArrayHasKey('ids.min', $messages);
        $this->assertArrayHasKey('status_type.required', $messages);
        $this->assertArrayHasKey('status_value.required', $messages);
        
        $this->assertEquals('請選擇要更新狀態的訂單', $messages['ids.required']);
        $this->assertEquals('訂單 ID 格式不正確', $messages['ids.array']);
        $this->assertEquals('至少需要選擇一個訂單進行狀態更新', $messages['ids.min']);
        $this->assertEquals('請指定要更新的狀態類型', $messages['status_type.required']);
        $this->assertEquals('請提供狀態值', $messages['status_value.required']);
    }

    public function test_validation_error_uses_custom_messages(): void
    {
        $data = [];
        $validator = Validator::make($data, $this->request->rules(), $this->request->messages());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors();
        $this->assertEquals('請選擇要更新狀態的訂單', $errors->first('ids'));
        $this->assertEquals('請指定要更新的狀態類型', $errors->first('status_type'));
        $this->assertEquals('請提供狀態值', $errors->first('status_value'));
    }

    public function test_body_parameters_returns_correct_structure(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertArrayHasKey('ids', $bodyParameters);
        $this->assertArrayHasKey('ids.*', $bodyParameters);
        $this->assertArrayHasKey('status_type', $bodyParameters);
        $this->assertArrayHasKey('status_value', $bodyParameters);
        $this->assertArrayHasKey('notes', $bodyParameters);
        
        // 檢查結構
        $this->assertArrayHasKey('description', $bodyParameters['ids']);
        $this->assertArrayHasKey('example', $bodyParameters['ids']);
    }

    public function test_body_parameters_have_correct_examples(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertEquals([1, 2, 3], $bodyParameters['ids']['example']);
        $this->assertEquals(1, $bodyParameters['ids.*']['example']);
        $this->assertEquals('payment_status', $bodyParameters['status_type']['example']);
        $this->assertEquals('paid', $bodyParameters['status_value']['example']);
        $this->assertEquals('批量標記為已付款', $bodyParameters['notes']['example']);
    }

    public function test_body_parameters_have_correct_descriptions(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertEquals('要更新狀態的訂單 ID 陣列', $bodyParameters['ids']['description']);
        $this->assertEquals('訂單 ID，必須是有效的整數且存在於系統中', $bodyParameters['ids.*']['description']);
        $this->assertEquals('要更新的狀態類型（payment_status 或 shipping_status）', $bodyParameters['status_type']['description']);
        $this->assertEquals('要更新的狀態值', $bodyParameters['status_value']['description']);
        $this->assertEquals('備註（可選）', $bodyParameters['notes']['description']);
    }

    public function test_validation_with_multiple_orders(): void
    {
        $order3 = Order::factory()->create();
        
        $data = [
            'ids' => [$this->order1->id, $this->order2->id, $order3->id],
            'status_type' => 'shipping_status',
            'status_value' => 'shipped',
            'notes' => '批量標記為已出貨'
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_request_inheritance(): void
    {
        $this->assertInstanceOf(\Illuminate\Foundation\Http\FormRequest::class, $this->request);
    }

    public function test_request_namespace(): void
    {
        $reflection = new \ReflectionClass($this->request);
        $this->assertEquals('App\Http\Requests\Api', $reflection->getNamespaceName());
    }

    public function test_request_methods_exist(): void
    {
        $this->assertTrue(method_exists($this->request, 'authorize'));
        $this->assertTrue(method_exists($this->request, 'rules'));
        $this->assertTrue(method_exists($this->request, 'messages'));
        $this->assertTrue(method_exists($this->request, 'bodyParameters'));
    }

    public function test_request_methods_return_correct_types(): void
    {
        $this->assertIsBool($this->request->authorize());
        $this->assertIsArray($this->request->rules());
        $this->assertIsArray($this->request->messages());
        $this->assertIsArray($this->request->bodyParameters());
    }

    public function test_validation_with_edge_cases(): void
    {
        // 測試單一訂單
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => 'x', // 最短狀態值
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 測試最大長度的狀態值
        $data['status_value'] = str_repeat('a', 50);
        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 測試最大長度的備註
        $data['notes'] = str_repeat('a', 500);
        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_status_type_is_not_string(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 123,
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('status_type'));
    }

    public function test_validation_fails_when_status_value_is_not_string(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => 123,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('status_value'));
    }

    public function test_validation_passes_without_notes(): void
    {
        $data = [
            'ids' => [$this->order1->id],
            'status_type' => 'payment_status',
            'status_value' => 'paid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}