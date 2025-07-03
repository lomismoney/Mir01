<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Inventory;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private Attribute $colorAttribute;
    private Attribute $sizeAttribute;
    private AttributeValue $redColor;
    private AttributeValue $blueColor;
    private AttributeValue $sizeS;
    private AttributeValue $sizeM;
    private Category $category;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試用戶
        $this->adminUser = User::factory()->admin()->create();

        // 建立測試分類
        $this->category = Category::factory()->create([
            'name' => '測試分類'
        ]);

        // 建立測試屬性
        $this->colorAttribute = Attribute::factory()->create([
            'name' => '顏色'
        ]);
        
        $this->sizeAttribute = Attribute::factory()->create([
            'name' => '尺寸'
        ]);

        // 建立測試屬性值
        $this->redColor = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $this->blueColor = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '藍色'
        ]);
        
        $this->sizeS = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'S'
        ]);
        
        $this->sizeM = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'M'
        ]);
    }

    /**
     * 測試獲取商品列表
     */
    public function test_get_products_list(): void
    {
        // 建立多個測試商品
        Product::factory()->count(5)->create();

        // 發送請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson('/api/products');

        // 驗證響應
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'meta',
                     'links'
                 ]);
        
        // 驗證返回5筆商品資料
        $this->assertCount(5, $response->json('data'));
    }

    /**
     * 測試依名稱搜尋商品功能
     */
    public function test_search_products_by_name(): void
    {
        // 清空資料庫中的產品
        Product::query()->delete();
        
        // 建立測試資料
        $uniqueNamePart = 'UNIQUESTRING' . uniqid();
        $product = Product::factory()->create([
            'name' => "測試商品 {$uniqueNamePart}",
            'description' => '這是一個測試商品描述'
        ]);
        
        // 建立其他隨機商品作為對照
        Product::factory()->count(4)->create();

        // 發送搜尋請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson("/api/products?filter[search]={$uniqueNamePart}");

        // 驗證響應狀態
        $response->assertStatus(200);
        
        // 獲取所有返回的產品資料
        $products = $response->json('data');
        
        // 驗證是否包含了剛才創建的具有特殊名稱的產品
        $found = false;
        foreach ($products as $item) {
            if ($item['id'] == $product->id) {
                $found = true;
                break;
            }
        }
        
        $this->assertTrue($found, '無法在搜尋結果中找到指定商品');
    }

    /**
     * 測試建立新商品 (SPU/SKU)
     */
    public function test_create_new_product(): void
    {
        // 準備請求資料
        $productData = [
            'name' => '測試T-shirt',
            'description' => '測試用T-shirt商品描述',
            'category_id' => $this->category->id,
            'attributes' => [
                $this->colorAttribute->id,
                $this->sizeAttribute->id
            ],
            'variants' => [
                [
                    'sku' => 'TST-RED-S',
                    'price' => 99.99,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeS->id
                    ]
                ],
                [
                    'sku' => 'TST-RED-M',
                    'price' => 99.99,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeM->id
                    ]
                ],
                [
                    'sku' => 'TST-BLUE-S',
                    'price' => 99.99,
                    'attribute_value_ids' => [
                        $this->blueColor->id,
                        $this->sizeS->id
                    ]
                ]
            ]
        ];

        // 發送請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->postJson('/api/products', $productData);

        // 驗證響應
        $response->assertStatus(201);
        
        // 驗證資料庫中已創建商品
        $this->assertDatabaseHas('products', [
            'name' => '測試T-shirt',
            'description' => '測試用T-shirt商品描述',
            'category_id' => $this->category->id
        ]);
        
        // 驗證資料庫中已創建變體
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'TST-RED-S'
        ]);
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'TST-RED-M'
        ]);
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'TST-BLUE-S'
        ]);

        // 驗證變體數量
        $product = Product::where('name', '測試T-shirt')->first();
        $this->assertEquals(3, $product->variants()->count());
    }

    /**
     * 測試查看單一商品詳情
     */
    public function test_get_single_product(): void
    {
        // 建立測試商品
        $product = Product::factory()->create([
            'name' => '測試查詢商品',
            'description' => '測試商品描述'
        ]);

        // 發送請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson("/api/products/{$product->id}");

        // 驗證響應
        $response->assertStatus(200)
                 ->assertJsonFragment([
                     'id' => $product->id,
                     'name' => $product->name,
                     'description' => $product->description
                 ]);
    }

    /**
     * 測試批量刪除商品
     */
    public function test_batch_delete_products(): void
    {
        // 建立測試商品
        $products = Product::factory()->count(3)->create();
        $productIds = $products->pluck('id')->toArray();

        // 發送請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->postJson('/api/products/batch-delete', [
                             'ids' => $productIds
                         ]);

        // 驗證響應 - 根據控制器返回的狀態碼
        $response->assertStatus(204);

        // 驗證資料庫中已刪除商品
        foreach ($productIds as $id) {
            $this->assertDatabaseMissing('products', ['id' => $id]);
        }
    }
} 