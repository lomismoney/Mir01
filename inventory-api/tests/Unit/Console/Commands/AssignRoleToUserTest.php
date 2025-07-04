<?php

namespace Tests\Unit\Console\Commands;

use App\Console\Commands\AssignRoleToUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * AssignRoleToUser 命令測試
 * 
 * 測試角色分配命令的所有功能
 */
class AssignRoleToUserTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試通過用戶ID分配角色
     */
    public function test_assign_role_to_user_by_id(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 執行命令
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->expectsOutput("✓ 已給用戶 {$user->name} (ID: {$user->id}) 分配角色: admin")
        ->assertExitCode(0);

        // 驗證角色已分配
        $this->assertTrue($user->fresh()->hasRole('admin'));
    }

    /**
     * 測試通過用戶名分配角色
     */
    public function test_assign_role_to_user_by_username(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 執行命令
        $this->artisan('user:assign-role', [
            'user' => 'testuser',
            'role' => 'staff',
        ])
        ->expectsOutput("✓ 已給用戶 {$user->name} (ID: {$user->id}) 分配角色: staff")
        ->assertExitCode(0);

        // 驗證角色已分配
        $this->assertTrue($user->fresh()->hasRole('staff'));
    }

    /**
     * 測試移除用戶角色
     */
    public function test_remove_role_from_user(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);
        
        // 先分配角色
        $user->assignRole('admin');
        $this->assertTrue($user->hasRole('admin'));

        // 執行命令移除角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
            '--remove' => true,
        ])
        ->expectsOutput("✓ 已從用戶 {$user->name} (ID: {$user->id}) 移除角色: admin")
        ->assertExitCode(0);

        // 驗證角色已移除
        $this->assertFalse($user->fresh()->hasRole('admin'));
    }

    /**
     * 測試用戶不存在的情況
     */
    public function test_user_not_found_by_id(): void
    {
        // 執行命令（不存在的用戶ID）
        $this->artisan('user:assign-role', [
            'user' => 99999,
            'role' => 'admin',
        ])
        ->expectsOutput('找不到用戶: 99999')
        ->assertExitCode(1);
    }

    /**
     * 測試用戶不存在的情況（用戶名）
     */
    public function test_user_not_found_by_username(): void
    {
        // 執行命令（不存在的用戶名）
        $this->artisan('user:assign-role', [
            'user' => 'nonexistentuser',
            'role' => 'admin',
        ])
        ->expectsOutput('找不到用戶: nonexistentuser')
        ->assertExitCode(1);
    }

    /**
     * 測試無效角色的情況
     */
    public function test_invalid_role(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'username' => 'testuser',
        ]);

        // 執行命令（無效角色）
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'invalid_role',
        ])
        ->expectsOutput('無效的角色: invalid_role')
        ->assertExitCode(1);
    }

    /**
     * 測試顯示可用角色列表
     */
    public function test_shows_available_roles_on_invalid_role(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'username' => 'testuser',
        ]);

        // 獲取可用角色
        $availableRoles = array_keys(User::getAvailableRoles());
        $rolesString = implode(', ', $availableRoles);

        // 執行命令（無效角色）
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'invalid_role',
        ])
        ->expectsOutput('無效的角色: invalid_role')
        ->expectsOutput("可用角色: {$rolesString}")
        ->assertExitCode(1);
    }

    /**
     * 測試顯示用戶當前角色
     */
    public function test_shows_current_user_roles_after_assignment(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 先分配一個角色
        $user->assignRole('staff');

        // 執行命令分配另一個角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->expectsOutput("✓ 已給用戶 {$user->name} (ID: {$user->id}) 分配角色: admin")
        ->assertExitCode(0);

        // 驗證顯示當前角色
        $currentRoles = $user->fresh()->getRoleNames()->toArray();
        $this->assertTrue(in_array('admin', $currentRoles));
        $this->assertTrue(in_array('staff', $currentRoles));
    }

    /**
     * 測試移除不存在的角色
     */
    public function test_remove_non_existent_role(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 執行命令移除用戶沒有的角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
            '--remove' => true,
        ])
        ->expectsOutput("✓ 已從用戶 {$user->name} (ID: {$user->id}) 移除角色: admin")
        ->assertExitCode(0);

        // 驗證用戶仍然沒有該角色
        $this->assertFalse($user->fresh()->hasRole('admin'));
    }

    /**
     * 測試顯示用戶沒有角色的情況
     */
    public function test_shows_no_roles_when_user_has_none(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 執行命令分配角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->expectsOutput("✓ 已給用戶 {$user->name} (ID: {$user->id}) 分配角色: admin")
        ->assertExitCode(0);

        // 然後移除角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
            '--remove' => true,
        ])
        ->expectsOutput("✓ 已從用戶 {$user->name} (ID: {$user->id}) 移除角色: admin")
        ->assertExitCode(0);
    }

    /**
     * 測試分配多個角色
     */
    public function test_assign_multiple_roles(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 分配第一個角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->assertExitCode(0);

        // 分配第二個角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'staff',
        ])
        ->assertExitCode(0);

        // 驗證用戶有兩個角色
        $user->refresh();
        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('staff'));
    }

    /**
     * 測試分配相同角色（不會重複）
     */
    public function test_assign_same_role_twice(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 分配角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->assertExitCode(0);

        // 再次分配相同角色
        $this->artisan('user:assign-role', [
            'user' => $user->id,
            'role' => 'admin',
        ])
        ->assertExitCode(0);

        // 驗證用戶只有一個admin角色
        $user->refresh();
        $this->assertTrue($user->hasRole('admin'));
        $this->assertEquals(1, $user->getRoleNames()->count());
    }

    /**
     * 測試所有可用角色
     */
    public function test_assign_all_available_roles(): void
    {
        // 準備測試數據
        $user = User::factory()->create([
            'name' => '測試用戶',
            'username' => 'testuser',
        ]);

        // 獲取所有可用角色
        $availableRoles = array_keys(User::getAvailableRoles());

        // 為每個角色執行分配命令
        foreach ($availableRoles as $role) {
            $this->artisan('user:assign-role', [
                'user' => $user->id,
                'role' => $role,
            ])
            ->assertExitCode(0);

            // 驗證角色已分配
            $this->assertTrue($user->fresh()->hasRole($role));
        }
    }

    /**
     * 測試命令簽名
     */
    public function test_command_signature(): void
    {
        $command = new AssignRoleToUser();
        
        // 使用反射來訪問 protected 屬性
        $reflection = new \ReflectionClass($command);
        $signatureProperty = $reflection->getProperty('signature');
        $signatureProperty->setAccessible(true);
        $signature = $signatureProperty->getValue($command);
        
        $this->assertStringContainsString('user:assign-role', $signature);
        $this->assertStringContainsString('{user', $signature);
        $this->assertStringContainsString('{role', $signature);
        $this->assertStringContainsString('--remove', $signature);
    }

    /**
     * 測試命令描述
     */
    public function test_command_description(): void
    {
        $command = new AssignRoleToUser();
        
        // 使用反射來訪問 protected 屬性
        $reflection = new \ReflectionClass($command);
        $descriptionProperty = $reflection->getProperty('description');
        $descriptionProperty->setAccessible(true);
        $description = $descriptionProperty->getValue($command);
        
        $this->assertEquals('給用戶分配或移除角色', $description);
    }
} 