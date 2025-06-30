<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 退款品項資源
 * 
 * 將退款品項模型轉換為 API 回應格式
 */
class RefundItemResource extends JsonResource
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
             * 退款品項 ID
             */
            'id' => $this->id,
            
            /**
             * 所屬退款單 ID
             */
            'refund_id' => $this->refund_id,
            
            /**
             * 對應的訂單品項 ID
             */
            'order_item_id' => $this->order_item_id,
            
            /**
             * 退貨數量
             */
            'quantity' => $this->quantity,
            
            /**
             * 退款小計
             */
            'refund_subtotal' => $this->refund_subtotal,
            
            /**
             * 商品名稱（從關聯獲取）
             */
            'product_name' => $this->product_name,
            
            /**
             * 商品 SKU（從關聯獲取）
             */
            'sku' => $this->sku,
            
            /**
             * 單價（從關聯獲取）
             */
            'unit_price' => $this->unit_price,
            
            /**
             * 創建時間
             */
            'created_at' => $this->created_at,
            
            /**
             * 更新時間
             */
            'updated_at' => $this->updated_at,
            
            /**
             * 關聯的訂單品項資訊（如果有載入）
             */
            'order_item' => new OrderItemResource($this->whenLoaded('orderItem')),
        ];
    }
} 