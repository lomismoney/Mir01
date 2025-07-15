<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class DestroyMultipleCustomersRequest extends FormRequest
{
    /**
     * 判斷使用者是否有權限發出此請求
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 取得適用於此請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'required|integer|exists:customers,id',
        ];
    }

    /**
     * 取得驗證錯誤的自訂訊息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => '必須提供要刪除的客戶 ID',
            'ids.array' => 'ID 必須為陣列格式',
            'ids.min' => '至少需要選擇一個客戶',
            'ids.max' => '一次最多只能刪除 100 個客戶',
            'ids.*.required' => '客戶 ID 為必填項目',
            'ids.*.integer' => '客戶 ID 必須為整數',
            'ids.*.exists' => '指定的客戶不存在',
        ];
    }

    /**
     * 定義請求參數文檔（用於 Scribe API 文檔生成）
     *
     * @return array
     */
    public function bodyParameters(): array
    {
        return [
            'ids' => [
                'description' => '要刪除的客戶 ID 陣列',
                'example' => [1, 2, 3],
            ],
        ];
    }
}