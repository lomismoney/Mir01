<?php

namespace Tests\Unit\Services;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * ProductService 完整測試
 * 
 * 測試產品服務的核心業務邏輯，包括商品與變體的複雜更新流程
 */
class ProductServiceCompleteTest extends TestCase
{
    use RefreshDatabase;

    private ProductService $productService;
    private Product $product;
    private Category $category;
    private Attribute $attribute1;
    private Attribute $attribute2;
    private AttributeValue $attributeValue1;
    private AttributeValue $attributeValue2;
    private AttributeValue $attributeValue3;
    private Store $store1;
    private Store $store2;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->productService = new ProductService();
        
        // 創建測試數據
        $this->category = Category::factory()->create(['name' => '測試分類']);
        
        // 創建屬性和屬性值
        $this->attribute1 = Attribute::factory()->create(['name' => '顏色']);
        $this->attribute2 = Attribute::factory()->create(['name' => '尺寸']);
        
        $this->attributeValue1 = AttributeValue::factory()->create([
            'attribute_id' => $this->attribute1->id,
            'value' => '紅色'
        ]);
        $this->attributeValue2 = AttributeValue::factory()->create([
            'attribute_id' => $this->attribute1->id,
            'value' => '藍色'
        ]);
        $this->attributeValue3 = AttributeValue::factory()->create([
            'attribute_id' => $this->attribute2->id,
            'value' => 'L'
        ]);
        
        // 創建門市
        $this->store1 = Store::factory()->create(['name' => '門市A']);
        $this->store2 = Store::factory()->create(['name' => '門市B']);
        
        // 創建測試商品
        $this->product = Product::factory()->create([
            'name' => '測試商品',
            'description' => '原始描述',
            'category_id' => $this->category->id
        ]);
        
