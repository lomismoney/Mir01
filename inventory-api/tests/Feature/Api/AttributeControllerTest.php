<?php

namespace Tests\Feature\Api;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;

/**
 * AttributeControllerTest 商品屬性控制器測試
 * 
 * 測試商品屬性 CRUD 操作的完整功能
 * 包含權限控制、資料驗證、和各種邊界情況
 */
class AttributeControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private Attribute $attribute;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->user = User::factory()->create();
        $this->user->assignRole('viewer');
        
        // 創建測試屬性
        $this->attribute = Attribute::factory()->create(['name' => '顏色']);
        
        // 為屬性創建一些屬性值
        AttributeValue::factory()->create([
            'attribute_id' => $this->attribute->id,
            'value' => '紅色'
        ]);
        AttributeValue::factory()->create([
            'attribute_id' => $this->attribute->id,
            'value' => '藍色'
        ]);
    }

    /**
     * @test
     * @group attribute-index
     */
    public function 管理員可以獲取所有屬性列表()
    {
        // 創建額外的屬性
        $sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        AttributeValue::factory()->create([
            'attribute_id' => $sizeAttribute->id,
            'value' => 'M'
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attributes');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2)
                    ->has('data.0', fn ($json) =>
                        $json->where('id', $this->attribute->id)
                            ->where('name', '顏色')
                            ->has('created_at')
                            ->has('updated_at')
                            ->has('products_count')
                            ->has('values', 2)
                            ->has('values.0', fn ($json) =>
                                $json->where('value', '紅色')
                                    ->where('attribute_id', $this->attribute->id)
                                    ->etc()
                            )
                    )
                    ->has('data.1', fn ($json) =>
                        $json->where('id', $sizeAttribute->id)
                            ->where('name', '尺寸')
                            ->has('values', 1)
                            ->etc()
                    )
            );
    }

    /**
     * @test
     * @group attribute-index
     */
    public function 一般用戶可以獲取所有屬性列表()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/attributes');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 1)
                    ->has('data.0', fn ($json) =>
                        $json->where('id', $this->attribute->id)
                            ->where('name', '顏色')
                            ->has('values', 2)
                            ->etc()
                    )
            );
    }

    /**
     * @test
     * @group attribute-index
     */
    public function 未認證用戶無法獲取屬性列表()
    {
        $response = $this->getJson('/api/attributes');

        $response->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    /**
     * @test
     * @group attribute-store
     */
    public function 管理員可以創建新屬性()
    {
        $attributeData = ['name' => '材質'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', $attributeData);

        $response->assertStatus(201)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.name', '材質')
                    ->has('data.id')
                    ->has('data.created_at')
                    ->has('data.updated_at')
                    ->missing('data.values') // 新創建的屬性沒有載入 values
            );

        $this->assertDatabaseHas('attributes', ['name' => '材質']);
    }

    /**
     * @test
     * @group attribute-store
     */
    public function 一般用戶無法創建新屬性()
    {
        $attributeData = ['name' => '材質'];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/attributes', $attributeData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        $this->assertDatabaseMissing('attributes', ['name' => '材質']);
    }

    /**
     * @test
     * @group attribute-store
     */
    public function 創建屬性時名稱為必填()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name')
            ->assertJson(['errors' => ['name' => ['屬性名稱為必填欄位']]]);
    }

    /**
     * @test
     * @group attribute-store
     */
    public function 創建屬性時名稱必須唯一()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', ['name' => '顏色']); // 與現有屬性重複

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name')
            ->assertJson(['errors' => ['name' => ['此屬性名稱已存在，請使用其他名稱']]]);
    }

    /**
     * @test
     * @group attribute-store
     */
    public function 創建屬性時名稱不能超過255字元()
    {
        // 創建一個確實超過 255 字元的字串
        $longName = str_repeat('很長的屬性名稱', 50); // 50 * 7 = 350 字元

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', ['name' => $longName]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name')
            ->assertJson(['errors' => ['name' => ['屬性名稱不能超過 255 個字元']]]);
    }

    /**
     * @test
     * @group attribute-show
     */
    public function 管理員可以查看指定屬性()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/attributes/{$this->attribute->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->attribute->id)
                    ->where('data.name', '顏色')
                    ->has('data.created_at')
                    ->has('data.updated_at')
                    ->has('data.values', 2)
                    ->has('data.values.0', fn ($json) =>
                        $json->where('value', '紅色')
                            ->where('attribute_id', $this->attribute->id)
                            ->etc()
                    )
                    ->has('data.values.1', fn ($json) =>
                        $json->where('value', '藍色')
                            ->where('attribute_id', $this->attribute->id)
                            ->etc()
                    )
            );
    }

    /**
     * @test
     * @group attribute-show
     */
    public function 一般用戶可以查看指定屬性()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/attributes/{$this->attribute->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->attribute->id)
                    ->where('data.name', '顏色')
                    ->has('data.values', 2)
                    ->etc()
            );
    }

    /**
     * @test
     * @group attribute-show
     */
    public function 查看不存在的屬性返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attributes/999');

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-update
     */
    public function 管理員可以更新屬性()
    {
        $updateData = ['name' => '顏色分類'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/attributes/{$this->attribute->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->attribute->id)
                    ->where('data.name', '顏色分類')
                    ->has('data.created_at')
                    ->has('data.updated_at')
            );

        $this->assertDatabaseHas('attributes', [
            'id' => $this->attribute->id,
            'name' => '顏色分類'
        ]);
    }

    /**
     * @test
     * @group attribute-update
     */
    public function 一般用戶無法更新屬性()
    {
        $updateData = ['name' => '顏色分類'];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/attributes/{$this->attribute->id}", $updateData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        // 確認資料沒有被更新
        $this->assertDatabaseHas('attributes', [
            'id' => $this->attribute->id,
            'name' => '顏色' // 保持原名稱
        ]);
    }

    /**
     * @test
     * @group attribute-update
     */
    public function 更新屬性時可以使用相同名稱()
    {
        $updateData = ['name' => '顏色']; // 使用相同名稱

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/attributes/{$this->attribute->id}", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('attributes', [
            'id' => $this->attribute->id,
            'name' => '顏色'
        ]);
    }

    /**
     * @test
     * @group attribute-update
     */
    public function 更新屬性時名稱不能與其他屬性重複()
    {
        // 創建另一個屬性
        $anotherAttribute = Attribute::factory()->create(['name' => '尺寸']);

        $updateData = ['name' => '尺寸']; // 嘗試使用另一個屬性的名稱

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/attributes/{$this->attribute->id}", $updateData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('name')
            ->assertJson(['errors' => ['name' => ['此屬性名稱已存在，請使用其他名稱']]]);
    }

    /**
     * @test
     * @group attribute-update
     */
    public function 更新不存在的屬性返回404錯誤()
    {
        $updateData = ['name' => '新名稱'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/attributes/999', $updateData);

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-destroy
     */
    public function 管理員可以刪除屬性()
    {
        $attributeId = $this->attribute->id;

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/attributes/{$attributeId}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('attributes', ['id' => $attributeId]);
        
        // 確認關聯的屬性值也被刪除（透過外鍵約束）
        $this->assertDatabaseMissing('attribute_values', ['attribute_id' => $attributeId]);
    }

    /**
     * @test
     * @group attribute-destroy
     */
    public function 一般用戶無法刪除屬性()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/attributes/{$this->attribute->id}");

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        $this->assertDatabaseHas('attributes', ['id' => $this->attribute->id]);
    }

    /**
     * @test
     * @group attribute-destroy
     */
    public function 刪除不存在的屬性返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/attributes/999');

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-authorization
     */
    public function 未認證用戶無法進行任何修改操作()
    {
        // 測試創建
        $response = $this->postJson('/api/attributes', ['name' => '新屬性']);
        $response->assertStatus(401);

        // 測試更新
        $response = $this->putJson("/api/attributes/{$this->attribute->id}", ['name' => '更新名稱']);
        $response->assertStatus(401);

        // 測試刪除
        $response = $this->deleteJson("/api/attributes/{$this->attribute->id}");
        $response->assertStatus(401);
    }

    /**
     * @test
     * @group attribute-edge-cases
     */
    public function 創建屬性時名稱前後空白會被自動清理()
    {
        $attributeData = ['name' => ' 材質 '];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', $attributeData);

        $response->assertStatus(201)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.name', '材質') // 前後空白被自動清理
                    ->etc()
            );

        $this->assertDatabaseHas('attributes', ['name' => '材質']);
    }

    /**
     * @test
     * @group attribute-edge-cases
     */
    public function 屬性名稱大小寫敏感()
    {
        // 創建一個大寫的屬性
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', ['name' => '顏色']);

        // 嘗試創建相同但不同大小寫的屬性
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', ['name' => '顏色']); // 完全相同

        $response->assertStatus(422);

        // 但不同的字應該可以創建
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/attributes', ['name' => '顏色類別']);

        $response->assertStatus(201);
    }

    /**
     * @test
     * @group attribute-performance
     */
    public function 屬性列表包含正確的eager_loading資料()
    {
        // 這個測試確保我們正確使用了 with('values') 來避免 N+1 查詢
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attributes');

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data.0.values') // 確保 values 被包含在回應中
                    ->etc()
            );
    }

    /**
     * @test
     * @group attribute-api-structure
     */
    public function API回應結構符合規範()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attributes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'created_at',
                        'updated_at',
                        'values' => [
                            '*' => [
                                'id',
                                'value',
                                'attribute_id',
                                'created_at',
                                'updated_at'
                            ]
                        ]
                    ]
                ]
            ]);
    }
} 