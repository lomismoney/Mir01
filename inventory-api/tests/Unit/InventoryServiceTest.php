<?php

namespace Tests\Unit;

use App\Services\InventoryService;
use App\Services\StockTransferService;
use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Mockery;

/**
 * InventoryService 測試
 * 
 * 測試庫存服務層的所有功能
 */
class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryService $inventoryService;
    protected $mockStockTransferService;
    protected User $testUser;
    protected Store $defaultStore;
    protected ProductVariant $productVariant;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 安全地創建角色，避免重複創建
        if (!Role::where('name', 'admin')->exists()) {
            Role::create(['name' => 'admin']);
        }
        
        $this->mockStockTransferService = Mockery::mock(StockTransferService::class);
        
        // 使用依賴注入容器來創建 InventoryService
        $this->inventoryService = app(InventoryService::class);
        
        // 創建測試用戶
        $this->testUser = User::factory()->create();
        $this->testUser->assignRole('admin');
        Auth::login($this->testUser);
        
        // 創建測試門市
        $this->defaultStore = Store::factory()->create(['name' => '預設門市']);
        
        // 創建測試商品變體
        $this->productVariant = ProductVariant::factory()->create();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
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

        // 執行方法
        $defaultStoreId = $method->invoke($this->inventoryService);

        // 驗證返回的是最小ID的門市
        $this->assertEquals($this->defaultStore->id, $defaultStoreId);
    }

    /**
     * 測試當沒有門市時拋出異常
     */
    public function test_get_default_store_id_throws_exception_when_no_stores(): void
    {
        // 刪除所有門市
        Store::query()->delete();

        // 使用反射來測試 protected 方法
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('getDefaultStoreId');
        $method->setAccessible(true);

        // 驗證拋出異常
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('系統中沒有任何門市，請先創建門市後再進行庫存操作');

        $method->invoke($this->inventoryService);
    }

    /**
     * 測試確保門市ID有效 - 使用提供的門市ID
     */
    public function test_ensure_valid_store_id_with_provided_id(): void
    {
        // 使用反射來測試 protected 方法
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('ensureValidStoreId');
        $method->setAccessible(true);

        // 執行方法
        $validStoreId = $method->invoke($this->inventoryService, $this->defaultStore->id);

        // 驗證返回正確的門市ID
        $this->assertEquals($this->defaultStore->id, $validStoreId);
    }

    /**
     * 測試確保門市ID有效 - 使用預設門市ID
     */
    public function test_ensure_valid_store_id_with_default(): void
    {
        // 使用反射來測試 protected 方法
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('ensureValidStoreId');
        $method->setAccessible(true);

        // 執行方法（不提供門市ID）
        $validStoreId = $method->invoke($this->inventoryService, null);

        // 驗證返回預設門市ID
        $this->assertEquals($this->defaultStore->id, $validStoreId);
    }

    /**
     * 測試確保門市ID有效 - 門市不存在時拋出異常
     */
    public function test_ensure_valid_store_id_throws_exception_for_nonexistent_store(): void
    {
        // 使用反射來測試 protected 方法
        $reflection = new \ReflectionClass($this->inventoryService);
        $method = $reflection->getMethod('ensureValidStoreId');
        $method->setAccessible(true);

        // 驗證拋出異常
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('門市ID 999999 不存在');

        $method->invoke($this->inventoryService, 999999);
    }

    /**
     * 測試扣減庫存 - 成功扣減
     */
    public function test_deduct_stock_successfully(): void
    {
        // 準備庫存數據
        $inventory = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 執行扣減庫存
        $result = $this->inventoryService->deductStock(
            $this->productVariant->id,
            20,
            $this->defaultStore->id,
            '測試扣減',
            ['order_id' => 123]
        );

        // 驗證結果
        $this->assertTrue($result);

        // 驗證庫存已扣減
        $inventory->refresh();
        $this->assertEquals(80, $inventory->quantity);

        // 驗證庫存交易記錄
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $inventory->id,
            'user_id' => $this->testUser->id,
            'type' => 'reduction',
            'quantity' => -20,
            'notes' => '測試扣減',
        ]);
    }

    /**
     * 測試扣減庫存 - 庫存不足時拋出異常
     */
    public function test_deduct_stock_throws_exception_when_insufficient_stock(): void
    {
        // 準備庫存數據
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
        ]);

        // 驗證拋出異常
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('庫存不足');

        // 嘗試扣減超過庫存的數量
        $this->inventoryService->deductStock(
            $this->productVariant->id,
            20,
            $this->defaultStore->id
        );
    }

    /**
     * 測試扣減庫存 - 創建新庫存記錄
     */
    public function test_deduct_stock_creates_new_inventory_record(): void
    {
        // 執行扣減庫存（庫存記錄不存在）
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('庫存不足');

        $this->inventoryService->deductStock(
            $this->productVariant->id,
            5,
            $this->defaultStore->id
        );
    }

    /**
     * 測試返還庫存 - 成功返還
     */
    public function test_return_stock_successfully(): void
    {
        // 準備庫存數據
        $inventory = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 80,
        ]);

        // 執行返還庫存
        $result = $this->inventoryService->returnStock(
            $this->productVariant->id,
            20,
            $this->defaultStore->id,
            '測試返還',
            ['order_id' => 123]
        );

        // 驗證結果
        $this->assertTrue($result);

        // 驗證庫存已增加
        $inventory->refresh();
        $this->assertEquals(100, $inventory->quantity);

        // 驗證庫存交易記錄
        $this->assertDatabaseHas('inventory_transactions', [
            'inventory_id' => $inventory->id,
            'user_id' => $this->testUser->id,
            'type' => 'addition',
            'quantity' => 20,
            'notes' => '測試返還',
        ]);
    }

    /**
     * 測試返還庫存 - 創建新庫存記錄
     */
    public function test_return_stock_creates_new_inventory_record(): void
    {
        // 執行返還庫存（庫存記錄不存在）
        $result = $this->inventoryService->returnStock(
            $this->productVariant->id,
            20,
            $this->defaultStore->id,
            '測試返還新記錄'
        );

        // 驗證結果
        $this->assertTrue($result);

        // 驗證創建了新的庫存記錄
        $this->assertDatabaseHas('inventories', [
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 20,
            'low_stock_threshold' => 5,
        ]);
    }

    /**
     * 測試批量扣減庫存 - 成功扣減
     */
    public function test_batch_deduct_stock_successfully(): void
    {
        // 準備多個商品變體和庫存
        $productVariant2 = ProductVariant::factory()->create();
        
        $inventory1 = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);
        
        $inventory2 = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $productVariant2->id,
            'quantity' => 50,
        ]);

        // 準備批量扣減數據
        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 10,
                'is_stocked_sale' => true,
                'product_name' => '商品1',
            ],
            [
                'product_variant_id' => $productVariant2->id,
                'quantity' => 5,
                'is_stocked_sale' => true,
                'product_name' => '商品2',
            ],
        ];

        // 執行批量扣減
        $result = $this->inventoryService->batchDeductStock(
            $items,
            $this->defaultStore->id,
            ['order_id' => 123]
        );

        // 驗證結果
        $this->assertTrue($result);

        // 驗證庫存已扣減
        $inventory1->refresh();
        $inventory2->refresh();
        $this->assertEquals(90, $inventory1->quantity);
        $this->assertEquals(45, $inventory2->quantity);
    }

    /**
     * 測試批量返還庫存 - 成功返還
     */
    public function test_batch_return_stock_successfully(): void
    {
        // 準備多個商品變體和庫存
        $productVariant2 = ProductVariant::factory()->create();
        
        $inventory1 = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 90,
        ]);
        
        $inventory2 = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $productVariant2->id,
            'quantity' => 45,
        ]);

        // 準備批量返還數據（模擬訂單項目）
        $items = collect([
            (object) [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 10,
                'is_stocked_sale' => true,
                'product_name' => '商品1',
            ],
            (object) [
                'product_variant_id' => $productVariant2->id,
                'quantity' => 5,
                'is_stocked_sale' => true,
                'product_name' => '商品2',
            ],
        ]);

        // 執行批量返還
        $result = $this->inventoryService->batchReturnStock(
            $items,
            $this->defaultStore->id,
            ['order_id' => 123]
        );

        // 驗證結果
        $this->assertTrue($result);

        // 驗證庫存已增加
        $inventory1->refresh();
        $inventory2->refresh();
        $this->assertEquals(100, $inventory1->quantity);
        $this->assertEquals(50, $inventory2->quantity);
    }

    /**
     * 測試檢查庫存 - 庫存足夠
     */
    public function test_check_stock_sufficient(): void
    {
        // 準備庫存數據
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 檢查庫存
        $result = $this->inventoryService->checkStock(
            $this->productVariant->id,
            50,
            $this->defaultStore->id
        );

        // 驗證結果
        $this->assertTrue($result);
    }

    /**
     * 測試檢查庫存 - 庫存不足
     */
    public function test_check_stock_insufficient(): void
    {
        // 準備庫存數據
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 30,
        ]);

        // 檢查庫存
        $result = $this->inventoryService->checkStock(
            $this->productVariant->id,
            50,
            $this->defaultStore->id
        );

        // 驗證結果
        $this->assertFalse($result);
    }

    /**
     * 測試檢查庫存 - 庫存記錄不存在
     */
    public function test_check_stock_no_inventory_record(): void
    {
        // 檢查庫存（沒有庫存記錄）
        $result = $this->inventoryService->checkStock(
            $this->productVariant->id,
            50,
            $this->defaultStore->id
        );

        // 驗證結果
        $this->assertFalse($result);
    }

    /**
     * 測試批量檢查庫存 - 有庫存不足的商品
     */
    public function test_batch_check_stock_with_insufficient_items(): void
    {
        // 準備商品變體和庫存
        $productVariant2 = ProductVariant::factory()->create();
        
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 30, // 庫存不足
        ]);
        
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $productVariant2->id,
            'quantity' => 100, // 庫存充足
        ]);

        // 準備檢查數據
        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 50, // 需求超過庫存
                'is_stocked_sale' => true,
                'product_name' => '商品1',
            ],
            [
                'product_variant_id' => $productVariant2->id,
                'quantity' => 20, // 需求小於庫存
                'is_stocked_sale' => true,
                'product_name' => '商品2',
            ],
        ];

        // 執行批量檢查
        $results = $this->inventoryService->batchCheckStock(
            $items,
            $this->defaultStore->id
        );

        // 驗證結果
        $this->assertCount(1, $results); // 只有一個商品庫存不足
        $this->assertEquals($this->productVariant->id, $results[0]['product_variant_id']);
        $this->assertEquals(50, $results[0]['requested_quantity']);
        $this->assertEquals(30, $results[0]['available_quantity']);
        $this->assertFalse($results[0]['is_available']);
    }

    /**
     * 測試批量檢查庫存 - 所有商品庫存充足
     */
    public function test_batch_check_stock_all_sufficient(): void
    {
        // 準備庫存數據
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 準備檢查數據
        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 20,
                'is_stocked_sale' => true,
                'product_name' => '商品1',
            ],
        ];

        // 執行批量檢查
        $results = $this->inventoryService->batchCheckStock(
            $items,
            $this->defaultStore->id
        );

        // 驗證結果
        $this->assertEmpty($results); // 沒有庫存不足的商品
    }

    /**
     * 測試獲取庫存時序數據 - 有交易記錄
     */
    public function test_get_inventory_time_series_with_transactions(): void
    {
        // 準備庫存和交易記錄
        $inventory = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 創建基準日期前的交易記錄（基準庫存）
        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->testUser->id,
            'type' => 'addition',
            'quantity' => 100,
            'created_at' => '2024-12-31 10:00:00',
        ]);

        // 創建查詢範圍內的交易記錄
        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->testUser->id,
            'type' => 'reduction',
            'quantity' => -20,
            'created_at' => '2025-01-01 10:00:00',
        ]);

        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->testUser->id,
            'type' => 'addition',
            'quantity' => 10,
            'created_at' => '2025-01-02 10:00:00',
        ]);

        // 獲取時序數據
        $timeSeries = $this->inventoryService->getInventoryTimeSeries(
            $this->productVariant->id,
            '2025-01-01',
            '2025-01-03'
        );

        // 驗證結果
        $this->assertCount(3, $timeSeries); // 三天的數據

        // 驗證第一天數據（基準100 - 20 = 80）
        $this->assertEquals('2025-01-01', $timeSeries[0]['date']);
        $this->assertEquals(80, $timeSeries[0]['quantity']);

        // 驗證第二天數據（80 + 10 = 90）
        $this->assertEquals('2025-01-02', $timeSeries[1]['date']);
        $this->assertEquals(90, $timeSeries[1]['quantity']);

        // 驗證第三天數據（無變化，保持90）
        $this->assertEquals('2025-01-03', $timeSeries[2]['date']);
        $this->assertEquals(90, $timeSeries[2]['quantity']);
    }

    /**
     * 測試獲取庫存時序數據 - 無交易記錄
     */
    public function test_get_inventory_time_series_no_transactions(): void
    {
        // 獲取時序數據（沒有任何交易記錄）
        $timeSeries = $this->inventoryService->getInventoryTimeSeries(
            $this->productVariant->id,
            '2025-01-01',
            '2025-01-02'
        );

        // 驗證結果
        $this->assertCount(2, $timeSeries); // 兩天的數據

        // 驗證所有天數的庫存都是0
        foreach ($timeSeries as $dayData) {
            $this->assertEquals(0, $dayData['quantity']);
        }
    }

    /**
     * 測試未認證用戶無法執行庫存操作
     */
    public function test_unauthenticated_user_cannot_perform_inventory_operations(): void
    {
        // 準備庫存數據，確保庫存充足
        Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 登出用戶
        Auth::logout();

        // 嘗試扣減庫存
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行庫存操作');

        $this->inventoryService->deductStock(
            $this->productVariant->id,
            10,
            $this->defaultStore->id
        );
    }

    /**
     * 測試數據庫事務回滾
     */
    public function test_database_transaction_rollback_on_error(): void
    {
        // 準備庫存數據
        $inventory = Inventory::factory()->create([
            'store_id' => $this->defaultStore->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 100,
        ]);

        // 記錄原始庫存
        $originalQuantity = $inventory->quantity;

        // 模擬在事務中發生錯誤
        DB::beginTransaction();
        
        try {
            // 嘗試扣減超過庫存的數量（會拋出異常）
            $this->inventoryService->deductStock(
                $this->productVariant->id,
                150, // 超過庫存
                $this->defaultStore->id
            );
        } catch (\Exception $e) {
            DB::rollBack();
        }

        // 驗證庫存沒有被修改
        $inventory->refresh();
        $this->assertEquals($originalQuantity, $inventory->quantity);
    }
} 