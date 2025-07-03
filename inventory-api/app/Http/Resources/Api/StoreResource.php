<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\UserResource;
use App\Http\Resources\Api\InventoryResource;
use App\Http\Resources\Api\PurchaseResource;
use App\Http\Resources\Api\InventoryTransferResource;

class StoreResource extends JsonResource
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
            'name' => $this->name,
            'address' => $this->address,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // Conditionally include relationships
            'users' => UserResource::collection($this->whenLoaded('users')),
            'inventories' => InventoryResource::collection($this->whenLoaded('inventories')),
            'purchases' => PurchaseResource::collection($this->whenLoaded('purchases')),
            'transfers_out' => InventoryTransferResource::collection($this->whenLoaded('transfersOut')),
            'transfers_in' => InventoryTransferResource::collection($this->whenLoaded('transfersIn')),
        ];
    }
}
