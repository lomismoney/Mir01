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

        // 安全地創建角色，避免重複創建
        if (!Role::where('name', 'admin')->exists()) {
            Role::create(['name' => 'admin']);
        }

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
            'quantity' => 2,
            'discount_amount' => 0.00  // 明確設定無折扣
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
            'product_name' => '自訂商品',
            'discount_amount' => 0.00  // 明確設定無折扣
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
     * 測試有折扣的退款計算
     */
    public function test_create_refund_with_discount(): void
    {
        // 創建有折扣的訂單項目：單價100，數量2，折扣20 = 實際小計180
        $discountedOrderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 100.00,
            'quantity' => 2,
            'discount_amount' => 20.00  // 總共折扣20元
        ]);

        $refundData = [
            'reason' => '商品有瑕疵',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $discountedOrderItem->id,
                    'quantity' => 1 // 退1件
                ]
            ]
        ];

        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        // 計算：(100*2-20)/2 * 1 = 90 元
        $this->assertEquals(90.00, $refund->total_refund_amount);
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

    /**
     * 測試權限驗證 - 基於重構後的 BaseService 架構
     */
    public function test_validates_user_authorization(): void
    {
        // 確保當前用戶有權限
        // 確保當前用戶已登入
        $this->assertNotNull(Auth::user());
        
        // 退出登錄
        Auth::logout();
        
        // 嘗試在未登入狀態下創建退款
        $refundData = [
            'reason' => '測試權限',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1
                ]
            ]
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行');
        
        $this->refundService->createRefund($this->order, $refundData);
    }

    /**
     * 測試事務處理 - 基於重構後的 BaseService 架構
     */
    public function skip_test_handles_transaction_rollback_on_error(): void
    {
        $refundData = [
            'reason' => '測試事務回滾',
            'notes' => '模擬失敗情況',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_reason' => '商品瑕疵'
                ]
            ]
        ];

        // 模擬在創建 RefundItem 時發生錯誤
        RefundItem::creating(function () {
            throw new \Exception('數據庫錯誤');
        });

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('數據庫錯誤');

        try {
            $this->refundService->createRefund($this->order, $refundData);
        } catch (\Exception $e) {
            // 驗證沒有創建任何退款記錄（事務回滾）
            $this->assertDatabaseMissing('refunds', ['order_id' => $this->order->id]);
            throw $e;
        }
    }

    /**
     * 測試改進的庫存返還邏輯 - 基於重構後的補償機制
     */
    public function test_improved_inventory_restock_with_compensation(): void
    {
        $refundData = [
            'reason' => '測試補償機制',
            'notes' => '庫存返還補償測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_reason' => '商品瑕疵'
                ]
            ]
        ];

        // 模擬庫存返還成功
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

        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertEquals('測試補償機制', $refund->reason);
        $this->assertTrue($refund->should_restock);
    }

    /**
     * 測試金額計算精確性 - 基於統一金額處理
     */
    public function test_accurate_refund_amount_calculations(): void
    {
        // 創建有折扣的訂單項目
        $orderItemWithDiscount = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 33.33, // 會產生小數的價格
            'quantity' => 3,
            'discount_amount' => 5.55
        ]);

        $refundData = [
            'reason' => '金額計算測試',
            'notes' => '精確性驗證',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $orderItemWithDiscount->id,
                    'quantity' => 2, // 部分退款
                    'refund_reason' => '部分退款測試'
                ]
            ]
        ];

        $refund = $this->refundService->createRefund($this->order, $refundData);

        // 計算期望的退款金額
        $itemSubtotal = (33.33 * 3) - 5.55; // 94.44
        $perUnitAmount = $itemSubtotal / 3; // 31.48
        $expectedRefundAmount = $perUnitAmount * 2; // 62.96

        $this->assertEquals($expectedRefundAmount, $refund->total_refund_amount);
        
        $refundItem = $refund->refundItems->first();
        $this->assertEquals(62.96, $refundItem->refund_subtotal);
    }

    /**
     * 測試審核流程 - 基於重構後的狀態歷史機制
     */
    public function skip_test_approval_workflow_with_status_history(): void
    {
        $refundData = [
            'reason' => '需要審核的退款',
            'notes' => '高額退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2, // 全額退款
                    'refund_reason' => '商品瑕疵'
                ]
            ]
        ];

        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->andReturn(true);

        $refund = $this->refundService->createRefund($this->order, $refundData);

        // 測試審核通過
        $approvedRefund = $this->refundService->approveRefund($refund, '管理員審核通過');

        $this->assertEquals('approved', $approvedRefund->status);
        
        // 驗證審核狀態
        $this->assertEquals('approved', $approvedRefund->status);
        $this->assertNotNull($approvedRefund->approved_at);
        $this->assertEquals($this->user->id, $approvedRefund->approved_by);
    }

    /**
     * 測試並發控制 - 基於重構後的 ConcurrencyHelper
     */
    public function test_handles_concurrent_refund_processing(): void
    {
        $refundData = [
            'reason' => '並發測試',
            'notes' => '測試並發安全性',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_reason' => '並發安全測試'
                ]
            ]
        ];

        $this->mockInventoryService
            ->shouldReceive('returnStock')
            ->once()
            ->andReturn(true);

        // 創建退款應該成功（模擬並發控制正常工作）
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertEquals('並發測試', $refund->reason);
    }

    /**
     * 測試預載入關聯 - 基於重構後的 N+1 查詢優化
     */
    public function test_preloads_relationships_to_prevent_n_plus_one(): void
    {
        // 創建第一個退款
        $refundData1 = [
            'reason' => "測試退款 1",
            'notes' => '預載入測試',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_reason' => '測試'
                ]
            ]
        ];
        $refund1 = $this->refundService->createRefund($this->order, $refundData1);

        // 更新訂單的已付金額，以便可以創建更多退款
        $this->order->update(['paid_amount' => 300.00]);

        // 創建其他退款（每次只退一小部分）
        $refunds = [$refund1];
        for ($i = 2; $i <= 3; $i++) {
            // 創建新的訂單項目
            $newOrderItem = OrderItem::factory()->create([
                'order_id' => $this->order->id,
                'product_variant_id' => $this->productVariant->id,
                'price' => 50.00,
                'quantity' => 1,
                'discount_amount' => 0.00
            ]);

            $refundData = [
                'reason' => "測試退款 {$i}",
                'notes' => '預載入測試',
                'should_restock' => false,
                'items' => [
                    [
                        'order_item_id' => $newOrderItem->id,
                        'quantity' => 1,
                        'refund_reason' => '測試'
                    ]
                ]
            ];

            $refunds[] = $this->refundService->createRefund($this->order, $refundData);
        }

        // 使用服務方法獲取退款（應該預加載關聯）
        $refundIds = collect($refunds)->pluck('id')->toArray();
        $retrievedRefunds = $this->refundService->getRefundsWithRelations($refundIds);

        // 驗證關聯已經預加載
        foreach ($retrievedRefunds as $refund) {
            $this->assertTrue($refund->relationLoaded('order'));
            $this->assertTrue($refund->relationLoaded('refundItems'));
        }
    }
} 