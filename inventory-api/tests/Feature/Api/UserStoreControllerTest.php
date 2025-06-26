<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Services\UserStoreService;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;
use Illuminate\Support\Facades\Log;

class UserStoreControllerTest extends TestCase
{
    use WithFaker;
    
    /** @test */
    public function admin_can_get_user_stores()
    {
        // 創建用戶
        $user = User::factory()->create();
        $user->assignRole('staff');
        
        // 手動創建多個商店並關聯到用戶
        $stores = Store::factory()->count(3)->create();
        $user->stores()->attach($stores->pluck('id'));
        
        // 以管理員身份訪問 API
        $response = $this->actingAsAdmin()
            ->getJson("/api/users/{$user->id}/stores");
            
        // 檢查響應
        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }
    
    /** @test */
    public function admin_can_assign_stores_to_user()
    {
        // 創建用戶
        $user = User::factory()->create();
        $user->assignRole('staff');
        
        // 手動創建多個商店
        $stores = Store::factory()->count(3)->create();
        
        // 準備要指派的商店 ID 列表
        $storeIds = $stores->pluck('id')->toArray();
        
        // 以管理員身份指派商店
        $response = $this->actingAsAdmin()
            ->postJson("/api/users/{$user->id}/stores", [
                'store_ids' => $storeIds
            ]);
            
        // 檢查響應
        $response->assertStatus(200)
            ->assertJsonPath('message', '分店已成功分配給用戶');
        
        // 確認關聯已建立
        $this->assertCount(3, $user->refresh()->stores);
        
        // 確保每家商店都關聯到了用戶
        foreach ($storeIds as $storeId) {
            $this->assertDatabaseHas('store_user', [
                'user_id' => $user->id,
                'store_id' => $storeId,
            ]);
        }
    }
    
    /** @test */
    public function admin_can_update_user_store_assignments()
    {
        // 創建用戶
        $user = User::factory()->create();
        $user->assignRole('staff');
        
        // 手動創建 5 個商店
        $stores = Store::factory()->count(5)->create();
        
        // 初始分配前三家商店
        $user->stores()->attach($stores->slice(0, 3)->pluck('id'));
        
        // 準備新的分配（後三家商店）
        $newStoreIds = $stores->slice(2, 3)->pluck('id')->toArray();
        
        // 以管理員身份更新商店分配
        $response = $this->actingAsAdmin()
            ->postJson("/api/users/{$user->id}/stores", [
                'store_ids' => $newStoreIds
            ]);
            
        // 檢查響應
        $response->assertStatus(200);
        
        // 重新載入用戶
        $user->refresh();
        
        // 確認用戶有 3 家商店
        $this->assertCount(3, $user->stores);
        
        $this->assertDatabaseMissing('store_user', ['user_id' => $user->id, 'store_id' => $stores[0]->id]);
        $this->assertDatabaseMissing('store_user', ['user_id' => $user->id, 'store_id' => $stores[1]->id]);
        $this->assertDatabaseHas('store_user', ['user_id' => $user->id, 'store_id' => $stores[2]->id]);
        $this->assertDatabaseHas('store_user', ['user_id' => $user->id, 'store_id' => $stores[3]->id]);
        $this->assertDatabaseHas('store_user', ['user_id' => $user->id, 'store_id' => $stores[4]->id]);
    }
    
    /** @test */
    public function staff_cannot_get_other_user_stores()
    {
        // 創建另一個用戶
        $targetUser = User::factory()->create();
        $targetUser->assignRole('staff');
        $stores = Store::factory()->count(3)->create();
        $targetUser->stores()->attach($stores->pluck('id'));
        
        // 以普通用戶身份嘗試訪問 API
        $response = $this->actingAsUser()->getJson("/api/users/{$targetUser->id}/stores");
            
        $response->assertStatus(403);
    }
    
    /** @test */
    public function staff_can_view_own_stores_list()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');
        $stores = Store::factory()->count(2)->create();
        $staff->stores()->attach($stores->pluck('id'));

