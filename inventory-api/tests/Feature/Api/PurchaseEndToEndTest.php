<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;

class PurchaseEndToEndTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function simulates_real_user_scenario_from_screenshot()
    {
        // 設置環境（模擬截圖中的場景）
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create(['name' => '桃園店']);
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        // 創建 iPhone 15 Pro 產品
        $product = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'price' => 45900,
            'cost_price' => 40000 // 預設成本
        ]);
        
        // 創建待進貨訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'product_name' => 'iPhone 15 Pro - IPHONE-15-PRO-黑色-512GB',
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'quantity' => 1,
            'price' => 459.00,
            'is_backorder' => true,
            'is_fulfilled' => false
        ]);

        // 模擬前端提交的數據（完全按照截圖）
        $requestData = [
            'store_id' => $store->id,
            'purchased_at' => '2025-07-18T01:40:00.000Z',
            'shipping_cost' => 1200,
            'notes' => '',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'cost_price' => 43400 // 手動項目的成本
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 42000 // 待進貨項目的成本
                ]
            ]
        ];

        // 發送請求
        $response = $this->postJson('/api/purchases', $requestData);

        // 驗證響應
        $response->assertStatus(201);
        
        $responseData = $response->json('data');
        
        // 驗證基本資訊
        $this->assertNotNull($responseData['id']);
        $this->assertNotNull($responseData['order_number']);
        $this->assertEquals($store->id, $responseData['store_id']);
        $this->assertEquals('pending', $responseData['status']);
        
        // 驗證金額計算
        // 手動: 1 * 43400 = 43400
        // 待進貨: 1 * 42000 = 42000
        // 運費: 1200
        // 總計: 86600（API 返回時已經是元為單位）
        $this->assertEquals(86600.00, $responseData['total_amount']);
        $this->assertEquals(1200.00, $responseData['shipping_cost']);
        
        // 驗證有兩個獨立的項目
        $this->assertCount(2, $responseData['items']);
        
        // 找出手動項目和待進貨項目
        $manualItem = collect($responseData['items'])->firstWhere('cost_price', 43400);
        $backorderItem = collect($responseData['items'])->firstWhere('cost_price', 42000);
        
        $this->assertNotNull($manualItem, '應該有成本價 43400 的手動項目');
        $this->assertNotNull($backorderItem, '應該有成本價 42000 的待進貨項目');
        
        // 驗證數量
        $this->assertEquals(1, $manualItem['quantity']);
        $this->assertEquals(1, $backorderItem['quantity']);
        
        // 驗證資料庫
        $this->assertDatabaseCount('purchases', 1);
        $this->assertDatabaseCount('purchase_items', 2);
        
        // 驗證手動項目（無 order_item_id）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'cost_price' => 4340000, // 43400 * 100
            'unit_price' => 4340000,
            'order_item_id' => null
        ]);
        
        // 驗證待進貨項目（有 order_item_id）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'cost_price' => 4200000, // 42000 * 100
            'unit_price' => 4200000,
            'order_item_id' => $orderItem->id
        ]);
    }

    #[Test]
    public function multiple_same_products_remain_separate()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create();
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'cost_price' => 10000
        ]);

        // 創建進貨單：3個相同產品，不同成本
        $requestData = [
            'store_id' => $store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'cost_price' => 9500 // 批次A：優惠價
                ],
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 2,
                    'cost_price' => 10000 // 批次B：正常價
                ],
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'cost_price' => 10500 // 批次C：急單價
                ]
            ],
            'order_items' => []
        ];

        $response = $this->postJson('/api/purchases', $requestData);

        $response->assertStatus(201);
        
        $items = $response->json('data.items');
        
        // 驗證有3個獨立的項目
        $this->assertCount(3, $items);
        
        // 驗證每個項目的成本價格都被正確保存
        $costs = array_column($items, 'cost_price');
        sort($costs);
        $this->assertEquals([9500, 10000, 10500], $costs);
        
        // 驗證總金額
        // (1 * 9500) + (2 * 10000) + (1 * 10500) = 40000
        // total_amount 返回時已經是元為單位
        $this->assertEquals(40000, $response->json('data.total_amount'));
    }
}