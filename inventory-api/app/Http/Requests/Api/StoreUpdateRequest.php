<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 更新分店請求驗證類別
 * 
 * @bodyParam name string required 分店名稱（唯一，會排除當前分店）。例如：台北信義店
 * @bodyParam code string 門市代碼（唯一，會排除當前分店）。例如：ST001
 * @bodyParam address string 分店地址。例如：台北市信義區信義路五段7號
 * @bodyParam phone string 聯絡電話。例如：02-12345678
 * @bodyParam latitude number 緯度座標。例如：25.0330
 * @bodyParam longitude number 經度座標。例如：121.5654
 * @bodyParam is_active boolean 營運狀態
 */
class StoreUpdateRequest extends FormRequest
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
            'name' => [
                'required', 
                'string', 
                'max:100',
                Rule::unique('stores')->ignore($this->route('store')),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('stores')->ignore($this->route('store')),
            ],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'is_active' => ['boolean'],
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
            'code.string' => '門市代碼必須為字串',
            'code.max' => '門市代碼不可超過 50 個字元',
            'code.unique' => '此門市代碼已被使用',
            'address.string' => '地址必須為字串',
            'address.max' => '地址不可超過 255 個字元',
            'phone.string' => '聯絡電話必須為字串',
            'phone.max' => '聯絡電話不可超過 50 個字元',
            'latitude.numeric' => '緯度必須為數值',
            'latitude.between' => '緯度必須介於 -90 到 90 之間',
            'longitude.numeric' => '經度必須為數值',
            'longitude.between' => '經度必須介於 -180 到 180 之間',
            'is_active.boolean' => '營運狀態必須為布林值',
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
                'description' => '分店名稱（唯一，會排除當前分店）',
                'example' => '台北信義店',
                'required' => true,
            ],
            'code' => [
                'description' => '門市代碼（唯一，會排除當前分店）',
                'example' => 'ST001',
                'required' => false,
            ],
            'address' => [
                'description' => '分店地址',
                'example' => '台北市信義區信義路五段7號',
                'required' => false,
            ],
            'phone' => [
                'description' => '聯絡電話',
                'example' => '02-12345678',
                'required' => false,
            ],
            'latitude' => [
                'description' => '緯度座標（範圍：-90 到 90）',
                'example' => 25.0330,
                'required' => false,
            ],
            'longitude' => [
                'description' => '經度座標（範圍：-180 到 180）',
                'example' => 121.5654,
                'required' => false,
            ],
            'is_active' => [
                'description' => '營運狀態',
                'example' => true,
                'required' => false,
            ],
        ];
    }
}
