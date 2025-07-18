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

class PurchaseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function can_create_purchase_with_real_world_data_structure()
    {
        // 設置測試環境
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create(['name' => '桃園店']);
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        // 創建產品
        $product = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'price' => 45900,
            'cost_price' => 40000
        ]);
        
        // 創建客戶和訂單
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        // 創建待進貨訂單項目
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

        // 模擬前端發送的真實數據（根據用戶截圖）
        $data = [
            'store_id' => $store->id,
            'purchased_at' => '2025-07-18T09:40:08.749Z', // 前端的 toISOString() 格式
            'shipping_cost' => 1200,
            'notes' => '測試進貨單備註',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'quantity' => 1,
                    'cost_price' => 43400  // 手動添加的項目，成本價 434 元
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 42000  // 從訂單選擇的項目，成本價 420 元
                ]
            ]
        ];

        // 發送請求
        $response = $this->postJson('/api/purchases', $data);

        // 驗證響應
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'store' => ['id', 'name'],
                    'total_amount',
                    'status',
                    'purchased_at',
                    'shipping_cost',
                    'notes',
                    'items' => [
                        '*' => [
                            'id',
                            'product_variant_id',
                            'quantity',
                            'unit_price',
                            'cost_price'
                        ]
                    ]
                ]
            ]);

        // 驗證響應數據
        $responseData = $response->json('data');
        
        // 不再合併相同的 product_variant_id
        // 總成本: 43400 + 42000 + 1200 = 86600
        // 返回時除以 100 = 866 元
        
        $this->assertEquals(866, $responseData['total_amount']);
        $this->assertEquals(1200, $responseData['shipping_cost']);
        $this->assertEquals('測試進貨單備註', $responseData['notes']);
        $this->assertCount(2, $responseData['items']); // 現在有兩個獨立的項目
        
        // 驗證資料庫
        $this->assertDatabaseHas('purchases', [
            'store_id' => $store->id,
            'shipping_cost' => 120000, // 1200 * 100 分
            'notes' => '測試進貨單備註'
        ]);

        // 現在不會合併相同的 product_variant_id，所以會有兩個獨立的進貨項目
        $this->assertDatabaseCount('purchase_items', 2);
        
        // 驗證手動添加的項目（無 order_item_id）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'cost_price' => 4340000, // 43400 * 100 分
            'unit_price' => 4340000,
            'order_item_id' => null
        ]);
        
        // 驗證從訂單綁定的項目（有 order_item_id）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
            'cost_price' => 4200000, // 42000 * 100 分
            'unit_price' => 4200000,
            'order_item_id' => $orderItem->id
        ]);
    }

    #[Test]
    public function frontend_and_backend_are_properly_integrated()
    {
        // 這個測試確保前後端正確整合
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create();
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'cost_price' => 10000 // 100 元
        ]);

        // 測試各種日期格式
        $dateFormats = [
            '2025-07-18T09:40:08.749Z',        // 毫秒 + Z
            '2025-07-18T09:40:08Z',            // 無毫秒 + Z
            '2025-07-18T17:40:08+08:00',       // 時區偏移
        ];

        foreach ($dateFormats as $dateFormat) {
            $data = [
                'store_id' => $store->id,
                'purchased_at' => $dateFormat,
                'shipping_cost' => 100,
                'items' => [
                    [
                        'product_variant_id' => $variant->id,
                        'quantity' => 1,
                        'cost_price' => 15000
                    ]
                ],
                'order_items' => []
            ];

            $response = $this->postJson('/api/purchases', $data);
            
            $response->assertStatus(201, "Failed with date format: {$dateFormat}");
        }
    }

    #[Test]
    public function validates_business_logic_for_mixed_purchases()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $store = Store::factory()->create();
        $admin->stores()->attach($store);
        
        Sanctum::actingAs($admin);
        
        // 創建多個產品變體
        $product = Product::factory()->create();
        $variant1 = ProductVariant::factory()->create(['product_id' => $product->id]);
        $variant2 = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建多個訂單和項目
        $customer = Customer::factory()->create();
        $order1 = Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $store->id
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant1->id,
            'quantity' => 2,
            'is_backorder' => true
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant2->id,
            'quantity' => 3,
            'is_backorder' => true
        ]);

        // 創建混合進貨單
        $data = [
            'store_id' => $store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 2000,
            'notes' => '混合進貨單測試',
            'items' => [
                [
                    'product_variant_id' => $variant1->id,
                    'quantity' => 5,
                    'cost_price' => 10000
                ],
                [
                    'product_variant_id' => $variant2->id,
                    'quantity' => 10,
                    'cost_price' => 20000
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'purchase_quantity' => 2,
                    'cost_price' => 9000
                ],
                [
                    'order_item_id' => $orderItem2->id,
                    'purchase_quantity' => 3,
                    'cost_price' => 19000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        // 手動項目和訂單項目會根據 product_variant_id 合併
        // variant1: 5 (手動) + 2 (訂單) = 7
        // variant2: 10 (手動) + 3 (訂單) = 13
        $this->assertDatabaseCount('purchase_items', 2);
        
        // 驗證總金額計算
        // 合併後使用手動項目的成本價格
        // variant1: 7 * 10000 = 70000
        // variant2: 13 * 20000 = 260000
        // 運費: 2000
        // 總計: 332000
        // 返回時除以 100 = 3320
        $responseData = $response->json('data');
        $this->assertEquals(3320, $responseData['total_amount']);
    }
}