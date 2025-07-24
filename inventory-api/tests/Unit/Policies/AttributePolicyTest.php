<?php

namespace Tests\Unit\Policies;

use App\Models\Attribute;
use App\Models\User;
use App\Policies\AttributePolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttributePolicyTest extends TestCase
{
    use RefreshDatabase;

    protected AttributePolicy $policy;
    protected User $adminUser;
    protected User $staffUser;
    protected User $regularUser;
    protected Attribute $attribute;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new AttributePolicy();
        
        // 確保角色存在 - 使用 guard_name
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        
        // 創建用戶
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');
        
        $this->staffUser = User::factory()->create();
        $this->staffUser->assignRole('staff');
        
        $this->regularUser = User::factory()->create();
        
        // 創建屬性
        $this->attribute = Attribute::factory()->create();
    }

    public function test_policy_can_be_instantiated(): void
    {
        $this->assertInstanceOf(AttributePolicy::class, $this->policy);
    }

    public function test_before_method_returns_true_for_admin(): void
    {
        $result = $this->policy->before($this->adminUser, 'viewAny');
        $this->assertTrue($result);
    }

    public function test_before_method_returns_null_for_non_admin(): void
    {
        $result = $this->policy->before($this->staffUser, 'viewAny');
        $this->assertNull($result);
        
        $result = $this->policy->before($this->regularUser, 'viewAny');
        $this->assertNull($result);
    }

    public function test_admin_can_view_any_attributes(): void
    {
        // before() 方法會先被調用並返回 true
        $this->assertTrue($this->policy->before($this->adminUser, 'viewAny'));
        $this->assertTrue($this->policy->viewAny($this->adminUser));
    }

    public function test_all_users_can_view_any_attributes(): void
    {
        $this->assertTrue($this->policy->viewAny($this->adminUser));
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->viewAny($this->regularUser));
    }

    public function test_admin_can_view_specific_attribute(): void
    {
        // before() 方法會先被調用並返回 true
        $this->assertTrue($this->policy->before($this->adminUser, 'view'));
        $this->assertTrue($this->policy->view($this->adminUser, $this->attribute));
    }

    public function test_all_users_can_view_specific_attribute(): void
    {
        $this->assertTrue($this->policy->view($this->adminUser, $this->attribute));
        $this->assertTrue($this->policy->view($this->staffUser, $this->attribute));
        $this->assertTrue($this->policy->view($this->regularUser, $this->attribute));
    }

    public function test_admin_can_create_attribute(): void
    {
        // before() 方法會先被調用並返回 true，所以管理員可以創建
        $this->assertTrue($this->policy->before($this->adminUser, 'create'));
    }

    public function test_non_admin_cannot_create_attribute(): void
    {
        $this->assertFalse($this->policy->create($this->staffUser));
        $this->assertFalse($this->policy->create($this->regularUser));
    }

    public function test_admin_can_update_attribute(): void
    {
        // before() 方法會先被調用並返回 true，所以管理員可以更新
        $this->assertTrue($this->policy->before($this->adminUser, 'update'));
    }

    public function test_non_admin_cannot_update_attribute(): void
    {
        $this->assertFalse($this->policy->update($this->staffUser, $this->attribute));
        $this->assertFalse($this->policy->update($this->regularUser, $this->attribute));
    }

    public function test_admin_can_delete_attribute(): void
    {
        // before() 方法會先被調用並返回 true，所以管理員可以刪除
        $this->assertTrue($this->policy->before($this->adminUser, 'delete'));
    }

    public function test_non_admin_cannot_delete_attribute(): void
    {
        $this->assertFalse($this->policy->delete($this->staffUser, $this->attribute));
        $this->assertFalse($this->policy->delete($this->regularUser, $this->attribute));
    }

    public function test_admin_can_restore_attribute(): void
    {
        // before() 方法會先被調用並返回 true，所以管理員可以恢復
        $this->assertTrue($this->policy->before($this->adminUser, 'restore'));
    }

    public function test_non_admin_cannot_restore_attribute(): void
    {
        $this->assertFalse($this->policy->restore($this->staffUser, $this->attribute));
        $this->assertFalse($this->policy->restore($this->regularUser, $this->attribute));
    }

    public function test_admin_can_force_delete_attribute(): void
    {
        // before() 方法會先被調用並返回 true，所以管理員可以永久刪除
        $this->assertTrue($this->policy->before($this->adminUser, 'forceDelete'));
    }

    public function test_non_admin_cannot_force_delete_attribute(): void
    {
        $this->assertFalse($this->policy->forceDelete($this->staffUser, $this->attribute));
        $this->assertFalse($this->policy->forceDelete($this->regularUser, $this->attribute));
    }

    public function test_policy_methods_exist(): void
    {
        $this->assertTrue(method_exists($this->policy, 'before'));
        $this->assertTrue(method_exists($this->policy, 'viewAny'));
        $this->assertTrue(method_exists($this->policy, 'view'));
        $this->assertTrue(method_exists($this->policy, 'create'));
        $this->assertTrue(method_exists($this->policy, 'update'));
        $this->assertTrue(method_exists($this->policy, 'delete'));
        $this->assertTrue(method_exists($this->policy, 'restore'));
        $this->assertTrue(method_exists($this->policy, 'forceDelete'));
    }

    public function test_policy_methods_return_correct_types(): void
    {
        // before() 方法返回 bool|null
        $result = $this->policy->before($this->adminUser, 'viewAny');
        $this->assertTrue(is_bool($result) || is_null($result));
        
        // 其他方法返回 bool
        $this->assertIsBool($this->policy->viewAny($this->adminUser));
        $this->assertIsBool($this->policy->view($this->adminUser, $this->attribute));
        $this->assertIsBool($this->policy->create($this->adminUser));
        $this->assertIsBool($this->policy->update($this->adminUser, $this->attribute));
        $this->assertIsBool($this->policy->delete($this->adminUser, $this->attribute));
        $this->assertIsBool($this->policy->restore($this->adminUser, $this->attribute));
        $this->assertIsBool($this->policy->forceDelete($this->adminUser, $this->attribute));
    }

    public function test_policy_namespace(): void
    {
        $reflection = new \ReflectionClass($this->policy);
        $this->assertEquals('App\Policies', $reflection->getNamespaceName());
    }

    public function test_policy_uses_correct_models(): void
    {
        $reflection = new \ReflectionClass($this->policy);
        $fileName = $reflection->getFileName();
        $content = file_get_contents($fileName);
        
        $this->assertStringContainsString('use App\Models\Attribute;', $content);
        $this->assertStringContainsString('use App\Models\User;', $content);
    }

    public function test_policy_class_has_correct_docblock(): void
    {
        $reflection = new \ReflectionClass($this->policy);
        $docComment = $reflection->getDocComment();
        
        $this->assertStringContainsString('AttributePolicy 權限策略', $docComment);
        $this->assertStringContainsString('管理商品屬性的存取權限', $docComment);
    }

    public function test_policy_methods_have_correct_docblocks(): void
    {
        $reflection = new \ReflectionClass($this->policy);
        
        $beforeMethod = $reflection->getMethod('before');
        $beforeDocComment = $beforeMethod->getDocComment();
        $this->assertStringContainsString('全域權限檢查', $beforeDocComment);
        
        $viewAnyMethod = $reflection->getMethod('viewAny');
        $viewAnyDocComment = $viewAnyMethod->getDocComment();
        $this->assertStringContainsString('檢查使用者是否可以查看屬性列表', $viewAnyDocComment);
        
        $viewMethod = $reflection->getMethod('view');
        $viewDocComment = $viewMethod->getDocComment();
        $this->assertStringContainsString('檢查使用者是否可以查看特定屬性', $viewDocComment);
    }

    public function test_before_method_with_different_abilities(): void
    {
        $abilities = ['viewAny', 'view', 'create', 'update', 'delete', 'restore', 'forceDelete'];
        
        foreach ($abilities as $ability) {
            $this->assertTrue($this->policy->before($this->adminUser, $ability));
            $this->assertNull($this->policy->before($this->staffUser, $ability));
            $this->assertNull($this->policy->before($this->regularUser, $ability));
        }
    }

    public function test_policy_behavior_consistency(): void
    {
        // 測試所有非管理員用戶的行為一致性
        $nonAdminUsers = [$this->staffUser, $this->regularUser];
        
        foreach ($nonAdminUsers as $user) {
            // 這些方法對所有用戶返回 true
            $this->assertTrue($this->policy->viewAny($user));
            $this->assertTrue($this->policy->view($user, $this->attribute));
            
            // 這些方法對非管理員返回 false
            $this->assertFalse($this->policy->create($user));
            $this->assertFalse($this->policy->update($user, $this->attribute));
            $this->assertFalse($this->policy->delete($user, $this->attribute));
            $this->assertFalse($this->policy->restore($user, $this->attribute));
            $this->assertFalse($this->policy->forceDelete($user, $this->attribute));
        }
    }

    public function test_policy_with_multiple_attributes(): void
    {
        $attribute2 = Attribute::factory()->create();
        
        // 測試同樣的權限邏輯適用於所有屬性
        $this->assertTrue($this->policy->view($this->adminUser, $attribute2));
        $this->assertTrue($this->policy->view($this->staffUser, $attribute2));
        $this->assertTrue($this->policy->view($this->regularUser, $attribute2));
        
        $this->assertFalse($this->policy->delete($this->staffUser, $attribute2));
        $this->assertFalse($this->policy->delete($this->regularUser, $attribute2));
    }

    public function test_policy_permission_levels(): void
    {
        // 測試權限層級
        // 管理員：所有權限
        $this->assertTrue($this->policy->before($this->adminUser, 'create'));
        $this->assertTrue($this->policy->before($this->adminUser, 'update'));
        $this->assertTrue($this->policy->before($this->adminUser, 'delete'));
        
        // 職員：只有查看權限
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->view($this->staffUser, $this->attribute));
        $this->assertFalse($this->policy->create($this->staffUser));
        
        // 一般用戶：只有查看權限
        $this->assertTrue($this->policy->viewAny($this->regularUser));
        $this->assertTrue($this->policy->view($this->regularUser, $this->attribute));
        $this->assertFalse($this->policy->create($this->regularUser));
    }
}