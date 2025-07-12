<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\PurchaseService;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\ProductVariant;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PurchaseServicePartialFulfillmentTest extends TestCase
{
    use RefreshDatabase;
    
    private PurchaseService $purchaseService;
    private User $user;
    private Customer $customer;
    private Store $store;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->purchaseService = app(PurchaseService::class);
        $this->user = User::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->store = Store::factory()->create();
        
        // 創建額外的門市（確保系統正常運作）
        Store::factory()->create();
        
        $this->actingAs($this->user);
    }
    
    /**
     * 測試部分履行功能 - 進貨數量足夠履行所有相關訂單項目
     */
    public function test_mark_related_order_items_as_fulfilled_with_sufficient_quantity()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建進貨單和進貨項目
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 100, // 進貨100件
        ]);
        
        // 創建相關的訂單項目
        $order1 = Order::factory()->create(['customer_id' => $this->customer->id]);
        $order2 = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant->id,
            'quantity' => 30,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        // 執行部分履行
        $this->purchaseService->markRelatedOrderItemsAsFulfilled($purchaseItem);
        
        // 重新載入數據
        $orderItem1->refresh();
        $orderItem2->refresh();
        
        // 驗證結果 - 所有訂單項目都應該完全履行
        $this->assertEquals(30, $orderItem1->fulfilled_quantity);
        $this->assertTrue($orderItem1->is_fulfilled);
        $this->assertNotNull($orderItem1->fulfilled_at);
        
        $this->assertEquals(20, $orderItem2->fulfilled_quantity);
        $this->assertTrue($orderItem2->is_fulfilled);
        $this->assertNotNull($orderItem2->fulfilled_at);
    }
    
    /**
     * 測試部分履行功能 - 進貨數量不足，按優先級分配
     */
    public function test_mark_related_order_items_as_fulfilled_with_insufficient_quantity()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建進貨單和進貨項目
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 35, // 只進貨35件
        ]);
        
        // 創建相關的訂單項目（總需求50件）
        $order1 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(2), // 較早的訂單
        ]);
        $order2 = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(1), // 較晚的訂單
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant->id,
            'quantity' => 30,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        // 執行部分履行
        $this->purchaseService->markRelatedOrderItemsAsFulfilled($purchaseItem);
        
        // 重新載入數據
        $orderItem1->refresh();
        $orderItem2->refresh();
        
        // 驗證結果 - 應該按創建時間優先級分配
        // 第一個訂單項目應該完全履行（30件）
        $this->assertEquals(30, $orderItem1->fulfilled_quantity);
        $this->assertTrue($orderItem1->is_fulfilled);
        $this->assertNotNull($orderItem1->fulfilled_at);
        
        // 第二個訂單項目應該部分履行（5件，剩餘的35-30=5件）
        $this->assertEquals(5, $orderItem2->fulfilled_quantity);
        $this->assertFalse($orderItem2->is_fulfilled); // 未完全履行
        $this->assertNull($orderItem2->fulfilled_at);
    }
    
    /**
     * 測試部分履行功能 - 有些訂單項目已經部分履行
     */
    public function test_mark_related_order_items_as_fulfilled_with_existing_partial_fulfillment()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建進貨單和進貨項目
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 30,
        ]);
        
        // 創建相關的訂單項目，其中一個已經部分履行
        $order1 = Order::factory()->create(['customer_id' => $this->customer->id]);
        $order2 = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $variant->id,
            'quantity' => 20,
            'fulfilled_quantity' => 5, // 已經履行5件
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $variant->id,
            'quantity' => 25,
            'fulfilled_quantity' => 0,
            'is_fulfilled' => false,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        // 執行部分履行
        $this->purchaseService->markRelatedOrderItemsAsFulfilled($purchaseItem);
        
        // 重新載入數據
        $orderItem1->refresh();
        $orderItem2->refresh();
        
        // 驗證結果
        // 第一個訂單項目需要15件（20-5），應該完全履行
        $this->assertEquals(20, $orderItem1->fulfilled_quantity); // 5 + 15 = 20
        $this->assertTrue($orderItem1->is_fulfilled);
        $this->assertNotNull($orderItem1->fulfilled_at);
        
        // 第二個訂單項目應該部分履行剩餘的15件（30-15=15）
        $this->assertEquals(15, $orderItem2->fulfilled_quantity);
        $this->assertFalse($orderItem2->is_fulfilled); // 還需要10件
        $this->assertNull($orderItem2->fulfilled_at);
    }
    
    /**
     * 測試部分履行功能 - 沒有相關的訂單項目
     */
    public function test_mark_related_order_items_as_fulfilled_with_no_related_items()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        
        // 創建進貨單和進貨項目
        $purchase = Purchase::factory()->create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant->id,
            'quantity' => 50,
        ]);
        
        // 不創建任何相關的訂單項目
        
        // 執行部分履行應該不會出錯
        $result = $this->purchaseService->markRelatedOrderItemsAsFulfilled($purchaseItem);
        
        // 應該成功執行，沒有異常
        $this->assertTrue(true);
    }
    
    /**
     * 測試更新訂單項目的履行數量
     */
    public function test_order_item_add_fulfilled_quantity_method()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10,
            'fulfilled_quantity' => 3,
            'is_fulfilled' => false,
        ]);
        
        // 測試增加履行數量但未完全履行
        $result = $orderItem->addFulfilledQuantity(4);
        
        $this->assertTrue($result);
        $this->assertEquals(7, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertNull($orderItem->fulfilled_at);
        
        // 測試增加履行數量至完全履行
        $result = $orderItem->addFulfilledQuantity(3);
        
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity);
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
        
        // 測試增加履行數量超過訂購數量（應該被限制）
        $orderItem->update(['fulfilled_quantity' => 8, 'is_fulfilled' => false, 'fulfilled_at' => null]);
        $result = $orderItem->addFulfilledQuantity(5); // 超過最大數量
        
        $this->assertTrue($result);
        $this->assertEquals(10, $orderItem->fulfilled_quantity); // 應該被限制在10
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertNotNull($orderItem->fulfilled_at);
    }
    
    /**
     * 測試獲取剩餘待履行數量
     */
    public function test_order_item_remaining_fulfillment_quantity_attribute()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 15,
            'fulfilled_quantity' => 6,
        ]);
        
        $this->assertEquals(9, $orderItem->remaining_fulfillment_quantity);
        
        // 測試完全履行的情況
        $orderItem->update(['fulfilled_quantity' => 15]);
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);
        
        // 測試超過數量的情況（理論上不應該發生，但確保不會回傳負數）
        $orderItem->update(['fulfilled_quantity' => 20]);
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);
    }
    
    /**
     * 測試部分履行和完全履行狀態檢查
     */
    public function test_order_item_fulfillment_status_attributes()
    {
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $order = Order::factory()->create(['customer_id' => $this->customer->id]);
        
        // 測試未履行狀態
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant->id,
            'quantity' => 10,
            'fulfilled_quantity' => 0,
        ]);
        
        $this->assertFalse($orderItem->is_partially_fulfilled);
        $this->assertFalse($orderItem->is_fully_fulfilled);
        
        // 測試部分履行狀態
        $orderItem->update(['fulfilled_quantity' => 6]);
        $this->assertTrue($orderItem->is_partially_fulfilled);
        $this->assertFalse($orderItem->is_fully_fulfilled);
        
        // 測試完全履行狀態
        $orderItem->update(['fulfilled_quantity' => 10]);
        $this->assertFalse($orderItem->is_partially_fulfilled); // 已完全履行，不是部分履行
        $this->assertTrue($orderItem->is_fully_fulfilled);
    }
}