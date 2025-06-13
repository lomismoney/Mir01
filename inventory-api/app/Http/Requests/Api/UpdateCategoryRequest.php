<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateCategoryRequest 更新分類請求驗證
 * 
 * 定義更新分類時的數據驗證規則，包含防止自我循環的重要業務邏輯
 * 確保分類樹狀結構的完整性和避免無限循環問題
 * 
 * @bodyParam name string 分類名稱。例如：電子產品
 * @bodyParam description string 分類描述。例如：包含所有電子相關產品
 * @bodyParam parent_id integer 父分類ID，必須是存在的分類ID且不能是自己。例如：1
 */
class UpdateCategoryRequest extends FormRequest
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
        return true;
    }

    /**
     * 取得適用於請求的驗證規則
     * 
     * 更新分類時的驗證規則：
     * - name: 可選更新，如果提供則必須是字串且最大長度255字符
     * - description: 可選，字串類型，用於分類描述
     * - parent_id: 可選，必須存在於 categories 表中，且不能是自己
     * 
     * 重要業務邏輯：使用 Rule::notIn 防止分類設定為自己的父分類，避免無限循環
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => [
                'nullable', 
                'integer', 
                'exists:categories,id'
            ],
        ];

        // 動態添加自我循環檢查（避免 Scribe 分析時出錯）
        if ($this->route('category')) {
            $rules['parent_id'][] = Rule::notIn([$this->route('category')->id]);
        }

        return $rules;
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
            'parent_id.not_in' => '分類不能設定自己為父分類，這會造成循環關係',
        ];
    }

    /**
     * 取得請求的參數說明，用於 API 文檔生成
     *
     * @return array<string, array>
     */
    public function bodyParameters()
    {
        return [
            'name' => [
                'description' => '分類名稱',
                'example' => '電子產品',
                'required' => false,
            ],
            'description' => [
                'description' => '分類描述',
                'example' => '包含所有電子相關產品',
                'required' => false,
            ],
            'parent_id' => [
                'description' => '父分類ID，必須是存在的分類ID且不能是自己',
                'example' => 1,
                'required' => false,
            ],
        ];
    }
}
