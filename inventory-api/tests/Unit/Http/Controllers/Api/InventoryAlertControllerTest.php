<?php

namespace Tests\Unit\Http\Controllers\Api;

use Tests\TestCase;
use App\Http\Controllers\Api\InventoryAlertController;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

class InventoryAlertControllerTest extends TestCase
{
    use RefreshDatabase;
    
    private InventoryAlertController $controller;
    private User $user;
    private Store $store;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->controller = app(InventoryAlertController::class);
        $this->user = User::factory()->create();
        $this->store = Store::factory()->create();
        $this->actingAs($this->user);
    }
    
    /**
     * 測試庫存預警摘要 API
     */
    public function test_summary_returns_correct_structure()
    {
        // 創建測試數據
        $this->createTestInventoryData();
        
        $request = new Request();
        $response = $this->controller->summary($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        
        // 驗證回應結構
        $this->assertArrayHasKey('data', $data);
        $this->assertIsArray($data['data']);
    }
    
    /**
     * 測試低庫存商品列表 API
     */
    public function test_low_stock_returns_paginated_results()
    {
        // 創建測試數據
        $this->createTestInventoryData();
        
        $request = new Request([
            'per_page' => 10,
        ]);
        
        $response = $this->controller->lowStock($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        
        // 驗證分頁結構
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('current_page', $data);
        $this->assertArrayHasKey('per_page', $data);
        $this->assertArrayHasKey('total', $data);
    }
    
    /**
     * 測試帶篩選條件的低庫存商品列表
     */
    public function test_low_stock_with_filters()
    {
        // 創建測試數據
        $this->createTestInventoryData();
        
        $request = new Request([
            'store_id' => $this->store->id,
            'severity' => 'critical',
        ]);
        
        $response = $this->controller->lowStock($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('data', $data);
    }
    
    
    /**
     * 測試更新預警設定 API
     */
    public function test_update_thresholds_updates_correctly()
    {
        // 創建測試庫存
        $product = Product::factory()->create(['name' => 'Test Product']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-001',
        ]);
        
        $inventory = Inventory::factory()->create([
            'store_id' => $this->store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
            'low_stock_threshold' => 10,
        ]);
        
        $request = new Request([
            'updates' => [
                [
                    'inventory_id' => $inventory->id,
                    'low_stock_threshold' => 15,
                ]
            ]
        ]);
        
        $response = $this->controller->updateThresholds($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        
        // 驗證更新
        $inventory->refresh();
        $this->assertEquals(15, $inventory->low_stock_threshold);
        
        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $data);
        $this->assertArrayHasKey('updated_count', $data);
        $this->assertEquals(1, $data['updated_count']);
    }
    
    /**
     * 測試批量更新預警設定
     */
    public function test_batch_update_thresholds()
    {
        // 創建多個庫存項目
        $inventories = [];
        for ($i = 0; $i < 3; $i++) {
            $product = Product::factory()->create(['name' => "Test Product {$i}"]);
            $variant = ProductVariant::factory()->create([
                'product_id' => $product->id,
                'sku' => "TEST-00{$i}",
            ]);
            
            $inventories[] = Inventory::factory()->create([
                'store_id' => $this->store->id,
                'product_variant_id' => $variant->id,
                'quantity' => 50,
                'low_stock_threshold' => 10,
            ]);
        }
        
        $request = new Request([
            'updates' => [
                [
                    'inventory_id' => $inventories[0]->id,
                    'low_stock_threshold' => 15,
                ],
                [
                    'inventory_id' => $inventories[1]->id,
                    'low_stock_threshold' => 20,
                ],
                [
                    'inventory_id' => $inventories[2]->id,
                    'low_stock_threshold' => 25,
                ]
            ]
        ]);
        
        $response = $this->controller->updateThresholds($request);
        
        $this->assertEquals(200, $response->getStatusCode());
        
        // 驗證更新
        foreach ($inventories as $index => $inventory) {
            $inventory->refresh();
            $expectedThreshold = 15 + ($index * 5);
            $this->assertEquals($expectedThreshold, $inventory->low_stock_threshold);
        }
        
        $data = json_decode($response->getContent(), true);
        $this->assertEquals(3, $data['updated_count']);
    }
    
    /**
     * 創建測試用的庫存數據
     */
    private function createTestInventoryData(): void
    {
        // 創建不同狀態的庫存項目
        for ($i = 0; $i < 5; $i++) {
            $product = Product::factory()->create(['name' => "Test Product {$i}"]);
            $variant = ProductVariant::factory()->create([
                'product_id' => $product->id,
                'sku' => "TEST-{$i}",
            ]);
            
            // 創建不同庫存狀態
            $quantity = match($i) {
                0, 1 => 0, // 零庫存
                2 => 2,    // 極低庫存
                3 => 8,    // 低庫存
                default => 50, // 正常庫存
            };
            
            $threshold = 10;
            
            $inventory = Inventory::factory()->create([
                'store_id' => $this->store->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'low_stock_threshold' => $threshold,
            ]);
            
            // 為某些商品創建銷售歷史（用於計算銷售速度）
            if ($i < 3) {
                $this->createSalesHistory($inventory);
            }
        }
    }
    
    /**
     * 創建銷售歷史記錄
     */
    private function createSalesHistory(Inventory $inventory): void
    {
        // 創建過去30天的銷售記錄
        for ($day = 30; $day >= 1; $day--) {
            $salesCount = rand(1, 3); // 每天1-3筆銷售
            
            for ($sale = 0; $sale < $salesCount; $sale++) {
                $createdAt = now()->subDays($day)->addHours(rand(9, 18));
                $quantity = rand(1, 5);
                
                InventoryTransaction::factory()->create([
                    'inventory_id' => $inventory->id,
                    'user_id' => $this->user->id,
                    'type' => InventoryTransaction::TYPE_REDUCTION,
                    'quantity' => -$quantity,
                    'before_quantity' => $inventory->quantity + $quantity,
                    'after_quantity' => $inventory->quantity,
                    'notes' => '測試銷售記錄',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }
}