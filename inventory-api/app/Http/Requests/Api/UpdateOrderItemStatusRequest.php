<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderItemStatusRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權限執行此請求
     */
    public function authorize(): bool
    {
        // TODO: 實現權限驗證邏輯
        // 例如：檢查用戶是否有權限修改此訂單項目
        return true; // 暫時允許所有已認證用戶
    }

    /**
     * 獲取應用於請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in(['待處理', '已叫貨', '已出貨', '完成'])
            ],
            'notes' => 'nullable|string|max:500', // 可選的備註
        ];
    }

    /**
     * 獲取驗證錯誤的自定義屬性名稱
     */
    public function attributes(): array
    {
        return [
            'status' => '項目狀態',
            'notes' => '備註',
        ];
    }

    /**
     * 獲取驗證錯誤的自定義訊息
     */
    public function messages(): array
    {
        return [
            'status.required' => '項目狀態為必填欄位',
            'status.in' => '項目狀態必須是：待處理、已叫貨、已出貨、完成 其中之一',
            'notes.max' => '備註不能超過 500 個字符',
        ];
    }
}
