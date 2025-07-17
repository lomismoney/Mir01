<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * OrderItemResource API 資源
 * 
 * 用於格式化訂單項目的 API 回應
 * 
 * @property int $id
 * @property int $order_id
 * @property int|null $product_variant_id
 * @property bool $is_stocked_sale
 * @property bool $is_backorder
 * @property string $status
 * @property string $product_name
 * @property string $sku
 * @property string $price
 * @property string $cost
 * @property int $quantity
 * @property int $fulfilled_quantity
 * @property bool $is_fulfilled
 * @property string|null $fulfilled_at
 * @property string $tax_rate
 * @property string $discount_amount
 * @property string|null $custom_product_name
 * @property array|null $custom_specifications
 * @property string|null $custom_product_image
 * @property string|null $custom_product_category
 * @property string|null $custom_product_brand
 * @property string $created_at
 * @property string $updated_at
 * @property \App\Http\Resources\Api\ProductVariantResource|null $product_variant
 */
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
            'status_text' => $this->status_text, // 狀態中文說明
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'price' => $this->price,
            'cost' => $this->cost,
            'quantity' => $this->quantity,
            'fulfilled_quantity' => $this->fulfilled_quantity,
            'is_fulfilled' => $this->is_fulfilled,
            'fulfilled_at' => $this->fulfilled_at,
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
