<?php

namespace Tests\Unit\Requests;

use App\Http\Requests\InventoryTransferRequest;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * InventoryTransferRequest 完整測試
 * 
 * 測試庫存轉移請求的所有驗證規則和方法
 */
class InventoryTransferRequestTest extends TestCase
{
    use RefreshDatabase;

    private InventoryTransferRequest $request;
    private ProductVariant $productVariant;
    private Store $fromStore;
    private Store $toStore;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->request = new InventoryTransferRequest();
        $this->productVariant = ProductVariant::factory()->create();
        $this->fromStore = Store::factory()->create();
        $this->toStore = Store::factory()->create();
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
        $rules = $this->request->rules();
        
        $this->assertArrayHasKey('from_store_id', $rules);
        $this->assertArrayHasKey('to_store_id', $rules);
        $this->assertArrayHasKey('product_variant_id', $rules);
        $this->assertArrayHasKey('quantity', $rules);
        $this->assertArrayHasKey('notes', $rules);
        $this->assertArrayHasKey('status', $rules);
        
        // 檢查基本驗證規則
        $this->assertContains('required', $rules['from_store_id']);
        $this->assertContains('integer', $rules['from_store_id']);
        $this->assertContains('exists:stores,id', $rules['from_store_id']);
        
        $this->assertContains('required', $rules['to_store_id']);
        $this->assertContains('integer', $rules['to_store_id']);
        $this->assertContains('exists:stores,id', $rules['to_store_id']);
        
        $this->assertContains('required', $rules['product_variant_id']);
        $this->assertContains('integer', $rules['product_variant_id']);
        $this->assertContains('exists:product_variants,id', $rules['product_variant_id']);
        
        $this->assertContains('required', $rules['quantity']);
        $this->assertContains('integer', $rules['quantity']);
        $this->assertContains('min:1', $rules['quantity']);
        
        $this->assertContains('nullable', $rules['notes']);
        $this->assertContains('string', $rules['notes']);
        $this->assertContains('max:1000', $rules['notes']);
        
