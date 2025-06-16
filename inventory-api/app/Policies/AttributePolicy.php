<?php

namespace App\Policies;

use App\Models\Attribute;
use App\Models\User;

/**
 * AttributePolicy 權限策略
 * 
 * 管理商品屬性的存取權限，僅允許管理員進行屬性管理操作
 */
class AttributePolicy
{
    /**
     * 全域權限檢查
     * 
     * 在執行任何權限檢查之前，先檢查使用者是否為管理員
     * 如果是管理員，直接允許所有操作；如果不是，繼續執行個別權限檢查
     * 
     * @param User $user
     * @param string $ability
     * @return bool|null
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    /**
     * 檢查使用者是否可以查看屬性列表
     * 所有認證用戶都可以查看屬性列表（用於建立商品變體）
     * 
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return true; // 所有認證用戶都可以查看屬性列表
    }

    /**
     * 檢查使用者是否可以查看特定屬性
     * 所有認證用戶都可以查看屬性詳情
     * 
     * @param User $user
     * @param Attribute $attribute
     * @return bool
     */
    public function view(User $user, Attribute $attribute): bool
    {
        return true; // 所有認證用戶都可以查看屬性詳情
    }

    /**
     * 檢查使用者是否可以建立新屬性
     * 
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * 檢查使用者是否可以更新屬性
     * 
     * @param User $user
     * @param Attribute $attribute
     * @return bool
     */
    public function update(User $user, Attribute $attribute): bool
    {
        return false;
    }

    /**
     * 檢查使用者是否可以刪除屬性
     * 
     * @param User $user
     * @param Attribute $attribute
     * @return bool
     */
    public function delete(User $user, Attribute $attribute): bool
    {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Attribute $attribute): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Attribute $attribute): bool
    {
        return false;
    }
}
