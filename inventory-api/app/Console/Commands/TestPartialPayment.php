<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\Customer;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Support\Facades\DB;

/**
 * 部分收款功能測試指令
 * 
 * 快速驗證部分收款的核心業務邏輯是否正常工作
 */
class TestPartialPayment extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:partial-payment';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = '測試部分收款功能的核心業務邏輯';

    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        parent::__construct();
        $this->orderService = $orderService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 開始測試部分收款功能...');
        
        try {
            // 1. 準備測試資料
            $this->info('📋 步驟 1: 準備測試資料');
            $testData = $this->prepareTestData();
            
            // 2. 測試第一筆部分收款
            $this->info('💰 步驟 2: 測試第一筆部分收款 (300元)');
            $this->testFirstPartialPayment($testData['order']);
            
            // 3. 測試第二筆部分收款
            $this->info('💰 步驟 3: 測試第二筆部分收款 (500元)');
            $this->testSecondPartialPayment($testData['order']);
            
            // 4. 測試最後付清
            $this->info('✅ 步驟 4: 測試最後付清 (200元)');
            $this->testFinalPayment($testData['order']);
            
            // 5. 測試超額付款保護
            $this->info('🔒 步驟 5: 測試超額付款保護');
            $this->testOverpaymentProtection($testData['order']);
            
            $this->info('🎉 所有測試通過！部分收款功能正常工作！');
            
        } catch (\Exception $e) {
            $this->error('❌ 測試失敗: ' . $e->getMessage());
            $this->error('堆疊追蹤: ' . $e->getTraceAsString());
            return 1;
        }
        
        return 0;
    }
    
    /**
     * 準備測試資料
     */
    private function prepareTestData(): array
    {
        return DB::transaction(function () {
            // 創建測試用戶和客戶
            $user = User::first() ?? User::factory()->create(['role' => 'admin']);
            $customer = Customer::first() ?? Customer::factory()->create();
            
            // 創建測試訂單 (總金額 1000 元)
            $order = Order::create([
                'order_number' => 'TEST-' . now()->format('YmdHis'),
                'customer_id' => $customer->id,
                'creator_user_id' => $user->id,
                'shipping_status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => 1000.00,
                'shipping_fee' => 0.00,
                'tax' => 0.00,
                'discount_amount' => 0.00,
                'grand_total' => 1000.00,
                'paid_amount' => 0.00,
                'payment_method' => 'cash',
                'order_source' => 'test',
                'shipping_address' => '測試地址',
                'notes' => '部分收款功能測試訂單',
            ]);
            
            // 設定當前認證用戶
            auth()->login($user);
            
            $this->line("  ✓ 創建測試訂單: {$order->order_number}");
            $this->line("  ✓ 訂單總金額: {$order->grand_total} 元");
            
            return compact('user', 'customer', 'order');
        });
    }
    
    /**
     * 測試第一筆部分收款
     */
    private function testFirstPartialPayment(Order $order)
    {
        $paymentData = [
            'amount' => 300.00,
            'payment_method' => 'cash',
            'notes' => '第一筆現金收款',
        ];
        
        $updatedOrder = $this->orderService->addPartialPayment($order, $paymentData);
        
        // 驗證結果
        $this->assertEquals(300.00, $updatedOrder->paid_amount, '已付金額應為 300');
        $this->assertEquals('partial', $updatedOrder->payment_status, '付款狀態應為 partial');
        
        // 驗證付款記錄
        $paymentRecord = $updatedOrder->paymentRecords->first();
        $this->assertNotNull($paymentRecord, '應該創建付款記錄');
        $this->assertEquals(300.00, $paymentRecord->amount, '付款記錄金額正確');
        $this->assertEquals('cash', $paymentRecord->payment_method, '付款方式正確');
        
        $this->line("  ✓ 已付金額: {$updatedOrder->paid_amount} 元");
        $this->line("  ✓ 付款狀態: {$updatedOrder->payment_status}");
        $this->line("  ✓ 付款記錄已創建");
    }
    
    /**
     * 測試第二筆部分收款
     */
    private function testSecondPartialPayment(Order $order)
    {
        $order->refresh(); // 重新載入最新狀態
        
        $paymentData = [
            'amount' => 500.00,
            'payment_method' => 'transfer',
            'notes' => '第二筆轉帳收款',
        ];
        
        $updatedOrder = $this->orderService->addPartialPayment($order, $paymentData);
        
        // 驗證結果
        $this->assertEquals(800.00, $updatedOrder->paid_amount, '已付金額應為 800');
        $this->assertEquals('partial', $updatedOrder->payment_status, '付款狀態仍為 partial');
        
        // 驗證付款記錄總數
        $this->assertEquals(2, $updatedOrder->paymentRecords->count(), '應該有 2 筆付款記錄');
        
        $this->line("  ✓ 已付金額: {$updatedOrder->paid_amount} 元");
        $this->line("  ✓ 付款狀態: {$updatedOrder->payment_status}");
        $this->line("  ✓ 付款記錄總數: " . $updatedOrder->paymentRecords->count());
    }
    
    /**
     * 測試最後付清
     */
    private function testFinalPayment(Order $order)
    {
        $order->refresh(); // 重新載入最新狀態
        
        $paymentData = [
            'amount' => 200.00, // 最後 200 元付清
            'payment_method' => 'credit_card',
            'notes' => '最後付清尾款',
        ];
        
        $updatedOrder = $this->orderService->addPartialPayment($order, $paymentData);
        
        // 驗證結果
        $this->assertEquals(1000.00, $updatedOrder->paid_amount, '已付金額應為 1000 (全額)');
        $this->assertEquals('paid', $updatedOrder->payment_status, '付款狀態應為 paid');
        $this->assertNotNull($updatedOrder->paid_at, '應設定付清時間');
        
        // 驗證付款記錄總數
        $this->assertEquals(3, $updatedOrder->paymentRecords->count(), '應該有 3 筆付款記錄');
        
        $this->line("  ✓ 已付金額: {$updatedOrder->paid_amount} 元 (全額付清)");
        $this->line("  ✓ 付款狀態: {$updatedOrder->payment_status}");
        $this->line("  ✓ 付清時間: {$updatedOrder->paid_at}");
        $this->line("  ✓ 付款記錄總數: " . $updatedOrder->paymentRecords->count());
    }
    
    /**
     * 測試超額付款保護
     */
    private function testOverpaymentProtection(Order $order)
    {
        $order->refresh(); // 重新載入最新狀態
        
        $paymentData = [
            'amount' => 100.00, // 嘗試再付 100 元 (超額)
            'payment_method' => 'cash',
            'notes' => '超額付款測試',
        ];
        
        try {
            $this->orderService->addPartialPayment($order, $paymentData);
            $this->failTest('應該拋出超額付款異常');
        } catch (\Exception $e) {
            $this->line("  ✓ 正確阻止超額付款: " . $e->getMessage());
        }
        
        // 驗證訂單狀態未變
        $order->refresh();
        $this->assertEquals(1000.00, $order->paid_amount, '已付金額不應變更');
        $this->assertEquals('paid', $order->payment_status, '付款狀態不應變更');
        $this->assertEquals(3, $order->paymentRecords->count(), '付款記錄數不應變更');
    }
    
    /**
     * 自定義斷言方法
     */
    private function assertEquals($expected, $actual, $message)
    {
        if ($expected != $actual) {
            throw new \Exception("斷言失敗: {$message}. 期望值: {$expected}, 實際值: {$actual}");
        }
    }
    
    private function assertNotNull($value, $message)
    {
        if ($value === null) {
            throw new \Exception("斷言失敗: {$message}. 值不應為 null");
        }
    }
    
    private function failTest($message)
    {
        throw new \Exception("測試失敗: {$message}");
    }
}
