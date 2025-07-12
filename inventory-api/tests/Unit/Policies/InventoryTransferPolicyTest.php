<?php

namespace Tests\Unit\Policies;

use App\Models\InventoryTransfer;
use App\Models\User;
use App\Policies\InventoryTransferPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InventoryTransferPolicy 完整測試
 * 
 * 測試庫存轉移權限策略的所有權限檢查方法
 */
class InventoryTransferPolicyTest extends TestCase
{
    use RefreshDatabase;

    private InventoryTransferPolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private InventoryTransfer $inventoryTransfer;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new InventoryTransferPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試用庫存轉移
        $this->inventoryTransfer = InventoryTransfer::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 允許 admin, manager, staff, viewer 查看列表
     */
    public function test_view_any_allows_authorized_users(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->viewer));
        $this->assertFalse($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 允許 admin, manager, staff, viewer 查看特定轉移記錄
     */
    public function test_view_allows_authorized_users(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->inventoryTransfer));
        $this->assertTrue($this->policy->view($this->staff, $this->inventoryTransfer));
        $this->assertTrue($this->policy->view($this->viewer, $this->inventoryTransfer));
        $this->assertFalse($this->policy->view($this->installer, $this->inventoryTransfer));
    }

    /**
     * 測試 create 權限 - 僅允許管理員創建
     */
    public function test_create_allows_only_admin_and_manager(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 僅允許管理員和經理更新
     */
    public function test_update_allows_only_admin_and_manager(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->inventoryTransfer));
        $this->assertFalse($this->policy->update($this->staff, $this->inventoryTransfer));
        $this->assertFalse($this->policy->update($this->viewer, $this->inventoryTransfer));
        $this->assertFalse($this->policy->update($this->installer, $this->inventoryTransfer));
    }

    /**
     * 測試 cancel 權限 - 僅允許管理員和經理取消
     */
    public function test_cancel_allows_only_admin_and_manager(): void
    {
        $this->assertTrue($this->policy->cancel($this->admin, $this->inventoryTransfer));
        $this->assertFalse($this->policy->cancel($this->staff, $this->inventoryTransfer));
        $this->assertFalse($this->policy->cancel($this->viewer, $this->inventoryTransfer));
        $this->assertFalse($this->policy->cancel($this->installer, $this->inventoryTransfer));
    }

    /**
     * 測試 manager 角色的權限（需要創建 manager 用戶）
     */
    public function test_manager_role_permissions(): void
    {
        // 先確保 manager 角色存在
        if (!\Spatie\Permission\Models\Role::where('name', 'manager')->exists()) {
            \Spatie\Permission\Models\Role::create(['name' => 'manager']);
        }
        
        // 創建 manager 角色的用戶
        $manager = User::factory()->create();
        $manager->assignRole('manager');
        
        $this->assertTrue($this->policy->viewAny($manager));
        $this->assertTrue($this->policy->view($manager, $this->inventoryTransfer));
        $this->assertTrue($this->policy->create($manager));
        $this->assertTrue($this->policy->update($manager, $this->inventoryTransfer));
        $this->assertTrue($this->policy->cancel($manager, $this->inventoryTransfer));
    }

    /**
     * 測試用戶角色變更時的權限變化
     */
    public function test_permissions_change_with_role_updates(): void
    {
        $user = User::factory()->viewer()->create();
        
        // 檢視者只能查看，不能創建或修改
        $this->assertTrue($this->policy->viewAny($user));
        $this->assertTrue($this->policy->view($user, $this->inventoryTransfer));
        $this->assertFalse($this->policy->create($user));
        $this->assertFalse($this->policy->update($user, $this->inventoryTransfer));
        
        // 提升為員工 - 仍然只能查看
        $user->syncRoles(['staff']);
        $this->assertTrue($this->policy->viewAny($user));
        $this->assertFalse($this->policy->create($user));
        
        // 提升為管理員 - 可以執行所有操作
        $user->syncRoles(['admin']);
        $this->assertTrue($this->policy->create($user));
        $this->assertTrue($this->policy->update($user, $this->inventoryTransfer));
        $this->assertTrue($this->policy->cancel($user, $this->inventoryTransfer));
    }

    /**
     * 測試所有權限方法的一致性
     */
    public function test_permissions_consistency(): void
    {
        $users = [
            'admin' => $this->admin,
            'staff' => $this->staff,
            'viewer' => $this->viewer,
            'installer' => $this->installer,
        ];

        foreach ($users as $roleName => $user) {
            $canView = $this->policy->view($user, $this->inventoryTransfer);
            $canViewAny = $this->policy->viewAny($user);
            $canCreate = $this->policy->create($user);
            $canUpdate = $this->policy->update($user, $this->inventoryTransfer);
            $canCancel = $this->policy->cancel($user, $this->inventoryTransfer);
            
            // 如果可以查看特定項目，也應該可以查看列表
            if ($canView) {
                $this->assertTrue($canViewAny, "User $roleName should be able to view list if can view item");
            }
            
            // 如果可以更新或取消，也應該可以創建
            if ($canUpdate || $canCancel) {
                $this->assertTrue($canCreate, "User $roleName should be able to create if can update or cancel");
            }
            
            // 只有管理員和經理可以進行寫操作
            if ($roleName === 'admin') {
                $this->assertTrue($canCreate, "Admin should be able to create");
                $this->assertTrue($canUpdate, "Admin should be able to update");
                $this->assertTrue($canCancel, "Admin should be able to cancel");
            } elseif ($roleName === 'manager') {
                // Manager 在實際的 policy 中也有寫權限，但這個測試用戶沒有 manager 角色
                $this->assertFalse($canCreate, "Test $roleName should not be able to create");
                $this->assertFalse($canUpdate, "Test $roleName should not be able to update");
                $this->assertFalse($canCancel, "Test $roleName should not be able to cancel");
            } else {
                $this->assertFalse($canCreate, "Non-admin/manager $roleName should not be able to create");
                $this->assertFalse($canUpdate, "Non-admin/manager $roleName should not be able to update");
                $this->assertFalse($canCancel, "Non-admin/manager $roleName should not be able to cancel");
            }
        }
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole(['staff', 'admin']);
        
        // 擁有多個角色的用戶應該有最高權限
        $this->assertTrue($this->policy->viewAny($user));
        $this->assertTrue($this->policy->view($user, $this->inventoryTransfer));
        $this->assertTrue($this->policy->create($user));
        $this->assertTrue($this->policy->update($user, $this->inventoryTransfer));
        $this->assertTrue($this->policy->cancel($user, $this->inventoryTransfer));
    }
}