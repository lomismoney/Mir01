<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Product
 * 商品資源轉換器 (SPU 級別)
 * 
 * 負責將 Product 模型轉換為 API 響應格式
 * 採用 SPU (Standard Product Unit) 架構，包含其下所有 SKU 變體
 * 
 * @apiResource App\Http\Resources\Api\ProductResource
 * @apiResourceModel App\Models\Product
 * 
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int|null $category_id
 * @property \App\Http\Resources\Api\CategoryResource|null $category
 * @property \App\Http\Resources\Api\AttributeResource[] $attributes
 * @property \App\Http\Resources\Api\ProductVariantResource[] $variants
 * @property int|null $variant_count
 * @property bool $has_image
 * @property array $image_urls
 * @property array|null $image_info
 * @property int|null $total_stock
 * @property array|null $price_range
 * @property string $created_at
 * @property string $updated_at
 */
class ProductResource extends JsonResource
{
    /**
     * 將資源轉換為陣列
     * 
     * 根據 Context7 最佳實踐優化圖片資源處理：
     * - 使用 whenLoaded 避免 N+1 查詢問題
     * - 提供完整的圖片 URL 結構
     * - 包含圖片狀態資訊
     *
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category_id' => $this->category_id,
            
            // 分類資訊（當已載入時）
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? new CategoryResource($this->category) : null;
            }),
            
            // 🔧 修復：確保屬性和變體數據總是被序列化，解決前端類型不匹配問題
            'attributes' => AttributeResource::collection($this->attributes),
        
            // 變體資訊（總是包含）
            'variants' => ProductVariantResource::collection($this->variants),
            'variant_count' => $this->when(
                $this->relationLoaded('variants'),
                fn() => $this->variants->count()
            ),
            
            // 圖片相關資訊
            'has_image' => $this->hasImage(),
            'image_urls' => $this->getImageUrls(),
            
            // 圖片詳細資訊（當有圖片時）
            'image_info' => $this->when($this->hasImage(), function () {
                $media = $this->getFirstMedia('images');
                
                if (!$media) {
                    return null;
                }
                
                return [
                    'id' => $media->id,
                    'file_name' => $media->file_name,
                    'mime_type' => $media->mime_type,
                    'size' => $media->size,
                    'human_readable_size' => $media->human_readable_size,
                    'created_at' => $media->created_at,
                    'conversions_generated' => [
                        'thumb' => $media->hasGeneratedConversion('thumb'),
                        'medium' => $media->hasGeneratedConversion('medium'),
                        'large' => $media->hasGeneratedConversion('large'),
                    ],
                ];
            }),
            
            // 庫存統計（當已載入庫存時）
            'total_stock' => $this->when(
                $this->relationLoaded('inventories'),
                fn() => $this->inventories->sum('quantity')
            ),
            
            // 價格範圍（當已載入變體時）
            'price_range' => $this->when(
                $this->relationLoaded('variants'),
                fn() => [
                    'min' => $this->variants->min('price'), // accessor 自動處理分轉元
                    'max' => $this->variants->max('price'), // accessor 自動處理分轉元
                    'count' => $this->variants->count(),
                ]
            ),
            
            // 時間戳
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
} 