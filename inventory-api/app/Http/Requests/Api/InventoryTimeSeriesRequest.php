<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 庫存時序數據查詢請求
 * 
 * 用於驗證獲取商品變體庫存時序數據的查詢參數
 * 注意：此請求只接受查詢字符串參數（GET 請求）
 */
class InventoryTimeSeriesRequest extends FormRequest
{
    /**
     * 授權檢查
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 權限檢查在控制器中進行
    }

    /**
     * 準備驗證數據 - 確保只使用查詢參數
     */
    protected function prepareForValidation(): void
    {
        // 對於 GET 請求，明確只使用查詢參數
        $this->merge($this->query());
    }

    /**
     * 取得查詢參數的規則
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'product_variant_id' => 'required|integer|exists:product_variants,id',
            'start_date' => 'required|date|date_format:Y-m-d',
            'end_date' => 'required|date|date_format:Y-m-d|after_or_equal:start_date',
        ];
    }

    /**
     * 自定義錯誤訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_variant_id.required' => '商品變體ID為必填欄位',
            'product_variant_id.integer' => '商品變體ID必須為整數',
            'product_variant_id.exists' => '指定的商品變體不存在',
            'start_date.required' => '開始日期為必填欄位',
            'start_date.date' => '開始日期格式不正確',
            'start_date.date_format' => '開始日期必須為 Y-m-d 格式',
            'end_date.required' => '結束日期為必填欄位',
            'end_date.date' => '結束日期格式不正確',
            'end_date.date_format' => '結束日期必須為 Y-m-d 格式',
            'end_date.after_or_equal' => '結束日期不能早於開始日期',
        ];
    }
    
    /**
     * 取得查詢參數的文檔
     * 
     * 用於 Scribe API 文檔生成
     * 
     * @return array
     */
    public function queryParameters(): array
    {
        return [
            'product_variant_id' => [
                'description' => '商品變體 ID',
                'example' => 1,
            ],
            'start_date' => [
                'description' => '開始日期（格式：Y-m-d）',
                'example' => '2025-06-01',
            ],
            'end_date' => [
                'description' => '結束日期（格式：Y-m-d）',
                'example' => '2025-06-24',
            ],
        ];
    }
} 