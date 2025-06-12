<?php

namespace App\Http\Resources\Api;

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
        $data = [
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
        
        // 如果變體關係已加載，則添加到響應中
        if ($this->relationLoaded('variants')) {
            $data['variants'] = $this->variants->map(function($variant) {
                $variantData = [
                    'id' => (int) $variant->id,
                    'sku' => $variant->sku,
                    'price' => (float) $variant->price,
                ];
                
                // 如果屬性值關係已加載，則添加到變體數據中
                if (isset($variant->attributeValues) && $variant->attributeValues->count() > 0) {
                    $variantData['attribute_values'] = $variant->attributeValues->map(function($value) {
                        $valueData = [
                            'id' => (int) $value->id,
                            'value' => $value->value,
                        ];
                        
                        // 如果屬性關係已加載，則添加到屬性值數據中
                        if (isset($value->attribute)) {
                            $valueData['attribute'] = [
                                'id' => (int) $value->attribute->id,
                                'name' => $value->attribute->name,
                            ];
                        }
                        
                        return $valueData;
                    });
                }
                
                // 如果庫存關係已加載，則添加到變體數據中
                if (isset($variant->inventory)) {
                    $variantData['inventory'] = [
                        'quantity' => (int) $variant->inventory->quantity,
                        'low_stock_threshold' => (int) $variant->inventory->low_stock_threshold,
                    ];
                }
                
                return $variantData;
            });
        }
        
        return $data;
    }
} 