        $this->assertContains('sometimes', $rules['status']);
        $this->assertContains('string', $rules['status']);
    }

    /**
     * 測試有效數據通過驗證
     */
    public function test_valid_data_passes_validation(): void
    {
        $validData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'notes' => '調配門市庫存',
            'status' => 'completed',
        ];

        $validator = Validator::make($validData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試必要欄位驗證
     */
    public function test_required_fields_validation(): void
    {
        $requiredFields = ['from_store_id', 'to_store_id', 'product_variant_id', 'quantity'];
        
        foreach ($requiredFields as $field) {
            $data = [
                'from_store_id' => $this->fromStore->id,
                'to_store_id' => $this->toStore->id,
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 10,
            ];
            
            unset($data[$field]);
            
            $validator = Validator::make($data, $this->request->rules());
            $this->assertTrue($validator->fails());
            $this->assertArrayHasKey($field, $validator->errors()->toArray());
        }
    }

    /**
     * 測試 from_store_id 驗證規則
     */
    public function test_from_store_id_validation(): void
    {
        $baseData = [
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        // 測試無效的門市ID
        $invalidData = array_merge($baseData, ['from_store_id' => 99999]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('from_store_id', $validator->errors()->toArray());

        // 測試非整數值
        $invalidData = array_merge($baseData, ['from_store_id' => 'invalid']);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());

        // 測試有效的門市ID
        $validData = array_merge($baseData, ['from_store_id' => $this->fromStore->id]);
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('from_store_id'));
    }

    /**
     * 測試 to_store_id 驗證規則
     */
    public function test_to_store_id_validation(): void
    {
        $baseData = [
            'from_store_id' => $this->fromStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        // 測試無效的門市ID
        $invalidData = array_merge($baseData, ['to_store_id' => 99999]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('to_store_id', $validator->errors()->toArray());

        // 測試非整數值
        $invalidData = array_merge($baseData, ['to_store_id' => 'invalid']);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());

        // 測試有效的門市ID
        $validData = array_merge($baseData, ['to_store_id' => $this->toStore->id]);
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('to_store_id'));
    }

    /**
     * 測試來源門市與目標門市不能相同的驗證
     */
    public function test_store_ids_must_be_different(): void
    {
        $baseData = [
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        // 測試相同的門市ID應該失敗
        $invalidData = array_merge($baseData, [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->fromStore->id,
        ]);
        
        // 創建 FormRequest 實例並設置數據以測試自定義驗證
        $request = new InventoryTransferRequest();
        $request->merge($invalidData);
        
        $validator = Validator::make($invalidData, $request->rules());
        $this->assertTrue($validator->fails());
        $this->assertTrue($validator->errors()->has('to_store_id'));

        // 測試不同的門市ID應該通過
        $validData = array_merge($baseData, [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
        ]);
        
        $request = new InventoryTransferRequest();
        $request->merge($validData);
        
        $validator = Validator::make($validData, $request->rules());
        $this->assertFalse($validator->errors()->has('to_store_id'));
    }

    /**
     * 測試 product_variant_id 驗證規則
     */
    public function test_product_variant_id_validation(): void
    {
        $baseData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'quantity' => 10,
        ];

        // 測試無效的商品變體ID
        $invalidData = array_merge($baseData, ['product_variant_id' => 99999]);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('product_variant_id', $validator->errors()->toArray());

        // 測試非整數值
        $invalidData = array_merge($baseData, ['product_variant_id' => 'invalid']);
        $validator = Validator::make($invalidData, $this->request->rules());
        $this->assertTrue($validator->fails());

        // 測試有效的商品變體ID
        $validData = array_merge($baseData, ['product_variant_id' => $this->productVariant->id]);
        $validator = Validator::make($validData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('product_variant_id'));
    }

    /**
     * 測試 quantity 欄位驗證規則
     */
    public function test_quantity_validation(): void
    {
        $baseData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
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
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
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
     * 測試 status 欄位驗證規則
     */
    public function test_status_validation(): void
    {
        $baseData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ];

        // 測試有效的狀態值
        $validStatuses = ['pending', 'in_transit', 'completed', 'cancelled'];
        foreach ($validStatuses as $status) {
            $validData = array_merge($baseData, ['status' => $status]);
            $validator = Validator::make($validData, $this->request->rules());
            $this->assertFalse($validator->errors()->has('status'), "Status '$status' should be valid");
        }

        // 測試無效的狀態值
        $invalidStatuses = ['invalid', 'processing', 'shipped', 123];
        foreach ($invalidStatuses as $status) {
            $invalidData = array_merge($baseData, ['status' => $status]);
            $validator = Validator::make($invalidData, $this->request->rules());
            $this->assertTrue($validator->fails(), "Status '$status' should be invalid");
            $this->assertArrayHasKey('status', $validator->errors()->toArray());
        }
        
        // 測試空字串 - status 是可選的，空字串應該通過驗證
        $emptyStatusData = array_merge($baseData, ['status' => '']);
        $validator = Validator::make($emptyStatusData, $this->request->rules());
        $this->assertTrue($validator->passes(), "Empty status should pass validation as it's optional");

        // 測試 status 為可選欄位
        $validator = Validator::make($baseData, $this->request->rules());
        $this->assertFalse($validator->errors()->has('status'));
    }

    /**
     * 測試自定義錯誤訊息
     */
    public function test_custom_error_messages(): void
    {
        $expectedMessages = [
            'from_store_id.required' => '請選擇來源門市',
            'from_store_id.integer' => 'from_store_id 欄位必須為整數',
            'from_store_id.exists' => '所選來源門市不存在',
            'to_store_id.required' => '請選擇目標門市',
            'to_store_id.integer' => 'to_store_id 欄位必須為整數',
            'to_store_id.exists' => '所選目標門市不存在',
            'to_store_id.not_in' => '目標門市不能與來源門市相同',
            'product_variant_id.required' => '請選擇商品變體',
            'product_variant_id.integer' => 'product_variant_id 欄位必須為整數',
            'product_variant_id.exists' => '所選商品變體不存在',
            'quantity.required' => '請輸入數量',
            'quantity.integer' => '數量必須為整數',
            'quantity.min' => '數量必須大於0',
            'status.string' => '狀態值無效',
            'status.in' => '狀態值無效',
        ];

        $this->assertEquals($expectedMessages, $this->request->messages());
    }

    /**
     * 測試 bodyParameters 方法
     */
    public function test_body_parameters_documentation(): void
    {
        $expectedParams = [
            'from_store_id' => [
                'description' => '來源門市ID',
                'example' => 1,
            ],
            'to_store_id' => [
                'description' => '目標門市ID（不能與來源門市相同）',
                'example' => 2,
            ],
            'product_variant_id' => [
                'description' => '商品變體ID',
                'example' => 1,
            ],
            'quantity' => [
                'description' => '轉移數量',
                'example' => 10,
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '調配門市庫存',
            ],
            'status' => [
                'description' => '轉移狀態（可選，預設為 completed）',
                'example' => 'completed',
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
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 50,
            'notes' => '調配門市庫存：商品銷售旺季補貨',
            'status' => 'pending',
        ];

        $validator = Validator::make($completeValidData, $this->request->rules());
        $this->assertTrue($validator->passes());
        
        // 測試最小有效請求
        $minimalValidData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5,
        ];

        $validator = Validator::make($minimalValidData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }

    /**
     * 測試邊界情況
     */
    public function test_edge_cases(): void
    {
        // 測試最小數量
        $edgeData = [
            'from_store_id' => $this->fromStore->id,
            'to_store_id' => $this->toStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 1, // 最小有效值
        ];

        $validator = Validator::make($edgeData, $this->request->rules());
        $this->assertTrue($validator->passes());

        // 測試最大長度的備註
        $maxNotesData = array_merge($edgeData, [
            'notes' => str_repeat('測', 333) . 'A', // 1000 個字符
        ]);

        $validator = Validator::make($maxNotesData, $this->request->rules());
        $this->assertTrue($validator->passes());
    }
}