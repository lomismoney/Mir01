<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;

class ProductControllerTest extends TestCase
{
    use WithFaker;
    
    /** @test */
    public function admin_can_get_all_products()
    {
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建多個商品
        Product::factory()->count(3)->create([
            'category_id' => $category->id
        ]);
        
        // 以管理員身份訪問 API
        $response = $this->actingAsAdmin()
            ->getJson('/api/products');
            
        // 檢查響應
        $response->assertStatus(200);
        
        // 確認數據庫中有三個商品
        $this->assertCount(3, Product::all());
    }
    
    /** @test */
    public function admin_can_create_simple_product()
    {
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $productData = [
            'name' => '測試商品',
            'description' => '這是一個測試商品的描述',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id], // 必要的屬性ID列表
            'variants' => [
                [
                    'sku' => 'TEST001-VAR1',
                    'price' => 100.00,
                    'attribute_value_ids' => [$redValue->id] // 使用 attribute_value_ids 而不是 attribute_values
                ]
            ]
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products', $productData);
            
        $response->assertStatus(201)
            ->assertJson(function (AssertableJson $json) use ($productData) {
                $json->has('data')
                    ->where('data.name', $productData['name'])
                    ->where('data.description', $productData['description'])
                    ->where('data.category_id', $productData['category_id'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('products', [
            'name' => $productData['name'],
            'description' => $productData['description'],
            'category_id' => $productData['category_id'],
        ]);
        
        $this->assertDatabaseHas('product_variants', [
            'sku' => $productData['variants'][0]['sku'],
            'price' => $productData['variants'][0]['price'],
        ]);
    }
    
    /** @test */
    public function admin_can_create_product_with_variants()
    {
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $blueValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '藍色'
        ]);
        
        $smallValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        $mediumValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'M'
        ]);
        
        $productData = [
            'name' => '帶變體的測試商品',
            'description' => '這是一個有多個變體的測試商品',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id, $sizeAttribute->id],
            'variants' => [
                [
                    'sku' => 'TESTVAR001-RED-S',
                    'price' => 100.00,
                    'attribute_value_ids' => [$redValue->id, $smallValue->id]
                ],
                [
                    'sku' => 'TESTVAR001-RED-M',
                    'price' => 110.00,
                    'attribute_value_ids' => [$redValue->id, $mediumValue->id]
                ],
                [
                    'sku' => 'TESTVAR001-BLUE-S',
                    'price' => 100.00,
                    'attribute_value_ids' => [$blueValue->id, $smallValue->id]
                ],
                [
                    'sku' => 'TESTVAR001-BLUE-M',
                    'price' => 110.00,
                    'attribute_value_ids' => [$blueValue->id, $mediumValue->id]
                ]
            ]
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products', $productData);
            
        $response->assertStatus(201);
        
        // 檢查產品是否創建成功
        $this->assertDatabaseHas('products', [
            'name' => $productData['name'],
        ]);
        
        // 檢查所有變體是否創建成功
        foreach ($productData['variants'] as $variant) {
            $this->assertDatabaseHas('product_variants', [
                'sku' => $variant['sku'],
                'price' => $variant['price'],
            ]);
        }
        
        // 獲取創建的產品
        $createdProduct = Product::where('name', $productData['name'])->first();
        
        // 檢查產品是否與屬性關聯
        $this->assertCount(2, $createdProduct->attributes);
        
        // 檢查產品是否有 4 個變體
        $this->assertCount(4, $createdProduct->variants);
    }
    
    /** @test */
    public function admin_can_show_product_details()
    {
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建產品
        $product = Product::factory()->create([
            'category_id' => $category->id
        ]);
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        // 關聯產品與屬性
        $product->attributes()->attach($colorAttribute->id);
        
        // 創建產品變體
        $variant = $product->variants()->create([
            'sku' => $this->faker->unique()->regexify('[A-Z0-9]{8}'),
            'price' => 100.00,
        ]);
        
        // 關聯變體與屬性值
        $variant->attributeValues()->attach($redValue->id);
        
        // 為變體創建庫存記錄（需要指定門市）
        $store = \App\Models\Store::factory()->create();
        \App\Models\Inventory::create([
            'product_variant_id' => $variant->id,
            'store_id' => $store->id,
            'quantity' => 25,
            'low_stock_threshold' => 5,
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/products/{$product->id}");
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($product) {
                $json->has('data')
                    ->where('data.id', $product->id)
                    ->where('data.name', $product->name)
                    ->where('data.description', $product->description)
                    ->where('data.category_id', $product->category_id)
                    ->etc();
            });
            
        // 確認產品加載了變體
        $this->assertArrayHasKey('variants', $response->json('data'));
    }
    
    /** @test */
    public function admin_can_update_product()
    {
        // 創建分類
        $category = Category::factory()->create();
        $newCategory = Category::factory()->create();
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $smallValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        // 創建產品
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => '原始商品名稱',
            'description' => '原始商品描述',
        ]);
        
