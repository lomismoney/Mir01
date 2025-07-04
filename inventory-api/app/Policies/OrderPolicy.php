<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * 訂單權限策略
 * 
 * 權限設計原則：
 * 1. 管理員擁有所有操作權限
 * 2. 一般用戶只能查看自己創建的訂單
 * 3. 確保資料安全和隱私保護
 */
class OrderPolicy
{
    /**
     * 檢查用戶是否可以查看任何訂單
     * 
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        // 管理員可以查看所有訂單
        return $user->isAdmin();
    }

    /**
     * 檢查用戶是否可以查看特定訂單
     * 
     * @param User $user
     * @param Order $order
     * @return bool
     */
    public function view(User $user, Order $order): bool
    {
        // 管理員可以查看所有訂單，創建者可以查看自己的訂單
        return $user->isAdmin() || $order->creator_user_id === $user->id;
    }

    /**
     * 檢查用戶是否可以創建訂單
     * 
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        // 管理員可以創建訂單
        return $user->isAdmin();
    }

    /**
     * 檢查用戶是否可以更新訂單
     * 
     * @param User $user
     * @param Order $order
     * @return bool
     */
    public function update(User $user, Order $order): bool
    {
        // 管理員可以更新所有訂單
        if ($user->isAdmin()) {
            return true;
        }

        // 一般用戶可以更新自己創建的且狀態允許修改的訂單
        if ($order->creator_user_id === $user->id) {
            // 檢查訂單狀態，已出貨或已完成的訂單不能修改
            return !in_array($order->shipping_status, ['shipped', 'delivered']);
        }

        return false;
    }

    /**
     * 檢查用戶是否可以刪除訂單
     * 
     * @param User $user
     * @param Order $order
     * @return bool
     */
    public function delete(User $user, Order $order): bool
    {
        // 只有管理員可以刪除訂單，且訂單狀態必須允許刪除
        if (!$user->isAdmin()) {
            return false;
        }

        // 已出貨或已完成的訂單不能刪除
        return !in_array($order->shipping_status, ['shipped', 'delivered']);
    }

    /**
     * 檢查用戶是否可以批量刪除訂單
     * 
     * 批量刪除權限與單個刪除保持一致：
     * 1. 只有管理員可以執行批量刪除
     * 2. 具體的訂單狀態檢查將在服務層進行
     * 
     * @param User $user
     * @return bool
     */
    public function deleteMultiple(User $user): bool
    {
        // 只有管理員可以執行批量刪除操作
        return $user->isAdmin();
    }

    /**
     * 檢查用戶是否可以恢復軟刪除的訂單
     * 
     * @param User $user
     * @param Order $order
     * @return bool
     */
    public function restore(User $user, Order $order): bool
    {
        // 只有管理員可以恢復已刪除的訂單
        return $user->isAdmin();
    }

    /**
     * 檢查用戶是否可以永久刪除訂單
     * 
     * @param User $user
     * @param Order $order
     * @return bool
     */
    public function forceDelete(User $user, Order $order): bool
    {
        // 只有管理員可以永久刪除訂單
        return $user->isAdmin();
    }

    /**
     * 檢查用戶是否可以批量更新訂單狀態
     * 
     * 批量狀態更新權限設計：
     * 1. 只有管理員可以執行批量狀態更新
     * 2. 具體的訂單狀態檢查和業務邏輯將在服務層進行
     * 3. 確保批量操作的安全性和一致性
     * 
     * @param User $user
     * @return bool
     */
    public function updateMultipleStatus(User $user): bool
    {
        // 只有管理員可以執行批量狀態更新操作
        return $user->isAdmin();
    }
}
