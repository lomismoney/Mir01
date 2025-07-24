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
        // 獲取訂單項目實例
        $orderItem = $this->route('order_item');
        
        // 如果找不到訂單項目，返回 false
        if (!$orderItem) {
            return false;
        }
        
        // 使用 OrderPolicy 的 update 方法檢查用戶是否有權限更新訂單
        // 因為訂單項目的權限應該與其所屬訂單的權限一致
        return $this->user()->can('update', $orderItem->order);
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
            'status' => [
                'description' => '項目狀態（待處理、已叫貨、已出貨、完成）',
                'example' => '已叫貨',
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '已向供應商下單',
            ],
        ];
    }
}
