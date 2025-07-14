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
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Inventory;
use App\Services\RefundService;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class RefundServiceCompleteTest extends TestCase
{
    use RefreshDatabase;

    private RefundService $refundService;
    private User $user;
    private Store $store;
    private Customer $customer;
    private Product $product;
    private ProductVariant $variant;
    private Order $order;
    private OrderItem $orderItem;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        Sanctum::actingAs($this->user);
        
        // 創建基礎數據
        $this->store = Store::factory()->create();
        $this->customer = Customer::factory()->create();
        $this->product = Product::factory()->create();
        $this->variant = ProductVariant::factory()
            ->for($this->product)
            ->create(['cost_price' => 50.00]); // 50.00 in yuan
        
        // 創建庫存
        Inventory::factory()->create([
            'product_variant_id' => $this->variant->id,
            'store_id' => $this->store->id,
            'quantity' => 100
        ]);
        
        // 創建訂單
        $this->order = Order::factory()
            ->for($this->customer)
            ->for($this->store)
            ->create([
                'payment_status' => 'paid',
                'shipping_status' => 'processing',
                'paid_amount' => 10000, // 100.00 in cents
                'grand_total' => 10000
            ]);
        
        // 創建訂單項目
        $this->orderItem = OrderItem::factory()
            ->for($this->order)
            ->for($this->variant, 'productVariant')
            ->create([
                'quantity' => 2,
                'price' => 5000, // 50.00 each
                'total_price' => 10000 // 100.00 total
            ]);
        
        // 創建服務實例
        $inventoryService = app(InventoryService::class);
        $this->refundService = new RefundService($inventoryService);
    }

    public function test_create_refund_successfully_creates_full_refund()
    {
        $refundData = [
            'reason' => '客戶不滿意',
            'notes' => '產品質量問題',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2,
                    'refund_amount' => 10000,
                    'reason' => '質量問題'
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertEquals($this->order->id, $refund->order_id);
        $this->assertEquals(10000, $refund->total_refund_amount);
        $this->assertEquals('客戶不滿意', $refund->reason);
        $this->assertEquals('產品質量問題', $refund->notes);
        $this->assertTrue($refund->should_restock);
        $this->assertEquals($this->user->id, $refund->processed_by);
        
        // 驗證退款項目
        $this->assertCount(1, $refund->refundItems);
        $refundItem = $refund->refundItems->first();
        $this->assertEquals($this->orderItem->id, $refundItem->order_item_id);
        $this->assertEquals(2, $refundItem->quantity);
        $this->assertEquals(10000, $refundItem->refund_amount);
        $this->assertEquals('質量問題', $refundItem->reason);
    }

    public function test_create_refund_with_partial_quantity()
    {
        $refundData = [
            'reason' => '部分商品損壞',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1, // 只退一個
                    'refund_amount' => 5000,
                    'reason' => '商品損壞'
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        $this->assertEquals(5000, $refund->total_refund_amount);
        $this->assertFalse($refund->should_restock);
        
        $refundItem = $refund->refundItems->first();
        $this->assertEquals(1, $refundItem->quantity);
        $this->assertEquals(5000, $refundItem->refund_amount);
    }

    public function test_create_refund_fails_for_unpaid_order()
    {
        $this->order->update(['payment_status' => 'pending']);
        
        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('未付款的訂單無法退款');
        
        $this->refundService->createRefund($this->order, $refundData);
    }

    public function test_create_refund_fails_for_cancelled_order()
    {
        $this->order->update(['shipping_status' => 'cancelled']);
        
        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('已取消的訂單無法退款');
        
        $this->refundService->createRefund($this->order, $refundData);
    }

    public function test_create_refund_fails_for_zero_paid_amount()
    {
        $this->order->update(['paid_amount' => 0]);
        
        $refundData = [
            'reason' => '測試退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('此訂單沒有可退款金額');
        
        $this->refundService->createRefund($this->order, $refundData);
    }

    public function test_create_refund_with_multiple_items()
    {
        // 創建第二個訂單項目
        $variant2 = ProductVariant::factory()
            ->for($this->product)
            ->create(['cost_price' => 30.00]);
        
        $orderItem2 = OrderItem::factory()
            ->for($this->order)
            ->for($variant2, 'productVariant')
            ->create([
                'quantity' => 1,
                'price' => 3000,
                'total_price' => 3000
            ]);
        
        // 更新訂單總額
        $this->order->update([
            'grand_total' => 13000,
            'paid_amount' => 13000
        ]);
        
        $refundData = [
            'reason' => '多品項退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000,
                    'reason' => '品項1退款'
                ],
                [
                    'order_item_id' => $orderItem2->id,
                    'quantity' => 1,
                    'refund_amount' => 3000,
                    'reason' => '品項2退款'
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        $this->assertEquals(8000, $refund->total_refund_amount);
        $this->assertCount(2, $refund->refundItems);
    }

    public function test_create_refund_restocks_inventory_when_requested()
    {
        $initialQuantity = $this->variant->inventories()->where('store_id', $this->store->id)->first()->quantity;
        
        $refundData = [
            'reason' => '庫存回補測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2,
                    'refund_amount' => 10000
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        // 驗證庫存已增加
        $updatedQuantity = $this->variant->inventories()->where('store_id', $this->store->id)->first()->quantity;
        $this->assertEquals($initialQuantity + 2, $updatedQuantity);
        
        $this->assertTrue($refund->should_restock);
    }

    public function test_create_refund_does_not_restock_when_not_requested()
    {
        $initialQuantity = $this->variant->inventories()->where('store_id', $this->store->id)->first()->quantity;
        
        $refundData = [
            'reason' => '不回補庫存測試',
            'should_restock' => false,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        // 驗證庫存未變化
        $updatedQuantity = $this->variant->inventories()->where('store_id', $this->store->id)->first()->quantity;
        $this->assertEquals($initialQuantity, $updatedQuantity);
        
        $this->assertFalse($refund->should_restock);
    }

    public function test_create_refund_updates_order_payment_status_for_full_refund()
    {
        $refundData = [
            'reason' => '全額退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 2,
                    'refund_amount' => 10000 // 全額退款
                ]
            ]
        ];
        
        $this->refundService->createRefund($this->order, $refundData);
        
        $this->order->refresh();
        $this->assertEquals('refunded', $this->order->payment_status);
    }

    public function test_create_refund_updates_order_payment_status_for_partial_refund()
    {
        $refundData = [
            'reason' => '部分退款',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000 // 部分退款
                ]
            ]
        ];
        
        $this->refundService->createRefund($this->order, $refundData);
        
        $this->order->refresh();
        $this->assertEquals('partially_refunded', $this->order->payment_status);
    }

    public function test_create_refund_creates_status_history()
    {
        $refundData = [
            'reason' => '歷史記錄測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->refundService->createRefund($this->order, $refundData);
        
        // 驗證狀態歷史記錄
        $this->assertCount(1, $this->order->statusHistories);
        $history = $this->order->statusHistories->first();
        $this->assertEquals('paid', $history->from_status);
        $this->assertEquals('partially_refunded', $history->to_status);
        $this->assertEquals('payment_status', $history->status_type);
        $this->assertEquals($this->user->id, $history->user_id);
    }

    public function test_create_refund_loads_relationships()
    {
        $refundData = [
            'reason' => '關聯測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        // 驗證已載入關聯
        $this->assertTrue($refund->relationLoaded('refundItems'));
        $this->assertTrue($refund->refundItems->first()->relationLoaded('orderItem'));
    }

    public function test_create_refund_requires_authentication()
    {
        // 登出用戶
        auth()->logout();
        
        $refundData = [
            'reason' => '認證測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行操作');
        
        $this->refundService->createRefund($this->order, $refundData);
    }

    public function test_create_refund_handles_database_transaction()
    {
        $refundData = [
            'reason' => '事務測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        // Mock 庫存服務拋出異常
        $this->mock(InventoryService::class, function ($mock) {
            $mock->shouldReceive('adjustInventory')
                ->andThrow(new \Exception('庫存調整失敗'));
        });
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('庫存調整失敗');
        
        try {
            $this->refundService->createRefund($this->order, $refundData);
        } catch (\Exception $e) {
            // 驗證事務回滾 - 應該沒有創建退款記錄
            $this->assertEquals(0, Refund::count());
            $this->assertEquals(0, RefundItem::count());
            
            // 訂單狀態應該保持不變
            $this->order->refresh();
            $this->assertEquals('paid', $this->order->payment_status);
            
            throw $e;
        }
    }

    public function test_create_refund_with_empty_items_array()
    {
        $refundData = [
            'reason' => '空項目測試',
            'should_restock' => true,
            'items' => []
        ];
        
        $refund = $this->refundService->createRefund($this->order, $refundData);
        
        $this->assertEquals(0, $refund->total_refund_amount);
        $this->assertCount(0, $refund->refundItems);
    }

    public function test_create_refund_preserves_original_order_data()
    {
        $originalOrderData = [
            'grand_total' => $this->order->grand_total,
            'shipping_status' => $this->order->shipping_status,
            'customer_id' => $this->order->customer_id
        ];
        
        $refundData = [
            'reason' => '數據保護測試',
            'should_restock' => true,
            'items' => [
                [
                    'order_item_id' => $this->orderItem->id,
                    'quantity' => 1,
                    'refund_amount' => 5000
                ]
            ]
        ];
        
        $this->refundService->createRefund($this->order, $refundData);
        
        $this->order->refresh();
        
        // 驗證訂單的核心資料未被修改
        $this->assertEquals($originalOrderData['grand_total'], $this->order->grand_total);
        $this->assertEquals($originalOrderData['shipping_status'], $this->order->shipping_status);
        $this->assertEquals($originalOrderData['customer_id'], $this->order->customer_id);
    }
}