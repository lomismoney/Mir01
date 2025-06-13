<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * InventoryTransferResource 庫存轉移資源
 * 
 * 將庫存轉移模型轉換為標準化的 API 回應格式
 * 包含來源門市、目標門市、商品變體、用戶等相關資訊
 */
class InventoryTransferResource extends JsonResource
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
            'from_store_id' => $this->from_store_id,
            'to_store_id' => $this->to_store_id,
            'user_id' => $this->user_id,
            'product_variant_id' => $this->product_variant_id,
            'quantity' => $this->quantity,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 關聯資源
            'from_store' => $this->whenLoaded('fromStore', function () {
                return [
                    'id' => $this->fromStore->id,
                    'name' => $this->fromStore->name,
                    'address' => $this->fromStore->address,
                ];
            }),
            
            'to_store' => $this->whenLoaded('toStore', function () {
                return [
                    'id' => $this->toStore->id,
                    'name' => $this->toStore->name,
                    'address' => $this->toStore->address,
                ];
            }),
            
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'username' => $this->user->username,
                ];
            }),
            
            'product_variant' => $this->whenLoaded('productVariant', function () {
                return [
                    'id' => $this->productVariant->id,
                    'sku' => $this->productVariant->sku,
                    'price' => $this->productVariant->price,
                    'product' => $this->whenLoaded('productVariant.product', function () {
                        return [
                            'id' => $this->productVariant->product->id,
                            'name' => $this->productVariant->product->name,
                            'description' => $this->productVariant->product->description,
                        ];
                    }),
                    'attribute_values' => $this->whenLoaded('productVariant.attributeValues', function () {
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
        ];
    }
} 