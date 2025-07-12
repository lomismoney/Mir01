<?php

namespace Tests\Unit\Policies;

use Tests\TestCase;
use App\Models\Product;
use App\Models\User;
use App\Policies\ProductPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class ProductPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected ProductPolicy $policy;
    protected User $adminUser;
    protected User $staffUser;
    protected User $viewerUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new ProductPolicy();
        
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
     * 測試查看商品列表權限
     */
    public function test_view_any_permissions()
    {
        // 所有用戶都可以查看商品列表
        $this->assertTrue($this->policy->viewAny($this->adminUser));
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->viewAny($this->viewerUser));
        $this->assertTrue($this->policy->viewAny($this->regularUser));
    }

    /**
     * 測試查看單個商品權限
     */
    public function test_view_permissions()
    {
        $product = Product::factory()->create();
        
        // 所有用戶都可以查看單個商品
        $this->assertTrue($this->policy->view($this->adminUser, $product));
        $this->assertTrue($this->policy->view($this->staffUser, $product));
        $this->assertTrue($this->policy->view($this->viewerUser, $product));
        $this->assertTrue($this->policy->view($this->regularUser, $product));
    }

    /**
     * 測試創建商品權限
     */
    public function test_create_permissions()
    {
        // 管理員和職員可以創建商品
        $this->assertTrue($this->policy->create($this->adminUser));
        $this->assertTrue($this->policy->create($this->staffUser));
        
        // 檢視員和一般用戶不能創建商品
        $this->assertFalse($this->policy->create($this->viewerUser));
        $this->assertFalse($this->policy->create($this->regularUser));
    }

    /**
     * 測試更新商品權限
     */
    public function test_update_permissions()
    {
        $product = Product::factory()->create();
        
        // 管理員和職員可以更新商品
        $this->assertTrue($this->policy->update($this->adminUser, $product));
        $this->assertTrue($this->policy->update($this->staffUser, $product));
        
        // 檢視員和一般用戶不能更新商品
        $this->assertFalse($this->policy->update($this->viewerUser, $product));
        $this->assertFalse($this->policy->update($this->regularUser, $product));
    }

    /**
     * 測試刪除商品權限
     */
    public function test_delete_permissions()
    {
        $product = Product::factory()->create();
        
        // 管理員和職員可以刪除商品
        $this->assertTrue($this->policy->delete($this->adminUser, $product));
        $this->assertTrue($this->policy->delete($this->staffUser, $product));
        
        // 檢視員和一般用戶不能刪除商品
        $this->assertFalse($this->policy->delete($this->viewerUser, $product));
        $this->assertFalse($this->policy->delete($this->regularUser, $product));
    }

    /**
     * 測試批量刪除權限（deleteAny）
     */
    public function test_delete_any_permissions()
    {
        // 管理員和職員可以批量刪除商品
        $this->assertTrue($this->policy->deleteAny($this->adminUser));
        $this->assertTrue($this->policy->deleteAny($this->staffUser));
        
        // 檢視員和一般用戶不能批量刪除商品
        $this->assertFalse($this->policy->deleteAny($this->viewerUser));
        $this->assertFalse($this->policy->deleteAny($this->regularUser));
    }

    /**
     * 測試批量刪除權限（deleteMultiple）
     */
    public function test_delete_multiple_permissions()
    {
        // 管理員和職員可以批量刪除商品
        $this->assertTrue($this->policy->deleteMultiple($this->adminUser));
        $this->assertTrue($this->policy->deleteMultiple($this->staffUser));
        
        // 檢視員和一般用戶不能批量刪除商品
        $this->assertFalse($this->policy->deleteMultiple($this->viewerUser));
        $this->assertFalse($this->policy->deleteMultiple($this->regularUser));
    }

    /**
     * 測試恢復商品權限
     */
    public function test_restore_permissions()
    {
        $product = Product::factory()->create();
        
        // 只有管理員可以恢復商品
        $this->assertTrue($this->policy->restore($this->adminUser, $product));
        
        // 其他用戶不能恢復商品
        $this->assertFalse($this->policy->restore($this->staffUser, $product));
        $this->assertFalse($this->policy->restore($this->viewerUser, $product));
        $this->assertFalse($this->policy->restore($this->regularUser, $product));
    }

    /**
     * 測試永久刪除商品權限
     */
    public function test_force_delete_permissions()
    {
        $product = Product::factory()->create();
        
        // 只有管理員可以永久刪除商品
        $this->assertTrue($this->policy->forceDelete($this->adminUser, $product));
        
        // 其他用戶不能永久刪除商品
        $this->assertFalse($this->policy->forceDelete($this->staffUser, $product));
        $this->assertFalse($this->policy->forceDelete($this->viewerUser, $product));
        $this->assertFalse($this->policy->forceDelete($this->regularUser, $product));
    }

    /**
     * 測試匯出商品資料權限
     */
    public function test_export_permissions()
    {
        // 所有用戶都可以匯出商品資料
        $this->assertTrue($this->policy->export($this->adminUser));
        $this->assertTrue($this->policy->export($this->staffUser));
        $this->assertTrue($this->policy->export($this->viewerUser));
        $this->assertTrue($this->policy->export($this->regularUser));
    }

    /**
     * 測試匯入商品資料權限
     */
    public function test_import_permissions()
    {
        // 只有管理員可以匯入商品資料
        $this->assertTrue($this->policy->import($this->adminUser));
        
        // 其他用戶不能匯入商品資料
        $this->assertFalse($this->policy->import($this->staffUser));
        $this->assertFalse($this->policy->import($this->viewerUser));
        $this->assertFalse($this->policy->import($this->regularUser));
    }

    /**
     * 測試 Policy 可以正確實例化
     */
    public function test_policy_can_be_instantiated()
    {
        $this->assertInstanceOf(ProductPolicy::class, $this->policy);
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
        $this->assertTrue(method_exists($this->policy, 'deleteAny'));
        $this->assertTrue(method_exists($this->policy, 'deleteMultiple'));
        $this->assertTrue(method_exists($this->policy, 'restore'));
        $this->assertTrue(method_exists($this->policy, 'forceDelete'));
        $this->assertTrue(method_exists($this->policy, 'export'));
        $this->assertTrue(method_exists($this->policy, 'import'));
    }

    /**
     * 測試 Policy 方法返回正確類型
     */
    public function test_policy_methods_return_correct_types()
    {
        $product = Product::factory()->create();
        
        $this->assertIsBool($this->policy->viewAny($this->adminUser));
        $this->assertIsBool($this->policy->view($this->adminUser, $product));
        $this->assertIsBool($this->policy->create($this->adminUser));
        $this->assertIsBool($this->policy->update($this->adminUser, $product));
        $this->assertIsBool($this->policy->delete($this->adminUser, $product));
        $this->assertIsBool($this->policy->deleteAny($this->adminUser));
        $this->assertIsBool($this->policy->deleteMultiple($this->adminUser));
        $this->assertIsBool($this->policy->restore($this->adminUser, $product));
        $this->assertIsBool($this->policy->forceDelete($this->adminUser, $product));
        $this->assertIsBool($this->policy->export($this->adminUser));
        $this->assertIsBool($this->policy->import($this->adminUser));
    }

    /**
     * 測試權限層級結構
     */
    public function test_permission_hierarchy()
    {
        $product = Product::factory()->create();
        
        // 管理員權限：最高，所有操作
        $this->assertTrue($this->policy->viewAny($this->adminUser));
        $this->assertTrue($this->policy->create($this->adminUser));
        $this->assertTrue($this->policy->update($this->adminUser, $product));
        $this->assertTrue($this->policy->delete($this->adminUser, $product));
        $this->assertTrue($this->policy->deleteAny($this->adminUser));
        $this->assertTrue($this->policy->deleteMultiple($this->adminUser));
        $this->assertTrue($this->policy->restore($this->adminUser, $product));
        $this->assertTrue($this->policy->forceDelete($this->adminUser, $product));
        $this->assertTrue($this->policy->import($this->adminUser));
        
        // 職員權限：中等，基本 CRUD
        $this->assertTrue($this->policy->viewAny($this->staffUser));
        $this->assertTrue($this->policy->create($this->staffUser));
        $this->assertTrue($this->policy->update($this->staffUser, $product));
        $this->assertTrue($this->policy->delete($this->staffUser, $product));
        $this->assertTrue($this->policy->deleteAny($this->staffUser));
        $this->assertTrue($this->policy->deleteMultiple($this->staffUser));
        $this->assertFalse($this->policy->restore($this->staffUser, $product));
        $this->assertFalse($this->policy->forceDelete($this->staffUser, $product));
        $this->assertFalse($this->policy->import($this->staffUser));
        
        // 檢視員權限：最低，只能查看
        $this->assertTrue($this->policy->viewAny($this->viewerUser));
        $this->assertTrue($this->policy->view($this->viewerUser, $product));
        $this->assertTrue($this->policy->export($this->viewerUser));
        $this->assertFalse($this->policy->create($this->viewerUser));
        $this->assertFalse($this->policy->update($this->viewerUser, $product));
        $this->assertFalse($this->policy->delete($this->viewerUser, $product));
        $this->assertFalse($this->policy->deleteAny($this->viewerUser));
        $this->assertFalse($this->policy->deleteMultiple($this->viewerUser));
    }

    /**
     * 測試沒有角色的用戶權限
     */
    public function test_user_without_role_permissions()
    {
        $product = Product::factory()->create();
        
        // 沒有角色的用戶只能查看和匯出
        $this->assertTrue($this->policy->viewAny($this->regularUser));
        $this->assertTrue($this->policy->view($this->regularUser, $product));
        $this->assertTrue($this->policy->export($this->regularUser));
        
        // 不能進行其他操作
        $this->assertFalse($this->policy->create($this->regularUser));
        $this->assertFalse($this->policy->update($this->regularUser, $product));
        $this->assertFalse($this->policy->delete($this->regularUser, $product));
        $this->assertFalse($this->policy->deleteAny($this->regularUser));
        $this->assertFalse($this->policy->deleteMultiple($this->regularUser));
        $this->assertFalse($this->policy->restore($this->regularUser, $product));
        $this->assertFalse($this->policy->forceDelete($this->regularUser, $product));
        $this->assertFalse($this->policy->import($this->regularUser));
    }

    /**
     * 測試批量操作一致性
     */
    public function test_batch_operations_consistency()
    {
        // deleteAny 和 deleteMultiple 應該有相同的權限邏輯
        $this->assertEquals(
            $this->policy->deleteAny($this->adminUser),
            $this->policy->deleteMultiple($this->adminUser)
        );
        
        $this->assertEquals(
            $this->policy->deleteAny($this->staffUser),
            $this->policy->deleteMultiple($this->staffUser)
        );
        
        $this->assertEquals(
            $this->policy->deleteAny($this->viewerUser),
            $this->policy->deleteMultiple($this->viewerUser)
        );
    }

    /**
     * 測試多個商品的權限一致性
     */
    public function test_multiple_products_consistency()
    {
        $product1 = Product::factory()->create();
        $product2 = Product::factory()->create();
        
        // 同一用戶對不同商品應該有相同的權限
        $this->assertEquals(
            $this->policy->view($this->adminUser, $product1),
            $this->policy->view($this->adminUser, $product2)
        );
        
        $this->assertEquals(
            $this->policy->delete($this->staffUser, $product1),
            $this->policy->delete($this->staffUser, $product2)
        );
        
        $this->assertEquals(
            $this->policy->restore($this->viewerUser, $product1),
            $this->policy->restore($this->viewerUser, $product2)
        );
    }

    /**
     * 測試商品策略命名空間
     */
    public function test_policy_namespace()
    {
        $reflection = new \ReflectionClass($this->policy);
        $this->assertEquals('App\Policies', $reflection->getNamespaceName());
    }

    /**
     * 測試商品策略使用的模型
     */
    public function test_policy_uses_correct_models()
    {
        $reflection = new \ReflectionClass($this->policy);
        $fileName = $reflection->getFileName();
        $content = file_get_contents($fileName);
        
        $this->assertStringContainsString('use App\Models\Product;', $content);
        $this->assertStringContainsString('use App\Models\User;', $content);
    }
}