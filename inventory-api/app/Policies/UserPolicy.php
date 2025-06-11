<?php

namespace App\Policies;

use App\Models\User;

/**
 * 用戶權限策略
 * 
 * 定義用戶管理的權限規則：
 * - 只有管理員可以管理用戶
 * - 管理員不能刪除自己的帳號
 * - 檢視者對用戶管理功能沒有任何權限
 */
class UserPolicy
{


    /**
     * 決定用戶是否可以查看用戶列表
     * 
     * 只有管理員可以查看用戶列表
     * 
     * @param User $user 當前登入的用戶
     * @return bool true: 管理員可以查看, false: 其他角色拒絕
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 決定用戶是否可以查看特定用戶資料
     * 
     * 只有管理員可以查看用戶詳情
     * 
     * @param User $user 當前登入的用戶
     * @param User $model 要查看的目標用戶
     * @return bool true: 管理員可以查看, false: 其他角色拒絕
     */
    public function view(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * 決定用戶是否可以建立新用戶
     * 
     * 只有管理員可以建立用戶
     * 
     * @param User $user 當前登入的用戶
     * @return bool true: 管理員可以建立, false: 其他角色拒絕
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * 決定用戶是否可以更新用戶資料
     * 
     * 只有管理員可以更新用戶資料
     * 
     * @param User $user 當前登入的用戶
     * @param User $model 要更新的目標用戶
     * @return bool true: 管理員可以更新, false: 其他角色拒絕
     */
    public function update(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * 決定用戶是否可以刪除用戶
     * 
     * 只有管理員可以刪除用戶，且管理員不能刪除自己的帳號。
     * 這是唯一一個會覆蓋 before() 方法結果的權限檢查。
     * 
     * @param User $user 當前登入的用戶
     * @param User $model 要刪除的目標用戶
     * @return bool true: 管理員可以刪除其他用戶, false: 非管理員或嘗試刪除自己
     */
    public function delete(User $user, User $model): bool
    {
        // 首先檢查是否為管理員，只有管理員才能刪除用戶
        if (!$user->isAdmin()) {
            return false;
        }
        
        // 管理員不能刪除自己的帳號
        return $user->id !== $model->id;
    }

    /**
     * 決定用戶是否可以恢復已刪除的用戶
     * 
     * 只有管理員可以恢復用戶
     * 
     * @param User $user 當前登入的用戶
     * @param User $model 要恢復的目標用戶
     * @return bool true: 管理員可以恢復, false: 其他角色拒絕
     */
    public function restore(User $user, User $model): bool
    {
        return $user->isAdmin();
    }

    /**
     * 決定用戶是否可以永久刪除用戶
     * 
     * 只有管理員可以永久刪除用戶，且不能刪除自己
     * 
     * @param User $user 當前登入的用戶
     * @param User $model 要永久刪除的目標用戶
     * @return bool true: 管理員可以永久刪除其他用戶, false: 其他情況拒絕
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->id !== $model->id;
    }
}
