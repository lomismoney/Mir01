<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store 資源的表單驗證請求
 * 
 * 根據 API Platform 官方文檔最佳實踐
 * 用於處理分店創建和更新的資料驗證和授權
 */
class StoreFormRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限進行此請求
     */
    public function authorize(): bool
    {
        // 根據 API Platform 文檔，這裡應該返回 true
        // 因為我們使用 Sanctum 中間件進行認證
        return true;
    }

    /**
     * 獲取驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'code' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'manager_id' => 'nullable|integer|exists:users,id',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * 自訂驗證錯誤訊息
     */
    public function messages(): array
    {
        return [
            'name.required' => '分店名稱為必填欄位',
            'name.max' => '分店名稱不能超過 255 個字元',
            'address.max' => '地址不能超過 500 個字元',
            'code.max' => '分店代碼不能超過 50 個字元',
            'phone.max' => '電話號碼不能超過 50 個字元',
            'manager_id.integer' => '管理員 ID 必須是數字',
            'manager_id.exists' => '指定的管理員不存在',
            'is_active.boolean' => '啟用狀態必須是 true 或 false',
            'description.max' => '描述不能超過 1000 個字元',
        ];
    }
}
