<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryTransfer;
use Laravel\Sanctum\Sanctum;

/**
 * 智慧庫存分配系統完整流程測試
 * 
 * 測試場景：
 * 1. 客戶在 A 店下單，但 A 店庫存不足
 * 2. 系統檢測到 B 店有庫存
 * 3. 建議從 B 店調貨到 A 店
 * 4. 建立訂單並自動建立調貨單
 */
class SmartInventoryAllocationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Store $storeA;
    private Store $storeB;
    private Store $storeC;
    private Product $product;
    private ProductVariant $variant;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // 建立測試用戶
        $this->user = User::factory()->admin()->create();
        Sanctum::actingAs($this->user);

        // 建立三個門市
        $this->storeA = Store::factory()->create(['name' => '台中店']);
        $this->storeB = Store::factory()->create(['name' => '台北店']);
        $this->storeC = Store::factory()->create(['name' => '高雄店']);

        // 建立商品和變體
        $this->product = Product::factory()->create(['name' => '測試商品']);
        $this->variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-001',
            'price' => 1000,
        ]);

        // 建立客戶
        $this->customer = Customer::factory()->create(['name' => '測試客戶']);
    }

    /**
     * 測試場景一：單一商品庫存不足，建議從其他門市調貨
     */
    public function test_single_product_shortage_suggests_transfer()
    {
        // 設定庫存：A店無庫存，B店有充足庫存
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 0,
        ]);

        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 50,
        ]);

        // 檢查庫存可用性
        $response = $this->postJson('/api/orders/check-stock-availability', [
            'store_id' => $this->storeA->id,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                ],
            ],
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'has_shortage',
                    'suggestions' => [
                        '*' => [
                            'product_variant_id',
                            'requested_quantity',
                            'available_quantity',
                            'shortage_quantity',
                            'transfer_options',
                            'purchase_suggestion',
                            'mixed_solution',
                        ],
                    ],
                ],
            ])
            ->assertJson([
                'data' => [
                    'has_shortage' => true,
                ],
            ]);

        // 驗證建議內容
        $suggestions = $response->json('data.suggestions');
        $this->assertCount(1, $suggestions);
        $this->assertEquals($this->variant->id, $suggestions[0]['product_variant_id']);
        $this->assertEquals(10, $suggestions[0]['requested_quantity']);
        $this->assertEquals(0, $suggestions[0]['available_quantity']);
        $this->assertEquals(10, $suggestions[0]['shortage_quantity']);
        
        // 應該建議從 B 店調貨
        $this->assertNotEmpty($suggestions[0]['transfer_options']);
        $this->assertEquals($this->storeB->id, $suggestions[0]['transfer_options'][0]['store_id']);
        $this->assertEquals(50, $suggestions[0]['transfer_options'][0]['available_quantity']);
    }

    /**
     * 測試場景二：建立訂單並自動建立調貨單
     */
    public function test_create_order_with_automatic_transfer()
    {
        // 設定庫存
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 0,
        ]);

        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 50,
        ]);

        // 先建立訂單
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 0,
            'tax' => 0,
            'discount_amount' => 0,
            'payment_method' => 'cash',
            'order_source' => 'store',
            'shipping_address' => '測試地址',
            'notes' => '測試訂單',
            'force_create_despite_stock' => 1, // 強制建立
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'is_stocked_sale' => false,
                    'is_backorder' => true, // 標記為預訂商品
                    'status' => 'pending',
                    'custom_specifications' => null,
                    'product_name' => $this->product->name,
                    'sku' => $this->variant->sku,
                    'price' => 1000,
                    'quantity' => 10,
                ],
            ],
        ];

        $orderResponse = $this->postJson('/api/orders', $orderData);
        $orderResponse->assertCreated();
        
        $orderId = $orderResponse->json('data.id');
        $this->assertNotNull($orderId);

        // 建立調貨單
        $transferData = [
            'transfers' => [
                [
                    'from_store_id' => $this->storeB->id,
                    'to_store_id' => $this->storeA->id,
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                    'notes' => '訂單庫存調配',
                    'status' => 'pending',
                ],
            ],
            'order_id' => $orderId,
        ];

        $transferResponse = $this->postJson('/api/inventory/transfers/batch', $transferData);
        $transferResponse->assertCreated()
            ->assertJson([
                'message' => '成功建立 1 筆庫存轉移單',
            ]);

        // 驗證調貨單與訂單的關聯
        $transfer = InventoryTransfer::where('order_id', $orderId)->first();
        $this->assertNotNull($transfer);
        $this->assertEquals($orderId, $transfer->order_id);
        $this->assertEquals($this->storeB->id, $transfer->from_store_id);
        $this->assertEquals($this->storeA->id, $transfer->to_store_id);
        $this->assertEquals(10, $transfer->quantity);
    }

    /**
     * 測試場景三：多商品混合處理（部分調貨、部分進貨）
     */
    public function test_multiple_products_mixed_solution()
    {
        // 建立第二個商品變體
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-002',
            'price' => 2000,
        ]);

        // 設定庫存
        // 商品1：A店無庫存，B店有5個（不足）
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 0,
        ]);
        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 5,
        ]);

        // 商品2：所有門市都無庫存
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $variant2->id,
            'quantity' => 0,
        ]);
        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $variant2->id,
            'quantity' => 0,
        ]);

        // 檢查庫存
        $response = $this->postJson('/api/orders/check-stock-availability', [
            'store_id' => $this->storeA->id,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                ],
                [
                    'product_variant_id' => $variant2->id,
                    'quantity' => 5,
                ],
            ],
        ]);

        $response->assertOk();
        
        $suggestions = $response->json('data.suggestions');
        $this->assertCount(2, $suggestions);

        // 商品1應該有混合解決方案（部分調貨+部分進貨）
        $suggestion1 = collect($suggestions)->firstWhere('product_variant_id', $this->variant->id);
        $this->assertNotNull($suggestion1['mixed_solution']);
        $this->assertEquals(5, $suggestion1['mixed_solution']['transfer_quantity']);
        $this->assertEquals(5, $suggestion1['mixed_solution']['purchase_quantity']);

        // 商品2應該只有進貨建議
        $suggestion2 = collect($suggestions)->firstWhere('product_variant_id', $variant2->id);
        $this->assertNotNull($suggestion2['purchase_suggestion']);
        $this->assertEquals(5, $suggestion2['purchase_suggestion']['suggested_quantity']);
    }

    /**
     * 測試場景四：門市優先級排序（距離、運費等因素）
     */
    public function test_store_priority_in_transfer_suggestions()
    {
        // 三個門市都有庫存，但數量不同
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 0,
        ]);
        
        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 100,
        ]);
        
        Inventory::create([
            'store_id' => $this->storeC->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 50,
        ]);

        $response = $this->postJson('/api/orders/check-stock-availability', [
            'store_id' => $this->storeA->id,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 30,
                ],
            ],
        ]);

        $response->assertOk();
        
        $suggestions = $response->json('data.suggestions.0');
        $transferOptions = $suggestions['transfer_options'];
        
        // 應該有兩個調貨選項
        $this->assertCount(2, $transferOptions);
        
        // 檢查排序（庫存多的優先）
        $this->assertEquals($this->storeB->id, $transferOptions[0]['store_id']);
        $this->assertEquals(100, $transferOptions[0]['available_quantity']);
        $this->assertEquals($this->storeC->id, $transferOptions[1]['store_id']);
        $this->assertEquals(50, $transferOptions[1]['available_quantity']);
    }

    /**
     * 測試場景五：完整的端到端流程
     */
    public function test_end_to_end_smart_allocation_flow()
    {
        // 設定庫存
        Inventory::create([
            'store_id' => $this->storeA->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 3, // 只有3個
        ]);
        
        Inventory::create([
            'store_id' => $this->storeB->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
        ]);

        // Step 1: 檢查庫存
        $checkResponse = $this->postJson('/api/orders/check-stock-availability', [
            'store_id' => $this->storeA->id,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 10,
                ],
            ],
        ]);

        $checkResponse->assertOk()
            ->assertJson([
                'data' => [
                    'has_shortage' => true,
                ],
            ]);

        // Step 2: 建立訂單（使用強制建立）
        $orderResponse = $this->postJson('/api/orders', [
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'shipping_fee' => 0,
            'tax' => 0,
            'discount_amount' => 0,
            'payment_method' => 'cash',
            'order_source' => 'store',
            'shipping_address' => '測試地址',
            'force_create_despite_stock' => 1,
            'items' => [
                [
                    'product_variant_id' => $this->variant->id,
                    'is_stocked_sale' => false,
                    'is_backorder' => true,
                    'status' => 'pending',
                    'product_name' => $this->product->name,
                    'sku' => $this->variant->sku,
                    'price' => 1000,
                    'quantity' => 10,
                ],
            ],
        ]);

        $orderResponse->assertCreated();
        $orderId = $orderResponse->json('data.id');

        // Step 3: 建立調貨單
        $transferResponse = $this->postJson('/api/inventory/transfers/batch', [
            'transfers' => [
                [
                    'from_store_id' => $this->storeB->id,
                    'to_store_id' => $this->storeA->id,
                    'product_variant_id' => $this->variant->id,
                    'quantity' => 7, // 只調7個（10-3）
                    'notes' => '訂單庫存調配',
                    'status' => 'pending',
                ],
            ],
            'order_id' => $orderId,
        ]);

        $transferResponse->assertCreated();

        // Step 4: 驗證結果
        // 檢查訂單
        $order = Order::with(['items', 'inventoryTransfers'])->find($orderId);
        $this->assertNotNull($order);
        $this->assertCount(1, $order->items);
        $this->assertCount(1, $order->inventoryTransfers);

        // 檢查訂單項目
        $orderItem = $order->items->first();
        $this->assertEquals(10, $orderItem->quantity);
        $this->assertTrue($orderItem->is_backorder);

        // 檢查調貨單
        $transfer = $order->inventoryTransfers->first();
        $this->assertEquals(7, $transfer->quantity);
        $this->assertEquals('pending', $transfer->status);
    }
}