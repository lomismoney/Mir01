<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreAttributeValueRequest 新增屬性值請求驗證
 * 
 * 處理創建新屬性值時的資料驗證，確保屬性值在相同屬性下的唯一性
 * 例如：「顏色」屬性下不能有兩個「紅色」值，但「尺寸」屬性下可以有「紅色」值
 * 
 * @bodyParam value string required 屬性值（在同一屬性下必須唯一）。例如：紅色
 */
class StoreAttributeValueRequest extends FormRequest
{
    /**
     * 檢查使用者是否有權限執行此請求
     * 
     * 授權檢查由 AttributePolicy 處理，此處返回 true
     * 實際權限由控制器手動檢查父屬性的權限
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 權限將在控制器中由 Policy 處理
    }

    /**
     * 定義驗證規則
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 屬性值：必填、字串、最大長度 255 字元
            // 在同一個 attribute_id 下必須唯一
            'value' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attribute_values')->where(function ($query) {
                    return $query->where('attribute_id', $this->attribute->id);
                })
            ],
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
            'value.required' => '屬性值為必填欄位',
            'value.string' => '屬性值必須為字串格式',
            'value.unique' => '此屬性值在當前屬性下已存在，請使用其他值',
            'value.max' => '屬性值不能超過 255 個字元',
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
            'value' => '屬性值',
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
            'value' => [
                'description' => '屬性值（在同一屬性下必須唯一）',
                'example' => '紅色',
                'required' => true,
            ],
        ];
    }
}
