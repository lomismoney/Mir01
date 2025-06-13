<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Testing\Fluent\AssertableJson;

class UserStoreControllerTest extends TestCase
{
    use WithFaker;
    
    /** @test */
    public function admin_can_get_user_stores()
    {
        // 創建用戶
        $user = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建多個商店並關聯到用戶
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        $user->stores()->attach(collect($stores)->pluck('id')->toArray());
        
        // 以管理員身份訪問 API
        $response = $this->actingAsAdmin()
            ->getJson("/api/users/{$user->id}/stores");
            
        // 檢查響應
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'address', 'created_at', 'updated_at']
                ]
            ]);
            
        // 確認用戶有三家店舖
        $this->assertCount(3, $response->json('data'));
    }
    
    /** @test */
    public function admin_can_assign_stores_to_user()
    {
        // 創建用戶
        $user = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建多個商店
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        
        // 準備要指派的商店 ID 列表
        $storeIds = collect($stores)->pluck('id')->toArray();
        
        // 以管理員身份指派商店
        $response = $this->actingAsAdmin()
            ->postJson("/api/users/{$user->id}/stores", [
                'store_ids' => $storeIds
            ]);
            
        // 檢查響應
        $response->assertStatus(200);
        
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
        $user = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建 5 個商店
        $stores = [];
        for ($i = 0; $i < 5; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        
        // 初始分配前三家商店
        $initialStoreIds = [$stores[0]->id, $stores[1]->id, $stores[2]->id];
        $user->stores()->attach($initialStoreIds);
        
        // 準備新的分配（最後三家商店）
        $newStoreIds = [$stores[2]->id, $stores[3]->id, $stores[4]->id];
        
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
        
        // 確保前兩家商店不再關聯（0, 1），第三家保留（2），加上兩家新商店（3, 4）
        $this->assertDatabaseMissing('store_user', [
            'user_id' => $user->id,
            'store_id' => $stores[0]->id,
        ]);
        $this->assertDatabaseMissing('store_user', [
            'user_id' => $user->id,
            'store_id' => $stores[1]->id,
        ]);
        $this->assertDatabaseHas('store_user', [
            'user_id' => $user->id,
            'store_id' => $stores[2]->id,
        ]);
        $this->assertDatabaseHas('store_user', [
            'user_id' => $user->id,
            'store_id' => $stores[3]->id,
        ]);
        $this->assertDatabaseHas('store_user', [
            'user_id' => $user->id,
            'store_id' => $stores[4]->id,
        ]);
    }
    
    /** @test */
    public function staff_cannot_get_user_stores()
    {
        // 創建另一個用戶
        $targetUser = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建商店並關聯到目標用戶
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        $targetUser->stores()->attach(collect($stores)->pluck('id')->toArray());
        
        // 以普通用戶身份嘗試訪問 API
        $response = $this->actingAsUser()
            ->getJson("/api/users/{$targetUser->id}/stores");
            
        // 應該被拒絕
        $response->assertStatus(403);
    }
    
    /** @test */
    public function staff_cannot_assign_stores_to_user()
    {
        // 創建目標用戶
        $targetUser = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建商店
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        $storeIds = collect($stores)->pluck('id')->toArray();
        
        // 以普通用戶身份嘗試指派商店
        $response = $this->actingAsUser()
            ->postJson("/api/users/{$targetUser->id}/stores", [
                'store_ids' => $storeIds
            ]);
            
        // 應該被拒絕
        $response->assertStatus(403);
        
        // 確認沒有關聯建立
        $this->assertCount(0, $targetUser->refresh()->stores);
    }
    
    /** @test */
    public function staff_can_view_own_stores()
    {
        // 創建員工用戶（使用 staff 角色）
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'staff'
        ]);
        
        // 手動創建商店並關聯到用戶
        $stores = [];
        for ($i = 0; $i < 3; $i++) {
            $stores[] = Store::create([
                'name' => 'Store ' . ($i + 1),
                'address' => 'Address ' . ($i + 1)
            ]);
        }
        $user->stores()->attach(collect($stores)->pluck('id')->toArray());
        
        // 以該用戶身份檢視 API
        $response = $this->actingAs($user)
            ->getJson('/api/user');
            
        // 應該成功，並包含商店信息
        $response->assertStatus(200)
            ->assertJson(function (AssertableJson $json) {
                $json->has('data.stores', 3)
                    ->where('data.role', 'staff')
                    ->etc();
            });
    }
} 