<?php

namespace Tests\Unit\Services;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;
use App\Services\InventoryService;
use App\Services\StockTransferService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Mockery;

/**
 * InventoryService 完整測試
 * 
 * 測試庫存服務的所有業務邏輯
 */
class InventoryServiceCompleteTest extends TestCase
{
    use RefreshDatabase;

    private InventoryService $inventoryService;
    private $mockStockTransferService;
    private User $user;
    private Store $store;
    private ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockStockTransferService = Mockery::mock(StockTransferService::class);
        $this->inventoryService = new InventoryService();
        $this->user = User::factory()->create();
        $this->store = Store::factory()->create();
        
        $product = Product::factory()->create();
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001'
        ]);
        
        Auth::login($this->user);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * 測試扣減庫存
     */
    public function test_deduct_stock(): void
    {
        // 先創建庫存記錄
        $inventory = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
            'low_stock_threshold' => 5
        ]);

        $result = $this->inventoryService->deductStock(
            $this->productVariant->id,
            20,
            $this->store->id,
            '測試扣減',
            ['order_id' => 123]
        );

        $this->assertTrue($result);
        
        $inventory->refresh();
        $this->assertEquals(80, $inventory->quantity);
    }

    /**
     * 測試庫存不足時扣減失敗
     */
    public function test_deduct_stock_insufficient_inventory(): void
    {
        // 創建庫存不足的記錄
        Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5,
            'low_stock_threshold' => 5
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('庫存不足');

        $this->inventoryService->deductStock(
            $this->productVariant->id,
            10,
            $this->store->id
        );
    }

    /**
     * 測試自動創建庫存記錄
     */
    public function test_deduct_stock_creates_inventory_record(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('庫存不足');

        // 嘗試扣減不存在的庫存，應該會創建記錄但扣減失敗
        $this->inventoryService->deductStock(
            $this->productVariant->id,
            10,
            $this->store->id
        );

        // 檢查是否創建了庫存記錄
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
            
        $this->assertNotNull($inventory);
        $this->assertEquals(0, $inventory->quantity);
        $this->assertEquals(5, $inventory->low_stock_threshold);
    }

    /**
     * 測試返還庫存
     */
    public function test_return_stock(): void
    {
        // 先創建庫存記錄
        $inventory = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 50
        ]);

        $result = $this->inventoryService->returnStock(
            $this->productVariant->id,
            30,
            $this->store->id,
            '測試返還',
            ['refund_id' => 456]
        );

        $this->assertTrue($result);
        
        $inventory->refresh();
        $this->assertEquals(80, $inventory->quantity);
    }

    /**
     * 測試返還庫存到不存在的記錄
     */
    public function test_return_stock_creates_inventory_record(): void
    {
        $result = $this->inventoryService->returnStock(
            $this->productVariant->id,
            25,
            $this->store->id
        );

        $this->assertTrue($result);

        // 檢查是否創建了庫存記錄
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
            
        $this->assertNotNull($inventory);
        $this->assertEquals(25, $inventory->quantity);
    }

    /**
     * 測試批量扣減庫存
     */
    public function test_batch_deduct_stock(): void
    {
        // 創建庫存記錄
        Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100
        ]);

        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 15,
                'product_name' => '測試商品',
                'is_stocked_sale' => true
            ]
        ];

        $result = $this->inventoryService->batchDeductStock(
            $items,
            $this->store->id,
            ['batch_order_id' => 789]
        );

        $this->assertTrue($result);

        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
            
        $this->assertEquals(85, $inventory->quantity);
    }

    /**
     * 測試批量扣減庫存跳過非庫存商品
     */
    public function test_batch_deduct_stock_skips_non_stocked_items(): void
    {
        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 10,
                'product_name' => '定制商品',
                'is_stocked_sale' => false // 非庫存商品
            ]
        ];

        $result = $this->inventoryService->batchDeductStock($items, $this->store->id);

        $this->assertTrue($result);

        // 不應該創建庫存記錄
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
            
        $this->assertNull($inventory);
    }

    /**
     * 測試批量返還庫存
     */
    public function test_batch_return_stock(): void
    {
        // 創建庫存記錄
        $inventory = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 50
        ]);

        // 創建模擬訂單項目
        $items = collect([
            (object)[
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 20,
                'product_name' => '測試商品',
                'is_stocked_sale' => true
            ]
        ]);

        $result = $this->inventoryService->batchReturnStock(
            $items,
            $this->store->id,
            ['cancelled_order_id' => 999]
        );

        $this->assertTrue($result);

        $inventory->refresh();
        $this->assertEquals(70, $inventory->quantity);
    }

    /**
     * 測試檢查庫存
     */
    public function test_check_stock(): void
    {
        // 創建庫存記錄
        Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 30
        ]);

        // 庫存充足
        $result = $this->inventoryService->checkStock(
            $this->productVariant->id,
            25,
            $this->store->id
        );
        $this->assertTrue($result);

        // 庫存不足
        $result = $this->inventoryService->checkStock(
            $this->productVariant->id,
            35,
            $this->store->id
        );
        $this->assertFalse($result);

        // 不存在的庫存
        $otherVariant = ProductVariant::factory()->create();
        $result = $this->inventoryService->checkStock(
            $otherVariant->id,
            10,
            $this->store->id
        );
        $this->assertFalse($result);
    }

    /**
     * 測試批量檢查庫存
     */
    public function test_batch_check_stock(): void
    {
        // 創建庫存記錄
        Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 20
        ]);

        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 25, // 超過庫存
                'product_name' => '測試商品',
                'is_stocked_sale' => true
            ],
            [
                'product_variant_id' => 999, // 不存在的商品
                'quantity' => 10,
                'product_name' => '不存在商品',
                'is_stocked_sale' => true
            ]
        ];

        $results = $this->inventoryService->batchCheckStock($items, $this->store->id);

        $this->assertCount(2, $results);
        
        // 第一個商品庫存不足
        $this->assertEquals($this->productVariant->id, $results[0]['product_variant_id']);
        $this->assertEquals(25, $results[0]['requested_quantity']);
        $this->assertEquals(20, $results[0]['available_quantity']);
        $this->assertFalse($results[0]['is_available']);
        
        // 第二個商品不存在
        $this->assertEquals(999, $results[1]['product_variant_id']);
        $this->assertEquals(10, $results[1]['requested_quantity']);
        $this->assertEquals(0, $results[1]['available_quantity']);
        $this->assertFalse($results[1]['is_available']);
    }

    /**
     * 測試獲取預設門市ID
     */
    public function test_get_default_store_id(): void
    {
        // 使用反射來測試 protected 方法
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('getDefaultStoreId');
        $method->setAccessible(true);

        $defaultStoreId = $method->invoke($this->inventoryService);
        
        // 應該返回ID最小的門市
        $firstStore = Store::orderBy('id')->first();
        $this->assertEquals($firstStore->id, $defaultStoreId);
    }

    /**
     * 測試沒有門市時拋出異常
     */
    public function test_get_default_store_id_throws_exception_when_no_stores(): void
    {
        // 刪除所有門市
        Store::truncate();

        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('getDefaultStoreId');
        $method->setAccessible(true);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('系統中沒有任何門市');

        $method->invoke($this->inventoryService);
    }

    /**
     * 測試確保有效門市ID
     */
    public function test_ensure_valid_store_id(): void
    {
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('ensureValidStoreId');
        $method->setAccessible(true);

        // 提供有效門市ID
        $result = $method->invoke($this->inventoryService, $this->store->id);
        $this->assertEquals($this->store->id, $result);

        // 不提供門市ID，應該返回預設門市
        $result = $method->invoke($this->inventoryService, null);
        $this->assertIsInt($result);

        // 提供無效門市ID
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('門市ID 99999 不存在');

        $method->invoke($this->inventoryService, 99999);
    }

    /**
     * 測試使用預設門市進行庫存操作
     */
    public function test_operations_with_default_store(): void
    {
        // 不指定門市ID，應該使用預設門市
        $inventory = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 50
        ]);

        // 扣減庫存（不指定門市）
        $result = $this->inventoryService->deductStock(
            $this->productVariant->id,
            10
        );

        $this->assertTrue($result);
        
        $inventory->refresh();
        $this->assertEquals(40, $inventory->quantity);
    }

    /**
     * 測試未認證用戶無法進行庫存操作
     */
    public function test_operations_require_authentication(): void
    {
        // 先給庫存，避免庫存不足錯誤
        Inventory::updateOrCreate([
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
        ], [
            'quantity' => 20,
        ]);

        Auth::logout();

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行庫存操作');

        $this->inventoryService->deductStock(
            $this->productVariant->id,
            10,
            $this->store->id
        );
    }

    /**
     * 測試庫存時序數據
     */
    public function test_get_inventory_time_series(): void
    {
        // 創建庫存記錄
        $inventory = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100
        ]);

        // 創建一些庫存交易記錄
        DB::table('inventory_transactions')->insert([
            [
                'inventory_id' => $inventory->id,
                'quantity' => 50,
                'before_quantity' => 0,
                'after_quantity' => 50,
                'type' => 'purchase',
                'user_id' => $this->user->id,
                'notes' => '進貨',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00'
            ],
            [
                'inventory_id' => $inventory->id,
                'quantity' => -20,
                'before_quantity' => 50,
                'after_quantity' => 30,
                'type' => 'sale',
                'user_id' => $this->user->id,
                'notes' => '銷售',
                'created_at' => '2025-01-02 15:00:00',
                'updated_at' => '2025-01-02 15:00:00'
            ]
        ]);

        $timeSeries = $this->inventoryService->getInventoryTimeSeries(
            $this->productVariant->id,
            '2025-01-01',
            '2025-01-03',
            $this->store->id
        );

        $this->assertCount(3, $timeSeries);
        
        // 檢查數據結構
        $this->assertEquals('2025-01-01', $timeSeries[0]['date']);
        $this->assertEquals(50, $timeSeries[0]['quantity']);
        
        $this->assertEquals('2025-01-02', $timeSeries[1]['date']);
        $this->assertEquals(30, $timeSeries[1]['quantity']); // 50 - 20
        
        $this->assertEquals('2025-01-03', $timeSeries[2]['date']);
        $this->assertEquals(30, $timeSeries[2]['quantity']); // 沒有變動
    }

    /**
     * 測試跨門市庫存時序數據
     */
    public function test_get_inventory_time_series_all_stores(): void
    {
        // 創建另一個門市和庫存
        $store2 = Store::factory()->create();
        
        $inventory1 = Inventory::create([
            'store_id' => $this->store->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 50
        ]);
        
        $inventory2 = Inventory::create([
            'store_id' => $store2->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 30
        ]);

        // 創建交易記錄
        DB::table('inventory_transactions')->insert([
            [
                'inventory_id' => $inventory1->id,
                'quantity' => 10,
                'before_quantity' => 40,
                'after_quantity' => 50,
                'type' => 'adjustment',
                'user_id' => $this->user->id,
                'notes' => '調整門市1',
                'created_at' => '2025-01-01 10:00:00',
                'updated_at' => '2025-01-01 10:00:00'
            ],
            [
                'inventory_id' => $inventory2->id,
                'quantity' => 20,
                'before_quantity' => 10,
                'after_quantity' => 30,
                'type' => 'adjustment',
                'user_id' => $this->user->id,
                'notes' => '調整門市2',
                'created_at' => '2025-01-01 11:00:00',
                'updated_at' => '2025-01-01 11:00:00'
            ]
        ]);

        // 不指定門市ID，應該返回所有門市的總和
        $timeSeries = $this->inventoryService->getInventoryTimeSeries(
            $this->productVariant->id,
            '2025-01-01',
            '2025-01-01'
        );

        $this->assertCount(1, $timeSeries);
        $this->assertEquals('2025-01-01', $timeSeries[0]['date']);
        $this->assertEquals(30, $timeSeries[0]['quantity']); // 10 + 20
    }

    /**
     * 測試庫存操作的錯誤處理
     */
    public function test_inventory_operation_error_handling(): void
    {
        // 測試當商品變體不存在時的錯誤處理
        $this->expectException(\Exception::class);

        $this->inventoryService->deductStock(
            99999, // 不存在的商品變體ID
            10,
            $this->store->id
        );
    }
}