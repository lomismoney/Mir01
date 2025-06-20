<?php

namespace Tests\Unit;

use App\Http\Requests\InventoryAdjustmentRequest;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class InventoryAdjustmentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorize_returns_true()
    {
        $request = new InventoryAdjustmentRequest();
        
        $this->assertTrue($request->authorize());
    }

    public function test_validation_rules_are_correct()
    {
        $request = new InventoryAdjustmentRequest();
        $rules = $request->rules();

        $expectedRules = [
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'action' => ['required', 'string', 'in:add,reduce,set'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'metadata' => ['nullable', 'array'],
        ];

        $this->assertEquals($expectedRules, $rules);
    }

    public function test_validation_passes_with_valid_data()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10,
            'notes' => 'Test adjustment',
            'metadata' => ['reason' => 'restock']
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_passes_with_minimal_required_data()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'set',
            'quantity' => 5
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_product_variant_id_is_missing()
    {
        $store = Store::factory()->create();

        $data = [
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('product_variant_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_product_variant_does_not_exist()
    {
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => 99999, // 不存在的變體 ID
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('product_variant_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_store_id_is_missing()
    {
        $productVariant = ProductVariant::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'action' => 'add',
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_store_does_not_exist()
    {
        $productVariant = ProductVariant::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => 99999, // 不存在的門市 ID
            'action' => 'add',
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('store_id', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_action_is_missing()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('action', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_action_is_invalid()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'invalid_action', // 無效的動作
            'quantity' => 10
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('action', $validator->errors()->toArray());
    }

    public function test_validation_passes_with_all_valid_actions()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $validActions = ['add', 'reduce', 'set'];

        foreach ($validActions as $action) {
            $data = [
                'product_variant_id' => $productVariant->id,
                'store_id' => $store->id,
                'action' => $action,
                'quantity' => 10
            ];

            $request = new InventoryAdjustmentRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->passes(), "Action '{$action}' should be valid");
        }
    }

    public function test_validation_fails_when_quantity_is_missing()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add'
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('quantity', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_quantity_is_not_integer()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 'not-integer'
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('quantity', $validator->errors()->toArray());
    }

    public function test_validation_fails_when_quantity_is_zero_or_negative()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $invalidQuantities = [0, -1, -10];

        foreach ($invalidQuantities as $quantity) {
            $data = [
                'product_variant_id' => $productVariant->id,
                'store_id' => $store->id,
                'action' => 'add',
                'quantity' => $quantity
            ];

            $request = new InventoryAdjustmentRequest();
            $validator = Validator::make($data, $request->rules());

            $this->assertFalse($validator->passes(), "Quantity '{$quantity}' should be invalid");
            $this->assertArrayHasKey('quantity', $validator->errors()->toArray());
        }
    }

    public function test_validation_passes_with_null_notes()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10,
            'notes' => null
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_notes_exceeds_max_length()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10,
            'notes' => str_repeat('a', 1001) // 超過 1000 字元
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('notes', $validator->errors()->toArray());
    }

    public function test_validation_passes_with_null_metadata()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10,
            'metadata' => null
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_validation_fails_when_metadata_is_not_array()
    {
        $productVariant = ProductVariant::factory()->create();
        $store = Store::factory()->create();

        $data = [
            'product_variant_id' => $productVariant->id,
            'store_id' => $store->id,
            'action' => 'add',
            'quantity' => 10,
            'metadata' => 'not-an-array'
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('metadata', $validator->errors()->toArray());
    }

    public function test_custom_messages_are_correct()
    {
        $request = new InventoryAdjustmentRequest();
        $messages = $request->messages();

        $expectedMessages = [
            'product_variant_id.required' => '請選擇商品變體',
            'product_variant_id.exists' => '所選商品變體不存在',
            'store_id.required' => '請選擇門市',
            'store_id.exists' => '所選門市不存在',
            'action.required' => '請選擇操作類型',
            'action.in' => '操作類型必須是添加、減少或設定',
            'quantity.required' => '請輸入數量',
            'quantity.integer' => '數量必須為整數',
            'quantity.min' => '數量必須大於0',
        ];

        $this->assertEquals($expectedMessages, $messages);
    }

    public function test_validation_error_uses_custom_messages()
    {
        $data = [
            'action' => 'invalid',
            'quantity' => -1
        ];

        $request = new InventoryAdjustmentRequest();
        $validator = Validator::make($data, $request->rules(), $request->messages());

        $this->assertFalse($validator->passes());
        $errors = $validator->errors();
        
        $this->assertContains('請選擇商品變體', $errors->get('product_variant_id'));
        $this->assertContains('請選擇門市', $errors->get('store_id'));
        $this->assertContains('操作類型必須是添加、減少或設定', $errors->get('action'));
        $this->assertContains('數量必須大於0', $errors->get('quantity'));
    }

    public function test_body_parameters_returns_correct_structure()
    {
        $request = new InventoryAdjustmentRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertIsArray($bodyParams);
        
        $expectedKeys = [
            'product_variant_id',
            'store_id',
            'action',
            'quantity',
            'notes',
            'metadata'
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $bodyParams);
            $this->assertArrayHasKey('description', $bodyParams[$key]);
            $this->assertArrayHasKey('example', $bodyParams[$key]);
        }
    }

    public function test_body_parameters_have_correct_examples()
    {
        $request = new InventoryAdjustmentRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertEquals(1, $bodyParams['product_variant_id']['example']);
        $this->assertEquals(1, $bodyParams['store_id']['example']);
        $this->assertEquals('add', $bodyParams['action']['example']);
        $this->assertEquals(10, $bodyParams['quantity']['example']);
        $this->assertEquals('週末促銷活動增加庫存', $bodyParams['notes']['example']);
        $this->assertEquals(['reason' => 'restock'], $bodyParams['metadata']['example']);
    }

    public function test_body_parameters_have_correct_descriptions()
    {
        $request = new InventoryAdjustmentRequest();
        $bodyParams = $request->bodyParameters();

        $this->assertEquals('商品變體ID', $bodyParams['product_variant_id']['description']);
        $this->assertEquals('門市ID', $bodyParams['store_id']['description']);
        $this->assertStringContainsString('操作類型', $bodyParams['action']['description']);
        $this->assertEquals('數量', $bodyParams['quantity']['description']);
        $this->assertStringContainsString('備註', $bodyParams['notes']['description']);
        $this->assertStringContainsString('額外的元數據', $bodyParams['metadata']['description']);
    }
} 