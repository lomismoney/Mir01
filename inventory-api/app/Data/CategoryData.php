<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Support\Validation\ValidationContext;
use Illuminate\Validation\Rule as LaravelRule;

/**
 * CategoryData DTO
 * 
 * 分類管理的單一事實來源，整合數據結構與驗證規則
 * 支援階層式分類結構、自我循環檢查和拖曳排序功能
 * 
 * 此 DTO 將取代 StoreCategoryRequest 和 UpdateCategoryRequest
 * 提供類型安全的資料轉換和 100% 準確的 OpenAPI 契約生成
 * 
 * @author AI Assistant
 * @since 1.0.0 (DTO 驅動遷移階段)
 */
class CategoryData extends Data
{
    /**
     * 分類數據建構函數
     * 
     * 【DTO 驅動遷移】支援部分更新的優化設計
     * 使用 Optional 聯合類型支援新增和更新操作：
     * - 新增時：提供 name，其他為可選
     * - 更新時：所有欄位都可選，支援部分更新
     * 
     * @param int|Optional $id 分類 ID（更新時由路由提供）
     * @param string|Optional $name 分類名稱，新增時必填，更新時可選
     * @param string|null|Optional $description 分類描述，可選
     * @param int|null|Optional $parent_id 父分類 ID，必須存在於資料表中
     * @param int|Optional $sort_order 排序順序，用於拖曳排序功能，預設為 0
     */
    public function __construct(
        public int|Optional $id,
        
        #[Rule(['sometimes', 'required', 'string', 'max:255'])]
        public string|Optional $name,
        
        #[Rule(['nullable', 'string', 'max:1000'])]
        public string|null|Optional $description,
        
        #[Rule(['nullable', 'integer', 'exists:categories,id'])]
        public int|null|Optional $parent_id,
        
        #[Rule(['sometimes', 'integer', 'min:0'])]
        public int|Optional $sort_order,
    ) {}

    /**
     * 動態驗證規則
     * 
     * 處理需要上下文資訊的複雜驗證邏輯：
     * 1. 防止分類設定為自己的父分類（避免循環關係）
     * 2. 更新操作時使用 'sometimes' 規則允許部分更新
     * 3. 新增操作時確保所有必填欄位
     * 
     * @param ValidationContext $context 驗證上下文，包含請求資料和路由參數
     * @return array<string, array> Laravel 驗證規則陣列
     */
    public static function rules(ValidationContext $context): array
    {
        $rules = [];
        
        // 檢查是否為更新操作（有路由參數 'category'）
        $isUpdate = request()->route('category') !== null;
        
        if ($isUpdate) {
            // 更新操作：允許部分更新，加入自我循環檢查
            $categoryId = request()->route('category')->id ?? null;
            
            $rules['name'] = ['sometimes', 'required', 'string', 'max:255'];
            $rules['parent_id'] = [
                'nullable',
                'integer', 
                'exists:categories,id',
                $categoryId ? LaravelRule::notIn([$categoryId]) : null
            ];
        } else {
            // 新增操作：名稱必填，不需要自我循環檢查
            $rules['name'] = ['required', 'string', 'max:255'];
            $rules['parent_id'] = [
                'nullable',
                'integer',
                'exists:categories,id'
            ];
        }
        
        // 共同規則
        $rules['description'] = ['nullable', 'string', 'max:1000'];
        $rules['sort_order'] = ['sometimes', 'integer', 'min:0'];
        
        // 過濾掉 null 值
        return array_map(function ($ruleSet) {
            return array_filter($ruleSet, fn($rule) => $rule !== null);
        }, $rules);
    }

    /**
     * 自定義驗證錯誤訊息
     * 
     * 提供使用者友善的繁體中文錯誤訊息
     * 
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'name.required' => '分類名稱為必填項目',
            'name.string' => '分類名稱必須是文字格式',
            'name.max' => '分類名稱不能超過 255 個字符',
            'description.string' => '分類描述必須是文字格式',
            'description.max' => '分類描述不能超過 1000 個字符',
            'parent_id.integer' => '父分類 ID 必須是數字',
            'parent_id.exists' => '指定的父分類不存在',
            'parent_id.not_in' => '分類不能設定自己為父分類，這會造成循環關係',
            'sort_order.integer' => '排序順序必須是數字',
            'sort_order.min' => '排序順序不能小於 0',
        ];
    }

    /**
     * 自定義屬性名稱
     * 
     * 用於驗證錯誤訊息中的欄位名稱顯示
     * 
     * @return array<string, string>
     */
    public static function attributes(): array
    {
        return [
            'name' => '分類名稱',
            'description' => '分類描述',
            'parent_id' => '父分類',
            'sort_order' => '排序順序',
        ];
    }
} 