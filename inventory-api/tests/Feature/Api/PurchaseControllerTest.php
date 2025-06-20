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
            'cost_price' => 100.00,
            'average_cost' => 100.00
        ]);
    }

    /** @test */
    public function admin_can_create_purchase_successfully()
    {
        // 準備進貨單數據
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-001',
            'purchased_at' => '2024-01-01T10:00:00+08:00',
            'shipping_cost' => 150.00,
            'status' => 'completed', // 設置為已完成狀態，會自動入庫
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
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
            'total_amount' => 165000, // (10 * 150 + 150) * 100 = 1650 * 100
            'shipping_cost' => 15000 // 150 * 100
        ]);

        // 檢查數據庫中的進貨項目記錄（金額以分為單位存儲）
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'unit_price' => 15000, // 150.00 * 100
            'cost_price' => 15000, // 150.00 * 100
            'allocated_shipping_cost' => 15000 // 150.00 * 100，只有一個項目，所以全部運費分配給它
        ]);

        // 檢查庫存是否正確增加
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertEquals(10, $inventory->quantity);
    }

    /** @test */
    public function admin_can_create_purchase_with_multiple_items()
    {
        // 創建第二個商品變體
        $productVariant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU-002',
            'cost_price' => 200.00,
            'average_cost' => 200.00
        ]);

        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-002',
            'shipping_cost' => 300.00,
            'status' => 'completed', // 設置為已完成狀態，會自動入庫
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 80.00
                ],
                [
                    'product_variant_id' => $productVariant2->id,
                    'quantity' => 5,
                    'cost_price' => 160.00
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
            'allocated_shipping_cost' => 20000 // 200.00 * 100
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $productVariant2->id,
            'allocated_shipping_cost' => 10000 // 100.00 * 100
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

    /** @test */
    public function purchase_creation_requires_valid_store_id()
    {
        $purchaseData = [
            'store_id' => 999999, // 不存在的store_id
            'order_number' => 'PO-20240101-003',
            'shipping_cost' => 150.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['store_id']);
    }

    /** @test */
    public function purchase_creation_requires_valid_product_variant_id()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-004',
            'shipping_cost' => 150.00,
            'items' => [
                [
                    'product_variant_id' => 999999, // 不存在的product_variant_id
                    'quantity' => 10,
                    'cost_price' => 150.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['items.0.product_variant_id']);
    }

    /** @test */
    public function purchase_creation_requires_unique_order_number()
    {
        // 創建一個已存在的進貨單
        Purchase::create([
            'store_id' => $this->store->id,
            'order_number' => 'PO-DUPLICATE-001',
            'total_amount' => 1000.00,
            'shipping_cost' => 100.00,
            'purchased_at' => now()
        ]);

        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-DUPLICATE-001', // 重複的訂單號
            'shipping_cost' => 150.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['order_number']);
    }

    /** @test */
    public function purchase_creation_validates_required_fields()
    {
        // 測試缺少必填字段
        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors([
                     'store_id',
                     'order_number',
                     'shipping_cost',
                     'items'
                 ]);
    }

    /** @test */
    public function purchase_creation_validates_positive_values()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-005',
            'shipping_cost' => -50.00, // 負數運費
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => -5, // 負數數量
                    'cost_price' => -80.00 // 負數成本價
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

    /** @test */
    public function staff_cannot_create_purchase()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-006',
            'shipping_cost' => 150.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
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

    /** @test */
    public function unauthenticated_user_cannot_create_purchase()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-007',
            'shipping_cost' => 150.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
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

    /** @test */
    public function purchase_creation_requires_at_least_one_item()
    {
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-008',
            'shipping_cost' => 150.00,
            'items' => [] // 空的項目陣列
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['items']);
    }

    /** @test */
    public function pending_purchase_does_not_create_inventory()
    {
        // 測試pending狀態的進貨單不會自動入庫
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-009',
            'shipping_cost' => 150.00,
            'status' => 'pending', // 明確設置為pending狀態
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 150.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查進貨單創建成功
        $this->assertDatabaseHas('purchases', [
            'order_number' => 'PO-20240101-009',
            'status' => 'pending'
        ]);

        // 檢查庫存沒有被創建（因為狀態是pending）
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertNull($inventory, '待處理狀態的進貨單不應該創建庫存記錄');
    }

    /** @test */
    public function completed_purchase_creates_inventory_automatically()
    {
        // 測試completed狀態的進貨單會自動入庫
        $purchaseData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-20240101-010',
            'shipping_cost' => 150.00,
            'status' => 'completed', // 設置為completed狀態
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 15,
                    'cost_price' => 120.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查進貨單創建成功
        $this->assertDatabaseHas('purchases', [
            'order_number' => 'PO-20240101-010',
            'status' => 'completed'
        ]);

        // 檢查庫存已經自動創建並增加
        $inventory = Inventory::where('store_id', $this->store->id)
            ->where('product_variant_id', $this->productVariant->id)
            ->first();
        
        $this->assertNotNull($inventory, '已完成狀態的進貨單應該自動創建庫存記錄');
        $this->assertEquals(15, $inventory->quantity, '庫存數量應該正確增加');
    }

    /** @test */
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
                        'total_quantity'
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

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
    public function show_returns_404_for_non_existent_purchase()
    {
        $response = $this->actingAsAdmin()
            ->getJson('/api/purchases/999999');

        $response->assertStatus(404);
    }

    /** @test */
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
            'unit_price' => 100.00,
            'cost_price' => 100.00,
        ]);

        $updateData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-UPDATED-001',
            'shipping_cost' => 200.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'cost_price' => 120.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->putJson('/api/purchases/' . $purchase->id, $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('purchases', [
            'id' => $purchase->id,
            'order_number' => 'PO-UPDATED-001',
            'shipping_cost' => 20000 // 200.00 * 100
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'purchase_id' => $purchase->id,
            'quantity' => 10,
            'cost_price' => 12000 // 120.00 * 100
        ]);
    }

    /** @test */
    public function cannot_update_completed_purchase()
    {
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'status' => 'completed',
        ]);

        $updateData = [
            'store_id' => $this->store->id,
            'order_number' => 'PO-UPDATED-002',
            'shipping_cost' => 100.00,
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 5,
                    'cost_price' => 100.00
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

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
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

    /** @test */
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
                'shipping_cost' => 100.00,
                'items' => [
                    [
                        'product_variant_id' => $this->productVariant->id,
                        'quantity' => 5,
                        'cost_price' => 100.00
                    ]
                ]
            ]);

        $response->assertStatus(403);
    }

    /** @test */
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

    /** @test */
    public function unauthenticated_user_cannot_access_purchases()
    {
        $response = $this->getJson('/api/purchases');
        $response->assertStatus(401);
    }
} 