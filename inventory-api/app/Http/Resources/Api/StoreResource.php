<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Api\UserResource;
use App\Http\Resources\Api\InventoryResource;
use App\Http\Resources\Api\PurchaseResource;
use App\Http\Resources\Api\InventoryTransferResource;

/**
 * StoreResource API 資源
 * 
 * 用於格式化門市資料的 API 回應
 * 
 * @property int $id
 * @property string $name
 * @property string $address
 * @property string $created_at
 * @property string $updated_at
 * @property \App\Http\Resources\Api\UserResource[]|null $users
 * @property \App\Http\Resources\Api\InventoryResource[]|null $inventories
 * @property \App\Http\Resources\Api\PurchaseResource[]|null $purchases
 * @property \App\Http\Resources\Api\InventoryTransferResource[]|null $transfers_out
 * @property \App\Http\Resources\Api\InventoryTransferResource[]|null $transfers_in
 */
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
            
            // 統計數據
            'users_count' => $this->whenNotNull($this->users_count),
            'inventory_count' => $this->whenNotNull($this->inventories_count),
            
            // Conditionally include relationships
            'users' => UserResource::collection($this->whenLoaded('users')),
            'inventories' => InventoryResource::collection($this->whenLoaded('inventories')),
            'purchases' => PurchaseResource::collection($this->whenLoaded('purchases')),
            'transfers_out' => InventoryTransferResource::collection($this->whenLoaded('transfersOut')),
            'transfers_in' => InventoryTransferResource::collection($this->whenLoaded('transfersIn')),
        ];
    }
}
