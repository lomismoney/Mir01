<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * ReportController 測試
 * 
 * 測試報表控制器的所有 API 端點
 */
class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $staffUser;
    protected User $viewerUser;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');
        
        $this->staffUser = User::factory()->create();
        $this->staffUser->assignRole('staff');
        
        $this->viewerUser = User::factory()->create();
        $this->viewerUser->assignRole('viewer');
    }

    /**
     * 測試管理員可以獲取庫存時序數據
     */
    public function test_admin_can_get_inventory_time_series(): void
    {
        // 準備測試數據
        $store = Store::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 100,
        ]);

        // 創建庫存交易記錄
        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->adminUser->id,
            'type' => 'addition',
            'quantity' => 50,
            'created_at' => '2025-01-01 10:00:00',
        ]);

        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->adminUser->id,
            'type' => 'reduction',
            'quantity' => -20,
            'created_at' => '2025-01-02 10:00:00',
        ]);

        // 執行 API 調用
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-03',
            ]));

        // 驗證回應
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'date',
                        'quantity',
                    ],
                ],
            ]);

        // 驗證數據內容
        $data = $response->json('data');
        $this->assertCount(3, $data); // 三天的數據
        
        // 驗證第一天的數據
        $this->assertEquals('2025-01-01', $data[0]['date']);
        $this->assertEquals(50, $data[0]['quantity']);
        
        // 驗證第二天的數據
        $this->assertEquals('2025-01-02', $data[1]['date']);
        $this->assertEquals(30, $data[1]['quantity']); // 50 - 20
        
        // 驗證第三天的數據
        $this->assertEquals('2025-01-03', $data[2]['date']);
        $this->assertEquals(30, $data[2]['quantity']); // 沒有變化
    }

    /**
     * 測試一般用戶可以獲取庫存時序數據
     */
    public function test_staff_can_get_inventory_time_series(): void
    {
        // 準備測試數據
        $store = Store::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 100,
        ]);

        // 執行 API 調用
        $response = $this->actingAs($this->staffUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(200);
    }

    /**
     * 測試 viewer 用戶可以獲取庫存時序數據
     */
    public function test_viewer_can_get_inventory_time_series(): void
    {
        // 準備測試數據
        $store = Store::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 100,
        ]);

        // 執行 API 調用
        $response = $this->actingAs($this->viewerUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(200);
    }

    /**
     * 測試未認證用戶無法獲取庫存時序數據
     */
    public function test_unauthenticated_user_cannot_get_inventory_time_series(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 執行 API 調用（未認證）
        $response = $this->getJson('/api/reports/inventory-time-series?' . http_build_query([
            'product_variant_id' => $productVariant->id,
            'start_date' => '2025-01-01',
            'end_date' => '2025-01-02',
        ]));

        // 驗證回應
        $response->assertStatus(401);
    }

    /**
     * 測試獲取庫存時序數據 - 驗證錯誤
     */
    public function test_inventory_time_series_validation_errors(): void
    {
        // 測試缺少必填參數
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series');

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'product_variant_id',
                'start_date',
                'end_date',
            ]);
    }

    /**
     * 測試獲取庫存時序數據 - 商品變體不存在
     */
    public function test_inventory_time_series_nonexistent_product_variant(): void
    {
        // 執行 API 調用（不存在的商品變體）
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => 99999,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['product_variant_id']);
    }

    /**
     * 測試獲取庫存時序數據 - 日期格式錯誤
     */
    public function test_inventory_time_series_invalid_date_format(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 執行 API 調用（錯誤的日期格式）
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025/01/01',
                'end_date' => '2025/01/02',
            ]));

        // 驗證回應
        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'start_date',
                'end_date',
            ]);
    }

    /**
     * 測試獲取庫存時序數據 - 結束日期早於開始日期
     */
    public function test_inventory_time_series_end_date_before_start_date(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 執行 API 調用（結束日期早於開始日期）
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-02',
                'end_date' => '2025-01-01',
            ]));

        // 驗證回應
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['end_date']);
    }

    /**
     * 測試獲取庫存時序數據 - 服務層錯誤處理
     */
    public function test_inventory_time_series_service_error(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 模擬服務層拋出異常
        $this->mock(InventoryService::class, function ($mock) {
            $mock->shouldReceive('getInventoryTimeSeries')
                ->andThrow(new \Exception('模擬服務錯誤'));
        });

        // 執行 API 調用
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(500)
            ->assertJson([
                'message' => '庫存數據處理失敗',
                'error' => '數據處理過程中發生錯誤，請稍後再試',
            ]);
    }

    /**
     * 測試獲取庫存時序數據 - 參數錯誤處理
     */
    public function test_inventory_time_series_invalid_argument_error(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 模擬服務層拋出 InvalidArgumentException
        $this->mock(InventoryService::class, function ($mock) {
            $mock->shouldReceive('getInventoryTimeSeries')
                ->andThrow(new \InvalidArgumentException('無效的參數'));
        });

        // 執行 API 調用
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(400)
            ->assertJson([
                'message' => '參數錯誤',
                'error' => '無效的參數',
            ]);
    }

    /**
     * 測試獲取庫存時序數據 - 處理空數據
     */
    public function test_inventory_time_series_empty_data(): void
    {
        // 準備測試數據（沒有庫存交易記錄）
        $productVariant = ProductVariant::factory()->create();

        // 執行 API 調用
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-01',
                'end_date' => '2025-01-02',
            ]));

        // 驗證回應
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'date',
                        'quantity',
                    ],
                ],
            ]);

        // 驗證數據內容
        $data = $response->json('data');
        $this->assertCount(2, $data); // 兩天的數據
        
        // 驗證每天的數據都是 0
        foreach ($data as $dayData) {
            $this->assertEquals(0, $dayData['quantity']);
        }
    }

    /**
     * 測試獲取庫存時序數據 - 跨月份查詢
     */
    public function test_inventory_time_series_cross_month_query(): void
    {
        // 準備測試數據
        $store = Store::factory()->create();
        $productVariant = ProductVariant::factory()->create();
        $inventory = Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 100,
        ]);

        // 創建跨月份的庫存交易記錄
        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->adminUser->id,
            'type' => 'addition',
            'quantity' => 50,
            'created_at' => '2025-01-31 10:00:00',
        ]);

        InventoryTransaction::factory()->create([
            'inventory_id' => $inventory->id,
            'user_id' => $this->adminUser->id,
            'type' => 'reduction',
            'quantity' => -20,
            'created_at' => '2025-02-01 10:00:00',
        ]);

        // 執行 API 調用
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2025-01-30',
                'end_date' => '2025-02-02',
            ]));

        // 驗證回應
        $response->assertStatus(200);
        
        // 驗證數據內容
        $data = $response->json('data');
        $this->assertCount(4, $data); // 四天的數據
        
        // 驗證跨月份的數據
        $this->assertEquals('2025-01-30', $data[0]['date']);
        $this->assertEquals('2025-01-31', $data[1]['date']);
        $this->assertEquals('2025-02-01', $data[2]['date']);
        $this->assertEquals('2025-02-02', $data[3]['date']);
    }

    /**
     * 測試獲取庫存時序數據 - 大範圍日期查詢
     */
    public function test_inventory_time_series_large_date_range(): void
    {
        // 準備測試數據
        $productVariant = ProductVariant::factory()->create();

        // 執行 API 調用（大範圍日期）
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/reports/inventory-time-series?' . http_build_query([
                'product_variant_id' => $productVariant->id,
                'start_date' => '2024-01-01',
                'end_date' => '2024-12-31',
            ]));

        // 驗證回應
        $response->assertStatus(200);
        
        // 驗證數據內容
        $data = $response->json('data');
        $this->assertCount(366, $data); // 2024 年是閏年，有 366 天
    }
} 