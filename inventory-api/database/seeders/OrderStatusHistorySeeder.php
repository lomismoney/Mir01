<?php

namespace Database\Seeders;

use App\Models\OrderStatusHistory;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderStatusHistorySeeder extends Seeder
{
    /**
     * 運行訂單狀態歷史數據播種器
     */
    public function run(): void
    {
        // 獲取所有訂單
        $orders = Order::with('customer')->get();
        
        if ($orders->isEmpty()) {
            echo "警告：沒有找到訂單資料\n";
            return;
        }
        
        $historyCount = 0;
        $users = User::all();
        
        foreach ($orders as $order) {
            // 為每個訂單建立狀態變更歷史
            $histories = $this->createStatusHistory($order, $users);
            $historyCount += count($histories);
        }
        
        echo "建立了 {$historyCount} 筆訂單狀態歷史記錄\n";
    }
    
    /**
     * 為訂單建立狀態歷史
     */
    private function createStatusHistory(Order $order, $users): array
    {
        $histories = [];
        $currentDate = $order->created_at->copy();
        
        // 建立初始狀態記錄（訂單建立）
        $histories[] = OrderStatusHistory::create([
            'order_id' => $order->id,
            'status_type' => 'payment',
            'from_status' => null,
            'to_status' => 'pending',
            'user_id' => $order->creator_user_id,
            'notes' => '訂單建立',
            'created_at' => $currentDate,
        ]);
        
        $histories[] = OrderStatusHistory::create([
            'order_id' => $order->id,
            'status_type' => 'shipping',
            'from_status' => null,
            'to_status' => 'pending',
            'user_id' => $order->creator_user_id,
            'notes' => '等待處理',
            'created_at' => $currentDate,
        ]);
        
        // 根據當前狀態生成歷史軌跡
        $paymentHistory = $this->generatePaymentStatusHistory($order, $users, $currentDate);
        $histories = array_merge($histories, $paymentHistory);
        
        $shippingHistory = $this->generateShippingStatusHistory($order, $users, $currentDate);
        $histories = array_merge($histories, $shippingHistory);
        
        return $histories;
    }
    
    /**
     * 生成付款狀態歷史
     */
    private function generatePaymentStatusHistory(Order $order, $users, $baseDate): array
    {
        $histories = [];
        $currentStatus = $order->payment_status;
        
        switch ($currentStatus) {
            case 'paid':
                // pending -> paid
                $paidDate = $baseDate->copy()->addHours(rand(1, 24));
                $histories[] = OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status_type' => 'payment',
                    'from_status' => 'pending',
                    'to_status' => 'paid',
                    'user_id' => $users->random()->id,
                    'notes' => $this->getPaymentNotes('paid'),
                    'created_at' => $paidDate,
                ]);
                break;
                
            case 'partially_paid':
                // pending -> partially_paid
                $partialDate = $baseDate->copy()->addDays(rand(1, 5));
                $histories[] = OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status_type' => 'payment',
                    'from_status' => 'pending',
                    'to_status' => 'partially_paid',
                    'user_id' => $users->random()->id,
                    'notes' => $this->getPaymentNotes('partially_paid'),
                    'created_at' => $partialDate,
                ]);
                
                // 可能有多次部分付款
                if (rand(0, 1)) {
                    $histories[] = OrderStatusHistory::create([
                        'order_id' => $order->id,
                        'status_type' => 'payment',
                        'from_status' => 'partially_paid',
                        'to_status' => 'partially_paid',
                        'user_id' => $users->random()->id,
                        'notes' => '收到第二筆付款',
                        'created_at' => $partialDate->copy()->addDays(rand(3, 10)),
                    ]);
                }
                break;
                
            case 'refunded':
                // pending -> paid -> refunded
                $paidDate = $baseDate->copy()->addHours(rand(1, 24));
                $histories[] = OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status_type' => 'payment',
                    'from_status' => 'pending',
                    'to_status' => 'paid',
                    'user_id' => $users->random()->id,
                    'notes' => '收到全額付款',
                    'created_at' => $paidDate,
                ]);
                
                $refundDate = $paidDate->copy()->addDays(rand(1, 30));
                $histories[] = OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'status_type' => 'payment',
                    'from_status' => 'paid',
                    'to_status' => 'refunded',
                    'user_id' => $users->random()->id,
                    'notes' => $this->getPaymentNotes('refunded'),
                    'created_at' => $refundDate,
                ]);
                break;
        }
        
        return $histories;
    }
    
    /**
     * 生成出貨狀態歷史
     */
    private function generateShippingStatusHistory(Order $order, $users, $baseDate): array
    {
        $histories = [];
        $currentStatus = $order->shipping_status;
        $statusFlow = $this->getShippingStatusFlow($currentStatus);
        
        $previousStatus = 'pending';
        $currentDate = $baseDate->copy();
        
        foreach ($statusFlow as $status) {
            $currentDate->addDays(rand(1, 3))->addHours(rand(0, 12));
            
            $histories[] = OrderStatusHistory::create([
                'order_id' => $order->id,
                'status_type' => 'shipping',
                'from_status' => $previousStatus,
                'to_status' => $status,
                'user_id' => $this->determineUser($status, $users),
                'notes' => $this->getShippingNotes($status),
                'created_at' => $currentDate->copy(),
            ]);
            
            $previousStatus = $status;
        }
        
        return $histories;
    }
    
    /**
     * 獲取出貨狀態流程
     */
    private function getShippingStatusFlow(string $currentStatus): array
    {
        $flows = [
            'processing' => ['processing'],
            'shipped' => ['processing', 'shipped'],
            'delivered' => ['processing', 'shipped', 'delivered'],
            'cancelled' => ['cancelled'],
        ];
        
        return $flows[$currentStatus] ?? [];
    }
    
    /**
     * 決定操作用戶
     */
    private function determineUser(string $status, $users)
    {
        // 某些狀態可能是系統自動更新
        if (in_array($status, ['delivered']) && rand(0, 1)) {
            return null; // 系統自動更新
        }
        
        return $users->random()->id;
    }
    
    /**
     * 獲取付款狀態備註
     */
    private function getPaymentNotes(string $status): string
    {
        $notes = [
            'paid' => [
                '收到全額付款',
                '客戶已完成付款',
                '確認收款完成',
                '線上付款成功',
            ],
            'partially_paid' => [
                '收到部分付款',
                '收到第一筆款項',
                '客戶支付訂金',
                '收到30%預付款',
            ],
            'refunded' => [
                '已處理退款',
                '退款完成',
                '全額退款已處理',
                '客戶申請退款',
            ],
        ];
        
        $statusNotes = $notes[$status] ?? ['狀態更新'];
        return $statusNotes[array_rand($statusNotes)];
    }
    
    /**
     * 獲取出貨狀態備註
     */
    private function getShippingNotes(string $status): string
    {
        $notes = [
            'processing' => [
                '開始處理訂單',
                '倉庫備貨中',
                '正在揀貨',
                '準備出貨',
            ],
            'shipped' => [
                '已交付物流',
                '貨物已發出',
                '快遞已取件',
                '出貨完成',
            ],
            'delivered' => [
                '客戶已簽收',
                '配送完成',
                '貨物送達',
                '簽收確認',
            ],
            'cancelled' => [
                '訂單已取消',
                '客戶取消訂單',
                '庫存不足取消',
                '系統取消訂單',
            ],
        ];
        
        $statusNotes = $notes[$status] ?? ['狀態更新'];
        return $statusNotes[array_rand($statusNotes)];
    }
}