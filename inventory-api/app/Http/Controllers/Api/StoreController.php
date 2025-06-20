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
     * @responseFile storage/responses/stores.index.json
     * 
     * @return AnonymousResourceCollection
     */
    public function index(): AnonymousResourceCollection
    {
        $stores = QueryBuilder::for(Store::class)
            ->allowedIncludes(['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'])
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
     * 
     * 獲取指定分店
     * 
     * 獲取指定ID的分店詳細信息。
     * 
     * @apiResource App\Http\Resources\Api\StoreResource
     * @apiResourceModel App\Models\Store
     * 
     * @urlParam store integer required 分店 ID. Example: 1
     * @queryParam include string 可選的關聯，用逗號分隔。例如: users,inventories
     * @param Store $store
     * @return StoreResource
     */
    public function show(Store $store): StoreResource
    {
        $store = QueryBuilder::for(Store::class)
            ->where('id', $store->id)
            ->allowedIncludes(['users', 'inventories', 'purchases', 'sales', 'transfersOut', 'transfersIn'])
            ->firstOrFail();

        return new StoreResource($store);
    }

    /**
     * @group Store Management
     * @authenticated
     * 
     * 更新指定分店
     * 
     * 更新指定ID的分店信息。
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
     * 
     * 刪除指定分店
     * 
     * 刪除指定ID的分店。
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
