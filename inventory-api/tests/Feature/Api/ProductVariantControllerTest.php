<?php

namespace Tests\Feature\Api;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * ProductVariantControllerTest 商品變體控制器測試
 * 
 * 測試商品變體查詢功能的完整性
 * 包含篩選、搜尋、分頁和 API 結構驗證
 */
class ProductVariantControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private Category $category;
    private Product $product1;
    private Product $product2;
    private ProductVariant $variant1;
    private ProductVariant $variant2;
    private ProductVariant $variant3;
    private Attribute $colorAttribute;
    private Attribute $sizeAttribute;
    private AttributeValue $redValue;
    private AttributeValue $blueValue;
    private AttributeValue $sizeMValue;
    private AttributeValue $sizeLValue;
    private Store $store1;
    private Store $store2;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->user = User::factory()->create();
        $this->user->assignRole('viewer');
        
        // 創建測試分類
        $this->category = Category::factory()->create(['name' => 'T-shirt']);
        
        // 創建測試商品
        $this->product1 = Product::factory()->create([
            'name' => '經典棉質T-shirt',
            'category_id' => $this->category->id
        ]);
        $this->product2 = Product::factory()->create([
            'name' => '休閒長袖衫',
            'category_id' => $this->category->id
        ]);
        
        // 創建屬性和屬性值
        $this->colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $this->sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        $this->redValue = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '紅色'
        ]);
        $this->blueValue = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '藍色'
        ]);
        $this->sizeMValue = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'M'
        ]);
        $this->sizeLValue = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'L'
        ]);
        
        // 創建商品變體（使用明確的時間戳確保順序，移除 sleep）
        $baseTime = now();
        
        $this->variant1 = ProductVariant::factory()->create([
            'product_id' => $this->product1->id,
            'sku' => 'TSHIRT-RED-M',
            'price' => 29900, // 299.00 元 = 29900 分
            'cost_price' => 15000, // 150.00 元 = 15000 分
            'average_cost' => 16550, // 165.50 元 = 16550 分
            'created_at' => $baseTime,
        ]);
        
        $this->variant2 = ProductVariant::factory()->create([
            'product_id' => $this->product1->id,
            'sku' => 'TSHIRT-BLUE-L',
            'price' => 29900, // 299.00 元 = 29900 分
            'cost_price' => 15000, // 150.00 元 = 15000 分
            'average_cost' => 16550, // 165.50 元 = 16550 分
            'created_at' => $baseTime->addMinute(),
        ]);
        
        $this->variant3 = ProductVariant::factory()->create([
            'product_id' => $this->product2->id,
            'sku' => 'LONGSLEEVE-RED-M',
            'price' => 39900, // 399.00 元 = 39900 分
            'cost_price' => 20000, // 200.00 元 = 20000 分
            'average_cost' => 22000, // 220.00 元 = 22000 分
            'created_at' => $baseTime->addMinutes(2),
        ]);
        
        // 建立變體與屬性值的關聯
        $this->variant1->attributeValues()->attach([$this->redValue->id, $this->sizeMValue->id]);
        $this->variant2->attributeValues()->attach([$this->blueValue->id, $this->sizeLValue->id]);
        $this->variant3->attributeValues()->attach([$this->redValue->id, $this->sizeMValue->id]);
        
        // 創建門市
        $this->store1 = Store::factory()->create(['name' => '主門市']);
        $this->store2 = Store::factory()->create(['name' => '分店']);
        
        // 更新庫存記錄（使用 updateOrCreate 避免重複創建）
        Inventory::updateOrCreate(
            [
                'product_variant_id' => $this->variant1->id,
                'store_id' => $this->store1->id,
            ],
            [
                'quantity' => 50,
                'low_stock_threshold' => 10
            ]
        );
        Inventory::updateOrCreate(
            [
                'product_variant_id' => $this->variant2->id,
                'store_id' => $this->store1->id,
            ],
            [
                'quantity' => 30,
                'low_stock_threshold' => 10
            ]
        );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 管理員可以獲取所有商品變體列表()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 3)
                    ->has('meta') // 分頁資訊
                    ->has('links') // 分頁連結
                    ->has('data.0', fn ($json) =>
                        $json->where('sku', $this->variant3->sku) // 按建立時間降序排列，最新的在前
                            ->where('price', 399)
                            ->where('product_id', $this->product2->id)
                            ->has('created_at')
                            ->has('updated_at')
                            ->has('product')
                            ->has('attribute_values')
                            ->has('inventory')
                            ->etc()
                    )
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 一般用戶可以獲取所有商品變體列表()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 3)
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 未認證用戶無法獲取商品變體列表()
    {
        $response = $this->getJson('/api/products/variants');

        $response->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 可以按商品ID篩選變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/products/variants?filter[product_id]={$this->product1->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2) // product1 有兩個變體
                    ->has('meta')
                    ->has('links')
                    ->has('data.0', fn ($json) =>
                        $json->where('product_id', $this->product1->id)
                            ->etc()
                    )
                    ->has('data.1', fn ($json) =>
                        $json->where('product_id', $this->product1->id)
                            ->etc()
                    )
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 可以按SKU篩選變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/products/variants?filter[sku]={$this->variant1->sku}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 1)
                    ->has('meta')
                    ->has('links')
                    ->has('data.0', fn ($json) =>
                        $json->where('sku', $this->variant1->sku)
                            ->etc()
                    )
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 可以按商品名稱搜尋變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?filter[product_name]=T-shirt');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2) // 經典棉質T-shirt 有兩個變體
                    ->has('meta')
                    ->has('links')
                    ->has('data.0', fn ($json) =>
                        $json->whereNot('product_id', $this->product2->id) // 確保不是長袖衫
                            ->etc()
                    )
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 可以使用部分商品名稱搜尋變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?filter[product_name]=長袖');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 1) // 休閒長袖衫 有一個變體
                    ->has('meta')
                    ->has('links')
                    ->has('data.0', fn ($json) =>
                        $json->where('product_id', $this->product2->id)
                            ->etc()
                    )
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 可以設置每頁顯示數量()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?per_page=2');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2)
                    ->has('meta', fn ($json) =>
                        $json->where('per_page', 2)
                            ->where('total', 3)
                            ->has('current_page')
                            ->has('last_page')
                            ->etc()
                    )
                    ->has('links')
            );
    }

    #[Test]
    #[Group('attribute-value-index')]
    public function 預設使用分頁每頁15筆()
    {
        // 創建更多變體以測試預設分頁
        ProductVariant::factory()->count(20)->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 15) // 預設每頁 15 筆
                    ->has('meta', fn ($json) =>
                        $json->where('per_page', 15)
                            ->has('total')
                            ->etc()
                    )
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-show')]
    public function 管理員可以查看指定商品變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/products/variants/{$this->variant1->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $this->variant1->id,
                    'sku' => 'TSHIRT-RED-M',
                    'price' => '299.00',
                    'cost_price' => '150.00',
                    'average_cost' => '165.50',
                    'product_id' => $this->product1->id,
                    'product' => [
                        'id' => $this->product1->id,
                        'name' => '經典棉質T-shirt',
                        'category_id' => $this->category->id
                    ]
                ]
            ]);
    }

    #[Test]
    #[Group('product-variant-show')]
    public function 一般用戶可以查看指定商品變體()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/products/variants/{$this->variant1->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $this->variant1->id,
                    'sku' => 'TSHIRT-RED-M'
                ]
            ]);
    }

    #[Test]
    #[Group('product-variant-show')]
    public function 查看不存在的商品變體返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants/999');

        $response->assertStatus(404);
    }

    #[Test]
    #[Group('product-variant-relationships')]
    public function 商品變體包含正確的關聯資料()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/products/variants/{$this->variant1->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'sku',
                    'price',
                    'cost_price',
                    'average_cost',
                    'product_id',
                    'created_at',
                    'updated_at',
                    'product' => [
                        'id',
                        'name',
                        'description',
                        'category_id'
                    ],
                    'attribute_values' => [ // 注意是蛇形命名法
                        '*' => [
                            'id',
                            'value',
                            'attribute_id',
                            'attribute' => [
                                'id',
                                'name'
                            ]
                        ]
                    ],
                    'inventory' => [
                        '*' => [
                            'id',
                            'product_variant_id',
                            'store_id',
                            'quantity',
                            'low_stock_threshold',
                            'store' => [
                                'id',
                                'name',
                                'address'
                            ]
                        ]
                    ]
                ]
            ]);
    }

    #[Test]
    #[Group('product-variant-calculated-fields')]
    public function 商品變體包含計算欄位()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data.0', fn ($json) =>
                    $json->has('profit_margin') // 利潤率
                        ->has('profit_amount') // 利潤金額
                        ->etc()
                )
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-api-structure')]
    public function 商品變體列表API回應結構符合規範()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'sku',
                        'price',
                        'cost_price',
                        'average_cost',
                        'total_purchased_quantity',
                        'profit_margin',
                        'profit_amount',
                        'product_id',
                        'created_at',
                        'updated_at',
                        'product',
                        'attribute_values',
                        'inventory'
                    ]
                ],
                'links' => [
                    'first',
                    'last',
                    'prev',
                    'next'
                ],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total'
                ]
            ]);
    }

    #[Test]
    #[Group('product-variant-edge-cases')]
    public function 空的篩選參數返回所有變體()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?filter[product_id]=&filter[sku]=');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 3) // 應該返回所有 3 個變體
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-edge-cases')]
    public function 不存在的商品ID篩選返回空結果()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?filter[product_id]=999');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 0) // 應該返回空陣列
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-edge-cases')]
    public function 不存在的SKU篩選返回空結果()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?filter[sku]=NONEXISTENT-SKU');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 0) // 應該返回空陣列
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-sorting')]
    public function 商品變體按建立時間降序排列()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 3)
                    ->where('data.0.id', $this->variant3->id) // 最新建立的在前
                    ->where('data.1.id', $this->variant2->id)
                    ->where('data.2.id', $this->variant1->id) // 最早建立的在後
                    ->has('meta')
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-pagination')]
    public function 分頁功能正常運作()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?page=1&per_page=2');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2)
                    ->has('meta', fn ($json) =>
                        $json->where('current_page', 1)
                            ->where('per_page', 2)
                            ->where('total', 3)
                            ->where('last_page', 2)
                            ->has('from')
                            ->has('to')
                            ->etc()
                    )
                    ->has('links', fn ($json) =>
                        $json->has('next') // 應該有下一頁連結
                            ->where('prev', null) // 第一頁沒有上一頁
                            ->has('first')
                            ->has('last')
                    )
            );

        // 測試第二頁
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/products/variants?page=2&per_page=2');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 1) // 第二頁只有一筆資料
                    ->has('meta', fn ($json) =>
                        $json->where('current_page', 2)
                            ->etc()
                    )
                    ->has('links')
            );
    }

    #[Test]
    #[Group('product-variant-authorization')]
    public function 未認證用戶無法進行任何查詢操作()
    {
        // 測試列表查詢
        $response = $this->getJson('/api/products/variants');
        $response->assertStatus(401);

        // 測試詳情查詢
        $response = $this->getJson("/api/products/variants/{$this->variant1->id}");
        $response->assertStatus(401);
    }
} 