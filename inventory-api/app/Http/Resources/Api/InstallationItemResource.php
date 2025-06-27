<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstallationItemResource extends JsonResource
{
    /**
     * 將資源轉換為陣列
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'installation_id' => $this->installation_id,
            'order_item_id' => $this->order_item_id,
            'product_variant_id' => $this->product_variant_id,
            
            // 商品資訊
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'quantity' => $this->quantity,
            'specifications' => $this->specifications,
            
            // 狀態
            'status' => $this->status,
            
            // 備註
            'notes' => $this->notes,
            
            // 時間戳記
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
            
            // 關聯資源（按需加載）
            'order_item' => new OrderItemResource($this->whenLoaded('orderItem')),
            'product_variant' => new ProductVariantResource($this->whenLoaded('productVariant')),
            
            // 計算屬性
            'is_completed' => $this->isCompleted(),
            'is_pending' => $this->isPending(),
        ];
    }
} 