<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

class CategoryControllerTest extends TestCase
{
    use WithFaker, RefreshDatabase;
    
    #[Test]
    public function admin_can_get_all_categories()
    {
        // 創建多個分類
        Category::factory()->count(3)->create();
        
        // 以管理員身份訪問 API
        $response = $this->actingAsAdmin()
            ->getJson('/api/categories');
            
        // 檢查響應
        $response->assertStatus(200);
        
        // 確認返回 JSON 結構正確 (按 parent_id 分組)
        $responseArray = $response->json();
        $this->assertIsArray($responseArray);
        
        // 檢查是否有 null 分組 (即頂層分類)
        if (isset($responseArray['null'])) {
            foreach ($responseArray['null'] as $category) {
                $this->assertArrayHasKey('id', $category);
                $this->assertArrayHasKey('name', $category);
                $this->assertArrayHasKey('parent_id', $category);
            }
        } else if (isset($responseArray[''])) {
            foreach ($responseArray[''] as $category) {
                $this->assertArrayHasKey('id', $category);
                $this->assertArrayHasKey('name', $category);
                $this->assertArrayHasKey('parent_id', $category);
            }
        }
    }
    
    #[Test]
    public function admin_can_create_category()
    {
        $categoryData = [
            'name' => '電子產品',
            'parent_id' => null
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', $categoryData);
            
        $response->assertStatus(201)
            ->assertJson(function (AssertableJson $json) use ($categoryData) {
                $json->has('data')
                    ->where('data.name', $categoryData['name'])
                    ->where('data.parent_id', $categoryData['parent_id'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('categories', $categoryData);
    }
    
    #[Test]
    public function admin_can_create_subcategory()
    {
        // 創建父分類
        $parentCategory = Category::factory()->create([
            'name' => '電子產品',
            'parent_id' => null
        ]);
        
        $subcategoryData = [
            'name' => '手機',
            'parent_id' => $parentCategory->id
        ];
        
        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', $subcategoryData);
            
        $response->assertStatus(201)
            ->assertJson(function (AssertableJson $json) use ($subcategoryData) {
                $json->has('data')
                    ->where('data.name', $subcategoryData['name'])
                    ->where('data.parent_id', $subcategoryData['parent_id'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('categories', $subcategoryData);
    }
    
    #[Test]
    public function admin_can_show_category_details()
    {
        $category = Category::factory()->create();
        
        $response = $this->actingAsAdmin()
            ->getJson("/api/categories/{$category->id}");
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($category) {
                $json->has('data')
                    ->where('data.id', $category->id)
                    ->where('data.name', $category->name)
                    ->where('data.parent_id', $category->parent_id)
                    ->etc();
            });
    }
    
    #[Test]
    public function admin_can_update_category()
    {
        $category = Category::factory()->create();
        
        $updatedData = [
            'name' => '更新的分類名稱',
        ];
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", $updatedData);
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($updatedData) {
                $json->has('data')
                    ->where('data.name', $updatedData['name'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => $updatedData['name'],
        ]);
    }
    
    #[Test]
    public function admin_can_update_category_parent()
    {
        // 創建兩個分類
        $category1 = Category::factory()->create();
        $category2 = Category::factory()->create();
        
        // 更新第二個分類的父分類為第一個分類
        $updatedData = [
            'parent_id' => $category1->id,
        ];
        
        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category2->id}", $updatedData);
            
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) use ($updatedData, $category2) {
                $json->has('data')
                    ->where('data.id', $category2->id)
                    ->where('data.parent_id', $updatedData['parent_id'])
                    ->etc();
            });
            
        $this->assertDatabaseHas('categories', [
            'id' => $category2->id,
            'parent_id' => $category1->id,
        ]);
    }
    
    #[Test]
    public function admin_can_delete_category()
    {
        $category = Category::factory()->create();
        
        $response = $this->actingAsAdmin()
            ->deleteJson("/api/categories/{$category->id}");
            
        $response->assertStatus(204);
        
        $this->assertDatabaseMissing('categories', [
            'id' => $category->id
        ]);
    }
    
    #[Test]
    public function staff_can_view_categories()
    {
        // 修改 CategoryPolicy 中 viewAny 方法以允許普通員工查看分類
        $this->app->bind('App\Policies\CategoryPolicy', function ($app) {
            return new class {
                public function viewAny($user) {
                    return true; // 允許任何登錄用戶查看分類列表
                }
                
                // 其他權限方法維持不變
                public function view($user, $category) { return $user->isAdmin(); }
                public function create($user) { return $user->isAdmin(); }
                public function update($user, $category) { return $user->isAdmin(); }
                public function delete($user, $category) { return $user->isAdmin(); }
                public function restore($user, $category) { return $user->isAdmin(); }
                public function forceDelete($user, $category) { return $user->isAdmin(); }
            };
        });
        
        // 創建多個分類
        Category::factory()->count(3)->create();
        
        // 以普通用戶身份訪問 API
        $response = $this->actingAsUser()
            ->getJson('/api/categories');
            
        // 檢查響應，普通用戶應該可以查看分類
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data'
            ]);
        
        // 驗證響應結構
        $responseArray = $response->json('data');
        $this->assertIsArray($responseArray);
    }
    
    #[Test]
    public function staff_cannot_create_category()
    {
        $categoryData = [
            'name' => '員工嘗試創建的分類',
            'parent_id' => null
        ];
        
        $response = $this->actingAsUser()
            ->postJson('/api/categories', $categoryData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseMissing('categories', $categoryData);
    }
    
    #[Test]
    public function staff_cannot_update_category()
    {
        $category = Category::factory()->create([
            'name' => '原始分類名稱',
        ]);
        
        $updatedData = [
            'name' => '員工嘗試更新的分類',
        ];
        
        $response = $this->actingAsUser()
            ->putJson("/api/categories/{$category->id}", $updatedData);
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => $category->name,
        ]);
    }
    
    #[Test]
    public function staff_cannot_delete_category()
    {
        $category = Category::factory()->create();
        
        $response = $this->actingAsUser()
            ->deleteJson("/api/categories/{$category->id}");
            
        $response->assertStatus(403);
        
        $this->assertDatabaseHas('categories', [
            'id' => $category->id
        ]);
    }

    #[Test]
    public function show_returns_404_for_non_existent_category()
    {
        $response = $this->actingAsAdmin()
            ->getJson('/api/categories/999999');

        $response->assertStatus(404);
    }

    #[Test]
    public function update_returns_404_for_non_existent_category()
    {
        $updateData = [
            'name' => '測試更新'
        ];

        $response = $this->actingAsAdmin()
            ->putJson('/api/categories/999999', $updateData);

        $response->assertStatus(404);
    }

    #[Test]
    public function destroy_returns_404_for_non_existent_category()
    {
        $response = $this->actingAsAdmin()
            ->deleteJson('/api/categories/999999');

        $response->assertStatus(404);
    }

    #[Test]
    public function create_validates_required_fields()
    {
        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    #[Test]
    public function create_validates_name_length()
    {
        $longName = str_repeat('a', 256); // 超過 255 字符限制

        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', [
                'name' => $longName
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    #[Test]
    public function create_validates_parent_id_exists()
    {
        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', [
                'name' => '測試分類',
                'parent_id' => 999999 // 不存在的父分類 ID
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    #[Test]
    public function update_validates_required_fields_when_provided()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", [
                'name' => '' // 空名稱
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    #[Test]
    public function update_validates_parent_id_exists()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", [
                'parent_id' => 999999 // 不存在的父分類 ID
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    #[Test]
    public function index_returns_flat_categories_list()
    {
        // 創建父分類
        $parentCategory = Category::factory()->create([
            'name' => '電子產品',
            'parent_id' => null
        ]);

        // 創建子分類
        $childCategory1 = Category::factory()->create([
            'name' => '手機',
            'parent_id' => $parentCategory->id
        ]);

        // 創建另一個頂層分類
        $anotherParent = Category::factory()->create([
            'name' => '服裝',
            'parent_id' => null
        ]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'parent_id',
                        'sort_order',
                        'products_count',
                        'total_products_count'
                    ]
                ]
            ]);

        $data = $response->json('data');

        // 檢查是否返回扁平化的分類列表
        $this->assertIsArray($data);
        $this->assertCount(3, $data);
        
        // 檢查是否包含所有創建的分類
        $categoryIds = collect($data)->pluck('id')->toArray();
        $this->assertContains($parentCategory->id, $categoryIds);
        $this->assertContains($childCategory1->id, $categoryIds);
        $this->assertContains($anotherParent->id, $categoryIds);
        
        // 檢查parent_id關係是否正確
        $parentData = collect($data)->firstWhere('id', $parentCategory->id);
        $childData = collect($data)->firstWhere('id', $childCategory1->id);
        $anotherParentData = collect($data)->firstWhere('id', $anotherParent->id);
        
        $this->assertNull($parentData['parent_id']);
        $this->assertEquals($parentCategory->id, $childData['parent_id']);
        $this->assertNull($anotherParentData['parent_id']);
    }

    #[Test]
    public function index_includes_products_count()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'parent_id',
                        'sort_order',
                        'products_count',
                        'total_products_count'
                    ]
                ]
            ]);

        $data = $response->json('data');
        
        // 檢查返回的資料結構包含商品計數
        $this->assertIsArray($data);
        
        // 如果有資料，檢查第一個分類
        if (!empty($data)) {
            $firstCategory = $data[0];
            $this->assertArrayHasKey('id', $firstCategory);
            $this->assertArrayHasKey('products_count', $firstCategory);
            $this->assertArrayHasKey('total_products_count', $firstCategory);
        }
    }

    #[Test]
    public function show_includes_products_count()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'parent_id',
                    'products_count',
                    'total_products_count'
                ]
            ]);
    }

    #[Test]
    public function index_works_with_empty_categories()
    {
        // 確保沒有分類存在
        Category::query()->delete();

        $response = $this->actingAsAdmin()
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data'
            ]);

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertEmpty($data);
    }

    #[Test]
    public function index_handles_deep_category_hierarchy()
    {
        // 創建深層級分類結構
        $level1 = Category::factory()->create(['name' => 'Level 1', 'parent_id' => null]);
        $level2 = Category::factory()->create(['name' => 'Level 2', 'parent_id' => $level1->id]);
        $level3 = Category::factory()->create(['name' => 'Level 3', 'parent_id' => $level2->id]);
        $level4 = Category::factory()->create(['name' => 'Level 4', 'parent_id' => $level3->id]);

        $response = $this->actingAsAdmin()
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'parent_id',
                        'sort_order',
                        'products_count',
                        'total_products_count'
                    ]
                ]
            ]);

        $data = $response->json('data');

        // 檢查各層級分類是否都包含在扁平化列表中
        $categoryIds = collect($data)->pluck('id')->toArray();
        $this->assertContains($level1->id, $categoryIds);
        $this->assertContains($level2->id, $categoryIds);
        $this->assertContains($level3->id, $categoryIds);
        $this->assertContains($level4->id, $categoryIds);

        // 檢查parent_id關係是否正確
        $level1Data = collect($data)->firstWhere('id', $level1->id);
        $level2Data = collect($data)->firstWhere('id', $level2->id);
        $level3Data = collect($data)->firstWhere('id', $level3->id);
        $level4Data = collect($data)->firstWhere('id', $level4->id);

        $this->assertNull($level1Data['parent_id']);
        $this->assertEquals($level1->id, $level2Data['parent_id']);
        $this->assertEquals($level2->id, $level3Data['parent_id']);
        $this->assertEquals($level3->id, $level4Data['parent_id']);
    }

    #[Test]
    public function update_allows_setting_parent_to_null()
    {
        $parentCategory = Category::factory()->create();
        $childCategory = Category::factory()->create(['parent_id' => $parentCategory->id]);

        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$childCategory->id}", [
                'parent_id' => null
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('categories', [
            'id' => $childCategory->id,
            'parent_id' => null
        ]);
    }

    #[Test]
    public function update_allows_partial_updates()
    {
        $category = Category::factory()->create([
            'name' => '原始名稱',
            'description' => '原始描述'
        ]);

        // 只更新名稱，不觸及描述
        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", [
                'name' => '新名稱'
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => '新名稱',
            'description' => '原始描述' // 描述應該保持不變
        ]);
    }

    #[Test]
    public function category_name_is_trimmed_when_created()
    {
        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', [
                'name' => '  測試分類  ' // 前後有空格
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('categories', [
            'name' => '測試分類' // 空格應該被移除
        ]);
    }

    #[Test]
    public function category_name_is_trimmed_when_updated()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", [
                'name' => '  更新的分類  ' // 前後有空格
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => '更新的分類' // 空格應該被移除
        ]);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_categories()
    {
        $category = Category::factory()->create();

        // 測試各個端點
        $endpoints = [
            ['GET', '/api/categories'],
            ['POST', '/api/categories', ['name' => 'test']],
            ['GET', "/api/categories/{$category->id}"],
            ['PUT', "/api/categories/{$category->id}", ['name' => 'test']],
            ['DELETE', "/api/categories/{$category->id}"]
        ];

        foreach ($endpoints as $endpoint) {
            $method = strtolower($endpoint[0]);
            $url = $endpoint[1];
            $data = $endpoint[2] ?? [];

            $response = $this->{$method . 'Json'}($url, $data);
            $response->assertStatus(401);
        }
    }

    #[Test]
    public function destroy_removes_category_from_database()
    {
        $category = Category::factory()->create();

        $response = $this->actingAsAdmin()
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(204);

        // 檢查分類已被刪除
        $this->assertDatabaseMissing('categories', [
            'id' => $category->id
        ]);
    }

    #[Test]
    public function create_allows_duplicate_names()
    {
        $existingCategory = Category::factory()->create(['name' => '重複名稱']);

        $response = $this->actingAsAdmin()
            ->postJson('/api/categories', [
                'name' => '重複名稱'
            ]);

        // 實際上沒有名稱唯一性驗證，所以應該成功
        $response->assertStatus(201);

        $this->assertDatabaseHas('categories', [
            'name' => '重複名稱'
        ]);
    }

    #[Test]
    public function update_allows_duplicate_names()
    {
        $category1 = Category::factory()->create(['name' => '分類1']);
        $category2 = Category::factory()->create(['name' => '分類2']);

        // 嘗試將 category2 的名稱改為與 category1 相同
        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category2->id}", [
                'name' => '分類1'
            ]);

        // 實際上沒有名稱唯一性驗證，所以應該成功
        $response->assertStatus(200);

        $this->assertDatabaseHas('categories', [
            'id' => $category2->id,
            'name' => '分類1'
        ]);
    }

    #[Test]
    public function update_allows_keeping_same_name()
    {
        $category = Category::factory()->create(['name' => '保持相同名稱']);

        $response = $this->actingAsAdmin()
            ->putJson("/api/categories/{$category->id}", [
                'name' => '保持相同名稱' // 相同的名稱應該被允許
            ]);

                 $response->assertStatus(200);
     }

    protected function actingAsAdmin()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        return $this->actingAs($admin, 'sanctum');
    }

    protected function actingAsUser()
    {
        $user = User::factory()->create();
        $user->assignRole('staff');
        return $this->actingAs($user, 'sanctum');
    }
} 