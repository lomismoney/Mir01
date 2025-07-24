<?php

namespace Database\Seeders;

use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Inventory;
use App\Services\RefundService;
use Illuminate\Database\Seeder;

class RefundSeeder extends Seeder
{
    /**
     * 運行退款數據播種器
     */
    public function run(): void
    {
        // 獲取可退款的訂單（已付款或已發貨）
        $refundableOrders = $this->getRefundableOrders();
        
        if ($refundableOrders->isEmpty()) {
            echo "警告：沒有找到可退款的訂單\n";
            return;
        }
        
        $refundCount = 0;
        $itemCount = 0;
        $refundService = app(RefundService::class);
        
        // 建立各種退款場景
        foreach ($refundableOrders as $order) {
            $scenario = $this->determineRefundScenario($refundCount);
            
            if ($scenario === 'skip') {
                continue;
            }
            
            $user = User::inRandomOrder()->first();
            
            try {
                // 設置認證用戶以通過權限檢查
                auth()->login($user);
                
                // 根據場景建立退款
                $refundData = $this->prepareRefundData($order, $scenario);
                
                // 檢查返回的數據結構
                if (!isset($refundData['reason']) || !isset($refundData['notes']) || !isset($refundData['should_restock'])) {
                    continue;
                }
                
                if (empty($refundData['items'])) {
                    continue;
                }
                
                // 使用 RefundService 建立退款（會自動處理庫存等邏輯）
                $refund = $refundService->createRefund($order, $refundData);
                
                $refundCount++;
                $itemCount += count($refundData['items']);
                
            } catch (\Exception $e) {
                echo "建立退款失敗（訂單 {$order->order_number}）：{$e->getMessage()}\n";
            } finally {
                // 確保登出用戶
                auth()->logout();
            }
        }
        
        echo "建立了 {$refundCount} 個退款單，包含 {$itemCount} 個退款項目\n";
    }
    
    /**
     * 獲取可退款的訂單
     */
    private function getRefundableOrders()
    {
        return Order::whereIn('payment_status', ['paid', 'partially_paid'])
                   ->whereIn('shipping_status', ['pending', 'processing', 'shipped', 'delivered'])
                   ->with(['items.productVariant', 'customer'])
                   ->limit(15)
                   ->get();
    }
    
    /**
     * 決定退款場景
     */
    private function determineRefundScenario($refundCount): string
    {
        $scenarios = [
            'full_refund',      // 全額退款
            'partial_refund',   // 部分退款
            'single_item',      // 單一商品退款
            'quality_issue',    // 品質問題退款
            'wrong_item',       // 發錯貨退款
            'skip',             // 跳過
            'skip',
        ];
        
        // 確保前幾個退款涵蓋主要場景
        if ($refundCount < 5) {
            return $scenarios[$refundCount];
        }
        
        return $scenarios[array_rand($scenarios)];
    }
    
    /**
     * 準備退款資料
     */
    private function prepareRefundData(Order $order, string $scenario): array
    {
        switch ($scenario) {
            case 'full_refund':
                return $this->prepareFullRefund($order);
                
            case 'partial_refund':
                return $this->preparePartialRefund($order);
                
            case 'single_item':
                return $this->prepareSingleItemRefund($order);
                
            case 'quality_issue':
                return $this->prepareQualityIssueRefund($order);
                
            case 'wrong_item':
                return $this->prepareWrongItemRefund($order);
                
            default:
                return [
                    'items' => [],
                    'reason' => '其他原因',
                    'notes' => '其他退款原因',
                    'should_restock' => true,
                ];
        }
    }
    
    /**
     * 準備全額退款
     */
    private function prepareFullRefund(Order $order): array
    {
        $items = [];
        
        foreach ($order->items as $orderItem) {
            // 計算已退款數量
            $refundedQuantity = RefundItem::where('order_item_id', $orderItem->id)->sum('quantity');
            $availableQuantity = $orderItem->quantity - $refundedQuantity;
            
            if ($availableQuantity > 0) {
                $items[] = [
                    'order_item_id' => $orderItem->id,
                    'quantity' => $availableQuantity,
                    'refund_subtotal' => $orderItem->price * $availableQuantity, // 元為單位，RefundItem 模型會透過 MoneyCast 處理
                ];
            }
        }
        
        return [
            'items' => $items,
            'reason' => '客戶取消訂單',
            'notes' => '客戶要求全額退款，已聯繫確認',
            'should_restock' => true,
        ];
    }
    
