<?php

namespace Tests\Unit\Policies;

use App\Models\AttributeValue;
use App\Models\User;
use App\Policies\AttributeValuePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * AttributeValuePolicy 完整測試
 * 
 * 測試商品屬性值權限策略的所有權限檢查方法
 */
class AttributeValuePolicyTest extends TestCase
{
    use RefreshDatabase;

    private AttributeValuePolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private AttributeValue $attributeValue;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new AttributeValuePolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試用屬性值
        $this->attributeValue = AttributeValue::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 允許員工和管理員查看列表
     */
    public function test_view_any_allows_staff_and_admin(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertFalse($this->policy->viewAny($this->viewer));
        $this->assertFalse($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 允許員工和管理員查看特定屬性值
     */
    public function test_view_allows_staff_and_admin(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->attributeValue));
        $this->assertTrue($this->policy->view($this->staff, $this->attributeValue));
        $this->assertFalse($this->policy->view($this->viewer, $this->attributeValue));
        $this->assertFalse($this->policy->view($this->installer, $this->attributeValue));
    }

    /**
     * 測試 create 權限 - 僅允許管理員創建
     */
    public function test_create_allows_only_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 僅允許管理員更新
     */
    public function test_update_allows_only_admin(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->attributeValue));
        $this->assertFalse($this->policy->update($this->staff, $this->attributeValue));
        $this->assertFalse($this->policy->update($this->viewer, $this->attributeValue));
        $this->assertFalse($this->policy->update($this->installer, $this->attributeValue));
    }

    /**
     * 測試 delete 權限 - 僅允許管理員刪除
     */
    public function test_delete_allows_only_admin(): void
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->attributeValue));
        $this->assertFalse($this->policy->delete($this->staff, $this->attributeValue));
        $this->assertFalse($this->policy->delete($this->viewer, $this->attributeValue));
        $this->assertFalse($this->policy->delete($this->installer, $this->attributeValue));
    }

    /**
     * 測試 restore 權限 - 僅允許管理員恢復
     */
    public function test_restore_allows_only_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->attributeValue));
        $this->assertFalse($this->policy->restore($this->staff, $this->attributeValue));
        $this->assertFalse($this->policy->restore($this->viewer, $this->attributeValue));
        $this->assertFalse($this->policy->restore($this->installer, $this->attributeValue));
    }

    /**
     * 測試 forceDelete 權限 - 僅允許管理員永久刪除
     */
    public function test_force_delete_allows_only_admin(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->attributeValue));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->attributeValue));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->attributeValue));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->attributeValue));
    }

    /**
     * 測試用戶角色變更時的權限變化
     */
    public function test_permissions_change_with_role_updates(): void
    {
        $user = User::factory()->viewer()->create();
        
        // 檢視者不能創建
        $this->assertFalse($this->policy->create($user));
        
        // 提升為員工 - 仍不能創建但可以查看
        $user->syncRoles(['staff']);
        $this->assertFalse($this->policy->create($user));
        $this->assertTrue($this->policy->viewAny($user));
        
        // 提升為管理員 - 可以執行所有操作
        $user->syncRoles(['admin']);
        $this->assertTrue($this->policy->create($user));
        $this->assertTrue($this->policy->update($user, $this->attributeValue));
        $this->assertTrue($this->policy->delete($user, $this->attributeValue));
    }

    /**
     * 測試所有 CRUD 權限的一致性
     */
    public function test_crud_permissions_consistency(): void
    {
        $users = [
            'admin' => $this->admin,
            'staff' => $this->staff,
            'viewer' => $this->viewer,
            'installer' => $this->installer,
        ];

        foreach ($users as $roleName => $user) {
            $canView = $this->policy->view($user, $this->attributeValue);
            $canViewAny = $this->policy->viewAny($user);
            
            // 如果可以查看特定項目，也應該可以查看列表
            if ($canView) {
                $this->assertTrue($canViewAny, "User $roleName should be able to view list if can view item");
            }
            
            // 只有管理員可以進行寫操作
            if ($roleName === 'admin') {
                $this->assertTrue($this->policy->create($user));
                $this->assertTrue($this->policy->update($user, $this->attributeValue));
                $this->assertTrue($this->policy->delete($user, $this->attributeValue));
            } else {
                $this->assertFalse($this->policy->create($user));
                $this->assertFalse($this->policy->update($user, $this->attributeValue));
                $this->assertFalse($this->policy->delete($user, $this->attributeValue));
            }
        }
    }
}