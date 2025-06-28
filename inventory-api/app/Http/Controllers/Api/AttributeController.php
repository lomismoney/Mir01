<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\AttributeResource;
use App\Models\Attribute;
use Illuminate\Http\Request;

/**
 * 商品屬性管理控制器
 * 
 * 此控制器提供商品屬性（如顏色、尺寸、材質）的完整 CRUD 操作。
 * 所有操作都需要 admin 權限。
 */
class AttributeController extends Controller
{
    /**
     * 構造函數
     * 
     * 設置資源授權，確保所有操作都經過權限檢查
     */
    public function __construct()
    {
        $this->authorizeResource(Attribute::class, 'attribute');
    }

    /**
     * 顯示屬性列表
     * 
     * 獲取所有可用的商品屬性，支援篩選條件。
     * 預設包含每個屬性的所有可能值。
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection<\App\Http\Resources\Api\AttributeResource>
     */
    public function index(Request $request)
    {
        $query = Attribute::query();
        
        // 預設加載屬性值
        $query->with('values');
        
        // 支援按名稱篩選
        if ($request->has('filter.attribute_name')) {
            $query->where('name', 'like', '%' . $request->input('filter.attribute_name') . '%');
        }
        
        $attributes = $query->get();
        
        return AttributeResource::collection($attributes);
    }

    /**
     * 儲存新建立的屬性
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \App\Http\Resources\Api\AttributeResource
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name',
        ], [
            'name.required' => '屬性名稱為必填項目',
            'name.unique' => '此屬性名稱已經存在',
        ]);

        $attribute = Attribute::create($validated);
        
        return new AttributeResource($attribute->load('values'));
    }

    /**
     * 顯示指定的屬性
     * 
     * @param  \App\Models\Attribute  $attribute
     * @return \App\Http\Resources\Api\AttributeResource
     */
    public function show(Attribute $attribute)
    {
        return new AttributeResource($attribute->load('values'));
    }

    /**
     * 更新指定的屬性
     * 
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Attribute  $attribute
     * @return \App\Http\Resources\Api\AttributeResource
     */
    public function update(Request $request, Attribute $attribute)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name,' . $attribute->id,
        ], [
            'name.required' => '屬性名稱為必填項目',
            'name.unique' => '此屬性名稱已經存在',
        ]);

        $attribute->update($validated);
        
        return new AttributeResource($attribute->load('values'));
    }

    /**
     * 刪除指定的屬性
     * 
     * @param  \App\Models\Attribute  $attribute
     * @return \Illuminate\Http\Response
     */
    public function destroy(Attribute $attribute)
    {
        $attribute->delete();
        
        return response()->noContent();
    }
}
