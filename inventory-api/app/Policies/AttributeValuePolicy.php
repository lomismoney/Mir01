<?php

namespace App\Policies;

use App\Models\AttributeValue;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * AttributeValuePolicy 權限策略
 * 
 * 管理商品屬性值的存取權限，僅允許管理員進行屬性值管理操作
 */
class AttributeValuePolicy
{
    /**
     * 檢查使用者是否可以查看屬性值列表
     * 
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return $user->isStaff() || $user->isAdmin();
    }

    /**
     * 檢查使用者是否可以查看特定屬性值
     * 
     * @param User $user
     * @param AttributeValue $attributeValue
     * @return bool
     */
    public function view(User $user, AttributeValue $attributeValue): bool
    {
        return $user->isStaff() || $user->isAdmin();
    }

    /**
     * 檢查使用者是否可以建立新屬性值
     * 
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 檢查使用者是否可以更新屬性值
     * 
     * @param User $user
     * @param AttributeValue $attributeValue
     * @return bool
     */
    public function update(User $user, AttributeValue $attributeValue): bool
    {
        return $user->isAdmin();
    }

    /**
     * 檢查使用者是否可以刪除屬性值
     * 
     * @param User $user
     * @param AttributeValue $attributeValue
     * @return bool
     */
    public function delete(User $user, AttributeValue $attributeValue): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, AttributeValue $attributeValue): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, AttributeValue $attributeValue): bool
    {
        return $user->isAdmin();
    }
}
