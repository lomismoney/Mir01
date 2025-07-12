<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * UserPolicy 完整測試
 * 
 * 測試用戶權限策略的所有方法和邏輯
 */
class UserPolicyCompleteTest extends TestCase
{
    use RefreshDatabase;

    private UserPolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private User $targetUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new UserPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        $this->targetUser = User::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 只有管理員可以查看用戶列表
     */
    public function test_view_any_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertFalse($this->policy->viewAny($this->staff));
        $this->assertFalse($this->policy->viewAny($this->viewer));
        $this->assertFalse($this->policy->viewAny($this->installer));
        $this->assertFalse($this->policy->viewAny($this->targetUser));
    }

    /**
     * 測試 view 權限 - 管理員可以查看任何用戶，用戶可以查看自己
     */
    public function test_view_allows_admin_and_self(): void
    {
        // 管理員可以查看任何用戶
        $this->assertTrue($this->policy->view($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->view($this->admin, $this->staff));
        $this->assertTrue($this->policy->view($this->admin, $this->viewer));
        $this->assertTrue($this->policy->view($this->admin, $this->installer));
        
        // 用戶可以查看自己
        $this->assertTrue($this->policy->view($this->staff, $this->staff));
        $this->assertTrue($this->policy->view($this->viewer, $this->viewer));
        $this->assertTrue($this->policy->view($this->installer, $this->installer));
        $this->assertTrue($this->policy->view($this->targetUser, $this->targetUser));
        
        // 用戶不能查看其他用戶
        $this->assertFalse($this->policy->view($this->staff, $this->viewer));
        $this->assertFalse($this->policy->view($this->viewer, $this->installer));
        $this->assertFalse($this->policy->view($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->view($this->targetUser, $this->staff));
    }

    /**
     * 測試 create 權限 - 只有管理員可以創建用戶
     */
    public function test_create_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
        $this->assertFalse($this->policy->create($this->targetUser));
    }

    /**
     * 測試 update 權限 - 只有管理員可以更新用戶
     */
    public function test_update_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->update($this->admin, $this->staff));
        $this->assertTrue($this->policy->update($this->admin, $this->viewer));
        $this->assertTrue($this->policy->update($this->admin, $this->installer));
        
        $this->assertFalse($this->policy->update($this->staff, $this->targetUser));
        $this->assertFalse($this->policy->update($this->viewer, $this->targetUser));
        $this->assertFalse($this->policy->update($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->update($this->targetUser, $this->staff));
    }

    /**
     * 測試 assignStores 權限 - 只有管理員可以分配分店
     */
    public function test_assign_stores_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->assignStores($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->assignStores($this->admin, $this->staff));
        $this->assertTrue($this->policy->assignStores($this->admin, $this->viewer));
        $this->assertTrue($this->policy->assignStores($this->admin, $this->installer));
        
        $this->assertFalse($this->policy->assignStores($this->staff, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($this->viewer, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($this->targetUser, $this->staff));
    }

    /**
     * 測試 delete 權限 - 管理員可以刪除其他用戶但不能刪除自己
     */
    public function test_delete_allows_admin_but_not_self(): void
    {
        // 管理員可以刪除其他用戶
        $this->assertTrue($this->policy->delete($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->delete($this->admin, $this->staff));
        $this->assertTrue($this->policy->delete($this->admin, $this->viewer));
        $this->assertTrue($this->policy->delete($this->admin, $this->installer));
        
        // 管理員不能刪除自己
        $this->assertFalse($this->policy->delete($this->admin, $this->admin));
        
        // 其他角色不能刪除任何用戶
        $this->assertFalse($this->policy->delete($this->staff, $this->targetUser));
        $this->assertFalse($this->policy->delete($this->viewer, $this->targetUser));
        $this->assertFalse($this->policy->delete($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->delete($this->targetUser, $this->staff));
    }

    /**
     * 測試 restore 權限 - 只有管理員可以恢復用戶
     */
    public function test_restore_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->restore($this->admin, $this->staff));
        $this->assertTrue($this->policy->restore($this->admin, $this->viewer));
        $this->assertTrue($this->policy->restore($this->admin, $this->installer));
        
        $this->assertFalse($this->policy->restore($this->staff, $this->targetUser));
        $this->assertFalse($this->policy->restore($this->viewer, $this->targetUser));
        $this->assertFalse($this->policy->restore($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->restore($this->targetUser, $this->staff));
    }

    /**
     * 測試 forceDelete 權限 - 管理員可以永久刪除其他用戶但不能刪除自己
     */
    public function test_force_delete_allows_admin_but_not_self(): void
    {
        // 管理員可以永久刪除其他用戶
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->targetUser));
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->staff));
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->viewer));
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->installer));
        
        // 管理員不能永久刪除自己
        $this->assertFalse($this->policy->forceDelete($this->admin, $this->admin));
        
        // 其他角色不能永久刪除任何用戶
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->targetUser));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->targetUser));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->targetUser));
        $this->assertFalse($this->policy->forceDelete($this->targetUser, $this->staff));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_user_permissions(): void
    {
        // 創建有多個角色的用戶（不含管理員）
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer']);

        // 由於沒有 admin 角色，應該無法執行管理操作
        $this->assertFalse($this->policy->viewAny($multiRoleUser));
        $this->assertFalse($this->policy->create($multiRoleUser));
        $this->assertFalse($this->policy->update($multiRoleUser, $this->targetUser));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($multiRoleUser, $this->targetUser));
        
        // 但可以查看自己
        $this->assertTrue($this->policy->view($multiRoleUser, $multiRoleUser));
        
        // 不能查看其他用戶
        $this->assertFalse($this->policy->view($multiRoleUser, $this->targetUser));
    }

    /**
     * 測試管理員加其他角色的用戶權限
     */
    public function test_admin_with_other_roles_permissions(): void
    {
        // 創建有管理員和其他角色的用戶
        $adminWithOtherRoles = User::factory()->create();
        $adminWithOtherRoles->assignRole(['admin', 'staff', 'viewer']);

        // 應該擁有所有權限
        $this->assertTrue($this->policy->viewAny($adminWithOtherRoles));
        $this->assertTrue($this->policy->view($adminWithOtherRoles, $this->targetUser));
        $this->assertTrue($this->policy->create($adminWithOtherRoles));
        $this->assertTrue($this->policy->update($adminWithOtherRoles, $this->targetUser));
        $this->assertTrue($this->policy->delete($adminWithOtherRoles, $this->targetUser));
        $this->assertTrue($this->policy->assignStores($adminWithOtherRoles, $this->targetUser));
        $this->assertTrue($this->policy->restore($adminWithOtherRoles, $this->targetUser));
        $this->assertTrue($this->policy->forceDelete($adminWithOtherRoles, $this->targetUser));
        
        // 但不能刪除自己
        $this->assertFalse($this->policy->delete($adminWithOtherRoles, $adminWithOtherRoles));
        $this->assertFalse($this->policy->forceDelete($adminWithOtherRoles, $adminWithOtherRoles));
    }

    /**
     * 測試自我操作的權限
     */
    public function test_self_operations_permissions(): void
    {
        $users = [$this->admin, $this->staff, $this->viewer, $this->installer, $this->targetUser];
        
        foreach ($users as $user) {
            // 所有用戶都可以查看自己
            $this->assertTrue($this->policy->view($user, $user));
            
            // 只有管理員可以對自己執行管理操作（除了刪除）
            if ($user->isAdmin()) {
                $this->assertTrue($this->policy->update($user, $user));
                $this->assertTrue($this->policy->assignStores($user, $user));
                $this->assertTrue($this->policy->restore($user, $user));
                // 但不能刪除自己
                $this->assertFalse($this->policy->delete($user, $user));
                $this->assertFalse($this->policy->forceDelete($user, $user));
            } else {
                // 非管理員不能對自己執行管理操作
                $this->assertFalse($this->policy->update($user, $user));
                $this->assertFalse($this->policy->assignStores($user, $user));
                $this->assertFalse($this->policy->delete($user, $user));
                $this->assertFalse($this->policy->restore($user, $user));
                $this->assertFalse($this->policy->forceDelete($user, $user));
            }
        }
    }

    /**
     * 測試權限方法的返回類型
     */
    public function test_policy_methods_return_boolean(): void
    {
        $result = $this->policy->viewAny($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->view($this->admin, $this->targetUser);
        $this->assertIsBool($result);

        $result = $this->policy->create($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->update($this->admin, $this->targetUser);
        $this->assertIsBool($result);

        $result = $this->policy->assignStores($this->admin, $this->targetUser);
        $this->assertIsBool($result);

        $result = $this->policy->delete($this->admin, $this->targetUser);
        $this->assertIsBool($result);

        $result = $this->policy->restore($this->admin, $this->targetUser);
        $this->assertIsBool($result);

        $result = $this->policy->forceDelete($this->admin, $this->targetUser);
        $this->assertIsBool($result);
    }

    /**
     * 測試策略類別的基本結構
     */
    public function test_policy_class_structure(): void
    {
        $this->assertInstanceOf(UserPolicy::class, $this->policy);
        
        // 檢查所有必要的方法是否存在
        $methods = ['viewAny', 'view', 'create', 'update', 'assignStores', 'delete', 'restore', 'forceDelete'];
        
        foreach ($methods as $method) {
            $this->assertTrue(method_exists($this->policy, $method), "方法 {$method} 不存在");
        }
    }

    /**
     * 測試權限邏輯的邊界情況
     */
    public function test_permission_edge_cases(): void
    {
        // 測試剛創建的用戶（沒有任何角色）
        $newUser = User::factory()->create();
        
        // 沒有角色的用戶只能查看自己
        $this->assertTrue($this->policy->view($newUser, $newUser));
        
        // 其他權限都應該被拒絕
        $this->assertFalse($this->policy->viewAny($newUser));
        $this->assertFalse($this->policy->create($newUser));
        $this->assertFalse($this->policy->update($newUser, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($newUser, $this->targetUser));
        $this->assertFalse($this->policy->delete($newUser, $this->targetUser));
        $this->assertFalse($this->policy->restore($newUser, $this->targetUser));
        $this->assertFalse($this->policy->forceDelete($newUser, $this->targetUser));
        
        // 也不能查看其他用戶
        $this->assertFalse($this->policy->view($newUser, $this->targetUser));
    }

    /**
     * 測試多個管理員之間的操作權限
     */
    public function test_admin_to_admin_operations(): void
    {
        // 創建另一個管理員
        $admin2 = User::factory()->admin()->create();
        
        // 管理員之間可以互相查看、更新、分配分店、恢復
        $this->assertTrue($this->policy->view($this->admin, $admin2));
        $this->assertTrue($this->policy->view($admin2, $this->admin));
        $this->assertTrue($this->policy->update($this->admin, $admin2));
        $this->assertTrue($this->policy->update($admin2, $this->admin));
        $this->assertTrue($this->policy->assignStores($this->admin, $admin2));
        $this->assertTrue($this->policy->assignStores($admin2, $this->admin));
        $this->assertTrue($this->policy->restore($this->admin, $admin2));
        $this->assertTrue($this->policy->restore($admin2, $this->admin));
        
        // 管理員之間可以互相刪除
        $this->assertTrue($this->policy->delete($this->admin, $admin2));
        $this->assertTrue($this->policy->delete($admin2, $this->admin));
        $this->assertTrue($this->policy->forceDelete($this->admin, $admin2));
        $this->assertTrue($this->policy->forceDelete($admin2, $this->admin));
        
        // 但不能刪除自己
        $this->assertFalse($this->policy->delete($this->admin, $this->admin));
        $this->assertFalse($this->policy->delete($admin2, $admin2));
        $this->assertFalse($this->policy->forceDelete($this->admin, $this->admin));
        $this->assertFalse($this->policy->forceDelete($admin2, $admin2));
    }

    /**
     * 測試不同用戶對權限的影響
     */
    public function test_permissions_for_different_users(): void
    {
        // 創建不同角色的用戶
        $user1 = User::factory()->create();
        $user2 = User::factory()->staff()->create();
        
        $users = [$user1, $user2];
        
        // 管理員仍可以對不同用戶執行操作
        foreach ($users as $user) {
            $this->assertTrue($this->policy->view($this->admin, $user));
            $this->assertTrue($this->policy->update($this->admin, $user));
            $this->assertTrue($this->policy->assignStores($this->admin, $user));
            $this->assertTrue($this->policy->restore($this->admin, $user));
            $this->assertTrue($this->policy->forceDelete($this->admin, $user));
        }
        
        // 其他用戶不能操作不同的用戶
        $this->assertFalse($this->policy->view($this->staff, $user1));
        $this->assertFalse($this->policy->update($this->staff, $user1));
        $this->assertFalse($this->policy->assignStores($this->staff, $user1));
        $this->assertFalse($this->policy->restore($this->staff, $user1));
        $this->assertFalse($this->policy->forceDelete($this->staff, $user1));
    }

    /**
     * 測試用戶ID相同性檢查
     */
    public function test_user_id_equality_checks(): void
    {
        // 創建兩個用戶，確保他們的ID不同
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        $this->assertNotEquals($user1->id, $user2->id);
        
        // 用戶只能查看自己
        $this->assertTrue($this->policy->view($user1, $user1));
        $this->assertTrue($this->policy->view($user2, $user2));
        $this->assertFalse($this->policy->view($user1, $user2));
        $this->assertFalse($this->policy->view($user2, $user1));
        
        // 測試管理員的自我刪除限制
        $admin = User::factory()->admin()->create();
        $this->assertFalse($this->policy->delete($admin, $admin));
        $this->assertFalse($this->policy->forceDelete($admin, $admin));
    }

    /**
     * 測試特殊角色組合的權限
     */
    public function test_special_role_combinations(): void
    {
        // 只有 viewer 和 installer 角色的用戶
        $viewerInstaller = User::factory()->create();
        $viewerInstaller->assignRole(['viewer', 'installer']);
        
        // 應該沒有管理權限
        $this->assertFalse($this->policy->viewAny($viewerInstaller));
        $this->assertFalse($this->policy->create($viewerInstaller));
        $this->assertFalse($this->policy->update($viewerInstaller, $this->targetUser));
        $this->assertFalse($this->policy->delete($viewerInstaller, $this->targetUser));
        $this->assertFalse($this->policy->assignStores($viewerInstaller, $this->targetUser));
        
        // 但可以查看自己
        $this->assertTrue($this->policy->view($viewerInstaller, $viewerInstaller));
        
        // 不能查看其他用戶
        $this->assertFalse($this->policy->view($viewerInstaller, $this->targetUser));
    }
}