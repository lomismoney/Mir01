<?php

namespace Tests\Unit\Policies;

use App\Models\Purchase;
use App\Models\User;
use App\Policies\PurchasePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * PurchasePolicy 完整測試
 * 
 * 測試進貨權限策略的所有方法和邏輯
 */
class PurchasePolicyCompleteTest extends TestCase
{
    use RefreshDatabase;

    private PurchasePolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private Purchase $purchase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new PurchasePolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試進貨單
        $this->purchase = Purchase::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 管理員和員工可以查看進貨單列表
     */
    public function test_view_any_allows_admin_and_staff(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertFalse($this->policy->viewAny($this->viewer));
        $this->assertFalse($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 管理員和員工可以查看單一進貨單
     */
    public function test_view_allows_admin_and_staff(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->purchase));
        $this->assertTrue($this->policy->view($this->staff, $this->purchase));
        $this->assertFalse($this->policy->view($this->viewer, $this->purchase));
        $this->assertFalse($this->policy->view($this->installer, $this->purchase));
    }

    /**
     * 測試 create 權限 - 只有管理員可以創建進貨單
     */
    public function test_create_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 只有管理員可以更新進貨單
     */
    public function test_update_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->purchase));
        $this->assertFalse($this->policy->update($this->staff, $this->purchase));
        $this->assertFalse($this->policy->update($this->viewer, $this->purchase));
        $this->assertFalse($this->policy->update($this->installer, $this->purchase));
    }

    /**
     * 測試 delete 權限 - 只有管理員可以刪除進貨單
     */
    public function test_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->purchase));
        $this->assertFalse($this->policy->delete($this->staff, $this->purchase));
        $this->assertFalse($this->policy->delete($this->viewer, $this->purchase));
        $this->assertFalse($this->policy->delete($this->installer, $this->purchase));
    }

    /**
     * 測試 restore 權限 - 只有管理員可以恢復進貨單
     */
    public function test_restore_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->purchase));
        $this->assertFalse($this->policy->restore($this->staff, $this->purchase));
        $this->assertFalse($this->policy->restore($this->viewer, $this->purchase));
        $this->assertFalse($this->policy->restore($this->installer, $this->purchase));
    }

    /**
     * 測試 forceDelete 權限 - 只有管理員可以永久刪除進貨單
     */
    public function test_force_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->purchase));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->purchase));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->purchase));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->purchase));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_user_permissions(): void
    {
        // 創建有多個角色的用戶（包含 staff）
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer']);

        // 由於有 staff 角色，應該可以查看
        $this->assertTrue($this->policy->viewAny($multiRoleUser));
        $this->assertTrue($this->policy->view($multiRoleUser, $this->purchase));
        
        // 但沒有 admin 角色，不能執行管理操作
        $this->assertFalse($this->policy->create($multiRoleUser));
        $this->assertFalse($this->policy->update($multiRoleUser, $this->purchase));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->purchase));
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
        $this->assertTrue($this->policy->view($adminWithOtherRoles, $this->purchase));
        $this->assertTrue($this->policy->create($adminWithOtherRoles));
        $this->assertTrue($this->policy->update($adminWithOtherRoles, $this->purchase));
        $this->assertTrue($this->policy->delete($adminWithOtherRoles, $this->purchase));
        $this->assertTrue($this->policy->restore($adminWithOtherRoles, $this->purchase));
        $this->assertTrue($this->policy->forceDelete($adminWithOtherRoles, $this->purchase));
    }

    /**
     * 測試員工加其他角色（但非管理員）的用戶權限
     */
    public function test_staff_with_other_roles_permissions(): void
    {
        // 創建有員工和其他角色的用戶（但不含管理員）
        $staffWithOtherRoles = User::factory()->create();
        $staffWithOtherRoles->assignRole(['staff', 'viewer', 'installer']);

        // 可以查看
        $this->assertTrue($this->policy->viewAny($staffWithOtherRoles));
        $this->assertTrue($this->policy->view($staffWithOtherRoles, $this->purchase));
        
        // 但不能執行管理操作
        $this->assertFalse($this->policy->create($staffWithOtherRoles));
        $this->assertFalse($this->policy->update($staffWithOtherRoles, $this->purchase));
        $this->assertFalse($this->policy->delete($staffWithOtherRoles, $this->purchase));
        $this->assertFalse($this->policy->restore($staffWithOtherRoles, $this->purchase));
        $this->assertFalse($this->policy->forceDelete($staffWithOtherRoles, $this->purchase));
    }

    /**
     * 測試不同進貨單對象的權限一致性
     */
    public function test_permissions_consistent_across_different_purchases(): void
    {
        $purchase1 = Purchase::factory()->create(['status' => 'pending']);
        $purchase2 = Purchase::factory()->create(['status' => 'completed']);
        $purchase3 = Purchase::factory()->create(['status' => 'cancelled']);

        $purchases = [$purchase1, $purchase2, $purchase3];

        // 對於不同的進貨單，相同角色的用戶應該有相同的權限
        foreach ($purchases as $purchase) {
            // Admin 對所有進貨單都有完整權限
            $this->assertTrue($this->policy->view($this->admin, $purchase));
            $this->assertTrue($this->policy->update($this->admin, $purchase));
            $this->assertTrue($this->policy->delete($this->admin, $purchase));
            
            // Staff 對所有進貨單都只有查看權限
            $this->assertTrue($this->policy->view($this->staff, $purchase));
            $this->assertFalse($this->policy->update($this->staff, $purchase));
            $this->assertFalse($this->policy->delete($this->staff, $purchase));
            
            // Viewer 對所有進貨單都沒有權限
            $this->assertFalse($this->policy->view($this->viewer, $purchase));
            $this->assertFalse($this->policy->update($this->viewer, $purchase));
            $this->assertFalse($this->policy->delete($this->viewer, $purchase));
        }
    }

    /**
     * 測試權限方法的返回類型
     */
    public function test_policy_methods_return_boolean(): void
    {
        $result = $this->policy->viewAny($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->view($this->admin, $this->purchase);
        $this->assertIsBool($result);

        $result = $this->policy->create($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->update($this->admin, $this->purchase);
        $this->assertIsBool($result);

        $result = $this->policy->delete($this->admin, $this->purchase);
        $this->assertIsBool($result);

        $result = $this->policy->restore($this->admin, $this->purchase);
        $this->assertIsBool($result);

        $result = $this->policy->forceDelete($this->admin, $this->purchase);
        $this->assertIsBool($result);
    }

    /**
     * 測試策略類別的基本結構
     */
    public function test_policy_class_structure(): void
    {
        $this->assertInstanceOf(PurchasePolicy::class, $this->policy);
        
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
        
        // 沒有角色的用戶不應該有任何權限
        $this->assertFalse($this->policy->viewAny($newUser));
        $this->assertFalse($this->policy->view($newUser, $this->purchase));
        $this->assertFalse($this->policy->create($newUser));
        $this->assertFalse($this->policy->update($newUser, $this->purchase));
        $this->assertFalse($this->policy->delete($newUser, $this->purchase));
        $this->assertFalse($this->policy->restore($newUser, $this->purchase));
        $this->assertFalse($this->policy->forceDelete($newUser, $this->purchase));
    }

    /**
     * 測試不同進貨單對權限的影響
     */
    public function test_permissions_for_different_purchases(): void
    {
        // 創建不同類型的進貨單
        $purchase1 = Purchase::factory()->create(['status' => 'pending']);
        $purchase2 = Purchase::factory()->create(['status' => 'completed']);
        
        $purchases = [$purchase1, $purchase2];
        
        // 權限邏輯應該與進貨單類型無關
        foreach ($purchases as $purchase) {
            $this->assertTrue($this->policy->view($this->admin, $purchase));
            $this->assertTrue($this->policy->restore($this->admin, $purchase));
            $this->assertTrue($this->policy->forceDelete($this->admin, $purchase));
            
            $this->assertTrue($this->policy->view($this->staff, $purchase));
            $this->assertFalse($this->policy->restore($this->staff, $purchase));
            $this->assertFalse($this->policy->forceDelete($this->staff, $purchase));
            
            $this->assertFalse($this->policy->view($this->viewer, $purchase));
        }
    }

    /**
     * 測試HandlesAuthorization trait的存在
     */
    public function test_handles_authorization_trait(): void
    {
        $traits = class_uses(PurchasePolicy::class);
        $this->assertContains('Illuminate\Auth\Access\HandlesAuthorization', $traits);
    }

    /**
     * 測試不同進貨單狀態下的權限
     */
    public function test_permissions_with_different_purchase_statuses(): void
    {
        $statuses = ['pending', 'confirmed', 'in_transit', 'received', 'completed', 'cancelled'];
        
        foreach ($statuses as $status) {
            $purchase = Purchase::factory()->create(['status' => $status]);
            
            // 權限不應該受進貨單狀態影響
            // 管理員對所有狀態都有完整權限
            $this->assertTrue($this->policy->view($this->admin, $purchase));
            $this->assertTrue($this->policy->update($this->admin, $purchase));
            $this->assertTrue($this->policy->delete($this->admin, $purchase));
            
            // 員工對所有狀態都只有查看權限
            $this->assertTrue($this->policy->view($this->staff, $purchase));
            $this->assertFalse($this->policy->update($this->staff, $purchase));
            $this->assertFalse($this->policy->delete($this->staff, $purchase));
        }
    }

    /**
     * 測試特殊角色組合
     */
    public function test_special_role_combinations(): void
    {
        // 只有 viewer 和 installer 角色的用戶
        $viewerInstaller = User::factory()->create();
        $viewerInstaller->assignRole(['viewer', 'installer']);
        
        $this->assertFalse($this->policy->viewAny($viewerInstaller));
        $this->assertFalse($this->policy->view($viewerInstaller, $this->purchase));
        
        // 只有 installer 角色的用戶
        $onlyInstaller = User::factory()->create();
        $onlyInstaller->assignRole('installer');
        
        $this->assertFalse($this->policy->viewAny($onlyInstaller));
        $this->assertFalse($this->policy->view($onlyInstaller, $this->purchase));
    }
}