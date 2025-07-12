<?php

namespace Tests\Unit\Policies;

use Tests\TestCase;
use App\Models\Customer;
use App\Models\User;
use App\Policies\CustomerPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class CustomerPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected CustomerPolicy $policy;
    protected User $adminUser;
    protected User $staffUser;
    protected User $viewerUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new CustomerPolicy();
        
        // 創建角色
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'viewer']);
        
        // 創建用戶
        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');
        
        $this->staffUser = User::factory()->create();
        $this->staffUser->assignRole('staff');
        
        $this->viewerUser = User::factory()->create();
        $this->viewerUser->assignRole('viewer');
        
        $this->regularUser = User::factory()->create();
    }

    /**
     * 測試查看客戶列表權限
     */
    public function test_view_any_permissions()
    {
        // 所有用戶都可以查看客戶列表
        $this->assertTrue($this->policy->viewAny($this->adminUser));
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->viewAny($this->viewerUser));
        $this->assertTrue($this->policy->viewAny($this->regularUser));
    }

    /**
     * 測試查看單個客戶權限
     */
    public function test_view_permissions()
    {
        $customer = Customer::factory()->create();
        
        // 所有用戶都可以查看單個客戶
        $this->assertTrue($this->policy->view($this->adminUser, $customer));
        $this->assertTrue($this->policy->view($this->staffUser, $customer));
        $this->assertTrue($this->policy->view($this->viewerUser, $customer));
        $this->assertTrue($this->policy->view($this->regularUser, $customer));
    }

    /**
     * 測試創建客戶權限
     */
    public function test_create_permissions()
    {
        // 管理員和職員可以創建客戶
        $this->assertTrue($this->policy->create($this->adminUser));
        $this->assertTrue($this->policy->create($this->staffUser));
        
        // 檢視員和一般用戶不能創建客戶
        $this->assertFalse($this->policy->create($this->viewerUser));
        $this->assertFalse($this->policy->create($this->regularUser));
    }

    /**
     * 測試更新客戶權限
     */
    public function test_update_permissions()
    {
        $customer = Customer::factory()->create();
        
        // 管理員和職員可以更新客戶
        $this->assertTrue($this->policy->update($this->adminUser, $customer));
        $this->assertTrue($this->policy->update($this->staffUser, $customer));
        
        // 檢視員和一般用戶不能更新客戶
        $this->assertFalse($this->policy->update($this->viewerUser, $customer));
        $this->assertFalse($this->policy->update($this->regularUser, $customer));
    }

    /**
     * 測試刪除客戶權限
     */
    public function test_delete_permissions()
    {
        $customer = Customer::factory()->create();
        
        // 管理員和職員可以刪除客戶
        $this->assertTrue($this->policy->delete($this->adminUser, $customer));
        $this->assertTrue($this->policy->delete($this->staffUser, $customer));
        
        // 檢視員和一般用戶不能刪除客戶
        $this->assertFalse($this->policy->delete($this->viewerUser, $customer));
        $this->assertFalse($this->policy->delete($this->regularUser, $customer));
    }

    /**
     * 測試恢復客戶權限
     */
    public function test_restore_permissions()
    {
        $customer = Customer::factory()->create();
        
        // 只有管理員可以恢復客戶
        $this->assertTrue($this->policy->restore($this->adminUser, $customer));
        
        // 其他用戶不能恢復客戶
        $this->assertFalse($this->policy->restore($this->staffUser, $customer));
        $this->assertFalse($this->policy->restore($this->viewerUser, $customer));
        $this->assertFalse($this->policy->restore($this->regularUser, $customer));
    }

    /**
     * 測試永久刪除客戶權限
     */
    public function test_force_delete_permissions()
    {
        $customer = Customer::factory()->create();
        
        // 只有管理員可以永久刪除客戶
        $this->assertTrue($this->policy->forceDelete($this->adminUser, $customer));
        
        // 其他用戶不能永久刪除客戶
        $this->assertFalse($this->policy->forceDelete($this->staffUser, $customer));
        $this->assertFalse($this->policy->forceDelete($this->viewerUser, $customer));
        $this->assertFalse($this->policy->forceDelete($this->regularUser, $customer));
    }

    /**
     * 測試批量刪除客戶權限
     */
    public function test_delete_multiple_permissions()
    {
        // 只有管理員可以批量刪除客戶
        $this->assertTrue($this->policy->deleteMultiple($this->adminUser));
        
        // 其他用戶不能批量刪除客戶
        $this->assertFalse($this->policy->deleteMultiple($this->staffUser));
        $this->assertFalse($this->policy->deleteMultiple($this->viewerUser));
        $this->assertFalse($this->policy->deleteMultiple($this->regularUser));
    }

    /**
     * 測試匯出客戶資料權限
     */
    public function test_export_permissions()
    {
        // 所有用戶都可以匯出客戶資料
        $this->assertTrue($this->policy->export($this->adminUser));
        $this->assertTrue($this->policy->export($this->staffUser));
        $this->assertTrue($this->policy->export($this->viewerUser));
        $this->assertTrue($this->policy->export($this->regularUser));
    }

    /**
     * 測試匯入客戶資料權限
     */
    public function test_import_permissions()
    {
        // 只有管理員可以匯入客戶資料
        $this->assertTrue($this->policy->import($this->adminUser));
        
        // 其他用戶不能匯入客戶資料
        $this->assertFalse($this->policy->import($this->staffUser));
        $this->assertFalse($this->policy->import($this->viewerUser));
        $this->assertFalse($this->policy->import($this->regularUser));
    }

    /**
     * 測試 Policy 可以正確實例化
     */
    public function test_policy_can_be_instantiated()
    {
        $this->assertInstanceOf(CustomerPolicy::class, $this->policy);
    }

    /**
     * 測試所有 Policy 方法存在
     */
    public function test_policy_methods_exist()
    {
        $this->assertTrue(method_exists($this->policy, 'viewAny'));
        $this->assertTrue(method_exists($this->policy, 'view'));
        $this->assertTrue(method_exists($this->policy, 'create'));
        $this->assertTrue(method_exists($this->policy, 'update'));
        $this->assertTrue(method_exists($this->policy, 'delete'));
        $this->assertTrue(method_exists($this->policy, 'restore'));
        $this->assertTrue(method_exists($this->policy, 'forceDelete'));
        $this->assertTrue(method_exists($this->policy, 'deleteMultiple'));
        $this->assertTrue(method_exists($this->policy, 'export'));
        $this->assertTrue(method_exists($this->policy, 'import'));
    }

    /**
     * 測試 Policy 方法返回正確類型
     */
    public function test_policy_methods_return_correct_types()
    {
        $customer = Customer::factory()->create();
        
        $this->assertIsBool($this->policy->viewAny($this->adminUser));
        $this->assertIsBool($this->policy->view($this->adminUser, $customer));
        $this->assertIsBool($this->policy->create($this->adminUser));
        $this->assertIsBool($this->policy->update($this->adminUser, $customer));
        $this->assertIsBool($this->policy->delete($this->adminUser, $customer));
        $this->assertIsBool($this->policy->restore($this->adminUser, $customer));
        $this->assertIsBool($this->policy->forceDelete($this->adminUser, $customer));
        $this->assertIsBool($this->policy->deleteMultiple($this->adminUser));
        $this->assertIsBool($this->policy->export($this->adminUser));
        $this->assertIsBool($this->policy->import($this->adminUser));
    }

    /**
     * 測試權限層級結構
     */
    public function test_permission_hierarchy()
    {
        $customer = Customer::factory()->create();
        
        // 管理員權限：最高，所有操作
        $this->assertTrue($this->policy->viewAny($this->adminUser));
        $this->assertTrue($this->policy->create($this->adminUser));
        $this->assertTrue($this->policy->update($this->adminUser, $customer));
        $this->assertTrue($this->policy->delete($this->adminUser, $customer));
        $this->assertTrue($this->policy->restore($this->adminUser, $customer));
        $this->assertTrue($this->policy->forceDelete($this->adminUser, $customer));
        $this->assertTrue($this->policy->deleteMultiple($this->adminUser));
        $this->assertTrue($this->policy->import($this->adminUser));
        
        // 職員權限：中等，基本 CRUD
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->create($this->staffUser));
        $this->assertTrue($this->policy->update($this->staffUser, $customer));
        $this->assertTrue($this->policy->delete($this->staffUser, $customer));
        $this->assertFalse($this->policy->restore($this->staffUser, $customer));
        $this->assertFalse($this->policy->forceDelete($this->staffUser, $customer));
        $this->assertFalse($this->policy->deleteMultiple($this->staffUser));
        $this->assertFalse($this->policy->import($this->staffUser));
        
        // 檢視員權限：最低，只能查看
        $this->assertTrue($this->policy->viewAny($this->viewerUser));
        $this->assertTrue($this->policy->view($this->viewerUser, $customer));
        $this->assertTrue($this->policy->export($this->viewerUser));
        $this->assertFalse($this->policy->create($this->viewerUser));
        $this->assertFalse($this->policy->update($this->viewerUser, $customer));
        $this->assertFalse($this->policy->delete($this->viewerUser, $customer));
    }
}