<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;

/**
 * 商品圖片上傳功能測試
 * 
 * 測試商品圖片上傳的完整流程，包括：
 * - 權限驗證
 * - 檔案驗證
 * - 圖片轉換
 * - API 響應格式
 * - 錯誤處理
 */
class ProductImageUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // 創建測試用的管理員用戶
        $this->adminUser = User::factory()->create(['role' => 'admin']);
        
        // 創建測試用的商品
        $category = Category::factory()->create();
        $this->product = Product::factory()->create(['category_id' => $category->id]);

        // 設定假的檔案系統
        Storage::fake('public');
    }

    /**
     * 測試成功上傳商品圖片
     */
    public function test_can_upload_product_image_successfully(): void
    {
        // 創建測試圖片檔案
        $imageFile = UploadedFile::fake()->image('product.jpg', 800, 600)->size(1024);

        // 發送上傳請求
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $imageFile,
            ]);

        // 驗證響應
        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'media_id',
                    'file_name',
                    'file_size',
                    'mime_type',
                    'image_urls' => [
                        'original',
                        'thumb',
                        'medium',
                        'large',
                    ],
                    'conversions_generated' => [
                        'thumb',
                        'medium',
                        'large',
                    ],
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => '商品圖片上傳成功',
            ]);

        // 驗證商品現在有圖片
        $this->assertTrue($this->product->fresh()->hasMedia('images'));
        
        // 驗證媒體記錄被創建
        $this->assertDatabaseHas('media', [
            'model_type' => Product::class,
            'model_id' => $this->product->id,
            'collection_name' => 'images',
        ]);
    }

    /**
     * 測試上傳圖片時會替換舊圖片（singleFile 行為）
     */
    public function test_uploading_new_image_replaces_old_image(): void
    {
        // 先上傳第一張圖片
        $firstImage = UploadedFile::fake()->image('first.jpg', 600, 600)->size(512);
        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $firstImage,
            ]);

        $firstMediaId = $this->product->fresh()->getFirstMedia('images')->id;

        // 上傳第二張圖片
        $secondImage = UploadedFile::fake()->image('second.jpg', 800, 800)->size(1024);
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $secondImage,
            ]);

        $response->assertStatus(201);

        // 驗證只有一張圖片
        $this->assertEquals(1, $this->product->fresh()->getMedia('images')->count());
        
        // 驗證新的媒體 ID 與舊的不同
        $newMediaId = $this->product->fresh()->getFirstMedia('images')->id;
        $this->assertNotEquals($firstMediaId, $newMediaId);
    }

    /**
     * 測試未認證用戶無法上傳圖片
     */
    public function test_unauthenticated_user_cannot_upload_image(): void
    {
        $imageFile = UploadedFile::fake()->image('product.jpg');

        $response = $this->postJson("/api/products/{$this->product->id}/upload-image", [
            'image' => $imageFile,
        ]);

        $response->assertStatus(401);
    }

    /**
     * 測試檔案驗證：必須提供圖片檔案
     */
    public function test_image_file_is_required(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image'])
            ->assertJsonFragment([
                'image' => ['請選擇要上傳的圖片檔案。']
            ]);
    }

    /**
     * 測試檔案驗證：只接受圖片格式
     */
    public function test_only_accepts_image_files(): void
    {
        $textFile = UploadedFile::fake()->create('document.txt', 100);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $textFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * 測試檔案驗證：檔案大小限制
     */
    public function test_file_size_validation(): void
    {
        // 創建超過 5MB 的檔案
        $largeFile = UploadedFile::fake()->image('large.jpg')->size(6000); // 6MB

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $largeFile,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * 測試檔案驗證：圖片尺寸限制
     */
    public function test_image_dimensions_validation(): void
    {
        // 創建尺寸過小的圖片
        $smallImage = UploadedFile::fake()->image('small.jpg', 100, 100);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $smallImage,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    /**
     * 測試支援的圖片格式
     */
    public function test_supports_various_image_formats(): void
    {
        $formats = ['jpg', 'png', 'gif', 'webp'];

        foreach ($formats as $format) {
            $imageFile = UploadedFile::fake()->image("test.{$format}", 400, 400);

            $response = $this->actingAs($this->adminUser, 'sanctum')
                ->postJson("/api/products/{$this->product->id}/upload-image", [
                    'image' => $imageFile,
                ]);

            $response->assertStatus(201, "Failed to upload {$format} format");
        }
    }

    /**
     * 測試商品不存在時的錯誤處理
     */
    public function test_returns_404_for_non_existent_product(): void
    {
        $imageFile = UploadedFile::fake()->image('product.jpg');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/99999/upload-image", [
                'image' => $imageFile,
            ]);

        $response->assertStatus(404);
    }

    /**
     * 測試 ProductResource 包含圖片 URL
     */
    public function test_product_resource_includes_image_urls(): void
    {
        // 上傳圖片
        $imageFile = UploadedFile::fake()->image('product.jpg', 600, 600);
        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/products/{$this->product->id}/upload-image", [
                'image' => $imageFile,
            ]);

        // 獲取商品詳情
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/products/{$this->product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'name',
                'image_urls' => [
                    'original',
                    'thumb',
                    'medium',
                    'large',
                ],
                'has_image',
            ])
            ->assertJson([
                'has_image' => true,
            ]);

        // 驗證 URL 不為空
        $responseData = $response->json();
        $this->assertNotEmpty($responseData['image_urls']['original']);
        $this->assertNotEmpty($responseData['image_urls']['thumb']);
        $this->assertNotEmpty($responseData['image_urls']['medium']);
        $this->assertNotEmpty($responseData['image_urls']['large']);
    }
} 