<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
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
        // 獲取路由中正在更新的 customer ID
        $customer = $this->route('customer');
        $customerId = $customer ? $customer->id : null;

        return [
            // 客戶基本資訊驗證
            'name' => 'required|string|max:255',
            
            // 驗證 phone 唯一性時，忽略當前客戶自己的 phone
            'phone' => [
                'nullable', 
                'string', 
                'max:50', 
                Rule::unique('customers')->ignore($customerId)
            ],
            
            // 客戶類型 (個人/公司)
            'is_company' => 'required|boolean',
            
            // 驗證 tax_id 唯一性時，忽略當前客戶自己的 tax_id
            // 如果是公司客戶，則統一編號為必填
            'tax_id' => [
                'nullable', 
                'string', 
                'max:50', 
                Rule::unique('customers')->ignore($customerId), 
                'required_if:is_company,true'
            ],
            
            // 行業別和付款方式
            'industry_type' => 'required|string|max:50',
            'payment_type' => 'required|string|max:50',
            
            // 主要聯絡地址 (可選)
            'contact_address' => 'nullable|string|max:255',
            
            // 驗證地址陣列 (用於地址管理)
            'addresses' => 'nullable|array',
            'addresses.*.id' => 'sometimes|integer|exists:customer_addresses,id', // 編輯時可能會傳入地址 id
            'addresses.*.address' => 'required|string|max:255',
            'addresses.*.is_default' => 'required|boolean',
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
            // 基本資訊錯誤訊息
            'name.required' => '客戶名稱為必填項目',
            'name.max' => '客戶名稱不能超過 255 個字元',
            
            // 電話號碼錯誤訊息
            'phone.unique' => '此電話號碼已被其他客戶使用',
            'phone.max' => '電話號碼不能超過 50 個字元',
            
            // 客戶類型錯誤訊息
            'is_company.required' => '請選擇客戶類型（個人或公司）',
            'is_company.boolean' => '客戶類型格式錯誤',
            
            // 統一編號錯誤訊息
            'tax_id.unique' => '此統一編號已被其他客戶使用',
            'tax_id.required_if' => '公司客戶必須填寫統一編號',
            'tax_id.max' => '統一編號不能超過 50 個字元',
            
            // 行業別和付款方式錯誤訊息
            'industry_type.required' => '行業別為必填項目',
            'industry_type.max' => '行業別不能超過 50 個字元',
            'payment_type.required' => '付款方式為必填項目',
            'payment_type.max' => '付款方式不能超過 50 個字元',
            
            // 地址錯誤訊息
            'contact_address.max' => '主要聯絡地址不能超過 255 個字元',
            'addresses.array' => '地址資料格式錯誤',
            
            // 地址陣列項目錯誤訊息
            'addresses.*.id.integer' => '地址 ID 必須為整數',
            'addresses.*.id.exists' => '指定的地址不存在',
            'addresses.*.address.required' => '地址內容為必填項目',
            'addresses.*.address.max' => '地址不能超過 255 個字元',
            'addresses.*.is_default.required' => '請指定是否為預設地址',
            'addresses.*.is_default.boolean' => '預設地址設定格式錯誤',
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
            'name' => [
                'description' => '客戶名稱或公司抬頭',
                'example' => '測試客戶（已更新）',
            ],
            'phone' => [
                'description' => '手機號碼',
                'example' => '0987654321',
            ],
            'is_company' => [
                'description' => '是否為公司戶',
                'example' => false,
            ],
            'tax_id' => [
                'description' => '統一編號（is_company 為 true 時必填）',
                'example' => '12345678',
            ],
            'industry_type' => [
                'description' => '行業別',
                'example' => '設計師',
            ],
            'payment_type' => [
                'description' => '付款類別',
                'example' => '現金付款',
            ],
            'contact_address' => [
                'description' => '主要聯絡地址',
                'example' => '台北市信義區',
            ],
            'addresses' => [
                'description' => '運送地址列表',
                'example' => [
                    [
                        'id' => 1,
                        'address' => '台北市大安區',
                        'is_default' => true,
                    ],
                ],
            ],
        ];
    }
}
