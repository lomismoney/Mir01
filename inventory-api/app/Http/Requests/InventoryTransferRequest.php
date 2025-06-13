<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InventoryTransferRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // 權限檢查將在控制器中進行
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'from_store_id' => ['required', 'integer', 'exists:stores,id'],
            'to_store_id' => [
                'required', 
                'integer', 
                'exists:stores,id',
                Rule::notIn([$this->from_store_id]), // 不能轉移到同一個門市
            ],
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'status' => [
                'sometimes', 
                'string', 
                Rule::in(['pending', 'in_transit', 'completed', 'cancelled']),
            ],
        ];
    }
    
    /**
     * 獲取驗證錯誤的自定義訊息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'from_store_id.required' => '請選擇來源門市',
            'from_store_id.exists' => '所選來源門市不存在',
            'to_store_id.required' => '請選擇目標門市',
            'to_store_id.exists' => '所選目標門市不存在',
            'to_store_id.not_in' => '目標門市不能與來源門市相同',
            'product_variant_id.required' => '請選擇商品變體',
            'product_variant_id.exists' => '所選商品變體不存在',
            'quantity.required' => '請輸入數量',
            'quantity.integer' => '數量必須為整數',
            'quantity.min' => '數量必須大於0',
            'status.in' => '狀態值無效',
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
            'from_store_id' => [
                'description' => '來源門市ID',
                'example' => 1,
            ],
            'to_store_id' => [
                'description' => '目標門市ID（不能與來源門市相同）',
                'example' => 2,
            ],
            'product_variant_id' => [
                'description' => '商品變體ID',
                'example' => 1,
            ],
            'quantity' => [
                'description' => '轉移數量',
                'example' => 10,
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '調配門市庫存',
            ],
            'status' => [
                'description' => '轉移狀態（可選，預設為 completed）',
                'example' => 'completed',
            ],
        ];
    }
}
