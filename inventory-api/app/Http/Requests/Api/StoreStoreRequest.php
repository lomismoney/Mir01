<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 創建分店請求驗證類別
 * 
 * @bodyParam name string required 分店名稱（唯一）。例如：台北總店
 * @bodyParam address string 分店地址。例如：台北市信義區信義路五段7號
 */
class StoreStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 授權檢查已在 StorePolicy 中完成
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:stores,name'],
            'address' => ['nullable', 'string', 'max:255'],
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
            'name.required' => '分店名稱為必填欄位',
            'name.string' => '分店名稱必須為字串',
            'name.max' => '分店名稱不可超過 100 個字元',
            'name.unique' => '此分店名稱已被使用',
            'address.string' => '地址必須為字串',
            'address.max' => '地址不可超過 255 個字元',
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
                'description' => '分店名稱（唯一）',
                'example' => '台北總店',
                'required' => true,
            ],
            'address' => [
                'description' => '分店地址',
                'example' => '台北市信義區信義路五段7號',
                'required' => false,
            ],
        ];
    }
}
