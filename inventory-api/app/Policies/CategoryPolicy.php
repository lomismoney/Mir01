<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

/**
 * CategoryPolicy 分類權限策略
 * 
 * 實現基於角色的分類管理權限控制：
 * - 只有管理員可以執行所有分類管理操作
 * - 非管理員用戶一律拒絕存取
 */
class CategoryPolicy
{
    /**
     * 所有分類管理操作都只有 admin 可以執行
     * 
     * 此方法會在所有其他權限檢查之前執行
     * 如果返回 true，則允許操作；如果返回 null，則繼續檢查其他方法
     * 
     * @param User $user 當前用戶
     * @param string $ability 請求的權限能力
     * @return bool|null
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }
    
    /**
     * 檢視所有分類列表的權限
     * 所有認證用戶都可以查看分類列表（用於商品分類選擇）
     * 
     * @param User $user 當前用戶
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true; // 所有認證用戶都可以查看分類列表
    }

    /**
     * 檢視單一分類的權限
     * 所有認證用戶都可以查看分類詳情
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function view(User $user, Category $category): bool
    {
        return true; // 所有認證用戶都可以查看分類詳情
    }

    /**
     * 創建分類的權限
     * 由於 before 會攔截所有 admin 的請求，此方法主要用於拒絕非 admin 用戶
     * 
     * @param User $user 當前用戶
     * @return bool
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * 更新分類的權限
     * 由於 before 會攔截所有 admin 的請求，此方法主要用於拒絕非 admin 用戶
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function update(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * 刪除分類的權限
     * 由於 before 會攔截所有 admin 的請求，此方法主要用於拒絕非 admin 用戶
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function delete(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * 恢復已刪除分類的權限
     * 由於 before 會攔截所有 admin 的請求，此方法主要用於拒絕非 admin 用戶
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function restore(User $user, Category $category): bool
    {
        return false;
    }

    /**
     * 永久刪除分類的權限
     * 由於 before 會攔截所有 admin 的請求，此方法主要用於拒絕非 admin 用戶
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function forceDelete(User $user, Category $category): bool
    {
        return false;
    }
}
