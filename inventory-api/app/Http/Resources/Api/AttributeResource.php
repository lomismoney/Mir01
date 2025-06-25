<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AttributeResource API 資源
 * 
 * 用於格式化商品屬性的 API 回應資料
 * 包含屬性的基本資訊和關聯的屬性值
 */
class AttributeResource extends JsonResource
{
    /**
     * 將資源轉換為陣列格式
     * 
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // 使用 whenLoaded 來避免 N+1 查詢問題
            // 只有當關聯已載入時才包含屬性值資料
            'values' => AttributeValueResource::collection($this->whenLoaded('values')),
            // 關聯商品數量（使用 accessor 計算）
            'products_count' => $this->products_count,
        ];
    }
}
