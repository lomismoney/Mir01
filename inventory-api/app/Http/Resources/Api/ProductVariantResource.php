<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ProductVariantResource 商品變體資源
 * 
 * 將商品變體模型轉換為標準化的 API 回應格式
 * 包含商品、屬性值、庫存等相關資訊
 */
class ProductVariantResource extends JsonResource
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
            'sku' => $this->sku,
            'price' => $this->price,
            'product_id' => $this->product_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 關聯資源
            'product' => $this->whenLoaded('product', function () {
                return [
                    'id' => $this->product->id,
                    'name' => $this->product->name,
                    'description' => $this->product->description,
                    'category_id' => $this->product->category_id,
                ];
            }),
            
            'attribute_values' => $this->whenLoaded('attributeValues', function () {
                return $this->attributeValues->map(function ($value) {
                    return [
                        'id' => $value->id,
                        'value' => $value->value,
                        'attribute_id' => $value->attribute_id,
                        'attribute' => [
                            'id' => $value->attribute->id,
                            'name' => $value->attribute->name,
                        ],
                    ];
                });
            }),
            
            'inventory' => $this->whenLoaded('inventory', function () {
                return [
                    'id' => $this->inventory->id,
                    'quantity' => $this->inventory->quantity,
                    'low_stock_threshold' => $this->inventory->low_stock_threshold,
                    'store' => [
                        'id' => $this->inventory->store->id,
                        'name' => $this->inventory->store->name,
                    ],
                ];
            }),
        ];
    }
} 