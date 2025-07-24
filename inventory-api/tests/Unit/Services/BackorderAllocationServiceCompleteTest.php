<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Customer;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Services\BackorderAllocationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class BackorderAllocationServiceCompleteTest extends TestCase
{
    use RefreshDatabase;

    private BackorderAllocationService $allocationService;
    private User $user;
    private Store $store;
    private Product $product;
    private ProductVariant $variant;
    private Customer $vipCustomer;
    private Customer $normalCustomer;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Sanctum::actingAs($this->user);
        
        // 創建基礎數據
        $this->store = Store::factory()->create();
        $this->product = Product::factory()->create();
        $this->variant = ProductVariant::factory()
            ->for($this->product)
            ->create(['cost_price' => 50.00]);
        
        // 創建不同等級的客戶
        $this->vipCustomer = Customer::factory()->create([
            'name' => 'VIP客戶',
            'email' => 'vip@test.com',
            'priority_level' => 'vip',
            'is_priority_customer' => true
        ]);
        
        $this->normalCustomer = Customer::factory()->create([
            'name' => '普通客戶',
            'email' => 'normal@test.com',
            'priority_level' => 'normal',
            'is_priority_customer' => false
        ]);
        
        // 創建服務實例
        $this->allocationService = app(BackorderAllocationService::class);
    }

    public function test_allocate_backorders_alias_method_works()
    {
        // 創建進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        // 測試向後兼容的方法別名
        $result = $this->allocationService->allocateBackorders($purchaseItem);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('allocated_items', $result);
        $this->assertArrayHasKey('total_allocated', $result);
        $this->assertArrayHasKey('remaining_quantity', $result);
        $this->assertArrayHasKey('allocation_summary', $result);
    }

    public function test_allocate_to_backorders_with_no_pending_backorders()
    {
        // 創建進貨項目但沒有預訂項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertEquals([], $result['allocated_items']);
        $this->assertEquals(0, $result['total_allocated']);
        $this->assertEquals(10, $result['remaining_quantity']);
        $this->assertEquals(0, $result['allocation_summary']['total_candidates']);
        $this->assertEquals(0, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(0, $result['allocation_summary']['fully_fulfilled_orders']);
    }

    public function test_allocate_to_backorders_with_single_backorder()
    {
        // 創建預訂訂單
        $order = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create(['fulfillment_priority' => 'normal']);
        
        $backorderItem = OrderItem::factory()
            ->for($order)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 5,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertCount(1, $result['allocated_items']);
        $this->assertEquals(5, $result['total_allocated']);
        $this->assertEquals(5, $result['remaining_quantity']);
        $this->assertEquals(1, $result['allocation_summary']['total_candidates']);
        $this->assertEquals(1, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(1, $result['allocation_summary']['fully_fulfilled_orders']);
        
        // 驗證分配的項目
        $allocatedItem = $result['allocated_items'][0];
        $this->assertEquals($backorderItem->id, $allocatedItem['order_item_id']);
        $this->assertEquals(5, $allocatedItem['allocated_quantity']);
        $this->assertEquals('fully_fulfilled', $allocatedItem['fulfillment_status']);
    }

    public function test_allocate_to_backorders_with_priority_sorting()
    {
        // 創建高優先級訂單
        $urgentOrder = Order::factory()
            ->for($this->vipCustomer)
            ->for($this->store)
            ->create([
                'fulfillment_priority' => 'urgent',
                'created_at' => now()->subDays(5) // 等待5天
            ]);
        
        $urgentBackorder = OrderItem::factory()
            ->for($urgentOrder)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 3,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建普通優先級訂單
        $normalOrder = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create([
                'fulfillment_priority' => 'normal',
                'created_at' => now()->subDays(1) // 等待1天
            ]);
        
        $normalBackorder = OrderItem::factory()
            ->for($normalOrder)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 3,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建進貨項目（數量不足分配給所有預訂）
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 4]); // 只夠分配給一個完整訂單
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        // 應該優先分配給緊急訂單
        $this->assertCount(1, $result['allocated_items']);
        $this->assertEquals(3, $result['total_allocated']);
        $this->assertEquals(1, $result['remaining_quantity']);
        
        $allocatedItem = $result['allocated_items'][0];
        $this->assertEquals($urgentBackorder->id, $allocatedItem['order_item_id']);
        $this->assertEquals(3, $allocatedItem['allocated_quantity']);
    }

    public function test_allocate_to_backorders_with_partial_allocation()
    {
        // 創建需要大量商品的預訂
        $order = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create();
        
        $backorderItem = OrderItem::factory()
            ->for($order)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 20, // 需要20個
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建數量不足的進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 15]); // 只有15個
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertCount(1, $result['allocated_items']);
        $this->assertEquals(15, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);
        
        $allocatedItem = $result['allocated_items'][0];
        $this->assertEquals($backorderItem->id, $allocatedItem['order_item_id']);
        $this->assertEquals(15, $allocatedItem['allocated_quantity']);
        $this->assertEquals('partially_fulfilled', $allocatedItem['fulfillment_status']);
        
        // 驗證還有5個未分配
        // 驗證訂單項目已部分履行
        $backorderItem->refresh();
        $this->assertEquals(15, $backorderItem->fulfilled_quantity);
        $this->assertEquals(5, $backorderItem->quantity - $backorderItem->fulfilled_quantity);
    }

    public function test_allocate_to_backorders_with_multiple_orders()
    {
        // 創建多個預訂訂單
        $orders = [];
        $backorders = [];
        
        for ($i = 0; $i < 3; $i++) {
            $customer = Customer::factory()->create();
            $order = Order::factory()
                ->for($customer)
                ->for($this->store)
                ->create(['fulfillment_priority' => 'normal']);
            
            $backorder = OrderItem::factory()
                ->for($order)
                ->for($this->variant, 'productVariant')
                ->create([
                    'quantity' => 3,
                    'is_backorder' => true,
                    'purchase_item_id' => null
                ]);
            
            $orders[] = $order;
            $backorders[] = $backorder;
        }
        
        // 創建足夠的進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 9]); // 正好滿足所有需求
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertCount(3, $result['allocated_items']);
        $this->assertEquals(9, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);
        $this->assertEquals(3, $result['allocation_summary']['total_candidates']);
        $this->assertEquals(3, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(3, $result['allocation_summary']['fully_fulfilled_orders']);
    }

    public function test_allocate_to_backorders_with_store_filtering()
    {
        // 創建第二個門市
        $store2 = Store::factory()->create();
        
        // 在第一個門市創建預訂
        $order1 = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create();
        
        $backorder1 = OrderItem::factory()
            ->for($order1)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 5,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 在第二個門市創建預訂
        $order2 = Order::factory()
            ->for($this->normalCustomer)
            ->for($store2)
            ->create();
        
        $backorder2 = OrderItem::factory()
            ->for($order2)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 5,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建第一個門市的進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem, [
            'store_id' => $this->store->id
        ]);
        
        // 應該只分配給第一個門市的預訂
        $this->assertCount(1, $result['allocated_items']);
        $this->assertEquals(5, $result['total_allocated']);
        $this->assertEquals(5, $result['remaining_quantity']);
        
        $allocatedItem = $result['allocated_items'][0];
        $this->assertEquals($backorder1->id, $allocatedItem['order_item_id']);
    }

    public function test_allocate_to_backorders_skips_already_allocated_items()
    {
        // 創建已完全履行的預訂項目
        $purchase = Purchase::factory()->for($this->store)->create();
        
        $order = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create();
        
        $fullyFulfilledBackorder = OrderItem::factory()
            ->for($order)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 5,
                'fulfilled_quantity' => 5, // 已完全履行
                'is_backorder' => true,
            ]);
        
        // 創建部分履行的預訂項目
        $partiallyFulfilledBackorder = OrderItem::factory()
            ->for($order)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 10,
                'fulfilled_quantity' => 7, // 已履行7個，還需要3個
                'is_backorder' => true,
            ]);
        
        // 創建新的進貨項目
        $newPurchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        $result = $this->allocationService->allocateToBackorders($newPurchaseItem);
        
        // 應該只分配給部分履行的項目（還需要3個）
        $this->assertCount(1, $result['allocated_items']);
        $allocatedItem = $result['allocated_items'][0];
        $this->assertEquals($partiallyFulfilledBackorder->id, $allocatedItem['order_item_id']);
        $this->assertEquals(3, $allocatedItem['allocated_quantity']); // 只分配剩餘需要的3個
    }

    public function test_allocate_to_backorders_with_different_priorities()
    {
        // 創建不同優先級的訂單
        $lowOrder = Order::factory()
            ->for($this->normalCustomer)
            ->for($this->store)
            ->create([
                'fulfillment_priority' => 'low',
                'shipping_status' => 'pending',
                'payment_status' => 'pending'
            ]);
        
        $highOrder = Order::factory()
            ->for($this->vipCustomer)
            ->for($this->store)
            ->create([
                'fulfillment_priority' => 'high',
                'shipping_status' => 'pending',
                'payment_status' => 'pending'
            ]);
        
        $urgentOrder = Order::factory()
            ->for($this->vipCustomer)
            ->for($this->store)
            ->create([
                'fulfillment_priority' => 'urgent',
                'shipping_status' => 'pending',
                'payment_status' => 'pending'
            ]);
        
        // 創建預訂項目
        $lowBackorder = OrderItem::factory()
            ->for($lowOrder)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 2,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        $highBackorder = OrderItem::factory()
            ->for($highOrder)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 2,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        $urgentBackorder = OrderItem::factory()
            ->for($urgentOrder)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 2,
                'is_backorder' => true,
                'purchase_item_id' => null
            ]);
        
        // 創建有限的進貨項目
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 4]); // 只夠分配給兩個訂單
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertCount(2, $result['allocated_items']);
        $this->assertEquals(4, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);
        
        // 驗證優先級排序：urgent > high > low
        $allocatedItemIds = array_column($result['allocated_items'], 'order_item_id');
        $this->assertContains($urgentBackorder->id, $allocatedItemIds);
        $this->assertContains($highBackorder->id, $allocatedItemIds);
        $this->assertNotContains($lowBackorder->id, $allocatedItemIds);
    }

    public function test_allocate_to_backorders_requires_authentication()
    {
        // 登出用戶
        auth()->logout();
        
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行操作');
        
        $this->allocationService->allocateToBackorders($purchaseItem);
    }

    public function test_allocate_to_backorders_handles_empty_options()
    {
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10]);
        
        // 測試空選項陣列
        $result = $this->allocationService->allocateToBackorders($purchaseItem, []);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('allocated_items', $result);
    }

    public function test_allocate_to_backorders_allocation_summary_accuracy()
    {
        // 創建混合情況：部分完全分配，部分分配，部分未分配
        $orders = [];
        $backorders = [];
        
        // 第一個訂單：完全分配
        $order1 = Order::factory()->for($this->normalCustomer)->for($this->store)
            ->create(['shipping_status' => 'pending', 'payment_status' => 'pending']);
        $backorder1 = OrderItem::factory()
            ->for($order1)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 3, 'is_backorder' => true, 'purchase_item_id' => null]);
        
        // 第二個訂單：部分分配
        $order2 = Order::factory()->for($this->normalCustomer)->for($this->store)
            ->create(['shipping_status' => 'pending', 'payment_status' => 'pending']);
        $backorder2 = OrderItem::factory()
            ->for($order2)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 10, 'is_backorder' => true, 'purchase_item_id' => null]);
        
        // 第三個訂單：無法分配
        $order3 = Order::factory()->for($this->normalCustomer)->for($this->store)
            ->create(['shipping_status' => 'pending', 'payment_status' => 'pending']);
        $backorder3 = OrderItem::factory()
            ->for($order3)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 5, 'is_backorder' => true, 'purchase_item_id' => null]);
        
        $purchase = Purchase::factory()->for($this->store)->create();
        $purchaseItem = PurchaseItem::factory()
            ->for($purchase)
            ->for($this->variant, 'productVariant')
            ->create(['quantity' => 8]); // 3 + 5 = 8，第三個訂單無法分配
        
        $result = $this->allocationService->allocateToBackorders($purchaseItem);
        
        $this->assertEquals(3, $result['allocation_summary']['total_candidates']);
        $this->assertEquals(2, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(1, $result['allocation_summary']['fully_fulfilled_orders']);
    }
}