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
        
        // 創建產品
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'name' => '原始商品名稱',
            'description' => '原始商品描述',
        ]);
        
        // 更新資料
        $updatedData = [
            'name' => '更新的商品名稱',
            'description' => '更新的商品描述',
            'category_id' => $newCategory->id,
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
        // 創建產品
        $product = Product::factory()->create([
            'name' => '原始商品名稱',
            'description' => '原始商品描述',
        ]);
        
        $updatedData = [
            'name' => '員工嘗試更新的商品名稱',
            'description' => '員工嘗試更新的商品描述',
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
} 