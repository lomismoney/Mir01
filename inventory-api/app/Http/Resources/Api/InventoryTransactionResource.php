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
            'type' => $this->type,
            'quantity' => $this->quantity,
            'before_quantity' => $this->before_quantity,
            'after_quantity' => $this->after_quantity,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at,

            // --- 🔗 所有條件關聯都放在這裡（確保 Scribe 100% 契約確定性）---
            'relations' => [
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
                                'id' => $this->inventory->productVariant->product->id,
                                'name' => $this->inventory->productVariant->product->name,
                                'sku' => $this->inventory->productVariant->sku,
                            ];
                        }
                    );
                }),
            ],
        ];
    }
}
