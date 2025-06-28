<?php

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Support\Validation\ValidationContext;
use Illuminate\Validation\Rule as LaravelRule;

/**
 * StoreData DTO
 * 
 * 門市管理的單一事實來源，整合數據結構與驗證規則
 * 支援門市基本資訊管理和用戶分配功能
 * 
 * 此 DTO 將取代 StoreStoreRequest 和 StoreUpdateRequest
 * 提供類型安全的資料轉換和 100% 準確的 OpenAPI 契約生成
 * 
 * @author AI Assistant
 * @since 1.0.0 (DTO 驅動遷移階段)
 */
class StoreData extends Data
{
    /**
     * 門市數據建構函數
     * 
     * 【DTO 驅動遷移】支援部分更新的優化設計
     * 使用 Optional 聯合類型支援新增和更新操作：
     * - 新增時：提供 name，其他為可選
     * - 更新時：所有欄位都可選，支援部分更新
     * 
     * @param int|Optional $id 門市 ID（更新時由路由提供）
     * @param string|Optional $name 門市名稱，新增時必填，更新時可選，必須唯一
     * @param string|null|Optional $address 門市地址，可選
     * @param array|null|Optional $user_ids 分配的用戶 ID 陣列，用於管理門市用戶關聯
     */
    public function __construct(
        public int|Optional $id,
        
        #[Rule(['sometimes', 'required', 'string', 'max:100'])]
        public string|Optional $name,
        
        #[Rule(['nullable', 'string', 'max:255'])]
        public string|null|Optional $address,
        
        #[Rule(['nullable', 'array'])]
        public array|null|Optional $user_ids,
    ) {}

    /**
     * 動態驗證規則
     * 
     * 處理需要上下文資訊的複雜驗證邏輯：
     * 1. 門市名稱唯一性檢查，更新時排除自身 ID
     * 2. 用戶 ID 陣列中每個元素的存在性驗證
     * 3. 更新操作時使用 'sometimes' 規則允許部分更新
     * 
     * @param ValidationContext $context 驗證上下文，包含請求資料和路由參數
     * @return array<string, array> Laravel 驗證規則陣列
     */
    public static function rules(ValidationContext $context): array
    {
        $rules = [];
        
        // 檢查是否為更新操作（有路由參數 'store'）
        $isUpdate = request()->route('store') !== null;
        $storeId = null;
        
        if ($isUpdate) {
            // 更新操作：允許部分更新，加入唯一性檢查排除自身
            $storeId = request()->route('store')->id ?? null;
            
            $rules['name'] = [
                'sometimes', 
                'required', 
                'string', 
                'max:100',
                LaravelRule::unique('stores', 'name')->ignore($storeId)
            ];
        } else {
            // 新增操作：名稱必填且唯一
            $rules['name'] = [
                'required', 
                'string', 
                'max:100',
                LaravelRule::unique('stores', 'name')
            ];
        }
        
        // 共同規則
        $rules['address'] = ['nullable', 'string', 'max:255'];
        $rules['user_ids'] = ['nullable', 'array'];
        $rules['user_ids.*'] = ['integer', 'exists:users,id'];
        
        return $rules;
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
            'name.required' => '門市名稱為必填項目',
            'name.string' => '門市名稱必須是文字格式',
            'name.max' => '門市名稱不能超過 100 個字符',
            'name.unique' => '門市名稱已存在，請使用其他名稱',
            'address.string' => '門市地址必須是文字格式',
            'address.max' => '門市地址不能超過 255 個字符',
            'user_ids.array' => '用戶 ID 必須是陣列格式',
            'user_ids.*.integer' => '用戶 ID 必須是數字',
            'user_ids.*.exists' => '指定的用戶不存在',
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
            'name' => '門市名稱',
            'address' => '門市地址',
            'user_ids' => '分配用戶',
            'user_ids.*' => '用戶 ID',
        ];
    }

    /**
     * 檢查是否有分配用戶
     * 
     * @return bool
     */
    public function hasUsers(): bool
    {
        return !empty($this->user_ids);
    }

    /**
     * 獲取用戶數量
     * 
     * @return int
     */
    public function getUserCount(): int
    {
        return count($this->user_ids ?? []);
    }

    /**
     * 檢查是否為主要門市（業務邏輯預留）
     * 
     * 預留給未來可能的主門市功能
     * 
     * @return bool
     */
    public function isPrimary(): bool
    {
        // 預留功能，目前總是返回 false
        return false;
    }
} 