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
            'id' => $this->id,
            'order_id' => $this->order_id,
            'refund_number' => $this->refund_number,
            'total_refund_amount' => $this->total_refund_amount,
            'refund_method' => $this->refund_method,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'should_restock' => $this->should_restock,
            'status' => $this->status,
            'refunded_at' => $this->refunded_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // 關聯的用戶資訊（退款處理者）
            'user' => new UserResource($this->whenLoaded('user')),
            // 退款項目詳情（如果有載入）
            'refund_items' => $this->whenLoaded('refundItems'),
        ];
    }
}
