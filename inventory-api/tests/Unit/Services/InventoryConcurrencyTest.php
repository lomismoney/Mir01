<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\Customer;
use App\Services\OrderService;
use App\Services\InventoryService;
use App\Services\OrderNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected InventoryService $inventoryService;
    protected User $user;
    protected Store $store;
    protected Customer $customer;
    protected ProductVariant $productVariant;
    protected Inventory $inventory;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試用戶和基礎數據
        $this->user = User::factory()->create();
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        
        // 創建商品和庫存
        $product = Product::factory()->create();
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 100,
            'cost_price' => 50,
        ]);
        
        $this->inventory = Inventory::factory()->create([
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'quantity' => 10, // 初始庫存10個
        ]);

        // 初始化服務
        $this->inventoryService = new InventoryService();
        $this->orderService = new OrderService(
            $this->inventoryService,
            new OrderNumberGenerator()
        );

        // 設置認證用戶
        $this->actingAs($this->user);
    }

    /**
     * 測試並發下單時的庫存控制
     * 通過手動控制事務來模擬並發場景
     */
    public function test_concurrent_orders_prevent_overselling()
    {
        // 增加初始庫存以便更好地測試
        $this->inventory->update(['quantity' => 5]);
        
        // 準備兩個訂單數據，每個需要3個商品，總計6個超過庫存5個
        $orderData1 = $this->prepareOrderData(3);
        $orderData2 = $this->prepareOrderData(3);

        // 開始第一個事務
        DB::beginTransaction();
        
        try {
            // 在第一個事務中檢查庫存（這應該會鎖定庫存記錄）
            $checkResult1 = $this->inventoryService->batchCheckStock(
                $orderData1['items'], 
                $this->store->id
            );
            
            // 第一個檢查應該通過（庫存5，需求3）
            $this->assertEmpty($checkResult1, '第一個訂單的庫存檢查應該通過');
            
            // 在另一個連接中嘗試創建第二個訂單
            // 這應該會等待第一個事務釋放鎖
            $secondOrderFailed = false;
            try {
                // 設置較短的鎖等待超時時間
                DB::statement('SET innodb_lock_wait_timeout = 2');
                
                // 嘗試創建第二個訂單
                $order2 = $this->orderService->createOrder($orderData2);
            } catch (\Exception $e) {
                $secondOrderFailed = true;
                // 可能是鎖等待超時或庫存不足
            }
            
            // 完成第一個訂單
            $this->inventoryService->batchDeductStock(
                $orderData1['items'], 
                $this->store->id,
                ['order_number' => 'TEST-001']
            );
            
            DB::commit();
            
            // 現在庫存應該只剩2個，第二個訂單（需要3個）應該失敗
            if (!$secondOrderFailed) {
                try {
                    $order2 = $this->orderService->createOrder($orderData2);
                    $this->fail('第二個訂單應該因庫存不足而失敗');
                } catch (\Exception $e) {
                    $this->assertStringContainsString('庫存不足', $e->getMessage());
                }
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
        
        // 驗證最終庫存
        $this->inventory->refresh();
        $this->assertEquals(2, $this->inventory->quantity, '庫存應該是5-3=2');
    }

    /**
     * 測試檢查庫存時的悲觀鎖
     * 確保在檢查庫存時就進行鎖定，避免讀取到過時的庫存數據
     */
    public function test_batch_check_stock_with_pessimistic_lock()
    {
        $items = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 5,
                'is_stocked_sale' => true,
            ]
        ];

        // 開始一個事務並檢查庫存（應該使用鎖）
        DB::beginTransaction();
        
        try {
            // 這個方法應該在內部使用 lockForUpdate
            $checkResults = $this->inventoryService->batchCheckStock($items, $this->store->id);
            
            // 驗證檢查結果
            $this->assertEmpty($checkResults, '庫存應該足夠');
            
            // 在另一個連接中嘗試更新同樣的庫存記錄
            // 這應該會被阻塞直到第一個事務提交
            $blocked = false;
            try {
                DB::connection()->unprepared("SET SESSION innodb_lock_wait_timeout = 1");
                DB::connection()->table('inventories')
                    ->where('id', $this->inventory->id)
                    ->update(['quantity' => 0]);
            } catch (\Exception $e) {
                $blocked = true;
            }
            
            $this->assertTrue($blocked, '庫存記錄應該被鎖定');
            
        } finally {
            DB::rollBack();
        }
    }

    /**
     * 測試快速連續下單的場景
     * 確保即使在高頻下單時也能正確控制庫存
     */
    public function test_rapid_sequential_orders()
    {
        $successCount = 0;
        $failCount = 0;
        
        // 嘗試快速創建10個訂單，每個需要3個商品
        // 總共需要30個，但只有10個庫存
        for ($i = 0; $i < 10; $i++) {
            try {
                $orderData = $this->prepareOrderData(3);
                $this->orderService->createOrder($orderData);
                $successCount++;
            } catch (\Exception $e) {
                $failCount++;
                $this->assertStringContainsString('庫存不足', $e->getMessage());
            }
        }

        // 應該只有3-4個訂單成功（10/3）
        $this->assertLessThanOrEqual(4, $successCount, '成功的訂單數不應超過庫存允許的數量');
        $this->assertGreaterThan(0, $successCount, '至少應該有一個訂單成功');
        
        // 驗證最終庫存
        $this->inventory->refresh();
        $this->assertGreaterThanOrEqual(0, $this->inventory->quantity);
        $this->assertEquals(10 - ($successCount * 3), $this->inventory->quantity);
    }

    /**
     * 測試事務回滾時的庫存恢復
     * 確保當訂單創建失敗時，已扣減的庫存能正確回滾
     */
    public function test_inventory_rollback_on_order_failure()
    {
        // 準備一個會在創建過程中失敗的訂單（例如：缺少必要數據）
        $orderData = $this->prepareOrderData(5);
        unset($orderData['payment_method']); // 移除必要欄位導致失敗

        $initialQuantity = $this->inventory->quantity;

        try {
            $this->orderService->createOrder($orderData);
            $this->fail('訂單創建應該失敗');
        } catch (\Exception $e) {
            // 預期的異常
        }

        // 驗證庫存已回滾到初始狀態
        $this->inventory->refresh();
        $this->assertEquals($initialQuantity, $this->inventory->quantity, '庫存應該回滾到初始狀態');

        // 驗證沒有創建庫存交易記錄
        $transactionCount = DB::table('inventory_transactions')
            ->where('inventory_id', $this->inventory->id)
            ->count();
        $this->assertEquals(0, $transactionCount, '不應該有庫存交易記錄');
    }

    /**
     * 測試死鎖預防機制
     * 確保多商品訂單在鎖定時按照統一順序，避免死鎖
     */
    public function test_deadlock_prevention_with_multiple_products()
    {
        // 創建第二個商品和庫存
        $product2 = Product::factory()->create();
        $productVariant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'TEST-SKU-002',
            'price' => 150,
        ]);
        $inventory2 = Inventory::factory()->create([
            'product_variant_id' => $productVariant2->id,
            'store_id' => $this->store->id,
            'quantity' => 10,
        ]);

        // 準備兩個訂單，包含相同商品但順序不同
        $orderData1 = $this->prepareOrderData(0);
        $orderData1['items'] = [
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 2,
                'price' => 100,
                'is_stocked_sale' => true,
                'status' => '待處理',
                'product_name' => 'Test Product 1',
                'sku' => 'TEST-SKU-001',
            ],
            [
                'product_variant_id' => $productVariant2->id,
                'quantity' => 2,
                'price' => 150,
                'is_stocked_sale' => true,
                'status' => '待處理',
                'product_name' => 'Test Product 2',
                'sku' => 'TEST-SKU-002',
            ],
        ];

        $orderData2 = $this->prepareOrderData(0);
        $orderData2['items'] = [
            [
                'product_variant_id' => $productVariant2->id, // 相反的順序
                'quantity' => 2,
                'price' => 150,
                'is_stocked_sale' => true,
                'status' => '待處理',
                'product_name' => 'Test Product 2',
                'sku' => 'TEST-SKU-002',
            ],
            [
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 2,
                'price' => 100,
                'is_stocked_sale' => true,
                'status' => '待處理',
                'product_name' => 'Test Product 1',
                'sku' => 'TEST-SKU-001',
            ],
        ];

        // 兩個訂單都應該成功，不應該發生死鎖
        $order1 = $this->orderService->createOrder($orderData1);
        $order2 = $this->orderService->createOrder($orderData2);

        $this->assertNotNull($order1);
        $this->assertNotNull($order2);

        // 驗證庫存正確扣減
        $this->inventory->refresh();
        $inventory2->refresh();
        $this->assertEquals(6, $this->inventory->quantity); // 10 - 2 - 2
        $this->assertEquals(6, $inventory2->quantity); // 10 - 2 - 2
    }

    /**
     * 準備訂單測試數據
     */
    private function prepareOrderData(int $quantity): array
    {
        return [
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => '待出貨',
            'payment_status' => '待付款',
            'payment_method' => '現金',
            'order_source' => '店面',
            'shipping_address' => '測試地址',
            'items' => $quantity > 0 ? [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => $quantity,
                    'price' => 100,
                    'is_stocked_sale' => true,
                    'status' => '待處理',
                    'product_name' => 'Test Product',
                    'sku' => 'TEST-SKU-001',
                ]
            ] : [],
        ];
    }
}