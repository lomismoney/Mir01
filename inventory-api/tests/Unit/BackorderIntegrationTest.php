<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Customer;
use App\Models\User;
use App\Models\InventoryTransfer;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BackorderIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected User $user;
    protected Store $storeA;
    protected Store $storeB;
    protected Customer $customer;
    protected Product $product;
    protected ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->orderService = app(OrderService::class);
        $this->user = User::factory()->create();
        $this->storeA = Store::factory()->create(['name' => '門市A']);
        $this->storeB = Store::factory()->create(['name' => '門市B']);
        $this->customer = Customer::factory()->create();
        $this->product = Product::factory()->create(['name' => '測試商品']);
        $this->variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-001',
        ]);
    }

    /**
     * 測試待進貨商品顯示基本採購狀態
     */
    public function test_backorder_item_shows_basic_purchase_status()
    {
        // 創建一個包含預訂商品的訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'purchase_item_id' => null,
            'quantity' => 5,
        ]);

        // 獲取待進貨商品
        $backorders = $this->orderService->getPendingBackorders();
        
        $this->assertCount(1, $backorders);
        $this->assertEquals('pending_purchase', $backorders->first()['purchase_status']);
        $this->assertEquals('待建立進貨單', $backorders->first()['purchase_status_text']);
    }

    /**
     * 測試待進貨商品同時顯示庫存轉移狀態
     */
    public function test_backorder_item_shows_transfer_status()
    {
        // 創建訂單和預訂商品
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'purchase_item_id' => null,
            'quantity' => 5,
        ]);

        // 創建相關的庫存轉移記錄
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'order_id' => $order->id,
            'quantity' => 5,
            'status' => 'in_transit',
            'notes' => '訂單調貨',
        ]);

        // 獲取待進貨商品（包含轉移資訊）
        $backorders = $this->orderService->getPendingBackordersWithTransfers();
        
        $this->assertCount(1, $backorders);
        $backorderItem = $backorders->first();
        
        // 驗證基本採購狀態
        $this->assertEquals('pending_purchase', $backorderItem->purchase_status);
        
        // 驗證轉移狀態
        $this->assertNotNull($backorderItem->transfer);
        $this->assertEquals('in_transit', $backorderItem->transfer->status);
        $this->assertEquals($transfer->id, $backorderItem->transfer->id);
        
        // 驗證整合狀態
        $this->assertEquals('transfer_in_transit', $backorderItem->integrated_status);
        $this->assertEquals('庫存調撥中', $backorderItem->integrated_status_text);
    }

    /**
     * 測試待進貨商品同時有進貨單和轉移單的狀態顯示
     */
    public function test_backorder_item_with_both_purchase_and_transfer()
    {
        // 創建訂單和預訂商品
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'purchase_item_id' => null,
            'quantity' => 10,
        ]);

        // 創建部分數量的庫存轉移
        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'order_id' => $order->id,
            'quantity' => 3,
            'status' => 'completed',
        ]);

        // 創建進貨單處理剩餘數量
        $purchase = Purchase::factory()->create([
            'store_id' => $this->storeA->id,
            'status' => 'in_transit',
        ]);

        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
            'quantity' => 7,
        ]);

        // 更新訂單項目關聯進貨項目
        $orderItem->update(['purchase_item_id' => $purchaseItem->id]);

        // 獲取待進貨商品
        $backorders = $this->orderService->getPendingBackordersWithTransfers();
        
        // 由於 getPendingBackordersWithTransfers 會過濾掉已有 purchase_item_id 的項目
        // 我們需要直接查詢訂單項目
        $backorderItem = OrderItem::with(['transfer', 'purchaseItem.purchase'])->find($orderItem->id);
        
        // 驗證採購狀態
        $this->assertEquals('in_transit', $backorderItem->purchase_status);
        $this->assertEquals('運送中', $backorderItem->purchase_status_text);
        
        // 驗證轉移狀態
        $this->assertNotNull($backorderItem->transfer);
        $this->assertEquals('completed', $backorderItem->transfer->status);
        
        // 驗證整合狀態優先顯示進貨狀態
        $this->assertEquals('purchase_in_transit', $backorderItem->integrated_status);
        $this->assertEquals('運送中（部分已調貨）', $backorderItem->integrated_status_text);
    }

    /**
     * 測試更新庫存轉移狀態的功能
     */
    public function test_update_transfer_status_from_backorder()
    {
        // 創建測試資料
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'quantity' => 5,
        ]);

        $transfer = InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'order_id' => $order->id,
            'quantity' => 5,
            'status' => 'pending',
        ]);

        // 透過 BackorderService 更新轉移狀態
        $this->actingAs($this->user);
        $result = $this->orderService->updateBackorderTransferStatus(
            $orderItem->id,
            'in_transit',
            '貨品已出發'
        );

        $this->assertTrue($result);
        
        // 驗證轉移狀態已更新
        $transfer->refresh();
        $this->assertEquals('in_transit', $transfer->status);
        $this->assertStringContainsString('貨品已出發', $transfer->notes);
    }

    /**
     * 測試整合狀態的優先級顯示邏輯
     */
    public function test_integrated_status_priority_logic()
    {
        // 測試案例1：只有轉移，顯示轉移狀態
        $orderItem1 = $this->createOrderItemWithTransfer('pending');
        $this->assertEquals('transfer_pending', $orderItem1->integrated_status);

        // 測試案例2：只有進貨，顯示進貨狀態
        $orderItem2 = $this->createOrderItemWithPurchase('confirmed');
        $this->assertEquals('purchase_ordered_from_supplier', $orderItem2->integrated_status);

        // 測試案例3：兩者都有，優先顯示進貨狀態
        $orderItem3 = $this->createOrderItemWithBoth('in_transit', 'completed');
        $this->assertEquals('purchase_in_transit', $orderItem3->integrated_status);

        // 測試案例4：進貨完成但轉移未完成，顯示轉移狀態
        $orderItem4 = $this->createOrderItemWithBoth('completed', 'in_transit');
        $this->assertEquals('transfer_in_transit', $orderItem4->integrated_status);
    }

    /**
     * 輔助方法：創建有轉移的訂單項目
     */
    private function createOrderItemWithTransfer($transferStatus)
    {
        $order = Order::factory()->create();
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
        ]);

        InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'order_id' => $order->id,
            'quantity' => 5,
            'status' => $transferStatus,
        ]);

        return $orderItem->fresh(['transfer']);
    }

    /**
     * 輔助方法：創建有進貨的訂單項目
     */
    private function createOrderItemWithPurchase($purchaseStatus)
    {
        $order = Order::factory()->create();
        $purchase = Purchase::factory()->create(['status' => $purchaseStatus]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);

        return $orderItem->fresh(['purchaseItem.purchase']);
    }

    /**
     * 輔助方法：創建同時有進貨和轉移的訂單項目
     */
    private function createOrderItemWithBoth($purchaseStatus, $transferStatus)
    {
        $order = Order::factory()->create();
        
        // 創建進貨
        $purchase = Purchase::factory()->create(['status' => $purchaseStatus]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->variant->id,
        ]);

        // 創建訂單項目
        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->variant->id,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);

        // 創建轉移
        InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $this->variant->id,
            'order_id' => $order->id,
            'quantity' => 3,
            'status' => $transferStatus,
        ]);

        return $orderItem->fresh(['purchaseItem.purchase', 'transfer']);
    }
    
    /**
     * 測試按訂單分組的功能
     */
    public function test_backorder_list_can_group_by_order()
    {
        // 創建包含多個待進貨商品的訂單
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
            'order_number' => 'ORD-2025-001',
        ]);
        
        // 商品1：有轉移記錄
        $product1 = Product::factory()->create(['name' => '商品A']);
        $variant1 = ProductVariant::factory()->create([
            'product_id' => $product1->id,
            'sku' => 'SKU-A'
        ]);
        
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant1->id,
            'product_name' => $product1->name,
            'sku' => $variant1->sku,
            'quantity' => 2,
            'is_backorder' => true,
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $variant1->id,
            'order_id' => $order->id,
            'quantity' => 2,
            'status' => 'in_transit',
        ]);
        
        // 商品2：沒有轉移記錄
        $product2 = Product::factory()->create(['name' => '商品B']);
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $product2->id,
            'sku' => 'SKU-B'
        ]);
        
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant2->id,
            'product_name' => $product2->name,
            'sku' => $variant2->sku,
            'quantity' => 3,
            'is_backorder' => true,
        ]);
        
        // 取得按訂單分組的待進貨清單
        $result = $this->orderService->getPendingBackordersWithTransfers([
            'group_by_order' => true
        ]);
        
        // 驗證結果
        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $result);
        $this->assertCount(1, $result); // 應該只有一個訂單
        
        $orderGroup = $result->first();
        $this->assertEquals($order->id, $orderGroup['order_id']);
        $this->assertEquals('ORD-2025-001', $orderGroup['order_number']);
        $this->assertEquals($this->customer->name, $orderGroup['customer_name']);
        $this->assertEquals(2, $orderGroup['total_items']); // 兩個商品
        $this->assertEquals(5, $orderGroup['total_quantity']); // 總數量 2+3
        
        // 檢查彙總狀態
        $this->assertEquals('transfer_in_progress', $orderGroup['summary_status']);
        $this->assertEquals('調撥處理中', $orderGroup['summary_status_text']);
        
        // 檢查項目詳情
        $this->assertCount(2, $orderGroup['items']);
        
        $item1 = collect($orderGroup['items'])->firstWhere('id', $orderItem1->id);
        $this->assertNotNull($item1);
        $this->assertEquals('transfer_in_transit', $item1['integrated_status']);
        $this->assertNotNull($item1['transfer']);
        
        $item2 = collect($orderGroup['items'])->firstWhere('id', $orderItem2->id);
        $this->assertNotNull($item2);
        $this->assertEquals('purchase_pending_purchase', $item2['integrated_status']);
        $this->assertNull($item2['transfer']);
    }
    
    /**
     * 測試多個訂單的分組功能
     */
    public function test_multiple_orders_grouped_correctly()
    {
        // 創建兩個不同客戶的訂單
        $customer1 = Customer::factory()->create(['name' => '客戶一']);
        $customer2 = Customer::factory()->create(['name' => '客戶二']);
        
        // 訂單1
        $order1 = Order::factory()->create([
            'store_id' => $this->storeA->id,
            'customer_id' => $customer1->id,
            'order_number' => 'ORD-2025-001',
        ]);
        
        OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $this->variant->id,
            'product_name' => $this->product->name,
            'sku' => $this->variant->sku,
            'quantity' => 1,
            'is_backorder' => true,
        ]);
        
        // 訂單2
        $order2 = Order::factory()->create([
            'store_id' => $this->storeA->id,
            'customer_id' => $customer2->id,
            'order_number' => 'ORD-2025-002',
        ]);
        
        OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $this->variant->id, // 同樣的商品
            'product_name' => $this->product->name,
            'sku' => $this->variant->sku,
            'quantity' => 2,
            'is_backorder' => true,
        ]);
        
        // 取得按訂單分組的待進貨清單
        $result = $this->orderService->getPendingBackordersWithTransfers([
            'group_by_order' => true
        ]);
        
        // 驗證結果
        $this->assertCount(2, $result); // 應該有兩個訂單
        
        $order1Group = $result->firstWhere('order_id', $order1->id);
        $this->assertNotNull($order1Group);
        $this->assertEquals('客戶一', $order1Group['customer_name']);
        $this->assertEquals(1, $order1Group['total_items']);
        $this->assertEquals(1, $order1Group['total_quantity']);
        
        $order2Group = $result->firstWhere('order_id', $order2->id);
        $this->assertNotNull($order2Group);
        $this->assertEquals('客戶二', $order2Group['customer_name']);
        $this->assertEquals(1, $order2Group['total_items']);
        $this->assertEquals(2, $order2Group['total_quantity']);
    }
    
    /**
     * 測試混合狀態的彙總顯示
     */
    public function test_mixed_status_summary()
    {
        $order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'store_id' => $this->storeA->id,
        ]);
        
        // 商品1：調撥中
        $variant1 = ProductVariant::factory()->create();
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant1->id,
            'is_backorder' => true,
        ]);
        
        InventoryTransfer::create([
            'from_store_id' => $this->storeB->id,
            'to_store_id' => $this->storeA->id,
            'user_id' => $this->user->id,
            'product_variant_id' => $variant1->id,
            'order_id' => $order->id,
            'quantity' => 1,
            'status' => 'in_transit',
        ]);
        
        // 商品2：進貨中
        $variant2 = ProductVariant::factory()->create();
        $purchase = Purchase::factory()->create(['status' => 'in_transit']);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $variant2->id,
        ]);
        
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $variant2->id,
            'is_backorder' => true,
            'purchase_item_id' => $purchaseItem->id,
        ]);
        
        // 因為有 purchase_item_id，需要先將其設為 null 才能出現在待進貨清單中
        OrderItem::where('order_id', $order->id)
            ->where('product_variant_id', $variant2->id)
            ->update(['purchase_item_id' => null]);
        
        // 取得按訂單分組的結果
        $result = $this->orderService->getPendingBackordersWithTransfers([
            'group_by_order' => true
        ]);
        
        $orderGroup = $result->first();
        
        // 驗證混合狀態
        $this->assertEquals('transfer_in_progress', $orderGroup['summary_status']);
        $this->assertEquals('調撥處理中', $orderGroup['summary_status_text']);
    }
}