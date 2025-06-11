<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreCategoryRequest 新增分類請求驗證
 * 
 * 定義新增分類時的數據驗證規則，確保數據完整性和業務邏輯正確性
 * 包含分類名稱、描述和父分類的完整驗證
 */
class StoreCategoryRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權限執行此請求
     * 
     * 權限檢查已在 CategoryController 的 authorizeResource 中處理
     * 這裡返回 true 避免重複檢查
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 權限已在控制器中處理
    }

    /**
     * 取得適用於請求的驗證規則
     * 
     * 新增分類時的驗證規則：
     * - name: 必填，字串類型，最大長度255字符
     * - description: 可選，字串類型，用於分類描述
     * - parent_id: 可選，必須是存在於 categories 表中的有效 ID
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            // parent_id 必須是一個存在於 categories 表中的 id
            'parent_id' => 'nullable|integer|exists:categories,id',
        ];
    }

    /**
     * 取得驗證錯誤的自定義屬性名稱
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => '分類名稱',
            'description' => '分類描述',
            'parent_id' => '父分類',
        ];
    }

    /**
     * 取得驗證錯誤的自定義訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => '分類名稱為必填項目',
            'name.string' => '分類名稱必須是文字格式',
            'name.max' => '分類名稱不能超過 255 個字符',
            'description.string' => '分類描述必須是文字格式',
            'parent_id.integer' => '父分類 ID 必須是數字',
            'parent_id.exists' => '指定的父分類不存在',
        ];
    }
}
