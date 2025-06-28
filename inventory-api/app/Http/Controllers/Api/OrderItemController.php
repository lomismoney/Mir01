<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateOrderItemStatusRequest;
use App\Http\Resources\Api\OrderResource;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class OrderItemController extends Controller
{
    /**

     * 更新訂單項目狀態
     * 
     * 此端點用於更新單個訂單項目的狀態，並自動記錄狀態變更歷史。
     * 適用於逐項追蹤訂單進度的場景。
 * 
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "items": [
     *       {
     *         "id": 1,
     *         "status": "已叫貨",
     *         "product_name": "辦公桌",
     *         "sku": "DESK-001"
     *       }
     *     ]
     *   }
     * }

     *   "message": "驗證失敗",
     *   "errors": {
     *     "status": ["項目狀態必須是：待處理、已叫貨、已出貨、完成 其中之一"]
     *   }
     * }

     *   "message": "找不到指定的訂單項目"
     * }
     */
    public function updateStatus(UpdateOrderItemStatusRequest $request, OrderItem $orderItem)
    {
        return DB::transaction(function () use ($request, $orderItem) {
            // 1. 權限驗證
            $this->authorize('update', $orderItem->order);
            
            // 2. 記錄原始狀態
            $originalStatus = $orderItem->status;
            $newStatus = $request->validated()['status'];
            
            // 3. 如果狀態沒有變更，直接返回
            if ($originalStatus === $newStatus) {
                return new OrderResource($orderItem->order->load([
                    'items.productVariant',
                    'customer.defaultAddress',
                    'creator',
                    'statusHistories.user'
                ]));
            }
            
            // 4. 更新訂單項目狀態
            $orderItem->update(['status' => $newStatus]);
            
            // 5. 記錄狀態變更歷史
            $notes = $request->input('notes', '') ?: "項目 {$orderItem->sku} ({$orderItem->product_name}) 狀態從「{$originalStatus}」變更為「{$newStatus}」";
            
            $orderItem->order->statusHistories()->create([
                'status_type' => 'line_item',
                'from_status' => $originalStatus,
                'to_status' => $newStatus,
                'user_id' => auth()->id(),
                'notes' => $notes,
            ]);
            
            // 6. 檢查是否需要更新整體訂單狀態
            $this->updateOrderStatusIfNeeded($orderItem->order);
            
            // 7. 重新載入訂單並返回完整資源
            $order = $orderItem->order->fresh()->load([
                'items.productVariant',
                'customer.defaultAddress', 
                'creator',
                'statusHistories.user'
            ]);
            
            return new OrderResource($order);
        });
    }
    
    /**
     * 根據訂單項目狀態自動更新整體訂單狀態
     * 
     * @param \App\Models\Order $order
     */
    protected function updateOrderStatusIfNeeded($order)
    {
        $itemStatuses = $order->items->pluck('status')->unique();
        
        // 如果所有項目都已完成，將整體訂單標記為已完成
        if ($itemStatuses->count() === 1 && $itemStatuses->first() === '完成') {
            if ($order->shipping_status !== 'delivered') {
                $originalShippingStatus = $order->shipping_status;
                $order->update(['shipping_status' => 'delivered']);
                
                // 記錄整體狀態變更
                $order->statusHistories()->create([
                    'status_type' => 'shipping',
                    'from_status' => $originalShippingStatus,
                    'to_status' => 'delivered',
                    'user_id' => auth()->id(),
                    'notes' => '所有訂單項目已完成，自動更新整體狀態為已交付',
                ]);
            }
        }
        // 如果有任何項目已出貨，且整體狀態還是待出貨，則更新為處理中
        elseif ($itemStatuses->contains('已出貨') && $order->shipping_status === 'pending') {
            $order->update(['shipping_status' => 'processing']);
            
            $order->statusHistories()->create([
                'status_type' => 'shipping',
                'from_status' => 'pending',
                'to_status' => 'processing',
                'user_id' => auth()->id(),
                'notes' => '部分訂單項目已出貨，自動更新整體狀態為處理中',
            ]);
        }
    }
}
