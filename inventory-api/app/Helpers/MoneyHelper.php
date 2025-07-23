<?php

namespace App\Helpers;

class MoneyHelper
{
    /**
     * 將元轉換為分（儲存到資料庫時使用）
     * 
     * @param float|null $yuan 元為單位的金額
     * @return int|null 分為單位的金額
     */
    public static function yuanToCents(?float $yuan): ?int
    {
        if (is_null($yuan)) {
            return null;
        }
        
        return (int) round($yuan * 100);
    }
    
    /**
     * 將分轉換為元（從資料庫讀取時使用）
     * 
     * @param int|null $cents 分為單位的金額
     * @return float|null 元為單位的金額
     */
    public static function centsToYuan(?int $cents): ?float
    {
        if (is_null($cents)) {
            return null;
        }
        
        return round($cents / 100, 2);
    }
    
    /**
     * 從未稅價計算含稅價（台灣營業稅 5%）
     * 使用整數計算避免浮點數誤差
     * 
     * @param int $priceWithoutTaxCents 未稅價格（分）
     * @param float $taxRate 稅率（預設 5%）
     * @return int 含稅價格（分）
     */
    public static function calculatePriceWithTax(int $priceWithoutTaxCents, float $taxRate = 5): int
    {
        // 含稅價格 = 未稅價格 × (1 + 稅率/100)
        // 為避免浮點數誤差，使用整數運算
        // 含稅價格 = 未稅價格 × (100 + 稅率) / 100
        $multiplier = 100 + $taxRate;
        return (int) round($priceWithoutTaxCents * $multiplier / 100);
    }
    
    /**
     * 從含稅價計算未稅價（台灣營業稅 5%）
     * 使用整數計算避免浮點數誤差
     * 
     * @param int $priceWithTaxCents 含稅價格（分）
     * @param float $taxRate 稅率（預設 5%）
     * @return int 未稅價格（分）
     */
    public static function calculatePriceWithoutTax(int $priceWithTaxCents, float $taxRate = 5): int
    {
        // 未稅價格 = 含稅價格 / (1 + 稅率/100)
        // 為避免浮點數誤差，使用整數運算
        // 未稅價格 = 含稅價格 × 100 / (100 + 稅率)
        $divisor = 100 + $taxRate;
        return (int) round($priceWithTaxCents * 100 / $divisor);
    }
    
    /**
     * 從含稅價計算稅額（台灣營業稅）
     * 
     * @param int $priceWithTaxCents 含稅價格（分）
     * @param float $taxRate 稅率（預設 5%）
     * @return int 稅額（分）
     */
    public static function calculateTaxFromPriceWithTax(int $priceWithTaxCents, float $taxRate = 5): int
    {
        if ($taxRate <= 0) {
            return 0;
        }
        
        $priceWithoutTax = self::calculatePriceWithoutTax($priceWithTaxCents, $taxRate);
        return $priceWithTaxCents - $priceWithoutTax;
    }
    
    /**
     * 從未稅價計算稅額（台灣營業稅）
     * 
     * @param int $priceWithoutTaxCents 未稅價格（分）
     * @param float $taxRate 稅率（預設 5%）
     * @return int 稅額（分）
     */
    public static function calculateTaxFromPriceWithoutTax(int $priceWithoutTaxCents, float $taxRate = 5): int
    {
        if ($taxRate <= 0) {
            return 0;
        }
        
        // 稅額 = 未稅價格 × 稅率 / 100
        return (int) round($priceWithoutTaxCents * $taxRate / 100);
    }
    
    /**
     * 格式化金額顯示
     * 
     * @param int $cents 金額（分）
     * @param string $currency 貨幣符號
     * @return string 格式化後的金額字串
     */
    public static function format(int $cents, string $currency = 'NT$'): string
    {
        $yuan = self::centsToYuan($cents);
        return $currency . ' ' . number_format($yuan, 0);
    }
    
    /**
     * 格式化金額顯示（保留小數）
     * 
     * @param int $cents 金額（分）
     * @param string $currency 貨幣符號
     * @return string 格式化後的金額字串
     */
    public static function formatWithDecimals(int $cents, string $currency = 'NT$'): string
    {
        $yuan = self::centsToYuan($cents);
        return $currency . ' ' . number_format($yuan, 2);
    }
    
    /**
     * 按比例分配金額（用於運費分攤等）
     * 保證總和等於原始金額，避免分配誤差
     * 
     * @param int $totalAmountCents 總金額（分）
     * @param array $weights 權重陣列
     * @return array 分配後的金額陣列（分）
     */
    public static function allocateProportionally(int $totalAmountCents, array $weights): array
    {
        $totalWeight = array_sum($weights);
        if ($totalWeight <= 0) {
            return array_fill(0, count($weights), 0);
        }
        
        $allocated = [];
        $allocatedSum = 0;
        $lastIndex = count($weights) - 1;
        
        foreach ($weights as $index => $weight) {
            if ($index === $lastIndex) {
                // 最後一項承擔剩餘金額，避免四捨五入誤差
                $allocated[] = $totalAmountCents - $allocatedSum;
            } else {
                $amount = (int) round($totalAmountCents * $weight / $totalWeight);
                $allocated[] = $amount;
                $allocatedSum += $amount;
            }
        }
        
        return $allocated;
    }
    
    /**
     * 計算利潤率（百分比）
     * 
     * @param int $priceCents 售價（分）
     * @param int $costCents 成本（分）
     * @return float 利潤率
     */
    public static function calculateProfitMargin(int $priceCents, int $costCents): float
    {
        if ($priceCents <= 0) {
            return 0;
        }
        
        return round((($priceCents - $costCents) / $priceCents) * 100, 2);
    }
    
    /**
     * 計算利潤金額
     * 
     * @param int $priceCents 售價（分）
     * @param int $costCents 成本（分）
     * @return int 利潤金額（分）
     */
    public static function calculateProfitAmount(int $priceCents, int $costCents): int
    {
        return $priceCents - $costCents;
    }
}