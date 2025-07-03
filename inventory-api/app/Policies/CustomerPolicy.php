<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 客戶權限策略類別
 * 
 * 定義客戶相關操作的權限控制邏輯，
 * 基於用戶角色系統實現清晰的權限劃分
 */
class CustomerPolicy
{
    /**
     * 判斷用戶是否可以查看客戶列表
     * 
     * 所有已登入用戶都可以查看客戶列表
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許查看客戶列表
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * 判斷用戶是否可以查看單個客戶
     * 
     * 所有已登入用戶都可以查看客戶詳情
     * 
     * @param User $user 當前用戶
     * @param Customer $customer 客戶實例
     * @return bool 是否允許查看該客戶
     */
    public function view(User $user, Customer $customer): bool
    {
        return true;
    }

    /**
     * 判斷用戶是否可以創建客戶
     * 
     * 管理員和職員都可以創建客戶
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許創建客戶
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 判斷用戶是否可以更新客戶
     * 
     * 管理員和職員都可以更新客戶資料
     * 
     * @param User $user 當前用戶
     * @param Customer $customer 客戶實例
     * @return bool 是否允許更新該客戶
     */
    public function update(User $user, Customer $customer): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 判斷用戶是否可以刪除客戶
     * 
     * 管理員和職員都可以刪除客戶
     * 
     * @param User $user 當前用戶
     * @param Customer $customer 客戶實例
     * @return bool 是否允許刪除該客戶
     */
    public function delete(User $user, Customer $customer): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 判斷用戶是否可以恢復已刪除的客戶
     * 
     * 只有管理員可以恢復已刪除的客戶
     * 
     * @param User $user 當前用戶
     * @param Customer $customer 客戶實例
     * @return bool 是否允許恢復該客戶
     */
    public function restore(User $user, Customer $customer): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以永久刪除客戶
     * 
     * 只有管理員可以永久刪除客戶
     * 
     * @param User $user 當前用戶
     * @param Customer $customer 客戶實例
     * @return bool 是否允許永久刪除該客戶
     */
    public function forceDelete(User $user, Customer $customer): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以批量刪除客戶
     * 
     * 自定義方法：處理批量刪除權限
     * 只有管理員可以批量刪除客戶
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許批量刪除客戶
     */
    public function deleteMultiple(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 判斷用戶是否可以匯出客戶資料
     * 
     * 自定義方法：處理資料匯出權限
     * 所有已登入用戶都可以匯出客戶資料
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許匯出客戶資料
     */
    public function export(User $user): bool
    {
        return true;
    }

    /**
     * 判斷用戶是否可以匯入客戶資料
     * 
     * 自定義方法：處理資料匯入權限
     * 只有管理員可以匯入客戶資料
     * 
     * @param User $user 當前用戶
     * @return bool 是否允許匯入客戶資料
     */
    public function import(User $user): bool
    {
        return $user->isAdmin();
    }
}
