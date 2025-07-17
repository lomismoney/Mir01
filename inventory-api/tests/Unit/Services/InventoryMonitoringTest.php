<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Services\InventoryMonitoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;
use App\Events\LowStockAlert;
use App\Events\StockExhausted;
use App\Events\InventoryAnomalyDetected;

class InventoryMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected InventoryMonitoringService $monitoringService;
    protected User $user;
    protected Store $store;
    protected ProductVariant $productVariant;
    protected Inventory $inventory;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試數據
        $this->user = User::factory()->create();
        $this->store = Store::factory()->create();
        
        $product = Product::factory()->create();
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'MONITOR-TEST-001',
            'price' => 100,
        ]);
        
        $this->inventory = Inventory::factory()->create([
            'product_variant_id' => $this->productVariant->id,
            'store_id' => $this->store->id,
            'quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        // 初始化監控服務
        $this->monitoringService = new InventoryMonitoringService();

        // 設置認證用戶
        $this->actingAs($this->user);
    }

    /**
     * 測試低庫存警報觸發
     */
    public function test_low_stock_alert_triggered()
    {
        Event::fake([LowStockAlert::class]);

        // 設置低庫存閾值
        $this->inventory->update([
            'quantity' => 8,
            'low_stock_threshold' => 10
        ]);

        // 執行庫存檢查
        $alerts = $this->monitoringService->checkLowStock($this->store->id);

        // 驗證警報被觸發
        $this->assertCount(1, $alerts);
        $this->assertEquals($this->productVariant->id, $alerts[0]['product_variant_id']);
        $this->assertEquals(8, $alerts[0]['current_quantity']);
        $this->assertEquals(10, $alerts[0]['threshold']);

        // 驗證事件被觸發
        Event::assertDispatched(LowStockAlert::class, function ($event) {
            return $event->inventory->id === $this->inventory->id &&
                   $event->currentQuantity === 8 &&
                   $event->threshold === 10;
        });
    }

    /**
     * 測試庫存耗盡警報
     */
    public function test_stock_exhausted_alert()
    {
        Event::fake([StockExhausted::class]);

        // 設置庫存為0
        $this->inventory->update(['quantity' => 0]);

        // 執行庫存檢查
        $alerts = $this->monitoringService->checkExhaustedStock($this->store->id);

        // 驗證警報
        $this->assertCount(1, $alerts);
        $this->assertEquals($this->productVariant->id, $alerts[0]['product_variant_id']);

        // 驗證事件被觸發
        Event::assertDispatched(StockExhausted::class, function ($event) {
            return $event->inventory->id === $this->inventory->id;
        });
    }

    /**
     * 測試異常庫存變動檢測
     */
    public function test_anomaly_detection_for_unusual_changes()
    {
        Event::fake([InventoryAnomalyDetected::class]);

        // 創建歷史交易記錄（正常模式）
        for ($i = 0; $i < 30; $i++) {
            $this->inventory->transactions()->create([
                'quantity' => -2, // 每天賣出2個
                'before_quantity' => 100 - ($i * 2),
                'after_quantity' => 98 - ($i * 2),
                'type' => 'deduct',
                'user_id' => $this->user->id,
                'created_at' => now()->subDays(30 - $i),
            ]);
        }

        // 創建異常交易（突然大量扣減）
        $this->inventory->transactions()->create([
            'quantity' => -30, // 異常：一次扣減30個
            'before_quantity' => 40,
            'after_quantity' => 10,
            'type' => 'deduct',
            'user_id' => $this->user->id,
            'created_at' => now(),
        ]);

        // 執行異常檢測
        $anomalies = $this->monitoringService->detectAnomalies($this->inventory->id);

        // 驗證異常被檢測到
        $this->assertCount(1, $anomalies);
        $this->assertEquals(-30, $anomalies[0]['quantity_change']);
        $this->assertTrue($anomalies[0]['is_anomaly']);

        // 驗證事件被觸發
        Event::assertDispatched(InventoryAnomalyDetected::class);
    }

    /**
     * 測試庫存健康度評分
     */
    public function test_inventory_health_score()
    {
        // 場景1：健康的庫存（充足、流動正常）
        // 使用已存在的 inventory 並更新它
        $this->inventory->update([
            'quantity' => 100,
            'low_stock_threshold' => 20,
        ]);

        // 創建一些交易記錄以提高流動性評分
        for ($i = 0; $i < 15; $i++) {
            $this->inventory->transactions()->create([
                'quantity' => -2,
                'before_quantity' => 110 - ($i * 2),
                'after_quantity' => 108 - ($i * 2),
                'type' => 'deduct',
                'user_id' => $this->user->id,
                'created_at' => now()->subDays($i),
            ]);
        }

        $score = $this->monitoringService->calculateHealthScore($this->inventory);
        
        $this->assertGreaterThan(80, $score['overall_score']);
        $this->assertEquals('healthy', $score['status']);

        // 場景2：不健康的庫存（低庫存、無流動）
        $unhealthyVariant = ProductVariant::factory()->create();
        $unhealthyInventory = Inventory::factory()->create([
            'product_variant_id' => $unhealthyVariant->id,
            'store_id' => $this->store->id,
            'quantity' => 5,
            'low_stock_threshold' => 20,
        ]);

        $score = $this->monitoringService->calculateHealthScore($unhealthyInventory);
        
        $this->assertLessThan(50, $score['overall_score']);
        $this->assertEquals('critical', $score['status']);
    }

    /**
     * 測試庫存趨勢分析
     */
    public function test_inventory_trend_analysis()
    {
        // 創建7天的交易記錄
        $transactions = [
            ['day' => 7, 'qty' => -5],
            ['day' => 6, 'qty' => -3],
            ['day' => 5, 'qty' => -4],
            ['day' => 4, 'qty' => -6],
            ['day' => 3, 'qty' => -2],
            ['day' => 2, 'qty' => -5],
            ['day' => 1, 'qty' => -4],
        ];

        foreach ($transactions as $trans) {
            $this->inventory->transactions()->create([
                'quantity' => $trans['qty'],
                'type' => 'deduct',
                'user_id' => $this->user->id,
                'created_at' => now()->subDays($trans['day']),
                'before_quantity' => 100,
                'after_quantity' => 100 + $trans['qty'],
            ]);
        }

        // 分析趨勢
        $trend = $this->monitoringService->analyzeTrend($this->inventory->id, 7);

        // 驗證趨勢分析結果
        $this->assertArrayHasKey('average_daily_consumption', $trend);
        $this->assertArrayHasKey('days_until_stockout', $trend);
        $this->assertArrayHasKey('recommended_reorder_date', $trend);
        
        // 平均每日消耗應該約為 4.14 (29/7)
        $this->assertEqualsWithDelta(4.14, $trend['average_daily_consumption'], 0.1);
    }

    /**
     * 測試實時庫存監控儀表板數據
     */
    public function test_real_time_monitoring_dashboard()
    {
        // 創建多個商品和庫存狀態
        $products = [];
        for ($i = 0; $i < 5; $i++) {
            $variant = ProductVariant::factory()->create();
            $inventory = Inventory::factory()->create([
                'product_variant_id' => $variant->id,
                'store_id' => $this->store->id,
                'quantity' => rand(0, 100),
                'low_stock_threshold' => 20,
            ]);
            $products[] = $inventory;
        }

        // 獲取儀表板數據
        $dashboard = $this->monitoringService->getDashboardMetrics($this->store->id);

        // 驗證儀表板數據結構
        $this->assertArrayHasKey('total_products', $dashboard);
        $this->assertArrayHasKey('low_stock_count', $dashboard);
        $this->assertArrayHasKey('out_of_stock_count', $dashboard);
        $this->assertArrayHasKey('healthy_stock_count', $dashboard);
        $this->assertArrayHasKey('total_inventory_value', $dashboard);
        $this->assertArrayHasKey('alerts', $dashboard);
        $this->assertArrayHasKey('recent_activities', $dashboard);
    }

    /**
     * 測試批量庫存監控
     */
    public function test_batch_inventory_monitoring()
    {
        // 創建多個需要監控的庫存項目
        $inventories = [];
        for ($i = 0; $i < 10; $i++) {
            $variant = ProductVariant::factory()->create();
            $inventory = Inventory::factory()->create([
                'product_variant_id' => $variant->id,
                'store_id' => $this->store->id,
                'quantity' => rand(0, 50),
                'low_stock_threshold' => 15,
            ]);
            $inventories[] = $inventory;
        }

        // 執行批量監控
        $results = $this->monitoringService->batchMonitor($this->store->id);

        // 驗證結果
        $this->assertArrayHasKey('checked_count', $results);
        $this->assertArrayHasKey('alerts_generated', $results);
        $this->assertArrayHasKey('anomalies_detected', $results);
        $this->assertEquals(11, $results['checked_count']); // 10 + 原始的1個
    }

    /**
     * 測試監控日誌記錄
     */
    public function test_monitoring_logs_are_recorded()
    {
        Log::spy();

        // 執行各種監控操作
        $this->monitoringService->checkLowStock($this->store->id);
        $this->monitoringService->detectAnomalies($this->inventory->id);

        // 驗證日誌被記錄
        Log::shouldHaveReceived('info')
            ->with('執行低庫存檢查', \Mockery::any())
            ->once();

        Log::shouldHaveReceived('info')
            ->with('執行庫存異常檢測', \Mockery::any())
            ->once();
    }

    /**
     * 測試自動補貨建議
     */
    public function test_automatic_reorder_suggestions()
    {
        // 設置庫存和銷售歷史
        $this->inventory->update(['quantity' => 15]);
        
        // 創建穩定的銷售記錄
        for ($i = 0; $i < 14; $i++) {
            $this->inventory->transactions()->create([
                'quantity' => -3,
                'type' => 'deduct',
                'user_id' => $this->user->id,
                'created_at' => now()->subDays($i),
                'before_quantity' => 100,
                'after_quantity' => 97,
            ]);
        }

        // 獲取補貨建議
        $suggestions = $this->monitoringService->getReorderSuggestions($this->inventory->id);

        // 驗證建議
        $this->assertArrayHasKey('suggested_quantity', $suggestions);
        $this->assertArrayHasKey('reorder_point', $suggestions);
        $this->assertArrayHasKey('lead_time_days', $suggestions);
        $this->assertArrayHasKey('safety_stock', $suggestions);
        
        // 建議數量應該合理（基於歷史消耗）
        $this->assertGreaterThan(20, $suggestions['suggested_quantity']);
    }
}