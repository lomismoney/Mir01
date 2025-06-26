<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InstallationResource extends JsonResource
{
    /**
     * 將資源轉換為陣列
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'installation_number' => $this->installation_number,
            'order_id' => $this->order_id,
            'installer_user_id' => $this->installer_user_id,
            'created_by' => $this->created_by,
            
            // 客戶資訊
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'installation_address' => $this->installation_address,
            
            // 狀態和時間
            'status' => $this->status,
            'scheduled_date' => $this->scheduled_date?->format('Y-m-d'),
            'actual_start_time' => $this->actual_start_time?->format('Y-m-d H:i:s'),
            'actual_end_time' => $this->actual_end_time?->format('Y-m-d H:i:s'),
            
            // 備註
            'notes' => $this->notes,
            
            // 時間戳記
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at->format('Y-m-d H:i:s'),
            
            // 關聯資源（按需加載）
            'items' => InstallationItemResource::collection($this->whenLoaded('items')),
            'order' => new OrderResource($this->whenLoaded('order')),
            'installer' => new UserResource($this->whenLoaded('installer')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            
            // 計算屬性
            'pending_items_count' => $this->when(
                $this->relationLoaded('items'),
                fn() => $this->pending_items_count
            ),
            'total_items_count' => $this->when(
                $this->relationLoaded('items'),
                fn() => $this->items->count()
            ),
            'is_completed' => $this->isCompleted(),
            'can_be_cancelled' => $this->canBeCancelled(),
            'has_started' => $this->hasStarted(),
        ];
    }
} 