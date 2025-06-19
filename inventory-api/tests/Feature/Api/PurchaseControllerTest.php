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
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'unit_price' => 299.00,
                    'cost_price' => 150.00
                ]
            ]
        ];

        // 以管理員身份發送請求
        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        // 檢查響應狀態 (201 Created)
        $response->assertStatus(201);

        // 檢查響應包含基本字段
        $response->assertJsonStructure([
            'id',
            'order_number',
            'total_amount',
            'shipping_cost',
            'purchased_at',
            'items'
        ]);

        // 檢查數據庫中的進貨單記錄
        $this->assertDatabaseHas('purchases', [
            'store_id' => $purchaseData['store_id'],
            'order_number' => $purchaseData['order_number'],
            'total_amount' => 2990.00,
            'shipping_cost' => 150.00
        ]);

        // 檢查數據庫中的進貨項目記錄
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'unit_price' => 299.00,
            'cost_price' => 150.00,
            'allocated_shipping_cost' => 150.00 // 只有一個項目，所以全部運費分配給它
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
            'items' => [
                [
                    'product_variant_id' => $this->productVariant->id,
                    'quantity' => 10,
                    'unit_price' => 100.00,
                    'cost_price' => 80.00
                ],
                [
                    'product_variant_id' => $productVariant2->id,
                    'quantity' => 5,
                    'unit_price' => 200.00,
                    'cost_price' => 160.00
                ]
            ]
        ];

        $response = $this->actingAsAdmin()
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);

        // 檢查響應結構
        $response->assertJsonStructure([
            'id',
            'order_number',
            'total_amount',
            'shipping_cost',
            'purchased_at',
            'items'
        ]);

        // 檢查運費攤銷計算 (總數量15，第一個項目10/15*300=200，第二個項目5/15*300=100)
        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $this->productVariant->id,
            'allocated_shipping_cost' => 200.00
        ]);

        $this->assertDatabaseHas('purchase_items', [
            'product_variant_id' => $productVariant2->id,
            'allocated_shipping_cost' => 100.00
        ]);
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
                    'unit_price' => 299.00,
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
                    'unit_price' => 299.00,
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
                    'unit_price' => 299.00,
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
                    'unit_price' => -100.00, // 負數單價
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
                     'items.0.unit_price',
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
                    'unit_price' => 299.00,
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
                    'unit_price' => 299.00,
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
} 