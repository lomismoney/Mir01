<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'is_stocked_sale' => $this->is_stocked_sale,
            'is_backorder' => $this->is_backorder, // 🎯 Operation: Precise Tagging - 新增預訂標記欄位
            'status' => $this->status,
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'price' => $this->price,
            'cost' => $this->cost,
            'quantity' => $this->quantity,
            'tax_rate' => $this->tax_rate,
            'discount_amount' => $this->discount_amount,
            // 🎯 訂製商品相關欄位
            'custom_product_name' => $this->custom_product_name,
            'custom_specifications' => $this->custom_specifications ? json_decode($this->custom_specifications, true) : null,
            'custom_product_image' => $this->custom_product_image,
            'custom_product_category' => $this->custom_product_category,
            'custom_product_brand' => $this->custom_product_brand,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // 關聯的產品變體資訊（如果有載入）
            'product_variant' => $this->whenLoaded('productVariant', function() {
                return new ProductVariantResource($this->productVariant);
            }),
        ];
    }
}
