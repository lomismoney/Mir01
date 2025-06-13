<?php

namespace App\Policies;

use App\Models\InventoryTransfer;
use App\Models\User;

class InventoryTransferPolicy
{
    /**
     * 檢查使用者是否可以查看庫存轉移列表
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager') || $user->hasRole('staff') || $user->hasRole('viewer');
    }

    /**
     * 檢查使用者是否可以查看特定庫存轉移記錄
     */
    public function view(User $user, InventoryTransfer $inventoryTransfer): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager') || $user->hasRole('staff') || $user->hasRole('viewer');
    }

    /**
     * 檢查使用者是否可以創建庫存轉移
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }

    /**
     * 檢查使用者是否可以更新庫存轉移狀態
     */
    public function update(User $user, InventoryTransfer $inventoryTransfer): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }

    /**
     * 檢查使用者是否可以取消庫存轉移
     */
    public function cancel(User $user, InventoryTransfer $inventoryTransfer): bool
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }
}
