<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Product;

/**
 * 商品權限策略類別
 * 
 * 定義商品相關操作的權限控制邏輯，
 * 基於用戶角色系統實現清晰的權限劃分
 */
class ProductPolicy
{
    /**
     * Determine whether the user can view any models.
     * 任何已登入用戶都可以查看列表
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     * 任何已登入用戶都可以查看單一項目
     */
    public function view(User $user, Product $product): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     * admin 和 staff 可以建立
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * Determine whether the user can update the model.
     * admin 和 staff 可以更新
     */
    public function update(User $user, Product $product): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * Determine whether the user can delete the model.
     * admin 和 staff 可以刪除
     */
    public function delete(User $user, Product $product): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * Determine whether the user can batch delete models.
     * admin 和 staff 可以批量刪除
     */
    public function deleteAny(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 判斷用戶是否可以批量刪除商品
     * 
     * 自定義方法：處理批量刪除權限
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許批量刪除商品
     */
    public function deleteMultiple(User $user): bool
    {
        // admin 和 staff 可以批量刪除商品
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 判斷用戶是否可以恢復已刪除的商品
     * 
     * @param User $user 當前用戶
     * @param Product $product 商品實例
     * @return bool 是否允許恢復該商品
     */
    public function restore(User $user, Product $product): bool
    {
        // 只有管理員可以恢復已刪除的商品
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以永久刪除商品
     * 
     * @param User $user 當前用戶
     * @param Product $product 商品實例
     * @return bool 是否允許永久刪除該商品
     */
    public function forceDelete(User $user, Product $product): bool
    {
        // 只有管理員可以永久刪除商品
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以匯出商品資料
     * 
     * 自定義方法：處理資料匯出權限
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許匯出商品資料
     */
    public function export(User $user): bool
    {
        // 管理員和檢視者都可以匯出資料
        return true;
    }

    /**
     * 判斷用戶是否可以匯入商品資料
     * 
     * 自定義方法：處理資料匯入權限
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許匯入商品資料
     */
    public function import(User $user): bool
    {
        // 只有管理員可以匯入資料
        return $user->isAdmin();
    }
}
