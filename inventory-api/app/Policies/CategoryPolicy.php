<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

/**
 * CategoryPolicy 分類權限策略
 * 
 * 實現基於角色的分類管理權限控制：
 * - 只有管理員可以執行所有分類管理操作
 * - staff 和 viewer 用戶僅有讀取權限
 */
class CategoryPolicy
{
    /**
     * 檢視所有分類列表的權限
     * 所有用戶都可以查看分類列表（包括未認證用戶）
     * 
     * @param User|null $user 當前用戶（可為 null）
     * @return bool
     */
    public function viewAny(?User $user = null): bool
    {
        return true; 
    }

    /**
     * 檢視單一分類的權限
     * 所有用戶都可以查看分類詳情（包括未認證用戶）
     * 
     * @param User|null $user 當前用戶（可為 null）
     * @param Category $category 分類實例
     * @return bool
     */
    public function view(?User $user, Category $category): bool
    {
        return true;
    }

    /**
     * 創建分類的權限
     * 
     * @param User $user 當前用戶
     * @return bool
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 更新分類的權限
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function update(User $user, Category $category): bool
    {
        return $user->isAdmin();
    }

    /**
     * 刪除分類的權限
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function delete(User $user, Category $category): bool
    {
        return $user->isAdmin();
    }

    /**
     * 恢復已刪除分類的權限
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function restore(User $user, Category $category): bool
    {
        return $user->isAdmin();
    }

    /**
     * 永久刪除分類的權限
     * 
     * @param User $user 當前用戶
     * @param Category $category 分類實例
     * @return bool
     */
    public function forceDelete(User $user, Category $category): bool
    {
        return $user->isAdmin();
    }

    /**
     * 批量重新排序分類的權限
     * 只有管理員可以重新排序分類
     * 
     * @param User $user 當前用戶
     * @return bool
     */
    public function reorder(User $user): bool
    {
        // 暫定只有管理員可以排序，你可以根據需求修改
        return $user->isAdmin();
    }
}
