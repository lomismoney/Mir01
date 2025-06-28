<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\Store;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * UpdateProductProcessor - 商品更新處理器
 * 
 * 負責處理商品更新的複雜業務邏輯：
 * 1. 更新 SPU 基本資訊
 * 2. 處理變體的新增、更新、刪除
 * 3. 更新屬性關聯
 * 4. 管理庫存記錄的同步
 * 5. 事務管理確保數據一致性
 * 
 * @implements ProcessorInterface<Product, Product>
 */
class UpdateProductProcessor implements ProcessorInterface
{
    /**
     * 處理商品更新邏輯
     * 
     * @param mixed $data 更新的商品數據
     * @param Operation $operation 當前操作
     * @param array $uriVariables URI 變量
     * @param array $context 上下文
     * @return Product 更新的商品實例
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Product
    {
        try {
            return DB::transaction(function () use ($data) {
                // 獲取要更新的商品
                $product = $this->getProduct($data);
                
                // 1. 更新 SPU 基本資訊
                $this->updateBasicInfo($product, $data);
                
                // 2. 處理商品變體更新（如果提供）
                if (isset($data['variants'])) {
                    $this->updateVariants($product, $data['variants']);
                }
                
                // 3. 處理屬性關聯更新（如果提供）
                if (isset($data['attributes'])) {
                    $this->updateAttributes($product, $data['attributes']);
                }
                
                // 4. 同步庫存記錄
                $this->syncInventory($product);
                
                // 5. 重新載入關聯數據
                return $product->fresh(['category', 'variants', 'attributes']);
            });
        } catch (Exception $e) {
            Log::error('Product update failed', [
                'product_id' => $data['id'] ?? null,
                'error' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new Exception('商品更新失敗：' . $e->getMessage());
        }
    }
    
    /**
     * 獲取要更新的商品
     * 
     * @param array $data 商品數據
     * @return Product 商品實例
     * @throws Exception 商品不存在時拋出異常
     */
    private function getProduct(array $data): Product
    {
        if (empty($data['id'])) {
            throw new Exception('商品ID不能為空');
        }
        
        $product = Product::find($data['id']);
        if (!$product) {
            throw new Exception('指定的商品不存在');
        }
        
        return $product;
    }
    
    /**
     * 更新商品基本資訊
     * 
     * @param Product $product 商品實例
     * @param array $data 更新數據
     * @return void
     */
    private function updateBasicInfo(Product $product, array $data): void
    {
        // 更新可變欄位
        if (isset($data['name'])) {
            $product->name = $data['name'];
        }
        
        if (isset($data['description'])) {
            $product->description = $data['description'];
        }
        
        if (isset($data['category_id'])) {
            // 驗證分類是否存在
            if (!Category::find($data['category_id'])) {
                throw new Exception('指定的商品分類不存在');
            }
            $product->category_id = $data['category_id'];
        }
        
        $product->save();
        
        Log::info('Product basic info updated', [
            'product_id' => $product->id,
            'changes' => $product->getChanges()
        ]);
    }
    
    /**
     * 更新商品變體
     * 
     * @param Product $product 商品實例
     * @param array $variants 變體數據陣列
     * @return void
     */
    private function updateVariants(Product $product, array $variants): void
    {
        $existingVariantIds = $product->variants()->pluck('id')->toArray();
        $updatedVariantIds = [];
        
        foreach ($variants as $variantData) {
            if (isset($variantData['id']) && in_array($variantData['id'], $existingVariantIds)) {
                // 更新現有變體
                $variant = $this->updateExistingVariant($variantData);
                $updatedVariantIds[] = $variant->id;
            } else {
                // 創建新變體
                $variant = $this->createNewVariant($product, $variantData);
                $updatedVariantIds[] = $variant->id;
            }
        }
        
        // 刪除不再需要的變體
        $variantsToDelete = array_diff($existingVariantIds, $updatedVariantIds);
        if (!empty($variantsToDelete)) {
            $this->deleteVariants($variantsToDelete);
        }
        
        Log::info('Product variants updated', [
            'product_id' => $product->id,
            'updated_variants' => count($updatedVariantIds),
            'deleted_variants' => count($variantsToDelete)
        ]);
    }
    
