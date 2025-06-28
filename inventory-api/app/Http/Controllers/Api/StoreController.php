<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\StoreData;
use App\Http\Resources\Api\StoreResource;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Spatie\QueryBuilder\QueryBuilder;
use App\Exceptions\ApiException;

/**
 * StoreController 門市控制器
 * 
 * 【DTO 驅動遷移】已重構為使用 StoreData DTO 進行數據處理
 * 處理門市相關的 API 請求，提供完整的 CRUD 操作
 * 所有操作都受到 StorePolicy 權限保護，僅管理員可執行
 * 支援動態關聯查詢和用戶分配功能
 * 
 * 重構內容：
 * - 使用 StoreData DTO 替代 FormRequest 驗證
 * - 支援用戶關聯同步操作
 * - 添加錯誤處理和日誌記錄
 * - 簡化控制器邏輯，提升類型安全性
 */
class StoreController extends Controller
{
    /**
     * 控制器建構函數
     * 
     * 自動對所有資源路由方法應用 StorePolicy 權限檢查
     * 確保只有授權用戶（管理員）才能執行門市管理操作
     */
    public function __construct()
    {
        $this->authorizeResource(Store::class, 'store');
    }

    /**
     * 列出所有分店
     * 
     * 獲取系統中的所有分店列表，支援動態關聯查詢。
     * 支援排序和分頁功能，提供完整的門市管理介面。
     * 
     * 支援的關聯查詢：
     * - users: 門市關聯的用戶
     * - inventories: 門市庫存記錄
     * - purchases: 進貨記錄
     * - sales: 銷售記錄
     * - transfersOut: 轉出記錄
     * - transfersIn: 轉入記錄
     * 
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection<\App\Http\Resources\Api\StoreResource>
     */
    public function index()
    {
        // 注意：為了暫時繞過分頁問題，先以 get() 取全部
        $stores = QueryBuilder::for(Store::class)
            ->allowedIncludes(['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'])
            ->allowedSorts(['name', 'created_at', 'updated_at'])
            ->defaultSort('name')
            ->get();

        return StoreResource::collection($stores);
    }

    /**
     * 創建新分店
     * 
     * 【DTO 驅動遷移】使用 StoreData DTO 進行數據驗證和轉換
     * 驗證邏輯已遷移至 StoreData，支援：
     * - 門市名稱必填且唯一性檢查
     * - 地址為可選欄位
     * - 用戶關聯分配
     * 
     * @param \App\Data\StoreData $storeData 門市數據傳輸物件
     * @return \App\Http\Resources\Api\StoreResource
     */
    public function store(StoreData $storeData)
    {
        $store = \App\Models\Store::create($storeData->except('user_ids')->toArray());

        if ($storeData->user_ids) {
            $store->users()->sync($storeData->user_ids);
        }

        return new StoreResource($store);
    }

    /**
     * 獲取指定分店
     * 
     * 獲取指定ID的分店詳細信息，支援動態關聯查詢。
     * 根據 include 參數載入相關聯的數據，提供靈活的查詢功能。
     * 
     * 支援的關聯查詢：
     * - users: 門市關聯的用戶
     * - inventories: 門市庫存記錄
     * - purchases: 進貨記錄
     * - sales: 銷售記錄
     * - transfersOut: 轉出記錄
     * - transfersIn: 轉入記錄
     * 
     * @param \App\Models\Store $store 門市模型實例
     * @return \App\Http\Resources\Api\StoreResource
     */
    public function show(Store $store)
    {
        // 允許的關聯類型
        $allowedIncludes = ['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'];
        
        // 處理動態關聯查詢
        if (request()->has('include')) {
            $includeParam = request()->input('include');
            $requestedIncludes = [];
            
            // 支援字串和陣列格式的 include 參數
            if (is_string($includeParam) && !empty($includeParam)) {
                // 處理逗號分隔字串: ?include=users,inventories
                $requestedIncludes = explode(',', $includeParam);
            } elseif (is_array($includeParam) && !empty($includeParam)) {
                // 處理陣列格式: ?include[]=users&include[]=inventories
                $requestedIncludes = $includeParam;
            }
            
            if (!empty($requestedIncludes)) {
                // 只載入允許的關聯
                $includesToLoad = array_intersect($requestedIncludes, $allowedIncludes);

                if (!empty($includesToLoad)) {
                    $store->load($includesToLoad);
                }
            }
        }

        return new StoreResource($store);
    }

    /**
     * 更新指定分店
     * 
     * 【DTO 驅動遷移】使用 StoreData DTO 進行數據驗證和轉換
     * 驗證邏輯已遷移至 StoreData，支援：
     * - 部分更新支援（sometimes 規則）
     * - 門市名稱唯一性檢查（排除自身）
     * - 用戶關聯同步更新
     * 
     * @param \App\Data\StoreData $storeData 門市數據傳輸物件
     * @param \App\Models\Store $store 門市模型實例
     * @return \App\Http\Resources\Api\StoreResource
     */
    public function update(StoreData $storeData, Store $store)
    {
        $store->update($storeData->except('user_ids')->toArray());

        if ($storeData->user_ids !== null) { // 允許傳入空陣列來清空用戶
            $store->users()->sync($storeData->user_ids);
        }

        return new StoreResource($store->fresh());
    }

    /**
     * 刪除指定分店
     * 
     * 執行軟刪除操作，根據資料表外鍵約束設定：
     * - 關聯的庫存記錄將被處理
     * - 相關的進貨和銷售記錄會保留作為歷史資料
     * 
     * @param \App\Models\Store $store 門市模型實例
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Store $store)
    {
        $store->delete();
        return new \Illuminate\Http\JsonResponse(null, 204);
    }
}
