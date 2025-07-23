<?php

namespace Tests\Unit\Helpers;

use App\Helpers\MoneyHelper;
use PHPUnit\Framework\TestCase;

class MoneyHelperTest extends TestCase
{
    /**
     * 測試元轉分的轉換
     */
    public function test_yuan_to_cents_conversion()
    {
        // 正常數值
        $this->assertEquals(100, MoneyHelper::yuanToCents(1));
        $this->assertEquals(1000, MoneyHelper::yuanToCents(10));
        $this->assertEquals(12345, MoneyHelper::yuanToCents(123.45));
        
        // 小數處理（四捨五入）
        $this->assertEquals(124, MoneyHelper::yuanToCents(1.236));
        $this->assertEquals(123, MoneyHelper::yuanToCents(1.234));
        
        // 零值
        $this->assertEquals(0, MoneyHelper::yuanToCents(0));
        
        // null 處理
        $this->assertNull(MoneyHelper::yuanToCents(null));
    }
    
    /**
     * 測試分轉元的轉換
     */
    public function test_cents_to_yuan_conversion()
    {
        // 正常數值
        $this->assertEquals(1.0, MoneyHelper::centsToYuan(100));
        $this->assertEquals(10.0, MoneyHelper::centsToYuan(1000));
        $this->assertEquals(123.45, MoneyHelper::centsToYuan(12345));
        
        // 零值
        $this->assertEquals(0.0, MoneyHelper::centsToYuan(0));
        
        // null 處理
        $this->assertNull(MoneyHelper::centsToYuan(null));
    }
    
    /**
     * 測試含稅價格計算（從未稅價計算含稅價）
     */
    public function test_calculate_price_with_tax()
    {
        // 5% 稅率
        $this->assertEquals(10500, MoneyHelper::calculatePriceWithTax(10000, 5));
        
        // 10% 稅率
        $this->assertEquals(11000, MoneyHelper::calculatePriceWithTax(10000, 10));
        
        // 0% 稅率
        $this->assertEquals(10000, MoneyHelper::calculatePriceWithTax(10000, 0));
        
        // 實際案例：100元未稅，5%稅率
        $this->assertEquals(10500, MoneyHelper::calculatePriceWithTax(10000, 5));
    }
    
    /**
     * 測試從含稅價反推稅額
     */
    public function test_calculate_tax_from_price_with_tax()
    {
        // 5% 稅率：105元含稅 → 5元稅額
        $this->assertEquals(500, MoneyHelper::calculateTaxFromPriceWithTax(10500, 5));
        
        // 10% 稅率：110元含稅 → 10元稅額
        $this->assertEquals(1000, MoneyHelper::calculateTaxFromPriceWithTax(11000, 10));
        
        // 0% 稅率
        $this->assertEquals(0, MoneyHelper::calculateTaxFromPriceWithTax(10000, 0));
        
        // 負稅率保護
        $this->assertEquals(0, MoneyHelper::calculateTaxFromPriceWithTax(10000, -5));
    }
    
    /**
     * 測試從未稅價計算稅額
     */
    public function test_calculate_tax_from_price_without_tax()
    {
        // 5% 稅率：100元未稅 → 5元稅額
        $this->assertEquals(500, MoneyHelper::calculateTaxFromPriceWithoutTax(10000, 5));
        
        // 10% 稅率：100元未稅 → 10元稅額
        $this->assertEquals(1000, MoneyHelper::calculateTaxFromPriceWithoutTax(10000, 10));
        
        // 0% 稅率
        $this->assertEquals(0, MoneyHelper::calculateTaxFromPriceWithoutTax(10000, 0));
    }
    
    /**
     * 測試金額格式化
     */
    public function test_format_money()
    {
        $this->assertEquals('NT$ 1,000', MoneyHelper::format(100000));
        $this->assertEquals('NT$ 12,345', MoneyHelper::format(1234500));
        $this->assertEquals('NT$ 0', MoneyHelper::format(0));
        
        // 自訂貨幣符號
        $this->assertEquals('$ 1,000', MoneyHelper::format(100000, '$'));
    }
    
    /**
     * 測試帶小數的金額格式化
     */
    public function test_format_with_decimals()
    {
        $this->assertEquals('NT$ 1,000.00', MoneyHelper::formatWithDecimals(100000));
        $this->assertEquals('NT$ 12,345.67', MoneyHelper::formatWithDecimals(1234567));
        $this->assertEquals('NT$ 0.50', MoneyHelper::formatWithDecimals(50));
    }
    
    /**
     * 測試按比例分配金額
     */
    public function test_allocate_proportionally()
    {
        // 平均分配
        $result = MoneyHelper::allocateProportionally(10000, [1, 1, 1]);
        $this->assertEquals([3333, 3333, 3334], $result); // 最後一項承擔誤差
        $this->assertEquals(10000, array_sum($result)); // 總和不變
        
        // 不同權重
        $result = MoneyHelper::allocateProportionally(10000, [2, 3, 5]);
        $this->assertEquals([2000, 3000, 5000], $result);
        $this->assertEquals(10000, array_sum($result));
        
        // 單一項目
        $result = MoneyHelper::allocateProportionally(10000, [1]);
        $this->assertEquals([10000], $result);
        
        // 空權重
        $result = MoneyHelper::allocateProportionally(10000, [0, 0, 0]);
        $this->assertEquals([0, 0, 0], $result);
    }
    
    /**
     * 測試複雜的稅金計算場景
     */
    public function test_complex_tax_scenarios()
    {
        // 場景1：含稅訂單計算
        // 商品小計 1000元 + 運費 100元 - 折扣 50元 = 1050元含稅
        $taxableAmount = 105000; // 1050元轉分
        $tax = MoneyHelper::calculateTaxFromPriceWithTax($taxableAmount, 5);
        $this->assertEquals(5000, $tax); // 50元稅金
        
        // 場景2：未稅訂單計算
        // 商品小計 1000元 - 折扣 50元 = 950元未稅（運費不課稅）
        $taxableAmount = 95000; // 950元轉分
        $tax = MoneyHelper::calculateTaxFromPriceWithoutTax($taxableAmount, 5);
        $this->assertEquals(4750, $tax); // 47.50元稅金
    }
    
    /**
     * 測試利潤計算
     */
    public function test_calculate_profit_margin()
    {
        // 售價100元，成本60元，利潤率40%
        $this->assertEquals(40.0, MoneyHelper::calculateProfitMargin(10000, 6000));
        
        // 售價100元，成本100元，利潤率0%
        $this->assertEquals(0.0, MoneyHelper::calculateProfitMargin(10000, 10000));
        
        // 售價0元，避免除零錯誤
        $this->assertEquals(0.0, MoneyHelper::calculateProfitMargin(0, 5000));
        
        // 負利潤
        $this->assertEquals(-50.0, MoneyHelper::calculateProfitMargin(10000, 15000));
    }
}