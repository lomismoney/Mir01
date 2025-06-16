<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 更新商品變體請求驗證類別
 * 
 * @description
 * 用於驗證商品變體（SKU）的更新資料，包含：
 * - SKU 編碼的唯一性驗證（排除當前變體）
 * - 價格資料的格式驗證
 * - 成本資料的格式驗證
 * - 狀態欄位的布爾值驗證
 * 
 * 根據技術規範要求，所有 update 請求驗證必須在專屬的 Form Request 類別中定義
 */
class UpdateProductVariantRequest extends FormRequest
{
    /**
     * 判斷使用者是否有權限執行此請求
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // 委託給 ProductVariantPolicy 進行權限檢查
        // 在控制器中會調用 $this->authorize('update', $variant)
        return true;
    }

    /**
     * 取得適用於請求的驗證規則
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $variantId = $this->route('id'); // 從路由參數取得變體 ID
        
        return [
            // SKU 編碼驗證
            'sku' => [
                'sometimes',  // 允許部分更新
                'required',
                'string',
                'max:255',
                // 確保 SKU 在整個變體表中是唯一的，但排除當前變體
                Rule::unique('product_variants', 'sku')->ignore($variantId),
            ],
            
            // 售價驗證
            'price' => [
                'sometimes',  // 允許部分更新
                'required',
                'numeric',
                'min:0',
                'regex:/^\d+(\.\d{1,2})?$/', // 最多兩位小數
            ],
            
            // 成本價驗證
            'cost' => [
                'sometimes',  // 允許部分更新
                'nullable',
                'numeric',
                'min:0',
                'regex:/^\d+(\.\d{1,2})?$/', // 最多兩位小數
            ],
            
            // 庫存預警數量
            'stock_alert_threshold' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],
            
            // 變體狀態（是否啟用）
            'is_active' => [
                'sometimes',  // 允許部分更新
                'boolean',
            ],
            
            // 重量（公克）
            'weight' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],
            
            // 尺寸資訊
            'length' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],
            
            'width' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],
            
            'height' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],
        ];
    }

    /**
     * 取得自訂的錯誤訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sku.required' => 'SKU 編碼為必填欄位',
            'sku.unique' => '此 SKU 編碼已被使用',
            'sku.max' => 'SKU 編碼不得超過 255 個字元',
            
            'price.required' => '價格為必填欄位',
            'price.numeric' => '價格必須為數字',
            'price.min' => '價格不得小於 0',
            'price.regex' => '價格格式錯誤，最多兩位小數',
            
            'cost.numeric' => '成本必須為數字',
            'cost.min' => '成本不得小於 0',
            'cost.regex' => '成本格式錯誤，最多兩位小數',
            
            'stock_alert_threshold.integer' => '庫存預警數量必須為整數',
            'stock_alert_threshold.min' => '庫存預警數量不得小於 0',
            
            'is_active.boolean' => '狀態必須為有效的布爾值',
            
            'weight.numeric' => '重量必須為數字',
            'weight.min' => '重量不得小於 0',
            
            'length.numeric' => '長度必須為數字',
            'length.min' => '長度不得小於 0',
            
            'width.numeric' => '寬度必須為數字',
            'width.min' => '寬度不得小於 0',
            
            'height.numeric' => '高度必須為數字',
            'height.min' => '高度不得小於 0',
        ];
    }

    /**
     * 取得自訂的屬性名稱對應
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU 編碼',
            'price' => '售價',
            'cost' => '成本價',
            'stock_alert_threshold' => '庫存預警數量',
            'is_active' => '啟用狀態',
            'weight' => '重量',
            'length' => '長度',
            'width' => '寬度',
            'height' => '高度',
        ];
    }
} 