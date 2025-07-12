<?php

namespace Tests\Unit\Policies;

use App\Models\Order;
use App\Models\User;
use App\Policies\OrderPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * OrderPolicy 完整測試
 * 
 * 測試訂單權限策略的所有方法和邏輯
 */
class OrderPolicyCompleteTest extends TestCase
{
    use RefreshDatabase;

    private OrderPolicy $policy;
    private User $admin;
    private User $staff;
    private User $viewer;
    private User $installer;
    private User $creator;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        // 運行角色遷移
        $this->artisan('roles:migrate');
        
        $this->policy = new OrderPolicy();
        
        // 創建不同角色的用戶
        $this->admin = User::factory()->admin()->create();
        $this->staff = User::factory()->staff()->create();
        $this->viewer = User::factory()->viewer()->create();
        $this->installer = User::factory()->installer()->create();
        $this->creator = User::factory()->create();
        
        // 創建測試訂單
        $this->order = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'pending'
        ]);
    }

    /**
     * 測試 viewAny 權限 - 只有管理員可以查看所有訂單
     */
    public function test_view_any_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertFalse($this->policy->viewAny($this->staff));
        $this->assertFalse($this->policy->viewAny($this->viewer));
        $this->assertFalse($this->policy->viewAny($this->installer));
        $this->assertFalse($this->policy->viewAny($this->creator));
    }

    /**
     * 測試 view 權限 - 管理員和創建者可以查看訂單
     */
    public function test_view_allows_admin_and_creator(): void
    {
        // 管理員可以查看所有訂單
        $this->assertTrue($this->policy->view($this->admin, $this->order));
        
        // 創建者可以查看自己的訂單
        $this->assertTrue($this->policy->view($this->creator, $this->order));
        
        // 其他用戶不能查看
        $this->assertFalse($this->policy->view($this->staff, $this->order));
        $this->assertFalse($this->policy->view($this->viewer, $this->order));
        $this->assertFalse($this->policy->view($this->installer, $this->order));
    }

    /**
     * 測試 view 權限 - 非創建者無法查看他人訂單
     */
    public function test_view_denies_non_creator(): void
    {
        $otherUser = User::factory()->create();
        
        $this->assertFalse($this->policy->view($otherUser, $this->order));
    }

    /**
     * 測試 create 權限 - 只有管理員可以創建訂單
     */
    public function test_create_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->create($this->viewer));
        $this->assertFalse($this->policy->create($this->installer));
        $this->assertFalse($this->policy->create($this->creator));
    }

    /**
     * 測試 update 權限 - 管理員和創建者（狀態允許時）可以更新
     */
    public function test_update_allows_admin_and_creator_with_valid_status(): void
    {
        // 管理員可以更新所有訂單
        $this->assertTrue($this->policy->update($this->admin, $this->order));
        
        // 創建者可以更新自己的待處理訂單
        $this->assertTrue($this->policy->update($this->creator, $this->order));
        
        // 其他用戶不能更新
        $this->assertFalse($this->policy->update($this->staff, $this->order));
        $this->assertFalse($this->policy->update($this->viewer, $this->order));
        $this->assertFalse($this->policy->update($this->installer, $this->order));
    }

    /**
     * 測試 update 權限 - 已出貨訂單不能更新
     */
    public function test_update_denies_shipped_orders(): void
    {
        // 設置訂單為已出貨狀態
        $shippedOrder = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'shipped'
        ]);
        
        // 即使是管理員也無法更新已出貨的訂單（根據當前實現，管理員仍可更新）
        $this->assertTrue($this->policy->update($this->admin, $shippedOrder));
        
        // 創建者不能更新已出貨的訂單
        $this->assertFalse($this->policy->update($this->creator, $shippedOrder));
    }

    /**
     * 測試 update 權限 - 已完成訂單不能更新
     */
    public function test_update_denies_delivered_orders(): void
    {
        // 設置訂單為已完成狀態
        $deliveredOrder = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'delivered'
        ]);
        
        // 管理員仍可更新
        $this->assertTrue($this->policy->update($this->admin, $deliveredOrder));
        
        // 創建者不能更新已完成的訂單
        $this->assertFalse($this->policy->update($this->creator, $deliveredOrder));
    }

    /**
     * 測試 delete 權限 - 只有管理員可以刪除
     */
    public function test_delete_only_allows_admin(): void
    {
        // 管理員可以刪除待處理的訂單
        $this->assertTrue($this->policy->delete($this->admin, $this->order));
        
        // 其他用戶不能刪除
        $this->assertFalse($this->policy->delete($this->staff, $this->order));
        $this->assertFalse($this->policy->delete($this->viewer, $this->order));
        $this->assertFalse($this->policy->delete($this->installer, $this->order));
        $this->assertFalse($this->policy->delete($this->creator, $this->order));
    }

    /**
     * 測試 delete 權限 - 已出貨訂單不能刪除
     */
    public function test_delete_denies_shipped_orders(): void
    {
        $shippedOrder = Order::factory()->create([
            'shipping_status' => 'shipped'
        ]);
        
        // 即使是管理員也不能刪除已出貨的訂單
        $this->assertFalse($this->policy->delete($this->admin, $shippedOrder));
    }

    /**
     * 測試 delete 權限 - 已完成訂單不能刪除
     */
    public function test_delete_denies_delivered_orders(): void
    {
        $deliveredOrder = Order::factory()->create([
            'shipping_status' => 'delivered'
        ]);
        
        // 即使是管理員也不能刪除已完成的訂單
        $this->assertFalse($this->policy->delete($this->admin, $deliveredOrder));
    }

    /**
     * 測試 deleteMultiple 權限 - 只有管理員可以批量刪除
     */
    public function test_delete_multiple_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->deleteMultiple($this->admin));
        $this->assertFalse($this->policy->deleteMultiple($this->staff));
        $this->assertFalse($this->policy->deleteMultiple($this->viewer));
        $this->assertFalse($this->policy->deleteMultiple($this->installer));
        $this->assertFalse($this->policy->deleteMultiple($this->creator));
    }

    /**
     * 測試 restore 權限 - 只有管理員可以恢復
     */
    public function test_restore_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->restore($this->admin, $this->order));
        $this->assertFalse($this->policy->restore($this->staff, $this->order));
        $this->assertFalse($this->policy->restore($this->viewer, $this->order));
        $this->assertFalse($this->policy->restore($this->installer, $this->order));
        $this->assertFalse($this->policy->restore($this->creator, $this->order));
    }

    /**
     * 測試 forceDelete 權限 - 只有管理員可以永久刪除
     */
    public function test_force_delete_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->forceDelete($this->admin, $this->order));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->order));
        $this->assertFalse($this->policy->forceDelete($this->viewer, $this->order));
        $this->assertFalse($this->policy->forceDelete($this->installer, $this->order));
        $this->assertFalse($this->policy->forceDelete($this->creator, $this->order));
    }

    /**
     * 測試 updateMultipleStatus 權限 - 只有管理員可以批量更新狀態
     */
    public function test_update_multiple_status_only_allows_admin(): void
    {
        $this->assertTrue($this->policy->updateMultipleStatus($this->admin));
        $this->assertFalse($this->policy->updateMultipleStatus($this->staff));
        $this->assertFalse($this->policy->updateMultipleStatus($this->viewer));
        $this->assertFalse($this->policy->updateMultipleStatus($this->installer));
        $this->assertFalse($this->policy->updateMultipleStatus($this->creator));
    }

    /**
     * 測試多角色用戶的權限
     */
    public function test_multiple_roles_user_permissions(): void
    {
        // 創建有多個角色的用戶
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole(['staff', 'installer']);

        // 由於沒有 admin 角色，應該無法執行管理操作
        $this->assertFalse($this->policy->viewAny($multiRoleUser));
        $this->assertFalse($this->policy->create($multiRoleUser));
        $this->assertFalse($this->policy->delete($multiRoleUser, $this->order));
        $this->assertFalse($this->policy->deleteMultiple($multiRoleUser));
        $this->assertFalse($this->policy->updateMultipleStatus($multiRoleUser));
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
        $this->assertTrue($this->policy->view($adminWithOtherRoles, $this->order));
        $this->assertTrue($this->policy->create($adminWithOtherRoles));
        $this->assertTrue($this->policy->update($adminWithOtherRoles, $this->order));
        $this->assertTrue($this->policy->delete($adminWithOtherRoles, $this->order));
        $this->assertTrue($this->policy->deleteMultiple($adminWithOtherRoles));
        $this->assertTrue($this->policy->restore($adminWithOtherRoles, $this->order));
        $this->assertTrue($this->policy->forceDelete($adminWithOtherRoles, $this->order));
        $this->assertTrue($this->policy->updateMultipleStatus($adminWithOtherRoles));
    }

    /**
     * 測試不同出貨狀態的權限
     */
    public function test_permissions_with_different_shipping_statuses(): void
    {
        $statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        foreach ($statuses as $status) {
            $order = Order::factory()->create([
                'creator_user_id' => $this->creator->id,
                'shipping_status' => $status
            ]);
            
            // 管理員總是可以查看和恢復
            $this->assertTrue($this->policy->view($this->admin, $order));
            $this->assertTrue($this->policy->restore($this->admin, $order));
            $this->assertTrue($this->policy->forceDelete($this->admin, $order));
            
            // 創建者可以查看自己的訂單
            $this->assertTrue($this->policy->view($this->creator, $order));
            
            // 檢查更新權限
            if (in_array($status, ['shipped', 'delivered'])) {
                // 已出貨或已完成的訂單，創建者不能更新
                $this->assertFalse($this->policy->update($this->creator, $order));
            } else {
                // 其他狀態，創建者可以更新
                $this->assertTrue($this->policy->update($this->creator, $order));
            }
            
            // 檢查刪除權限
            if (in_array($status, ['shipped', 'delivered'])) {
                // 已出貨或已完成的訂單，管理員也不能刪除
                $this->assertFalse($this->policy->delete($this->admin, $order));
            } else {
                // 其他狀態，管理員可以刪除
                $this->assertTrue($this->policy->delete($this->admin, $order));
            }
        }
    }

    /**
     * 測試權限方法的返回類型
     */
    public function test_policy_methods_return_boolean(): void
    {
        $result = $this->policy->viewAny($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->view($this->admin, $this->order);
        $this->assertIsBool($result);

        $result = $this->policy->create($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->update($this->admin, $this->order);
        $this->assertIsBool($result);

        $result = $this->policy->delete($this->admin, $this->order);
        $this->assertIsBool($result);

        $result = $this->policy->deleteMultiple($this->admin);
        $this->assertIsBool($result);

        $result = $this->policy->restore($this->admin, $this->order);
        $this->assertIsBool($result);

        $result = $this->policy->forceDelete($this->admin, $this->order);
        $this->assertIsBool($result);

        $result = $this->policy->updateMultipleStatus($this->admin);
        $this->assertIsBool($result);
    }

    /**
     * 測試策略類別的基本結構
     */
    public function test_policy_class_structure(): void
    {
        $this->assertInstanceOf(OrderPolicy::class, $this->policy);
        
        // 檢查所有必要的方法是否存在
        $methods = [
            'viewAny', 'view', 'create', 'update', 'delete', 
            'deleteMultiple', 'restore', 'forceDelete', 'updateMultipleStatus'
        ];
        
        foreach ($methods as $method) {
            $this->assertTrue(method_exists($this->policy, $method), "方法 {$method} 不存在");
        }
    }

    /**
     * 測試邊界情況
     */
    public function test_edge_cases(): void
    {
        // 測試剛創建的用戶（沒有任何角色）
        $newUser = User::factory()->create();
        
        // 沒有角色的用戶不應該有任何管理權限
        $this->assertFalse($this->policy->viewAny($newUser));
        $this->assertFalse($this->policy->create($newUser));
        $this->assertFalse($this->policy->delete($newUser, $this->order));
        $this->assertFalse($this->policy->deleteMultiple($newUser));
        $this->assertFalse($this->policy->updateMultipleStatus($newUser));
        
        // 但如果是自己創建的訂單，應該可以查看
        $ownOrder = Order::factory()->create([
            'creator_user_id' => $newUser->id,
            'shipping_status' => 'pending'
        ]);
        
        $this->assertTrue($this->policy->view($newUser, $ownOrder));
        $this->assertTrue($this->policy->update($newUser, $ownOrder));
    }

    /**
     * 測試不同訂單對權限的影響
     */
    public function test_permissions_for_different_orders(): void
    {
        // 創建不同類型的訂單
        $order1 = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'pending'
        ]);
        $order2 = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'delivered'
        ]);
        
        $orders = [$order1, $order2];
        
        // 權限邏輯應該與訂單類型無關（除了狀態限制）
        foreach ($orders as $order) {
            $this->assertTrue($this->policy->view($this->admin, $order));
            $this->assertTrue($this->policy->restore($this->admin, $order));
            $this->assertTrue($this->policy->forceDelete($this->admin, $order));
            
            $this->assertFalse($this->policy->restore($this->viewer, $order));
            $this->assertFalse($this->policy->forceDelete($this->viewer, $order));
        }
    }

    /**
     * 測試待處理狀態的訂單權限
     */
    public function test_permissions_with_pending_shipping_status(): void
    {
        $orderWithPendingStatus = Order::factory()->create([
            'creator_user_id' => $this->creator->id,
            'shipping_status' => 'pending'
        ]);
        
        // 創建者應該可以更新待處理的訂單
        $this->assertTrue($this->policy->update($this->creator, $orderWithPendingStatus));
        
        // 管理員應該可以刪除待處理的訂單
        $this->assertTrue($this->policy->delete($this->admin, $orderWithPendingStatus));
    }
}