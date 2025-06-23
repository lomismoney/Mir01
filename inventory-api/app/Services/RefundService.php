<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Exception;

/**
 * 退款服務類
 * 
 * 負責處理訂單退款的完整業務邏輯：
 * 1. 權限與狀態驗證
 * 2. 品項級別退款處理
 * 3. 庫存回補管理
 * 4. 訂單狀態更新
 * 5. 歷史記錄追蹤
 */
class RefundService
{
    /**
     * 庫存服務依賴注入
     */
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * 創建訂單退款
     * 
     * @param Order $order 目標訂單
     * @param array $data 退款資料
     * @return Refund 創建的退款記錄
     * @throws Exception 當業務邏輯驗證失敗時
     */
    public function createRefund(Order $order, array $data): Refund
    {
        return DB::transaction(function () use ($order, $data) {
            // 🔒 步驟 1：驗證權限與訂單狀態
            $this->validateRefundEligibility($order);
            
            // 📝 步驟 2：創建主退款單
            $refund = $this->createMainRefund($order, $data);
            
            // 📦 步驟 3：處理退款品項
            $totalRefundAmount = $this->processRefundItems($refund, $data['items']);
            
            // 💰 步驟 4：更新退款總額
            $refund->update(['total_refund_amount' => $totalRefundAmount]);
            
            // 📦 步驟 5：處理庫存回補
            if ($data['should_restock']) {
                $this->processInventoryRestock($refund);
            }
            
            // 🔄 步驟 6：更新訂單狀態
            $this->updateOrderStatus($order, $totalRefundAmount);
            
            // 📜 步驟 7：記錄歷史
            $this->recordRefundHistory($order, $refund);
            
            return $refund->load('refundItems.orderItem');
        });
    }

    /**
     * 驗證退款資格
     * 
     * @param Order $order
     * @throws Exception
     */
    protected function validateRefundEligibility(Order $order): void
    {
        // 檢查訂單是否已付款
        if ($order->payment_status === 'pending') {
            throw new Exception('未付款的訂單無法退款');
        }
        
        // 檢查訂單是否已取消
        if ($order->shipping_status === 'cancelled') {
            throw new Exception('已取消的訂單無法退款');
        }
        
        // 檢查是否還有可退款金額
        if ($order->paid_amount <= 0) {
            throw new Exception('此訂單沒有可退款金額');
        }
    }

    /**
     * 創建主退款單
     * 
     * @param Order $order
     * @param array $data
     * @return Refund
     */
    protected function createMainRefund(Order $order, array $data): Refund
    {
        return Refund::create([
            'order_id' => $order->id,
            'creator_id' => Auth::id(),
            'total_refund_amount' => 0, // 暫時設為 0，稍後計算
            'reason' => $data['reason'],
            'notes' => $data['notes'] ?? null,
            'should_restock' => $data['should_restock'],
        ]);
    }

    /**
     * 處理退款品項
     * 
     * @param Refund $refund
     * @param array $items
     * @return float 總退款金額
     * @throws Exception
     */
    protected function processRefundItems(Refund $refund, array $items): float
    {
        $totalRefundAmount = 0;
        
        foreach ($items as $item) {
            $orderItem = OrderItem::findOrFail($item['order_item_id']);
            
            // 驗證訂單品項屬於正確的訂單
            if ($orderItem->order_id !== $refund->order_id) {
                throw new Exception("訂單品項 {$orderItem->id} 不屬於訂單 {$refund->order_id}");
            }
            
            // 驗證退貨數量
            $this->validateRefundQuantity($orderItem, $item['quantity']);
            
            // 計算退款小計
            $refundSubtotal = $orderItem->price * $item['quantity'];
            
            // 創建退款品項記錄
            RefundItem::create([
                'refund_id' => $refund->id,
                'order_item_id' => $orderItem->id,
                'quantity' => $item['quantity'],
                'refund_subtotal' => $refundSubtotal,
            ]);
            
            $totalRefundAmount += $refundSubtotal;
        }
        
        return $totalRefundAmount;
    }