    /**
     * 準備部分退款
     */
    private function preparePartialRefund(Order $order): array
    {
        $items = [];
        $availableItems = [];
        
        // 收集可退款項目
        foreach ($order->items as $orderItem) {
            $refundedQuantity = RefundItem::where('order_item_id', $orderItem->id)->sum('quantity');
            $availableQuantity = $orderItem->quantity - $refundedQuantity;
            
            if ($availableQuantity > 0) {
                $availableItems[] = [
                    'order_item' => $orderItem,
                    'available_quantity' => $availableQuantity,
                ];
            }
        }
        
        // 隨機選擇一半項目退款
        $selectedCount = max(1, (int)(count($availableItems) / 2));
        $selectedItems = array_rand($availableItems, min($selectedCount, count($availableItems)));
        
        if (!is_array($selectedItems)) {
            $selectedItems = [$selectedItems];
        }
        
        foreach ($selectedItems as $index) {
            $item = $availableItems[$index];
            $refundQuantity = rand(1, $item['available_quantity']);
            
            $items[] = [
                'order_item_id' => $item['order_item']->id,
                'quantity' => $refundQuantity,
                'refund_subtotal' => $item['order_item']->price * $refundQuantity,
            ];
        }
        
        return [
            'items' => $items,
            'reason' => '部分商品不符期待',
            'notes' => '客戶收到商品後，部分商品不滿意',
            'should_restock' => true,
        ];
    }
    
    /**
     * 準備單一商品退款
     */
    private function prepareSingleItemRefund(Order $order): array
    {
        $items = [];
        
        // 隨機選擇一個可退款項目
        foreach ($order->items as $orderItem) {
            $refundedQuantity = RefundItem::where('order_item_id', $orderItem->id)->sum('quantity');
            $availableQuantity = $orderItem->quantity - $refundedQuantity;
            
            if ($availableQuantity > 0) {
                $items[] = [
                    'order_item_id' => $orderItem->id,
                    'quantity' => min(1, $availableQuantity),
                    'refund_subtotal' => $orderItem->price * min(1, $availableQuantity), // 元為單位，RefundItem 模型會透過 MoneyCast 處理
                ];
                break; // 只退一個項目
            }
        }
        
        return [
            'items' => $items,
            'reason' => '商品瑕疵',
            'notes' => '商品有輕微瑕疵，客戶要求退款',
            'should_restock' => false, // 瑕疵品不回補庫存
        ];
    }
    
    /**
     * 準備品質問題退款
     */
    private function prepareQualityIssueRefund(Order $order): array
    {
        $items = [];
        
        // 選擇1-2個項目作為品質問題退款
        $count = 0;
        foreach ($order->items as $orderItem) {
            if ($count >= 2) break;
            
            $refundedQuantity = RefundItem::where('order_item_id', $orderItem->id)->sum('quantity');
            $availableQuantity = $orderItem->quantity - $refundedQuantity;
            
            if ($availableQuantity > 0) {
                $refundQuantity = min(rand(1, 2), $availableQuantity);
                
                $items[] = [
                    'order_item_id' => $orderItem->id,
                    'quantity' => $refundQuantity,
                    'refund_subtotal' => $orderItem->price * $refundQuantity, // 元為單位，RefundItem 模型會透過 MoneyCast 處理
                ];
                $count++;
            }
        }
        
        return [
            'items' => $items,
            'reason' => '品質問題',
            'notes' => '商品功能異常，無法正常使用',
            'should_restock' => false, // 品質問題商品不回補庫存
        ];
    }
    
    /**
     * 準備發錯貨退款
     */
    private function prepareWrongItemRefund(Order $order): array
    {
        $items = [];
        
        // 隨機選擇一個項目作為發錯貨
        $orderItems = $order->items->shuffle();
        foreach ($orderItems as $orderItem) {
            $refundedQuantity = RefundItem::where('order_item_id', $orderItem->id)->sum('quantity');
            $availableQuantity = $orderItem->quantity - $refundedQuantity;
            
            if ($availableQuantity > 0) {
                $items[] = [
                    'order_item_id' => $orderItem->id,
                    'quantity' => $availableQuantity,
                    'refund_subtotal' => $orderItem->price * $availableQuantity,
                ];
                break; // 只處理一個錯誤項目
            }
        }
        
        return [
            'items' => $items,
            'reason' => '發錯商品',
            'notes' => '倉庫發錯商品規格，客戶要求更換',
            'should_restock' => true, // 發錯的商品可以回補庫存
        ];
    }
}