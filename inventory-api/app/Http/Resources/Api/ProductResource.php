<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 商品資源轉換器 (SPU 級別)
 * 
 * 負責將 Product 模型轉換為 API 響應格式
 * 採用 SPU (Standard Product Unit) 架構，包含其下所有 SKU 變體
 * 
 * @apiResource App\Http\Resources\Api\ProductResource
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
        $data = [
            'id' => (int) $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category_id' => $this->category_id ? (int) $this->category_id : null,
            'created_at' => $this->created_at?->setTimezone('Asia/Taipei')?->toISOString(),
            'updated_at' => $this->updated_at?->setTimezone('Asia/Taipei')?->toISOString(),
        ];
        
        // 加載 SKU 變體數據（如果關係已加載）
        if ($this->relationLoaded('variants')) {
            $data['variants'] = ProductVariantResource::collection($this->variants);
            
            // 計算價格範圍統計資訊
            if ($this->variants->isNotEmpty()) {
                $prices = $this->variants->pluck('price');
                $data['price_range'] = [
                    'min' => (float) $prices->min(),
                    'max' => (float) $prices->max(),
                    'count' => $this->variants->count(),
                ];
            } else {
                $data['price_range'] = [
                    'min' => null,
                    'max' => null,
                    'count' => 0,
                ];
            }
        }
        
        // 加載分類數據（如果關係已加載）
        if ($this->relationLoaded('category') && $this->category) {
            $data['category'] = [
                'id' => (int) $this->category->id,
                'name' => $this->category->name,
                'description' => $this->category->description,
            ];
        }
        
        // 加載屬性數據（如果關係已加載）
        if ($this->relationLoaded('attributes')) {
            $data['attributes'] = $this->attributes->map(function ($attribute) {
                return [
                    'id' => (int) $attribute->id,
                    'name' => $attribute->name,
                    'type' => $attribute->type,
                    'description' => $attribute->description,
                ];
            })->toArray();
        }
        
        return $data;
    }
} 