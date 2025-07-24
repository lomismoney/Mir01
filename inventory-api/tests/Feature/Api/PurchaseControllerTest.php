<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Inventory;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class PurchaseControllerTest extends TestCase
{
    use WithFaker, RefreshDatabase;

    protected $store;
    protected $product;
    protected $productVariant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建基礎測試數據
        $this->store = Store::factory()->create();
        $this->product = Product::factory()->create();
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU-001',
            'cost_price' => 10000,   // 100.00 * 100 = 10000 分
            'average_cost' => 10000  // 100.00 * 100 = 10000 分
        ]);
    }

    #[Test]
    public function admin_can_create_purchase_successfully()
    {
        // 準備進貨單數據
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-001',
            'purchased_at' => '2024-01-01T10:00:00+08:00',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'status' => 'completed', // 設置為已完成狀態，會自動入庫
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        // 以管理員身份發送請求
        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        // 檢查響應狀態 (201 Created)
        $response->assertStatus(201);

        // 檢查響應包含基本字段（實際結構是包在data鍵中）
        $response->assertJsonStructure([
            'data' => [
                'id',
                'order_number',
                'total_amount',
                'shipping_cost',
                'purchased_at',
                'items'
            ]
        ]);

        // 檢查數據庫中的進貨單記錄（金額以分為單位存儲）
        $this->assertDatabaseHas('purchases', [
            'store_id' => $purchaseData['store_id'],
            'order_number' => $purchaseData['order_number'],
            'total_amount' => 165000, // (10 * 150 + 150) * 100 = 165000 分
            'shipping_cost' => 15000  // 150 * 100 = 15000 分
        ]);

        // 檢查數據庫中的進貨項目記錄（金額以分為單位存儲）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'unit_price' => 15000,   // 150.00 * 100 = 15000 分
            'cost_price' => 15000,   // 150.00 * 100 = 15000 分
            'allocated_shipping_cost' => 15000 // 150.00 * 100 = 15000 分，只有一個項目，所以全部運費分配給它
        ]);

        // 檢查庫存是否正確增加
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertEquals(10, $inventory->quantity);
    }

    #[Test]
    public function admin_can_create_purchase_with_multiple_items()
    {
        // 創建第二個商品變體
        $productVariant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU-002',
            'cost_price' => 20000,   // 200.00 * 100 = 20000 分
            'average_cost' => 20000  // 200.00 * 100 = 20000 分
        ]);

        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-002',
            'shipping_cost' => 300.00,  // API 接受元為單位
            'status' => 'completed', // 設置為已完成狀態，會自動入庫
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 80.00  // API 接受元為單位
                ],
                [
                    'product_variant_id' => $productVariant2->id,
                    'quantity' => 5,
                    'cost_price' => 160.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查響應結構
        $response->assertJsonStructure([
            'data' => [
                'id',
                'order_number',
                'total_amount',
                'shipping_cost',
                'purchased_at',
                'items'
            ]
        ]);

        // 檢查運費攤銷計算 (總數量15，第一個項目10/15*300=200，第二個項目5/15*300=100)
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->productVariant->id,
            'allocated_shipping_cost' => 20000 // 200.00 * 100 = 20000 分
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $productVariant2->id,
            'allocated_shipping_cost' => 10000 // 100.00 * 100 = 10000 分
        ]);

        // 檢查庫存是否正確增加
        $inventory1 = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        $this->assertEquals(10, $inventory1->quantity);

        $inventory2 = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $productVariant2->id)
            ->first();
        $this->assertEquals(5, $inventory2->quantity);
    }

    #[Test]
    public function purchase_creation_requires_valid_store_id()
    {
        $purchaseData = [
            'store_id' => 999999, // 不存在的store_id
            'order_number' => 'PO-20240101-003',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['store_id']);
    }

    #[Test]
    public function purchase_creation_requires_valid_product_variant_id()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-004',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => 999999, // 不存在的product_variant_id
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['items.0.product_variant_id']);
    }

    #[Test]
    public function purchase_creation_requires_unique_order_number()
    {
        // 創建一個已存在的進貨單
        Purchase::create([
            'store_id' => $this->store->id,
            'order_number' => 'PO-DUPLICATE-001',
            'total_amount' => 100000,  // 1000.00 * 100 = 100000 分
            'shipping_cost' => 10000,  // 100.00 * 100 = 10000 分
            'purchased_at' => now()
        ]);

        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-DUPLICATE-001', // 重複的訂單號
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['order_number']);
    }

    #[Test]
    public function purchase_creation_validates_required_fields()
    {
        // 測試缺少必填字段
        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'store_id',
                     'shipping_cost',
                     'items'
                 ]);
    }

    #[Test]
    public function purchase_creation_validates_positive_values()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-005',
            'shipping_cost' => -50.00, // 負數運費，API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => -5, // 負數數量
                    'cost_price' => -80.00 // 負數成本價，API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'shipping_cost',
                     'items.0.quantity',
                     'items.0.cost_price'
                 ]);
    }

    #[Test]
    public function staff_cannot_create_purchase()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-006',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsUser()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(403);

        // 確認沒有創建任何記錄
        $this->assertDatabaseMissing('purchases', [
            'order_number' => 'PO-20240101-006'
        ]);
    }

    #[Test]
    public function unauthenticated_user_cannot_create_purchase()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-007',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(401);

        // 確認沒有創建任何記錄
        $this->assertDatabaseMissing('purchases', [
            'order_number' => 'PO-20240101-007'
        ]);
    }

    #[Test]
    public function purchase_creation_requires_at_least_one_item()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-008',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'items' => [] // 空的項目陣列
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['items']);
    }

    #[Test]
    public function pending_purchase_does_not_create_inventory()
    {
        // 測試pending狀態的進貨單不會自動入庫
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-009',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'status' => 'pending', // 明確設置為pending狀態
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查進貨單創建成功
        $purchase = Purchase::latest()->first();
        $this->assertNotNull($purchase);
        $this->assertStringStartsWith('PO-', $purchase->order_number);
        $this->assertEquals('pending', $purchase->status);

        // 檢查庫存沒有被創建（因為狀態是pending）
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertNull($inventory, '待處理狀態的進貨單不應該創建庫存記錄');
    }

    #[Test]
    public function completed_purchase_creates_inventory_automatically()
    {
        // 測試completed狀態的進貨單會自動入庫
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-010',
            'shipping_cost' => 150.00,  // API 接受元為單位
            'status' => 'completed', // 設置為completed狀態
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 15,
                    'cost_price' => 120.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查進貨單創建成功
        $purchase = Purchase::latest()->first();
        $this->assertNotNull($purchase);
        $this->assertStringStartsWith('PO-', $purchase->order_number);
        $this->assertEquals('completed', $purchase->status);

        // 檢查庫存已經自動創建並增加
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertNotNull($inventory, '已完成狀態的進貨單應該自動創建庫存記錄');
        $this->assertEquals(15, $inventory->quantity, '庫存數量應該正確增加');
    }

    #[Test]
    public function admin_can_get_purchases_list()
    {
        // 創建多個進貨單進行測試
        $purchases = Purchase::factory()->count(3)->create([
            'store_id' => $this->store->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'order_number',
                        'store',
                        'total_amount',
                        'shipping_cost',
                        'status',
                        'purchased_at',
                        'items_count',
                        'items_sum_quantity'
                    ]
                ],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total'
                ]
            ]);
    }

    #[Test]
    public function admin_can_filter_purchases_by_store()
    {
        // 創建不同門市的進貨單
        $store2 = Store::factory()->create();
        Purchase::factory()->count(2)->create(['store_id' => $this->store->id]);
        Purchase::factory()->count(3)->create(['store_id' => $store2->id]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases?filter[store_id]=' . $this->store->id);

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    #[Test]
    public function admin_can_filter_purchases_by_status()
    {
        // 創建不同狀態的進貨單
        Purchase::factory()->count(2)->create(['status' => 'pending']);
        Purchase::factory()->count(3)->create(['status' => 'completed']);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases?filter[status]=pending');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }

    #[Test]
    public function admin_can_show_single_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
        ]);

        PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/' . $purchase->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'store',
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
    }

    #[Test]
    public function show_returns_404_for_non_existent_purchase()
    {
        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/999999');

        $response->assertStatus(404);
    }

    #[Test]
    public function admin_can_update_pending_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5,
            'unit_price' => 10000,  // 100.00 * 100 = 10000 分
            'cost_price' => 10000,  // 100.00 * 100 = 10000 分
        ]);

        $updateData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-UPDATED-001',
            'shipping_cost' => 200.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 120.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->putJson('/api/purchases/' . $purchase->id, $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id,
            'order_number' => 'PO-UPDATED-001',
            'shipping_cost' => 20000 // 200.00 * 100 = 20000 分
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'quantity' => 10,
            'cost_price' => 12000 // 120.00 * 100 = 12000 分
        ]);
    }

    #[Test]
    public function cannot_update_completed_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'completed',
        ]);

        $updateData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-UPDATED-002',
            'shipping_cost' => 100.00,  // API 接受元為單位
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 5,
                    'cost_price' => 100.00  // API 接受元為單位
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->putJson('/api/purchases/' . $purchase->id, $updateData);

        $response->assertStatus(422)
            ->assertJson([
                'message' => '進貨單狀態為 已完成，無法修改'
            ]);
    }

    #[Test]
    public function admin_can_update_purchase_status()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsAdmin()
            ->patchJson('/api/purchases/' . $purchase->id . '/status', [
                'status' => 'confirmed'
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id,
            'status' => 'confirmed'
        ]);
    }

    #[Test]
    public function cannot_make_invalid_status_transition()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        // 嘗試從 pending 直接跳到 completed（無效的轉換）
        $response = $this->actingAsAdmin()
            ->patchJson('/api/purchases/' . $purchase->id . '/status', [
                'status' => 'completed'
            ]);

        $response->assertStatus(422);
    }

    #[Test]
    public function admin_can_cancel_pending_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsAdmin()
            ->patchJson('/api/purchases/' . $purchase->id . '/cancel');

        $response->assertStatus(200);

        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id,
            'status' => 'cancelled'
        ]);
    }

    #[Test]
    public function cannot_cancel_completed_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAsAdmin()
            ->patchJson('/api/purchases/' . $purchase->id . '/cancel');

        $response->assertStatus(422)
            ->assertJson([
                'message' => '進貨單狀態為 已完成，無法取消'
            ]);
    }

    #[Test]
    public function admin_can_delete_pending_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsAdmin()
            ->deleteJson('/api/purchases/' . $purchase->id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => '進貨單已刪除'
            ]);

        $this->assertDatabaseMissing('purchases', [
            'id' => $purchase->id
        ]);
    }

    #[Test]
    public function cannot_delete_non_pending_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAsAdmin()
            ->deleteJson('/api/purchases/' . $purchase->id);

        $response->assertStatus(422)
            ->assertJson([
                'message' => '只有待處理狀態的進貨單可以刪除'
            ]);

        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id
        ]);
    }

    #[Test]
    public function staff_cannot_update_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsUser()
            ->putJson('/api/purchases/' . $purchase->id, [
                'store_id' => $this->store->id,
                'order_number' => 'PO-UPDATED-003',
                'shipping_cost' => 100.00,  // API 接受元為單位
                'items' => [
                    [
                        'product_variant_id' => $this->productVariant->id,
                        'quantity' => 5,
                        'cost_price' => 100.00  // API 接受元為單位
                    ]
                ]
            ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function staff_cannot_delete_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAsUser()
            ->deleteJson('/api/purchases/' . $purchase->id);

        $response->assertStatus(403);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_purchases()
    {
        $response = $this->getJson('/api/purchases');
        $response->assertStatus(401);
    }

    // ==================== 新增: 訂單綁定相關測試 ====================

    #[Test]
    public function admin_can_get_bindable_orders()
    {
        // 創建測試訂單和訂單項目
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 0
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/bindable-orders');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'order_number',
                        'customer_name',
                        'items' => [
                            '*' => [
                                'id',
                                'product_variant_id',
                                'pending_quantity',
                                'product_variant' => [
                                    'id',
                                    'sku',
                                    'name'
                                ]
                            ]
                        ]
                    ]
                ]
            ]);
    }

    #[Test]
    public function bindable_orders_can_be_filtered_by_store()
    {
        $store2 = Store::factory()->create();
        $customer = \App\Models\Customer::factory()->create();
        
        // 為不同門市創建訂單
        $order1 = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $order2 = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $store2->id,
            'shipping_status' => 'pending'
        ]);

        \App\Models\OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        \App\Models\OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 3,
            'fulfilled_quantity' => 0
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/bindable-orders?store_id=' . $this->store->id);

        $response->assertStatus(200);
        
        // 應該只返回指定門市的訂單
        $responseData = $response->json('data');
        $this->assertCount(1, $responseData);
        $this->assertEquals($order1->id, $responseData[0]['id']);
    }

    #[Test]
    public function bindable_orders_excludes_fully_fulfilled_items()
    {
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        // 創建一個已完全履行的預訂項目
        \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 10 // 已完全履行
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/bindable-orders');

        $response->assertStatus(200);
        
        // 不應該包含已完全履行的訂單
        $responseData = $response->json('data');
        $this->assertEmpty($responseData);
    }

    #[Test]
    public function admin_can_bind_orders_to_purchase()
    {
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 0
        ]);

        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $bindingData = [
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 8
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases/' . $purchase->id . '/bind-orders', $bindingData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'purchase_id',
                    'bound_items_count',
                    'total_bound_quantity'
                ]
            ]);

        // 檢查數據庫中是否創建了綁定記錄
        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 8,
            'order_item_id' => $orderItem->id
        ]);
    }

    #[Test]
    public function binding_orders_validates_purchase_quantity()
    {
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 0
        ]);

        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $bindingData = [
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 15 // 超過可用數量
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases/' . $purchase->id . '/bind-orders', $bindingData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_items.0.purchase_quantity']);
    }

    #[Test]
    public function cannot_bind_orders_to_completed_purchase()
    {
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 0
        ]);

        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'completed'
        ]);

        $bindingData = [
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 5
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases/' . $purchase->id . '/bind-orders', $bindingData);

        $response->assertStatus(422)
            ->assertJson([
                'message' => '只有待處理或已確認狀態的進貨單可以綁定訂單'
            ]);
    }

    #[Test]
    public function staff_cannot_bind_orders_to_purchase()
    {
        $customer = \App\Models\Customer::factory()->create();
        $order = \App\Models\Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = \App\Models\OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 10,
            'fulfilled_quantity' => 0
        ]);

        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'pending'
        ]);

        $bindingData = [
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 5
                ]
            ]
        ];

        $response = $this->actingAsUser()
            ->postJson('/api/purchases/' . $purchase->id . '/bind-orders', $bindingData);

        $response->assertStatus(403);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_bindable_orders()
    {
        $response = $this->getJson('/api/purchases/bindable-orders');
        $response->assertStatus(401);
    }

    #[Test]
    public function unauthenticated_user_cannot_bind_orders()
    {
        $purchase = Purchase::factory()->create();
        
        $response = $this->postJson('/api/purchases/' . $purchase->id . '/bind-orders', [
            'order_items' => []
        ]);
        
        $response->assertStatus(401);
    }
} 