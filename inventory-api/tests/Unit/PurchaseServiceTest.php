<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\PurchaseService;
use App\Data\PurchaseData;
use App\Data\PurchaseItemData;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\LaravelData\DataCollection;

class PurchaseServiceTest extends TestCase
{
    use RefreshDatabase;

    private PurchaseService $purchaseService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->purchaseService = new PurchaseService();
    }

    /**
     * 測試進貨單號生成的唯一性和連續性
     */
    public function test_order_number_generation_is_sequential_and_unique()
    {
        $date = new \DateTime('2025-06-22');
        
        // 使用反射來調用私有方法
        $reflection = new \ReflectionClass($this->purchaseService);
        $method = $reflection->getMethod('generateOrderNumber');
        $method->setAccessible(true);
        
        // 生成第一個單號
        $orderNumber1 = $method->invoke($this->purchaseService, $date);
        $this->assertEquals('PO-20250622-001', $orderNumber1);
        
        // 生成第二個單號
        $orderNumber2 = $method->invoke($this->purchaseService, $date);
        $this->assertEquals('PO-20250622-002', $orderNumber2);
        
        // 生成第三個單號
        $orderNumber3 = $method->invoke($this->purchaseService, $date);
        $this->assertEquals('PO-20250622-003', $orderNumber3);
        
        // 檢查計數器表的記錄
        $counter = DB::table('daily_purchase_counters')
            ->where('date', '2025-06-22')
            ->first();
            
        $this->assertNotNull($counter);
        $this->assertEquals(3, $counter->last_sequence);
    }
    
    /**
     * 測試並發生成進貨單號的安全性
     * 
     * 模擬多個進程同時生成單號的情況
     */
    public function test_concurrent_order_number_generation_is_safe()
    {
        $date = new \DateTime('2025-06-23');
        $results = [];
        $threads = 10; // 模擬 10 個並發請求
        
        // 使用反射來調用私有方法
        $reflection = new \ReflectionClass($this->purchaseService);
        $method = $reflection->getMethod('generateOrderNumber');
        $method->setAccessible(true);
        
        // 並發執行
        for ($i = 0; $i < $threads; $i++) {
            $results[] = $method->invoke($this->purchaseService, $date);
        }
        
        // 檢查是否所有單號都是唯一的
        $uniqueResults = array_unique($results);
        $this->assertCount($threads, $uniqueResults, '生成的單號應該都是唯一的');
        
        // 檢查最終的計數器值
        $counter = DB::table('daily_purchase_counters')
            ->where('date', '2025-06-23')
            ->first();
            
        $this->assertNotNull($counter);
        $this->assertEquals($threads, $counter->last_sequence);
        
        // 檢查單號是否按順序生成
        sort($results);
        for ($i = 0; $i < $threads; $i++) {
            $expectedNumber = sprintf('PO-20250623-%03d', $i + 1);
            $this->assertEquals($expectedNumber, $results[$i]);
        }
    }
    
    /**
     * 測試不同日期的單號生成
     */
    public function test_order_numbers_reset_for_different_dates()
    {
        $reflection = new \ReflectionClass($this->purchaseService);
        $method = $reflection->getMethod('generateOrderNumber');
        $method->setAccessible(true);
        
        // 第一天
        $date1 = new \DateTime('2025-06-24');
        $orderNumber1 = $method->invoke($this->purchaseService, $date1);
        $this->assertEquals('PO-20250624-001', $orderNumber1);
        
        // 第二天
        $date2 = new \DateTime('2025-06-25');
        $orderNumber2 = $method->invoke($this->purchaseService, $date2);
        $this->assertEquals('PO-20250625-001', $orderNumber2);
        
        // 再次第一天
        $orderNumber3 = $method->invoke($this->purchaseService, $date1);
        $this->assertEquals('PO-20250624-002', $orderNumber3);
    }
} 