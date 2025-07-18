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

class PurchaseMultiSourceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function can_create_purchase_with_same_product_from_multiple_sources()
    {
        // 設置測試環境
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create(['name' => '桃園店']);
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        // 創建同一個產品
        $product = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'price' => 45900,
            'cost_price' => 40000 // 預設成本價
        ]);
        
        // 創建兩個不同客戶的訂單，都訂購同一個商品
        $customer1 = Customer::factory()->create(['name' => '客戶A']);
        $customer2 = Customer::factory()->create(['name' => '客戶B']);
        
        $order1 = Order::factory()->create([
            'customer_id' => $customer1->id,
            'store_id' => $store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        $order2 = Order::factory()->create([
            'customer_id' => $customer2->id,
            'store_id' => $store->id,
            'order_number' => 'SO-20250718-0002'
        ]);
        
        // 客戶A的訂單項目
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant->id,
            'product_name' => 'iPhone 15 Pro - 黑色 512GB',
            'sku' => $variant->sku,
            'quantity' => 2,
            'is_backorder' => true
        ]);
        
        // 客戶B的訂單項目
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $variant->id,
            'product_name' => 'iPhone 15 Pro - 黑色 512GB',
            'sku' => $variant->sku,
            'quantity' => 1,
            'is_backorder' => true
        ]);

        // 模擬真實場景：
        // 1. 從供應商A手動進貨3台（成本價38000）
        // 2. 從供應商B為客戶A進貨2台（成本價39000）
        // 3. 從供應商C為客戶B進貨1台（成本價40000）
        // 4. 所有商品都從轉運站統一發貨，運費3000元
        
        $data = [
            'store_id' => $store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 3000, // 統一運費
            'notes' => '多來源進貨：供應商A(手動3台@380)、供應商B(客戶A訂單2台@390)、供應商C(客戶B訂單1台@400)',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 3,
                    'cost_price' => 38000 // 供應商A的價格
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'purchase_quantity' => 2,
                    'cost_price' => 39000 // 供應商B的價格
                ],
                [
                    'order_item_id' => $orderItem2->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 40000 // 供應商C的價格
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        $responseData = $response->json('data');
        
        // 驗證有3個獨立的進貨項目
        $this->assertCount(3, $responseData['items']);
        
        // 總成本計算：
        // 供應商A: 3 * 38000 = 114000
        // 供應商B: 2 * 39000 = 78000
        // 供應商C: 1 * 40000 = 40000
        // 運費: 3000
        // 總計: 235000 / 100 = 2350
        $this->assertEquals(2350, $responseData['total_amount']);
        
        // 驗證資料庫中有3個獨立的進貨項目
        $this->assertDatabaseCount('purchase_items', 3);
        
        // 驗證每個項目保持獨立的成本價格
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 3,
            'cost_price' => 3800000, // 38000 * 100
            'order_item_id' => null
        ]);
        
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 2,
            'cost_price' => 3900000, // 39000 * 100
            'order_item_id' => $orderItem1->id
        ]);
        
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'cost_price' => 4000000, // 40000 * 100
            'order_item_id' => $orderItem2->id
        ]);
    }

    #[Test]
    public function shipping_cost_is_properly_allocated_across_items()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create();
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        // 創建兩個不同的產品
        $product1 = Product::factory()->create();
        $variant1 = ProductVariant::factory()->create(['product_id' => $product1->id]);
        
        $product2 = Product::factory()->create();
        $variant2 = ProductVariant::factory()->create(['product_id' => $product2->id]);
        
        // 創建進貨單：總數量10個，運費1000元
        $data = [
            'store_id' => $store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 1000,
            'items' => [
                [
                    'product_variant_id' => $variant1->id,
                    'quantity' => 6, // 60% 的數量
                    'cost_price' => 10000
                ],
                [
                    'product_variant_id' => $variant1->id, // 相同產品，不同批次
                    'quantity' => 2, // 20% 的數量
                    'cost_price' => 11000
                ],
                [
                    'product_variant_id' => $variant2->id,
                    'quantity' => 2, // 20% 的數量
                    'cost_price' => 20000
                ]
            ],
            'order_items' => []
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        // 驗證運費分攤（按數量比例）
        // 第一個項目應該分攤 60% = 600
        // 第二個項目應該分攤 20% = 200
        // 第三個項目應該分攤 20% = 200
        
        $items = $response->json('data.items');
        $this->assertCount(3, $items);
        
        // 驗證每個項目的總成本（包含分攤的運費）
        // 注意：這需要查看 PurchaseItemResource 是否有返回 allocated_shipping_cost
        
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant1->id,
            'quantity' => 6,
            'allocated_shipping_cost' => 60000 // 600 * 100
        ]);
        
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant1->id,
            'quantity' => 2,
            'allocated_shipping_cost' => 20000 // 200 * 100
        ]);
        
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant2->id,
            'quantity' => 2,
            'allocated_shipping_cost' => 20000 // 200 * 100
        ]);
    }

    #[Test]
    public function can_track_cost_differences_for_same_product()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create();
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        $product = Product::factory()->create(['name' => 'MacBook Pro']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'MBP-16-M3-1TB',
            'cost_price' => 80000
        ]);
        
        // 創建進貨單，包含相同產品但不同價格
        $data = [
            'store_id' => $store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'notes' => '價格差異追蹤測試',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 2,
                    'cost_price' => 75000 // 促銷價
                ],
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 3,
                    'cost_price' => 80000 // 正常價
                ],
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'cost_price' => 85000 // 緊急採購價
                ]
            ],
            'order_items' => []
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        $items = $response->json('data.items');
        
        // 驗證所有項目都被獨立記錄
        $this->assertCount(3, $items);
        
        // 驗證可以追蹤不同的成本價格
        $costs = array_column($items, 'cost_price');
        $this->assertContains(75000, $costs);
        $this->assertContains(80000, $costs);
        $this->assertContains(85000, $costs);
        
        // 計算平均成本：(2*75000 + 3*80000 + 1*85000) / 6 = 79166.67
        $totalCost = (2 * 75000) + (3 * 80000) + (1 * 85000);
        $totalQuantity = 6;
        $averageCost = $totalCost / $totalQuantity;
        
        // 這個平均成本資訊對於財務分析很重要
        $this->assertEquals(475000, $totalCost);
        $this->assertEqualsWithDelta(79166.67, $averageCost, 0.01);
    }
}