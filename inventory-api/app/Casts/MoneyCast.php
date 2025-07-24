<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * 金額轉換器
 * 
 * 負責在資料庫（分）和應用程式（元）之間進行金額轉換
 * - 儲存時：元 -> 分 (乘以100)
 * - 讀取時：分 -> 元 (除以100)
 */
class MoneyCast implements CastsAttributes
{
    /**
     * 從資料庫讀取時轉換值（分 -> 元）
     *
     * @param Model $model
     * @param string $key
     * @param mixed $value
     * @param array $attributes
     * @return float|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?float
    {
        return $value !== null ? round($value / 100, 2) : null;
    }

    /**
     * 儲存到資料庫時轉換值（元 -> 分）
     *
     * @param Model $model
     * @param string $key
     * @param mixed $value
     * @param array $attributes
     * @return int|null
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?int
    {
        return $value !== null ? (int) round($value * 100) : null;
    }
}