<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreAttributeRequest 新增屬性請求驗證
 * 
 * 處理創建新屬性時的資料驗證，確保資料完整性和唯一性
 * 
 * @bodyParam name string required 屬性名稱（唯一）。例如：顏色
 */
class StoreAttributeRequest extends FormRequest
{
    /**
     * 檢查使用者是否有權限執行此請求
     * 
     * 授權檢查由 AttributePolicy 處理，此處返回 true
     * 實際權限由控制器的 authorizeResource() 自動檢查
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 定義驗證規則
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 屬性名稱：必填、字串、全域唯一、最大長度 255 字元
            'name' => 'required|string|unique:attributes,name|max:255',
        ];
    }

    /**
     * 自定義驗證錯誤訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => '屬性名稱為必填欄位',
            'name.string' => '屬性名稱必須為字串格式',
            'name.unique' => '此屬性名稱已存在，請使用其他名稱',
            'name.max' => '屬性名稱不能超過 255 個字元',
        ];
    }

    /**
     * 自定義欄位名稱
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => '屬性名稱',
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
                'description' => '屬性名稱（唯一）',
                'example' => '顏色',
                'required' => true,
            ],
        ];
    }
}