    /**
     * 驗證退貨數量
     * 
     * @param OrderItem $orderItem
     * @param int $refundQuantity
     * @throws Exception
     */
    protected function validateRefundQuantity(OrderItem $orderItem, int $refundQuantity): void
    {
        // 計算已退貨數量
        $alreadyRefundedQuantity = RefundItem::whereHas('refund', function ($query) use ($orderItem) {
            $query->where('order_id', $orderItem->order_id);
        })->where('order_item_id', $orderItem->id)->sum('quantity');
        
        // 計算可退貨數量
        $availableQuantity = $orderItem->quantity - $alreadyRefundedQuantity;
        
        if ($refundQuantity > $availableQuantity) {
            // 🎯 根據是否為訂製商品，使用不同的識別方式
            $itemIdentifier = $orderItem->product_variant_id 
                ? $orderItem->productVariant->sku 
                : $orderItem->sku; // 訂製商品直接使用訂單項目的 SKU
                
            throw new Exception(
                "品項 {$itemIdentifier} 的退貨數量 ({$refundQuantity}) " .
                "超過可退數量 ({$availableQuantity})"
            );
        }
        
        if ($refundQuantity <= 0) {
            throw new Exception("退貨數量必須大於 0");
        }
    }

    /**
     * 處理庫存回補
     * 
     * @param Refund $refund
     */
    protected function processInventoryRestock(Refund $refund): void
    {
        foreach ($refund->refundItems as $refundItem) {
            $orderItem = $refundItem->orderItem;
            
            // 🎯 只有當 product_variant_id 存在時（即為標準品），才執行庫存返還
            if ($orderItem && $orderItem->product_variant_id) {
                $productVariant = $orderItem->productVariant;
                
                // 通過庫存服務增加庫存
                $this->inventoryService->adjustInventory(
                    productVariantId: $productVariant->id,
                    storeId: $refund->order->store_id ?? 1, // 假設有門市 ID，否則使用預設
                    quantityChange: $refundItem->quantity,
                    type: 'refund_restock',
                    notes: "退款回補庫存 - 退款單 #{$refund->id}",
                    reference: "refund:{$refund->id}"
                );
            }
            // 如果是訂製商品（product_variant_id 為 null），則跳過庫存回補
        }
    }

    /**
     * 更新訂單狀態
     * 
     * @param Order $order
     * @param float $refundAmount
     */
    protected function updateOrderStatus(Order $order, float $refundAmount): void
    {
        // 更新已付金額
        $newPaidAmount = $order->paid_amount - $refundAmount;
        
        // 決定新的付款狀態
        $newPaymentStatus = $this->determinePaymentStatus($order, $newPaidAmount);
        
        // 更新訂單
        $order->update([
            'paid_amount' => max(0, $newPaidAmount), // 確保不會是負數
            'payment_status' => $newPaymentStatus,
        ]);
    }

    /**
     * 決定付款狀態
     * 
     * @param Order $order
     * @param float $newPaidAmount
     * @return string
     */
    protected function determinePaymentStatus(Order $order, float $newPaidAmount): string
    {
        if ($newPaidAmount <= 0) {
            return 'refunded'; // 完全退款
        } elseif ($newPaidAmount < $order->grand_total) {
            return 'partial'; // 部分退款
        } else {
            return 'paid'; // 仍然是已付款狀態
        }
    }

    /**
     * 記錄退款歷史
     * 
     * @param Order $order
     * @param Refund $refund
     */
    protected function recordRefundHistory(Order $order, Refund $refund): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => '退款處理',
            'notes' => "處理退款 #{$refund->id}，退款金額：$" . number_format($refund->total_refund_amount, 2),
            'created_by' => Auth::id(),
        ]);
    }

    /**
     * 獲取訂單的退款歷史
     * 
     * @param Order $order
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getOrderRefunds(Order $order)
    {
        return Refund::where('order_id', $order->id)
                    ->with(['refundItems.orderItem.productVariant', 'creator'])
                    ->orderBy('created_at', 'desc')
                    ->get();
    }

    /**
     * 計算訂單的總退款金額
     * 
     * @param Order $order
     * @return float
     */
    public function getTotalRefundAmount(Order $order): float
    {
        return Refund::where('order_id', $order->id)->sum('total_refund_amount');
    }
} 