<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\User;
use App\Models\PaymentRecord;
use App\Models\Refund;
use App\Models\OrderStatusHistory;
use App\Models\Installation;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

/**
 * Order Model 單元測試
 * 
 * 測試訂單模型的基本功能，包括：
 * - 關聯關係
 * - 屬性設定
 * - 自定義屬性
 */
class OrderModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試訂單有多個訂單項目的關聯
     */
    public function test_order_has_many_items()
    {
        $order = Order::factory()->create();
        $items = OrderItem::factory()->count(3)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(3, $order->items);
        $this->assertInstanceOf(OrderItem::class, $order->items->first());
        
        // 測試關聯方法存在
        $this->assertInstanceOf('Illuminate\Database\Eloquent\Relations\HasMany', $order->items());
    }
    
    /**
     * 測試訂單有多個付款記錄的關聯
     */
    public function test_order_has_many_payment_records()
    {
        $order = Order::factory()->create();
        $payments = PaymentRecord::factory()->count(2)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(2, $order->paymentRecords);
        $this->assertInstanceOf(PaymentRecord::class, $order->paymentRecords->first());
    }
    
    /**
     * 測試訂單有多個退款記錄的關聯
     */
    public function test_order_has_many_refunds()
    {
        $order = Order::factory()->create();
        $refunds = Refund::factory()->count(2)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(2, $order->refunds);
        $this->assertInstanceOf(Refund::class, $order->refunds->first());
    }
    
    /**
     * 測試訂單有多個狀態歷史記錄的關聯
     */
    public function test_order_has_many_status_histories()
    {
        $order = Order::factory()->create();
        $histories = OrderStatusHistory::factory()->count(4)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(4, $order->statusHistories);
        $this->assertInstanceOf(OrderStatusHistory::class, $order->statusHistories->first());
    }
    
    /**
     * 測試訂單屬於客戶的關聯
     */
    public function test_order_belongs_to_customer()
    {
        $customer = Customer::factory()->create();
        $order = Order::factory()->create([
            'customer_id' => $customer->id
        ]);
        
        $this->assertInstanceOf(Customer::class, $order->customer);
        $this->assertEquals($customer->id, $order->customer->id);
    }
    
    /**
     * 測試訂單屬於創建者的關聯
     */
    public function test_order_belongs_to_creator()
    {
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'creator_user_id' => $user->id
        ]);
        
        $this->assertInstanceOf(User::class, $order->creator);
        $this->assertEquals($user->id, $order->creator->id);
    }
    
    /**
     * 測試訂單有多個安裝單的關聯
     */
    public function test_order_has_many_installations()
    {
        $order = Order::factory()->create();
        $installations = Installation::factory()->count(2)->create([
            'order_id' => $order->id
        ]);
        
        $this->assertCount(2, $order->installations);
        $this->assertInstanceOf(Installation::class, $order->installations->first());
    }
    
    /**
     * 測試正確的可填充屬性
     */
    public function test_order_has_correct_fillable_attributes()
    {
        $fillable = [
            'order_number',
            'customer_id',
            'creator_user_id',
            'store_id',
            'shipping_status',
            'payment_status',
            'subtotal',
            'shipping_fee',
            'tax',
            'discount_amount',
            'grand_total',
            'paid_amount',
            'payment_method',
            'order_source',
            'shipping_address',
            'notes',
            'tracking_number',
            'carrier',
            'shipped_at',
            'paid_at',
            'estimated_delivery_date',
            'fulfillment_priority',
            'expected_delivery_date',
            'priority_reason',
            'is_tax_inclusive',
            'tax_rate',
        ];
        
        $order = new Order();
        $this->assertEquals($fillable, $order->getFillable());
    }
    
    /**
     * 測試判斷訂單是否包含訂製商品（使用已加載的關聯）
     */
    public function test_has_custom_items_attribute_with_loaded_relation()
    {
        $order = Order::factory()->create();
        
        // 創建標準商品項目
        $standardItem = OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => ProductVariant::factory()->create()->id
        ]);
        
        // 創建訂製商品項目
        $customItem = OrderItem::factory()->customProduct()->create([
            'order_id' => $order->id,
            'custom_product_name' => '訂製產品'
        ]);
        
        // 預加載關聯
        $order->load('items');
        
        $this->assertTrue($order->has_custom_items);
    }
    
    /**
     * 測試判斷訂單是否包含訂製商品（未加載關聯）
     */
    public function test_has_custom_items_attribute_without_loaded_relation()
    {
        $order = Order::factory()->create();
        
        // 創建標準商品項目
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_variant_id' => ProductVariant::factory()->create()->id
        ]);
        
        // 創建訂製商品項目
        OrderItem::factory()->customProduct()->create([
            'order_id' => $order->id
        ]);
        
        // 不預加載關聯，強制使用資料庫查詢
        $this->assertTrue($order->has_custom_items);
    }
    
    /**
     * 測試訂單只包含標準商品
     */
    public function test_order_with_only_standard_items()
    {
        $order = Order::factory()->create();
        
        // 只創建標準商品項目
        OrderItem::factory()->count(3)->create([
            'order_id' => $order->id,
            'product_variant_id' => ProductVariant::factory()->create()->id
        ]);
        
        $this->assertFalse($order->has_custom_items);
    }
    
    /**
     * 測試訂單沒有任何項目
     */
    public function test_order_with_no_items()
    {
        $order = Order::factory()->create();
        
        $this->assertFalse($order->has_custom_items);
    }
    
    /**
     * 測試訂單可以被批量賦值創建
     */
    public function test_order_can_be_created_with_mass_assignment()
    {
        $customer = Customer::factory()->create();
        $user = User::factory()->create();
        
        $data = [
            'order_number' => 'ORD-2025-001',
            'customer_id' => $customer->id,
            'creator_user_id' => $user->id,
            'shipping_status' => 'pending',
            'payment_status' => 'unpaid',
            'subtotal' => 1000000,
            'shipping_fee' => 10000,
            'tax' => 100000,
            'discount_amount' => 50000,
            'grand_total' => 1060000,
            'paid_amount' => 0,
            'payment_method' => 'credit_card',
            'order_source' => 'online',
            'shipping_address' => '台北市信義區信義路五段7號',
            'notes' => '請小心處理',
            'tracking_number' => null,
            'carrier' => null,
            'shipped_at' => null,
            'paid_at' => null,
            'estimated_delivery_date' => Carbon::now()->addDays(7)->toDateString(),
        ];
        
        $order = Order::create($data);
        
        $this->assertDatabaseHas('orders', [
            'order_number' => 'ORD-2025-001',
            'customer_id' => $customer->id,
            'grand_total' => 1060000,
        ]);
        
        $this->assertEquals('pending', $order->shipping_status);
        $this->assertEquals('unpaid', $order->payment_status);
    }
    
    /**
     * 測試訂單使用 HasFactory trait
     */
    public function test_order_uses_has_factory_trait()
    {
        $order = Order::factory()->make();
        $this->assertInstanceOf(Order::class, $order);
    }
    
    /**
     * 測試不同的訂單狀態
     */
    public function test_order_status_values()
    {
        // 測試運送狀態
        $shippingStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        foreach ($shippingStatuses as $status) {
            $order = Order::factory()->create(['shipping_status' => $status]);
            $this->assertEquals($status, $order->shipping_status);
        }
        
        // 測試付款狀態
        $paymentStatuses = ['unpaid', 'partial', 'paid', 'refunded'];
        foreach ($paymentStatuses as $status) {
            $order = Order::factory()->create(['payment_status' => $status]);
            $this->assertEquals($status, $order->payment_status);
        }
    }
    
    /**
     * 測試訂單來源
     */
    public function test_order_source_values()
    {
        $sources = ['online', 'phone', 'store', 'admin'];
        
        foreach ($sources as $source) {
            $order = Order::factory()->create(['order_source' => $source]);
            $this->assertEquals($source, $order->order_source);
        }
    }
    
    /**
     * 測試日期欄位
     */
    public function test_order_date_fields()
    {
        $shippedAt = Carbon::now()->subDays(2);
        $paidAt = Carbon::now()->subDays(3);
        $estimatedDelivery = Carbon::now()->addDays(5);
        
        $order = Order::factory()->create([
            'shipped_at' => $shippedAt,
            'paid_at' => $paidAt,
            'estimated_delivery_date' => $estimatedDelivery->toDateString(),
        ]);
        
        $this->assertEquals($shippedAt->toDateTimeString(), $order->shipped_at);
        $this->assertEquals($paidAt->toDateTimeString(), $order->paid_at);
        $this->assertEquals($estimatedDelivery->toDateString(), $order->estimated_delivery_date->toDateString());
    }
    
    /**
     * 測試金額計算邏輯
     */
    public function test_order_amount_calculations()
    {
        $order = Order::factory()->create([
            'subtotal' => 1000000,    // 10000元
            'shipping_fee' => 10000,  // 100元
            'tax' => 100000,          // 1000元
            'discount_amount' => 50000, // 500元
            'grand_total' => 1060000, // 10600元 = 10000 + 100 + 1000 - 500
        ]);
        
        // 驗證總金額計算正確（使用原始數據庫值進行計算）
        $calculatedTotal = $order->getRawOriginal('subtotal') + 
                          $order->getRawOriginal('shipping_fee') + 
                          $order->getRawOriginal('tax') - 
                          $order->getRawOriginal('discount_amount');
        $this->assertEquals($order->getRawOriginal('grand_total'), $calculatedTotal);
    }
    
    /**
     * 測試部分付款
     */
    public function test_partial_payment()
    {
        $order = Order::factory()->create([
            'grand_total' => 1000000, // 10000元
            'paid_amount' => 300000,  // 3000元
            'payment_status' => 'partial',
        ]);
        
        // 測試原始數據庫值（分）
        $this->assertEquals(300000, $order->getRawOriginal('paid_amount'));
        $this->assertEquals('partial', $order->payment_status);
        
        // 剩餘應付金額測試（使用 remaining_amount accessor）
        $this->assertEquals(7000.00, $order->remaining_amount); // 7000元
    }

    /**
     * 測試金額處理功能
     */
    public function test_money_field_handling()
    {
        $order = Order::factory()->create([
            'subtotal' => 99999,      // 999.99元
            'shipping_fee' => 5000,   // 50元
            'tax' => 10000,           // 100元
            'discount_amount' => 5000, // 50元
            'grand_total' => 109999,  // 1099.99元
            'paid_amount' => 50000    // 500元
        ]);
        
        // 驗證原始數據庫值（分）- 遵循 CLAUDE.md 1.3 節規範
        $this->assertEquals(99999, $order->getRawOriginal('subtotal'));
        $this->assertEquals(5000, $order->getRawOriginal('shipping_fee'));
        $this->assertEquals(10000, $order->getRawOriginal('tax'));
        $this->assertEquals(5000, $order->getRawOriginal('discount_amount'));
        $this->assertEquals(109999, $order->getRawOriginal('grand_total'));
        $this->assertEquals(50000, $order->getRawOriginal('paid_amount'));
    }

    /**
     * 測試更新訂單金額
     */
    public function test_update_order_amounts()
    {
        $order = Order::factory()->create([
            'subtotal' => 10000,    // 100元
            'grand_total' => 10000  // 100元
        ]);
        
        // 更新金額
        $order->update([
            'subtotal' => 20000,      // 200元
            'shipping_fee' => 2000,   // 20元
            'tax' => 2200,            // 22元
            'discount_amount' => 1000, // 10元
            'grand_total' => 23200    // 232元
        ]);
        
        // 驗證更新後的原始數據庫值（分）- 遵循 CLAUDE.md 1.3 節規範
        $order->refresh();
        $this->assertEquals(20000, $order->getRawOriginal('subtotal'));
        $this->assertEquals(2000, $order->getRawOriginal('shipping_fee'));
        $this->assertEquals(2200, $order->getRawOriginal('tax'));
        $this->assertEquals(1000, $order->getRawOriginal('discount_amount'));
        $this->assertEquals(23200, $order->getRawOriginal('grand_total'));
    }

    /**
     * 測試訂單狀態歷史記錄
     */
    public function test_order_status_history()
    {
        $order = Order::factory()->create();
        
        // 創建狀態歷史記錄
        $history1 = OrderStatusHistory::factory()->create([
            'order_id' => $order->id,
            'status_type' => 'payment',
            'from_status' => 'pending',
            'to_status' => 'paid'
        ]);
        
        $history2 = OrderStatusHistory::factory()->create([
            'order_id' => $order->id,
            'status_type' => 'shipping',
            'from_status' => 'pending',
            'to_status' => 'shipped'
        ]);
        
        $this->assertCount(2, $order->statusHistories);
        $this->assertEquals('payment', $order->statusHistories->first()->status_type);
    }

    /**
     * 測試訂單 casts 屬性
     */
    public function test_order_has_correct_casts()
    {
        $order = new Order();
        $expectedCasts = [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'shipped_at' => 'datetime',
            'paid_at' => 'datetime',
            'estimated_delivery_date' => 'date',
            'expected_delivery_date' => 'date',
            'is_tax_inclusive' => 'boolean',
            'tax_rate' => 'decimal:2',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $order->getCasts());
            $this->assertEquals($expectedType, $order->getCasts()[$key]);
        }
    }
}