<?php

namespace Tests\Unit;

use App\Services\OrderNumberGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * OrderNumberGenerator 測試
 * 
 * 測試訂單編號生成器的所有功能
 */
class OrderNumberGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected OrderNumberGenerator $generator;

    /**
     * 測試前設置
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new OrderNumberGenerator();
    }

    /**
     * 測試生成第一個訂單編號
     */
    public function test_generate_first_order_number(): void
    {
        // 模擬當前時間
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 生成第一個訂單編號
        $orderNumber = $this->generator->generateNextNumber();

        // 驗證格式正確
        $this->assertEquals('202506-0001', $orderNumber);

        // 驗證資料庫記錄已創建
        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-06',
            'last_sequence' => 1,
        ]);
    }

    /**
     * 測試連續生成多個訂單編號
     */
    public function test_generate_sequential_order_numbers(): void
    {
        // 模擬當前時間
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 生成多個訂單編號
        $orderNumber1 = $this->generator->generateNextNumber();
        $orderNumber2 = $this->generator->generateNextNumber();
        $orderNumber3 = $this->generator->generateNextNumber();

        // 驗證序號遞增
        $this->assertEquals('202506-0001', $orderNumber1);
        $this->assertEquals('202506-0002', $orderNumber2);
        $this->assertEquals('202506-0003', $orderNumber3);

        // 驗證資料庫中的最終序號
        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-06',
            'last_sequence' => 3,
        ]);
    }

    /**
     * 測試不同月份生成獨立編號
     */
    public function test_generate_numbers_for_different_months(): void
    {
        // 6月
        Carbon::setTestNow(Carbon::create(2025, 6, 15));
        $juneNumber1 = $this->generator->generateNextNumber();
        $juneNumber2 = $this->generator->generateNextNumber();

        // 7月
        Carbon::setTestNow(Carbon::create(2025, 7, 15));
        $julyNumber1 = $this->generator->generateNextNumber();

        // 再回到6月
        Carbon::setTestNow(Carbon::create(2025, 6, 20));
        $juneNumber3 = $this->generator->generateNextNumber();

        // 驗證不同月份獨立計數
        $this->assertEquals('202506-0001', $juneNumber1);
        $this->assertEquals('202506-0002', $juneNumber2);
        $this->assertEquals('202507-0001', $julyNumber1);
        $this->assertEquals('202506-0003', $juneNumber3);

        // 驗證兩個月份的記錄都存在
        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-06',
            'last_sequence' => 3,
        ]);

        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-07',
            'last_sequence' => 1,
        ]);
    }

    /**
     * 測試並發安全性（模擬多個請求同時生成編號）
     */
    public function test_concurrent_number_generation(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 模擬並發請求
        $numbers = [];
        for ($i = 0; $i < 5; $i++) {
            $numbers[] = $this->generator->generateNextNumber();
        }

        // 驗證所有編號都是唯一的
        $this->assertCount(5, array_unique($numbers));

        // 驗證編號按順序生成
        $this->assertEquals('202506-0001', $numbers[0]);
        $this->assertEquals('202506-0002', $numbers[1]);
        $this->assertEquals('202506-0003', $numbers[2]);
        $this->assertEquals('202506-0004', $numbers[3]);
        $this->assertEquals('202506-0005', $numbers[4]);
    }

    /**
     * 測試獲取當前序號（不遞增）
     */
    public function test_get_current_sequence(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 初始狀態，序號應該為0
        $sequence = $this->generator->getCurrentSequence();
        $this->assertEquals(0, $sequence);

        // 生成幾個編號
        $this->generator->generateNextNumber();
        $this->generator->generateNextNumber();

        // 檢查當前序號
        $sequence = $this->generator->getCurrentSequence();
        $this->assertEquals(2, $sequence);

        // 再次檢查，確保序號沒有遞增
        $sequence = $this->generator->getCurrentSequence();
        $this->assertEquals(2, $sequence);
    }

    /**
     * 測試獲取指定年月的序號
     */
    public function test_get_current_sequence_for_specific_month(): void
    {
        // 為6月生成一些編號
        Carbon::setTestNow(Carbon::create(2025, 6, 15));
        $this->generator->generateNextNumber();
        $this->generator->generateNextNumber();

        // 為7月生成一些編號
        Carbon::setTestNow(Carbon::create(2025, 7, 15));
        $this->generator->generateNextNumber();

        // 檢查指定月份的序號
        $this->assertEquals(2, $this->generator->getCurrentSequence('2025-06'));
        $this->assertEquals(1, $this->generator->getCurrentSequence('2025-07'));
        $this->assertEquals(0, $this->generator->getCurrentSequence('2025-08')); // 不存在的月份
    }

    /**
     * 測試重置序號
     */
    public function test_reset_sequence(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 生成一些編號
        $this->generator->generateNextNumber();
        $this->generator->generateNextNumber();

        // 驗證當前序號
        $this->assertEquals(2, $this->generator->getCurrentSequence());

        // 重置序號為0
        $this->generator->resetSequence('2025-06', 0);
        $this->assertEquals(0, $this->generator->getCurrentSequence());

        // 重置序號為10
        $this->generator->resetSequence('2025-06', 10);
        $this->assertEquals(10, $this->generator->getCurrentSequence());

        // 生成下一個編號應該從11開始
        $nextNumber = $this->generator->generateNextNumber();
        $this->assertEquals('202506-0011', $nextNumber);
    }

    /**
     * 測試重置不存在月份的序號
     */
    public function test_reset_sequence_for_new_month(): void
    {
        // 重置不存在月份的序號
        $this->generator->resetSequence('2025-08', 5);

        // 驗證記錄已創建
        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-08',
            'last_sequence' => 5,
        ]);

        // 檢查序號
        $this->assertEquals(5, $this->generator->getCurrentSequence('2025-08'));
    }

    /**
     * 測試跨年的編號生成
     */
    public function test_generate_numbers_across_years(): void
    {
        // 2024年12月
        Carbon::setTestNow(Carbon::create(2024, 12, 31));
        $dec2024Number = $this->generator->generateNextNumber();

        // 2025年1月
        Carbon::setTestNow(Carbon::create(2025, 1, 1));
        $jan2025Number = $this->generator->generateNextNumber();

        // 驗證不同年份的編號格式
        $this->assertEquals('202412-0001', $dec2024Number);
        $this->assertEquals('202501-0001', $jan2025Number);

        // 驗證記錄分別保存
        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2024-12',
            'last_sequence' => 1,
        ]);

        $this->assertDatabaseHas('monthly_order_counters', [
            'year_month' => '2025-01',
            'last_sequence' => 1,
        ]);
    }

    /**
     * 測試大量編號生成（四位數序號）
     */
    public function test_generate_large_numbers(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 直接設置一個大的序號
        $this->generator->resetSequence('2025-06', 9998);

        // 生成後續編號
        $number1 = $this->generator->generateNextNumber();
        $number2 = $this->generator->generateNextNumber();

        // 驗證四位數格式
        $this->assertEquals('202506-9999', $number1);
        $this->assertEquals('202506-10000', $number2); // 超過四位數也應該正常工作
    }

    /**
     * 測試資料庫事務保證原子性
     */
    public function test_database_transaction_atomicity(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 6, 15));

        // 開始事務
        DB::beginTransaction();

        try {
            // 生成編號
            $orderNumber = $this->generator->generateNextNumber();
            
            // 驗證編號格式
            $this->assertEquals('202506-0001', $orderNumber);
            
            // 故意回滾事務
            DB::rollBack();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        // 驗證回滾後記錄不存在
        $this->assertDatabaseMissing('monthly_order_counters', [
            'year_month' => '2025-06',
        ]);

        // 再次生成編號應該重新從1開始
        $orderNumber = $this->generator->generateNextNumber();
        $this->assertEquals('202506-0001', $orderNumber);
    }

    /**
     * 清理測試後的 Carbon 狀態
     */
    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
} 