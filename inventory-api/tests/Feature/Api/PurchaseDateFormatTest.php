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

class PurchaseDateFormatTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Store $store;
    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        $this->store = Store::factory()->create();
        $this->admin->stores()->attach($this->store);
        
        $product = Product::factory()->create();
        $this->variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU',
            'price' => 10000
        ]);
    }

    #[Test]
    public function can_create_purchase_with_iso8601_date_format_with_milliseconds()
    {
        Sanctum::actingAs($this->admin);

        // 測試前端常見的 ISO 8601 格式（帶毫秒和 Z 時區）
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => '2025-07-18T09:40:08.749Z',
            'shipping_cost' => 1200,
            'notes' => '測試日期格式',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 1,
                    'cost_price' => 43400
                ]
            ],
            'order_items' => []
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'purchased_at'
                ]
            ]);

        $this->assertDatabaseHas('purchases', [
            'store_id' => $this->store->id,
            'shipping_cost' => 120000, // 轉換為分
            'notes' => '測試日期格式'
        ]);
    }

    #[Test]
    public function can_create_purchase_with_iso8601_date_format_without_milliseconds()
    {
        Sanctum::actingAs($this->admin);

        // 測試不帶毫秒的 ISO 8601 格式
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => '2025-07-18T09:40:08Z',
            'shipping_cost' => 0,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 1,
                    'cost_price' => 10000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
    }

    #[Test]
    public function can_create_purchase_with_traditional_date_format()
    {
        Sanctum::actingAs($this->admin);

        // 測試傳統的格式（帶時區偏移）
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => '2025-07-18T17:40:08+08:00',
            'shipping_cost' => 0,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 1,
                    'cost_price' => 10000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201);
    }

    #[Test]
    public function validates_invalid_date_format()
    {
        Sanctum::actingAs($this->admin);

        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => 'invalid-date-format',
            'shipping_cost' => 0,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 1,
                    'cost_price' => 10000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['purchased_at']);
    }

    #[Test]
    public function can_create_mixed_purchase_with_frontend_date_format()
    {
        Sanctum::actingAs($this->admin);
        
        // 創建訂單和待進貨項目（模擬真實場景）
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'order_number' => 'SO-20250718-0001'
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'product_name' => 'iPhone 15 Pro - IPHONE-15-PRO-黑色-512GB',
            'sku' => 'IPHONE-15-PRO-黑色-512GB',
            'quantity' => 1,
            'is_backorder' => true,
            'is_fulfilled' => false
        ]);

        // 模擬前端發送的真實數據結構
        $data = [
            'store_id' => $this->store->id,
            'purchased_at' => '2025-07-18T09:40:08.749Z', // 前端的 toISOString() 格式
            'shipping_cost' => 1200,
            'notes' => '測試混合進貨單',
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 1,
                    'cost_price' => 43400
                ]
            ],
            'order_items' => [
                [
                    'order_item_id' => $orderItem->id,
                    'purchase_quantity' => 1,
                    'cost_price' => 42000
                ]
            ]
        ];

        $response = $this->postJson('/api/purchases', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'order_number',
                    'total_amount',
                    'items'
                ]
            ]);

        // 驗證兩個項目都被創建
        $this->assertDatabaseCount('purchase_items', 2);
    }
}