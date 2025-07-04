<?php

namespace Tests\Unit;

use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Refund 模型測試類
 * 
 * 測試退款模型的所有功能，包括關聯、方法、範圍查詢等
 */
class RefundModelTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Order $order;
    protected OrderItem $orderItem;
    protected Product $product;
    protected ProductVariant $productVariant;
    protected Refund $refund;

    /**
     * 在每個測試前設定測試資料
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        
        // 創建測試客戶
        $this->customer = Customer::factory()->create();
        
        // 創建測試商品
        $category = Category::factory()->create();
        $this->product = Product::factory()->create(['category_id' => $category->id]);
        $this->productVariant = ProductVariant::factory()->create(['product_id' => $this->product->id]);
        
        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id,
            'grand_total' => 2000.00
        ]);
        
        // 創建測試訂單項目
        $this->orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 500.00,
            'quantity' => 2
        ]);
        
        // 創建測試退款
        $this->refund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'total_refund_amount' => 1000.00,
            'reason' => '商品有瑕疵',
            'should_restock' => true
        ]);
    }

    /**
     * 測試退款屬於訂單的關聯
     */
    public function test_refund_belongs_to_order(): void
    {
        $this->assertInstanceOf(Order::class, $this->refund->order);
        $this->assertEquals($this->order->id, $this->refund->order->id);
    }

    /**
     * 測試退款屬於創建者的關聯
     */
    public function test_refund_belongs_to_creator(): void
    {
        $this->assertInstanceOf(User::class, $this->refund->creator);
        $this->assertEquals($this->user->id, $this->refund->creator->id);
    }

    /**
     * 測試退款擁有多個退款項目的關聯
     */
    public function test_refund_has_many_refund_items(): void
    {
        // 創建額外的訂單項目以避免唯一約束衝突
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id
        ]);
        
        // 創建退款項目
        $refundItem1 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $this->orderItem->id
        ]);
        
        $refundItem2 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem2->id
        ]);
        
        $this->assertCount(2, $this->refund->refundItems);
        $this->assertTrue($this->refund->refundItems->contains($refundItem1));
        $this->assertTrue($this->refund->refundItems->contains($refundItem2));
    }

    /**
     * 測試可批量賦值的屬性
     */
    public function test_refund_fillable_attributes(): void
    {
        $data = [
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'total_refund_amount' => 500.00,
            'reason' => '客戶不滿意',
            'notes' => '處理退款',
            'should_restock' => false
        ];
        
        $refund = Refund::create($data);
        
        $this->assertEquals($this->order->id, $refund->order_id);
        $this->assertEquals($this->user->id, $refund->creator_id);
        $this->assertEquals(500.00, $refund->total_refund_amount);
        $this->assertEquals('客戶不滿意', $refund->reason);
        $this->assertEquals('處理退款', $refund->notes);
        $this->assertFalse($refund->should_restock);
    }

    /**
     * 測試屬性轉換
     */
    public function test_refund_casts(): void
    {
        // 在 SQLite 中，decimal 類型會返回字符串，需要手動轉換
        $this->assertIsNumeric($this->refund->total_refund_amount);
        $this->assertIsBool($this->refund->should_restock);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->refund->created_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->refund->updated_at);
    }

    /**
     * 測試預設屬性值
     */
    public function test_refund_default_attributes(): void
    {
        $refund = new Refund();
        
        $this->assertEquals(0, $refund->total_refund_amount);
        $this->assertTrue($refund->should_restock);
    }

    /**
     * 測試依據訂單篩選的範圍查詢
     */
    public function test_for_order_scope(): void
    {
        // 創建另一個訂單的退款
        $anotherOrder = Order::factory()->create(['customer_id' => $this->customer->id]);
        $anotherRefund = Refund::factory()->create(['order_id' => $anotherOrder->id]);
        
        $refunds = Refund::forOrder($this->order->id)->get();
        
        $this->assertCount(1, $refunds);
        $this->assertEquals($this->refund->id, $refunds->first()->id);
        $this->assertFalse($refunds->contains($anotherRefund));
    }

    /**
     * 測試依據創建者篩選的範圍查詢
     */
    public function test_by_creator_scope(): void
    {
        // 創建另一個用戶的退款
        $anotherUser = User::factory()->create();
        $anotherRefund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $anotherUser->id
        ]);
        
        $refunds = Refund::byCreator($this->user->id)->get();
        
        $this->assertCount(1, $refunds);
        $this->assertEquals($this->refund->id, $refunds->first()->id);
        $this->assertFalse($refunds->contains($anotherRefund));
    }

    /**
     * 測試依據日期範圍篩選的範圍查詢
     */
    public function test_date_range_scope(): void
    {
        // 刪除現有的退款，重新創建具有特定日期的退款
        $this->refund->delete();
        
        $refundInRange = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'created_at' => '2025-01-15 10:00:00'
        ]);
        
        $refundOutOfRange = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'created_at' => '2025-02-15 10:00:00'
        ]);
        
        $refunds = Refund::dateRange('2025-01-01 00:00:00', '2025-01-31 23:59:59')->get();
        
        $this->assertCount(1, $refunds);
        $this->assertEquals($refundInRange->id, $refunds->first()->id);
        $this->assertFalse($refunds->contains($refundOutOfRange));
    }

    /**
     * 測試是否處理庫存回補的範圍查詢
     */
    public function test_restocked_scope(): void
    {
        // 創建不回補庫存的退款
        $noRestockRefund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'should_restock' => false
        ]);
        
        // 測試回補庫存的查詢
        $restockedRefunds = Refund::restocked(true)->get();
        $this->assertTrue($restockedRefunds->contains($this->refund));
        $this->assertFalse($restockedRefunds->contains($noRestockRefund));
        
        // 測試不回補庫存的查詢
        $notRestockedRefunds = Refund::restocked(false)->get();
        $this->assertFalse($notRestockedRefunds->contains($this->refund));
        $this->assertTrue($notRestockedRefunds->contains($noRestockRefund));
    }

    /**
     * 測試格式化退款金額存取器
     */
    public function test_formatted_amount_attribute(): void
    {
        $this->assertEquals('$1,000.00', $this->refund->formatted_amount);
        
        // 測試不同金額
        $this->refund->total_refund_amount = 1234.56;
        $this->assertEquals('$1,234.56', $this->refund->formatted_amount);
    }

    /**
     * 測試退款摘要存取器
     */
    public function test_summary_attribute(): void
    {
        // 創建退款項目
        RefundItem::factory()->count(2)->create(['refund_id' => $this->refund->id]);
        
        $summary = $this->refund->summary;
        
        $this->assertStringContainsString('退款 2 個品項', $summary);
        $this->assertStringContainsString('$1,000.00', $summary);
    }

    /**
     * 測試庫存處理狀態文字存取器
     */
    public function test_restock_status_text_attribute(): void
    {
        // 測試回補庫存
        $this->refund->should_restock = true;
        $this->assertEquals('已回補庫存', $this->refund->restock_status_text);
        
        // 測試不回補庫存
        $this->refund->should_restock = false;
        $this->assertEquals('未回補庫存', $this->refund->restock_status_text);
    }

    /**
     * 測試計算退款品項總數量
     */
    public function test_get_total_refund_quantity(): void
    {
        // 創建退款項目
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'quantity' => 3
        ]);
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'quantity' => 2
        ]);
        
        $this->assertEquals(5, $this->refund->getTotalRefundQuantity());
    }

    /**
     * 測試驗證退款金額是否正確
     */
    public function test_validate_total_amount(): void
    {
        // 創建與退款總額匹配的退款項目
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'refund_subtotal' => 600.00
        ]);
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'refund_subtotal' => 400.00
        ]);
        
        $this->assertTrue($this->refund->validateTotalAmount());
        
        // 測試不匹配的情況
        $this->refund->total_refund_amount = 500.00;
        $this->assertFalse($this->refund->validateTotalAmount());
    }

    /**
     * 測試獲取退款的商品 SKU 列表
     */
    public function test_get_refunded_skus(): void
    {
        // 創建更多的商品變體
        $variant1 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-001'
        ]);
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-002'
        ]);
        
        // 創建訂單項目
        $orderItem1 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $variant1->id
        ]);
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $variant2->id
        ]);
        
        // 創建退款項目
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem1->id
        ]);
        RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem2->id
        ]);
        
        $skus = $this->refund->getRefundedSkus();
        
        $this->assertContains('TEST-001', $skus);
        $this->assertContains('TEST-002', $skus);
        $this->assertCount(2, $skus);
    }

    /**
     * 測試檢查是否為完整訂單退款
     */
    public function test_is_full_order_refund(): void
    {
        // 測試部分退款
        $this->assertFalse($this->refund->isFullOrderRefund());
        
        // 測試完整退款 - 先保存退款再檢查
        $this->refund->update(['total_refund_amount' => 2000.00]); // 等於訂單總額
        $this->assertTrue($this->refund->isFullOrderRefund());
        
        // 測試多次退款達到完整退款
        $this->refund->update(['total_refund_amount' => 1000.00]);
        Refund::factory()->create([
            'order_id' => $this->order->id,
            'total_refund_amount' => 1000.00
        ]);
        $this->assertTrue($this->refund->isFullOrderRefund());
    }

    /**
     * 測試創建退款時自動設定創建者
     */
    public function test_creating_event_sets_creator(): void
    {
        // 模擬認證用戶
        auth()->login($this->user);
        
        $refund = Refund::create([
            'order_id' => $this->order->id,
            'total_refund_amount' => 500.00,
            'reason' => '測試退款'
        ]);
        
        $this->assertEquals($this->user->id, $refund->creator_id);
    }

    /**
     * 測試刪除退款時級聯刪除相關記錄
     */
    public function test_deleting_event_removes_related_records(): void
    {
        // 創建退款項目
        $refundItem = RefundItem::factory()->create(['refund_id' => $this->refund->id]);
        
        $this->assertDatabaseHas('refund_items', ['id' => $refundItem->id]);
        
        // 刪除退款
        $this->refund->delete();
        
        // 驗證退款項目也被刪除
        $this->assertDatabaseMissing('refund_items', ['id' => $refundItem->id]);
    }

    /**
     * 測試退款模型的工廠
     */
    public function test_refund_factory(): void
    {
        $refund = Refund::factory()->create();
        
        $this->assertInstanceOf(Refund::class, $refund);
        $this->assertNotNull($refund->order_id);
        $this->assertNotNull($refund->creator_id);
        $this->assertNotNull($refund->total_refund_amount);
        $this->assertNotNull($refund->reason);
    }

    /**
     * 測試退款的複雜查詢組合
     */
    public function test_complex_query_combinations(): void
    {
        // 創建多個退款用於測試
        $refund1 = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'should_restock' => true,
            'created_at' => '2025-01-15 10:00:00'
        ]);
        
        $refund2 = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id,
            'should_restock' => false,
            'created_at' => '2025-02-15 10:00:00'
        ]);
        
        // 測試組合查詢：特定訂單 + 特定創建者 + 回補庫存 + 日期範圍
        $results = Refund::forOrder($this->order->id)
                        ->byCreator($this->user->id)
                        ->restocked(true)
                        ->dateRange('2025-01-01', '2025-01-31')
                        ->get();
        
        $this->assertCount(1, $results);
        $this->assertTrue($results->contains($refund1));
        $this->assertFalse($results->contains($refund2));
    }
} 