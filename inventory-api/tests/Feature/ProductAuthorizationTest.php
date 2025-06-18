<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 商品權限整合測試
 * 
 * 測試實際 HTTP 請求中的權限控制是否生效
 * 驗證 AuthServiceProvider 註冊的策略是否正常運作
 */
class ProductAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $viewerUser;
    private Product $product;
    private Attribute $colorAttribute;
    private Attribute $sizeAttribute;
    private AttributeValue $redColor;
    private AttributeValue $sizeM;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試用戶
        $this->adminUser = User::factory()->admin()->create();
        $this->viewerUser = User::factory()->viewer()->create();
        
        // 建立測試屬性
        $this->colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $this->sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        // 建立屬性值
        $this->redColor = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '紅色'
        ]);
        
        $this->sizeM = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'M'
        ]);
        
        // 建立測試商品
        $this->product = Product::factory()->create([
            'name' => '測試商品',
            'description' => '測試商品描述'
        ]);
        
        // 關聯商品與屬性
        $this->product->attributes()->attach([$this->colorAttribute->id, $this->sizeAttribute->id]);
        
        // 創建變體
        $variant = $this->product->variants()->create([
            'sku' => 'TEST-PRODUCT-RED-M',
            'price' => 100.00,
        ]);
        $variant->attributeValues()->attach([$this->redColor->id, $this->sizeM->id]);
    }

    /**
     * 測試管理員可以查看商品列表
     */
    public function test_admin_can_access_products_index(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson('/api/products');

        $response->assertStatus(200);
    }

    /**
     * 測試檢視者可以查看商品列表
     */
    public function test_viewer_can_access_products_index(): void
    {
        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->getJson('/api/products');

        $response->assertStatus(200);
    }

    /**
     * 測試管理員可以建立商品
     */
    public function test_admin_can_create_product(): void
    {
        $productData = [
            'name' => '授權測試商品',
            'description' => '測試商品描述',
            'category_id' => null,
            'attributes' => [
                $this->colorAttribute->id,
                $this->sizeAttribute->id
            ],
            'variants' => [
                [
                    'sku' => 'AUTH-TEST-001',
                    'price' => 100.00,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeM->id
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->postJson('/api/products', $productData);

        $response->assertStatus(201);
    }

    /**
     * 測試檢視者無法建立商品
     */
    public function test_viewer_cannot_create_product(): void
    {
        $productData = [
            'name' => '授權測試商品',
            'description' => '測試商品描述',
            'category_id' => null,
            'attributes' => [
                $this->colorAttribute->id,
                $this->sizeAttribute->id
            ],
            'variants' => [
                [
                    'sku' => 'AUTH-TEST-002',
                    'price' => 100.00,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeM->id
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->postJson('/api/products', $productData);

        $response->assertStatus(403); // 禁止存取
    }

    /**
     * 測試管理員可以更新商品
     */
    public function test_admin_can_update_product(): void
    {
        $updateData = [
            'name' => '更新的商品名稱',
            'description' => '更新的描述',
            'category_id' => null,
            'attributes' => [
                $this->colorAttribute->id,
                $this->sizeAttribute->id
            ],
            'variants' => [
                [
                    'id' => $this->product->variants->first()->id,
                    'sku' => 'UPDATED-SKU-001',
                    'price' => 150.00,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeM->id
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->putJson("/api/products/{$this->product->id}", $updateData);

        $response->assertStatus(200);
    }

    /**
     * 測試檢視者無法更新商品
     */
    public function test_viewer_cannot_update_product(): void
    {
        $updateData = [
            'name' => '更新的商品名稱',
            'description' => '更新的描述',
            'category_id' => null,
            'attributes' => [
                $this->colorAttribute->id,
                $this->sizeAttribute->id
            ],
            'variants' => [
                [
                    'id' => $this->product->variants->first()->id,
                    'sku' => 'VIEWER-UPDATED-SKU-001',
                    'price' => 150.00,
                    'attribute_value_ids' => [
                        $this->redColor->id,
                        $this->sizeM->id
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->putJson("/api/products/{$this->product->id}", $updateData);

        $response->assertStatus(403); // 禁止存取
    }

    /**
     * 測試管理員可以刪除商品
     */
    public function test_admin_can_delete_product(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->deleteJson("/api/products/{$this->product->id}");

        $response->assertStatus(204); // 無內容響應
    }

    /**
     * 測試檢視者無法刪除商品
     */
    public function test_viewer_cannot_delete_product(): void
    {
        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->deleteJson("/api/products/{$this->product->id}");

        $response->assertStatus(403); // 禁止存取
    }

    /**
     * 測試管理員可以批量刪除商品
     */
    public function test_admin_can_batch_delete_products(): void
    {
        $products = Product::factory()->count(3)->create();
        $productIds = $products->pluck('id')->toArray();

        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->postJson('/api/products/batch-delete', [
                             'ids' => $productIds
                         ]);

        $response->assertStatus(204);
    }

    /**
     * 測試檢視者無法批量刪除商品
     */
    public function test_viewer_cannot_batch_delete_products(): void
    {
        $products = Product::factory()->count(3)->create();
        $productIds = $products->pluck('id')->toArray();

        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->postJson('/api/products/batch-delete', [
                             'ids' => $productIds
                         ]);

        $response->assertStatus(403); // 禁止存取
    }

    /**
     * 測試未認證用戶無法存取任何商品 API
     */
    public function test_unauthenticated_user_cannot_access_products(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(401); // 未授權
    }
}
