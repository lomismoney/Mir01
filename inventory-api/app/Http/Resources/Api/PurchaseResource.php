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
            'status' => $this->status,
            'store' => new StoreResource($this->whenLoaded('store')),
            'total_amount' => $this->total_amount,
            'shipping_cost' => $this->shipping_cost,
            'purchased_at' => $this->purchased_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'items_count' => $this->whenCounted('items'),
            'total_quantity' => (int) $this->items_sum_quantity,
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
