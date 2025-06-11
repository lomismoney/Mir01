<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * AttributeValueResource API 資源
 * 
 * 用於格式化商品屬性值的 API 回應資料
 * 包含屬性值的基本資訊和所屬屬性的 ID
 */
class AttributeValueResource extends JsonResource
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
            'value' => $this->value,
            'attribute_id' => $this->attribute_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
