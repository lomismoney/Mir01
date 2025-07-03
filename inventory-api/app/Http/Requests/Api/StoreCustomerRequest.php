<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Knuckles\Scribe\Attributes\BodyParam;

class StoreCustomerRequest extends FormRequest
{
    /**
     * 確定使用者是否有權限發出此請求
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 暫時允許所有認證用戶，實際權限可在控制器中檢查
    }

    /**
     * 獲取適用於請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50|unique:customers,phone',
            'email' => 'nullable|email|max:255|unique:customers,email',
            'is_company' => 'required|boolean',
            // 當 is_company 為 true 時，tax_id 為必填且唯一
            'tax_id' => 'nullable|string|max:50|unique:customers,tax_id|required_if:is_company,true',
            'industry_type' => 'required|string|max:50',
            'payment_type' => 'required|string|max:50',
            'contact_address' => 'nullable|string|max:255',
            // 驗證地址陣列
            'addresses' => 'nullable|array',
            'addresses.*.address' => 'required|string|max:255',
            'addresses.*.is_default' => 'required|boolean',
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
            'name.required' => '客戶姓名為必填項目',
            'name.max' => '客戶姓名不得超過 255 個字元',
            'phone.unique' => '此電話號碼已被使用',
            'phone.max' => '電話號碼不得超過 50 個字元',
            'email.email' => '請輸入有效的電子郵件地址',
            'email.unique' => '此電子郵件地址已被使用',
            'email.max' => '電子郵件地址不得超過 255 個字元',
            'is_company.required' => '請指定是否為公司客戶',
            'tax_id.unique' => '此統一編號已被使用',
            'tax_id.required_if' => '公司客戶必須填寫統一編號',
            'tax_id.max' => '統一編號不得超過 50 個字元',
            'industry_type.required' => '行業別為必填項目',
            'industry_type.max' => '行業別不得超過 50 個字元',
            'payment_type.required' => '付款類別為必填項目',
            'payment_type.max' => '付款類別不得超過 50 個字元',
            'contact_address.max' => '聯絡地址不得超過 255 個字元',
            'addresses.array' => '地址必須為陣列格式',
            'addresses.*.address.required' => '地址內容為必填項目',
            'addresses.*.address.max' => '地址內容不得超過 255 個字元',
            'addresses.*.is_default.required' => '必須指定是否為預設地址',
            'addresses.*.is_default.boolean' => '預設地址標記必須為布林值',
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
            'name' => [
                'description' => '客戶名稱或公司抬頭',
                'example' => '測試客戶',
            ],
            'phone' => [
                'description' => '手機號碼',
                'example' => '0987654321',
            ],
            'email' => [
                'description' => '電子郵件地址',
                'example' => 'customer@example.com',
            ],
            'is_company' => [
                'description' => '是否為公司戶',
                'example' => false,
            ],
            'tax_id' => [
                'description' => '統一編號 (is_company為true時必填)',
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
                        'address' => '台北市大安區復興南路一段100號',
                        'is_default' => true,
                    ],
                    [
                        'address' => '台北市信義區市府路45號',
                        'is_default' => false,
                    ],
                ],
            ],
            'addresses.*.address' => [
                'description' => '詳細地址',
                'example' => '台北市大安區復興南路一段100號',
            ],
            'addresses.*.is_default' => [
                'description' => '是否為預設地址',
                'example' => true,
            ],
        ];
    }
}
