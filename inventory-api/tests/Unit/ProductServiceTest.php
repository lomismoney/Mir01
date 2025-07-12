<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\ProductService;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\Inventory;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

/**
 * ProductService 單元測試
 * 
 * 測試商品服務的核心功能，包括：
 * - 更新商品及其變體
 * - 處理 SKU 的新增、更新、刪除
 * - 確保庫存記錄的正確性
 */
class ProductServiceTest extends TestCase
{
    use RefreshDatabase;
    
    protected ProductService $productService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->productService = new ProductService();
    }
    
    /**
     * 測試更新商品基本資訊
     */
    public function test_update_product_basic_info()
    {
        // 準備測試數據
        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Original Name',
            'description' => 'Original Description',
            'category_id' => $category->id,
        ]);
        
        $newCategory = Category::factory()->create();
        $attributes = Attribute::factory()->count(2)->create();
        
        $validatedData = [
            'name' => 'Updated Name',
            'description' => 'Updated Description',
            'category_id' => $newCategory->id,
            'attributes' => $attributes->pluck('id')->toArray(),
            'variants' => []
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertEquals('Updated Name', $updatedProduct->name);
        $this->assertEquals('Updated Description', $updatedProduct->description);
        $this->assertEquals($newCategory->id, $updatedProduct->category_id);
        $this->assertCount(2, $updatedProduct->attributes);
    }
    
    /**
     * 測試新增商品變體
     */
    public function test_create_new_variants()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $stores = Store::factory()->count(3)->create();
        $attribute = Attribute::factory()->create();
        $attributeValues = AttributeValue::factory()->count(2)->create(['attribute_id' => $attribute->id]);
        
        $validatedData = [
            'name' => $product->name,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'attributes' => [$attribute->id],
            'variants' => [
                [
                    'sku' => 'NEW-SKU-001',
                    'price' => 10000,
                    'attribute_value_ids' => [$attributeValues[0]->id]
                ],
                [
                    'sku' => 'NEW-SKU-002',
                    'price' => 20000,
                    'attribute_value_ids' => [$attributeValues[1]->id]
                ]
            ]
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertCount(2, $updatedProduct->variants);
        
        $variant1 = $updatedProduct->variants->where('sku', 'NEW-SKU-001')->first();
        $this->assertNotNull($variant1);
        $this->assertEquals(10000, $variant1->price);
        $this->assertTrue($variant1->attributeValues->contains($attributeValues[0]));
        
        // 驗證每個變體在每個門市都有庫存記錄
        foreach ($updatedProduct->variants as $variant) {
            $this->assertCount(3, $variant->inventory);
            foreach ($variant->inventory as $inventory) {
                $this->assertEquals(0, $inventory->quantity);
                $this->assertEquals(0, $inventory->low_stock_threshold);
            }
        }
    }
    
    /**
     * 測試更新現有變體
     */
    public function test_update_existing_variants()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'OLD-SKU',
            'price' => 10000
        ]);
        
        $attribute = Attribute::factory()->create();
        $oldValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);
        $newValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);
        
        $variant->attributeValues()->attach($oldValue);
        
        $validatedData = [
            'name' => $product->name,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'attributes' => [$attribute->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'UPDATED-SKU',
                    'price' => 20000,
                    'attribute_value_ids' => [$newValue->id]
                ]
            ]
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $updatedVariant = $updatedProduct->variants->first();
        $this->assertEquals('UPDATED-SKU', $updatedVariant->sku);
        $this->assertEquals(20000, $updatedVariant->price);
        $this->assertFalse($updatedVariant->attributeValues->contains($oldValue));
        $this->assertTrue($updatedVariant->attributeValues->contains($newValue));
    }
    
    /**
     * 測試刪除變體
     */
    public function test_delete_variants()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $store = Store::factory()->create();
        
        $variantToKeep = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'KEEP-SKU'
        ]);
        
        $variantToDelete = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'DELETE-SKU'
        ]);
        
        // 為要刪除的變體創建庫存記錄
        Inventory::factory()->create([
            'product_variant_id' => $variantToDelete->id,
            'store_id' => $store->id
        ]);
        
        $attribute = Attribute::factory()->create();
        $attributeValue = AttributeValue::factory()->create(['attribute_id' => $attribute->id]);
        $variantToDelete->attributeValues()->attach($attributeValue);
        
        $validatedData = [
            'name' => $product->name,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'attributes' => [],
            'variants' => [
                [
                    'id' => $variantToKeep->id,
                    'sku' => 'KEEP-SKU',
                    'price' => $variantToKeep->price,
                    'attribute_value_ids' => []
                ]
            ]
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertCount(1, $updatedProduct->variants);
        $this->assertEquals('KEEP-SKU', $updatedProduct->variants->first()->sku);
        
        // 驗證變體被刪除
        $this->assertNull(ProductVariant::find($variantToDelete->id));
        
        // 驗證庫存記錄被刪除
        $this->assertCount(0, Inventory::where('product_variant_id', $variantToDelete->id)->get());
        
        // 驗證屬性值關聯被刪除
        $this->assertCount(0, DB::table('attribute_value_product_variant')
            ->where('product_variant_id', $variantToDelete->id)
            ->get());
    }
    
    /**
     * 測試複雜的變體操作（同時新增、更新、刪除）
     */
    public function test_complex_variant_operations()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $stores = Store::factory()->count(2)->create();
        
        $variantToUpdate = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'UPDATE-SKU',
            'price' => 10000
        ]);
        
        $variantToDelete = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'DELETE-SKU'
        ]);
        
        $validatedData = [
            'name' => 'Updated Product',
            'description' => $product->description,
            'category_id' => $product->category_id,
            'attributes' => [],
            'variants' => [
                // 更新現有變體
                [
                    'id' => $variantToUpdate->id,
                    'sku' => 'UPDATED-SKU',
                    'price' => 15000,
                    'attribute_value_ids' => []
                ],
                // 新增變體
                [
                    'sku' => 'NEW-SKU',
                    'price' => 25000,
                    'attribute_value_ids' => []
                ]
                // variantToDelete 不在列表中，將被刪除
            ]
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertEquals('Updated Product', $updatedProduct->name);
        $this->assertCount(2, $updatedProduct->variants);
        
        // 驗證更新的變體
        $updated = $updatedProduct->variants->where('sku', 'UPDATED-SKU')->first();
        $this->assertNotNull($updated);
        $this->assertEquals(15000, $updated->price);
        
        // 驗證新增的變體
        $new = $updatedProduct->variants->where('sku', 'NEW-SKU')->first();
        $this->assertNotNull($new);
        $this->assertEquals(25000, $new->price);
        $this->assertCount(2, $new->inventory); // 應該在2個門市都有庫存記錄
        
        // 驗證刪除的變體
        $this->assertNull(ProductVariant::find($variantToDelete->id));
    }
    
    /**
     * 測試交易回滾
     */
    public function test_transaction_rollback_on_error()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $variant = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'EXISTING-SKU'
        ]);
        
        $validatedData = [
            'name' => 'Updated Name',
            'description' => $product->description,
            'category_id' => 999999, // 不存在的分類 ID
            'attributes' => [],
            'variants' => []
        ];
        
        // 執行更新並預期失敗
        try {
            $this->productService->updateProductWithVariants($product, $validatedData);
            $this->fail('Expected exception was not thrown');
        } catch (\Exception $e) {
            // 驗證商品名稱沒有被更新（交易已回滾）
            $product->refresh();
            $this->assertNotEquals('Updated Name', $product->name);
            $this->assertCount(1, $product->variants); // 變體沒有被刪除
        }
    }
    
    /**
     * 測試處理沒有變體的商品
     */
    public function test_update_product_with_no_variants()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        
        $validatedData = [
            'name' => 'Updated Name',
            'description' => 'Updated Description',
            'category_id' => $product->category_id,
            'attributes' => [],
            'variants' => []
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertEquals('Updated Name', $updatedProduct->name);
        $this->assertEquals('Updated Description', $updatedProduct->description);
        $this->assertCount(0, $updatedProduct->variants);
    }
    
    /**
     * 測試屬性同步
     */
    public function test_sync_product_attributes()
    {
        // 準備測試數據
        $product = Product::factory()->create();
        $oldAttributes = Attribute::factory()->count(2)->create();
        $newAttributes = Attribute::factory()->count(3)->create();
        
        // 先關聯舊屬性
        $product->attributes()->attach($oldAttributes);
        
        $validatedData = [
            'name' => $product->name,
            'description' => $product->description,
            'category_id' => $product->category_id,
            'attributes' => $newAttributes->pluck('id')->toArray(),
            'variants' => []
        ];
        
        // 執行更新
        $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
        
        // 驗證結果
        $this->assertCount(3, $updatedProduct->attributes);
        foreach ($newAttributes as $attribute) {
            $this->assertTrue($updatedProduct->attributes->contains($attribute));
        }
        foreach ($oldAttributes as $attribute) {
            $this->assertFalse($updatedProduct->attributes->contains($attribute));
        }
    }
}