<?php

namespace Tests\Unit\Console\Commands;

use Tests\TestCase;
use App\Models\User;
use App\Console\Commands\AssignRoleToUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

/**
 * AssignRoleToUser 命令測試
 * 
 * 測試用戶角色分配命令的各種情況
 */
class AssignRoleToUserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 創建測試用戶
        $this->user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
            'email' => 'test@example.com'
        ]);
    }

    /**
     * 測試給用戶分配角色（使用用戶 ID）
     */
    public function test_assign_role_by_user_id()
    {
        // 執行命令
        $exitCode = Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin'
        ]);

        // 驗證執行成功
        $this->assertEquals(0, $exitCode);
        
        // 驗證用戶確實有該角色
        $this->assertTrue($this->user->fresh()->hasRole('admin'));
        
        // 驗證輸出訊息
        $output = Artisan::output();
        $this->assertStringContainsString('已給用戶', $output);
        $this->assertStringContainsString('分配角色: admin', $output);
    }

    /**
     * 測試給用戶分配角色（使用用戶名）
     */
    public function test_assign_role_by_username()
    {
        // 執行命令
        $exitCode = Artisan::call('user:assign-role', [
            'user' => 'testuser',
            'role' => 'staff'
        ]);

        // 驗證執行成功
        $this->assertEquals(0, $exitCode);
        
        // 驗證用戶確實有該角色
        $this->assertTrue($this->user->fresh()->hasRole('staff'));
        
        // 驗證輸出訊息
        $output = Artisan::output();
        $this->assertStringContainsString('已給用戶', $output);
        $this->assertStringContainsString('分配角色: staff', $output);
    }

    /**
     * 測試移除用戶角色
     */
    public function test_remove_role_from_user()
    {
        // 先給用戶分配角色
        $this->user->assignRole('admin');
        $this->assertTrue($this->user->hasRole('admin'));

        // 執行移除命令
        $exitCode = Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin',
            '--remove' => true
        ]);

        // 驗證執行成功
        $this->assertEquals(0, $exitCode);
        
        // 驗證用戶已沒有該角色
        $this->assertFalse($this->user->fresh()->hasRole('admin'));
        
        // 驗證輸出訊息
        $output = Artisan::output();
        $this->assertStringContainsString('已從用戶', $output);
        $this->assertStringContainsString('移除角色: admin', $output);
    }

    /**
     * 測試給不存在的用戶分配角色
     */
    public function test_assign_role_to_non_existent_user()
    {
        // 執行命令（使用不存在的用戶 ID）
        $exitCode = Artisan::call('user:assign-role', [
            'user' => 999999,
            'role' => 'admin'
        ]);

        // 驗證執行失敗
        $this->assertEquals(1, $exitCode);
        
        // 驗證錯誤訊息
        $output = Artisan::output();
        $this->assertStringContainsString('找不到用戶', $output);
    }

    /**
     * 測試分配無效角色
     */
    public function test_assign_invalid_role()
    {
        // 執行命令（使用無效角色）
        $exitCode = Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'invalid_role'
        ]);

        // 驗證執行失敗
        $this->assertEquals(1, $exitCode);
        
        // 驗證錯誤訊息
        $output = Artisan::output();
        $this->assertStringContainsString('無效的角色', $output);
        $this->assertStringContainsString('可用角色:', $output);
    }

    /**
     * 測試分配多個角色
     */
    public function test_assign_multiple_roles()
    {
        // 分配第一個角色
        Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin'
        ]);

        // 分配第二個角色
        Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'staff'
        ]);

        // 驗證用戶有兩個角色
        $user = $this->user->fresh();
        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('staff'));
        $this->assertCount(2, $user->roles);
    }

    /**
     * 測試顯示用戶當前角色
     */
    public function test_display_current_roles()
    {
        // 給用戶分配角色
        $this->user->assignRole(['admin', 'staff']);

        // 執行命令
        Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'viewer'
        ]);

        // 驗證輸出包含當前角色信息
        $output = Artisan::output();
        $this->assertStringContainsString('用戶當前的角色:', $output);
        $this->assertStringContainsString('admin', $output);
        $this->assertStringContainsString('staff', $output);
        $this->assertStringContainsString('viewer', $output);
    }

    /**
     * 測試沒有角色的用戶顯示
     */
    public function test_display_no_roles()
    {
        // 確保用戶沒有角色
        $this->user->roles()->detach();

        // 執行分配命令後又移除
        Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin'
        ]);

        Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin',
            '--remove' => true
        ]);

        // 驗證輸出顯示無角色
        $output = Artisan::output();
        $this->assertStringContainsString('用戶當前的角色: 無', $output);
    }

    /**
     * 測試移除不存在的角色
     */
    public function test_remove_non_existent_role()
    {
        // 確保用戶沒有 admin 角色
        $this->assertFalse($this->user->hasRole('admin'));

        // 嘗試移除不存在的角色
        $exitCode = Artisan::call('user:assign-role', [
            'user' => $this->user->id,
            'role' => 'admin',
            '--remove' => true
        ]);

        // 驗證執行成功（移除不存在的角色不會出錯）
        $this->assertEquals(0, $exitCode);
        
        // 驗證輸出訊息
        $output = Artisan::output();
        $this->assertStringContainsString('已從用戶', $output);
        $this->assertStringContainsString('移除角色: admin', $output);
    }

    /**
     * 測試所有可用角色都能正確分配
     */
    public function test_all_available_roles_can_be_assigned()
    {
        $availableRoles = array_keys(User::getAvailableRoles());

        foreach ($availableRoles as $role) {
            // 執行命令
            $exitCode = Artisan::call('user:assign-role', [
                'user' => $this->user->id,
                'role' => $role
            ]);

            // 驗證執行成功
            $this->assertEquals(0, $exitCode, "Failed to assign role: {$role}");
            
            // 驗證用戶確實有該角色
            $this->assertTrue($this->user->fresh()->hasRole($role), "User does not have role: {$role}");
        }
    }
} 