        // 關聯商品與屬性
        $product->attributes()->attach([$colorAttribute->id, $sizeAttribute->id]);
        
        // 創建變體
        $variant = $product->variants()->create([
            'sku' => 'ORIGINAL-RED-S',
            'price' => 100.00,
        ]);
        $variant->attributeValues()->attach([$redValue->id, $smallValue->id]);
        
        // 更新資料 - 必須包含完整的 attributes 和 variants
        $updatedData = [
            'name' => '更新的商品名稱',
            'description' => '更新的商品描述',
            'category_id' => $newCategory->id,
            'attributes' => [$colorAttribute->id, $sizeAttribute->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'UPDATED-RED-S',
                    'price' => 120.00,
                    'attribute_value_ids' => [$redValue->id, $smallValue->id]
                ]
            ]
        ];
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/products/{$product->id}", $updatedData);
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($updatedData) {
                $json->has('data')
                    ->where('data.name', $updatedData['name'])
                    ->where('data.description', $updatedData['description'])
                    ->where('data.category_id', $updatedData['category_id'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => $updatedData['name'],
            'description' => $updatedData['description'],
            'category_id' => $updatedData['category_id'],
        ]);
    }
    
    /** @test */
    public function admin_can_successfully_update_product_with_variants()
    {
        // 創建分類
        $category = Category::factory()->create();
        $newCategory = Category::factory()->create();
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $blueValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '藍色'
        ]);
        
        $smallValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        $mediumValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'M'
        ]);
        
        // 1. 創建一個商品
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => '原始商品名稱',
            'description' => '原始商品描述',
        ]);
        
        // 關聯商品與屬性
        $product->attributes()->attach([$colorAttribute->id, $sizeAttribute->id]);
        
        // 創建原始變體
        $originalVariant = $product->variants()->create([
            'sku' => 'ORIGINAL-RED-S',
            'price' => 100.00,
        ]);
        $originalVariant->attributeValues()->attach([$redValue->id, $smallValue->id]);
        
        // 2. 準備更新用的新數據
        $updatedData = [
            'name' => '更新的商品名稱',
            'description' => '更新的商品描述',
            'category_id' => $newCategory->id,
            'attributes' => [$colorAttribute->id, $sizeAttribute->id],
            'variants' => [
                // 保留原始變體但更新價格
                [
                    'id' => $originalVariant->id,
                    'sku' => 'UPDATED-RED-S',
                    'price' => 120.00,
                    'attribute_value_ids' => [$redValue->id, $smallValue->id]
                ],
                // 新增一個變體
                [
                    'sku' => 'NEW-BLUE-M',
                    'price' => 130.00,
                    'attribute_value_ids' => [$blueValue->id, $mediumValue->id]
                ]
            ]
        ];
        
        // 3. 發送 PUT 請求到 /api/products/{id}
        $response = $this->actingAsAdmin()
            ->putJson("/api/products/{$product->id}", $updatedData);
            
        // 4. 斷言返回 200 狀態碼
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($updatedData) {
                $json->has('data')
                    ->where('data.name', $updatedData['name'])
                    ->where('data.description', $updatedData['description'])
                    ->where('data.category_id', $updatedData['category_id'])
                    ->has('data.variants', 2) // 應該有兩個變體
                    ->etc();
            });
            
        // 5. 斷言資料庫中的數據已被更新
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => $updatedData['name'],
            'description' => $updatedData['description'],
            'category_id' => $updatedData['category_id'],
        ]);
        
        // 檢查變體更新
        $this->assertDatabaseHas('product_variants', [
            'id' => $originalVariant->id,
            'sku' => 'UPDATED-RED-S',
            'price' => 120.00,
        ]);
        
        // 檢查新變體創建
        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'sku' => 'NEW-BLUE-M',
            'price' => 130.00,
        ]);
        
        // 確認變體總數
        $this->assertCount(2, $product->fresh()->variants);
    }
    
    /** @test */
    public function admin_can_delete_product()
    {
        // 創建產品
        $product = Product::factory()->create();
        
        $response = $this->actingAsAdmin()
            ->deleteJson("/api/products/{$product->id}");
            
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('products', [
            'id' => $product->id
        ]);
    }
    
    /** @test */
    public function admin_can_batch_delete_products()
    {
        // 創建多個產品
        $products = Product::factory()->count(3)->create();
        $productIds = $products->pluck('id')->toArray();
        
        $response = $this->actingAsAdmin()
            ->postJson("/api/products/batch-delete", [
                'ids' => $productIds
            ]);
            
        $response->assertStatus(204);
        
        // 確認所有產品都已刪除
        foreach ($productIds as $id) {
            $this->assertDatabaseMissing('products', [
                'id' => $id
            ]);
        }
    }
    
    /** @test */
    public function staff_can_view_products()
    {
        // 創建多個產品
        Product::factory()->count(3)->create();
        
        // 以普通用戶身份訪問 API
        $response = $this->actingAsUser()
            ->getJson('/api/products');
            
        // 檢查響應
        $response->assertStatus(200);
    }
    
    /** @test */
    public function staff_cannot_create_product()
    {
        // 創建分類
        $category = Category::factory()->create();
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $productData = [
            'name' => '員工嘗試創建的商品',
            'description' => '這是員工嘗試創建的商品描述',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id],
            'variants' => [
                [
                    'sku' => 'STAFF001',
                    'price' => 100.00,
                    'attribute_value_ids' => [$redValue->id]
                ]
            ]
        ];
        
        // 模擬 UserPolicy 中的授權規則
        $this->app->bind('App\Policies\ProductPolicy', function ($app) {
            return new class {
                public function create($user) { return $user->isAdmin(); }
                // 其他權限方法...
            };
        });
        
        $response = $this->actingAsUser()
            ->postJson('/api/products', $productData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseMissing('products', [
            'name' => $productData['name'],
        ]);
    }
    
    /** @test */
    public function staff_cannot_update_product()
    {
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $smallValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        
        // 創建產品
        $product = Product::factory()->create([
            'name' => '原始商品名稱',
            'description' => '原始商品描述',
        ]);
        
        // 關聯商品與屬性
        $product->attributes()->attach([$colorAttribute->id, $sizeAttribute->id]);
        
        // 創建變體
        $variant = $product->variants()->create([
            'sku' => 'ORIGINAL-RED-S',
            'price' => 100.00,
        ]);
        $variant->attributeValues()->attach([$redValue->id, $smallValue->id]);
        
        $updatedData = [
            'name' => '員工嘗試更新的商品名稱',
            'description' => '員工嘗試更新的商品描述',
            'attributes' => [$colorAttribute->id, $sizeAttribute->id],
            'variants' => [
                [
                    'id' => $variant->id,
                    'sku' => 'STAFF-UPDATED-RED-S',
                    'price' => 120.00,
                    'attribute_value_ids' => [$redValue->id, $smallValue->id]
                ]
            ]
        ];
        
        $response = $this->actingAsUser()
            ->putJson("/api/products/{$product->id}", $updatedData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
        ]);
    }
    
    /** @test */
    public function staff_cannot_delete_product()
    {
        // 創建產品
        $product = Product::factory()->create();
        
        $response = $this->actingAsUser()
            ->deleteJson("/api/products/{$product->id}");
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('products', [
            'id' => $product->id
        ]);
    }

    // 🚀 TD-004 解決方案：新增篩選功能測試案例

    /** @test */
    public function admin_can_filter_products_by_product_name()
    {
        // 創建測試商品
        Product::factory()->create(['name' => '辦公椅豪華版']);
        Product::factory()->create(['name' => '辦公桌經典款']);
        Product::factory()->create(['name' => '書櫃現代風']);

        // 測試商品名稱篩選
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?product_name=辦公');

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 2) // 應該返回 2 個包含「辦公」的商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_filter_products_by_category_id()
    {
        // 創建分類
        $furnitureCategory = Category::factory()->create(['name' => '家具']);
        $electronicsCategory = Category::factory()->create(['name' => '電子產品']);

        // 創建不同分類的商品
        Product::factory()->count(2)->create(['category_id' => $furnitureCategory->id]);
        Product::factory()->count(3)->create(['category_id' => $electronicsCategory->id]);

        // 測試按分類篩選
        $response = $this->actingAsAdmin()
            ->getJson("/api/products?category_id={$furnitureCategory->id}");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 2) // 應該返回 2 個家具類商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_filter_products_by_store_id()
    {
        // 創建門市
        $store1 = \App\Models\Store::factory()->create(['name' => '台北店']);
        $store2 = \App\Models\Store::factory()->create(['name' => '台中店']);

        // 創建商品和變體
        $product1 = Product::factory()->create();
        $variant1 = ProductVariant::factory()->create(['product_id' => $product1->id]);
        
        $product2 = Product::factory()->create();
        $variant2 = ProductVariant::factory()->create(['product_id' => $product2->id]);

        // 在不同門市創建庫存
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $variant1->id,
            'store_id' => $store1->id,
            'quantity' => 10
        ]);
        
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $variant2->id,
            'store_id' => $store2->id,
            'quantity' => 5
        ]);

        // 測試按門市篩選
        $response = $this->actingAsAdmin()
            ->getJson("/api/products?store_id={$store1->id}");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 1) // 應該只返回在台北店有庫存的商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_filter_products_by_low_stock()
    {
        // 創建門市
        $store = \App\Models\Store::factory()->create();

        // 創建商品和變體
        $lowStockProduct = Product::factory()->create(['name' => '低庫存商品']);
        $lowStockVariant = ProductVariant::factory()->create(['product_id' => $lowStockProduct->id]);

        $normalStockProduct = Product::factory()->create(['name' => '正常庫存商品']);
        $normalStockVariant = ProductVariant::factory()->create(['product_id' => $normalStockProduct->id]);

        // 創建庫存 - 低庫存商品
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $lowStockVariant->id,
            'store_id' => $store->id,
            'quantity' => 2,
            'low_stock_threshold' => 5 // 庫存 2 <= 閾值 5，屬於低庫存
        ]);

        // 創建庫存 - 正常庫存商品
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $normalStockVariant->id,
            'store_id' => $store->id,
            'quantity' => 10,
            'low_stock_threshold' => 5 // 庫存 10 > 閾值 5，不屬於低庫存
        ]);

        // 測試低庫存篩選
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?low_stock=true');

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 1) // 應該只返回 1 個低庫存商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_filter_products_by_out_of_stock()
    {
        // 創建門市
        $store = \App\Models\Store::factory()->create();

        // 創建商品和變體
        $outOfStockProduct = Product::factory()->create(['name' => '缺貨商品']);
        $outOfStockVariant = ProductVariant::factory()->create(['product_id' => $outOfStockProduct->id]);

        $inStockProduct = Product::factory()->create(['name' => '有庫存商品']);
        $inStockVariant = ProductVariant::factory()->create(['product_id' => $inStockProduct->id]);

        // 創建庫存 - 缺貨商品
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $outOfStockVariant->id,
            'store_id' => $store->id,
            'quantity' => 0 // 庫存為 0，缺貨
        ]);

        // 創建庫存 - 有庫存商品
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $inStockVariant->id,
            'store_id' => $store->id,
            'quantity' => 15 // 有庫存
        ]);

        // 測試缺貨篩選
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?out_of_stock=true');

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 1) // 應該只返回 1 個缺貨商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_combine_multiple_filters()
    {
        // 創建分類和門市
        $category = Category::factory()->create(['name' => '辦公用品']);
        $store = \App\Models\Store::factory()->create();

        // 創建符合條件的商品
        $targetProduct = Product::factory()->create([
            'name' => '辦公椅經典款',
            'category_id' => $category->id
        ]);
        $targetVariant = ProductVariant::factory()->create(['product_id' => $targetProduct->id]);

        // 創建不符合條件的商品
        $otherProduct = Product::factory()->create([
            'name' => '書桌現代款', // 不包含「辦公椅」
            'category_id' => $category->id
        ]);
        $otherVariant = ProductVariant::factory()->create(['product_id' => $otherProduct->id]);

        // 創建庫存
        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $targetVariant->id,
            'store_id' => $store->id,
            'quantity' => 2,
            'low_stock_threshold' => 5 // 低庫存
        ]);

        \App\Models\Inventory::factory()->create([
            'product_variant_id' => $otherVariant->id,
            'store_id' => $store->id,
            'quantity' => 10,
            'low_stock_threshold' => 5 // 正常庫存
        ]);

        // 測試組合篩選：商品名稱 + 分類 + 門市 + 低庫存
        $response = $this->actingAsAdmin()
            ->getJson("/api/products?product_name=辦公椅&category_id={$category->id}&store_id={$store->id}&low_stock=true");

        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data', 1) // 應該只返回 1 個符合所有條件的商品
                    ->etc();
            });
    }

    /** @test */
    public function admin_can_fully_update_a_product_with_spu_and_sku_changes()
    {
        // 戰術指令 4: 核心功能測試
        // 測試完整的商品更新流程，包括 SPU 和 SKU 的增刪改
        
        // === 階段 1: 準備測試環境 ===
        
        // 創建分類
        $category1 = Category::factory()->create(['name' => '原始分類']);
        $category2 = Category::factory()->create(['name' => '新分類']);
        
        // 創建屬性和屬性值
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        $blueValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '藍色'
        ]);
        $greenValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '綠色'
        ]);
        $smallValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'S'
        ]);
        $mediumValue = AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'M'
        ]);
        
        // 創建門市（用於庫存記錄）
        $store1 = \App\Models\Store::factory()->create(['name' => '台北店']);
        $store2 = \App\Models\Store::factory()->create(['name' => '台中店']);
        
        // === 階段 2: 創建初始產品（包含 3 個 SKU：A, B, C）===
        
        $product = Product::factory()->create([
            'name' => '原始商品名稱',
            'description' => '原始描述',
            'category_id' => $category1->id
        ]);
        
        // 關聯屬性
        $product->attributes()->attach([$colorAttribute->id, $sizeAttribute->id]);
        
        // 創建 3 個初始變體：A (紅S), B (藍S), C (紅M)
        $variantA = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'ORIGINAL-RED-S',
            'price' => 100.00
        ]);
        $variantA->attributeValues()->attach([$redValue->id, $smallValue->id]);
        
        $variantB = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'ORIGINAL-BLUE-S',
            'price' => 110.00
        ]);
        $variantB->attributeValues()->attach([$blueValue->id, $smallValue->id]);
        
        $variantC = ProductVariant::factory()->create([
            'product_id' => $product->id,
            'sku' => 'ORIGINAL-RED-M',
            'price' => 120.00
        ]);
        $variantC->attributeValues()->attach([$redValue->id, $mediumValue->id]);
        
        // 為每個變體創建庫存記錄
        foreach ([$variantA, $variantB, $variantC] as $variant) {
            foreach ([$store1, $store2] as $store) {
                \App\Models\Inventory::create([
                    'product_variant_id' => $variant->id,
                    'store_id' => $store->id,
                    'quantity' => 10,
                    'low_stock_threshold' => 5
                ]);
            }
        }
        
        // === 階段 3: 構造更新請求 ===
        // 目標：修改 A，新增 D，刪除 B 和 C
        
        $updateData = [
            'name' => '更新後的商品名稱',
            'description' => '更新後的描述',
            'category_id' => $category2->id,
            'attributes' => [$colorAttribute->id, $sizeAttribute->id],
            'variants' => [
                // 修改現有的變體 A（帶 id）
                [
                    'id' => $variantA->id,
                    'sku' => 'UPDATED-RED-S',
                    'price' => 150.00,
                    'attribute_value_ids' => [$redValue->id, $smallValue->id]
                ],
                // 新增變體 D（不帶 id）
                [
                    'sku' => 'NEW-GREEN-M',
                    'price' => 200.00,
                    'attribute_value_ids' => [$greenValue->id, $mediumValue->id]
                ]
                // 注意：B 和 C 不在此陣列中，所以會被刪除
            ]
        ];
        
        // === 階段 4: 執行更新請求 ===
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/products/{$product->id}", $updateData);
        
        $response->assertStatus(200);
        
        // === 階段 5: 驗證結果 ===
        
        // 5.1 驗證 SPU 資訊已更新
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => '更新後的商品名稱',
            'description' => '更新後的描述',
            'category_id' => $category2->id
        ]);
        
        // 5.2 驗證變體 A 已更新
        $this->assertDatabaseHas('product_variants', [
            'id' => $variantA->id,
            'sku' => 'UPDATED-RED-S',
            'price' => 150.00
        ]);
        
        // 5.3 驗證新變體 D 已創建
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'NEW-GREEN-M',
            'price' => 200.00,
            'product_id' => $product->id
        ]);
        
        // 5.4 驗證變體 B 已刪除
        $this->assertDatabaseMissing('product_variants', [
            'id' => $variantB->id
        ]);
        
        // 5.5 驗證變體 C 已刪除
        $this->assertDatabaseMissing('product_variants', [
            'id' => $variantC->id
        ]);
        
        // 5.6 驗證最終產品只有 2 個變體（A 更新版 + D 新增版）
        $finalProduct = Product::find($product->id);
        $this->assertCount(2, $finalProduct->variants);
        
        // 5.7 驗證新變體 D 在所有門市都有庫存記錄
        $newVariant = ProductVariant::where('sku', 'NEW-GREEN-M')->first();
        $this->assertNotNull($newVariant);
        
        $inventoryCount = \App\Models\Inventory::where('product_variant_id', $newVariant->id)->count();
        $this->assertEquals(2, $inventoryCount); // 應該在 2 個門市都有庫存記錄
        
        // 5.8 驗證已刪除變體的庫存記錄也被清理
        $deletedInventoryCount = \App\Models\Inventory::whereIn('product_variant_id', [$variantB->id, $variantC->id])->count();
        $this->assertEquals(0, $deletedInventoryCount);
    }

    /** @test */
    public function admin_can_create_simple_product_with_store_simple_endpoint()
    {
        $category = Category::factory()->create();
        
        $productData = [
            'name' => '簡單商品',
            'sku' => 'SIMPLE-001',
            'price' => 150.00,
            'category_id' => $category->id,
            'description' => '這是一個簡單商品的描述',
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/simple', $productData);
            
        $response->assertStatus(201)
            ->assertJson(function (AssertableJson $json) use ($productData) {
                $json->has('data')
                    ->where('data.name', $productData['name'])
                    ->where('data.description', $productData['description'])
                    ->where('data.category_id', $productData['category_id'])
                    ->has('data.variants', 1) // 應該有一個變體
                    ->etc();
            });
            
        $this->assertDatabaseHas('products', [
            'name' => $productData['name'],
            'description' => $productData['description'],
            'category_id' => $productData['category_id'],
        ]);
        
        $this->assertDatabaseHas('product_variants', [
            'sku' => $productData['sku'],
            'price' => $productData['price'],
        ]);
    }
    
    /** @test */
    public function admin_can_create_simple_product_without_category()
    {
        $productData = [
            'name' => '無分類簡單商品',
            'sku' => 'SIMPLE-002',
            'price' => 75.50,
            'description' => '沒有分類的商品',
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/simple', $productData);
            
        $response->assertStatus(201);
        
        $this->assertDatabaseHas('products', [
            'name' => $productData['name'],
            'category_id' => null,
        ]);
    }
    
    /** @test */
    public function simple_product_creation_requires_valid_data()
    {
        // 測試缺少必填欄位
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/simple', []);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'sku', 'price']);
            
        // 測試 SKU 重複
        $existingProduct = Product::factory()->create();
        $existingVariant = $existingProduct->variants()->create([
            'sku' => 'EXISTING-SKU',
            'price' => 100.00,
        ]);
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/simple', [
                'name' => '測試商品',
                'sku' => 'EXISTING-SKU',
                'price' => 200.00,
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }
    
    /** @test */
    public function staff_cannot_create_simple_product()
    {
        $productData = [
            'name' => '員工嘗試創建的簡單商品',
            'sku' => 'STAFF-SIMPLE-001',
            'price' => 100.00,
        ];
        
        $response = $this->actingAsUser()
            ->postJson('/api/products/simple', $productData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseMissing('products', [
            'name' => $productData['name'],
        ]);
    }
    
    /** @test */
    public function store_simple_handles_service_exceptions()
    {
        // 使用一個不存在的分類ID來觸發錯誤
        $productData = [
            'name' => '測試商品',
            'sku' => 'ERROR-TEST-001',
            'price' => 100.00,
            'category_id' => 9999, // 不存在的分類ID
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/simple', $productData);
            
        $response->assertStatus(422);
    }
    
    /** @test */
    public function admin_can_upload_product_image()
    {
        $product = Product::factory()->create();
        
        // 創建一個符合尺寸要求的測試圖片（300x300 像素）
        $image = imagecreate(300, 300);
        $backgroundColor = imagecolorallocate($image, 255, 255, 255);
        $textColor = imagecolorallocate($image, 0, 0, 0);
        imagestring($image, 5, 50, 50, 'Test Image', $textColor);
        
        $tempImagePath = tempnam(sys_get_temp_dir(), 'test_image') . '.png';
        imagepng($image, $tempImagePath);
        imagedestroy($image);
        
        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempImagePath,
            'test-image.png',
            'image/png',
            null,
            true
        );
        
        $response = $this->actingAsAdmin()
            ->postJson("/api/products/{$product->id}/upload-image", [
                'image' => $uploadedFile
            ]);
            
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => '商品圖片上傳成功',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'media_id',
                    'file_name',
                    'file_size',
                    'mime_type',
                    'image_urls',
                    'conversions_generated'
                ]
            ]);
            
        // 清理臨時檔案
        @unlink($tempImagePath);
    }
    
    /** @test */
    public function staff_cannot_upload_product_image()
    {
        $product = Product::factory()->create();
        
        // 創建一個符合尺寸要求的測試圖片（300x300 像素）
        $image = imagecreate(300, 300);
        $backgroundColor = imagecolorallocate($image, 255, 255, 255);
        $textColor = imagecolorallocate($image, 0, 0, 0);
        imagestring($image, 5, 50, 50, 'Test Image', $textColor);
        
        $tempImagePath = tempnam(sys_get_temp_dir(), 'test_image') . '.png';
        imagepng($image, $tempImagePath);
        imagedestroy($image);
        
        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempImagePath,
            'test-image.png',
            'image/png',
            null,
            true
        );
        
        $response = $this->actingAsUser()
            ->postJson("/api/products/{$product->id}/upload-image", [
                'image' => $uploadedFile
            ]);
            
        $response->assertStatus(403);
        
        @unlink($tempImagePath);
    }
    
    /** @test */
    public function upload_image_validates_file_requirements()
    {
        $product = Product::factory()->create();
        
        // 測試無檔案
        $response = $this->actingAsAdmin()
            ->postJson("/api/products/{$product->id}/upload-image", []);
            
        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => '圖片上傳驗證失敗',
            ]);
            
        // 測試非圖片檔案
        $textContent = 'This is not an image';
        $tempTextPath = tempnam(sys_get_temp_dir(), 'test_text') . '.txt';
        file_put_contents($tempTextPath, $textContent);
        
        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempTextPath,
            'test-file.txt',
            'text/plain',
            null,
            true
        );
        
        $response = $this->actingAsAdmin()
            ->postJson("/api/products/{$product->id}/upload-image", [
                'image' => $uploadedFile
            ]);
            
        $response->assertStatus(422);
        
        @unlink($tempTextPath);
    }
    
    /** @test */
    public function admin_can_sort_products_by_name()
    {
        Product::factory()->create(['name' => 'Z 產品']);
        Product::factory()->create(['name' => 'A 產品']);
        Product::factory()->create(['name' => 'M 產品']);
        
        // 升序排序
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?sort=name');
            
        $response->assertStatus(200);
        
        $products = $response->json('data');
        $this->assertEquals('A 產品', $products[0]['name']);
        $this->assertEquals('M 產品', $products[1]['name']);
        $this->assertEquals('Z 產品', $products[2]['name']);
        
        // 降序排序
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?sort=-name');
            
        $response->assertStatus(200);
        
        $products = $response->json('data');
        $this->assertEquals('Z 產品', $products[0]['name']);
        $this->assertEquals('M 產品', $products[1]['name']);
        $this->assertEquals('A 產品', $products[2]['name']);
    }
    
    /** @test */
    public function admin_can_sort_products_by_created_at()
    {
        $oldProduct = Product::factory()->create(['created_at' => now()->subDays(2)]);
        $newProduct = Product::factory()->create(['created_at' => now()]);
        $middleProduct = Product::factory()->create(['created_at' => now()->subDay()]);
        
        // 升序排序（最舊的先）
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?sort=created_at');
            
        $response->assertStatus(200);
        
        $products = $response->json('data');
        $this->assertEquals($oldProduct->id, $products[0]['id']);
        $this->assertEquals($middleProduct->id, $products[1]['id']);
        $this->assertEquals($newProduct->id, $products[2]['id']);
    }
    
    /** @test */
    public function admin_can_search_products_with_search_filter()
    {
        Product::factory()->create(['name' => '紅色T恤']);
        Product::factory()->create(['name' => '藍色褲子']);
        Product::factory()->create(['name' => '綠色帽子']);
        
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?filter[search]=紅色');
            
        $response->assertStatus(200);
        
        $products = $response->json('data');
        $this->assertCount(1, $products);
        $this->assertEquals('紅色T恤', $products[0]['name']);
    }
    
    /** @test */
    public function admin_can_paginate_products()
    {
        Product::factory()->count(20)->create();
        
        // 測試預設分頁
        $response = $this->actingAsAdmin()
            ->getJson('/api/products');
            
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total'
                ],
                'links'
            ]);
            
        $this->assertEquals(15, $response->json('meta.per_page'));
        
        // 測試自訂每頁項目數
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?per_page=5');
            
        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.per_page'));
        $this->assertCount(5, $response->json('data'));
    }
    
    /** @test */
    public function store_method_handles_validation_errors()
    {
        $category = Category::factory()->create();
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        // 創建一個會導致驗證錯誤的數據結構
        $productData = [
            'name' => '測試商品',
            'description' => '測試描述',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id],
            'variants' => [
                [
                    'sku' => 'TEST001',
                    'price' => 100.00,
                    'attribute_value_ids' => [99999] // 不存在的屬性值ID
                ]
            ]
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/products', $productData);
            
        // 驗證會在控制器之前失敗，返回 422
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variants.0.attribute_value_ids.0']);
    }
    
    /** @test */
    public function update_method_handles_validation_errors()
    {
        $product = Product::factory()->create();
        $category = Category::factory()->create();
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        
        // 創建會導致驗證錯誤的更新數據
        $updateData = [
            'name' => '更新的商品',
            'description' => '更新的描述',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id],
            'variants' => [
                [
                    'sku' => 'INVALID-UPDATE',
                    'price' => 100.00,
                    'attribute_value_ids' => [99999] // 不存在的屬性值ID
                ]
            ]
        ];
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/products/{$product->id}", $updateData);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['variants.0.attribute_value_ids.0']);
    }
    
    /** @test */
    public function admin_can_filter_by_empty_search_parameters()
    {
        Product::factory()->count(3)->create();
        
        // 測試空的搜索參數不會影響結果
        $response = $this->actingAsAdmin()
            ->getJson('/api/products?product_name=&category_id=&store_id=');
            
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }
    
    /** @test */
    public function batch_delete_validates_request_data()
    {
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/batch-delete', []);
            
        $response->assertStatus(422);
        
        // 測試非陣列的 ids
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/batch-delete', [
                'ids' => 'not-an-array'
            ]);
            
        $response->assertStatus(422);
    }
    
    /** @test */
    public function batch_delete_validates_existing_ids()
    {
        // 測試刪除不存在的商品ID會返回驗證錯誤
        $response = $this->actingAsAdmin()
            ->postJson('/api/products/batch-delete', [
                'ids' => [99999, 99998, 99997]
            ]);
            
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ids.0', 'ids.1', 'ids.2']);
    }
    
    /** @test */
    public function show_method_loads_all_necessary_relationships()
    {
        $category = Category::factory()->create();
        $product = Product::factory()->create(['category_id' => $category->id]);
        
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create([
            'attribute_id' => $colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $product->attributes()->attach($colorAttribute->id);
        
        $variant = $product->variants()->create([
            'sku' => 'TEST-SKU-001',
            'price' => 100.00,
        ]);
        $variant->attributeValues()->attach($redValue->id);
        
        $store = \App\Models\Store::factory()->create();
        \App\Models\Inventory::create([
            'product_variant_id' => $variant->id,
            'store_id' => $store->id,
            'quantity' => 10,
            'low_stock_threshold' => 5,
        ]);
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/products/{$product->id}");
            
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'category_id',
                    'category' => [
                        'id',
                        'name'
                    ],
                    'variants' => [
                        '*' => [
                            'id',
                            'sku',
                            'price',
                            'inventory'
                        ]
                    ],
                    'has_image',
                    'image_urls',
                    'created_at',
                    'updated_at'
                ]
            ]);
    }

    /**
     * @test
     * @dataProvider storeProductValidationProvider
     */
    public function store_product_validation_fails_for_invalid_data($data, $expectedErrors)
    {
        $category = Category::factory()->create();
        $colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $redValue = AttributeValue::factory()->create(['attribute_id' => $colorAttribute->id, 'value' => '紅色']);

        // Base valid data
        $validData = [
            'name' => 'Valid Product Name',
            'description' => 'Valid product description.',
            'category_id' => $category->id,
            'attributes' => [$colorAttribute->id],
            'variants' => [
                [
                    'sku' => 'VALID-SKU-001',
                    'price' => 99.99,
                    'attribute_value_ids' => [$redValue->id],
                ],
            ],
        ];

        // Merge with invalid data
        $payload = $validData;
        foreach ($data as $key => $value) {
            if ($key === 'variants' && is_array($value) && isset($value[0]) && is_array($value[0])) {
                $payload['variants'][0] = array_merge($payload['variants'][0], $value[0]);
            } else {
                $payload[$key] = $value;
            }
        }

        $response = $this->actingAsAdmin()->postJson('/api/products', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors($expectedErrors);
    }

    public static function storeProductValidationProvider()
    {
        // To be lazy-loaded inside the provider
        $getNonExistentId = fn() => 99999;

        return [
            'name is missing' => [['name' => ''], ['name']],
            'name is not a string' => [['name' => 123], ['name']],
            'name is too long' => [['name' => str_repeat('a', 256)], ['name']],
            'description is not a string' => [['description' => 123], ['description']],
            'category_id is not an integer' => [['category_id' => 'abc'], ['category_id']],
            'category_id does not exist' => [['category_id' => $getNonExistentId()], ['category_id']],
            'attributes is missing' => [['attributes' => []], ['attributes']],
            'attributes is not an array' => [['attributes' => 'not-an-array'], ['attributes']],
            'attributes contains non-integer' => [['attributes' => ['abc']], ['attributes.0']],
            'attributes contains non-existent id' => [['attributes' => [$getNonExistentId()]], ['attributes.0']],
            'variants is missing' => [['variants' => []], ['variants']],
            'variants is not an array' => [['variants' => 'not-an-array'], ['variants']],
            'variant sku is missing' => [['variants' => [['sku' => '']]], ['variants.0.sku']],
            'variant sku is not a string' => [['variants' => [['sku' => 123]]], ['variants.0.sku']],
            'variant sku is too long' => [['variants' => [['sku' => str_repeat('a', 256)]]], ['variants.0.sku']],
            'variant price is missing' => [['variants' => [['price' => null]]], ['variants.0.price']],
            'variant price is not numeric' => [['variants' => [['price' => 'abc']]], ['variants.0.price']],
            'variant price is negative' => [['variants' => [['price' => -10]]], ['variants.0.price']],
            'variant attribute_value_ids is missing' => [['variants' => [['attribute_value_ids' => []]]], ['variants.0.attribute_value_ids']],
            'variant attribute_value_ids is not an array' => [['variants' => [['attribute_value_ids' => 'not-an-array']]], ['variants.0.attribute_value_ids']],
            'variant attribute_value_ids contains non-integer' => [['variants' => [['attribute_value_ids' => ['abc']]]], ['variants.0.attribute_value_ids.0']],
            'variant attribute_value_ids contains non-existent id' => [['variants' => [['attribute_value_ids' => [$getNonExistentId]]]], ['variants.0.attribute_value_ids.0']],
        ];
    }
} 