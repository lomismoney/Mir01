<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\OrderService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\ProductVariant;
use App\Models\Product;
use App\Enums\OrderItemType;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderServiceFulfillmentTest extends TestCase
{
    use RefreshDatabase;
    
    private OrderService $orderService;
    private User $user;
    private Customer $customer;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->orderService = app(OrderService::class);
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
        
        // 創建門市（測試需要）
        \App\Models\Store::factory()->create();
        
        $this->actingAs($this->user);
    }
    
    /**
     * 測試現貨商品創建時立即標記為已履行
     */
    public function test_stock_items_are_marked_fulfilled_on_creation()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 為現貨商品創建庫存
        $store = \App\Models\Store::first();
        \App\Models\Inventory::factory()->create([
            'store_id' => $store->id,
            'product_variant_id' => $variant->id,
            'quantity' => 100, // 足夠的庫存
        ]);
        
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'web',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'price' => 1000,
                    'quantity' => 2,
                    'is_stocked_sale' => true,
                    'is_backorder' => false,
                ],
            ],
        ];
        
        $order = $this->orderService->createOrder($orderData);
        
        $orderItem = $order->items->first();
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
        $this->assertTrue($orderItem->is_stocked_sale);
        $this->assertFalse($orderItem->is_backorder);
    }
    
    /**
     * 測試預訂商品創建時不標記為已履行
     */
    public function test_backorder_items_are_not_marked_fulfilled_on_creation()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $store = \App\Models\Store::first();
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'web',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'price' => 1000,
                    'quantity' => 2,
                    'is_stocked_sale' => false,
                    'is_backorder' => true,
                ],
            ],
        ];
        
        $order = $this->orderService->createOrder($orderData);
        
        $orderItem = $order->items->first();
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);
        $this->assertFalse($orderItem->is_stocked_sale);
        $this->assertTrue($orderItem->is_backorder);
    }
    
    /**
     * 測試訂製商品創建時不標記為已履行
     */
    public function test_custom_items_are_not_marked_fulfilled_on_creation()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        $store = \App\Models\Store::first();
        $orderData = [
            'customer_id' => $this->customer->id,
            'store_id' => $store->id,
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'payment_method' => 'cash',
            'order_source' => 'web',
            'shipping_address' => '測試地址',
            'items' => [
                [
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'price' => 1000,
                    'quantity' => 2,
                    'is_stocked_sale' => false,
                    'is_backorder' => false,
                ],
            ],
        ];
        
        $order = $this->orderService->createOrder($orderData);
        
        $orderItem = $order->items->first();
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);
        $this->assertFalse($orderItem->is_stocked_sale);
        $this->assertFalse($orderItem->is_backorder);
    }
    
    /**
     * 測試取消訂單時預訂商品的履行狀態回退
     */
    public function test_cancel_order_reverts_fulfillment_status_for_backorder_items()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建一個訂單，包含一個已履行的預訂商品
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
            'shipping_status' => 'pending',
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'is_fulfilled' => true,
            'fulfilled_at' => now(),
        ]);
        
        // 取消訂單
        $cancelledOrder = $this->orderService->cancelOrder($order, '測試取消');
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 預訂商品的履行狀態應該被回退
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);
    }
    
    /**
     * 測試取消訂單時現貨商品的履行狀態保持不變
     */
    public function test_cancel_order_preserves_fulfillment_status_for_stock_items()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建一個訂單，包含一個已履行的現貨商品
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
            'shipping_status' => 'pending',
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'is_fulfilled' => true,
            'fulfilled_at' => now()->subHour(),
        ]);
        
        // 取消訂單
        $cancelledOrder = $this->orderService->cancelOrder($order, '測試取消');
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 現貨商品的履行狀態應該保持不變
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
    }
    
    /**
     * 測試更新訂單時商品類型變更會重設履行狀態
     */
    public function test_sync_order_items_resets_fulfillment_when_type_changes()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建一個訂單，包含一個現貨商品
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'is_fulfilled' => true,
            'fulfilled_at' => now()->subHour(),
        ]);
        
        // 更新訂單，將現貨商品改為預訂商品
        $updateData = [
            'items' => [
                [
                    'id' => $orderItem->id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'sku' => $variant->sku,
                    'price' => $orderItem->price,
                    'quantity' => $orderItem->quantity,
                    'is_stocked_sale' => false,
                    'is_backorder' => true,
                ],
            ],
        ];
        
        $updatedOrder = $this->orderService->updateOrder($order, $updateData);
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 類型變更後，履行狀態應該重設
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);
        $this->assertFalse($orderItem->is_stocked_sale);
        $this->assertTrue($orderItem->is_backorder);
    }
}