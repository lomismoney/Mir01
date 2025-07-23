<?php

namespace Database\Seeders;

use App\Models\PaymentRecord;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentRecordSeeder extends Seeder
{
    /**
     * 運行付款記錄數據播種器
     */
    public function run(): void
    {
        // 獲取需要付款記錄的訂單
        $orders = $this->getOrdersForPayment();
        
        if ($orders->isEmpty()) {
            echo "警告：沒有找到需要建立付款記錄的訂單\n";
            return;
        }
        
        $paymentCount = 0;
        $users = User::all();
        
        foreach ($orders as $order) {
            // 根據訂單的付款狀態建立相應的付款記錄
            $payments = $this->createPaymentRecords($order, $users);
            $paymentCount += count($payments);
        }
        
        echo "建立了 {$paymentCount} 筆付款記錄\n";
    }
    
    /**
     * 獲取需要付款記錄的訂單
     */
    private function getOrdersForPayment()
    {
        return Order::whereIn('payment_status', ['paid', 'partially_paid'])
                   ->where('grand_total', '>', 0)
                   ->with('customer')
                   ->get();
    }
    
    /**
     * 為訂單建立付款記錄
     */
    private function createPaymentRecords(Order $order, $users): array
    {
        $payments = [];
        $creator = $users->random();
        
        switch ($order->payment_status) {
            case 'paid':
                // 已付款訂單：建立完整付款記錄
                $payments[] = $this->createFullPayment($order, $creator);
                break;
                
            case 'partially_paid':
                // 部分付款訂單：建立多筆付款記錄
                $payments = $this->createPartialPayments($order, $creator);
                break;
        }
        
        // 更新訂單的已付金額
        $this->updateOrderPaidAmount($order);
        
        return $payments;
    }
    
    /**
     * 建立全額付款記錄
     */
    private function createFullPayment(Order $order, User $creator): PaymentRecord
    {
        $paymentMethod = $this->determinePaymentMethod($order);
        $paymentDate = $this->generatePaymentDate($order);
        
        return PaymentRecord::create([
            'order_id' => $order->id,
            'creator_id' => $creator->id,
            'amount' => $order->grand_total, // 使用 Mutator，自動轉換為分
            'payment_method' => $paymentMethod,
            'payment_date' => $paymentDate,
            'notes' => $this->generatePaymentNotes($paymentMethod, true),
        ]);
    }
    
    /**
     * 建立部分付款記錄
     */
    private function createPartialPayments(Order $order, User $creator): array
    {
        $payments = [];
        $totalAmount = $order->grand_total;
        $paidAmount = 0;
        
        // 決定付款次數（2-4次）
        $paymentCount = rand(2, 4);
        
        for ($i = 0; $i < $paymentCount; $i++) {
            if ($i === $paymentCount - 1) {
                // 最後一筆付款
                if ($paidAmount < $totalAmount * 0.5) {
                    // 如果付款少於50%，這筆就付到50%
                    $amount = ($totalAmount * 0.5) - $paidAmount;
                } else {
                    // 否則就停止
                    break;
                }
            } else {
                // 每筆付款金額為總金額的10%-30%
                $percentage = rand(10, 30) / 100;
                $amount = round($totalAmount * $percentage);
            }
            
            if ($amount <= 0) {
                continue;
            }
            
            $paymentMethod = $this->determinePaymentMethod($order);
            $paymentDate = $this->generatePaymentDate($order, $i);
            
            $payments[] = PaymentRecord::create([
                'order_id' => $order->id,
                'creator_id' => $creator->id,
                'amount' => $amount, // 使用 Mutator，自動轉換為分
                'payment_method' => $paymentMethod,
                'payment_date' => $paymentDate,
                'notes' => $this->generatePaymentNotes($paymentMethod, false, $i + 1),
            ]);
            
            $paidAmount += $amount;
            
            // 如果已經付款超過80%，就停止
            if ($paidAmount >= $totalAmount * 0.8) {
                break;
            }
        }
        
        return $payments;
    }
    
    /**
     * 決定付款方式
     */
    private function determinePaymentMethod(Order $order): string
    {
        // 優先使用訂單的付款方式
        $orderMethod = $order->payment_method;
        
        $methodMap = [
            'cash' => 'cash',
            'credit_card' => 'credit_card',
            'bank_transfer' => 'transfer',
            'pay_later' => 'cash', // 月結最後可能用現金或轉帳
        ];
        
        if (isset($methodMap[$orderMethod])) {
            // 80%機率使用訂單指定的方式
            if (rand(1, 100) <= 80) {
                return $methodMap[$orderMethod];
            }
        }
        
        // 否則隨機選擇
        $methods = ['cash', 'transfer', 'credit_card'];
        return $methods[array_rand($methods)];
    }
    
    /**
     * 生成付款日期
     */
    private function generatePaymentDate(Order $order, int $paymentIndex = 0)
    {
        $orderDate = $order->created_at;
        
        // 第一筆付款通常在訂單當天或隔天
        if ($paymentIndex === 0) {
            return $orderDate->copy()->addDays(rand(0, 1))->addHours(rand(0, 8));
        }
        
        // 後續付款每次間隔3-10天
        $previousDays = $paymentIndex * rand(3, 10);
        return $orderDate->copy()->addDays($previousDays)->addHours(rand(9, 18));
    }
    
    /**
     * 生成付款備註
     */
    private function generatePaymentNotes(string $paymentMethod, bool $isFullPayment, int $paymentNumber = 1): ?string
    {
        $notes = [];
        
        if ($isFullPayment) {
            $notes = [
                'cash' => [
                    '客戶現場付清',
                    '收到現金付款',
                    '當面收款完成',
                ],
                'transfer' => [
                    '已確認轉帳入帳',
                    '網銀轉帳已到帳',
                    '收到匯款通知',
                ],
                'credit_card' => [
                    '信用卡刷卡成功',
                    'POS機刷卡完成',
                    '線上刷卡授權成功',
                ],
            ];
        } else {
            $notes = [
                'cash' => [
                    "第{$paymentNumber}期現金付款",
                    "部分付款 - 現金收款",
                    "分期付款第{$paymentNumber}筆",
                ],
                'transfer' => [
                    "第{$paymentNumber}期款項已入帳",
                    "部分匯款已確認",
                    "收到第{$paymentNumber}筆轉帳",
                ],
                'credit_card' => [
                    "信用卡分期第{$paymentNumber}期",
                    "部分刷卡付款",
                    "第{$paymentNumber}次刷卡授權",
                ],
            ];
        }
        
        $methodNotes = $notes[$paymentMethod] ?? ['付款已收到'];
        return $methodNotes[array_rand($methodNotes)];
    }
    
    /**
     * 更新訂單的已付金額
     */
    private function updateOrderPaidAmount(Order $order): void
    {
        $totalPaid = PaymentRecord::where('order_id', $order->id)->sum('amount');
        
        // 直接更新資料庫，避免觸發其他邏輯
        Order::where('id', $order->id)->update([
            'paid_amount' => $totalPaid,
        ]);
    }
}