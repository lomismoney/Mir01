<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
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

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // 建立測試用戶和商品
        $this->adminUser = User::factory()->admin()->create();
        $this->viewerUser = User::factory()->viewer()->create();
        $this->product = Product::factory()->create();
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
            'name' => '測試商品',
            'sku' => 'TEST-001',
            'description' => '測試商品描述',
            'selling_price' => 100.00,
            'cost_price' => 50.00,
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
            'name' => '測試商品',
            'sku' => 'TEST-001',
            'description' => '測試商品描述',
            'selling_price' => 100.00,
            'cost_price' => 50.00,
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
            'sku' => $this->product->sku,
            'description' => '更新的描述',
            'selling_price' => 150.00,
            'cost_price' => 75.00,
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
            'sku' => $this->product->sku,
            'description' => '更新的描述',
            'selling_price' => 150.00,
            'cost_price' => 75.00,
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
                         ->deleteJson('/api/products', [
                             'product_ids' => $productIds
                         ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['deleted_count' => 3]);
    }

    /**
     * 測試檢視者無法批量刪除商品
     */
    public function test_viewer_cannot_batch_delete_products(): void
    {
        $products = Product::factory()->count(3)->create();
        $productIds = $products->pluck('id')->toArray();

        $response = $this->actingAs($this->viewerUser, 'sanctum')
                         ->deleteJson('/api/products', [
                             'product_ids' => $productIds
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
