<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

/**
 * 商品管理服務類別
 * 
 * 處理商品及其變體的複雜業務邏輯，
 * 包括創建、更新和管理 SPU/SKU 架構
 */
class ProductService
{
    /**
     * 更新商品及其變體
     * 
     * 此方法處理完整的商品更新流程：
     * 1. 更新 SPU (產品主體) 的基本資訊
     * 2. 更新產品與屬性的關聯
     * 3. 處理變體的增刪改：
     *    - 更新現有變體
     *    - 刪除不再需要的變體
     *    - 新增新的變體
     * 4. 確保新變體在所有門市都有初始庫存記錄
     * 
     * @param Product $product 要更新的商品實例
     * @param array $validatedData 經過驗證的請求數據
     * @return Product 更新後的商品實例
     */
    public function updateProductWithVariants(Product $product, array $validatedData): Product
    {
        return DB::transaction(function () use ($product, $validatedData) {
            // 1. 更新 SPU (Product) 的基本資訊
            $product->update([
                'name' => $validatedData['name'],
                'description' => $validatedData['description'] ?? $product->description,
                'category_id' => $validatedData['category_id'] ?? $product->category_id,
            ]);

            // 2. 如果提供了屬性，更新產品與屬性的關聯
            if (isset($validatedData['attributes'])) {
                $product->attributes()->sync($validatedData['attributes']);
            }

            // 3. 處理變體更新（如果提供了變體數據）
            if (isset($validatedData['variants'])) {
                $this->updateProductVariants($product, $validatedData['variants']);
            }

            return $product;
        });
    }

    /**
     * 更新商品的變體
     * 
     * @param Product $product 商品實例
     * @param array $variantsData 變體數據陣列
     * @return void
     */
    private function updateProductVariants(Product $product, array $variantsData): void
    {
        // 收集所有應該保留的變體 ID
        $providedVariantIds = collect($variantsData)
            ->filter(function ($variantData) {
                return isset($variantData['id']);
            })
            ->pluck('id')
            ->toArray();

        // 刪除不在提供列表中的現有變體
        $product->variants()
            ->whereNotIn('id', $providedVariantIds)
            ->get()
            ->each(function ($variant) {
                // 刪除變體前先刪除其庫存記錄
                $variant->inventory()->delete();
                // 刪除變體與屬性值的關聯
                $variant->attributeValues()->detach();
                // 刪除變體
                $variant->delete();
            });

        // 處理每個變體（更新現有的或創建新的）
        foreach ($variantsData as $variantData) {
            if (isset($variantData['id'])) {
                // 更新現有變體
                $this->updateExistingVariant($variantData['id'], $variantData);
            } else {
                // 創建新變體
                $this->createNewVariant($product, $variantData);
            }
        }
    }

    /**
     * 更新現有變體
     * 
     * @param int $variantId 變體 ID
     * @param array $variantData 變體數據
     * @return void
     */
    private function updateExistingVariant(int $variantId, array $variantData): void
    {
        $variant = ProductVariant::findOrFail($variantId);

        // 更新變體基本資訊
        $variant->update([
            'sku' => $variantData['sku'],
            'price' => $variantData['price'],
        ]);

        // 更新屬性值關聯
        if (isset($variantData['attribute_value_ids'])) {
            $variant->attributeValues()->sync($variantData['attribute_value_ids']);
        }
    }

    /**
     * 創建新變體
     * 
     * @param Product $product 商品實例
     * @param array $variantData 變體數據
     * @return void
     */
    private function createNewVariant(Product $product, array $variantData): void
    {
        // 創建新變體
        $variant = $product->variants()->create([
            'sku' => $variantData['sku'],
            'price' => $variantData['price'],
        ]);

        // 關聯屬性值
        if (isset($variantData['attribute_value_ids'])) {
            $variant->attributeValues()->attach($variantData['attribute_value_ids']);
        }

        // 為所有門市創建初始庫存記錄
        $stores = Store::all();
        foreach ($stores as $store) {
            Inventory::create([
                'product_variant_id' => $variant->id,
                'store_id' => $store->id,
                'quantity' => 0, // 初始庫存為 0
                'low_stock_threshold' => 0,
            ]);
        }
    }
} 