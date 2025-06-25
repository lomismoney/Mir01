<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ReorderCategoriesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 授權檢查將在控制器中使用 Policy 進行
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
            'items' => 'required|array',
            'items.*.id' => 'required|integer|exists:categories,id',
            'items.*.sort_order' => 'required|integer|min:0',
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
            'items' => [
                'description' => '分類排序項目陣列',
                'example' => [
                    [
                        'id' => 1,
                        'sort_order' => 0,
                    ],
                    [
                        'id' => 2,
                        'sort_order' => 1,
                    ],
                ],
            ],
            'items.*.id' => [
                'description' => '分類 ID',
                'example' => 1,
            ],
            'items.*.sort_order' => [
                'description' => '排序順序（從 0 開始）',
                'example' => 0,
            ],
        ];
    }
}
