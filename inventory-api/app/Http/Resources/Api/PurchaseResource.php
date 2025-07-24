<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Data\Transformers\MoneyTransformer;
use Spatie\LaravelData\Attributes\WithTransformer;

class PurchaseResource extends JsonResource
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
            'order_number' => $this->order_number,
            'store_id' => $this->store_id,
            'status' => $this->status,
            'store' => new StoreResource($this->whenLoaded('store')),
            'total_amount' => $this->total_amount / 100,
            'shipping_cost' => $this->shipping_cost / 100,
            'is_tax_inclusive' => $this->is_tax_inclusive,
            'tax_rate' => $this->tax_rate,
            'tax_amount' => $this->tax_amount / 100,
            'purchased_at' => $this->purchased_at,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'items_count' => $this->whenCounted('items'),
            'items_sum_quantity' => $this->whenAggregated('items', 'quantity', 'sum'),
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