        // 為商品關聯屬性
        $this->product->attributes()->attach([$this->attribute1->id, $this->attribute2->id]);
    }

    /**
     * 測試 ProductService 可以被正確實例化
     */
    public function test_product_service_can_be_instantiated(): void
    {
        $this->assertInstanceOf(ProductService::class, $this->productService);
    }

    /**
     * 測試更新商品基本資訊
     */
    public function test_update_product_basic_information(): void
    {
        $validatedData = [
            'name' => '更新後的商品名稱',
            'description' => '更新後的描述',
            'category_id' => $this->category->id,
            'attributes' => [$this->attribute1->id],
            'variants' => []
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        $this->assertEquals('更新後的商品名稱', $updatedProduct->name);
        $this->assertEquals('更新後的描述', $updatedProduct->description);
        $this->assertEquals($this->category->id, $updatedProduct->category_id);
    }

    /**
     * 測試更新商品屬性關聯
     */
    public function test_update_product_attribute_associations(): void
    {
        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id], // 只保留一個屬性
            'variants' => []
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        $attributeIds = $updatedProduct->attributes()->pluck('attributes.id')->toArray();
        $this->assertCount(1, $attributeIds);
        $this->assertContains($this->attribute1->id, $attributeIds);
        $this->assertNotContains($this->attribute2->id, $attributeIds);
    }

    /**
     * 測試創建新變體
     */
    public function test_create_new_variants(): void
    {
        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 1000,
                    'attribute_value_ids' => [$this->attributeValue1->id]
                ],
                [
                    'sku' => 'TEST-SKU-002',
                    'price' => 1200,
                    'attribute_value_ids' => [$this->attributeValue2->id]
                ]
            ]
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        $this->assertCount(2, $updatedProduct->variants);
        
        $variant1 = $updatedProduct->variants->where('sku', 'TEST-SKU-001')->first();
        $this->assertNotNull($variant1);
        $this->assertEquals(1000, $variant1->price);
        
        $variant2 = $updatedProduct->variants->where('sku', 'TEST-SKU-002')->first();
        $this->assertNotNull($variant2);
        $this->assertEquals(1200, $variant2->price);
    }

    /**
     * 測試新變體會為所有門市創建庫存記錄
     */
    public function test_new_variants_create_inventory_for_all_stores(): void
    {
        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'sku' => 'TEST-SKU-001',
                    'price' => 1000,
                    'attribute_value_ids' => [$this->attributeValue1->id]
                ]
            ]
        ];

        $this->productService->updateProductWithVariants($this->product, $validatedData);

        $variant = $this->product->variants->first();
        
        // 檢查是否為所有門市創建了庫存記錄
        $inventoryCount = Inventory::where('product_variant_id', $variant->id)->count();
        $this->assertEquals(2, $inventoryCount); // 應該有兩個門市的庫存記錄
        
        // 檢查每個門市都有庫存記錄
        $store1Inventory = Inventory::where('product_variant_id', $variant->id)
            ->where('store_id', $this->store1->id)
            ->first();
        $this->assertNotNull($store1Inventory);
        $this->assertEquals(0, $store1Inventory->quantity);
        
        $store2Inventory = Inventory::where('product_variant_id', $variant->id)
            ->where('store_id', $this->store2->id)
            ->first();
        $this->assertNotNull($store2Inventory);
        $this->assertEquals(0, $store2Inventory->quantity);
    }

    /**
     * 測試更新現有變體
     */
    public function test_update_existing_variants(): void
    {
        // 首先創建一個變體
        $existingVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'OLD-SKU',
            'price' => 800
        ]);
        $existingVariant->attributeValues()->attach([$this->attributeValue1->id]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'id' => $existingVariant->id,
                    'sku' => 'UPDATED-SKU',
                    'price' => 1500,
                    'attribute_value_ids' => [$this->attributeValue2->id]
                ]
            ]
        ];

        $this->productService->updateProductWithVariants($this->product, $validatedData);

        $existingVariant->refresh();
        $this->assertEquals('UPDATED-SKU', $existingVariant->sku);
        $this->assertEquals(1500, $existingVariant->price);
        
        // 檢查屬性值關聯是否更新
        $attributeValueIds = $existingVariant->attributeValues()->pluck('attribute_values.id')->toArray();
        $this->assertContains($this->attributeValue2->id, $attributeValueIds);
        $this->assertNotContains($this->attributeValue1->id, $attributeValueIds);
    }

    /**
     * 測試刪除不在請求中的變體
     */
    public function test_delete_variants_not_in_request(): void
    {
        // 創建兩個現有變體
        $variant1 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'KEEP-SKU',
            'price' => 800
        ]);
        $variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'DELETE-SKU',
            'price' => 900
        ]);

        // 為變體創建庫存記錄
        Inventory::factory()->create([
            'product_variant_id' => $variant2->id,
            'store_id' => $this->store1->id,
            'quantity' => 10
        ]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'id' => $variant1->id,
                    'sku' => 'KEEP-SKU',
                    'price' => 800
                ]
                // variant2 不在請求中，應該被刪除
            ]
        ];

        $this->productService->updateProductWithVariants($this->product, $validatedData);

        // 檢查 variant1 仍然存在
        $this->assertDatabaseHas('product_variants', [
            'id' => $variant1->id,
            'sku' => 'KEEP-SKU'
        ]);

        // 檢查 variant2 已被刪除
        $this->assertDatabaseMissing('product_variants', [
            'id' => $variant2->id
        ]);

        // 檢查相關的庫存記錄仍然存在但 product_variant_id 為 null（歷史數據保留）
        $inventoryRecord = Inventory::where('store_id', $this->store1->id)
            ->where('quantity', 10)
            ->whereNull('product_variant_id')
            ->first();
        $this->assertNotNull($inventoryRecord, '變體刪除後其庫存記錄應該保留作為歷史數據，但 product_variant_id 設為 null');
    }

    /**
     * 測試混合操作：同時創建、更新、刪除變體
     */
    public function test_mixed_variant_operations(): void
    {
        // 創建現有變體
        $keepVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'KEEP-SKU',
            'price' => 800
        ]);
        $deleteVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'DELETE-SKU',
            'price' => 900
        ]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                // 更新現有變體
                [
                    'id' => $keepVariant->id,
                    'sku' => 'UPDATED-KEEP-SKU',
                    'price' => 1000
                ],
                // 創建新變體
                [
                    'sku' => 'NEW-SKU',
                    'price' => 1200,
                    'attribute_value_ids' => [$this->attributeValue1->id]
                ]
                // deleteVariant 不在請求中，會被刪除
            ]
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        // 檢查更新的變體
        $keepVariant->refresh();
        $this->assertEquals('UPDATED-KEEP-SKU', $keepVariant->sku);
        $this->assertEquals(1000, $keepVariant->price);

        // 檢查新創建的變體
        $newVariant = $updatedProduct->variants->where('sku', 'NEW-SKU')->first();
        $this->assertNotNull($newVariant);
        $this->assertEquals(1200, $newVariant->price);

        // 檢查刪除的變體
        $this->assertDatabaseMissing('product_variants', [
            'id' => $deleteVariant->id
        ]);

        // 確認最終只有兩個變體
        $this->assertCount(2, $updatedProduct->variants);
    }

    /**
     * 測試交易回滾：當變體創建失敗時整個操作回滾
     */
    public function test_transaction_rollback_on_variant_creation_failure(): void
    {
        $originalName = $this->product->name;

        // 在另一個產品中創建一個變體，使用相同的 SKU
        $anotherProduct = Product::factory()->create([
            'name' => '另一個商品',
            'category_id' => $this->category->id
        ]);
        
        $existingVariant = ProductVariant::factory()->create([
            'product_id' => $anotherProduct->id,
            'sku' => 'EXISTING-SKU'
        ]);

        $validatedData = [
            'name' => '這個名稱不應該被保存',
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'sku' => 'EXISTING-SKU', // 重複的 SKU 會導致失敗
                    'price' => 1000
                ]
            ]
        ];

        $exceptionThrown = false;
        
        // 手動開始事務來測試回滾
        DB::beginTransaction();
        try {
            $this->productService->updateProductWithVariants($this->product, $validatedData);
            DB::commit();
        } catch (\Exception $e) {
            $exceptionThrown = true;
            DB::rollBack();
            // 檢查商品名稱沒有被更新（交易回滾）
            $this->product->refresh();
            $this->assertEquals($originalName, $this->product->name);
        }
        
        $this->assertTrue($exceptionThrown, '應該拋出異常');
    }

    /**
     * 測試空變體陣列的處理
     */
    public function test_handle_empty_variants_array(): void
    {
        // 創建現有變體
        $existingVariant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TO-BE-DELETED'
        ]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [] // 空陣列，所有現有變體應該被刪除
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        $this->assertCount(0, $updatedProduct->variants);
        $this->assertDatabaseMissing('product_variants', [
            'id' => $existingVariant->id
        ]);
    }

    /**
     * 測試不更新可選欄位時保持原值
     */
    public function test_preserve_original_values_for_optional_fields(): void
    {
        $originalDescription = $this->product->description;
        $originalCategoryId = $this->product->category_id;

        $validatedData = [
            'name' => '新的商品名稱',
            'attributes' => [$this->attribute1->id],
            'variants' => []
            // 沒有提供 description 和 category_id
        ];

        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);

        $this->assertEquals('新的商品名稱', $updatedProduct->name);
        $this->assertEquals($originalDescription, $updatedProduct->description);
        $this->assertEquals($originalCategoryId, $updatedProduct->category_id);
    }

    /**
     * 測試變體屬性值關聯的同步
     */
    public function test_variant_attribute_value_sync(): void
    {
        $variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU'
        ]);
        $variant->attributeValues()->attach([$this->attributeValue1->id, $this->attributeValue2->id]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'TEST-SKU',
                    'price' => 1000,
                    'attribute_value_ids' => [$this->attributeValue3->id] // 只保留一個屬性值
                ]
            ]
        ];

        $this->productService->updateProductWithVariants($this->product, $validatedData);

        $variant->refresh();
        $attributeValueIds = $variant->attributeValues()->pluck('attribute_values.id')->toArray();
        
        $this->assertCount(1, $attributeValueIds);
        $this->assertContains($this->attributeValue3->id, $attributeValueIds);
        $this->assertNotContains($this->attributeValue1->id, $attributeValueIds);
        $this->assertNotContains($this->attributeValue2->id, $attributeValueIds);
    }

    /**
     * 測試變體不提供 attribute_value_ids 時的處理
     */
    public function test_variant_without_attribute_value_ids(): void
    {
        $variant = ProductVariant::factory()->create([
            'product_id' => $this->product->id,
            'sku' => 'TEST-SKU'
        ]);
        $variant->attributeValues()->attach([$this->attributeValue1->id]);

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'UPDATED-SKU',
                    'price' => 1000
                    // 沒有提供 attribute_value_ids
                ]
            ]
        ];

        $this->productService->updateProductWithVariants($this->product, $validatedData);

        $variant->refresh();
        $this->assertEquals('UPDATED-SKU', $variant->sku);
        
        // 原有的屬性值關聯應該保持不變
        $attributeValueIds = $variant->attributeValues()->pluck('attribute_values.id')->toArray();
        $this->assertContains($this->attributeValue1->id, $attributeValueIds);
    }

    /**
     * 測試大量變體的處理性能
     */
    public function test_handle_large_number_of_variants(): void
    {
        $variants = [];
        
        // 創建 50 個變體
        for ($i = 1; $i <= 50; $i++) {
            $variants[] = [
                'sku' => "BULK-SKU-{$i}",
                'price' => 1000 + $i,
                'attribute_value_ids' => [$this->attributeValue1->id]
            ];
        }

        $validatedData = [
            'name' => $this->product->name,
            'attributes' => [$this->attribute1->id],
            'variants' => $variants
        ];

        $startTime = microtime(true);
        $updatedProduct = $this->productService->updateProductWithVariants($this->product, $validatedData);
        $endTime = microtime(true);

        $this->assertCount(50, $updatedProduct->variants);
        
        // 檢查處理時間（應該在合理範圍內）
        $processingTime = $endTime - $startTime;
        $this->assertLessThan(5.0, $processingTime, '處理 50 個變體不應超過 5 秒');
    }

    /**
     * 測試服務方法的存在性和可見性
     */
    public function test_service_methods_exist(): void
    {
        $reflection = new \ReflectionClass(ProductService::class);
        
        // 檢查公共方法
        $this->assertTrue($reflection->hasMethod('updateProductWithVariants'));
        $updateMethod = $reflection->getMethod('updateProductWithVariants');
        $this->assertTrue($updateMethod->isPublic());
        
        // 檢查私有方法
        $this->assertTrue($reflection->hasMethod('processVariantChanges'));
        $this->assertTrue($reflection->hasMethod('deleteVariants'));
        $this->assertTrue($reflection->hasMethod('updateExistingVariant'));
        $this->assertTrue($reflection->hasMethod('createNewVariant'));
        
        $privateMethod = $reflection->getMethod('processVariantChanges');
        $this->assertTrue($privateMethod->isPrivate());
    }
}