<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\InventoryTransaction
 */
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
            // --- 🏆 靜態、無條件的欄位（Resource 黃金原則）---
            'id' => $this->id,
            'inventory_id' => $this->inventory_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'quantity' => $this->quantity,
            'before_quantity' => $this->before_quantity,
            'after_quantity' => $this->after_quantity,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // --- 🔗 關聯資訊 ---
            'user' => $this->whenLoaded('user', function() {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),
            'store' => $this->whenLoaded('inventory', function() {
                return $this->when(
                    $this->inventory?->relationLoaded('store'),
                    function() {
                        return [
                            'id' => $this->inventory->store->id,
                            'name' => $this->inventory->store->name,
                        ];
                    }
                );
            }),
            'product' => $this->whenLoaded('inventory', function() {
                return $this->when(
                    $this->inventory?->relationLoaded('productVariant') && 
                    $this->inventory?->productVariant?->relationLoaded('product'),
                    function() {
                        return [
                            'name' => $this->inventory->productVariant->product->name,
                            'sku' => $this->inventory->productVariant->sku,
                        ];
                    }
                );
            }),
        ];
    }
}
