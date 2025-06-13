<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 批量刪除商品請求驗證類別
 * 
 * 用於驗證批量刪除商品的請求參數，確保提供的商品 ID 存在且格式正確
 * 
 * @bodyParam ids array required 要刪除的商品 ID 列表。例如：[1, 2, 3]
 * @bodyParam ids.* integer required 商品 ID，必須存在於資料庫中。例如：1
 */
class DestroyMultipleProductsRequest extends FormRequest
{
    /**
     * 判斷使用者是否有權限執行此請求
     * 
     * @return bool 是否授權執行此請求
     */
    public function authorize(): bool
    {
        // 暫時設定為 true，未來可整合使用者權限
        return true;
    }

    /**
     * 取得適用於此請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'ids'   => 'required|array|min:1',           // 確保 'ids' 欄位存在且為非空陣列
            'ids.*' => 'integer|exists:products,id',     // 確保陣列中的每一個元素都是存在於 products 表中的整數 ID
        ];
    }

    /**
     * 取得自訂的驗證錯誤訊息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required'      => '請提供要刪除的商品 ID 列表',
            'ids.array'         => '商品 ID 列表必須是陣列格式',
            'ids.min'           => '至少需要選擇一個商品進行刪除',
            'ids.*.integer'     => '商品 ID 必須是整數',
            'ids.*.exists'      => '商品 ID :input 不存在，請檢查後重試',
        ];
    }

    /**
     * 取得要刪除的商品 ID 陣列
     *
     * @return array<int> 商品 ID 陣列
     */
    public function getProductIds(): array
    {
        return $this->validated('ids', []);
    }

    /**
     * 取得要刪除的商品數量
     *
     * @return int 商品數量
     */
    public function getProductCount(): int
    {
        return count($this->getProductIds());
    }

    /**
     * 取得請求的參數說明，用於 API 文檔生成
     *
     * @return array<string, array>
     */
    public function bodyParameters()
    {
        return [
            'ids' => [
                'description' => '要刪除的商品 ID 列表',
                'example' => [1, 2, 3],
                'required' => true,
            ],
            'ids.*' => [
                'description' => '商品 ID，必須存在於資料庫中',
                'example' => 1,
                'required' => true,
            ],
        ];
    }
} 