<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreStoreRequest;
use App\Http\Requests\Api\StoreUpdateRequest;
use App\Http\Resources\Api\StoreResource;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
     * @responseFile storage/responses/stores.index.json
     * 
     * @return AnonymousResourceCollection
     */
    public function index(): AnonymousResourceCollection
    {
        $stores = Store::paginate(15);
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
     * @param Store $store
     * @return StoreResource
     */
    public function show(Store $store): StoreResource
    {
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