    /**
     * 更新現有變體
     * 
     * @param array $variantData 變體數據
     * @return ProductVariant 更新的變體
     */
    private function updateExistingVariant(array $variantData): ProductVariant
    {
        $variant = ProductVariant::findOrFail($variantData['id']);
        
        // 更新變體欄位
        if (isset($variantData['sku'])) {
            $variant->sku = $variantData['sku'];
        }
        
        if (isset($variantData['price'])) {
            $variant->price = $variantData['price'];
        }
        
        if (isset($variantData['cost_price'])) {
            $variant->cost_price = $variantData['cost_price'];
        }
        
        $variant->save();
        
        // 更新屬性值關聯
        if (isset($variantData['attribute_values'])) {
            $variant->attributeValues()->sync($variantData['attribute_values']);
        }
        
        return $variant;
    }
    
    /**
     * 創建新變體
     * 
     * @param Product $product 商品實例
     * @param array $variantData 變體數據
     * @return ProductVariant 創建的變體
     */
    private function createNewVariant(Product $product, array $variantData): ProductVariant
    {
        // 生成 SKU（如果未提供）
        if (empty($variantData['sku'])) {
            $variantData['sku'] = $this->generateSku($product, $variantData);
        }
        
        $variant = new ProductVariant();
        $variant->product_id = $product->id;
        $variant->sku = $variantData['sku'];
        $variant->price = $variantData['price'] ?? 0;
        $variant->cost_price = $variantData['cost_price'] ?? 0;
        $variant->average_cost = $variantData['cost_price'] ?? 0;
        $variant->total_purchased_quantity = 0;
        $variant->total_cost_amount = 0;
        
        $variant->save();
        
        // 處理屬性值關聯
        if (isset($variantData['attribute_values'])) {
            $variant->attributeValues()->attach($variantData['attribute_values']);
        }
        
        return $variant;
    }
    
    /**
     * 刪除變體
     * 
     * @param array $variantIds 要刪除的變體ID陣列
     * @return void
     */
    private function deleteVariants(array $variantIds): void
    {
        // 檢查是否有相關的訂單項目
        $hasOrders = ProductVariant::whereIn('id', $variantIds)
            ->whereHas('orderItems')
            ->exists();
            
        if ($hasOrders) {
            throw new Exception('部分商品變體有訂單記錄，無法刪除');
        }
        
        // 刪除庫存記錄
        Inventory::whereIn('product_variant_id', $variantIds)->delete();
        
        // 刪除變體
        ProductVariant::whereIn('id', $variantIds)->delete();
    }
    
    /**
     * 生成 SKU 編號
     * 
     * @param Product $product 商品實例
     * @param array $variantData 變體數據
     * @return string 生成的 SKU
     */
    private function generateSku(Product $product, array $variantData): string
    {
        $variantCount = $product->variants()->count() + 1;
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        
        return "PRD-{$product->id}-{$variantCount}-{$random}";
    }
    
    /**
     * 更新屬性關聯
     * 
     * @param Product $product 商品實例
     * @param array $attributeIds 屬性ID陣列
     * @return void
     */
    private function updateAttributes(Product $product, array $attributeIds): void
    {
        $product->attributes()->sync($attributeIds);
        
        Log::info('Product attributes updated', [
            'product_id' => $product->id,
            'attribute_ids' => $attributeIds
        ]);
    }
    
    /**
     * 同步庫存記錄
     * 確保所有變體在所有門市都有庫存記錄
     * 
     * @param Product $product 商品實例
     * @return void
     */
    private function syncInventory(Product $product): void
    {
        $stores = Store::all();
        $variants = $product->variants;
        
        foreach ($variants as $variant) {
            foreach ($stores as $store) {
                // 檢查是否已存在庫存記錄
                $existingInventory = Inventory::where('product_variant_id', $variant->id)
                    ->where('store_id', $store->id)
                    ->first();
                
                if (!$existingInventory) {
                    Inventory::create([
                        'product_variant_id' => $variant->id,
                        'store_id' => $store->id,
                        'quantity' => 0,
                        'low_stock_threshold' => 10,
                    ]);
                }
            }
        }
        
        Log::info('Inventory synchronized', [
            'product_id' => $product->id,
            'variants_count' => $variants->count(),
            'stores_count' => $stores->count()
        ]);
    }
} 