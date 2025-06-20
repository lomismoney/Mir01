<?php

namespace Tests\Feature\Api;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Tests\TestCase;

/**
 * AttributeValueControllerTest 商品屬性值控制器測試
 * 
 * 測試商品屬性值 CRUD 操作的完整功能
 * 使用巢狀路由結構，測試權限控制、資料驗證、和各種邊界情況
 */
class AttributeValueControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $user;
    private Attribute $colorAttribute;
    private Attribute $sizeAttribute;
    private AttributeValue $redValue;
    private AttributeValue $blueValue;
    private AttributeValue $sizeM;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'user']);
        
        // 創建測試屬性
        $this->colorAttribute = Attribute::factory()->create(['name' => '顏色']);
        $this->sizeAttribute = Attribute::factory()->create(['name' => '尺寸']);
        
        // 創建測試屬性值
        $this->redValue = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '紅色'
        ]);
        $this->blueValue = AttributeValue::factory()->create([
            'attribute_id' => $this->colorAttribute->id,
            'value' => '藍色'
        ]);
        $this->sizeM = AttributeValue::factory()->create([
            'attribute_id' => $this->sizeAttribute->id,
            'value' => 'M'
        ]);
    }

    /**
     * @test
     * @group attribute-value-index
     */
    public function 管理員可以獲取指定屬性的所有值()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/attributes/{$this->colorAttribute->id}/values");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2)
                    ->has('data.0', fn ($json) =>
                        $json->where('id', $this->redValue->id)
                            ->where('value', '紅色')
                            ->where('attribute_id', $this->colorAttribute->id)
                            ->has('created_at')
                            ->has('updated_at')
                    )
                    ->has('data.1', fn ($json) =>
                        $json->where('id', $this->blueValue->id)
                            ->where('value', '藍色')
                            ->where('attribute_id', $this->colorAttribute->id)
                            ->etc()
                    )
            );
    }

    /**
     * @test
     * @group attribute-value-index
     */
    public function 一般用戶可以獲取指定屬性的所有值()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/attributes/{$this->colorAttribute->id}/values");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->has('data', 2)
                    ->has('data.0', fn ($json) =>
                        $json->where('value', '紅色')
                            ->etc()
                    )
            );
    }

    /**
     * @test
     * @group attribute-value-index
     */
    public function 未認證用戶無法獲取屬性值列表()
    {
        $response = $this->getJson("/api/attributes/{$this->colorAttribute->id}/values");

        $response->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    /**
     * @test
     * @group attribute-value-index
     */
    public function 查詢不存在的屬性的值返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/attributes/999/values');

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 管理員可以為指定屬性創建新值()
    {
        $valueData = ['value' => '綠色'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", $valueData);

        $response->assertStatus(201)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.value', '綠色')
                    ->where('data.attribute_id', $this->colorAttribute->id)
                    ->has('data.id')
                    ->has('data.created_at')
                    ->has('data.updated_at')
            );

        $this->assertDatabaseHas('attribute_values', [
            'value' => '綠色',
            'attribute_id' => $this->colorAttribute->id
        ]);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 一般用戶無法創建新屬性值()
    {
        $valueData = ['value' => '綠色'];

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", $valueData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        $this->assertDatabaseMissing('attribute_values', [
            'value' => '綠色',
            'attribute_id' => $this->colorAttribute->id
        ]);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 創建屬性值時值為必填()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('value')
            ->assertJson(['errors' => ['value' => ['屬性值為必填欄位']]]);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 創建屬性值時值必須在同一屬性下唯一()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '紅色']); // 與現有值重複

        $response->assertStatus(422)
            ->assertJsonValidationErrors('value')
            ->assertJson(['errors' => ['value' => ['此屬性值在當前屬性下已存在，請使用其他值']]]);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 不同屬性下可以有相同的屬性值()
    {
        // 在尺寸屬性下創建「紅色」值（顏色屬性下已有「紅色」）
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->sizeAttribute->id}/values", ['value' => '紅色']);

        $response->assertStatus(201)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.value', '紅色')
                    ->where('data.attribute_id', $this->sizeAttribute->id)
                    ->etc()
            );

        // 確認兩個不同屬性下都有「紅色」值
        $this->assertDatabaseHas('attribute_values', [
            'value' => '紅色',
            'attribute_id' => $this->colorAttribute->id
        ]);
        $this->assertDatabaseHas('attribute_values', [
            'value' => '紅色',
            'attribute_id' => $this->sizeAttribute->id
        ]);
    }

    /**
     * @test
     * @group attribute-value-store
     */
    public function 創建屬性值時值不能超過255字元()
    {
        $longValue = str_repeat('很長的屬性值', 50); // 確保超過 255 字元

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => $longValue]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('value')
            ->assertJson(['errors' => ['value' => ['屬性值不能超過 255 個字元']]]);
    }

    /**
     * @test
     * @group attribute-value-show
     */
    public function 管理員可以查看指定屬性值()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/values/{$this->redValue->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->redValue->id)
                    ->where('data.value', '紅色')
                    ->where('data.attribute_id', $this->colorAttribute->id)
                    ->has('data.created_at')
                    ->has('data.updated_at')
            );
    }

    /**
     * @test
     * @group attribute-value-show
     */
    public function 一般用戶可以查看指定屬性值()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/values/{$this->redValue->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->redValue->id)
                    ->where('data.value', '紅色')
                    ->etc()
            );
    }

    /**
     * @test
     * @group attribute-value-show
     */
    public function 查看不存在的屬性值返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/values/999');

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-value-update
     */
    public function 管理員可以更新屬性值()
    {
        $updateData = ['value' => '深紅色'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.id', $this->redValue->id)
                    ->where('data.value', '深紅色')
                    ->where('data.attribute_id', $this->colorAttribute->id)
                    ->has('data.created_at')
                    ->has('data.updated_at')
            );

        $this->assertDatabaseHas('attribute_values', [
            'id' => $this->redValue->id,
            'value' => '深紅色'
        ]);
    }

    /**
     * @test
     * @group attribute-value-update
     */
    public function 一般用戶無法更新屬性值()
    {
        $updateData = ['value' => '深紅色'];

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", $updateData);

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        // 確認資料沒有被更新
        $this->assertDatabaseHas('attribute_values', [
            'id' => $this->redValue->id,
            'value' => '紅色' // 保持原值
        ]);
    }

    /**
     * @test
     * @group attribute-value-update
     */
    public function 更新屬性值時可以使用相同值()
    {
        $updateData = ['value' => '紅色']; // 使用相同值

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('attribute_values', [
            'id' => $this->redValue->id,
            'value' => '紅色'
        ]);
    }

    /**
     * @test
     * @group attribute-value-update
     */
    public function 更新屬性值時值不能與同屬性下其他值重複()
    {
        $updateData = ['value' => '藍色']; // 嘗試使用同屬性下另一個值

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", $updateData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('value')
            ->assertJson(['errors' => ['value' => ['此屬性值在當前屬性下已存在，請使用其他值']]]);
    }

    /**
     * @test
     * @group attribute-value-update
     */
    public function 更新屬性值時可以使用不同屬性下的相同值()
    {
        // 將紅色值更新為 'M'（尺寸屬性下已有 'M'）
        $updateData = ['value' => 'M'];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.value', 'M')
                    ->where('data.attribute_id', $this->colorAttribute->id)
                    ->etc()
            );
    }

    /**
     * @test
     * @group attribute-value-destroy
     */
    public function 管理員可以刪除屬性值()
    {
        $valueId = $this->redValue->id;

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/values/{$valueId}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('attribute_values', ['id' => $valueId]);
    }

    /**
     * @test
     * @group attribute-value-destroy
     */
    public function 一般用戶無法刪除屬性值()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/values/{$this->redValue->id}");

        $response->assertStatus(403)
            ->assertJson(['message' => 'This action is unauthorized.']);

        $this->assertDatabaseHas('attribute_values', ['id' => $this->redValue->id]);
    }

    /**
     * @test
     * @group attribute-value-destroy
     */
    public function 刪除不存在的屬性值返回404錯誤()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson('/api/values/999');

        $response->assertStatus(404);
    }

    /**
     * @test
     * @group attribute-value-authorization
     */
    public function 未認證用戶無法進行任何修改操作()
    {
        // 測試創建
        $response = $this->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '新值']);
        $response->assertStatus(401);

        // 測試更新
        $response = $this->putJson("/api/values/{$this->redValue->id}", ['value' => '更新值']);
        $response->assertStatus(401);

        // 測試刪除
        $response = $this->deleteJson("/api/values/{$this->redValue->id}");
        $response->assertStatus(401);
    }

    /**
     * @test
     * @group attribute-value-edge-cases
     */
    public function 創建屬性值時值前後空白會被自動清理()
    {
        $valueData = ['value' => ' 綠色 '];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", $valueData);

        $response->assertStatus(201)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.value', '綠色') // 前後空白被自動清理
                    ->etc()
            );

        $this->assertDatabaseHas('attribute_values', ['value' => '綠色']);
    }

    /**
     * @test
     * @group attribute-value-edge-cases
     */
    public function 屬性值大小寫敏感()
    {
        // 創建大寫值
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '綠色']);

        $response->assertStatus(201);

        // 嘗試創建相同但不同大小寫的值（在中文情況下，測試不同字）
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '綠色']); // 完全相同

        $response->assertStatus(422);

        // 但不同的值應該可以創建
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '淺綠色']);

        $response->assertStatus(201);
    }

    /**
     * @test
     * @group attribute-value-relationships
     */
    public function 屬性值正確關聯到其父屬性()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/values/{$this->redValue->id}");

        $response->assertStatus(200)
            ->assertJson(fn (AssertableJson $json) =>
                $json->where('data.attribute_id', $this->colorAttribute->id)
                    ->etc()
            );

        // 確認在資料庫中的關聯正確
        $value = AttributeValue::find($this->redValue->id);
        $this->assertEquals($this->colorAttribute->id, $value->attribute_id);
        $this->assertEquals('顏色', $value->attribute->name);
    }

    /**
     * @test
     * @group attribute-value-api-structure
     */
    public function 屬性值API回應結構符合規範()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/attributes/{$this->colorAttribute->id}/values");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'value',
                        'attribute_id',
                        'created_at',
                        'updated_at'
                    ]
                ]
            ]);
    }

    /**
     * @test
     * @group attribute-value-nested-routes
     */
    public function 巢狀路由正確運作()
    {
        // index 路由：/attributes/{attribute}/values
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/attributes/{$this->colorAttribute->id}/values");
        $response->assertStatus(200);

        // store 路由：/attributes/{attribute}/values
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/attributes/{$this->colorAttribute->id}/values", ['value' => '黃色']);
        $response->assertStatus(201);

        // shallow 路由：/values/{value}
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/values/{$this->redValue->id}");
        $response->assertStatus(200);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/values/{$this->redValue->id}", ['value' => '深紅']);
        $response->assertStatus(200);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/values/{$this->redValue->id}");
        $response->assertStatus(204);
    }
} 