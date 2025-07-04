<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\RefundService;
use App\Services\InventoryService;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Mockery;

class RefundServiceTest extends TestCase
{
    use RefreshDatabase;

    protected RefundService $refundService;
    protected $mockInventoryService;
    protected User $user;
    protected Customer $customer;
    protected Store $store;
    protected ProductVariant $productVariant;
    protected Order $order;
    protected OrderItem $orderItem;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Auth::login($this->user);

        // 創建測試資料
        $this->customer = Customer::factory()->create();
        $this->store = Store::factory()->create();
        
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'TEST-SKU-001',
            'price' => 100.00
        ]);

        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid',
            'shipping_status' => 'delivered',
            'grand_total' => 200.00,
            'paid_amount' => 200.00
        ]);

        // 創建訂單項目
        $this->orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 100.00,
            'quantity' => 2
        ]);

        // Mock 庫存服務
        $this->mockInventoryService = Mockery::mock(InventoryService::class);
        
        // 創建 RefundService 實例
        $this->refundService = new RefundService($this->mockInventoryService);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * 測試成功創建退款
     */
    public function test_create_refund_successfully(): void
    {
        $refundData = [
            'reason' => '商品有瑕疵',
            'notes' => '客戶要求退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // Mock 庫存服務的行為
        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->with(
                $this->productVariant->id,
                1,
                null,
                Mockery::type('string'),
                Mockery::type('array')
            )
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        // 驗證退款記錄
        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertEquals($this->order->id, $refund->order_id);
        $this->assertEquals($this->user->id, $refund->creator_id);
        $this->assertEquals(100.00, $refund->total_refund_amount);
        $this->assertEquals('商品有瑕疵', $refund->reason);
        $this->assertEquals('客戶要求退款', $refund->notes);
        $this->assertTrue($refund->should_restock);

        // 驗證退款項目
        $this->assertCount(1, $refund->refundItems);
        $refundItem = $refund->refundItems->first();
        $this->assertEquals($this->orderItem->id, $refundItem->order_item_id);
        $this->assertEquals(1, $refundItem->quantity);
        $this->assertEquals(100.00, $refundItem->refund_subtotal);

        // 驗證訂單狀態更新
        $this->order->refresh();
        $this->assertEquals(100.00, $this->order->paid_amount);
        $this->assertEquals('partial', $this->order->payment_status);
    }

    /**
     * 測試完全退款
     */
    public function test_create_full_refund(): void
    {
        $refundData = [
            'reason' => '商品不符合描述',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2 // 全部退貨
                ]
            ]
        ];

        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertEquals(200.00, $refund->total_refund_amount);

        // 驗證訂單狀態為完全退款
        $this->order->refresh();
        $this->assertEquals(0.00, $this->order->paid_amount);
        $this->assertEquals('refunded', $this->order->payment_status);
    }

    /**
     * 測試不回補庫存的退款
     */
    public function test_create_refund_without_restock(): void
    {
        $refundData = [
            'reason' => '客戶不滿意',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 不回補庫存時，不應該調用 returnStock
        $this->mockInventoryService
            ->shouldNotReceive('returnStock');

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertFalse($refund->should_restock);
    }

    /**
     * 測試自訂商品退款（無庫存回補）
     */
    public function test_create_refund_for_custom_product(): void
    {
        // 創建自訂商品訂單項目
        $customOrderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => null, // 自訂商品
            'price' => 150.00,
            'quantity' => 1,
            'sku' => 'CUSTOM-001',
            'product_name' => '自訂商品'
        ]);

        $refundData = [
            'reason' => '自訂商品有問題',
            'should_restock' => true, // 即使設為 true，自訂商品也不會回補庫存
            'items' => [
                [
                    'order_item_id' => $customOrderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        // 自訂商品不應該調用庫存回補
        $this->mockInventoryService
            ->shouldNotReceive('returnStock');

        $refund = $this->refundService->createRefund($this->order, $refundData);

        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertEquals(150.00, $refund->total_refund_amount);
    }

    /**
     * 測試退款數量超過可退數量的異常
     */
    public function test_refund_quantity_exceeds_available_quantity(): void
    {
        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 3 // 超過訂單項目的數量 2
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/退貨數量.*超過可退數量/');

        $this->refundService->createRefund($this->order, $refundData);
    }

    /**
     * 測試退款數量為零的異常
     */
    public function test_refund_quantity_zero_throws_exception(): void
    {
        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 0
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('退貨數量必須大於 0');

        $this->refundService->createRefund($this->order, $refundData);
    }

    /**
     * 測試未付款訂單無法退款
     */
    public function test_cannot_refund_unpaid_order(): void
    {
        $unpaidOrder = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'pending',
            'grand_total' => 100.00,
            'paid_amount' => 0.00
        ]);

        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('未付款的訂單無法退款');

        $this->refundService->createRefund($unpaidOrder, $refundData);
    }

    /**
     * 測試已取消訂單無法退款
     */
    public function test_cannot_refund_cancelled_order(): void
    {
        $cancelledOrder = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid',
            'shipping_status' => 'cancelled',
            'grand_total' => 100.00,
            'paid_amount' => 100.00
        ]);

        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('已取消的訂單無法退款');

        $this->refundService->createRefund($cancelledOrder, $refundData);
    }

    /**
     * 測試訂單項目不屬於目標訂單的異常
     */
    public function test_refund_item_not_belongs_to_order(): void
    {
        // 創建另一個訂單和項目
        $anotherOrder = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'payment_status' => 'paid'
        ]);

        $anotherOrderItem = OrderItem::factory()->create([
            'order_id' => $anotherOrder->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 1
        ]);

        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $anotherOrderItem->id, // 屬於不同訂單的項目
                    'quantity' => 1
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/不屬於訂單/');

        $this->refundService->createRefund($this->order, $refundData);
    }

    /**
     * 測試獲取訂單退款歷史
     */
    public function test_get_order_refunds(): void
    {
        // 創建一個退款記錄
        $refund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'total_refund_amount' => 100.00
        ]);

        RefundItem::factory()->create([
            'refund_id' => $refund->id,
            'order_item_id' => $this->orderItem->id,
            'quantity' => 1,
            'refund_subtotal' => 100.00
        ]);

        $refunds = $this->refundService->getOrderRefunds($this->order);

        $this->assertCount(1, $refunds);
        $this->assertEquals($refund->id, $refunds->first()->id);
    }

    /**
     * 測試計算訂單總退款金額
     */
    public function test_get_total_refund_amount(): void
    {
        // 創建多個退款記錄
        Refund::factory()->create([
            'order_id' => $this->order->id,
            'total_refund_amount' => 50.00
        ]);

        Refund::factory()->create([
            'order_id' => $this->order->id,
            'total_refund_amount' => 30.00
        ]);

        $totalRefundAmount = $this->refundService->getTotalRefundAmount($this->order);

        $this->assertEquals(80.00, $totalRefundAmount);
    }

    /**
     * 測試重複退款驗證
     */
    public function test_prevent_duplicate_refund(): void
    {
        // 先創建一個退款
        $firstRefund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'total_refund_amount' => 100.00
        ]);

        RefundItem::factory()->create([
            'refund_id' => $firstRefund->id,
            'order_item_id' => $this->orderItem->id,
            'quantity' => 1,
            'refund_subtotal' => 100.00
        ]);

        // 嘗試再次退款相同項目的剩餘數量
        $refundData = [
            'reason' => '第二次退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2 // 嘗試退款超過剩餘數量
                ]
            ]
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/退貨數量.*超過可退數量/');

        $this->refundService->createRefund($this->order, $refundData);
    }
} 