<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ProductVariantResource 商品變體資源
 * 
 * 將商品變體模型轉換為標準化的 API 回應格式
 * 包含商品、屬性值、庫存等相關資訊
 * 
 * @property int $id
 * @property string $sku
 * @property string $price
 * @property string $cost_price
 * @property string $average_cost
 * @property int $total_purchased_quantity
 * @property string $profit_margin
 * @property string $profit_amount
 * @property int $product_id
 * @property string $created_at
 * @property string $updated_at
 * @property int|null $stock
 * @property string|null $specifications
 * @property string|null $image_url
 * @property array|null $product
 * @property array|null $attribute_values
 * @property array|null $inventory
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
            'cost_price' => $this->cost_price,
            'average_cost' => $this->average_cost,
            'total_purchased_quantity' => $this->total_purchased_quantity,
            'profit_margin' => $this->profit_margin,
            'profit_amount' => $this->profit_amount,
            'product_id' => $this->product_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            
            // 🎯 新增：總庫存數量 (解決庫存顯示問題)
            'stock' => $this->when(
                $this->relationLoaded('inventory'),
                fn() => $this->inventory->sum('quantity')
            ),
            
            // 🎯 新增：規格描述 (屬性值組合)
            'specifications' => $this->when(
                $this->relationLoaded('attributeValues'),
                fn() => $this->attributeValues->pluck('value')->join(' + ')
            ),
            
            // 🎯 新增：圖片 URL (SKU 沒有圖片時沿用 SPU 圖片)
            'image_url' => $this->when(
                $this->relationLoaded('product'),
                function () {
                    // SKU 沒有專屬圖片，沿用 SPU 的商品圖片
                    return $this->product->hasImage() ? $this->product->getImageUrl() : null;
                }
            ),
            
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
                        'attribute' => $value->attribute ? [
                            'id' => $value->attribute->id,
                            'name' => $value->attribute->name,
                        ] : null,
                    ];
                });
            }),
            
            'inventory' => $this->whenLoaded('inventory', function () {
                return $this->inventory->map(function ($inventory) {
                    return [
                        'id' => $inventory->id,
                        'product_variant_id' => $inventory->product_variant_id,
                        'store_id' => $inventory->store_id,
                        'quantity' => $inventory->quantity,
                        'low_stock_threshold' => $inventory->low_stock_threshold,
                        'store' => $inventory->store ? [
                            'id' => $inventory->store->id,
                            'name' => $inventory->store->name,
                            'address' => $inventory->store->address,
                        ] : null,
                    ];
                });
            }),
        ];
    }
} 