<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 銷售記錄資源
 * 
 * 用於格式化銷售記錄的 API 輸出
 */
class SaleResource extends JsonResource
{
    /**
     * 將資源轉換為陣列
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_number' => $this->transaction_number,
            'total_amount' => $this->total_amount,
            'payment_method' => $this->payment_method,
            'sold_at' => $this->sold_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 條件性包含關聯（避免循環引用）
            'store_id' => $this->store_id,
            'store_name' => $this->whenLoaded('store', fn() => $this->store?->name),
            'items' => SaleItemResource::collection($this->whenLoaded('items')),
        ];
    }
} 