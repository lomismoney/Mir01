<?php

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\InventoryTransferRequest;
use App\Models\Store;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class InventoryTransferRequestTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryTransferRequest $request;
    protected Store $fromStore;
    protected Store $toStore;
    protected ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new InventoryTransferRequest();
        
        // 創建測試數據
        $this->fromStore = Store::factory()->create();
        $this->toStore = Store::factory()->create();
        $this->productVariant = ProductVariant::factory()->create();
    }

    public function test_authorize_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    public function test_rules_are_defined_correctly(): void
    {
        $rules = $this->request->rules();
        
        $this->assertArrayHasKey('from_store_id', $rules);
        $this->assertArrayHasKey('to_store_id', $rules);
        $this->assertArrayHasKey('product_variant_id', $rules);
        $this->assertArrayHasKey('quantity', $rules);
        $this->assertArrayHasKey('notes', $rules);
        $this->assertArrayHasKey('status', $rules);
    }

    public function test_valid_request_passes_validation(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'notes' => '調配門市庫存',
            'status' => 'completed'
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
        $this->assertTrue($errors->has('from_store_id'));
        $this->assertTrue($errors->has('to_store_id'));
        $this->assertTrue($errors->has('product_variant_id'));
        $this->assertTrue($errors->has('quantity'));
    }

    public function test_validation_fails_when_from_store_does_not_exist(): void
    {
        $data = [
            'from_store_id' => 99999,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('from_store_id'));
    }

    public function test_validation_fails_when_to_store_does_not_exist(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => 99999,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('to_store_id'));
    }

    public function test_validation_fails_when_from_and_to_store_are_same(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->fromStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        // 需要設定請求實例的數據來讓自訂規則能夠存取
        $request = new InventoryTransferRequest();
        $request->replace($data);
        
        $validator = Validator::make($data, $request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('to_store_id'));
    }

    public function test_validation_fails_when_product_variant_does_not_exist(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => 99999,
            'quantity' => 10,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('product_variant_id'));
    }

    public function test_validation_fails_when_quantity_is_not_integer(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 'invalid',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('quantity'));
    }

    public function test_validation_fails_when_quantity_is_zero_or_negative(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 0,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('quantity'));

        $data['quantity'] = -1;
        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('quantity'));
    }

    public function test_validation_passes_with_null_notes(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'notes' => null,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_notes_exceeds_max_length(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'notes' => str_repeat('a', 1001),
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    public function test_validation_passes_with_valid_status(): void
    {
        $validStatuses = ['pending', 'in_transit', 'completed', 'cancelled'];

        foreach ($validStatuses as $status) {
            $data = [
                'from_store_id' => $this->fromStore->id,
                'to_store_id' => $this->toStore->id,
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 10,
                'status' => $status,
            ];

            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->passes(), "Status '{$status}' should be valid");
        }
    }

    public function test_validation_fails_with_invalid_status(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'status' => 'invalid_status',
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('status'));
    }

    public function test_custom_messages_are_correct(): void
    {
        $messages = $this->request->messages();
        
        $this->assertArrayHasKey('from_store_id.required', $messages);
        $this->assertArrayHasKey('to_store_id.required', $messages);
        $this->assertArrayHasKey('product_variant_id.required', $messages);
        $this->assertArrayHasKey('quantity.required', $messages);
        
        $this->assertEquals('請選擇來源門市', $messages['from_store_id.required']);
        $this->assertEquals('請選擇目標門市', $messages['to_store_id.required']);
        $this->assertEquals('請選擇商品變體', $messages['product_variant_id.required']);
        $this->assertEquals('請輸入數量', $messages['quantity.required']);
    }

    public function test_validation_error_uses_custom_messages(): void
    {
        $this->request->setValidator(Validator::make([], $this->request->rules(), $this->request->messages()));
        
        $data = [];
        $validator = Validator::make($data, $this->request->rules(), $this->request->messages());
        $this->assertFalse($validator->passes());
        
        $errors = $validator->errors();
        $this->assertEquals('請選擇來源門市', $errors->first('from_store_id'));
        $this->assertEquals('請選擇目標門市', $errors->first('to_store_id'));
        $this->assertEquals('請選擇商品變體', $errors->first('product_variant_id'));
        $this->assertEquals('請輸入數量', $errors->first('quantity'));
    }

    public function test_body_parameters_returns_correct_structure(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertArrayHasKey('from_store_id', $bodyParameters);
        $this->assertArrayHasKey('to_store_id', $bodyParameters);
        $this->assertArrayHasKey('product_variant_id', $bodyParameters);
        $this->assertArrayHasKey('quantity', $bodyParameters);
        $this->assertArrayHasKey('notes', $bodyParameters);
        $this->assertArrayHasKey('status', $bodyParameters);
        
        // 檢查結構
        $this->assertArrayHasKey('description', $bodyParameters['from_store_id']);
        $this->assertArrayHasKey('example', $bodyParameters['from_store_id']);
    }

    public function test_body_parameters_have_correct_examples(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertEquals(1, $bodyParameters['from_store_id']['example']);
        $this->assertEquals(2, $bodyParameters['to_store_id']['example']);
        $this->assertEquals(1, $bodyParameters['product_variant_id']['example']);
        $this->assertEquals(10, $bodyParameters['quantity']['example']);
        $this->assertEquals('調配門市庫存', $bodyParameters['notes']['example']);
        $this->assertEquals('completed', $bodyParameters['status']['example']);
    }

    public function test_body_parameters_have_correct_descriptions(): void
    {
        $bodyParameters = $this->request->bodyParameters();
        
        $this->assertEquals('來源門市ID', $bodyParameters['from_store_id']['description']);
        $this->assertEquals('目標門市ID（不能與來源門市相同）', $bodyParameters['to_store_id']['description']);
        $this->assertEquals('商品變體ID', $bodyParameters['product_variant_id']['description']);
        $this->assertEquals('轉移數量', $bodyParameters['quantity']['description']);
        $this->assertEquals('備註（可選）', $bodyParameters['notes']['description']);
        $this->assertEquals('轉移狀態（可選，預設為 completed）', $bodyParameters['status']['description']);
    }

    public function test_validation_with_multiple_items(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5,
            'notes' => '測試轉移',
            'status' => 'pending'
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
        $this->assertEquals('App\Http\Requests', $reflection->getNamespaceName());
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

    public function test_validation_with_large_quantity(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 999999,
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    public function test_validation_with_edge_case_notes_length(): void
    {
        $data = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'notes' => str_repeat('a', 1000), // 剛好1000字符
        ];

        $validator = Validator::make($data, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}