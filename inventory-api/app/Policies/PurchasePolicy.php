<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Purchase;
use Illuminate\Auth\Access\HandlesAuthorization;

class PurchasePolicy
{
    use HandlesAuthorization;

    /**
     * 是否可以查看進貨單列表
     * 管理員和員工都可以查看
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 是否可以查看特定進貨單
     * 管理員和員工都可以查看
     */
    public function view(User $user, Purchase $purchase): bool
    {
        return $user->isAdmin() || $user->isStaff();
    }

    /**
     * 是否可以創建進貨單
     * 只有管理員可以創建進貨單
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 是否可以更新進貨單
     * 只有管理員可以更新進貨單
     */
    public function update(User $user, Purchase $purchase): bool
    {
        return $user->isAdmin();
    }

    /**
     * 是否可以刪除進貨單
     * 只有管理員可以刪除進貨單
     */
    public function delete(User $user, Purchase $purchase): bool
    {
        return $user->isAdmin();
    }

    /**
     * 是否可以恢復已刪除的進貨單
     * 只有管理員可以恢復
     */
    public function restore(User $user, Purchase $purchase): bool
    {
        return $user->isAdmin();
    }

    /**
     * 是否可以永久刪除進貨單
     * 只有管理員可以永久刪除
     */
    public function forceDelete(User $user, Purchase $purchase): bool
    {
        return $user->isAdmin();
    }
} 