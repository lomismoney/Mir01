<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAttributeRequest;
use App\Http\Requests\Api\UpdateAttributeRequest;
use App\Http\Resources\Api\AttributeResource;
use App\Models\Attribute;

/**
 * AttributeController 商品屬性控制器
 * 
 * 處理商品屬性的 CRUD 操作，支援 SPU/SKU 架構
 * 僅允許管理員進行操作，透過 AttributePolicy 進行權限控制
 * 
 * @group 商品屬性管理
 * @authenticated
 */
class AttributeController extends Controller
{
    /**
     * 建構函式
     * 
     * 自動綁定權限檢查，所有操作都會自動檢查 AttributePolicy
     */
    public function __construct()
    {
        $this->authorizeResource(Attribute::class, 'attribute');
    }

    /**
     * 獲取所有屬性列表
     * 
     * 返回系統中所有的商品屬性，包含其相關的屬性值
     * 使用 Eager Loading 避免 N+1 查詢問題
     * 
     * @authenticated
     * @queryParam filter[attribute_name] string 對屬性名稱進行篩選。 Example: 顏色
     * @queryParam include string 可選的關聯，用逗號分隔。例如: values
     * 
     * @response 200 scenario="屬性列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "顏色",
     *       "description": "商品顏色屬性",
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
     */
    public function index()
    {
        // Eager load values to prevent N+1 queries when using the resource
        return AttributeResource::collection(Attribute::with('values')->get());
    }

    /**
     * 創建新屬性
     * 
     * 創建一個新的商品屬性，屬性名稱必須唯一
     * 
     * @bodyParam name string required 屬性名稱，例如：顏色、尺寸、材質 Example: 顏色
     * 
     * @response 201 App\Http\Resources\Api\V1\AttributeResource
     */
    public function store(StoreAttributeRequest $request)
    {
        $attribute = Attribute::create($request->validated());
        return new AttributeResource($attribute);
    }

    /**
     * 獲取指定屬性
     * 
     * 返回指定的商品屬性詳細資訊，包含其所有屬性值
     * 
     * @urlParam attribute int required 屬性 ID Example: 1
     * 
     * @response App\Http\Resources\Api\V1\AttributeResource
     */
    public function show(Attribute $attribute)
    {
        return new AttributeResource($attribute->load('values'));
    }

    /**
     * 更新指定屬性
     * 
     * 更新指定的商品屬性，屬性名稱必須唯一（忽略當前屬性）
     * 
     * @urlParam attribute int required 屬性 ID Example: 1
     * @bodyParam name string required 屬性名稱 Example: 顏色
     * 
     * @response App\Http\Resources\Api\V1\AttributeResource
     */
    public function update(UpdateAttributeRequest $request, Attribute $attribute)
    {
        $attribute->update($request->validated());
        return new AttributeResource($attribute);
    }

    /**
     * 刪除指定屬性
     * 
     * 刪除指定的商品屬性及其所有相關的屬性值
     * 注意：如果有商品變體正在使用此屬性的值，刪除操作可能會失敗
     * 
     * @urlParam attribute int required 屬性 ID Example: 1
     * 
     * @response 204
     */
    public function destroy(Attribute $attribute)
    {
        $attribute->delete();
        return response()->noContent();
    }
}
