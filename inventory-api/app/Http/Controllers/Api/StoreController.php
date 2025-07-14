<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStoreRequest;
use App\Http\Requests\Api\StoreUpdateRequest;
use App\Http\Resources\Api\StoreResource;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;

class StoreController extends Controller
{
    /**
     * 建構子
     */
    public function __construct()
    {
        $this->authorizeResource(Store::class, 'store');
    }

    /**
     * @group Store Management
     * @authenticated
     * 
     * 列出所有分店
     * 
     * 獲取系統中的所有分店列表。
     * 
     * @queryParam include string 可選的關聯，用逗號分隔。例如: users,inventories
     * @response 200 scenario="門市列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "門市名稱",
     *       "address": "門市地址",
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
     * 
     * @return AnonymousResourceCollection
     */
    public function index(): AnonymousResourceCollection
    {
        $stores = QueryBuilder::for(Store::class)
            ->allowedIncludes(['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'])
            ->withCount(['users', 'inventories'])
            ->paginate(15);
            
        return StoreResource::collection($stores);
    }

    /**
     * @group Store Management
     * @authenticated
     * 
     * 創建新分店
     * 
     * 創建一個新的分店記錄。
     * 
     * @apiResource App\Http\Resources\Api\StoreResource
     * @apiResourceModel App\Models\Store
     * 
     * @param StoreStoreRequest $request
     * @return StoreResource
     */
    public function store(StoreStoreRequest $request): StoreResource
    {
        $store = Store::create($request->validated());
        return new StoreResource($store);
    }

    /**
     * @group Store Management
     * @authenticated
     * @summary 獲取指定分店
     * @description 獲取指定ID的分店詳細信息。
     * 
     * @urlParam store integer required 分店ID。 Example: 1
     * @queryParam include string 可選的關聯，用逗號分隔。例如: users,inventories
     * 
     * @apiResource App\Http\Resources\Api\StoreResource
     * @apiResourceModel App\Models\Store
     * 
     * @param Store $store
     * @return StoreResource
     */
    public function show(Store $store): StoreResource
    {
        // The $store model is already resolved by route model binding.
        // We can directly load the allowed relations onto the existing instance
        // without making a redundant database query.
        $allowedIncludes = ['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'];
        
        if (request()->has('include')) {
            $includeParam = request()->input('include');
            $requestedIncludes = [];
            
            // Handle both string and array formats for include parameter
            if (is_string($includeParam) && !empty($includeParam)) {
                // Handle comma-separated string: ?include=users,inventories
                $requestedIncludes = explode(',', $includeParam);
            } elseif (is_array($includeParam) && !empty($includeParam)) {
                // Handle array format: ?include[]=users&include[]=inventories
                $requestedIncludes = $includeParam;
            }
            
            if (!empty($requestedIncludes)) {
                $includesToLoad = array_intersect($requestedIncludes, $allowedIncludes);

                if (!empty($includesToLoad)) {
                    $store->load($includesToLoad);
                }
            }
        }

        return new StoreResource($store);
    }

    /**
     * @group Store Management
     * @authenticated
     * @summary 更新指定分店
     * @description 更新指定ID的分店信息。
     * 
     * @urlParam store integer required 分店ID。 Example: 1
     * 
     * @apiResource App\Http\Resources\Api\StoreResource
     * @apiResourceModel App\Models\Store
     * 
     * @param StoreUpdateRequest $request
     * @param Store $store
     * @return StoreResource
     */
    public function update(StoreUpdateRequest $request, Store $store): StoreResource
    {
        $store->update($request->validated());
        return new StoreResource($store);
    }

    /**
     * @group Store Management
     * @authenticated
     * @summary 刪除指定分店
     * @description 刪除指定ID的分店。
     * 
     * @urlParam store integer required 分店ID。 Example: 1
     * 
     * @response 204 scenario="刪除成功"
     * 
     * @param Store $store
     * @return JsonResponse
     */
    public function destroy(Store $store): JsonResponse
    {
        $store->delete();
        return response()->json(null, 204);
    }
}
