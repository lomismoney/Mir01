<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 銷售項目資源
 * 
 * 用於格式化銷售項目的 API 輸出
 */
class SaleItemResource extends JsonResource
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
            'sale_id' => $this->sale_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'subtotal' => $this->quantity * $this->unit_price,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 條件性包含關聯（避免循環引用）
            'sale_transaction_number' => $this->whenLoaded('sale', fn() => $this->sale?->transaction_number),
            'product' => new ProductResource($this->whenLoaded('product')),
        ];
    }
} 