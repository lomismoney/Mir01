<?php

namespace Tests\Unit\Policies;

use App\Models\Store;
use App\Models\User;
use App\Policies\StorePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * StorePolicy 完整測試
 * 
 * 測試門市權限策略的所有方法和邏輯
 */
class StorePolicyCompleteTest extends TestCase
{
    use RefreshDatabase;

    private StorePolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new StorePolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試門市
        $this->store = Store::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 所有用戶都可以查看門市列表
     */
    public function test_view_any_allows_all_users(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->viewer));
        $this->assertTrue($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 所有用戶都可以查看單一門市
     */
    public function test_view_allows_all_users(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->store));
        $this->assertTrue($this->policy->view($this->staff, $this->store));
        $this->assertTrue($this->policy->view($this->viewer, $this->store));
        $this->assertTrue($this->policy->view($this->installer, $this->store));
    }

    /**
     * 測試 create 權限 - 只有管理員可以創建門市
     */
    public function test_create_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 只有管理員可以更新門市
     */
    public function test_update_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->store));
        $this->assertFalse($this->policy->update($this->staff, $this->store));
        $this->assertFalse($this->policy->update($this->viewer, $this->store));
        $this->assertFalse($this->policy->update($this->installer, $this->store));
    }

    /**
     * 測試 delete 權限 - 只有管理員可以刪除門市
     */
    public function test_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->store));
        $this->assertFalse($this->policy->delete($this->staff, $this->store));
        $this->assertFalse($this->policy->delete($this->viewer, $this->store));
        $this->assertFalse($this->policy->delete($this->installer, $this->store));
    }

    /**
     * 測試 restore 權限 - 只有管理員可以恢復門市
     */
    public function test_restore_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->store));
        $this->assertFalse($this->policy->restore($this->staff, $this->store));
        $this->assertFalse($this->policy->restore($this->viewer, $this->store));
        $this->assertFalse($this->policy->restore($this->installer, $this->store));
    }

    /**
     * 測試 forceDelete 權限 - 只有管理員可以永久刪除門市
     */
    public function test_force_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->store));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->store));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->store));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->store));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_user_permissions(): void
    {
        // 創建有多個角色的用戶
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer']);

        // 由於沒有 admin 角色，應該無法執行管理操作
        $this->assertFalse($this->policy->create($multiRoleUser));
        $this->assertFalse($this->policy->update($multiRoleUser, $this->store));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->store));
        
        // 但可以查看
        $this->assertTrue($this->policy->viewAny($multiRoleUser));
        $this->assertTrue($this->policy->view($multiRoleUser, $this->store));
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
        $this->assertTrue($this->policy->view($adminWithOtherRoles, $this->store));
        $this->assertTrue($this->policy->create($adminWithOtherRoles));
        $this->assertTrue($this->policy->update($adminWithOtherRoles, $this->store));
        $this->assertTrue($this->policy->delete($adminWithOtherRoles, $this->store));
        $this->assertTrue($this->policy->restore($adminWithOtherRoles, $this->store));
        $this->assertTrue($this->policy->forceDelete($adminWithOtherRoles, $this->store));
    }

    /**
     * 測試不同門市對象的權限一致性
     */
    public function test_permissions_consistent_across_different_stores(): void
    {
        $store1 = Store::factory()->create(['name' => '門市1']);
        $store2 = Store::factory()->create(['name' => '門市2']);
        $store3 = Store::factory()->create(['name' => '門市3']);

        $stores = [$store1, $store2, $store3];

        // 對於不同的門市，相同角色的用戶應該有相同的權限
        foreach ($stores as $store) {
            // Admin 對所有門市都有完整權限
            $this->assertTrue($this->policy->view($this->admin, $store));
            $this->assertTrue($this->policy->update($this->admin, $store));
            $this->assertTrue($this->policy->delete($this->admin, $store));
            
            // Staff 對所有門市都只有查看權限
            $this->assertTrue($this->policy->view($this->staff, $store));
            $this->assertFalse($this->policy->update($this->staff, $store));
            $this->assertFalse($this->policy->delete($this->staff, $store));
            
            // Viewer 對所有門市都只有查看權限
            $this->assertTrue($this->policy->view($this->viewer, $store));
            $this->assertFalse($this->policy->update($this->viewer, $store));
            $this->assertFalse($this->policy->delete($this->viewer, $store));
            
            // Installer 對所有門市都只有查看權限
            $this->assertTrue($this->policy->view($this->installer, $store));
            $this->assertFalse($this->policy->update($this->installer, $store));
            $this->assertFalse($this->policy->delete($this->installer, $store));
        }
    }

    /**
     * 測試權限方法的返回類型
     */
    public function test_policy_methods_return_boolean(): void
    {
        $result = $this->policy->viewAny($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->view($this->admin, $this->store);
        $this->assertIsBool($result);

        $result = $this->policy->create($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->update($this->admin, $this->store);
        $this->assertIsBool($result);

        $result = $this->policy->delete($this->admin, $this->store);
        $this->assertIsBool($result);

        $result = $this->policy->restore($this->admin, $this->store);
        $this->assertIsBool($result);

        $result = $this->policy->forceDelete($this->admin, $this->store);
        $this->assertIsBool($result);
    }

    /**
     * 測試策略類別的基本結構
     */
    public function test_policy_class_structure(): void
    {
        $this->assertInstanceOf(StorePolicy::class, $this->policy);
        
        // 檢查所有必要的方法是否存在
        $methods = ['viewAny', 'view', 'create', 'update', 'delete', 'restore', 'forceDelete'];
        
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
        
        // 沒有角色的用戶仍可以查看（因為策略返回 true）
        $this->assertTrue($this->policy->viewAny($newUser));
        $this->assertTrue($this->policy->view($newUser, $this->store));
        
        // 但不能執行管理操作
        $this->assertFalse($this->policy->create($newUser));
        $this->assertFalse($this->policy->update($newUser, $this->store));
        $this->assertFalse($this->policy->delete($newUser, $this->store));
        $this->assertFalse($this->policy->restore($newUser, $this->store));
        $this->assertFalse($this->policy->forceDelete($newUser, $this->store));
    }

    /**
     * 測試不同門市對權限的影響
     */
    public function test_permissions_for_different_stores(): void
    {
        // 創建不同類型的門市
        $store1 = Store::factory()->create(['name' => '總店']);
        $store2 = Store::factory()->create(['name' => '分店']);
        
        $stores = [$store1, $store2];
        
        // 權限邏輯應該與門市類型無關
        foreach ($stores as $store) {
            $this->assertTrue($this->policy->view($this->admin, $store));
            $this->assertTrue($this->policy->restore($this->admin, $store));
            $this->assertTrue($this->policy->forceDelete($this->admin, $store));
            
            $this->assertTrue($this->policy->view($this->staff, $store));
            $this->assertFalse($this->policy->restore($this->staff, $store));
            $this->assertFalse($this->policy->forceDelete($this->staff, $store));
            
            $this->assertTrue($this->policy->view($this->viewer, $store));
            $this->assertFalse($this->policy->restore($this->viewer, $store));
            $this->assertFalse($this->policy->forceDelete($this->viewer, $store));
        }
    }

    /**
     * 測試特殊角色組合的權限
     */
    public function test_special_role_combinations(): void
    {
        // 只有 viewer 和 installer 角色的用戶
        $viewerInstaller = User::factory()->create();
        $viewerInstaller->assignRole(['viewer', 'installer']);
        
        // 可以查看但不能管理
        $this->assertTrue($this->policy->viewAny($viewerInstaller));
        $this->assertTrue($this->policy->view($viewerInstaller, $this->store));
        $this->assertFalse($this->policy->create($viewerInstaller));
        $this->assertFalse($this->policy->update($viewerInstaller, $this->store));
        $this->assertFalse($this->policy->delete($viewerInstaller, $this->store));
        
        // 只有 installer 角色的用戶
        $onlyInstaller = User::factory()->create();
        $onlyInstaller->assignRole('installer');
        
        // 同樣可以查看但不能管理
        $this->assertTrue($this->policy->viewAny($onlyInstaller));
        $this->assertTrue($this->policy->view($onlyInstaller, $this->store));
        $this->assertFalse($this->policy->create($onlyInstaller));
        $this->assertFalse($this->policy->update($onlyInstaller, $this->store));
        $this->assertFalse($this->policy->delete($onlyInstaller, $this->store));
    }

    /**
     * 測試門市基本屬性對權限的影響
     */
    public function test_permissions_with_different_store_attributes(): void
    {
        // 創建不同屬性的門市
        $store1 = Store::factory()->create(['name' => '總店']);
        $store2 = Store::factory()->create(['name' => '分店']);
        
        $stores = [$store1, $store2];
        
        // 權限不應該受門市屬性影響
        foreach ($stores as $store) {
            // 管理員對所有門市都有完整權限
            $this->assertTrue($this->policy->view($this->admin, $store));
            $this->assertTrue($this->policy->update($this->admin, $store));
            $this->assertTrue($this->policy->delete($this->admin, $store));
            
            // 其他角色對所有門市都只有查看權限
            $this->assertTrue($this->policy->view($this->staff, $store));
            $this->assertFalse($this->policy->update($this->staff, $store));
            $this->assertFalse($this->policy->delete($this->staff, $store));
        }
    }

    /**
     * 測試門市地址對權限的影響
     */
    public function test_permissions_with_different_store_addresses(): void
    {
        // 創建有不同地址的門市
        $store1 = Store::factory()->create([
            'name' => '總店',
            'address' => '台北市信義區'
        ]);
        
        $store2 = Store::factory()->create([
            'name' => '分店',
            'address' => '台中市西區'
        ]);
        
        $stores = [$store1, $store2];
        
        // 權限不應該受門市地址影響
        foreach ($stores as $store) {
            $this->assertTrue($this->policy->view($this->admin, $store));
            $this->assertTrue($this->policy->update($this->admin, $store));
            $this->assertTrue($this->policy->delete($this->admin, $store));
            
            $this->assertTrue($this->policy->view($this->staff, $store));
            $this->assertFalse($this->policy->update($this->staff, $store));
            $this->assertFalse($this->policy->delete($this->staff, $store));
        }
    }

    /**
     * 測試查看權限的普遍性
     */
    public function test_view_permissions_universality(): void
    {
        // 創建各種不同的用戶
        $users = [
            User::factory()->create(), // 無角色
            User::factory()->create()->assignRole('admin'),
            User::factory()->create()->assignRole('staff'),
            User::factory()->create()->assignRole('viewer'),
            User::factory()->create()->assignRole('installer'),
            User::factory()->create()->assignRole(['staff', 'viewer']),
            User::factory()->create()->assignRole(['admin', 'staff', 'viewer', 'installer'])
        ];
        
        // 所有用戶都應該能查看門市
        foreach ($users as $user) {
            $this->assertTrue($this->policy->viewAny($user));
            $this->assertTrue($this->policy->view($user, $this->store));
        }
    }
}