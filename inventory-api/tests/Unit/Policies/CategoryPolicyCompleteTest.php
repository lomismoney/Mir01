<?php

namespace Tests\Unit\Policies;

use App\Models\Category;
use App\Models\User;
use App\Policies\CategoryPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CategoryPolicy 完整測試
 * 
 * 測試分類權限策略的所有方法和邏輯
 */
class CategoryPolicyCompleteTest extends TestCase
{
    use RefreshDatabase;

    private CategoryPolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new CategoryPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        
        // 創建測試分類
        $this->category = Category::factory()->create();
    }

    /**
     * 測試 viewAny 權限 - 所有認證用戶都可以查看分類列表
     */
    public function test_view_any_allows_all_authenticated_users(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->viewer));
        $this->assertTrue($this->policy->viewAny($this->installer));
    }

    /**
     * 測試 view 權限 - 所有認證用戶都可以查看單一分類
     */
    public function test_view_allows_all_authenticated_users(): void
    {
        $this->assertTrue($this->policy->view($this->admin, $this->category));
        $this->assertTrue($this->policy->view($this->staff, $this->category));
        $this->assertTrue($this->policy->view($this->viewer, $this->category));
        $this->assertTrue($this->policy->view($this->installer, $this->category));
    }

    /**
     * 測試 create 權限 - 只有管理員可以創建分類
     */
    public function test_create_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
    }

    /**
     * 測試 update 權限 - 只有管理員可以更新分類
     */
    public function test_update_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->update($this->admin, $this->category));
        $this->assertFalse($this->policy->update($this->staff, $this->category));
        $this->assertFalse($this->policy->update($this->viewer, $this->category));
        $this->assertFalse($this->policy->update($this->installer, $this->category));
    }

    /**
     * 測試 delete 權限 - 只有管理員可以刪除分類
     */
    public function test_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->delete($this->admin, $this->category));
        $this->assertFalse($this->policy->delete($this->staff, $this->category));
        $this->assertFalse($this->policy->delete($this->viewer, $this->category));
        $this->assertFalse($this->policy->delete($this->installer, $this->category));
    }

    /**
     * 測試 restore 權限 - 只有管理員可以恢復分類
     */
    public function test_restore_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->category));
        $this->assertFalse($this->policy->restore($this->staff, $this->category));
        $this->assertFalse($this->policy->restore($this->viewer, $this->category));
        $this->assertFalse($this->policy->restore($this->installer, $this->category));
    }

    /**
     * 測試 forceDelete 權限 - 只有管理員可以永久刪除分類
     */
    public function test_force_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->category));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->category));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->category));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->category));
    }

    /**
     * 測試 reorder 權限 - 只有管理員可以重新排序分類
     */
    public function test_reorder_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->reorder($this->admin));
        $this->assertFalse($this->policy->reorder($this->staff));
        $this->assertFalse($this->policy->reorder($this->viewer));
        $this->assertFalse($this->policy->reorder($this->installer));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_user_permissions(): void
    {
        // 創建有多個角色的用戶
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer']);

        // 由於有 staff 角色但沒有 admin 角色，應該無法執行管理操作
        $this->assertFalse($this->policy->create($multiRoleUser));
        $this->assertFalse($this->policy->update($multiRoleUser, $this->category));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->category));
        
        // 但可以查看
        $this->assertTrue($this->policy->viewAny($multiRoleUser));
        $this->assertTrue($this->policy->view($multiRoleUser, $this->category));
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
        $this->assertTrue($this->policy->view($adminWithOtherRoles, $this->category));
        $this->assertTrue($this->policy->create($adminWithOtherRoles));
        $this->assertTrue($this->policy->update($adminWithOtherRoles, $this->category));
        $this->assertTrue($this->policy->delete($adminWithOtherRoles, $this->category));
        $this->assertTrue($this->policy->restore($adminWithOtherRoles, $this->category));
        $this->assertTrue($this->policy->forceDelete($adminWithOtherRoles, $this->category));
        $this->assertTrue($this->policy->reorder($adminWithOtherRoles));
    }

    /**
     * 測試不同分類對象的權限一致性
     */
    public function test_permissions_consistent_across_different_categories(): void
    {
        $category1 = Category::factory()->create(['name' => '分類1']);
        $category2 = Category::factory()->create(['name' => '分類2']);
        $category3 = Category::factory()->create(['name' => '分類3']);

        $categories = [$category1, $category2, $category3];

        // 對於不同的分類，相同角色的用戶應該有相同的權限
        foreach ($categories as $cat) {
            // Admin 對所有分類都有完整權限
            $this->assertTrue($this->policy->view($this->admin, $cat));
            $this->assertTrue($this->policy->update($this->admin, $cat));
            $this->assertTrue($this->policy->delete($this->admin, $cat));
            
            // Viewer 對所有分類都只有查看權限
            $this->assertTrue($this->policy->view($this->viewer, $cat));
            $this->assertFalse($this->policy->update($this->viewer, $cat));
            $this->assertFalse($this->policy->delete($this->viewer, $cat));
        }
    }

    /**
     * 測試權限方法的返回類型
     */
    public function test_policy_methods_return_boolean(): void
    {
        $result = $this->policy->viewAny($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->view($this->admin, $this->category);
        $this->assertIsBool($result);

        $result = $this->policy->create($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->update($this->admin, $this->category);
        $this->assertIsBool($result);

        $result = $this->policy->delete($this->admin, $this->category);
        $this->assertIsBool($result);

        $result = $this->policy->restore($this->admin, $this->category);
        $this->assertIsBool($result);

        $result = $this->policy->forceDelete($this->admin, $this->category);
        $this->assertIsBool($result);

        $result = $this->policy->reorder($this->admin);
        $this->assertIsBool($result);
    }

    /**
     * 測試策略類別的基本結構
     */
    public function test_policy_class_structure(): void
    {
        $this->assertInstanceOf(CategoryPolicy::class, $this->policy);
        
        // 檢查所有必要的方法是否存在
        $methods = ['viewAny', 'view', 'create', 'update', 'delete', 'restore', 'forceDelete', 'reorder'];
        
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
        
        // 沒有角色的用戶不應該有管理權限
        $this->assertFalse($this->policy->create($newUser));
        $this->assertFalse($this->policy->update($newUser, $this->category));
        $this->assertFalse($this->policy->delete($newUser, $this->category));
        
        // 但仍應該可以查看（因為 viewAny 和 view 方法返回 true）
        $this->assertTrue($this->policy->viewAny($newUser));
        $this->assertTrue($this->policy->view($newUser, $this->category));
    }

    /**
     * 測試不同分類對權限的影響
     */
    public function test_permissions_for_different_categories(): void
    {
        // 創建不同類型的分類
        $parentCategory = Category::factory()->create(['name' => '父分類']);
        $childCategory = Category::factory()->create([
            'name' => '子分類',
            'parent_id' => $parentCategory->id
        ]);
        
        $categories = [$parentCategory, $childCategory];
        
        // 權限邏輯應該與分類類型無關
        foreach ($categories as $category) {
            $this->assertTrue($this->policy->view($this->admin, $category));
            $this->assertTrue($this->policy->restore($this->admin, $category));
            $this->assertTrue($this->policy->forceDelete($this->admin, $category));
            
            $this->assertFalse($this->policy->restore($this->viewer, $category));
            $this->assertFalse($this->policy->forceDelete($this->viewer, $category));
        }
    }

    /**
     * 測試分類階層結構對權限的影響
     */
    public function test_permissions_for_hierarchical_categories(): void
    {
        // 創建父子分類
        $parentCategory = Category::factory()->create(['name' => '父分類']);
        $childCategory = Category::factory()->create([
            'name' => '子分類',
            'parent_id' => $parentCategory->id
        ]);

        // 權限應該不受分類階層影響
        $this->assertTrue($this->policy->update($this->admin, $parentCategory));
        $this->assertTrue($this->policy->update($this->admin, $childCategory));
        
        $this->assertFalse($this->policy->update($this->viewer, $parentCategory));
        $this->assertFalse($this->policy->update($this->viewer, $childCategory));
    }
}