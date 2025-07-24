<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RefundResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /**
             * 退款 ID
             */
            'id' => $this->id,
            
            /**
             * 關聯的訂單 ID
             */
            'order_id' => $this->order_id,
            
            /**
             * 退款總金額
             */
            'total_refund_amount' => $this->total_refund_amount / 100, // 分轉元
            
            /**
             * 退款原因
             */
            'reason' => $this->reason,
            
            /**
             * 退款備註
             */
            'notes' => $this->notes,
            
            /**
             * 是否回補庫存
             */
            'should_restock' => $this->should_restock,
            
            /**
             * 創建時間
             */
            'created_at' => $this->created_at,
            
            /**
             * 更新時間
             */
            'updated_at' => $this->updated_at,
            
            /**
             * 創建退款的操作員（如果有載入）
             */
            'creator' => new UserResource($this->whenLoaded('creator')),
            
            /**
             * 關聯的訂單資訊（如果有載入）
             */
            'order' => new OrderResource($this->whenLoaded('order')),
            
            /**
             * 退款項目詳情（如果有載入）
             */
            'refund_items' => RefundItemResource::collection($this->whenLoaded('refundItems')),
        ];
    }
}
