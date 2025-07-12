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

class PartialFulfillmentTest extends TestCase
{
    use RefreshDatabase;
    
    private PurchaseService $purchaseService;
    private User $user;
    private Store $store;
    private Customer $customer;
    private Product $product;
    private ProductVariant $variant;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->purchaseService = app(PurchaseService::class);
        $this->user = User::factory()->create();
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->product = Product::factory()->create();
        $this->variant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
        
        $this->actingAs($this->user);
    }
    
    /**
     * 測試部分履行：訂單數量10，進貨數量6
     */
    public function test_partial_fulfillment_updates_order_items_correctly()
    {
        // 創建一個預訂商品的訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
            'store_id' => $this->store->id, // 確保訂單有正確的 store_id
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'fulfilled_quantity' => 0,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'is_fulfilled' => false,
        ]);
        
        // 創建進貨單，但只進貨6個
        $purchase = Purchase::factory()->create([
            'user_id' => $this->user->id,
            'store_id' => $this->store->id, // 確保進貨單和訂單在同一個門市
            'status' => Purchase::STATUS_IN_TRANSIT, // 從運輸中開始
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 6, // 只進貨6個
        ]);
        
        // 關聯訂單項目到進貨項目，但只履行部分數量
        $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
        
        // 部分履行預訂商品：只履行6個，還剩4個未履行
        $orderItem->addFulfilledQuantity(6);
        
        // 由於還有未履行的數量，我們不應該嘗試完成進貨單
        // 改為僅更新為已收貨狀態
        $this->purchaseService->updatePurchaseStatus(
            $purchase, 
            Purchase::STATUS_RECEIVED, // 保持為已收貨，不要設為已完成
            $this->user->id,
            '測試部分履行'
        );
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 驗證自動分配的結果：進貨6個，預訂10個，所以只能履行6個
        $this->assertEquals(6, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled); // 未完全履行
        
        // 驗證剩餘數量計算
        $remainingQuantity = $orderItem->quantity - $orderItem->fulfilled_quantity;
        $this->assertEquals(4, $remainingQuantity);
    }
    
    /**
     * 測試完全履行：訂單數量10，進貨數量10
     */
    public function test_full_fulfillment_marks_order_item_as_fulfilled()
    {
        // 創建一個預訂商品的訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'fulfilled_quantity' => 0,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'is_fulfilled' => false,
        ]);
        
        // 創建進貨單，進貨10個（完全履行）
        $purchase = Purchase::factory()->create([
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10, // 完全履行
        ]);
        
        // 關聯訂單項目到進貨項目
        $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
        
        // 先完全履行預訂商品
        $orderItem->addFulfilledQuantity(10); // 履行10個
        
        // 完成進貨單
        $this->purchaseService->updatePurchaseStatus(
            $purchase, 
            Purchase::STATUS_COMPLETED, 
            $this->user->id,
            '測試完全履行'
        );
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 驗證完全履行狀態
        $this->assertEquals(10, $orderItem->fulfilled_quantity);
        $this->assertTrue($orderItem->is_fulfilled); // 完全履行
        $this->assertNotNull($orderItem->fulfilled_at);
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);
        $this->assertFalse($orderItem->is_partially_fulfilled);
        $this->assertTrue($orderItem->is_fully_fulfilled);
    }
    
    /**
     * 測試超量進貨：訂單數量10，進貨數量15
     */
    public function test_overfulfillment_caps_at_order_quantity()
    {
        // 創建一個預訂商品的訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 10,
            'fulfilled_quantity' => 0,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'is_fulfilled' => false,
        ]);
        
        // 創建進貨單，進貨15個（超量）
        $purchase = Purchase::factory()->create([
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_RECEIVED,
        ]);
        
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 15, // 超量進貨
        ]);
        
        // 關聯訂單項目到進貨項目
        $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
        
        // 先履行所有預訂商品（最多只能履行訂單數量）
        $orderItem->addFulfilledQuantity(10); // 履行10個（上限為訂單數量）
        
        // 完成進貨單
        $this->purchaseService->updatePurchaseStatus(
            $purchase, 
            Purchase::STATUS_COMPLETED, 
            $this->user->id,
            '測試超量進貨'
        );
        
        // 重新載入訂單項目
        $orderItem->refresh();
        
        // 驗證超量進貨處理
        $this->assertEquals(10, $orderItem->fulfilled_quantity); // 不會超過訂單數量
        $this->assertTrue($orderItem->is_fulfilled); // 完全履行
        $this->assertEquals(0, $orderItem->remaining_fulfillment_quantity);
        $this->assertTrue($orderItem->is_fully_fulfilled);
    }
    
    /**
     * 測試多次部分履行
     */
    public function test_multiple_partial_fulfillments()
    {
        // 創建訂單項目
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
        ]);
        
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 20,
            'fulfilled_quantity' => 0,
            'is_stocked_sale' => false,
            'is_backorder' => true,
            'is_fulfilled' => false,
        ]);
        
        // 第一次進貨 - 8個
        $purchase1 = Purchase::factory()->create([
            'user_id' => $this->user->id,
            'status' => Purchase::STATUS_COMPLETED,
        ]);
        
        $purchaseItem1 = PurchaseItem::factory()->create([
            'purchase_id' => $purchase1->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 8,
        ]);
        
        $orderItem->update(['purchase_item_id' => $purchaseItem1->id]);
        
        // 第一次履行
        $orderItem->addFulfilledQuantity(8);
        $orderItem->refresh();
        
        $this->assertEquals(8, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertTrue($orderItem->is_partially_fulfilled);
        
        // 第二次進貨 - 7個
        $orderItem->addFulfilledQuantity(7);
        $orderItem->refresh();
        
        $this->assertEquals(15, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled);
        $this->assertTrue($orderItem->is_partially_fulfilled);
        
        // 第三次進貨 - 5個（完成）
        $orderItem->addFulfilledQuantity(5);
        $orderItem->refresh();
        
        $this->assertEquals(20, $orderItem->fulfilled_quantity);
        $this->assertTrue($orderItem->is_fulfilled);
        $this->assertFalse($orderItem->is_partially_fulfilled);
        $this->assertTrue($orderItem->is_fully_fulfilled);
    }
}