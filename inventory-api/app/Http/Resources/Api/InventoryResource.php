<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * InventoryResource 庫存資源
 * 
 * 將庫存模型轉換為標準化的 API 回應格式
 * 包含關聯的商品變體、門市等相關資訊
 */
class InventoryResource extends JsonResource
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
            'product_variant_id' => $this->product_variant_id,
            'store_id' => $this->store_id,
            'quantity' => $this->quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 關聯資源
            'product_variant' => $this->whenLoaded('productVariant', function () {
                return [
                    'id' => $this->productVariant->id,
                    'sku' => $this->productVariant->sku,
                    'price' => $this->productVariant->price,
                    'cost_price' => $this->productVariant->cost_price,
                    'average_cost' => $this->productVariant->average_cost,
                    'profit_margin' => $this->productVariant->profit_margin,
                    'profit_amount' => $this->productVariant->profit_amount,
                    'product' => $this->whenLoaded('productVariant', function () {
                        return $this->productVariant->product ? [
                            'id' => $this->productVariant->product->id,
                            'name' => $this->productVariant->product->name,
                            'description' => $this->productVariant->product->description,
                        ] : null;
                    }),
                    'attribute_values' => $this->whenLoaded('productVariant', function () {
                        return $this->productVariant->attributeValues->map(function ($value) {
                            return [
                                'id' => $value->id,
                                'value' => $value->value,
                                'attribute' => [
                                    'id' => $value->attribute->id,
                                    'name' => $value->attribute->name,
                                ],
                            ];
                        });
                    }),
                ];
            }),
            
            'store' => $this->whenLoaded('store', function () {
                return [
                    'id' => $this->store->id,
                    'name' => $this->store->name,
                    'address' => $this->store->address,
                ];
            }),
        ];
    }
} 