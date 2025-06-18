<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 單規格商品創建請求驗證 (v3.0 雙軌制 API)
 * 
 * 專門用於處理單規格商品的創建請求，提供最簡化的驗證規則。
 * 相比於 StoreProductRequest，此類只關注核心商品資訊，
 * 無需前端處理複雜的 SPU/SKU 屬性結構。
 */
class StoreSimpleProductRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限發出此請求
     */
    public function authorize(): bool
    {
        return true; // 暫時允許所有請求，實際權限由控制器處理
    }

    /**
     * 取得適用於此請求的驗證規則
     * 
     * 簡化版驗證規則，只包含創建單規格商品的核心字段：
     * - name: 商品名稱
     * - sku: 唯一的庫存單位編號
     * - price: 商品價格
     * - category_id: 可選的分類 ID
     * - description: 可選的商品描述
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:product_variants,sku',
            'price' => 'required|numeric|min:0',
            'category_id' => 'nullable|integer|exists:categories,id',
            'description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * 取得自定義驗證錯誤訊息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => '商品名稱為必填項目',
            'name.max' => '商品名稱不能超過 255 個字符',
            'sku.required' => 'SKU 編號為必填項目',
            'sku.unique' => '此 SKU 編號已存在，請使用其他編號',
            'sku.max' => 'SKU 編號不能超過 255 個字符',
            'price.required' => '商品價格為必填項目',
            'price.numeric' => '商品價格必須為數字',
            'price.min' => '商品價格不能為負數',
            'category_id.exists' => '指定的分類不存在',
            'description.max' => '商品描述不能超過 1000 個字符',
        ];
    }

    /**
     * 取得請求主體參數的描述，用於 API 文件生成
     *
     * @return array<string, array<string, mixed>|string>
     */
    public function bodyParameters(): array
    {
        return [
            'name' => [
                'description' => '商品名稱，將同時作為 SPU 名稱使用。',
                'example' => '經典白色T恤',
            ],
            'sku' => [
                'description' => '唯一的庫存單位編號，用於識別此商品變體。',
                'example' => 'TSHIRT-WHITE-001',
            ],
            'price' => [
                'description' => '商品售價，必須為正數。',
                'example' => 299.99,
            ],
            'category_id' => [
                'description' => '商品所屬分類的 ID，可為空表示不屬於任何分類。',
                'example' => 1,
            ],
            'description' => [
                'description' => '商品的詳細描述，可為空。',
                'example' => '100% 純棉材質，舒適透氣，適合日常穿著。',
            ],
        ];
    }
} 