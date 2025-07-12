<?php

namespace Tests\Unit\Traits;

use Tests\TestCase;
use App\Traits\HandlesCurrency;

class HandlesCurrencyTest extends TestCase
{
    use HandlesCurrency;

    public function test_converts_yuan_to_cents()
    {
        // 測試基本轉換
        $this->assertEquals(100, HandlesCurrency::yuanToCents(1));
        $this->assertEquals(150, HandlesCurrency::yuanToCents(1.5));
        $this->assertEquals(125, HandlesCurrency::yuanToCents(1.25));
        
        // 測試浮點數精度
        $this->assertEquals(333, HandlesCurrency::yuanToCents(3.33));
        $this->assertEquals(1000, HandlesCurrency::yuanToCents(10.00));
        
        // 測試字串輸入
        $this->assertEquals(250, HandlesCurrency::yuanToCents('2.5'));
        $this->assertEquals(500, HandlesCurrency::yuanToCents('5'));
        
        // 測試 null 值
        $this->assertEquals(0, HandlesCurrency::yuanToCents(null));
        
        // 測試零值
        $this->assertEquals(0, HandlesCurrency::yuanToCents(0));
        $this->assertEquals(0, HandlesCurrency::yuanToCents('0'));
    }

    public function test_converts_cents_to_yuan()
    {
        // 測試基本轉換
        $this->assertEquals(1.00, HandlesCurrency::centsToYuan(100));
        $this->assertEquals(1.50, HandlesCurrency::centsToYuan(150));
        $this->assertEquals(1.25, HandlesCurrency::centsToYuan(125));
        
        // 測試零值
        $this->assertEquals(0.00, HandlesCurrency::centsToYuan(0));
        
        // 測試大數值
        $this->assertEquals(100.00, HandlesCurrency::centsToYuan(10000));
        
        // 測試奇數分值
        $this->assertEquals(3.33, HandlesCurrency::centsToYuan(333));
        $this->assertEquals(0.01, HandlesCurrency::centsToYuan(1));
        
        // 測試 null 值
        $this->assertEquals(0.00, HandlesCurrency::centsToYuan(null));
    }

    public function test_converts_cents_to_yuan_with_custom_precision()
    {
        // 測試自定義精度
        $this->assertEquals(3.3, HandlesCurrency::centsToYuan(333, 1));
        $this->assertEquals(3.0, HandlesCurrency::centsToYuan(333, 0));
        $this->assertEquals(3.33, HandlesCurrency::centsToYuan(333, 3));
    }

    public function test_formats_currency()
    {
        // 測試基本格式化（預設使用 ¥ 符號）
        $this->assertEquals('¥1.00', HandlesCurrency::formatCurrency(100));
        $this->assertEquals('¥10.00', HandlesCurrency::formatCurrency(1000));
        $this->assertEquals('¥1.50', HandlesCurrency::formatCurrency(150));
        
        // 測試零值
        $this->assertEquals('¥0.00', HandlesCurrency::formatCurrency(0));
        
        // 測試 null 值
        $this->assertEquals('¥0.00', HandlesCurrency::formatCurrency(null));
    }

    public function test_formats_currency_with_custom_settings()
    {
        // 測試自定義符號
        $this->assertEquals('$1.00', HandlesCurrency::formatCurrency(100, '$'));
        $this->assertEquals('USD1.00', HandlesCurrency::formatCurrency(100, 'USD'));
        
        // 測試不同精度
        $this->assertEquals('¥1.5', HandlesCurrency::formatCurrency(150, '¥', 1));
        $this->assertEquals('¥1', HandlesCurrency::formatCurrency(125, '¥', 0));
    }

    public function test_sum_amounts()
    {
        // 測試金額加總
        $this->assertEquals(300, HandlesCurrency::sumAmounts([100, 150, 50]));
        $this->assertEquals(250, HandlesCurrency::sumAmounts([100, 150]));
        
        // 測試包含 null 值的陣列
        $this->assertEquals(250, HandlesCurrency::sumAmounts([100, null, 150]));
        
        // 測試空陣列
        $this->assertEquals(0, HandlesCurrency::sumAmounts([]));
    }

    public function test_calculate_total_amount()
    {
        // 測試總金額計算
        $this->assertEquals(1500, HandlesCurrency::calculateTotalAmount(150, 10));
        $this->assertEquals(300, HandlesCurrency::calculateTotalAmount(100, 3));
        $this->assertEquals(0, HandlesCurrency::calculateTotalAmount(100, 0));
    }

    public function test_allocate_amount()
    {
        // 測試金額分攤
        $allocated = HandlesCurrency::allocateAmount(1000, [1, 2, 3]);
        $this->assertEquals(3, count($allocated));
        $this->assertEquals(1000, array_sum($allocated)); // 總和應該等於原金額
        
        // 測試相等權重
        $allocated = HandlesCurrency::allocateAmount(300, [1, 1, 1]);
        $this->assertEquals([100, 100, 100], $allocated);
        
        // 測試零權重
        $allocated = HandlesCurrency::allocateAmount(1000, [0, 0, 0]);
        $this->assertEquals([0, 0, 0], $allocated);
    }

    public function test_validate_amount()
    {
        // 測試基本驗證
        $this->assertTrue(HandlesCurrency::validateAmount(100));
        $this->assertTrue(HandlesCurrency::validateAmount(0));
        $this->assertTrue(HandlesCurrency::validateAmount(999999999));
        
        // 測試超出範圍
        $this->assertFalse(HandlesCurrency::validateAmount(-1));
        $this->assertFalse(HandlesCurrency::validateAmount(1000000000));
        
        // 測試自定義範圍
        $this->assertTrue(HandlesCurrency::validateAmount(50, 10, 100));
        $this->assertFalse(HandlesCurrency::validateAmount(5, 10, 100));
        $this->assertFalse(HandlesCurrency::validateAmount(150, 10, 100));
    }

    public function test_round_trip_conversion()
    {
        // 測試往返轉換的準確性
        $originalYuan = 123.45;
        $cents = HandlesCurrency::yuanToCents($originalYuan);
        $convertedYuan = HandlesCurrency::centsToYuan($cents);
        
        $this->assertEquals($originalYuan, $convertedYuan);
        
        // 測試多個值
        $testValues = [1, 1.5, 10.99, 0, 100.01];
        
        foreach ($testValues as $value) {
            $cents = HandlesCurrency::yuanToCents($value);
            $converted = HandlesCurrency::centsToYuan($cents);
            $this->assertEquals($value, $converted, "Round trip failed for value: {$value}");
        }
    }

    public function test_handles_large_amounts()
    {
        // 測試大金額處理
        $largeAmount = 999999.99;
        $cents = HandlesCurrency::yuanToCents($largeAmount);
        $this->assertEquals(99999999, $cents);
        
        $converted = HandlesCurrency::centsToYuan($cents);
        $this->assertEquals($largeAmount, $converted);
    }

    public function test_handles_precision_edge_cases()
    {
        // 測試精度邊界情況
        $this->assertEquals(1, HandlesCurrency::yuanToCents(0.005)); // 四捨五入
        $this->assertEquals(0, HandlesCurrency::yuanToCents(0.004)); // 四捨五入
        
        // 測試複雜的小數
        $this->assertEquals(123, HandlesCurrency::yuanToCents(1.234)); 
        $this->assertEquals(124, HandlesCurrency::yuanToCents(1.235));
    }
}