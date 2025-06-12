<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

/**
 * 用戶搜尋篩選器
 * 
 * 用於實現用戶姓名和帳號的模糊搜尋功能
 * 實現 Spatie QueryBuilder 的 Filter 介面
 */
class UserSearchFilter implements Filter
{
    /**
     * 應用用戶搜尋篩選邏輯
     * 
     * 這個方法實現多欄位模糊搜尋，在用戶姓名和帳號中搜尋關鍵字
     * 使用 OR 邏輯，任一欄位匹配即包含在結果中
     *
     * @param Builder $query Eloquent 查詢建構器
     * @param mixed $value 搜尋關鍵字
     * @param string $property 篩選器屬性名稱
     * @return Builder 修改後的查詢建構器
     */
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        // 針對用戶的多欄位模糊搜尋邏輯
        return $query->where(function (Builder $q) use ($value) {
            $q->where('name', 'like', '%' . $value . '%')
              ->orWhere('username', 'like', '%' . $value . '%');
        });
    }
} 