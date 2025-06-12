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
        
        // 為變體創建庫存記錄
        $variant->inventory()->create([
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
} 