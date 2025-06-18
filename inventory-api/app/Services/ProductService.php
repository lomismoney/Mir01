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
     * 更新商品及其變體 (核心戰術指令實現)
     * 
     * 此方法嚴格按照 SOP-ENG-01 協議實現完整的商品更新流程：
     * 1. 啟動資料庫交易確保原子性
     * 2. 更新 SPU (產品主體) 的基本資訊
     * 3. 更新產品與屬性的關聯
     * 4. 識別 SKU 變更類型：
     *    - 帶有 id 的 SKU 視為「待更新」
     *    - 不帶 id 的 SKU 視為「待新增」
     *    - 資料庫中存在但請求中不存在的 SKU 視為「待刪除」
     * 5. 執行操作：刪除 -> 更新 -> 新增
     * 6. 確保新變體在所有門市都有初始庫存記錄
     * 
     * @param Product $product 要更新的商品實例
     * @param array $validatedData 經過驗證的請求數據
     * @return Product 更新後的商品實例
     */
    public function updateProductWithVariants(Product $product, array $validatedData): Product
    {
        return DB::transaction(function () use ($product, $validatedData) {
            // a. 更新 SPU - 產品主體資訊更新
            $product->update([
                'name' => $validatedData['name'],
                'description' => $validatedData['description'] ?? $product->description,
                'category_id' => $validatedData['category_id'] ?? $product->category_id,
            ]);

            // b. 更新產品與屬性的關聯 (必須提供完整的屬性陣列)
            $product->attributes()->sync($validatedData['attributes']);

            // c. 識別 SKU 變更並執行操作
            $this->processVariantChanges($product, $validatedData['variants']);

            return $product;
        });
    }

    /**
     * 處理變體變更 (戰術核心實現)
     * 
     * 嚴格按照作戰指令實現 SKU 的識別與操作：
     * 1. 識別變更類型：待更新、待新增、待刪除
     * 2. 執行操作：DELETE -> UPDATE -> CREATE
     * 
     * @param Product $product 商品實例
     * @param array $variantsData 變體數據陣列
     * @return void
     */
    private function processVariantChanges(Product $product, array $variantsData): void
    {
        // 步驟 1: 識別 SKU 變更類型
        $variantsToUpdate = collect($variantsData)->filter(fn($variant) => isset($variant['id']));
        $variantsToCreate = collect($variantsData)->filter(fn($variant) => !isset($variant['id']));
        
        // 獲取當前產品的所有變體 ID
        $currentVariantIds = $product->variants()->pluck('id')->toArray();
        
        // 獲取請求中要保留的變體 ID
        $providedVariantIds = $variantsToUpdate->pluck('id')->toArray();
        
        // 計算要刪除的變體 ID (存在於資料庫但不在請求中)
        $variantsToDelete = array_diff($currentVariantIds, $providedVariantIds);

        // 步驟 2: 執行操作 - 刪除 (DELETE)
        if (!empty($variantsToDelete)) {
            $this->deleteVariants($variantsToDelete);
        }

        // 步驟 3: 執行操作 - 更新 (UPDATE)
        foreach ($variantsToUpdate as $variantData) {
            $this->updateExistingVariant($variantData['id'], $variantData);
        }

        // 步驟 4: 執行操作 - 新增 (CREATE)
        foreach ($variantsToCreate as $variantData) {
            $this->createNewVariant($product, $variantData);
        }
    }

    /**
     * 批量刪除變體
     * 
     * @param array $variantIds 要刪除的變體 ID 陣列
     * @return void
     */
    private function deleteVariants(array $variantIds): void
    {
        ProductVariant::whereIn('id', $variantIds)
            ->get()
            ->each(function ($variant) {
                // 刪除變體前先刪除其庫存記錄
                $variant->inventory()->delete();
                // 刪除變體與屬性值的關聯
                $variant->attributeValues()->detach();
                // 刪除變體
                $variant->delete();
            });
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

    /**
     * 創建單規格商品 (v3.0 雙軌制 API 核心實現)
     * 
     * 專門處理單規格商品的創建，將簡單的商品資訊轉換為完整的 SPU/SKU 架構。
     * 此方法在後端內部處理所有複雜性，前端只需提供最基本的商品資訊。
     * 
     * 核心邏輯：
     * 1. 查找或創建「標準」屬性和屬性值
     * 2. 創建 SPU (Product) 記錄
     * 3. 創建單一 SKU (ProductVariant) 記錄
     * 4. 建立 SPU 與標準屬性的關聯
     * 5. 建立 SKU 與標準屬性值的關聯
     * 6. 為所有門市創建初始庫存記錄
     * 
     * @param array $data 簡化的商品數據 (name, sku, price, category_id, description)
     * @return Product 創建完成的商品實例
     * @throws \Exception 當無法創建標準屬性時拋出異常
     */
    public function createSimpleProduct(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            // 步驟 1: 確保標準屬性存在
            $standardAttribute = $this->ensureStandardAttribute();
            $standardAttributeValue = $this->ensureStandardAttributeValue($standardAttribute);

            // 步驟 2: 創建 SPU (Product) 記錄
            $product = Product::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category_id' => $data['category_id'] ?? null,
            ]);

            // 步驟 3: 建立 SPU 與標準屬性的關聯
            $product->attributes()->attach($standardAttribute->id);

            // 步驟 4: 創建單一 SKU (ProductVariant) 記錄
            $variant = $product->variants()->create([
                'sku' => $data['sku'],
                'price' => $data['price'],
            ]);

            // 步驟 5: 建立 SKU 與標準屬性值的關聯
            $variant->attributeValues()->attach($standardAttributeValue->id);

            // 步驟 6: 為所有門市創建初始庫存記錄
            $stores = Store::all();
            foreach ($stores as $store) {
                Inventory::create([
                    'product_variant_id' => $variant->id,
                    'store_id' => $store->id,
                    'quantity' => 0, // 初始庫存為 0
                    'low_stock_threshold' => 0,
                ]);
            }

            return $product;
        });
    }

    /**
     * 確保標準屬性存在
     * 
     * 查找名為「標準」的屬性，如果不存在則自動創建。
     * 這個屬性專門用於單規格商品，確保系統的 SPU/SKU 架構完整性。
     * 
     * @return \App\Models\Attribute 標準屬性實例
     */
    private function ensureStandardAttribute(): \App\Models\Attribute
    {
        return \App\Models\Attribute::firstOrCreate(
            ['name' => '標準'],
            ['name' => '標準']
        );
    }

    /**
     * 確保標準屬性值存在
     * 
     * 為標準屬性創建一個名為「標準」的屬性值，如果不存在則自動創建。
     * 單規格商品的所有變體都會使用這個標準屬性值。
     * 
     * @param \App\Models\Attribute $standardAttribute 標準屬性實例
     * @return \App\Models\AttributeValue 標準屬性值實例
     */
    private function ensureStandardAttributeValue(\App\Models\Attribute $standardAttribute): \App\Models\AttributeValue
    {
        return \App\Models\AttributeValue::firstOrCreate(
            [
                'attribute_id' => $standardAttribute->id,
                'value' => '標準'
            ],
            [
                'attribute_id' => $standardAttribute->id,
                'value' => '標準'
            ]
        );
    }
} 