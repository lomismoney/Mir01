<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAttributeRequest;
use App\Http\Requests\Api\UpdateAttributeRequest;
use App\Http\Resources\Api\AttributeResource;
use App\Models\Attribute;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * @group 商品屬性管理
 * @authenticated
 * 
 * AttributeController 商品屬性控制器
 * 
 * 處理商品屬性的 CRUD 操作，支援 SPU/SKU 架構
 * 僅允許管理員進行操作，透過 AttributePolicy 進行權限控制
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
     * @summary 獲取所有屬性列表
     * @description 返回系統中所有的商品屬性，包含其相關的屬性值。
     * @queryParam filter[attribute_name] string 對屬性名稱進行篩選。 Example: 顏色
     * @queryParam include string 可選的關聯，用逗號分隔。例如: values
     * 
     * @apiResourceCollection \App\Http\Resources\Api\AttributeResource
     * @apiResourceModel \App\Models\Attribute
     */
    public function index(): AnonymousResourceCollection
    {
        // 獲取所有屬性並加載關聯
        $attributes = Attribute::with('values')->get();
        
        // 確保每個屬性都有 products_count
        // 強制調用 accessor 來確保值被計算
        $attributes->each(function ($attribute) {
            $attribute->append('products_count');
        });
        
        return AttributeResource::collection($attributes);
    }

    /**
     * @summary 創建新屬性
     * @description 創建一個新的商品屬性，屬性名稱必須唯一。
     * 
     * @apiResource \App\Http\Resources\Api\AttributeResource
     * @apiResourceModel \App\Models\Attribute
     */
    public function store(StoreAttributeRequest $request): AttributeResource
    {
        $attribute = Attribute::create($request->validated());
        return new AttributeResource($attribute);
    }

    /**
     * @summary 獲取指定屬性
     * @description 返回指定的商品屬性詳細資訊，包含其所有屬性值。
     * 
     * @urlParam attribute integer required 屬性 ID Example: 1
     * 
     * @response App\Http\Resources\Api\V1\AttributeResource
     */
    public function show(Attribute $attribute): AttributeResource
    {
        return new AttributeResource($attribute->load('values'));
    }

    /**
     * @summary 更新指定屬性
     * @description 更新指定的商品屬性，屬性名稱必須唯一（忽略當前屬性）。
     * 
     * @bodyParam name string required 屬性名稱 Example: 顏色
     * 
     * @apiResource \App\Http\Resources\Api\AttributeResource
     * @apiResourceModel \App\Models\Attribute
     */
    public function update(UpdateAttributeRequest $request, Attribute $attribute): AttributeResource
    {
        $attribute->update($request->validated());
        return new AttributeResource($attribute);
    }

    /**
     * @summary 刪除指定屬性
     * @description 刪除指定的商品屬性及其所有相關的屬性值。注意：如果有商品變體正在使用此屬性的值，刪除操作可能會失敗。
     * 
     * @urlParam attribute integer required 屬性 ID Example: 1
     * 
     * @response 204
     */
    public function destroy(Attribute $attribute): Response
    {
        $attribute->delete();
        return response()->noContent();
    }
}
