<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

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
            'actual_start_time' => $this->formatDateTime($this->actual_start_time),
            'actual_end_time' => $this->formatDateTime($this->actual_end_time),
            
            // 備註
            'notes' => $this->notes,
            
            // 時間戳記
            'created_at' => $this->formatDateTime($this->created_at),
            'updated_at' => $this->formatDateTime($this->updated_at),
            
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

    /**
     * 安全格式化日期時間字段
     * 
     * @param mixed $dateTime
     * @return string|null
     */
    private function formatDateTime($dateTime): ?string
    {
        if ($dateTime === null) {
            return null;
        }

        // 如果是字符串，嘗試轉換為 Carbon 實例
        if (is_string($dateTime)) {
            try {
                $dateTime = Carbon::parse($dateTime);
            } catch (\Exception $e) {
                return null;
            }
        }

        // 確保是 Carbon 實例或實現了 DateTimeInterface 的對象
        if ($dateTime instanceof \DateTimeInterface) {
            return $dateTime->format('Y-m-d H:i:s');
        }

        return null;
    }
} 