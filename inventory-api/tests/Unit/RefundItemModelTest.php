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
 * RefundItem 模型測試類
 * 
 * 測試退款項目模型的所有功能，包括關聯、方法、範圍查詢等
 */
class RefundItemModelTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Order $order;
    protected OrderItem $orderItem;
    protected Product $product;
    protected ProductVariant $productVariant;
    protected Refund $refund;
    protected RefundItem $refundItem;

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
        $this->productVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU-001'
        ]);
        
        // 創建測試訂單
        $this->order = Order::factory()->create([
            'customer_id' => $this->customer->id,
            'creator_user_id' => $this->user->id
        ]);
        
        // 創建測試訂單項目
        $this->orderItem = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 500.00,
            'quantity' => 4
        ]);
        
        // 創建測試退款
        $this->refund = Refund::factory()->create([
            'order_id' => $this->order->id,
            'creator_id' => $this->user->id
        ]);
        
        // 創建測試退款項目
        $this->refundItem = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $this->orderItem->id,
            'quantity' => 2,
            'refund_subtotal' => 1000.00
        ]);
    }

    /**
     * 測試退款項目屬於退款的關聯
     */
    public function test_refund_item_belongs_to_refund(): void
    {
        $this->assertInstanceOf(Refund::class, $this->refundItem->refund);
        $this->assertEquals($this->refund->id, $this->refundItem->refund->id);
    }

    /**
     * 測試退款項目屬於訂單項目的關聯
     */
    public function test_refund_item_belongs_to_order_item(): void
    {
        $this->assertInstanceOf(OrderItem::class, $this->refundItem->orderItem);
        $this->assertEquals($this->orderItem->id, $this->refundItem->orderItem->id);
    }

    /**
     * 測試可批量賦值的屬性
     */
    public function test_refund_item_fillable_attributes(): void
    {
        // 創建額外的訂單項目以避免唯一約束衝突
        $orderItem2 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id
        ]);
        
        $data = [
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem2->id,
            'quantity' => 3,
            'refund_subtotal' => 1500.00
        ];
        
        $refundItem = RefundItem::create($data);
        
        $this->assertEquals($this->refund->id, $refundItem->refund_id);
        $this->assertEquals($orderItem2->id, $refundItem->order_item_id);
        $this->assertEquals(3, $refundItem->quantity);
        $this->assertEquals(1500.00, $refundItem->refund_subtotal);
    }

    /**
     * 測試屬性轉換
     */
    public function test_refund_item_casts(): void
    {
        $this->assertIsInt($this->refundItem->quantity);
        // 在 SQLite 中，decimal 類型會返回字符串，需要手動轉換
        $this->assertIsNumeric($this->refundItem->refund_subtotal);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->refundItem->created_at);
        $this->assertInstanceOf(\Carbon\Carbon::class, $this->refundItem->updated_at);
    }

    /**
     * 測試依據退款篩選的範圍查詢
     */
    public function test_for_refund_scope(): void
    {
        // 創建另一個退款的退款項目
        $anotherRefund = Refund::factory()->create(['order_id' => $this->order->id]);
        $anotherRefundItem = RefundItem::factory()->create(['refund_id' => $anotherRefund->id]);
        
        $refundItems = RefundItem::forRefund($this->refund->id)->get();
        
        $this->assertCount(1, $refundItems);
        $this->assertEquals($this->refundItem->id, $refundItems->first()->id);
        $this->assertFalse($refundItems->contains($anotherRefundItem));
    }

    /**
     * 測試依據訂單項目篩選的範圍查詢
     */
    public function test_for_order_item_scope(): void
    {
        // 創建另一個訂單項目的退款項目
        $anotherOrderItem = OrderItem::factory()->create(['order_id' => $this->order->id]);
        $anotherRefundItem = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $anotherOrderItem->id
        ]);
        
        $refundItems = RefundItem::forOrderItem($this->orderItem->id)->get();
        
        $this->assertCount(1, $refundItems);
        $this->assertEquals($this->refundItem->id, $refundItems->first()->id);
        $this->assertFalse($refundItems->contains($anotherRefundItem));
    }

    /**
     * 測試依據退貨數量範圍篩選的範圍查詢
     */
    public function test_quantity_range_scope(): void
    {
        // 創建不同數量的退款項目
        $refundItem1 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'quantity' => 1
        ]);
        $refundItem2 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'quantity' => 5
        ]);
        $refundItem3 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'quantity' => 10
        ]);
        
        // 測試最小數量篩選
        $minQuantityItems = RefundItem::quantityRange(2)->get();
        $this->assertTrue($minQuantityItems->contains($this->refundItem)); // quantity = 2
        $this->assertFalse($minQuantityItems->contains($refundItem1)); // quantity = 1
        $this->assertTrue($minQuantityItems->contains($refundItem2)); // quantity = 5
        $this->assertTrue($minQuantityItems->contains($refundItem3)); // quantity = 10
        
        // 測試範圍篩選
        $rangeItems = RefundItem::quantityRange(2, 5)->get();
        $this->assertTrue($rangeItems->contains($this->refundItem)); // quantity = 2
        $this->assertFalse($rangeItems->contains($refundItem1)); // quantity = 1
        $this->assertTrue($rangeItems->contains($refundItem2)); // quantity = 5
        $this->assertFalse($rangeItems->contains($refundItem3)); // quantity = 10
    }

    /**
     * 測試格式化退款小計存取器
     */
    public function test_formatted_subtotal_attribute(): void
    {
        $this->assertEquals('$1,000.00', $this->refundItem->formatted_subtotal);
        
        // 測試不同金額
        $this->refundItem->refund_subtotal = 1234.56;
        $this->assertEquals('$1,234.56', $this->refundItem->formatted_subtotal);
    }

    /**
     * 測試退款品項摘要存取器
     */
    public function test_summary_attribute(): void
    {
        $summary = $this->refundItem->summary;
        
        $this->assertStringContainsString('SKU: TEST-SKU-001', $summary);
        $this->assertStringContainsString('× 2', $summary);
        $this->assertStringContainsString('$1,000.00', $summary);
    }

    /**
     * 測試單價存取器
     */
    public function test_unit_price_attribute(): void
    {
        $this->assertEquals(500.00, $this->refundItem->unit_price);
        
        // 測試沒有訂單項目的情況
        $refundItemWithoutOrder = RefundItem::factory()->make(['order_item_id' => null]);
        $this->assertEquals(0, $refundItemWithoutOrder->unit_price);
    }

    /**
     * 測試商品名稱存取器
     */
    public function test_product_name_attribute(): void
    {
        $this->assertEquals($this->product->name, $this->refundItem->product_name);
    }

    /**
     * 測試商品 SKU 存取器
     */
    public function test_sku_attribute(): void
    {
        $this->assertEquals('TEST-SKU-001', $this->refundItem->sku);
    }

    /**
     * 測試驗證退款小計是否正確
     */
    public function test_validate_subtotal(): void
    {
        // 測試正確的小計 (500 * 2 = 1000)
        $this->assertTrue($this->refundItem->validateSubtotal());
        
        // 測試錯誤的小計
        $this->refundItem->refund_subtotal = 800.00; // 應該是 1000
        $this->assertFalse($this->refundItem->validateSubtotal());
        
        // 測試允許的誤差範圍
        $this->refundItem->refund_subtotal = 1000.005; // 誤差 < 0.01
        $this->assertTrue($this->refundItem->validateSubtotal());
    }

    /**
     * 測試計算退款比例
     */
    public function test_get_refund_ratio(): void
    {
        // 原訂單數量 4，退款數量 2，比例應為 0.5
        $this->assertEquals(0.5, $this->refundItem->getRefundRatio());
        
        // 測試全數量退款
        $this->refundItem->quantity = 4;
        $this->assertEquals(1.0, $this->refundItem->getRefundRatio());
        
        // 測試沒有訂單項目的情況
        $refundItemWithoutOrder = RefundItem::factory()->make(['order_item_id' => null]);
        $this->assertEquals(0, $refundItemWithoutOrder->getRefundRatio());
    }

    /**
     * 測試檢查是否為完整品項退款
     */
    public function test_is_full_item_refund(): void
    {
        // 部分退款
        $this->assertFalse($this->refundItem->isFullItemRefund());
        
        // 完整退款
        $this->refundItem->quantity = 4; // 等於原訂單數量
        $this->assertTrue($this->refundItem->isFullItemRefund());
        
        // 超過原數量的退款
        $this->refundItem->quantity = 5;
        $this->assertTrue($this->refundItem->isFullItemRefund());
    }

    /**
     * 測試獲取該品項的總退貨數量
     */
    public function test_get_total_refunded_quantity(): void
    {
        // 創建同一訂單項目的另一個退款項目
        RefundItem::factory()->create([
            'order_item_id' => $this->orderItem->id,
            'quantity' => 1
        ]);
        
        // 總退貨數量應為 2 + 1 = 3
        $this->assertEquals(3, $this->refundItem->getTotalRefundedQuantity());
    }

    /**
     * 測試獲取該品項的剩餘可退數量
     */
    public function test_get_remaining_refundable_quantity(): void
    {
        // 原數量 4，已退 2，剩餘 2
        $this->assertEquals(2, $this->refundItem->getRemainingRefundableQuantity());
        
        // 再退 1 個
        RefundItem::factory()->create([
            'order_item_id' => $this->orderItem->id,
            'quantity' => 1
        ]);
        
        // 剩餘應為 4 - 2 - 1 = 1
        $this->assertEquals(1, $this->refundItem->getRemainingRefundableQuantity());
    }

    /**
     * 測試計算指定訂單品項的總退款金額
     */
    public function test_get_total_refunded_amount(): void
    {
        // 創建同一訂單項目的另一個退款項目
        RefundItem::factory()->create([
            'order_item_id' => $this->orderItem->id,
            'refund_subtotal' => 500.00
        ]);
        
        $totalAmount = RefundItem::getTotalRefundedAmount($this->orderItem->id);
        
        // 總退款金額應為 1000 + 500 = 1500
        $this->assertEquals(1500.00, $totalAmount);
    }

    /**
     * 測試檢查訂單品項是否可以退款指定數量
     */
    public function test_can_refund_quantity(): void
    {
        // 可以退款 2 個（剩餘數量）
        $this->assertTrue(RefundItem::canRefundQuantity($this->orderItem->id, 2));
        
        // 不能退款 3 個（超過剩餘數量）
        $this->assertFalse(RefundItem::canRefundQuantity($this->orderItem->id, 3));
        
        // 不能退款 0 個或負數
        $this->assertFalse(RefundItem::canRefundQuantity($this->orderItem->id, 0));
        $this->assertFalse(RefundItem::canRefundQuantity($this->orderItem->id, -1));
        
        // 測試不存在的訂單項目
        $this->assertFalse(RefundItem::canRefundQuantity(99999, 1));
    }

    /**
     * 測試創建退款品項時自動計算小計
     */
    public function test_creating_event_calculates_subtotal(): void
    {
        // 創建額外的訂單項目以避免唯一約束衝突
        $orderItem3 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'price' => 500.00
        ]);
        
        $refundItem = RefundItem::create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem3->id,
            'quantity' => 3
            // 沒有設定 refund_subtotal
        ]);
        
        // 應該自動計算為 500 * 3 = 1500
        $this->assertEquals(1500.00, $refundItem->refund_subtotal);
    }

    /**
     * 測試更新退款品項時重新計算小計
     */
    public function test_updating_event_recalculates_subtotal(): void
    {
        // 更新數量
        $this->refundItem->update(['quantity' => 3]);
        
        // 小計應該重新計算為 500 * 3 = 1500
        $this->assertEquals(1500.00, $this->refundItem->refund_subtotal);
    }

    /**
     * 測試退款項目模型的工廠
     */
    public function test_refund_item_factory(): void
    {
        $refundItem = RefundItem::factory()->create();
        
        $this->assertInstanceOf(RefundItem::class, $refundItem);
        $this->assertNotNull($refundItem->refund_id);
        $this->assertNotNull($refundItem->order_item_id);
        $this->assertNotNull($refundItem->quantity);
        $this->assertNotNull($refundItem->refund_subtotal);
    }

    /**
     * 測試退款項目的複雜查詢組合
     */
    public function test_complex_query_combinations(): void
    {
        // 創建額外的訂單項目以避免唯一約束衝突
        $orderItem4 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id
        ]);
        
        $orderItem5 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id
        ]);
        
        // 創建多個退款項目用於測試
        $refundItem1 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem4->id,
            'quantity' => 3
        ]);
        
        $refundItem2 = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem5->id,
            'quantity' => 1
        ]);
        
        // 測試組合查詢：特定退款 + 數量範圍
        $results = RefundItem::forRefund($this->refund->id)
                            ->quantityRange(2, 5)
                            ->get();
        
        $this->assertCount(2, $results);
        $this->assertTrue($results->contains($this->refundItem)); // quantity = 2
        $this->assertTrue($results->contains($refundItem1)); // quantity = 3
        $this->assertFalse($results->contains($refundItem2)); // quantity = 1
    }

    /**
     * 測試退款項目的邊界情況
     */
    public function test_edge_cases(): void
    {
        // 創建額外的訂單項目以避免唯一約束衝突
        $orderItem6 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 4
        ]);
        
        $orderItem7 = OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_variant_id' => $this->productVariant->id,
            'quantity' => 4
        ]);
        
        // 測試零數量
        $zeroQuantityItem = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem6->id,
            'quantity' => 0
        ]);
        
        $this->assertEquals(0, $zeroQuantityItem->getRefundRatio());
        $this->assertFalse($zeroQuantityItem->isFullItemRefund());
        
        // 測試非常大的數量
        $largeQuantityItem = RefundItem::factory()->create([
            'refund_id' => $this->refund->id,
            'order_item_id' => $orderItem7->id,
            'quantity' => 1000
        ]);
        
        $this->assertEquals(250.0, $largeQuantityItem->getRefundRatio()); // 1000/4
        $this->assertTrue($largeQuantityItem->isFullItemRefund());
    }
} 