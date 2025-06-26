<?php

namespace App\Policies;

use App\Models\Installation;
use App\Models\User;

class InstallationPolicy
{
    /**
     * 判斷用戶是否可以查看任何安裝單列表
     */
    public function viewAny(User $user): bool
    {
        // admin: 可以查看所有安裝單
        // installer: 可以查看分配給自己的安裝單
        // staff: 可以查看所有安裝單
        // viewer: 可以查看所有安裝單
        return $user->hasAnyRole(['admin', 'staff', 'viewer', 'installer']);
    }

    /**
     * 判斷用戶是否可以查看特定安裝單
     */
    public function view(User $user, Installation $installation): bool
    {
        // admin, staff, viewer 可以查看所有安裝單
        if ($user->hasAnyRole(['admin', 'staff', 'viewer'])) {
            return true;
        }

        // installer 只能查看分配給自己的安裝單
        if ($user->hasRole('installer')) {
            return $installation->installer_user_id === $user->id;
        }

        return false;
    }

    /**
     * 判斷用戶是否可以創建安裝單
     */
    public function create(User $user): bool
    {
        // 只有 admin 和 staff 可以創建安裝單
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * 判斷用戶是否可以更新安裝單
     */
    public function update(User $user, Installation $installation): bool
    {
        // admin 可以更新所有安裝單
        if ($user->hasRole('admin')) {
            return true;
        }

        // staff 可以更新所有安裝單
        if ($user->hasRole('staff')) {
            return true;
        }

        // installer 可以更新分配給自己的安裝單（僅限狀態和時間）
        if ($user->hasRole('installer') && $installation->installer_user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * 判斷用戶是否可以刪除安裝單
     */
    public function delete(User $user, Installation $installation): bool
    {
        // 只有 admin 可以刪除安裝單
        // 且只能刪除狀態為 pending 或 cancelled 的安裝單
        return $user->hasRole('admin') && in_array($installation->status, ['pending', 'cancelled']);
    }

    /**
     * 判斷用戶是否可以分配安裝師傅
     */
    public function assignInstaller(User $user, Installation $installation): bool
    {
        // 只有 admin 和 staff 可以分配安裝師傅
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * 判斷用戶是否可以更新安裝狀態
     */
    public function updateStatus(User $user, Installation $installation): bool
    {
        // admin 和 staff 可以更新任何安裝單的狀態
        if ($user->hasAnyRole(['admin', 'staff'])) {
            return true;
        }

        // installer 可以更新分配給自己的安裝單狀態
        if ($user->hasRole('installer') && $installation->installer_user_id === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * 判斷用戶是否可以從訂單創建安裝單
     */
    public function createFromOrder(User $user): bool
    {
        // 只有 admin 和 staff 可以從訂單創建安裝單
        return $user->hasAnyRole(['admin', 'staff']);
    }

    /**
     * 判斷用戶是否可以取消安裝單
     */
    public function cancel(User $user, Installation $installation): bool
    {
        // 只有 admin 和 staff 可以取消安裝單
        // 且只能取消狀態為 pending 或 scheduled 的安裝單
        return $user->hasAnyRole(['admin', 'staff']) && $installation->canBeCancelled();
    }
} 