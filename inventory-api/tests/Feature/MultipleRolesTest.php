<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Installation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 測試多角色系統功能
 */
class MultipleRolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行遷移命令來創建角色
        $this->artisan('roles:migrate');
    }

    /**
     * 測試用戶可以同時擁有多個角色
     */
    public function test_user_can_have_multiple_roles()
    {
        $user = User::factory()->create();
        
        // 分配第一個角色
        $user->assignRole('staff');
        $this->assertTrue($user->hasRole('staff'));
        
        // 分配第二個角色
        $user->assignRole('installer');
        $this->assertTrue($user->hasRole('installer'));
        $this->assertTrue($user->hasRole('staff'));
        
        // 驗證 hasAnyRole 方法
        $this->assertTrue($user->hasAnyRole(['staff', 'installer']));
        $this->assertTrue($user->hasAnyRole(['admin', 'staff']));
        $this->assertFalse($user->hasAnyRole(['admin', 'viewer']));
    }



    /**
     * 測試多角色用戶在安裝管理中的權限
     */
    public function test_staff_with_installer_role_permissions()
    {
        // 創建一個擁有 staff 和 installer 角色的用戶
        $user = User::factory()->create();
        $user->assignRole(['staff', 'installer']);
        
        // 創建兩個安裝單
        $ownInstallation = Installation::factory()->create([
            'installer_user_id' => $user->id
        ]);
        
        $otherUser = User::factory()->create();
        $otherUser->assignRole('installer');
        $otherInstallation = Installation::factory()->create([
            'installer_user_id' => $otherUser->id
        ]);
        
        $this->actingAs($user);
        
        // staff 角色讓用戶可以看到所有安裝單
        $response = $this->getJson('/api/installations');
        $response->assertOk();
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(2, count($data));
        
        // staff 角色也讓用戶可以查看任何人的行程
        $response = $this->getJson('/api/installations/schedule?' . http_build_query([
            'installer_user_id' => $otherInstallation->installer_user_id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addMonth()->format('Y-m-d')
        ]));
        $response->assertOk();
    }

    /**
     * 測試角色的添加和移除
     */
    public function test_role_assignment_and_removal()
    {
        $user = User::factory()->create();
        
        // 初始狀態 - 無角色
        $this->assertEquals([], $user->getRoleNames()->toArray());
        
        // 分配 viewer 角色
        $user->assignRole('viewer');
        $this->assertEquals(['viewer'], $user->getRoleNames()->toArray());
        
        // 添加角色
        $user->assignRole('installer');
        $roles = $user->getRoleNames()->toArray();
        $this->assertContains('viewer', $roles);
        $this->assertContains('installer', $roles);
        
        // 移除角色
        $user->removeRole('viewer');
        $this->assertEquals(['installer'], $user->getRoleNames()->toArray());
        
        // 驗證 hasRole 方法
        $this->assertTrue($user->hasRole('installer'));
        $this->assertFalse($user->hasRole('viewer'));
        $this->assertFalse($user->hasRole('staff'));
    }


} 