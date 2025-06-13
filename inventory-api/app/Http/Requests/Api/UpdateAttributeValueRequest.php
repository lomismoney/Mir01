<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateAttributeValueRequest 更新屬性值請求驗證
 * 
 * 處理更新屬性值時的資料驗證，確保屬性值在相同屬性下的唯一性
 * 更新時需要忽略當前屬性值的唯一性檢查
 * 
 * @bodyParam value string required 屬性值（在同一屬性下必須唯一，會排除當前值）。例如：藍色
 */
class UpdateAttributeValueRequest extends FormRequest
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
        // 為了與 Scribe 文檔生成器相容，需要檢查 value 是否存在
        $valueModel = $this->route('value');
        
        return [
            // 屬性值：可選、必填（如果提供）、字串、最大長度 255 字元
            // 在同一個 attribute_id 下必須唯一（忽略當前更新的屬性值）
            'value' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('attribute_values')->where(function ($query) use ($valueModel) {
                    if ($valueModel) {
                        return $query->where('attribute_id', $valueModel->attribute_id);
                    }
                    return $query;
                })->ignore($valueModel?->id)
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
                'description' => '屬性值（在同一屬性下必須唯一，會排除當前值）',
                'example' => '藍色',
                'required' => true,
            ],
        ];
    }
}
