<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Refund;
use App\Models\RefundItem;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Services\BaseService;
use App\Services\Traits\HandlesInventoryOperations;
use App\Services\Traits\HandlesStatusHistory;
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
class RefundService extends BaseService
{
    use HandlesInventoryOperations, HandlesStatusHistory;
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
        return $this->executeInTransaction(function () use ($order, $data) {
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
            'creator_id' => $this->requireAuthentication('創建退款單'),
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
            
            // 計算退款小計，考慮訂單項目的折扣
            $itemTotalPrice = $orderItem->price * $orderItem->quantity;
            $itemDiscountAmount = $orderItem->discount_amount ?? 0;
            $actualItemPrice = ($itemTotalPrice - $itemDiscountAmount) / $orderItem->quantity;
            $refundSubtotal = $actualItemPrice * $item['quantity'];
            
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
                ? ($orderItem->productVariant ? $orderItem->productVariant->sku : "變體ID:{$orderItem->product_variant_id}")
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
     * 處理庫存回補（改進版）
     * 
     * 改進點：
     * 1. 支援部分回補失敗的容錯機制
     * 2. 增強的錯誤處理和回滾邏輯
     * 3. 詳細的審計記錄
     * 4. 庫存可用性預檢查
     * 
     * @param Refund $refund
     * @throws \Exception 當關鍵庫存回補失敗時
     */
    protected function processInventoryRestock(Refund $refund): void
    {
        $restockResults = [];
        $failedItems = [];
        
        // 1. 預檢查：收集需要回補的項目
        $itemsToRestock = $this->collectItemsForRestock($refund);
        
        if (empty($itemsToRestock)) {
            \Log::info("退款無需庫存回補", [
                'refund_id' => $refund->id,
                'reason' => '沒有符合回補條件的商品'
            ]);
            return;
        }
        
        // 2. 逐項處理庫存回補
        foreach ($itemsToRestock as $item) {
            try {
                $this->processIndividualRestock($refund, $item);
                $restockResults[] = [
                    'refund_item_id' => $item['refund_item_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'status' => 'success'
                ];
                
            } catch (\Exception $e) {
                $failedItems[] = [
                    'refund_item_id' => $item['refund_item_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'error' => $e->getMessage(),
                    'status' => 'failed'
                ];
                
                \Log::error("退款庫存回補失敗", [
                    'refund_id' => $refund->id,
                    'refund_item_id' => $item['refund_item_id'],
                    'product_variant_id' => $item['product_variant_id'],
                    'quantity' => $item['quantity'],
                    'error' => $e->getMessage(),
                    'sku' => $item['sku']
                ]);
                
                // 如果是關鍵錯誤（如商品變體不存在），拋出異常
                if ($this->isCriticalRestockError($e)) {
                    throw $e;
                }
            }
        }
        
        // 3. 記錄整體回補結果
        $this->logRestockSummary($refund, $restockResults, $failedItems);
        
        // 4. 如果有失敗項目，根據策略決定是否拋出異常
        if (!empty($failedItems) && $this->shouldFailOnPartialRestockFailure()) {
            $errorMsg = "部分庫存回補失敗：" . implode('; ', array_column($failedItems, 'error'));
            throw new \Exception($errorMsg);
        }
    }

    /**
     * 收集需要回補庫存的項目
     * 
     * @param Refund $refund
     * @return array
     */
    protected function collectItemsForRestock(Refund $refund): array
    {
        $itemsToRestock = [];
        
        foreach ($refund->refundItems as $refundItem) {
            $orderItem = $refundItem->orderItem;
            
            if ($orderItem && $this->shouldRestockInventory($orderItem)) {
                $productVariant = $orderItem->productVariant;
                
                if (!$productVariant) {
                    \Log::warning("退款項目商品變體不存在", [
                        'refund_id' => $refund->id,
                        'order_item_id' => $orderItem->id,
                        'product_variant_id' => $orderItem->product_variant_id
                    ]);
                    continue;
                }
                
                $itemsToRestock[] = [
                    'refund_item_id' => $refundItem->id,
                    'order_item_id' => $orderItem->id,
                    'product_variant_id' => $productVariant->id,
                    'quantity' => $refundItem->quantity,
                    'sku' => $productVariant->sku,
                    'product_name' => $orderItem->product_name,
                    'item_type' => $this->getItemType($orderItem)
                ];
            } else {
                // 記錄跳過的原因
                $itemType = $orderItem ? $this->getItemType($orderItem) : '未知';
                $reason = $this->getSkipRestockReason($orderItem);
                
                \Log::info("退款跳過庫存回補", [
                    'refund_id' => $refund->id,
                    'refund_item_id' => $refundItem->id,
                    'order_item_id' => $orderItem?->id,
                    'item_type' => $itemType,
                    'reason' => $reason
                ]);
            }
        }
        
        return $itemsToRestock;
    }
    
    /**
     * 處理單個項目的庫存回補
     * 
     * @param Refund $refund
     * @param array $item
     * @throws \Exception
     */
    protected function processIndividualRestock(Refund $refund, array $item): void
    {
        // 通過庫存服務返還庫存（使用預設門市）
        $this->inventoryService->returnStock(
            $item['product_variant_id'],
            $item['quantity'],
            null, // 使用預設門市
            "退款回補庫存 - 退款單 #{$refund->id} 項目 #{$item['refund_item_id']}",
            [
                'refund_id' => $refund->id,
                'refund_item_id' => $item['refund_item_id'],
                'order_item_id' => $item['order_item_id'],
                'operation_type' => 'refund_restock'
            ]
        );
        
        \Log::info("退款庫存回補成功", [
            'refund_id' => $refund->id,
            'refund_item_id' => $item['refund_item_id'],
            'product_variant_id' => $item['product_variant_id'],
            'sku' => $item['sku'],
            'quantity' => $item['quantity'],
            'item_type' => $item['item_type']
        ]);
    }
    
    /**
     * 判斷是否需要返還庫存
     * 
     * 修正後的邏輯：
     * 1. 現貨商品（is_stocked_sale = true）：總是需要返還庫存
     * 2. 預訂商品或訂製商品：
     *    - 如果已履行（is_fulfilled = true）：需要返還庫存
     *    - 如果未履行（is_fulfilled = false）：不需要返還庫存
     */
    protected function shouldRestockInventory(OrderItem $orderItem): bool
    {
        // 必須有商品變體ID才能返還庫存
        if (!$orderItem->product_variant_id) {
            return false;
        }
        
        // 現貨商品：總是需要返還庫存
        if ($orderItem->is_stocked_sale) {
            return true;
        }
        
        // 預訂商品或訂製商品：只有已履行的才需要返還庫存
        return $orderItem->is_fulfilled;
    }
    
    /**
     * 獲取跳過庫存回補的原因
     * 
     * @param OrderItem|null $orderItem
     * @return string
     */
    protected function getSkipRestockReason(?OrderItem $orderItem): string
    {
        if (!$orderItem) {
            return '訂單項目不存在';
        }
        
        if (!$orderItem->product_variant_id) {
            return '無商品變體ID（訂製商品）';
        }
        
        if ($orderItem->is_stocked_sale) {
            return '現貨商品但邏輯錯誤';
        }
        
        if (!$orderItem->is_fulfilled) {
            return '預訂商品尚未履行';
        }
        
        return '未知原因';
    }
    
    /**
     * 判斷是否為關鍵性回補錯誤
     * 
     * @param \Exception $exception
     * @return bool
     */
    protected function isCriticalRestockError(\Exception $exception): bool
    {
        $message = $exception->getMessage();
        
        // 關鍵錯誤：商品變體不存在、門市不存在等
        $criticalPatterns = [
            '商品變體.*不存在',
            '門市.*不存在',
            '資料庫.*錯誤',
            'Foreign key constraint'
        ];
        
        foreach ($criticalPatterns as $pattern) {
            if (preg_match("/{$pattern}/i", $message)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 是否在部分回補失敗時整體失敗
     * 
     * @return bool
     */
    protected function shouldFailOnPartialRestockFailure(): bool
    {
        // 可以從配置文件讀取，這裡暫時設為 false
        // 表示部分失敗不影響整體退款流程
        return false;
    }
    
    /**
     * 記錄回補操作摘要
     * 
     * @param Refund $refund
     * @param array $successResults
     * @param array $failedResults
     */
    protected function logRestockSummary(Refund $refund, array $successResults, array $failedResults): void
    {
        $summary = [
            'refund_id' => $refund->id,
            'total_items' => count($successResults) + count($failedResults),
            'success_count' => count($successResults),
            'failed_count' => count($failedResults),
            'success_quantity' => array_sum(array_column($successResults, 'quantity')),
            'failed_quantity' => array_sum(array_column($failedResults, 'quantity'))
        ];
        
        if ($summary['failed_count'] > 0) {
            $summary['failed_items'] = $failedResults;
            \Log::warning("退款庫存回補摘要（含失敗項目）", $summary);
        } else {
            \Log::info("退款庫存回補摘要（全部成功）", $summary);
        }
    }

    /**
     * 獲取商品類型描述
     */
    protected function getItemType(OrderItem $orderItem): string
    {
        $type = '';
        
        if (!$orderItem->product_variant_id) {
            $type = '訂製商品';
        } elseif ($orderItem->is_backorder) {
            $type = '預訂商品';
        } elseif ($orderItem->is_stocked_sale) {
            $type = '現貨商品';
        } else {
            $type = '其他類型商品';
        }
        
        // 加上履行狀態
        if ($orderItem->is_fulfilled) {
            $type .= '(已履行)';
        } elseif (!$orderItem->is_stocked_sale && $orderItem->product_variant_id) {
            $type .= '(未履行)';
        }
        
        return $type;
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
            'status_type' => 'refund',
            'from_status' => $order->payment_status,
            'to_status' => 'refund_processed',
            'notes' => "處理退款 #{$refund->id}，退款金額：$" . number_format($refund->total_refund_amount, 2),
            'user_id' => $this->requireAuthentication('狀態記錄'),
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

    /**
     * 驗證退款前的庫存狀態
     * 
     * 在進行退款前，檢查相關商品的庫存是否正常
     * 這有助於及早發現潛在問題
     * 
     * @param Order $order
     * @param array $refundData
     * @return array 驗證結果
     */
    public function validateInventoryForRefund(Order $order, array $refundData): array
    {
        $validationResults = [
            'can_proceed' => true,
            'warnings' => [],
            'blocked_items' => []
        ];
        
        if (!$refundData['should_restock']) {
            return $validationResults; // 不需要回補庫存，直接通過
        }
        
        foreach ($refundData['items'] as $itemData) {
            $orderItem = OrderItem::findOrFail($itemData['order_item_id']);
            
            if ($this->shouldRestockInventory($orderItem)) {
                $productVariant = $orderItem->productVariant;
                
                if (!$productVariant) {
                    $validationResults['warnings'][] = [
                        'order_item_id' => $orderItem->id,
                        'message' => "商品變體不存在，無法回補庫存",
                        'sku' => $orderItem->sku
                    ];
                    continue;
                }
                
                // 檢查是否存在庫存異常
                $currentInventory = \App\Models\Inventory::where('product_variant_id', $productVariant->id)
                    ->where('store_id', $order->store_id ?? $this->inventoryService->getDefaultStoreId())
                    ->first();
                
                if ($currentInventory && $currentInventory->quantity < 0) {
                    $validationResults['warnings'][] = [
                        'order_item_id' => $orderItem->id,
                        'message' => "商品庫存為負數 ({$currentInventory->quantity})，回補後可能仍為負數",
                        'sku' => $productVariant->sku,
                        'current_quantity' => $currentInventory->quantity
                    ];
                }
            }
        }
        
        return $validationResults;
    }

    /**
     * 補償性庫存回補
     * 
     * 當退款處理完成後發現庫存回補失敗，可以使用此方法進行補償
     * 
     * @param Refund $refund
     * @param array $options
     * @return array 補償結果
     */
    public function compensateFailedRestock(Refund $refund, array $options = []): array
    {
        return $this->executeInTransaction(function () use ($refund, $options) {
            $compensationResults = [];
            
            // 獲取此退款的所有項目
            $refundItems = $refund->refundItems()->with('orderItem.productVariant')->get();
            
            foreach ($refundItems as $refundItem) {
                $orderItem = $refundItem->orderItem;
                
                if (!$orderItem || !$this->shouldRestockInventory($orderItem)) {
                    continue;
                }
                
                $productVariant = $orderItem->productVariant;
                if (!$productVariant) {
                    continue;
                }
                
                // 檢查此項目是否已經成功回補過庫存
                $existingRestockTransaction = \App\Models\InventoryTransaction::whereHas('inventory', function ($query) use ($productVariant, $refund) {
                        $query->where('product_variant_id', $productVariant->id);
                    })
                    ->where('type', 'return')
                    ->where('metadata', 'like', '%"refund_id":' . $refund->id . '%')
                    ->where('quantity', $refundItem->quantity)
                    ->exists();
                
                if ($existingRestockTransaction) {
                    $compensationResults[] = [
                        'refund_item_id' => $refundItem->id,
                        'status' => 'already_restocked',
                        'message' => '庫存已回補過'
                    ];
                    continue;
                }
                
                // 嘗試執行補償性回補
                try {
                    $this->inventoryService->returnStock(
                        $productVariant->id,
                        $refundItem->quantity,
                        null,
                        "補償性庫存回補 - 退款單 #{$refund->id} 項目 #{$refundItem->id}",
                        [
                            'refund_id' => $refund->id,
                            'refund_item_id' => $refundItem->id,
                            'operation_type' => 'compensate_restock',
                            'compensated_at' => now()->toISOString()
                        ]
                    );
                    
                    $compensationResults[] = [
                        'refund_item_id' => $refundItem->id,
                        'status' => 'compensated',
                        'quantity' => $refundItem->quantity,
                        'sku' => $productVariant->sku
                    ];
                    
                    \Log::info("補償性庫存回補成功", [
                        'refund_id' => $refund->id,
                        'refund_item_id' => $refundItem->id,
                        'product_variant_id' => $productVariant->id,
                        'quantity' => $refundItem->quantity
                    ]);
                    
                } catch (\Exception $e) {
                    $compensationResults[] = [
                        'refund_item_id' => $refundItem->id,
                        'status' => 'compensation_failed',
                        'error' => $e->getMessage(),
                        'sku' => $productVariant->sku
                    ];
                    
                    \Log::error("補償性庫存回補失敗", [
                        'refund_id' => $refund->id,
                        'refund_item_id' => $refundItem->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            // 記錄補償操作摘要
            \Log::info("退款補償性庫存回補完成", [
                'refund_id' => $refund->id,
                'total_items' => count($compensationResults),
                'compensated' => count(array_filter($compensationResults, fn($r) => $r['status'] === 'compensated')),
                'already_done' => count(array_filter($compensationResults, fn($r) => $r['status'] === 'already_restocked')),
                'failed' => count(array_filter($compensationResults, fn($r) => $r['status'] === 'compensation_failed'))
            ]);
            
            return $compensationResults;
        });
    }

    /**
     * 獲取退款的庫存回補狀態報告
     * 
     * @param Refund $refund
     * @return array
     */
    public function getRestockStatusReport(Refund $refund): array
    {
        $report = [
            'refund_id' => $refund->id,
            'should_restock' => $refund->should_restock,
            'items' => [],
            'summary' => [
                'total_items' => 0,
                'restocked_items' => 0,
                'skipped_items' => 0,
                'failed_items' => 0
            ]
        ];
        
        foreach ($refund->refundItems()->with('orderItem.productVariant')->get() as $refundItem) {
            $orderItem = $refundItem->orderItem;
            $report['summary']['total_items']++;
            
            $itemStatus = [
                'refund_item_id' => $refundItem->id,
                'order_item_id' => $orderItem?->id,
                'quantity' => $refundItem->quantity,
                'should_restock' => false,
                'restock_status' => 'unknown',
                'reason' => ''
            ];
            
            if (!$orderItem) {
                $itemStatus['restock_status'] = 'skipped';
                $itemStatus['reason'] = '訂單項目不存在';
                $report['summary']['skipped_items']++;
            } elseif (!$this->shouldRestockInventory($orderItem)) {
                $itemStatus['restock_status'] = 'skipped';
                $itemStatus['reason'] = $this->getSkipRestockReason($orderItem);
                $report['summary']['skipped_items']++;
            } else {
                $itemStatus['should_restock'] = true;
                $productVariant = $orderItem->productVariant;
                
                if (!$productVariant) {
                    $itemStatus['restock_status'] = 'failed';
                    $itemStatus['reason'] = '商品變體不存在';
                    $report['summary']['failed_items']++;
                } else {
                    // 檢查是否有庫存回補記錄
                    $restockTransaction = \App\Models\InventoryTransaction::whereHas('inventory', function ($query) use ($productVariant) {
                            $query->where('product_variant_id', $productVariant->id);
                        })
                        ->where('type', 'return')
                        ->where('metadata', 'like', '%"refund_id":' . $refund->id . '%')
                        ->where('quantity', $refundItem->quantity)
                        ->first();
                    
                    if ($restockTransaction) {
                        $itemStatus['restock_status'] = 'completed';
                        $itemStatus['restocked_at'] = $restockTransaction->created_at;
                        $report['summary']['restocked_items']++;
                    } else {
                        $itemStatus['restock_status'] = 'missing';
                        $itemStatus['reason'] = '未找到庫存回補記錄';
                        $report['summary']['failed_items']++;
                    }
                    
                    $itemStatus['sku'] = $productVariant->sku;
                    $itemStatus['product_name'] = $orderItem->product_name;
                }
            }
            
            $report['items'][] = $itemStatus;
        }
        
        return $report;
    }

    // ===== 測試輔助方法 =====

    /**
     * 檢查用戶是否有效認證（測試用）
     */
    public function hasValidAuth(): bool
    {
        return Auth::user() !== null;
    }

    /**
     * 獲取多個退款及其關聯（測試用）
     */
    public function getRefundsWithRelations(array $refundIds): \Illuminate\Database\Eloquent\Collection
    {
        return Refund::whereIn('id', $refundIds)
            ->with([
                'order.customer',
                'refundItems.orderItem.productVariant'
            ])
            ->get();
    }

    /**
     * 審核退款（測試用）
     */
    public function approveRefund(Refund $refund, string $notes = ''): Refund
    {
        return $this->executeInTransaction(function () use ($refund, $notes) {
            $originalStatus = $refund->status;
            
            $refund->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id()
            ]);

            // 記錄審核信息（目前 Refund 模型沒有狀態歷史）
            // TODO: 如果需要，可以添加狀態歷史功能

            $refund->refresh();
            return $refund->load(['order', 'refundItems']);
        });
    }
} 