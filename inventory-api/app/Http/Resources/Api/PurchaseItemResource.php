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
            'sku' => $this->whenLoaded('productVariant', fn() => $this->productVariant->sku),
            'product_name' => $this->relationLoaded('productVariant') && 
                $this->productVariant && 
                $this->productVariant->relationLoaded('product') && 
                $this->productVariant->product
                ? $this->productVariant->product->name
                : null,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'cost_price' => $this->cost_price,
            'allocated_shipping_cost' => $this->allocated_shipping_cost,
            'total_cost_price' => $this->total_cost_price,
        ];
    }
}
