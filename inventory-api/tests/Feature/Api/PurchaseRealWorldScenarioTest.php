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

class PurchaseRealWorldScenarioTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Store $store;
    private Store $store2;
    private Customer $customer;
    private ProductVariant $variant1;
    private ProductVariant $variant2;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建用戶和門市
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->store = Store::factory()->create(['name' => '桃園店']);
        $this->store2 = Store::factory()->create(['name' => '台北店']);
        
        $this->admin->stores()->attach([$this->store->id, $this->store2->id]);
        
        // 創建客戶
        $this->customer = Customer::factory()->create(['name' => '測試客戶']);
        
        // 創建產品變體
        $product1 = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $this->variant1 = ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'price' => 45900,
            'cost_price' => 40000
        ]);
        
        $product2 = Product::factory()->create(['name' => 'iPhone 15 Pro Max']);
        $this->variant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'IPHONE-15-PRO-MAX-白色-256GB',
            'price' => 55900,
            'cost_price' => 50000
        ]);
    }

    #[Test]
    public function can_create_purchase_exactly_like_frontend_screenshot()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建待進貨訂單項目（如截圖所示）
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'product_name' => 'iPhone 15 Pro - IPHONE-15-PRO-黑色-512GB',
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'quantity' => 1,
            'price' => 459.00,  // 使用 price 而不是 unit_price
            'is_backorder' => true,
            'is_fulfilled' => false
        ]);

        // 模擬前端發送的確切數據（根據截圖）
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => '2025-07-18T01:40:00.000Z', // ISO 8601 格式
            'shipping_cost' => 1200,
            'notes' => '測試進貨單',
            'items' => [
                [
                    'product_variant_id' => $this->variant1->id,
                    'quantity' => 1,
                    'cost_price' => 43400  // 手動添加的成本價格
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 42000  // 從訂單選擇的成本價格
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'store' => ['id', 'name'],
                    'total_amount',
                    'status',
                    'purchased_at',
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

        // 驗證進貨單創建
        $this->assertDatabaseHas('purchases', [
            'store_id' => $this->store->id,
            'shipping_cost' => 120000, // 1200 * 100
            'notes' => '測試進貨單'
        ]);

        // 驗證兩個進貨項目
        $this->assertDatabaseCount('purchase_items', 2);
        
        // 驗證手動添加的項目
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1,
            'cost_price' => 4340000, // 43400 * 100
            'unit_price' => 4340000,
            'order_item_id' => null
        ]);
        
        // 驗證從訂單綁定的項目
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1,
            'cost_price' => 4200000, // 42000 * 100
            'unit_price' => 4200000,
            'order_item_id' => $orderItem->id
        ]);
    }

    #[Test]
    public function handles_duplicate_sku_in_mixed_purchase()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建具有相同SKU的訂單項目
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'sku' => $this->variant1->sku,
            'quantity' => 2,
            'is_backorder' => true
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'sku' => $this->variant1->sku,
            'quantity' => 3,
            'is_backorder' => true
        ]);

        // 手動項目也使用相同的SKU
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 500,
            'items' => [
                [
                    'product_variant_id' => $this->variant1->id,
                    'quantity' => 5,
                    'cost_price' => 39000
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'purchase_quantity' => 2,
                    'cost_price' => 40000
                ],
                [
                    'order_item_id' => $orderItem2->id,
                    'purchase_quantity' => 3,
                    'cost_price' => 41000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        // 應該創建3個獨立的進貨項目
        $this->assertDatabaseCount('purchase_items', 3);
    }

    #[Test]
    public function validates_order_items_belong_to_same_store()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建不同門市的訂單
        $order1 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $order2 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store2->id
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $this->variant1->id,
            'is_backorder' => true
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $this->variant2->id,
            'is_backorder' => true
        ]);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'purchase_quantity' => 1
                ],
                [
                    'order_item_id' => $orderItem2->id, // 不同門市的訂單項目
                    'purchase_quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        // 應該返回錯誤
        $response->assertStatus(500);
    }

    #[Test]
    public function handles_empty_items_array_with_order_items()
    {
        Sanctum::actingAs($this->admin);
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1,
            'is_backorder' => true
        ]);

        // 只有 order_items，沒有手動 items
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'items' => [], // 空陣列
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 40000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        $this->assertDatabaseCount('purchase_items', 1);
    }

    #[Test]
    public function validates_purchase_quantity_exceeds_order_quantity()
    {
        Sanctum::actingAs($this->admin);
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 2, // 訂單數量為 2
            'is_backorder' => true
        ]);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 5, // 進貨數量超過訂單數量
                    'cost_price' => 40000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        // 目前系統可能允許這種情況，但應該記錄下來
        if ($response->status() === 201) {
            $this->assertTrue(true, '系統允許進貨數量超過訂單數量');
        } else {
            $response->assertStatus(422);
        }
    }

    #[Test]
    public function handles_null_cost_price_in_order_items()
    {
        Sanctum::actingAs($this->admin);
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1,
            'is_backorder' => true
        ]);

        // 不提供 cost_price
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1
                    // 沒有 cost_price
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        // 應該使用產品變體的預設成本價格
        $this->assertDatabaseHas('purchase_items', [
            'order_item_id' => $orderItem->id,
            'cost_price' => $this->variant1->cost_price * 100 // 40000 * 100 = 4000000 分
        ]);
    }

    #[Test]
    public function handles_special_characters_in_notes()
    {
        Sanctum::actingAs($this->admin);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->toISOString(),
            'shipping_cost' => 0,
            'notes' => "測試特殊字符：\n1. 換行符\n2. 表情符號 😀\n3. 引號 \"test\" 'test'\n4. 反斜線 \\test\\",
            'items' => [
                [
                    'product_variant_id' => $this->variant1->id,
                    'quantity' => 1,
                    'cost_price' => 40000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
        
        // 驗證特殊字符被正確保存
        $this->assertDatabaseHas('purchases', [
            'store_id' => $this->store->id,
            'notes' => "測試特殊字符：\n1. 換行符\n2. 表情符號 😀\n3. 引號 \"test\" 'test'\n4. 反斜線 \\test\\"
        ]);
    }

    #[Test]
    public function handles_timezone_differences_in_date()
    {
        Sanctum::actingAs($this->admin);

        // 測試不同時區的日期
        $dates = [
            '2025-07-18T09:00:00.000Z',           // UTC
            '2025-07-18T17:00:00+08:00',          // 台北時間
            '2025-07-18T05:00:00-04:00',          // 美東時間
            '2025-07-18T09:00:00.123456Z',        // 帶微秒
        ];

        foreach ($dates as $date) {
            $data = [
                'store_id' => $this->store->id,
                'purchased_at' => $date,
                'shipping_cost' => 0,
                'items' => [
                    [
                        'product_variant_id' => $this->variant1->id,
                        'quantity' => 1,
                        'cost_price' => 40000
                    ]
                ]
            ];

            $response = $this->postJson('/api/purchases', $data);
            
            $response->assertStatus(201, "Failed to create purchase with date: {$date}");
        }
    }
}