<?php

namespace Tests\Unit\Policies;

use App\Models\Installation;
use App\Models\User;
use App\Policies\InstallationPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * InstallationPolicy 完整測試
 * 
 * 測試安裝單權限策略的所有權限檢查方法
 */
class InstallationPolicyTest extends TestCase
{
    use RefreshDatabase;

    private InstallationPolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private Installation $installation;
    private Installation $assignedInstallation;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new InstallationPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試用安裝單
        $this->installation = Installation::factory()->create([
            'status' => 'pending'
        ]);
        
        // 創建分配給安裝師傅的安裝單
        $this->assignedInstallation = Installation::factory()->create([
            'installer_user_id' => $this->installer->id,
            'status' => 'scheduled'
        ]);
    }

    /**
     * 測試 viewAny 權限 - 允許所有角色查看列表
     */
    public function test_view_any_allows_all_roles(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->viewer));
        $this->assertTrue($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 不同角色的查看權限
     */
    public function test_view_permissions_by_role(): void
    {
        // Admin, staff, viewer 可以查看所有安裝單
        $this->assertTrue($this->policy->view($this->admin, $this->installation));
        $this->assertTrue($this->policy->view($this->staff, $this->installation));
        $this->assertTrue($this->policy->view($this->viewer, $this->installation));
        
        // Installer 只能查看分配給自己的安裝單
        $this->assertFalse($this->policy->view($this->installer, $this->installation));
        $this->assertTrue($this->policy->view($this->installer, $this->assignedInstallation));
    }

    /**
     * 測試 create 權限 - 僅允許管理員和員工創建
     */
    public function test_create_allows_admin_and_staff_only(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 不同角色的更新權限
     */
    public function test_update_permissions_by_role(): void
    {
        // Admin 和 staff 可以更新所有安裝單
        $this->assertTrue($this->policy->update($this->admin, $this->installation));
        $this->assertTrue($this->policy->update($this->staff, $this->installation));
        
        // Viewer 不能更新
        $this->assertFalse($this->policy->update($this->viewer, $this->installation));
        
        // Installer 只能更新分配給自己的安裝單
        $this->assertFalse($this->policy->update($this->installer, $this->installation));
        $this->assertTrue($this->policy->update($this->installer, $this->assignedInstallation));
    }

    /**
     * 測試 delete 權限 - 僅允許管理員刪除特定狀態的安裝單
     */
    public function test_delete_allows_admin_for_specific_statuses(): void
    {
        // 創建不同狀態的安裝單
        $pendingInstallation = Installation::factory()->create(['status' => 'pending']);
        $cancelledInstallation = Installation::factory()->create(['status' => 'cancelled']);
        $scheduledInstallation = Installation::factory()->create(['status' => 'scheduled']);
        
        // Admin 可以刪除 pending 和 cancelled 狀態的安裝單
        $this->assertTrue($this->policy->delete($this->admin, $pendingInstallation));
        $this->assertTrue($this->policy->delete($this->admin, $cancelledInstallation));
        $this->assertFalse($this->policy->delete($this->admin, $scheduledInstallation));
        
        // 其他角色不能刪除
        $this->assertFalse($this->policy->delete($this->staff, $pendingInstallation));
        $this->assertFalse($this->policy->delete($this->viewer, $pendingInstallation));
        $this->assertFalse($this->policy->delete($this->installer, $pendingInstallation));
    }

    /**
     * 測試 assignInstaller 權限 - 僅允許管理員和員工分配
     */
    public function test_assign_installer_allows_admin_and_staff_only(): void
    {
        $this->assertTrue($this->policy->assignInstaller($this->admin, $this->installation));
        $this->assertTrue($this->policy->assignInstaller($this->staff, $this->installation));
        $this->assertFalse($this->policy->assignInstaller($this->viewer, $this->installation));
        $this->assertFalse($this->policy->assignInstaller($this->installer, $this->installation));
    }

    /**
     * 測試 updateStatus 權限 - 不同角色的狀態更新權限
     */
    public function test_update_status_permissions_by_role(): void
    {
        // Admin 和 staff 可以更新任何安裝單的狀態
        $this->assertTrue($this->policy->updateStatus($this->admin, $this->installation));
        $this->assertTrue($this->policy->updateStatus($this->staff, $this->installation));
        
        // Viewer 不能更新狀態
        $this->assertFalse($this->policy->updateStatus($this->viewer, $this->installation));
        
        // Installer 只能更新分配給自己的安裝單狀態
        $this->assertFalse($this->policy->updateStatus($this->installer, $this->installation));
        $this->assertTrue($this->policy->updateStatus($this->installer, $this->assignedInstallation));
    }

    /**
     * 測試 createFromOrder 權限 - 僅允許管理員和員工
     */
    public function test_create_from_order_allows_admin_and_staff_only(): void
    {
        $this->assertTrue($this->policy->createFromOrder($this->admin));
        $this->assertTrue($this->policy->createFromOrder($this->staff));
        $this->assertFalse($this->policy->createFromOrder($this->viewer));
        $this->assertFalse($this->policy->createFromOrder($this->installer));
    }

    /**
     * 測試 cancel 權限 - 需要模擬 canBeCancelled 方法
     */
    public function test_cancel_permissions(): void
    {
        // 創建可以取消的安裝單（模擬 canBeCancelled 返回 true）
        $mockInstallation = $this->createMock(Installation::class);
        $mockInstallation->method('canBeCancelled')->willReturn(true);
        
        // Admin 和 staff 可以取消
        $this->assertTrue($this->policy->cancel($this->admin, $mockInstallation));
        $this->assertTrue($this->policy->cancel($this->staff, $mockInstallation));
        
        // Viewer 和 installer 不能取消
        $this->assertFalse($this->policy->cancel($this->viewer, $mockInstallation));
        $this->assertFalse($this->policy->cancel($this->installer, $mockInstallation));
        
        // 創建不能取消的安裝單
        $mockInstallation2 = $this->createMock(Installation::class);
        $mockInstallation2->method('canBeCancelled')->willReturn(false);
        
        // 即使是 admin 也不能取消不可取消的安裝單
        $this->assertFalse($this->policy->cancel($this->admin, $mockInstallation2));
    }

    /**
     * 測試安裝師傅權限的完整性
     */
    public function test_installer_permissions_consistency(): void
    {
        // 安裝師傅對於分配給自己的安裝單
        $this->assertTrue($this->policy->view($this->installer, $this->assignedInstallation));
        $this->assertTrue($this->policy->update($this->installer, $this->assignedInstallation));
        $this->assertTrue($this->policy->updateStatus($this->installer, $this->assignedInstallation));
        
        // 但不能執行管理操作
        $this->assertFalse($this->policy->create($this->installer));
        $this->assertFalse($this->policy->delete($this->installer, $this->assignedInstallation));
        $this->assertFalse($this->policy->assignInstaller($this->installer, $this->assignedInstallation));
        $this->assertFalse($this->policy->createFromOrder($this->installer));
    }

    /**
     * 測試管理員權限的完整性
     */
    public function test_admin_permissions_completeness(): void
    {
        // 管理員應該可以執行所有操作（除了不能刪除特定狀態的安裝單）
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->view($this->admin, $this->installation));
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->update($this->admin, $this->installation));
        $this->assertTrue($this->policy->assignInstaller($this->admin, $this->installation));
        $this->assertTrue($this->policy->updateStatus($this->admin, $this->installation));
        $this->assertTrue($this->policy->createFromOrder($this->admin));
    }

    /**
     * 測試用戶角色變更時的權限變化
     */
    public function test_permissions_change_with_role_updates(): void
    {
        $user = User::factory()->viewer()->create();
        
        // 檢視者只能查看
        $this->assertTrue($this->policy->viewAny($user));
        $this->assertTrue($this->policy->view($user, $this->installation));
        $this->assertFalse($this->policy->create($user));
        
        // 提升為員工 - 可以創建和修改
        $user->syncRoles(['staff']);
        $this->assertTrue($this->policy->create($user));
        $this->assertTrue($this->policy->update($user, $this->installation));
        $this->assertTrue($this->policy->assignInstaller($user, $this->installation));
        
        // 提升為管理員 - 獲得完整權限
        $user->syncRoles(['admin']);
        $this->assertTrue($this->policy->delete($user, $this->installation));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole(['installer', 'staff']);
        
        // 擁有多個角色的用戶應該有最高權限
        $this->assertTrue($this->policy->create($user));
        $this->assertTrue($this->policy->update($user, $this->installation));
        $this->assertTrue($this->policy->assignInstaller($user, $this->installation));
    }
}