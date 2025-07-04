<?php

namespace Tests\Unit;

use App\Models\Installation;
use App\Models\User;
use App\Models\Customer;
use App\Models\Order;
use App\Policies\InstallationPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InstallationPolicy 測試類
 * 
 * 測試安裝工程權限控制的所有邏輯
 */
class InstallationPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected InstallationPolicy $policy;
    protected User $admin;
    protected User $staff;
    protected User $viewer;
    protected User $installer;
    protected User $pureInstaller;
    protected Installation $installation;

    /**
     * 在每個測試前設定測試資料
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new InstallationPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        
        $this->staff = User::factory()->create();
        $this->staff->assignRole('staff');
        
        $this->viewer = User::factory()->create();
        $this->viewer->assignRole('viewer');
        
        $this->installer = User::factory()->create();
        $this->installer->assignRole(['staff', 'installer']);
        
        $this->pureInstaller = User::factory()->create();
        $this->pureInstaller->assignRole('installer');
        
        // 創建測試安裝工程
        $customer = Customer::factory()->create();
        $order = Order::factory()->create(['customer_id' => $customer->id]);
        
        $this->installation = Installation::factory()->create([
            'order_id' => $order->id,
            'installer_user_id' => $this->pureInstaller->id,
            'created_by' => $this->admin->id
        ]);
    }

    /**
     * 測試查看所有安裝工程的權限
     */
    public function test_view_any_installations(): void
    {
        // 管理員可以查看所有安裝工程
        $this->assertTrue($this->policy->viewAny($this->admin));
        
        // 員工可以查看所有安裝工程
        $this->assertTrue($this->policy->viewAny($this->staff));
        
        // 檢視者可以查看所有安裝工程
        $this->assertTrue($this->policy->viewAny($this->viewer));
        
        // 兼職安裝師傅可以查看安裝工程
        $this->assertTrue($this->policy->viewAny($this->installer));
        
        // 純安裝師傅也可以查看安裝工程
        $this->assertTrue($this->policy->viewAny($this->pureInstaller));
    }

    /**
     * 測試查看特定安裝工程的權限
     */
    public function test_view_specific_installation(): void
    {
        // 管理員可以查看任何安裝工程
        $this->assertTrue($this->policy->view($this->admin, $this->installation));
        
        // 員工可以查看任何安裝工程
        $this->assertTrue($this->policy->view($this->staff, $this->installation));
        
        // 檢視者可以查看任何安裝工程
        $this->assertTrue($this->policy->view($this->viewer, $this->installation));
        
        // 兼職安裝師傅（有員工角色）可以查看任何安裝工程
        $this->assertTrue($this->policy->view($this->installer, $this->installation));
        
        // 純安裝師傅可以查看自己負責的安裝工程
        $this->assertTrue($this->policy->view($this->pureInstaller, $this->installation));
        
        // 純安裝師傅不能查看其他師傅的安裝工程
        $otherInstallation = Installation::factory()->create([
            'installer_user_id' => $this->admin->id
        ]);
        $this->assertFalse($this->policy->view($this->pureInstaller, $otherInstallation));
    }

    /**
     * 測試創建安裝工程的權限
     */
    public function test_create_installation(): void
    {
        // 管理員可以創建安裝工程
        $this->assertTrue($this->policy->create($this->admin));
        
        // 員工可以創建安裝工程
        $this->assertTrue($this->policy->create($this->staff));
        
        // 檢視者不能創建安裝工程
        $this->assertFalse($this->policy->create($this->viewer));
        
        // 兼職安裝師傅可以創建安裝工程（因為有員工角色）
        $this->assertTrue($this->policy->create($this->installer));
        
        // 純安裝師傅不能創建安裝工程
        $this->assertFalse($this->policy->create($this->pureInstaller));
    }

    /**
     * 測試更新安裝工程的權限
     */
    public function test_update_installation(): void
    {
        // 管理員可以更新任何安裝工程
        $this->assertTrue($this->policy->update($this->admin, $this->installation));
        
        // 員工可以更新任何安裝工程
        $this->assertTrue($this->policy->update($this->staff, $this->installation));
        
        // 檢視者不能更新安裝工程
        $this->assertFalse($this->policy->update($this->viewer, $this->installation));
        
        // 兼職安裝師傅可以更新任何安裝工程（因為有員工角色）
        $this->assertTrue($this->policy->update($this->installer, $this->installation));
        
        // 純安裝師傅可以更新自己負責的安裝工程
        $this->assertTrue($this->policy->update($this->pureInstaller, $this->installation));
        
        // 純安裝師傅不能更新其他師傅的安裝工程
        $otherInstallation = Installation::factory()->create([
            'installer_user_id' => $this->admin->id
        ]);
        $this->assertFalse($this->policy->update($this->pureInstaller, $otherInstallation));
    }

    /**
     * 測試刪除安裝工程的權限
     */
    public function test_delete_installation(): void
    {
        // 只有管理員可以刪除pending狀態的安裝工程
        $pendingInstallation = Installation::factory()->create(['status' => 'pending']);
        $this->assertTrue($this->policy->delete($this->admin, $pendingInstallation));
        
        // 只有管理員可以刪除cancelled狀態的安裝工程
        $cancelledInstallation = Installation::factory()->create(['status' => 'cancelled']);
        $this->assertTrue($this->policy->delete($this->admin, $cancelledInstallation));
        
        // 管理員不能刪除completed狀態的安裝工程
        $completedInstallation = Installation::factory()->create(['status' => 'completed']);
        $this->assertFalse($this->policy->delete($this->admin, $completedInstallation));
        
        // 員工不能刪除安裝工程
        $this->assertFalse($this->policy->delete($this->staff, $pendingInstallation));
        
        // 檢視者不能刪除安裝工程
        $this->assertFalse($this->policy->delete($this->viewer, $pendingInstallation));
        
        // 安裝師傅不能刪除安裝工程
        $this->assertFalse($this->policy->delete($this->installer, $pendingInstallation));
        $this->assertFalse($this->policy->delete($this->pureInstaller, $pendingInstallation));
    }

    /**
     * 測試分配安裝師傅的權限
     */
    public function test_assign_installer(): void
    {
        // 管理員可以分配安裝師傅
        $this->assertTrue($this->policy->assignInstaller($this->admin, $this->installation));
        
        // 員工可以分配安裝師傅
        $this->assertTrue($this->policy->assignInstaller($this->staff, $this->installation));
        
        // 檢視者不能分配安裝師傅
        $this->assertFalse($this->policy->assignInstaller($this->viewer, $this->installation));
        
        // 兼職安裝師傅可以分配安裝師傅（因為有員工角色）
        $this->assertTrue($this->policy->assignInstaller($this->installer, $this->installation));
        
        // 純安裝師傅不能分配安裝師傅
        $this->assertFalse($this->policy->assignInstaller($this->pureInstaller, $this->installation));
    }

    /**
     * 測試更新安裝狀態的權限
     */
    public function test_update_status(): void
    {
        // 管理員可以更新任何安裝工程的狀態
        $this->assertTrue($this->policy->updateStatus($this->admin, $this->installation));
        
        // 員工可以更新任何安裝工程的狀態
        $this->assertTrue($this->policy->updateStatus($this->staff, $this->installation));
        
        // 檢視者不能更新安裝狀態
        $this->assertFalse($this->policy->updateStatus($this->viewer, $this->installation));
        
        // 兼職安裝師傅可以更新任何安裝工程的狀態（因為有員工角色）
        $this->assertTrue($this->policy->updateStatus($this->installer, $this->installation));
        
        // 純安裝師傅可以更新自己負責的安裝工程狀態
        $this->assertTrue($this->policy->updateStatus($this->pureInstaller, $this->installation));
        
        // 純安裝師傅不能更新其他師傅的安裝工程狀態
        $otherInstallation = Installation::factory()->create([
            'installer_user_id' => $this->admin->id
        ]);
        $this->assertFalse($this->policy->updateStatus($this->pureInstaller, $otherInstallation));
    }

    /**
     * 測試從訂單創建安裝工程的權限
     */
    public function test_create_from_order(): void
    {
        // 管理員可以從訂單創建安裝工程
        $this->assertTrue($this->policy->createFromOrder($this->admin));
        
        // 員工可以從訂單創建安裝工程
        $this->assertTrue($this->policy->createFromOrder($this->staff));
        
        // 檢視者不能從訂單創建安裝工程
        $this->assertFalse($this->policy->createFromOrder($this->viewer));
        
        // 兼職安裝師傅可以從訂單創建安裝工程（因為有員工角色）
        $this->assertTrue($this->policy->createFromOrder($this->installer));
        
        // 純安裝師傅不能從訂單創建安裝工程
        $this->assertFalse($this->policy->createFromOrder($this->pureInstaller));
    }

    /**
     * 測試取消安裝工程的權限
     */
    public function test_cancel_installation(): void
    {
        // 創建可以取消的安裝工程（pending狀態）
        $pendingInstallation = Installation::factory()->create(['status' => 'pending']);
        
        // 管理員可以取消安裝工程
        $this->assertTrue($this->policy->cancel($this->admin, $pendingInstallation));
        
        // 員工可以取消安裝工程
        $this->assertTrue($this->policy->cancel($this->staff, $pendingInstallation));
        
        // 檢視者不能取消安裝工程
        $this->assertFalse($this->policy->cancel($this->viewer, $pendingInstallation));
        
        // 兼職安裝師傅可以取消安裝工程（因為有員工角色）
        $this->assertTrue($this->policy->cancel($this->installer, $pendingInstallation));
        
        // 純安裝師傅不能取消安裝工程
        $this->assertFalse($this->policy->cancel($this->pureInstaller, $pendingInstallation));
        
        // 不能取消已完成的安裝工程（即使是管理員）
        $completedInstallation = Installation::factory()->create(['status' => 'completed']);
        $this->assertFalse($this->policy->cancel($this->admin, $completedInstallation));
    }

    /**
     * 測試無角色用戶的權限
     */
    public function test_user_without_roles(): void
    {
        $userWithoutRoles = User::factory()->create();
        
        // 沒有角色的用戶不應該有任何權限
        $this->assertFalse($this->policy->viewAny($userWithoutRoles));
        $this->assertFalse($this->policy->view($userWithoutRoles, $this->installation));
        $this->assertFalse($this->policy->create($userWithoutRoles));
        $this->assertFalse($this->policy->update($userWithoutRoles, $this->installation));
        $this->assertFalse($this->policy->delete($userWithoutRoles, $this->installation));
        $this->assertFalse($this->policy->assignInstaller($userWithoutRoles, $this->installation));
        $this->assertFalse($this->policy->updateStatus($userWithoutRoles, $this->installation));
        $this->assertFalse($this->policy->createFromOrder($userWithoutRoles));
        $this->assertFalse($this->policy->cancel($userWithoutRoles, $this->installation));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multi_role_user_permissions(): void
    {
        // 創建擁有多個角色的用戶
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer', 'viewer']);
        
        // 多角色用戶應該擁有最高權限（基於staff角色）
        $this->assertTrue($this->policy->viewAny($multiRoleUser));
        $this->assertTrue($this->policy->view($multiRoleUser, $this->installation));
        $this->assertTrue($this->policy->create($multiRoleUser));
        $this->assertTrue($this->policy->update($multiRoleUser, $this->installation));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->installation)); // 只有管理員能刪除
        $this->assertTrue($this->policy->assignInstaller($multiRoleUser, $this->installation));
        $this->assertTrue($this->policy->updateStatus($multiRoleUser, $this->installation));
        $this->assertTrue($this->policy->createFromOrder($multiRoleUser));
        
        $pendingInstallation = Installation::factory()->create(['status' => 'pending']);
        $this->assertTrue($this->policy->cancel($multiRoleUser, $pendingInstallation));
    }

    /**
     * 測試權限層級順序
     */
    public function test_permission_hierarchy(): void
    {
        // 管理員 > 員工 > 純安裝師傅 > 檢視者
        
        // 管理員有最高權限
        $adminPermissions = $this->countUserPermissions($this->admin);
        
        // 員工權限次之
        $staffPermissions = $this->countUserPermissions($this->staff);
        
        // 純安裝師傅權限再次之（可以更新自己的安裝工程）
        $pureInstallerPermissions = $this->countUserPermissions($this->pureInstaller);
        
        // 檢視者權限最少（只能查看）
        $viewerPermissions = $this->countUserPermissions($this->viewer);
        
        $this->assertGreaterThan($staffPermissions, $adminPermissions);
        $this->assertGreaterThan($pureInstallerPermissions, $staffPermissions);
        $this->assertGreaterThan($viewerPermissions, $pureInstallerPermissions);
    }

    /**
     * 計算用戶的總權限數量（輔助方法）
     */
    private function countUserPermissions(User $user): int
    {
        $permissions = 0;
        $pendingInstallation = Installation::factory()->create(['status' => 'pending']);
        
        if ($this->policy->viewAny($user)) $permissions++;
        if ($this->policy->view($user, $this->installation)) $permissions++;
        if ($this->policy->create($user)) $permissions++;
        if ($this->policy->update($user, $this->installation)) $permissions++;
        if ($this->policy->delete($user, $pendingInstallation)) $permissions++;
        if ($this->policy->assignInstaller($user, $this->installation)) $permissions++;
        if ($this->policy->updateStatus($user, $this->installation)) $permissions++;
        if ($this->policy->createFromOrder($user)) $permissions++;
        if ($this->policy->cancel($user, $pendingInstallation)) $permissions++;
        
        return $permissions;
    }
} 