<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Data\Transformers\MoneyTransformer;

class PurchaseItemResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'received_quantity' => $this->received_quantity ?? 0,
            'receipt_status' => $this->receipt_status ?? 'pending',
            'unit_price' => $this->unit_price,
            'cost_price' => $this->cost_price,
            'allocated_shipping_cost' => $this->allocated_shipping_cost,
            'total_cost_price' => $this->total_cost_price,
            
            // 🎯 返回嵌套的 product_variant 結構以符合前端期待
            'product_variant' => $this->whenLoaded('productVariant', function () {
                return [
                    'id' => $this->productVariant->id,
                    'sku' => $this->productVariant->sku,
                    'price' => $this->productVariant->price,
                    'product' => $this->productVariant->relationLoaded('product') && $this->productVariant->product
                        ? [
                            'id' => $this->productVariant->product->id,
                            'name' => $this->productVariant->product->name,
                        ]
                        : null,
                ];
            }),
            
            // 🔄 保持向後相容性的扁平欄位
            'sku' => $this->whenLoaded('productVariant', fn() => $this->productVariant->sku),
            'product_name' => $this->relationLoaded('productVariant') && 
                $this->productVariant && 
                $this->productVariant->relationLoaded('product') && 
                $this->productVariant->product
                ? $this->productVariant->product->name
                : null,
        ];
    }
}
