<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class BatchDeleteOrdersRequest extends FormRequest
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
     * 批量刪除訂單的驗證規則：
     * - ids: 必須是陣列且不能為空
     * - ids.*: 每個元素必須是整數且在 orders 表中存在
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1', // 確保 ids 是必填且為非空陣列
            'ids.*' => 'integer|exists:orders,id', // 確保每個 ID 都是整數且存在於訂單表中
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
            'ids.required' => '請選擇要刪除的訂單',
            'ids.array' => '訂單 ID 格式不正確',
            'ids.min' => '至少需要選擇一個訂單進行刪除',
            'ids.*.integer' => '訂單 ID 必須是有效的數字',
            'ids.*.exists' => '選擇的訂單不存在或已被刪除',
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
                'description' => '要刪除的訂單 ID 陣列',
                'example' => [1, 2, 3],
            ],
        ];
    }
}
