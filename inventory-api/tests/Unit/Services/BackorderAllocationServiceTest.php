<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\BackorderAllocationService;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

class BackorderAllocationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected BackorderAllocationService $allocationService;
    protected User $user;
    protected Store $store;
    protected ProductVariant $productVariant;
    protected Customer $vipCustomer;
    protected Customer $normalCustomer;

    protected function setUp(): void
    {
        parent::setUp();

        // 安全地創建角色，避免重複創建
        if (!Role::where('name', 'admin')->exists()) {
            Role::create(['name' => 'admin']);
        }

        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);

        // 創建測試資料
        $this->store = Store::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 100.00
        ]);

        // 創建不同等級的客戶
        $this->vipCustomer = Customer::factory()->create([
            'priority_level' => 'vip',
            'is_priority_customer' => true
        ]);
        
        $this->normalCustomer = Customer::factory()->create([
            'priority_level' => 'normal',
            'is_priority_customer' => false
        ]);

        $this->allocationService = new BackorderAllocationService();
    }

    /**
     * 測試 FIFO 分配策略
     */
    public function test_allocates_with_fifo_strategy(): void
    {
        // 創建多個預訂訂單（不同時間）
        $orders = [];
        for ($i = 0; $i < 3; $i++) {
            $order = Order::factory()->create([
                'customer_id' => $this->normalCustomer->id,
                'store_id' => $this->store->id,
            'shipping_status' => 'pending',
                'shipping_status' => 'pending', // 確保不是 cancelled 或 delivered
                'created_at' => now()->subDays(3 - $i) // 第一個訂單最早
            ]);

            $orderItem = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_variant_id' => $this->productVariant->id,
                'is_backorder' => true,
                'quantity' => 5,
                'fulfilled_quantity' => 0
            ]);

            $orders[] = ['order' => $order, 'orderItem' => $orderItem];
        }

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        // 分配庫存 (只能滿足前兩個訂單)
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'fifo']
        );

        $this->assertIsArray($result);
        $this->assertEquals(2, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(10, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);

        // 驗證第一個和第二個訂單被分配
        $orders[0]['orderItem']->refresh();
        $orders[1]['orderItem']->refresh();
        $orders[2]['orderItem']->refresh();

        $this->assertEquals(5, $orders[0]['orderItem']->fulfilled_quantity);
        $this->assertEquals(5, $orders[1]['orderItem']->fulfilled_quantity);
        $this->assertEquals(0, $orders[2]['orderItem']->fulfilled_quantity); // 未被分配
    }

    /**
     * 測試智能優先級分配策略
     */
    public function test_allocates_with_smart_priority_strategy(): void
    {
        // 創建 VIP 客戶的最新訂單
        $vipOrder = Order::factory()->create([
            'customer_id' => $this->vipCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'priority' => 'high',
            'created_at' => now()->subHours(1) // 最新但高優先級
        ]);

        $vipOrderItem = OrderItem::factory()->create([
            'order_id' => $vipOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 8,
            'fulfilled_quantity' => 0
        ]);

        // 創建普通客戶的較早訂單
        $normalOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'priority' => 'normal',
            'created_at' => now()->subDays(2) // 較早但低優先級
        ]);

        $normalOrderItem = OrderItem::factory()->create([
            'order_id' => $normalOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        // 使用智能優先級分配策略
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'smart_priority']
        );

        $this->assertIsArray($result);
        $this->assertEquals(2, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(10, $result['total_allocated']);

        // 驗證 VIP 客戶優先獲得分配（即使訂單較新）
        $vipOrderItem->refresh();
        $normalOrderItem->refresh();

        $this->assertEquals(8, $vipOrderItem->fulfilled_quantity); // VIP 全額分配
        $this->assertEquals(2, $normalOrderItem->fulfilled_quantity); // 剩餘分配給普通客戶
    }

    /**
     * 測試客戶優先級分配策略
     */
    public function test_allocates_with_customer_priority_strategy(): void
    {
        // 創建多個不同客戶等級的訂單
        $orders = [
            // VIP 客戶
            Order::factory()->create([
                'customer_id' => $this->vipCustomer->id,
                'store_id' => $this->store->id,
            'shipping_status' => 'pending',
                'created_at' => now()->subDays(1)
            ]),
            // 普通客戶
            Order::factory()->create([
                'customer_id' => $this->normalCustomer->id,
                'store_id' => $this->store->id,
            'shipping_status' => 'pending',
                'created_at' => now()->subDays(2) // 更早但優先級低
            ])
        ];

        $orderItems = [];
        foreach ($orders as $order) {
            $orderItems[] = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_variant_id' => $this->productVariant->id,
                'is_backorder' => true,
                'quantity' => 7,
                'fulfilled_quantity' => 0
            ]);
        }

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        // 使用客戶優先級分配策略
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'customer_priority']
        );

        $this->assertIsArray($result);
        $this->assertEquals(2, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(10, $result['total_allocated']);

        // 驗證 VIP 客戶優先
        $orderItems[0]->refresh(); // VIP 客戶
        $orderItems[1]->refresh(); // 普通客戶

        $this->assertEquals(7, $orderItems[0]->fulfilled_quantity); // VIP 全額
        $this->assertEquals(3, $orderItems[1]->fulfilled_quantity); // 普通客戶部分
    }

    /**
     * 測試截止日期優先級分配策略
     */
    public function test_allocates_with_deadline_priority_strategy(): void
    {
        // 創建有截止日期的訂單
        $urgentOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'expected_delivery_date' => now()->addDays(1), // 緊急
            'created_at' => now()->subHours(2)
        ]);

        $normalOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'expected_delivery_date' => now()->addWeeks(1), // 不急
            'created_at' => now()->subDays(1) // 較早但不急
        ]);

        $urgentOrderItem = OrderItem::factory()->create([
            'order_id' => $urgentOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 6,
            'fulfilled_quantity' => 0
        ]);

        $normalOrderItem = OrderItem::factory()->create([
            'order_id' => $normalOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 8,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        // 使用截止日期優先級策略
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'deadline_priority']
        );

        $this->assertIsArray($result);

        // 驗證緊急訂單優先獲得分配
        $urgentOrderItem->refresh();
        $normalOrderItem->refresh();

        $this->assertEquals(6, $urgentOrderItem->fulfilled_quantity); // 緊急訂單全額
        $this->assertEquals(4, $normalOrderItem->fulfilled_quantity); // 普通訂單部分
    }

    /**
     * 測試部分分配情況
     */
    public function test_handles_partial_allocation(): void
    {
        // 為此測試創建專用的產品變體，避免與其他測試衝突
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'PARTIAL-TEST-SKU-001',
            'price' => 100.00
        ]);

        $order = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = OrderItem::factory()->backorder()->create([
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 20,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配（只有部分庫存可用）
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 8, // 少於訂單需求
            'cost_price' => 5000
        ]);

        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'fifo']
        );

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(8, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);

        $orderItem->refresh();
        $this->assertEquals(8, $orderItem->fulfilled_quantity);
        $this->assertFalse($orderItem->is_fulfilled); // 仍未完全履行
    }

    /**
     * 測試無預訂訂單的情況
     */
    public function test_handles_no_backorders(): void
    {
        // 創建進貨項目但沒有預訂訂單
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'fifo']
        );

        $this->assertIsArray($result);
        $this->assertEquals(0, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(0, $result['total_allocated']);
        $this->assertEquals(10, $result['remaining_quantity']); // 全部庫存剩餘
    }

    /**
     * 測試優先級計算準確性
     */
    public function test_calculates_priority_scores_accurately(): void
    {
        // 創建不同條件的訂單來測試優先級計算
        $vipUrgentOrder = Order::factory()->create([
            'customer_id' => $this->vipCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'priority' => 'urgent',
            'expected_delivery_date' => now()->addDays(1),
            'created_at' => now()->subDays(5) // 等待較久
        ]);

        $normalOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'priority' => 'normal',
            'expected_delivery_date' => now()->addWeeks(1),
            'created_at' => now()->subDays(1) // 等待較短
        ]);

        $vipOrderItem = OrderItem::factory()->create([
            'order_id' => $vipUrgentOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        $normalOrderItem = OrderItem::factory()->create([
            'order_id' => $normalOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5, // 只能滿足一個訂單
            'cost_price' => 5000
        ]);

        // 使用智能優先級策略（會計算優先級分數）
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'smart_priority']
        );

        $this->assertIsArray($result);
        $this->assertEquals(1, $result['allocation_summary']['allocated_orders']);

        // VIP + 緊急 + 等待久 + 截止日期近 應該獲得更高優先級
        $vipOrderItem->refresh();
        $normalOrderItem->refresh();

        $this->assertEquals(5, $vipOrderItem->fulfilled_quantity); // VIP 緊急訂單獲得分配
        $this->assertEquals(0, $normalOrderItem->fulfilled_quantity); // 普通訂單未獲得分配
    }

    /**
     * 測試分配結果結構
     */
    public function test_allocation_result_structure(): void
    {
        // 為此測試創建專用的產品變體，避免與其他測試衝突
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'STRUCTURE-TEST-SKU-001',
            'price' => 100.00
        ]);

        $order = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = OrderItem::factory()->backorder()->create([
            'order_id' => $order->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $productVariant->id,
            'quantity' => 5,
            'cost_price' => 5000
        ]);

        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'fifo']
        );

        $this->assertIsArray($result);
        $this->assertArrayHasKey('allocated_items', $result);
        $this->assertArrayHasKey('total_allocated', $result);
        $this->assertArrayHasKey('remaining_quantity', $result);
        $this->assertArrayHasKey('allocation_summary', $result);
        
        $this->assertEquals(1, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(5, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);
    }

    /**
     * 測試獲取分配報告
     */
    public function test_get_allocation_report(): void
    {
        // 創建多個不同優先級的預訂訂單
        $customers = [
            Customer::factory()->create(['priority_level' => 'vip']),
            Customer::factory()->create(['priority_level' => 'high']),
            Customer::factory()->create(['priority_level' => 'normal'])
        ];

        foreach ($customers as $index => $customer) {
            $order = Order::factory()->create([
                'customer_id' => $customer->id,
                'store_id' => $this->store->id,
                'shipping_status' => 'pending',
                'created_at' => now()->subDays($index + 1)
            ]);

            OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_variant_id' => $this->productVariant->id,
                'is_backorder' => true,
                'quantity' => 5,
                'fulfilled_quantity' => 0,
                'created_at' => now()->subDays($index + 1)
            ]);
        }

        $report = $this->allocationService->getAllocationReport($this->productVariant->id);

        $this->assertArrayHasKey('product_variant_id', $report);
        $this->assertArrayHasKey('total_pending_orders', $report);
        $this->assertArrayHasKey('total_pending_quantity', $report);
        $this->assertArrayHasKey('priority_distribution', $report);
        $this->assertArrayHasKey('top_priority_orders', $report);
        $this->assertArrayHasKey('waiting_time_analysis', $report);

        $this->assertEquals($this->productVariant->id, $report['product_variant_id']);
        $this->assertEquals(3, $report['total_pending_orders']);
        $this->assertEquals(15, $report['total_pending_quantity']);
    }

    /**
     * 測試調整優先級分數
     */
    public function test_adjust_priority_score(): void
    {
        // 檢查是否有 allocation_priority_score 欄位
        if (!\Schema::hasColumn('order_items', 'allocation_priority_score')) {
            $this->markTestSkipped('allocation_priority_score欄位不存在，跳過此測試');
        }

        $order = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'allocation_priority_score' => 100
        ]);

        $result = $this->allocationService->adjustPriorityScore(
            $orderItem->id,
            250,
            '手動提高優先級'
        );

        $this->assertTrue($result);

        $orderItem->refresh();
        $this->assertEquals(250, $orderItem->allocation_priority_score);
        $this->assertNotNull($orderItem->allocation_metadata);

        $metadata = json_decode($orderItem->allocation_metadata, true);
        $this->assertTrue($metadata['manual_adjustment']);
        $this->assertEquals(100, $metadata['old_score']);
        $this->assertEquals(250, $metadata['new_score']);
        $this->assertEquals('手動提高優先級', $metadata['reason']);
    }

    /**
     * 測試重新計算優先級分數
     */
    public function test_recalculate_priority_scores(): void
    {
        // 創建多個訂單項目
        $orderItems = [];
        for ($i = 0; $i < 3; $i++) {
            $order = Order::factory()->create([
                'customer_id' => $this->normalCustomer->id,
                'store_id' => $this->store->id,
                'shipping_status' => 'pending'
            ]);

            $orderItems[] = OrderItem::factory()->create([
                'order_id' => $order->id,
                'product_variant_id' => $this->productVariant->id,
                'quantity' => 5,
                'fulfilled_quantity' => 1, // 部分履行
                'allocation_priority_score' => 0 // 初始分數為0
            ]);
        }

        $result = $this->allocationService->recalculatePriorityScores([
            'product_variant_id' => $this->productVariant->id
        ]);

        $this->assertArrayHasKey('total_items', $result);
        $this->assertArrayHasKey('updated_items', $result);
        $this->assertArrayHasKey('strategy', $result);

        $this->assertEquals(3, $result['total_items']);
        $this->assertEquals('smart_priority', $result['strategy']);
    }

    /**
     * 測試獲取可用策略
     */
    public function test_get_available_strategies(): void
    {
        $strategies = BackorderAllocationService::getAvailableStrategies();

        $this->assertIsArray($strategies);
        $this->assertArrayHasKey('fifo', $strategies);
        $this->assertArrayHasKey('smart_priority', $strategies);
        $this->assertArrayHasKey('customer_priority', $strategies);
        $this->assertArrayHasKey('deadline_priority', $strategies);

        foreach ($strategies as $strategy) {
            $this->assertArrayHasKey('name', $strategy);
            $this->assertArrayHasKey('description', $strategy);
            $this->assertArrayHasKey('use_case', $strategy);
        }
    }

    /**
     * 測試模擬分配
     */
    public function test_simulate_allocation(): void
    {
        // 創建預訂訂單
        $order = Order::factory()->create([
            'customer_id' => $this->vipCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 8,
            'fulfilled_quantity' => 0
        ]);

        $result = $this->allocationService->simulateAllocation(
            $this->productVariant->id,
            5, // 可用數量
            ['strategy' => 'smart_priority']
        );

        $this->assertArrayHasKey('simulation_results', $result);
        $this->assertArrayHasKey('total_allocated', $result);
        $this->assertArrayHasKey('remaining_quantity', $result);
        $this->assertArrayHasKey('allocation_efficiency', $result);
        $this->assertArrayHasKey('total_candidates', $result);
        $this->assertArrayHasKey('fulfilled_orders', $result);

        $this->assertEquals(5, $result['total_allocated']);
        $this->assertEquals(0, $result['remaining_quantity']);
        $this->assertEquals(100, $result['allocation_efficiency']);
        $this->assertEquals(1, $result['total_candidates']);
        $this->assertEquals(0, $result['fulfilled_orders']); // 因為只分配了5個，但需要8個

        // 驗證原始訂單項目沒有被修改
        $orderItem->refresh();
        $this->assertEquals(0, $orderItem->fulfilled_quantity);
    }

    /**
     * 測試模擬分配無預訂訂單
     */
    public function test_simulate_allocation_no_backorders(): void
    {
        $result = $this->allocationService->simulateAllocation(
            $this->productVariant->id,
            10
        );

        $this->assertEquals([], $result['simulation_results']);
        $this->assertEquals(0, $result['total_allocated']);
        $this->assertEquals(10, $result['remaining_quantity']);
        $this->assertEquals('沒有待分配的預訂項目', $result['message']);
    }

    /**
     * 測試特殊業務邏輯加分
     */
    public function test_special_business_logic_scoring(): void
    {
        // 創建 VIP 渠道訂單
        $vipChannelOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'order_source' => 'vip_channel'
        ]);

        $vipChannelOrderItem = OrderItem::factory()->create([
            'order_id' => $vipChannelOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0,
            'priority_deadline' => now()->addHours(24) // 特殊截止時間
        ]);

        // 創建普通訂單
        $normalOrder = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending',
            'order_source' => 'web'
        ]);

        $normalOrderItem = OrderItem::factory()->create([
            'order_id' => $normalOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 5, // 只能滿足一個訂單
            'cost_price' => 5000
        ]);

        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            ['strategy' => 'smart_priority']
        );

        // VIP 渠道訂單應該優先獲得分配
        $vipChannelOrderItem->refresh();
        $normalOrderItem->refresh();

        $this->assertEquals(5, $vipChannelOrderItem->fulfilled_quantity);
        $this->assertEquals(0, $normalOrderItem->fulfilled_quantity);
    }

    /**
     * 測試篩選條件
     */
    public function test_allocation_with_filters(): void
    {
        $store2 = Store::factory()->create();

        // 創建不同門市的訂單
        $order1 = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $this->store->id,
            'shipping_status' => 'pending'
        ]);

        $order2 = Order::factory()->create([
            'customer_id' => $this->normalCustomer->id,
            'store_id' => $store2->id,
            'shipping_status' => 'pending'
        ]);

        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $order1->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $order2->id,
            'product_variant_id' => $this->productVariant->id,
            'is_backorder' => true,
            'quantity' => 5,
            'fulfilled_quantity' => 0
        ]);

        // 創建進貨項目用於分配
        $purchase = Purchase::factory()->create(['store_id' => $this->store->id]);
        $purchaseItem = PurchaseItem::factory()->create([
            'purchase_id' => $purchase->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 10,
            'cost_price' => 5000
        ]);

        // 只為特定門市分配
        $result = $this->allocationService->allocateBackorders(
            $purchaseItem,
            [
                'strategy' => 'fifo',
                'store_id' => $this->store->id
            ]
        );

        $this->assertEquals(1, $result['allocation_summary']['allocated_orders']);
        $this->assertEquals(5, $result['total_allocated']);

        $orderItem1->refresh();
        $orderItem2->refresh();

        $this->assertEquals(5, $orderItem1->fulfilled_quantity); // 同門市，被分配
        $this->assertEquals(0, $orderItem2->fulfilled_quantity); // 不同門市，未被分配
    }
}