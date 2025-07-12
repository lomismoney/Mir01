<?php

namespace Tests\Unit\Requests;

use App\Http\Requests\InventoryAdjustmentRequest;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * InventoryAdjustmentRequest 完整測試
 * 
 * 測試庫存調整請求的所有驗證規則和方法
 */
class InventoryAdjustmentRequestTest extends TestCase
{
    use RefreshDatabase;

    private InventoryAdjustmentRequest $request;
    private ProductVariant $productVariant;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->request = new InventoryAdjustmentRequest();
        $this->productVariant = ProductVariant::factory()->create();
        $this->store = Store::factory()->create();
    }

    /**
     * 測試 authorize 方法總是返回 true
     */
    public function test_authorize_returns_true(): void
    {
        $this->assertTrue($this->request->authorize());
    }

    /**
     * 測試驗證規則定義
     */
    public function test_validation_rules(): void
    {
        $expectedRules = [
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'store_id' => ['required', 'integer', 'exists:stores,id'],
            'action' => ['required', 'string', 'in:add,reduce,set'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'metadata' => ['nullable', 'array'],
        ];

        $this->assertEquals($expectedRules, $this->request->rules());
    }

    /**
     * 測試有效數據通過驗證
     */
    public function test_valid_data_passes_validation(): void
    {
        $validData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'add',
            'quantity' => 10,
            'notes' => '週末促銷活動增加庫存',
            'metadata' => ['reason' => 'restock'],
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試必要欄位驗證
     */
    public function test_required_fields_validation(): void
    {
        $requiredFields = ['product_variant_id', 'store_id', 'action', 'quantity'];
        
        foreach ($requiredFields as $field) {
            $data = [
                'product_variant_id' => $this->productVariant->id,
                'store_id' => $this->store->id,
                'action' => 'add',
                'quantity' => 10,
            ];
            
            unset($data[$field]);
            
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->fails());
            $this->assertArrayHasKey($field, $validator->errors()->toArray());
        }
    }

    /**
     * 測試 product_variant_id 驗證規則
     */
    public function test_product_variant_id_validation(): void
    {
        $baseData = [
            'store_id' => $this->store->id,
            'action' => 'add',
            'quantity' => 10,
        ];

        // 測試無效的產品變體ID
        $invalidData = array_merge($baseData, ['product_variant_id' => 99999]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('product_variant_id', $validator->errors()->toArray());

        // 測試非整數值
        $invalidData = array_merge($baseData, ['product_variant_id' => 'invalid']);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());

        // 測試有效的產品變體ID
        $validData = array_merge($baseData, ['product_variant_id' => $this->productVariant->id]);
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('product_variant_id'));
    }

    /**
     * 測試 store_id 驗證規則
     */
    public function test_store_id_validation(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'action' => 'add',
            'quantity' => 10,
        ];

        // 測試無效的門市ID
        $invalidData = array_merge($baseData, ['store_id' => 99999]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('store_id', $validator->errors()->toArray());

        // 測試非整數值
        $invalidData = array_merge($baseData, ['store_id' => 'invalid']);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());

        // 測試有效的門市ID
        $validData = array_merge($baseData, ['store_id' => $this->store->id]);
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('store_id'));
    }

    /**
     * 測試 action 欄位驗證規則
     */
    public function test_action_validation(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'quantity' => 10,
        ];

        // 測試有效的操作類型
        $validActions = ['add', 'reduce', 'set'];
        foreach ($validActions as $action) {
            $validData = array_merge($baseData, ['action' => $action]);
            $validator = Validator::make($validData, $this->request->rules());
            $this->assertFalse($validator->errors()->has('action'), "Action '$action' should be valid");
        }

        // 測試無效的操作類型
        $invalidActions = ['invalid', 'delete', 'update', ''];
        foreach ($invalidActions as $action) {
            $invalidData = array_merge($baseData, ['action' => $action]);
            $validator = Validator::make($invalidData, $this->request->rules());
            $this->assertTrue($validator->fails());
            $this->assertArrayHasKey('action', $validator->errors()->toArray());
        }
    }

    /**
     * 測試 quantity 欄位驗證規則
     */
    public function test_quantity_validation(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'add',
        ];

        // 測試有效的數量
        $validQuantities = [1, 10, 100, 1000];
        foreach ($validQuantities as $quantity) {
            $validData = array_merge($baseData, ['quantity' => $quantity]);
            $validator = Validator::make($validData, $this->request->rules());
            $this->assertFalse($validator->errors()->has('quantity'), "Quantity '$quantity' should be valid");
        }

        // 測試無效的數量
        $invalidQuantities = [0, -1, -10, 'invalid', null];
        foreach ($invalidQuantities as $quantity) {
            $invalidData = array_merge($baseData, ['quantity' => $quantity]);
            $validator = Validator::make($invalidData, $this->request->rules());
            $this->assertTrue($validator->fails());
            $this->assertArrayHasKey('quantity', $validator->errors()->toArray());
        }
    }

    /**
     * 測試 notes 欄位驗證規則
     */
    public function test_notes_validation(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'add',
            'quantity' => 10,
        ];

        // 測試有效的備註
        $validNotes = [
            null,
            '',
            '簡短備註',
            str_repeat('A', 1000), // 最大長度
        ];

        foreach ($validNotes as $notes) {
            $data = array_merge($baseData, ['notes' => $notes]);
            $validator = Validator::make($data, $this->request->rules());
            $this->assertFalse($validator->errors()->has('notes'), "Notes should be valid");
        }

        // 測試超長備註
        $tooLongNotes = str_repeat('A', 1001);
        $invalidData = array_merge($baseData, ['notes' => $tooLongNotes]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('notes', $validator->errors()->toArray());
    }

    /**
     * 測試 metadata 欄位驗證規則
     */
    public function test_metadata_validation(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'add',
            'quantity' => 10,
        ];

        // 測試有效的 metadata
        $validMetadata = [
            null,
            [],
            ['reason' => 'restock'],
            ['reason' => 'restock', 'category' => 'promotion'],
        ];

        foreach ($validMetadata as $metadata) {
            $data = array_merge($baseData, ['metadata' => $metadata]);
            $validator = Validator::make($data, $this->request->rules());
            $this->assertFalse($validator->errors()->has('metadata'), "Metadata should be valid");
        }

        // 測試無效的 metadata（非陣列）
        $invalidMetadata = ['invalid_string', 123, true];
        foreach ($invalidMetadata as $metadata) {
            $invalidData = array_merge($baseData, ['metadata' => $metadata]);
            $validator = Validator::make($invalidData, $this->request->rules());
            $this->assertTrue($validator->fails());
            $this->assertArrayHasKey('metadata', $validator->errors()->toArray());
        }
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages(): void
    {
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

        $this->assertEquals($expectedMessages, $this->request->messages());
    }

    /**
     * 測試 bodyParameters 方法
     */
    public function test_body_parameters_documentation(): void
    {
        $expectedParams = [
            'product_variant_id' => [
                'description' => '商品變體ID',
                'example' => 1,
            ],
            'store_id' => [
                'description' => '門市ID',
                'example' => 1,
            ],
            'action' => [
                'description' => '操作類型（add: 添加, reduce: 減少, set: 設定）',
                'example' => 'add',
            ],
            'quantity' => [
                'description' => '數量',
                'example' => 10,
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '週末促銷活動增加庫存',
            ],
            'metadata' => [
                'description' => '額外的元數據（可選）',
                'example' => ['reason' => 'restock'],
            ],
        ];

        $this->assertEquals($expectedParams, $this->request->bodyParameters());
    }

    /**
     * 測試完整的請求驗證流程
     */
    public function test_complete_request_validation_flow(): void
    {
        // 測試完全有效的請求
        $completeValidData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'set',
            'quantity' => 50,
            'notes' => '盤點調整庫存',
            'metadata' => [
                'reason' => 'inventory_count',
                'operator' => 'system',
                'timestamp' => now()->toISOString(),
            ],
        ];

        $validator = Validator::make($completeValidData, $this->request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試最小有效請求
        $minimalValidData = [
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'action' => 'reduce',
            'quantity' => 5,
        ];

        $validator = Validator::make($minimalValidData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}