        $response = $this->actingAs($staff)->getJson("/api/users/{$staff->id}/stores");

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function staff_cannot_assign_stores_to_any_user()
    {
        $staff = User::factory()->create();
        $staff->assignRole('staff');
        $this->actingAs($staff);
        
        $anotherStaff = User::factory()->create();
        $anotherStaff->assignRole('staff');
        $stores = Store::factory()->count(3)->create();
        $storeIds = $stores->pluck('id')->toArray();
        
        // Try to assign to another user
        $responseToOther = $this->postJson("/api/users/{$anotherStaff->id}/stores", ['store_ids' => $storeIds]);
        $responseToOther->assertStatus(403);
        
        // Try to assign to self
        $responseToSelf = $this->postJson("/api/users/{$staff->id}/stores", ['store_ids' => $storeIds]);
        $responseToSelf->assertStatus(403);
    }
    
    /** @test */
    public function assigning_stores_to_non_existent_user_returns_404()
    {
        $stores = Store::factory()->count(1)->create();
        $storeIds = $stores->pluck('id')->toArray();
        $nonExistentUserId = 99999;

        $response = $this->actingAsAdmin()->postJson("/api/users/{$nonExistentUserId}/stores", ['store_ids' => $storeIds]);

        $response->assertStatus(404);
    }

    /** @test */
    public function assigning_non_existent_stores_returns_validation_error()
    {
        $user = User::factory()->create();
        $nonExistentStoreIds = [999, 998];

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => $nonExistentStoreIds]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['store_ids.0', 'store_ids.1']);
    }

    /** @test */
    public function assigning_empty_array_clears_user_stores()
    {
        $user = User::factory()->create();
        $stores = Store::factory()->count(3)->create();
        $user->stores()->attach($stores->pluck('id'));
        $this->assertCount(3, $user->refresh()->stores);

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => []]);

        $response->assertStatus(200);
        $this->assertCount(0, $user->refresh()->stores);
    }

    /** @test */
    public function assigning_stores_requires_array_of_ids()
    {
        $user = User::factory()->create();

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => 'not-an-array']);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['store_ids']);
    }

    /** @test */
    public function store_assignment_works_with_valid_stores()
    {
        $user = User::factory()->create();
        $store = Store::factory()->create();
        $storeIds = [$store->id];

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => $storeIds]);

        $response->assertStatus(200)
                 ->assertJson(['message' => '分店已成功分配給用戶']);
                 
        // 確認分配成功
        $this->assertCount(1, $user->refresh()->stores);
        $this->assertEquals($store->id, $user->stores->first()->id);
    }

    /** @test */
    public function store_assignment_handles_service_exceptions()
    {
        Log::shouldReceive('error')
            ->once()
            ->with(
                \Mockery::pattern('/分配分店失敗: .*/'),
                \Mockery::type('array')
            );

        $user = User::factory()->create();
        $stores = Store::factory()->count(2)->create();
        $storeIds = $stores->pluck('id')->toArray();

        // 模擬 UserStoreService 拋出異常
        $mockService = \Mockery::mock(UserStoreService::class);
        $mockService->shouldReceive('assignStores')
                   ->once()
                   ->with(\Mockery::type(User::class), $storeIds)
                   ->andThrow(new \Exception('模擬的資料庫錯誤'));

        $this->app->instance(UserStoreService::class, $mockService);

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => $storeIds]);

        $response->assertStatus(500)
                 ->assertJson([
                     'message' => '分配分店時發生錯誤',
                     'errors' => ['server' => ['處理請求時發生錯誤，請稍後再試']]
                 ]);
    }

    /** @test */
    public function store_assignment_logs_error_with_correct_context()
    {
        $user = User::factory()->create();
        $stores = Store::factory()->count(1)->create();
        $storeIds = $stores->pluck('id')->toArray();
        $exceptionMessage = '模擬的服務異常';

        Log::shouldReceive('error')
            ->once()
            ->with(
                "分配分店失敗: {$exceptionMessage}",
                \Mockery::on(function ($context) use ($user) {
                    return isset($context['user_id']) && 
                           $context['user_id'] === $user->id &&
                           isset($context['exception']) &&
                           $context['exception'] instanceof \Exception;
                })
            );

        // 模擬 UserStoreService 拋出異常
        $mockService = \Mockery::mock(UserStoreService::class);
        $mockService->shouldReceive('assignStores')
                   ->once()
                   ->andThrow(new \Exception($exceptionMessage));

        $this->app->instance(UserStoreService::class, $mockService);

        $response = $this->actingAsAdmin()->postJson("/api/users/{$user->id}/stores", ['store_ids' => $storeIds]);

        $response->assertStatus(500);
    }
}  