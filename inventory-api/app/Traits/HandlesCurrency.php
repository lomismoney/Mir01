<?php

namespace App\Traits;

/**
 * 處理金額轉換的 Trait
 * 
 * 提供統一的金額處理功能：
 * 1. 元與分之間的轉換
 * 2. 金額格式化
 * 3. 金額計算輔助方法
 * 4. 兼容性支援（同時支援新舊欄位）
 */
trait HandlesCurrency
{
    /**
     * 將元轉換為分
     * 
     * @param float|int|string $yuan 元金額
     * @return int 分金額
     */
    public static function yuanToCents($yuan): int
    {
        if (is_null($yuan)) {
            return 0;
        }
        
        // 處理字串類型的金額
        if (is_string($yuan)) {
            $yuan = (float) $yuan;
        }
        
        return (int) round($yuan * 100);
    }

    /**
     * 將分轉換為元
     * 
     * @param int $cents 分金額
     * @param int $precision 小數位數，預設2位
     * @return float 元金額
     */
    public static function centsToYuan(?int $cents, int $precision = 2): float
    {
        if (is_null($cents)) {
            return 0.0;
        }
        
        return round($cents / 100, $precision);
    }

    /**
     * 格式化金額顯示
     * 
     * @param int $cents 分金額
     * @param string $currency 貨幣符號
     * @param int $precision 小數位數
     * @return string 格式化後的金額字串
     */
    public static function formatCurrency(?int $cents, string $currency = '¥', int $precision = 2): string
    {
        if (is_null($cents)) {
            return $currency . '0.00';
        }
        
        $yuan = self::centsToYuan($cents, $precision);
        return $currency . number_format($yuan, $precision);
    }

    /**
     * 獲取金額的分為單位值（向後兼容方法）
     * 
     * 優先使用新的 *_cents 欄位，如果不存在則從舊欄位轉換
     * 
     * @param string $fieldName 欄位名稱（不含 _cents 後綴）
     * @return int
     */
    protected function getCentsValue(string $fieldName): int
    {
        $centsField = $fieldName . '_cents';
        $yuanField = $fieldName;
        
        // 優先使用分為單位的欄位
        if (isset($this->attributes[$centsField]) && !is_null($this->attributes[$centsField])) {
            return (int) $this->attributes[$centsField];
        }
        
        // 回退到元為單位的欄位
        if (isset($this->attributes[$yuanField]) && !is_null($this->attributes[$yuanField])) {
            return self::yuanToCents($this->attributes[$yuanField]);
        }
        
        return 0;
    }

    /**
     * 設定金額值（同時更新分和元欄位）
     * 
     * @param string $fieldName 欄位名稱（不含 _cents 後綴）
     * @param float|int $yuan 元金額
     * @return void
     */
    protected function setCurrencyValue(string $fieldName, $yuan): void
    {
        $centsField = $fieldName . '_cents';
        $yuanField = $fieldName;
        
        // 處理 null 值：保持為 null
        if (is_null($yuan)) {
            $this->attributes[$centsField] = null;
            $this->attributes[$yuanField] = null;
            return;
        }
        
        $cents = self::yuanToCents($yuan);
        $yuanValue = self::centsToYuan($cents);
        
        // 同時設定兩個欄位以保持兼容性
        $this->attributes[$centsField] = $cents;
        $this->attributes[$yuanField] = $yuanValue;
    }

    /**
     * 獲取格式化的金額字串
     * 
     * @param string $fieldName 欄位名稱
     * @param string $currency 貨幣符號
     * @return string
     */
    protected function getFormattedCurrency(string $fieldName, string $currency = '¥'): string
    {
        $cents = $this->getCentsValue($fieldName);
        return self::formatCurrency($cents, $currency);
    }

    /**
     * 批量金額計算（加法）
     * 
     * @param array $amounts 金額陣列（分為單位）
     * @return int 總和（分為單位）
     */
    public static function sumAmounts(array $amounts): int
    {
        return array_sum(array_filter($amounts, function ($amount) {
            return is_numeric($amount);
        }));
    }

    /**
     * 批量金額計算（乘法）
     * 
     * @param int $unitPrice 單價（分為單位）
     * @param int $quantity 數量
     * @return int 總金額（分為單位）
     */
    public static function calculateTotalAmount(int $unitPrice, int $quantity): int
    {
        return $unitPrice * $quantity;
    }

    /**
     * 金額分攤計算
     * 
     * @param int $totalAmount 總金額（分為單位）
     * @param array $weights 權重陣列
     * @return array 分攤後的金額陣列（分為單位）
     */
    public static function allocateAmount(int $totalAmount, array $weights): array
    {
        $totalWeight = array_sum($weights);
        
        if ($totalWeight <= 0) {
            return array_fill(0, count($weights), 0);
        }
        
        $allocated = [];
        $remainingAmount = $totalAmount;
        
        // 先按比例分配
        for ($i = 0; $i < count($weights) - 1; $i++) {
            $amount = (int) round($totalAmount * $weights[$i] / $totalWeight);
            $allocated[] = $amount;
            $remainingAmount -= $amount;
        }
        
        // 最後一項分配剩餘金額，確保總和正確
        $allocated[] = $remainingAmount;
        
        return $allocated;
    }

    /**
     * 驗證金額合理性
     * 
     * @param int $cents 分金額
     * @param int $minCents 最小金額（分）
     * @param int $maxCents 最大金額（分）
     * @return bool
     */
    public static function validateAmount(int $cents, int $minCents = 0, int $maxCents = 999999999): bool
    {
        return $cents >= $minCents && $cents <= $maxCents;
    }

    /**
     * 取得模型中所有金額欄位的摘要
     * 
     * @param array $fieldNames 欄位名稱陣列
     * @return array 金額摘要
     */
    public function getCurrencySummary(array $fieldNames): array
    {
        $summary = [];
        
        foreach ($fieldNames as $fieldName) {
            $cents = $this->getCentsValue($fieldName);
            $summary[$fieldName] = [
                'cents' => $cents,
                'yuan' => self::centsToYuan($cents),
                'formatted' => self::formatCurrency($cents),
            ];
        }
        
        return $summary;
    }

    /**
     * 定義需要進行金額轉換的欄位
     * 
     * 子類別應該覆寫此方法來定義自己的金額欄位
     * 
     * @return array
     */
    protected function getCurrencyFields(): array
    {
        return [];
    }

    /**
     * 自動建立金額欄位的 Accessor
     * 
     * 這個方法會自動為定義的金額欄位建立 getter
     */
    public function initializeHandlesCurrency()
    {
        foreach ($this->getCurrencyFields() as $field) {
            $this->makeHidden($field); // 隱藏舊的元欄位
            
            // 建立動態的 accessor
            $accessorName = 'get' . ucfirst(\Illuminate\Support\Str::camel($field)) . 'Attribute';
            
            if (!method_exists($this, $accessorName)) {
                $this->{$accessorName} = function ($value) use ($field) {
                    return self::centsToYuan($this->getCentsValue($field));
                };
            }
        }
    }
}