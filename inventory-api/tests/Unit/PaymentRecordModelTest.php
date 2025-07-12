<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\PaymentRecord;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * PaymentRecord Model 單元測試
 * 
 * 測試付款記錄模型的所有功能，包括：
 * - 關聯關係
 * - 屬性設定
 * - 付款方式管理
 */
class PaymentRecordModelTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * 測試付款記錄屬於訂單的關聯
     */
    public function test_payment_record_belongs_to_order()
    {
        $order = Order::factory()->create();
        $paymentRecord = PaymentRecord::factory()->create([
            'order_id' => $order->id
        ]);
        
        $this->assertInstanceOf(Order::class, $paymentRecord->order);
        $this->assertEquals($order->id, $paymentRecord->order->id);
    }
    
    /**
     * 測試付款記錄屬於創建者的關聯
     */
    public function test_payment_record_belongs_to_creator()
    {
        $user = User::factory()->create();
        $paymentRecord = PaymentRecord::factory()->create([
            'creator_id' => $user->id
        ]);
        
        $this->assertInstanceOf(User::class, $paymentRecord->creator);
        $this->assertEquals($user->id, $paymentRecord->creator->id);
    }
    
    /**
     * 測試正確的可填充屬性
     */
    public function test_payment_record_has_correct_fillable_attributes()
    {
        $fillable = [
            'order_id',
            'creator_id',
            'amount',
            'payment_method',
            'payment_date',
            'notes',
            // 新增的金額欄位（分為單位）
            'amount_cents',
        ];
        
        $paymentRecord = new PaymentRecord();
        $this->assertEquals($fillable, $paymentRecord->getFillable());
    }
    
    /**
     * 測試正確的屬性轉型
     */
    public function test_payment_record_has_correct_casts()
    {
        $paymentRecord = new PaymentRecord();
        $casts = $paymentRecord->getCasts();
        
        // 新的金額欄位使用整數（分為單位）
        $this->assertArrayHasKey('amount_cents', $casts);
        $this->assertEquals('integer', $casts['amount_cents']);
        
        $this->assertArrayHasKey('payment_date', $casts);
        $this->assertEquals('datetime', $casts['payment_date']);
    }
    
    /**
     * 測試付款記錄可以被批量賦值創建
     */
    public function test_payment_record_can_be_created_with_mass_assignment()
    {
        $order = Order::factory()->create();
        $user = User::factory()->create();
        $paymentDate = Carbon::now();
        
        $data = [
            'order_id' => $order->id,
            'creator_id' => $user->id,
            'amount' => 5000.50,
            'payment_method' => 'cash',
            'payment_date' => $paymentDate,
            'notes' => '部分付款',
        ];
        
        $paymentRecord = PaymentRecord::create($data);
        
        $this->assertDatabaseHas('payment_records', [
            'order_id' => $order->id,
            'creator_id' => $user->id,
            'amount' => 5000.50,
            'payment_method' => 'cash',
        ]);
        
        $this->assertEquals('5000.50', $paymentRecord->amount);
        $this->assertEquals('cash', $paymentRecord->payment_method);
        $this->assertEquals('部分付款', $paymentRecord->notes);
    }
    
    /**
     * 測試獲取付款方式列表
     */
    public function test_get_payment_methods()
    {
        $methods = PaymentRecord::getPaymentMethods();
        
        $this->assertIsArray($methods);
        $this->assertArrayHasKey('cash', $methods);
        $this->assertArrayHasKey('transfer', $methods);
        $this->assertArrayHasKey('credit_card', $methods);
        
        $this->assertEquals('現金', $methods['cash']);
        $this->assertEquals('轉帳', $methods['transfer']);
        $this->assertEquals('信用卡', $methods['credit_card']);
    }
    
    /**
     * 測試不同的付款方式
     */
    public function test_different_payment_methods()
    {
        $order = Order::factory()->create();
        
        // 測試現金付款
        $cashPayment = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 1000
        ]);
        $this->assertEquals('cash', $cashPayment->payment_method);
        
        // 測試轉帳付款
        $transferPayment = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'payment_method' => 'transfer',
            'amount' => 2000
        ]);
        $this->assertEquals('transfer', $transferPayment->payment_method);
        
        // 測試信用卡付款
        $creditCardPayment = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'payment_method' => 'credit_card',
            'amount' => 3000
        ]);
        $this->assertEquals('credit_card', $creditCardPayment->payment_method);
    }
    
    /**
     * 測試付款記錄使用 HasFactory trait
     */
    public function test_payment_record_uses_has_factory_trait()
    {
        $paymentRecord = PaymentRecord::factory()->make();
        $this->assertInstanceOf(PaymentRecord::class, $paymentRecord);
    }
    
    /**
     * 測試金額精度
     */
    public function test_amount_precision()
    {
        $paymentRecord = PaymentRecord::factory()->create([
            'amount' => 1234.5678
        ]);
        
        // 重新載入以確保從資料庫讀取
        $paymentRecord->refresh();
        
        // 驗證小數點後只保留2位
        $this->assertEquals('1234.57', $paymentRecord->amount);
    }
    
    /**
     * 測試付款日期格式
     */
    public function test_payment_date_format()
    {
        $paymentDate = Carbon::create(2025, 7, 9, 15, 30, 0);
        
        $paymentRecord = PaymentRecord::factory()->create([
            'payment_date' => $paymentDate
        ]);
        
        // 驗證日期被正確儲存和轉換
        $this->assertInstanceOf(Carbon::class, $paymentRecord->payment_date);
        $this->assertEquals($paymentDate->toDateTimeString(), $paymentRecord->payment_date->toDateTimeString());
    }
    
    /**
     * 測試可以有空的備註
     */
    public function test_payment_record_can_have_null_notes()
    {
        $paymentRecord = PaymentRecord::factory()->create([
            'notes' => null
        ]);
        
        $this->assertNull($paymentRecord->notes);
        $this->assertDatabaseHas('payment_records', [
            'id' => $paymentRecord->id,
            'notes' => null
        ]);
    }
    
    /**
     * 測試一個訂單可以有多筆付款記錄
     */
    public function test_order_can_have_multiple_payment_records()
    {
        $order = Order::factory()->create([
            'grand_total' => 10000
        ]);
        
        // 創建多筆部分付款
        $payment1 = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 3000,
            'payment_date' => Carbon::now()->subDays(3)
        ]);
        
        $payment2 = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 4000,
            'payment_date' => Carbon::now()->subDays(2)
        ]);
        
        $payment3 = PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 3000,
            'payment_date' => Carbon::now()->subDay()
        ]);
        
        // 驗證訂單有3筆付款記錄
        $this->assertCount(3, $order->paymentRecords);
        
        // 驗證總付款金額
        $totalPaid = $order->paymentRecords->sum('amount');
        $this->assertEquals(10000, $totalPaid);
    }
    
    /**
     * 測試付款記錄的時間戳
     */
    public function test_payment_record_timestamps()
    {
        $paymentRecord = PaymentRecord::factory()->create();
        
        $this->assertNotNull($paymentRecord->created_at);
        $this->assertNotNull($paymentRecord->updated_at);
        $this->assertInstanceOf(Carbon::class, $paymentRecord->created_at);
        $this->assertInstanceOf(Carbon::class, $paymentRecord->updated_at);
    }

    /**
     * 測試 HandlesCurrency trait 功能
     */
    public function test_currency_handling()
    {
        $paymentRecord = PaymentRecord::factory()->create([
            'amount' => 250.99
        ]);
        
        // 驗證金額正確轉換為分並儲存
        $this->assertEquals(25099, $paymentRecord->amount_cents);
        
        // 驗證金額正確從分轉換為元顯示
        $this->assertEquals(250.99, $paymentRecord->amount);
    }

    /**
     * 測試 HandlesCurrency trait 的轉換方法
     */
    public function test_currency_conversion_methods()
    {
        // 測試 yuanToCents
        $this->assertEquals(0, PaymentRecord::yuanToCents(null));
        $this->assertEquals(0, PaymentRecord::yuanToCents(0));
        $this->assertEquals(100, PaymentRecord::yuanToCents(1));
        $this->assertEquals(25099, PaymentRecord::yuanToCents(250.99));
        
        // 測試 centsToYuan
        $this->assertEquals(0.00, PaymentRecord::centsToYuan(0));
        $this->assertEquals(1.00, PaymentRecord::centsToYuan(100));
        $this->assertEquals(250.99, PaymentRecord::centsToYuan(25099));
    }

    /**
     * 測試更新付款記錄金額
     */
    public function test_update_payment_amount()
    {
        $paymentRecord = PaymentRecord::factory()->create([
            'amount' => 100.00
        ]);
        
        // 更新金額
        $paymentRecord->update(['amount' => 200.50]);
        
        // 驗證更新後的值
        $paymentRecord->refresh();
        $this->assertEquals(20050, $paymentRecord->amount_cents);
        $this->assertEquals(200.50, $paymentRecord->amount);
    }

    /**
     * 測試多筆付款記錄的總和計算
     */
    public function test_multiple_payment_records_sum_with_cents()
    {
        $order = Order::factory()->create();
        
        PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 100.50
        ]);
        
        PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 200.75
        ]);
        
        PaymentRecord::factory()->create([
            'order_id' => $order->id,
            'amount' => 299.25
        ]);
        
        // 使用金額欄位計算總和
        $totalPaid = $order->paymentRecords->sum('amount');
        $this->assertEquals(600.50, $totalPaid);
        
        // 使用分單位計算總和並轉換
        $totalPaidCents = $order->paymentRecords->sum('amount_cents');
        $this->assertEquals(60050, $totalPaidCents);
        $this->assertEquals(600.50, PaymentRecord::centsToYuan($totalPaidCents));
    }
}