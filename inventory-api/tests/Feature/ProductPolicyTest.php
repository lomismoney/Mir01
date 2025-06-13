<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Policies\ProductPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 測試不同用戶角色對商品操作的權限控制
 */
class ProductPolicyTest extends TestCase
{
    use RefreshDatabase;

    private ProductPolicy $policy;
    private User $adminUser;
    private User $viewerUser;
    private Product $product;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        $this->policy = new ProductPolicy();
        
        // 建立測試用戶
        $this->adminUser = User::factory()->admin()->create();
        $this->viewerUser = User::factory()->viewer()->create();
        
        // 建立測試商品
        $this->product = Product::factory()->create();
    }

    /**
     * 測試管理員的商品查看權限
     */
    public function test_admin_can_view_any_products(): void
    {
        $this->assertTrue($this->policy->viewAny($this->adminUser));
    }

    /**
     * 測試檢視者的商品查看權限
     */
    public function test_viewer_can_view_any_products(): void
    {
        $this->assertTrue($this->policy->viewAny($this->viewerUser));
    }

    /**
     * 測試管理員的單一商品查看權限
     */
    public function test_admin_can_view_specific_product(): void
    {
        $this->assertTrue($this->policy->view($this->adminUser, $this->product));
    }

    /**
     * 測試檢視者的單一商品查看權限
     */
    public function test_viewer_can_view_specific_product(): void
    {
        $this->assertTrue($this->policy->view($this->viewerUser, $this->product));
    }

    /**
     * 測試管理員的商品建立權限
     */
    public function test_admin_can_create_products(): void
    {
        $this->assertTrue($this->policy->create($this->adminUser));
    }

    /**
     * 測試檢視者無法建立商品
     */
    public function test_viewer_cannot_create_products(): void
    {
        $this->assertFalse($this->policy->create($this->viewerUser));
    }

    /**
     * 測試管理員的商品更新權限
     */
    public function test_admin_can_update_products(): void
    {
        $this->assertTrue($this->policy->update($this->adminUser, $this->product));
    }

    /**
     * 測試檢視者無法更新商品
     */
    public function test_viewer_cannot_update_products(): void
    {
        $this->assertFalse($this->policy->update($this->viewerUser, $this->product));
    }

    /**
     * 測試管理員的商品刪除權限
     */
    public function test_admin_can_delete_products(): void
    {
        $this->assertTrue($this->policy->delete($this->adminUser, $this->product));
    }

    /**
     * 測試檢視者無法刪除商品
     */
    public function test_viewer_cannot_delete_products(): void
    {
        $this->assertFalse($this->policy->delete($this->viewerUser, $this->product));
    }

    /**
     * 測試管理員的批量刪除權限
     */
    public function test_admin_can_delete_multiple_products(): void
    {
        $this->assertTrue($this->policy->deleteMultiple($this->adminUser));
    }

    /**
     * 測試檢視者無法批量刪除商品
     */
    public function test_viewer_cannot_delete_multiple_products(): void
    {
        $this->assertFalse($this->policy->deleteMultiple($this->viewerUser));
    }

    /**
     * 測試管理員的資料匯出權限
     */
    public function test_admin_can_export_products(): void
    {
        $this->assertTrue($this->policy->export($this->adminUser));
    }

    /**
     * 測試檢視者的資料匯出權限
     */
    public function test_viewer_can_export_products(): void
    {
        $this->assertTrue($this->policy->export($this->viewerUser));
    }

    /**
     * 測試管理員的資料匯入權限
     */
    public function test_admin_can_import_products(): void
    {
        $this->assertTrue($this->policy->import($this->adminUser));
    }

    /**
     * 測試檢視者無法匯入資料
     */
    public function test_viewer_cannot_import_products(): void
    {
        $this->assertFalse($this->policy->import($this->viewerUser));
    }

    /**
     * 測試管理員的商品恢復權限
     */
    public function test_admin_can_restore_products(): void
    {
        $this->assertTrue($this->policy->restore($this->adminUser, $this->product));
    }

    /**
     * 測試檢視者無法恢復商品
     */
    public function test_viewer_cannot_restore_products(): void
    {
        $this->assertFalse($this->policy->restore($this->viewerUser, $this->product));
    }

    /**
     * 測試管理員的永久刪除權限
     */
    public function test_admin_can_force_delete_products(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->adminUser, $this->product));
    }

    /**
     * 測試檢視者無法永久刪除商品
     */
    public function test_viewer_cannot_force_delete_products(): void
    {
        $this->assertFalse($this->policy->forceDelete($this->viewerUser, $this->product));
    }
}
