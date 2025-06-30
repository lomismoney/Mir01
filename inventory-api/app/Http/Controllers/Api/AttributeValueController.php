<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAttributeValueRequest;
use App\Http\Requests\Api\UpdateAttributeValueRequest;
use App\Http\Resources\Api\AttributeValueResource;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * @group 屬性值管理
 * @authenticated
 * 
 * AttributeValueController 屬性值控制器
 * 
 * 處理屬性值的 CRUD 操作，支援 SPU/SKU 架構
 * 僅允許管理員進行操作，透過父屬性的 AttributePolicy 進行權限控制
 * 使用巢狀路由設計，屬性值依附於屬性存在
 */
class AttributeValueController extends Controller
{
    // 注意：由於路由是巢狀的，authorizeResource 無法完美運作，我們將手動授權。

    /**
     * @summary 獲取指定屬性的所有值
     * @description 返回指定屬性下的所有屬性值列表。
     * 
     * @urlParam attribute integer required 屬性 ID Example: 1
     * @queryParam filter[value] string 對屬性值進行篩選。 Example: 紅色
     * @queryParam include string 可選的關聯，用逗號分隔。例如: attribute
     * 
     * @apiResourceCollection \App\Http\Resources\Api\AttributeValueResource
     * @apiResourceModel \App\Models\AttributeValue
     */
    public function index(Attribute $attribute): AnonymousResourceCollection
    {
        $this->authorize('view', $attribute);
        return AttributeValueResource::collection($attribute->values);
    }

    /**
     * @summary 為指定屬性創建新值
     * @description 在指定屬性下創建一個新的屬性值，屬性值在同一屬性下必須唯一。
     * 
     * @urlParam attribute integer required 屬性 ID Example: 1
     * @bodyParam value string required 屬性值，例如：紅色、藍色、S、M、L Example: 紅色
     * 
     * @apiResource \App\Http\Resources\Api\AttributeValueResource
     * @apiResourceModel \App\Models\AttributeValue
     */
    public function store(StoreAttributeValueRequest $request, Attribute $attribute): AttributeValueResource
    {
        $this->authorize('update', $attribute); // 只有能更新屬性的人，才能為其新增值
        $value = $attribute->values()->create($request->validated());
        return new AttributeValueResource($value);
    }

    /**
     * @summary 獲取指定屬性值
     * @description 返回指定的屬性值詳細資訊。
     * 
     * @urlParam value integer required 屬性值 ID Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\AttributeValueResource
     * @apiResourceModel \App\Models\AttributeValue
     */
    public function show(AttributeValue $value): AttributeValueResource
    {
        $this->authorize('view', $value->attribute);
        return new AttributeValueResource($value);
    }

    /**
     * @summary 更新指定的屬性值
     * @urlParam value integer required 要更新的屬性值的 ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\AttributeValueResource
     * @apiResourceModel \App\Models\AttributeValue
     */
    public function update(UpdateAttributeValueRequest $request, AttributeValue $value): AttributeValueResource
    {
        $this->authorize('update', $value->attribute); // 檢查是否有權限更新其父屬性
        $value->update($request->validated());
        return new AttributeValueResource($value);
    }

    /**
     * @summary 刪除指定屬性值
     * @description 刪除指定的屬性值。注意：如果有商品變體正在使用此屬性值，刪除操作可能會失敗。
     * 
     * @urlParam value integer required 屬性值 ID Example: 1
     * 
     * @response 204
     */
    public function destroy(AttributeValue $value): Response
    {
        $this->authorize('update', $value->attribute);
        $value->delete();
        return response()->noContent();
    }
}
