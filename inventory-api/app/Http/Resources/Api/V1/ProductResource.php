<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 商品資源轉換器
 * 
 * 負責將 Product 模型轉換為 API 響應格式
 * 對應 ProductData 的結構，用於統一 API 響應格式
 * 
 * @apiResource App\Http\Resources\Api\V1\ProductResource
 * @apiResourceModel App\Models\Product
 */
class ProductResource extends JsonResource
{
    /**
     * 將資源轉換為陣列格式
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'selling_price' => (float) $this->selling_price,
            'cost_price' => (float) $this->cost_price,
            'category_id' => $this->category_id ? (int) $this->category_id : null,
            'created_at' => $this->created_at?->setTimezone('Asia/Taipei')?->toISOString(),
            'updated_at' => $this->updated_at?->setTimezone('Asia/Taipei')?->toISOString(),
        ];
    }
} 