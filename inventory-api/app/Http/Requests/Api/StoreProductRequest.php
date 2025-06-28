<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Product;

class StoreProductRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限發出此請求
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    /**
     * 取得適用於此請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'category_id'   => 'nullable|integer|exists:categories,id',
            'attributes'    => 'array', // 🎯 允許空陣列，支援單規格商品
            'attributes.*'  => 'integer|exists:attributes,id',
            
            'variants'      => 'required|array|min:1',
            'variants.*.sku' => 'required|string|unique:product_variants,sku|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.attribute_value_ids' => 'array', // 🎯 允許空陣列，支援單規格商品
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
        ];
    }


}
