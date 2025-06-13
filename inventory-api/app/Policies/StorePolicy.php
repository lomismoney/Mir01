<?php

namespace App\Policies;

use App\Models\Store;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class StorePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // 所有用戶都可以查看分店列表
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Store $store): bool
    {
        // 所有用戶都可以查看分店詳情
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // 只有管理員可以創建分店
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Store $store): bool
    {
        // 只有管理員可以更新分店
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Store $store): bool
    {
        // 只有管理員可以刪除分店
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Store $store): bool
    {
        // 只有管理員可以恢復分店
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Store $store): bool
    {
        // 只有管理員可以永久刪除分店
        return $user->isAdmin();
    }
}
