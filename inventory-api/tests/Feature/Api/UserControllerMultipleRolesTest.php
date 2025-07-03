<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Spatie\Permission\Models\Role;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * 用戶管理 API 多角色測試
 * 
 * 測試用戶管理 API 是否正確支持多角色系統
 */
class UserControllerMultipleRolesTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * 測試創建用戶時可以分配多個角色
     */
    public function test_can_create_user_with_multiple_roles(): void
    {
        // 安排：以管理員身份登入
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // 執行：創建用戶並分配多個角色
        $response = $this->postJson('/api/users', [
            'name' => '多角色用戶',
            'username' => 'multirole',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['staff', 'installer']
        ]);

        // 斷言：請求成功
        $response->assertStatus(201);
        
        // 斷言：回應包含正確的角色
        $response->assertJsonPath('data.roles', ['staff', 'installer']);
        
        // 斷言：資料庫中正確儲存了角色
        $user = User::where('username', 'multirole')->first();
        $this->assertTrue($user->hasRole('staff'));
        $this->assertTrue($user->hasRole('installer'));
        $this->assertFalse($user->hasRole('admin'));
    }

    /**
     * 測試創建用戶時不指定角色
     */
    public function test_can_create_user_without_roles(): void
    {
        // 安排：以管理員身份登入
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // 執行：創建用戶但不指定角色
        $response = $this->postJson('/api/users', [
            'name' => '無角色用戶',
            'username' => 'noroles',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        // 斷言：請求成功
        $response->assertStatus(201);
        
        // 斷言：回應顯示用戶沒有角色
        $response->assertJsonPath('data.roles', []);
        
        // 斷言：資料庫中用戶沒有任何角色
        $user = User::where('username', 'noroles')->first();
        $this->assertEmpty($user->roles);
    }

    /**
     * 測試更新用戶角色
     */
    public function test_can_update_user_roles(): void
    {
        // 安排：創建一個有角色的用戶
        $user = User::factory()->create();
        $user->assignRole('viewer');
        
        // 以管理員身份登入
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // 執行：更新用戶角色
        $response = $this->putJson("/api/users/{$user->id}", [
            'roles' => ['staff', 'installer']
        ]);

        // 斷言：請求成功
        $response->assertStatus(200);
        
        // 斷言：回應包含新的角色
        $response->assertJsonPath('data.roles', ['staff', 'installer']);
        
        // 斷言：資料庫中正確更新了角色
        $user->refresh();
        $this->assertFalse($user->hasRole('viewer')); // 舊角色被移除
        $this->assertTrue($user->hasRole('staff'));
        $this->assertTrue($user->hasRole('installer'));
    }

    /**
     * 測試用戶列表顯示所有角色
     */
    public function test_user_list_shows_all_roles(): void
    {
        // 安排：創建擁有多個角色的用戶
        $user1 = User::factory()->create(['username' => 'user1']);
        $user1->assignRole(['admin', 'staff']);
        
        $user2 = User::factory()->create(['username' => 'user2']);
        $user2->assignRole(['viewer', 'installer']);
        
        // 以管理員身份登入
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // 執行：獲取用戶列表
        $response = $this->getJson('/api/users');

        // 斷言：請求成功
        $response->assertStatus(200);
        
        // 斷言：每個用戶都顯示其所有角色
        $users = $response->json('data');
        
        $user1Data = collect($users)->firstWhere('username', 'user1');
        $this->assertEqualsCanonicalizing(['admin', 'staff'], $user1Data['roles']);
        
        $user2Data = collect($users)->firstWhere('username', 'user2');
        $this->assertEqualsCanonicalizing(['viewer', 'installer'], $user2Data['roles']);
    }

    /**
     * 測試無效的角色被拒絕
     */
    public function test_invalid_roles_are_rejected(): void
    {
        // 安排：以管理員身份登入
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        // 執行：嘗試創建用戶並分配無效角色
        $response = $this->postJson('/api/users', [
            'name' => '無效角色用戶',
            'username' => 'invalidrole',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['admin', 'invalid_role']
        ]);

        // 斷言：請求失敗
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['roles.1']);
    }

    /**
     * 測試角色權限影響 - 擁有多個角色的用戶應該擁有所有角色的權限
     */
    public function test_user_with_multiple_roles_has_combined_permissions(): void
    {
        // 安排：創建同時擁有 viewer 和 installer 角色的用戶
        $user = User::factory()->create();
        $user->assignRole(['viewer', 'installer']);
        
        // 斷言：用戶被識別為 viewer
        $this->assertTrue($user->isViewer());
        
        // 斷言：用戶被識別為 installer
        $this->assertTrue($user->isInstaller());
        
        // 斷言：用戶不被識別為 admin 或 staff
        $this->assertFalse($user->isAdmin());
        $this->assertFalse($user->isStaff());
    }
} 