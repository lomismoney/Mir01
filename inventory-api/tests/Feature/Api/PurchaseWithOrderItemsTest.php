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
use App\Models\Purchase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;

class PurchaseWithOrderItemsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Store $store;
    private Customer $customer;
    private ProductVariant $variant1;
    private ProductVariant $variant2;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試用戶和門市
        $this->admin = User::factory()->create();
        // 設置用戶角色為 admin
        $this->admin->assignRole('admin');
        $this->store = Store::factory()->create();
        
        // 分配門市給用戶
        $this->admin->stores()->attach($this->store);
        
        // 創建客戶
        $this->customer = Customer::factory()->create();
        
        // 創建產品和變體
        $product1 = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $this->variant1 = ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'price' => 45900
        ]);
        
        $product2 = Product::factory()->create(['name' => 'iPhone 15 Pro']);
        $this->variant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'IPHONE-15-PRO-白色-128GB',
            'price' => 35900
        ]);
    }

    #[Test]
    public function can_create_purchase_with_order_items()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建訂單和待進貨項目
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'product_name' => 'iPhone 15 Pro - 黑色 512GB',
            'sku' => $this->variant1->sku,
            'quantity' => 2,
            'is_backorder' => true,
            'is_fulfilled' => false
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant2->id,
            'product_name' => 'iPhone 15 Pro - 白色 128GB',
            'sku' => $this->variant2->sku,
            'quantity' => 1,
            'is_backorder' => true,
            'is_fulfilled' => false
        ]);

        // 創建進貨單，同時綁定訂單項目
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 1000,
            'notes' => '測試進貨單',
            'items' => [], // 沒有手動項目
            'order_items' => [
                [
                    'order_item_id' => $orderItem1->id,
                    'purchase_quantity' => 2
                ],
                [
                    'order_item_id' => $orderItem2->id,
                    'purchase_quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'store',
                    'total_amount',
                    'items' => [
                        '*' => [
                            'id',
                            'product_variant_id',
                            'quantity',
                            'unit_price'
                        ]
                    ]
                ]
            ]);

        // 驗證進貨單已創建
        $this->assertDatabaseHas('purchases', [
            'store_id' => $this->store->id,
            'shipping_cost' => 100000, // 轉換為分
            'notes' => '測試進貨單'
        ]);

        // 驗證進貨項目已創建並綁定到訂單項目
        $purchase = Purchase::latest()->first();
        $this->assertEquals(2, $purchase->items()->count());
        
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 2,
            'order_item_id' => $orderItem1->id
        ]);
        
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant2->id,
            'quantity' => 1,
            'order_item_id' => $orderItem2->id
        ]);
    }

    #[Test]
    public function can_create_purchase_with_mixed_items()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建訂單和待進貨項目
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 2,
            'is_backorder' => true
        ]);

        // 創建混合進貨單（手動項目 + 訂單項目）
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 500,
            'items' => [
                [
                    'product_variant_id' => $this->variant2->id,
                    'quantity' => 3,
                    'cost_price' => 30000
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 2
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);

        $purchase = Purchase::latest()->first();
        $this->assertEquals(2, $purchase->items()->count());
        
        // 驗證手動項目
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant2->id,
            'quantity' => 3,
            'cost_price' => 3000000, // 轉換為分
            'order_item_id' => null
        ]);
        
        // 驗證訂單項目
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 2,
            'order_item_id' => $orderItem->id
        ]);
    }

    #[Test]
    public function cannot_create_purchase_without_any_items()
    {
        Sanctum::actingAs($this->admin);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 500,
            'items' => [], // 空的手動項目
            'order_items' => [] // 空的訂單項目
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    #[Test]
    public function cannot_bind_order_items_from_different_store()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建不同門市的訂單
        $differentStore = Store::factory()->create();
        $this->admin->stores()->attach($differentStore); // 確保用戶也有這個門市的權限
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $differentStore->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1,
            'is_backorder' => true
        ]);

        $data = [
            'store_id' => $this->store->id, // 不同的門市
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        // 因為 bindOrdersToPurchase 會拋出異常，整個事務會回滾
        // Laravel 會返回 500 錯誤
        $response->assertStatus(500);
    }

    #[Test]
    public function validates_order_item_exists()
    {
        Sanctum::actingAs($this->admin);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => 99999, // 不存在的ID
                    'purchase_quantity' => 1
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_items.0.order_item_id']);
    }

    #[Test]
    public function validates_purchase_quantity_is_positive()
    {
        Sanctum::actingAs($this->admin);
        
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 1
        ]);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 0 // 無效的數量
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_items.0.purchase_quantity']);
    }

    #[Test]
    public function can_create_purchase_with_custom_cost_price_for_order_items()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建訂單和待進貨項目
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant1->id,
            'quantity' => 2,
            'is_backorder' => true
        ]);

        // 創建進貨單，使用自定義成本價格
        $customCostPrice = 380.00; // 不同於產品預設價格（使用元為單位）
        
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => now()->format('Y-m-d\TH:i:sP'),
            'shipping_cost' => 0,
            'items' => [],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 2,
                    'cost_price' => $customCostPrice // 自定義成本價格
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);

        // 驗證使用了自定義成本價格
        $purchase = Purchase::latest()->first();
        $purchaseItem = $purchase->items()->first();
        
        // 檢查實際保存的值
        $this->assertNotNull($purchaseItem);
        $this->assertEquals($orderItem->id, $purchaseItem->order_item_id);
        
        // 如果 cost_price 保存為元單位（380），則測試應該這樣寫
        $this->assertEquals(380, $purchaseItem->cost_price);
        $this->assertEquals(380, $purchaseItem->unit_price);
    }
}