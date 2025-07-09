<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class BatchUpdateStatusRequest extends FormRequest
{
    /**
     * 確定使用者是否有權限執行此請求
     * 
     * 權限驗證委派給控制器中的 authorize() 方法處理，
     * 因此此處返回 true
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 獲取適用於該請求的驗證規則
     * 
     * 批量更新訂單狀態的驗證規則：
     * - ids: 必須是陣列且不能為空
     * - ids.*: 每個元素必須是整數且在 orders 表中存在
     * - status_type: 必須是 payment_status 或 shipping_status
     * - status_value: 狀態值，最大長度 50 字符
     * - notes: 可選備註，最大長度 500 字符
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1', // 確保 ids 是必填且為非空陣列
            'ids.*' => 'integer|exists:orders,id', // 確保每個 ID 都是整數且存在於訂單表中
            'status_type' => 'required|string|in:payment_status,shipping_status', // 指明要更新哪個狀態
            'status_value' => 'required|string|max:50', // 要更新成的目標狀態值
            'notes' => 'nullable|string|max:500', // 可選備註
        ];
    }

    /**
     * 獲取自定義驗證錯誤訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => '請選擇要更新狀態的訂單',
            'ids.array' => '訂單 ID 格式不正確',
            'ids.min' => '至少需要選擇一個訂單進行狀態更新',
            'ids.*.integer' => '訂單 ID 必須是有效的數字',
            'ids.*.exists' => '選擇的訂單不存在或已被刪除',
            'status_type.required' => '請指定要更新的狀態類型',
            'status_type.in' => '狀態類型必須是付款狀態或貨物狀態',
            'status_value.required' => '請提供狀態值',
            'status_value.max' => '狀態值不能超過 50 個字符',
            'notes.max' => '備註不能超過 500 個字符',
        ];
    }
    
    /**
     * 取得請求體參數的文檔
     * 
     * 用於 Scribe API 文檔生成
     * 
     * @return array
     */
    public function bodyParameters(): array
    {
        return [
            'ids' => [
                'description' => '要更新狀態的訂單 ID 陣列',
                'example' => [1, 2, 3],
            ],
            'ids.*' => [
                'description' => '訂單 ID，必須是有效的整數且存在於系統中',
                'example' => 1,
            ],
            'status_type' => [
                'description' => '要更新的狀態類型（payment_status 或 shipping_status）',
                'example' => 'payment_status',
            ],
            'status_value' => [
                'description' => '要更新的狀態值',
                'example' => 'paid',
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '批量標記為已付款',
            ],
        ];
    }
} 