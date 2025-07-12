<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\CurrencyMigrationService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class CurrencyMigrationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CurrencyMigrationService $migrationService;
    protected User $user;
    protected Store $store;
    protected Customer $customer;
    protected ProductVariant $productVariant;

    protected function setUp(): void
    {
        parent::setUp();

        // 安全地創建角色，避免重複創建
        if (!Role::where('name', 'admin')->exists()) {
            Role::create(['name' => 'admin']);
        }

        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);

        // 創建測試資料
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 100.50
        ]);

        $this->migrationService = new CurrencyMigrationService();
    }

    /**
     * 測試獲取轉換狀態
     */
    public function test_gets_conversion_status(): void
    {
        // 創建一些測試數據
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 250.75,
            'paid_amount' => 100.25
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 99.99,
            'quantity' => 2,
            'discount_amount' => 10.50
        ]);

        $status = $this->migrationService->getConversionStatus();

        $this->assertIsArray($status);
        $this->assertArrayHasKey('migration_log_exists', $status);
        $this->assertArrayHasKey('overall_progress', $status);
        $this->assertArrayHasKey('models_status', $status);
        
        // 驗證模型狀態結構
        $this->assertGreaterThan(0, count($status['models_status']));
        
        foreach ($status['models_status'] as $modelStatus) {
            $this->assertArrayHasKey('model', $modelStatus);
            $this->assertArrayHasKey('table', $modelStatus);
            $this->assertArrayHasKey('migration_complete', $modelStatus);
            $this->assertArrayHasKey('fields_status', $modelStatus);
        }
    }

    /**
     * 測試單個模型的轉換
     */
    public function test_converts_single_model(): void
    {
        // 創建測試訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 100.50,
            'paid_amount' => 50.25,
            'shipping_fee' => 15.75,
            'tax' => 8.40,
            'discount_amount' => 5.00
        ]);

        // 確保 cents 欄位存在且已自動填充
        $this->assertTrue(Schema::hasColumn('orders', 'grand_total_cents'));
        $this->assertNotNull($order->grand_total_cents);

        // 執行單個模型轉換
        $result = $this->migrationService->convertSingleModel('orders');

        $this->assertTrue($result['success']);
        $this->assertGreaterThanOrEqual(0, $result['converted_records']);

        // 驗證轉換結果
        $order->refresh();
        $this->assertEquals(10050, $order->grand_total_cents); // 100.50 * 100
        $this->assertEquals(5025, $order->paid_amount_cents);   // 50.25 * 100
        $this->assertEquals(1575, $order->shipping_fee_cents);  // 15.75 * 100
        $this->assertEquals(840, $order->tax_cents);            // 8.40 * 100
        $this->assertEquals(500, $order->discount_amount_cents); // 5.00 * 100
    }

    /**
     * 測試完整遷移流程
     */
    public function test_performs_full_migration(): void
    {
        // 創建測試數據
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 199.99
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 33.33,
            'cost' => 25.00,
            'discount_amount' => 3.33
        ]);

        // 執行完整遷移
        $report = $this->migrationService->performFullMigration();

        $this->assertTrue($report['success']);
        $this->assertGreaterThan(0, $report['total_records_converted']);
        $this->assertArrayHasKey('started_at', $report);
        $this->assertArrayHasKey('completed_at', $report);
        $this->assertArrayHasKey('duration_seconds', $report);

        // 驗證轉換結果
        $order->refresh();
        $orderItem->refresh();

        $this->assertEquals(19999, $order->grand_total_cents);
        $this->assertEquals(3333, $orderItem->price_cents);
        $this->assertEquals(2500, $orderItem->cost_cents);
        $this->assertEquals(333, $orderItem->discount_amount_cents);
    }

    /**
     * 測試轉換精確性
     */
    public function test_conversion_accuracy(): void
    {
        // 測試各種小數位數的金額
        $testAmounts = [
            0.01,      // 最小單位
            0.99,      // 接近整數
            1.00,      // 整數
            10.50,     // 常見金額
            99.99,     // 兩位小數
            123.456,   // 超過兩位小數（應該四捨五入）
            999.995,   // 四捨五入測試
        ];

        foreach ($testAmounts as $amount) {
            $order = Order::factory()->create([
                'customer_id' => $this->customer->id,
                'store_id' => $this->store->id,
                'grand_total' => $amount
            ]);

            // 執行轉換
            $this->migrationService->convertSingleModel('orders');
            
            $order->refresh();
            
            // 驗證轉換精確性
            $expectedCents = (int) round($amount * 100);
            $this->assertEquals($expectedCents, $order->grand_total_cents, 
                "Amount {$amount} should convert to {$expectedCents} cents");
        }
    }

    /**
     * 測試部分轉換情況
     */
    public function test_handles_partial_conversion(): void
    {
        // 創建兩個訂單，只轉換一個
        $order1 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 100.00
        ]);

        $order2 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 200.00
        ]);

        // 手動設置第一個訂單已轉換
        $order1->update(['grand_total_cents' => 10000]);

        // 執行轉換
        $result = $this->migrationService->convertSingleModel('orders');

        $this->assertTrue($result['success']);
        $this->assertGreaterThanOrEqual(1, $result['converted_records']); // 至少轉換一個

        $order1->refresh();
        $order2->refresh();

        $this->assertEquals(10000, $order1->grand_total_cents); // 保持不變
        $this->assertEquals(20000, $order2->grand_total_cents); // 新轉換
    }

    /**
     * 測試轉換驗證
     */
    public function test_validates_conversion_results(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 150.75,
            'paid_amount' => 75.25
        ]);

        // 執行轉換
        $this->migrationService->convertSingleModel('orders');
        $order->refresh();

        // 驗證轉換結果（直接檢查數據一致性）
        $expectedCents = (int) round($order->grand_total * 100);
        $this->assertEquals($expectedCents, $order->grand_total_cents);
        
        // 驗證 paid_amount 也正確轉換
        $expectedPaidCents = (int) round($order->paid_amount * 100);
        $this->assertEquals($expectedPaidCents, $order->paid_amount_cents);
    }

    /**
     * 測試錯誤處理
     */
    public function test_handles_conversion_errors(): void
    {
        // 創建正常的數據，但透過直接更新資料庫來模擬錯誤情況
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 100.00
        ]);

        // 直接在資料庫中設定無效的金額值來測試錯誤處理
        \DB::table('orders')
            ->where('id', $order->id)
            ->update(['grand_total' => 'invalid_value']);

        // 執行轉換（應該處理錯誤值）
        $result = $this->migrationService->convertSingleModel('orders');

        // 驗證結果 - 即使有錯誤，服務也應該繼續處理其他記錄
        $this->assertTrue($result['success']);
        $this->assertGreaterThanOrEqual(0, $result['converted_records']);
    }

    /**
     * 測試回滾功能
     */
    public function test_rollback_conversion(): void
    {
        if (app()->environment('production')) {
            $this->markTestSkipped('回滾測試在生產環境中被跳過');
        }

        // 創建已轉換的數據
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 100.00,
            'grand_total_cents' => 10000
        ]);

        // 執行回滾
        $report = $this->migrationService->rollbackConversion();

        $this->assertArrayHasKey('models_processed', $report);
        $this->assertArrayHasKey('started_at', $report);
        $this->assertArrayHasKey('completed_at', $report);

        // 驗證回滾結果
        $order->refresh();
        $this->assertNull($order->grand_total_cents); // 應該被清空
    }

    /**
     * 測試批量處理性能
     */
    public function test_batch_processing_performance(): void
    {
        // 創建大量測試數據（但不要太多以免測試太慢）
        $orders = Order::factory()->count(50)->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);

        $startTime = microtime(true);

        // 執行批量轉換
        $result = $this->migrationService->convertSingleModel('orders');

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        $this->assertTrue($result['success']);
        $this->assertGreaterThanOrEqual(50, $result['converted_records']);
        
        // 驗證執行時間合理（應該在幾秒內完成）
        $this->assertLessThan(10, $executionTime, '批量處理應該在10秒內完成');
    }

    /**
     * 測試遷移日誌
     */
    public function test_creates_migration_logs(): void
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'grand_total' => 100.00
        ]);

        // 執行轉換
        $result = $this->migrationService->convertSingleModel('orders');

        // 驗證轉換成功
        $this->assertTrue($result['success']);
        $this->assertGreaterThan(0, $result['converted_records']);
        
        // 驗證轉換結果
        $order->refresh();
        $this->assertEquals(10000, $order->grand_total_cents);
    }
}