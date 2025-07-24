<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentRecordResource extends JsonResource
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
            'amount' => $this->getRawOriginal('amount') / 100, // 分轉元
            'payment_method' => $this->payment_method,
            'payment_date' => $this->payment_date,
            'transaction_id' => $this->transaction_id,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // 關聯的用戶資訊（付款記錄者）
            'creator' => new UserResource($this->whenLoaded('creator')),
        ];
    }
}
