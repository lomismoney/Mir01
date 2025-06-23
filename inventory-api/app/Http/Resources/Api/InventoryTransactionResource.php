<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransactionResource extends JsonResource
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
            'type' => $this->type,
            'quantity' => $this->quantity,
            'before_quantity' => $this->before_quantity,
            'after_quantity' => $this->after_quantity,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'store' => $this->when(
                $this->relationLoaded('inventory') && $this->inventory?->relationLoaded('store'),
                fn() => new StoreResource($this->inventory->store)
            ),
            'product' => $this->when(
                $this->relationLoaded('inventory') && 
                $this->inventory?->relationLoaded('productVariant') && 
                $this->inventory?->productVariant?->relationLoaded('product'),
                fn() => [
                    'name' => $this->inventory->productVariant->product->name,
                    'sku' => $this->inventory->productVariant->sku,
                ]
            ),
        ];
    }
}
