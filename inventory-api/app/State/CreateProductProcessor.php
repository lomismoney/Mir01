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
 * CreateProductProcessor - 商品創建處理器
 * 
 * 負責處理商品創建的複雜業務邏輯：
 * 1. 創建 SPU (Standard Product Unit)
 * 2. 創建關聯的 SKU 變體（如果提供）
 * 3. 初始化庫存記錄
 * 4. 處理屬性關聯
 * 5. 事務管理確保數據一致性
 * 
 * @implements ProcessorInterface<Product, Product>
 */
class CreateProductProcessor implements ProcessorInterface
{
    /**
     * 處理商品創建邏輯
     * 
     * @param mixed $data 創建的商品數據
     * @param Operation $operation 當前操作
     * @param array $uriVariables URI 變量
     * @param array $context 上下文
     * @return Product 創建的商品實例
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Product
    {
        try {
            return DB::transaction(function () use ($data) {
                // 1. 創建 SPU 商品
                $product = $this->createProduct($data);
                
                // 2. 處理商品變體（如果提供）
                if (isset($data['variants']) && is_array($data['variants'])) {
                    $this->createVariants($product, $data['variants']);
                }
                
                // 3. 處理屬性關聯（如果提供）
                if (isset($data['attributes']) && is_array($data['attributes'])) {
                    $this->attachAttributes($product, $data['attributes']);
                }
                
                // 4. 初始化庫存記錄
                $this->initializeInventory($product);
                
                // 5. 重新載入關聯數據
                return $product->fresh(['category', 'variants', 'attributes']);
            });
        } catch (Exception $e) {
            Log::error('Product creation failed', [
                'error' => $e->getMessage(),
                'data' => $data,
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new Exception('商品創建失敗：' . $e->getMessage());
        }
    }
    
    /**
     * 創建 SPU 商品
     * 
     * @param array $data 商品數據
     * @return Product 創建的商品實例
     */
    private function createProduct(array $data): Product
    {
        // 驗證必要欄位
        $this->validateProductData($data);
        
        $product = new Product();
        $product->name = $data['name'];
        $product->description = $data['description'] ?? '';
        $product->category_id = $data['category_id'];
        
        $product->save();
        
        Log::info('SPU created', ['product_id' => $product->id, 'name' => $product->name]);
        
        return $product;
    }
    
    /**
     * 創建商品變體
     * 
     * @param Product $product SPU 商品
     * @param array $variants 變體數據陣列
     * @return void
     */
    private function createVariants(Product $product, array $variants): void
    {
        foreach ($variants as $variantData) {
            $this->createSingleVariant($product, $variantData);
        }
        
        Log::info('Variants created', [
            'product_id' => $product->id,
            'variants_count' => count($variants)
        ]);
    }
    
    /**
     * 創建單個商品變體
     * 
     * @param Product $product SPU 商品
     * @param array $variantData 變體數據
     * @return ProductVariant 創建的變體
     */
    private function createSingleVariant(Product $product, array $variantData): ProductVariant
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
        
        // 處理屬性值關聯（如果提供）
        if (isset($variantData['attribute_values']) && is_array($variantData['attribute_values'])) {
            $variant->attributeValues()->attach($variantData['attribute_values']);
        }
        
        return $variant;
    }
    
    /**
     * 生成 SKU 編號
     * 
     * @param Product $product SPU 商品
     * @param array $variantData 變體數據
     * @return string 生成的 SKU
     */
    private function generateSku(Product $product, array $variantData): string
    {
        // 簡單的 SKU 生成邏輯：產品ID + 變體序號 + 隨機字符
        $variantCount = $product->variants()->count() + 1;
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        
        return "PRD-{$product->id}-{$variantCount}-{$random}";
    }
    
    /**
     * 附加屬性到商品
     * 
     * @param Product $product SPU 商品
     * @param array $attributeIds 屬性ID陣列
     * @return void
     */
    private function attachAttributes(Product $product, array $attributeIds): void
    {
        $product->attributes()->attach($attributeIds);
        
        Log::info('Attributes attached', [
            'product_id' => $product->id,
            'attribute_ids' => $attributeIds
        ]);
    }
    
    /**
     * 初始化庫存記錄
     * 為所有 SKU 變體在所有門市創建庫存記錄
     * 
     * @param Product $product SPU 商品
     * @return void
     */
    private function initializeInventory(Product $product): void
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
                        'low_stock_threshold' => 10, // 預設低庫存預警值
                    ]);
                }
            }
        }
        
        Log::info('Inventory initialized', [
            'product_id' => $product->id,
            'variants_count' => $variants->count(),
            'stores_count' => $stores->count()
        ]);
    }
    
    /**
     * 驗證商品數據
     * 
     * @param array $data 商品數據
     * @throws Exception 驗證失敗時拋出異常
     */
    private function validateProductData(array $data): void
    {
        if (empty($data['name'])) {
            throw new Exception('商品名稱不能為空');
        }
        
        if (empty($data['category_id'])) {
            throw new Exception('商品分類不能為空');
        }
        
        // 驗證分類是否存在
        if (!Category::find($data['category_id'])) {
            throw new Exception('指定的商品分類不存在');
        }
    }
} 