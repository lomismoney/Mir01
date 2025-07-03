<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserStoreService
{
    /**
     * 為指定用戶分配分店。
     *
     * @param User $user 要分配分店的用戶
     * @param array $storeIds 分店ID列表
     * @return User 分配完成後的用戶實例
     * @throws \Exception 如果資料庫操作失敗
     */
    public function assignStores(User $user, array $storeIds): User
    {
        try {
            DB::transaction(function () use ($user, $storeIds) {
                // sync 方法會處理所有新增和刪除的關聯，非常高效
                $user->stores()->sync($storeIds);
            });

            // 重新載入關聯，確保返回的用戶數據是最新的
            return $user->load('stores');
            
        } catch (\Exception $e) {
            Log::error("為用戶分配分店時發生資料庫錯誤", [
                'user_id' => $user->id,
                'store_ids' => $storeIds,
                'exception' => $e
            ]);

            // 向上拋出例外，讓控制器層來決定如何處理 HTTP 回應
            throw $e;
        }
    }
} 