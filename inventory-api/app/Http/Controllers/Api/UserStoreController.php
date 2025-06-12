<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UserStoreAssignRequest;
use App\Http\Resources\Api\StoreResource;
use App\Http\Resources\Api\UserResource;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;

class UserStoreController extends Controller
{
    /**
     * @group User Store Management
     * @authenticated
     * 
     * 獲取用戶的所有分店
     * 
     * 獲取指定用戶所屬的所有分店列表。
     * 
     * @apiResource App\Http\Resources\Api\StoreResource
     * @apiResourceModel App\Models\Store
     * 
     * @param User $user
     * @return AnonymousResourceCollection
     */
    public function index(User $user): AnonymousResourceCollection
    {
        $this->authorize('view', $user);
        
        $stores = $user->stores;
        return StoreResource::collection($stores);
    }

    /**
     * @group User Store Management
     * @authenticated
     * 
     * 為用戶分配分店
     * 
     * 將指定分店分配給用戶。提供的 store_ids 將替換用戶當前的所有分店關聯。
     * 
     * @apiResource App\Http\Resources\Api\UserResource
     * @apiResourceModel App\Models\User
     * 
     * @param UserStoreAssignRequest $request
     * @param User $user
     * @return JsonResponse
     */
    public function store(UserStoreAssignRequest $request, User $user): JsonResponse
    {
        try {
            // 獲取驗證後的 store_ids
            $storeIds = $request->store_ids;
            
            // 確保所有 ID 都是整數
            $storeIds = array_map(function($id) {
                return is_numeric($id) ? (int)$id : $id;
            }, $storeIds);
            
            // 檢查所有店鋪 ID 是否存在
            $storeCount = Store::whereIn('id', $storeIds)->count();
            if ($storeCount !== count($storeIds)) {
                Log::warning("嘗試分配不存在的店鋪: ", [
                    'user_id' => $user->id,
                    'store_ids' => $storeIds
                ]);
                return response()->json([
                    'message' => '提供的部分分店ID不存在',
                    'errors' => ['store_ids' => ['提供的部分分店ID不存在']]
                ], 422);
            }
            
            // 同步用戶的分店
            $user->stores()->sync($storeIds);
            
            return response()->json([
                'message' => '分店已成功分配給用戶',
                'user' => new UserResource($user->load('stores')),
            ]);
        } catch (\Exception $e) {
            Log::error("分配分店失敗: {$e->getMessage()}", [
                'user_id' => $user->id,
                'exception' => $e
            ]);
            
            return response()->json([
                'message' => '分配分店時發生錯誤',
                'errors' => ['server' => ['處理請求時發生錯誤，請稍後再試']]
            ], 500);
        }
    }

    /**
     * 其他方法不需要實作，只使用 index 和 store
     */
    public function show($id) { abort(404); }
    public function update($id) { abort(404); }
    public function destroy($id) { abort(404); }
}
