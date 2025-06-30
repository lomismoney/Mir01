<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAttributeValueRequest;
use App\Http\Requests\Api\UpdateAttributeValueRequest;
use App\Http\Resources\Api\AttributeValueResource;
use App\Models\Attribute;
use App\Models\AttributeValue;

/**
 * AttributeValueController 屬性值控制器
 * 
 * 處理屬性值的 CRUD 操作，支援 SPU/SKU 架構
 * 僅允許管理員進行操作，透過父屬性的 AttributePolicy 進行權限控制
 * 使用巢狀路由設計，屬性值依附於屬性存在
 * 
 * @group 屬性值管理
 * @authenticated
 */
class AttributeValueController extends Controller
{
    // 注意：由於路由是巢狀的，authorizeResource 無法完美運作，我們將手動授權。

    /**
     * 獲取指定屬性的所有值
     * 
     * 返回指定屬性下的所有屬性值列表
     * 
     * @queryParam filter[value] string 對屬性值進行篩選。 Example: 紅色
     * @queryParam include string 可選的關聯，用逗號分隔。例如: attribute
     * 
     * @authenticated
     * @response 200 scenario="屬性值列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "value": "紅色",
     *       "attribute_id": 1,
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
     */
    public function index(Attribute $attribute)
    {
        $this->authorize('view', $attribute);
        return AttributeValueResource::collection($attribute->values);
    }

    /**
     * 為指定屬性創建新值
     * 
     * 在指定屬性下創建一個新的屬性值
     * 屬性值在同一屬性下必須唯一
     * 
     * @bodyParam value string required 屬性值，例如：紅色、藍色、S、M、L Example: 紅色
     * 
     * @response 201 App\Http\Resources\Api\V1\AttributeValueResource
     */
    public function store(StoreAttributeValueRequest $request, Attribute $attribute)
    {
        $this->authorize('update', $attribute); // 只有能更新屬性的人，才能為其新增值
        $value = $attribute->values()->create($request->validated());
        return new AttributeValueResource($value);
    }

    /**
     * 獲取指定屬性值
     * 
     * 返回指定的屬性值詳細資訊
     * 
     * @urlParam value int required 屬性值 ID Example: 1
     * 
     * @response 200 scenario="屬性值詳情" {
     *   "data": {
     *     "id": 1,
     *     "value": "紅色",
     *     "attribute_id": 1,
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function show(AttributeValue $value)
    {
        $this->authorize('view', $value->attribute);
        return new AttributeValueResource($value);
    }

    /**
     * 更新指定的屬性值
     * @group 規格庫管理
     * @authenticated
     * @urlParam value integer required 要更新的屬性值的 ID。 Example: 1
     * @bodyParam value string required 新的屬性值。 Example: "深藍色"
     * @response 200 App\Http\Resources\Api\AttributeValueResource
     */
    public function update(UpdateAttributeValueRequest $request, AttributeValue $value)
    {
        $this->authorize('update', $value->attribute); // 檢查是否有權限更新其父屬性
        $value->update($request->validated());
        return new AttributeValueResource($value);
    }

    /**
     * 刪除指定屬性值
     * 
     * 刪除指定的屬性值
     * 注意：如果有商品變體正在使用此屬性值，刪除操作可能會失敗
     * 
     * @urlParam value int required 屬性值 ID Example: 1
     * 
     * @response 204
     */
    public function destroy(AttributeValue $value)
    {
        $this->authorize('update', $value->attribute);
        $value->delete();
        return response()->noContent();
    }
}
