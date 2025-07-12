<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\ConcurrencyHelper;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Exception;

class ConcurrencyHelperTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    #[Test]
    public function it_executes_operation_successfully_with_optimistic_lock()
    {
        $result = ConcurrencyHelper::withOptimisticLock(function () {
            return 'success';
        });

        $this->assertEquals('success', $result);
    }

    #[Test]
    public function it_retries_on_optimistic_lock_conflict()
    {
        $attempts = 0;
        
        $result = ConcurrencyHelper::withOptimisticLock(function () use (&$attempts) {
            $attempts++;
            
            // 第一次執行時模擬樂觀鎖衝突
            if ($attempts === 1) {
                throw new QueryException(
                    'mysql',
                    'UPDATE',
                    [],
                    new Exception('Deadlock found')
                );
            }
            
            return 'success after retry';
        });

        $this->assertEquals('success after retry', $result);
        $this->assertEquals(2, $attempts);
    }

    #[Test]
    public function it_throws_exception_after_max_retries()
    {
        $attempts = 0;
        
        try {
            ConcurrencyHelper::withOptimisticLock(function () use (&$attempts) {
                $attempts++;
                // 始終拋出樂觀鎖異常
                throw new QueryException(
                    'mysql',
                    'UPDATE orders SET version = version + 1',
                    [],
                    new Exception('Deadlock found')
                );
            });
            
            $this->fail('Expected exception was not thrown');
        } catch (QueryException $e) {
            // 應該會拋出原始的 QueryException
            $this->assertStringContainsString('Deadlock found', $e->getMessage());
            // 確認重試了 3 次
            $this->assertEquals(3, $attempts);
        }
    }

    #[Test]
    public function it_acquires_distributed_lock_successfully()
    {
        $executed = false;
        
        $result = ConcurrencyHelper::withDistributedLock(
            'test_lock',
            function () use (&$executed) {
                $executed = true;
                return 'locked operation completed';
            }
        );

        $this->assertTrue($executed);
        $this->assertEquals('locked operation completed', $result);
        
        // 驗證鎖已被釋放
        $this->assertFalse(Cache::has('test_lock'));
    }

    #[Test]
    public function it_prevents_concurrent_execution_with_distributed_lock()
    {
        $lockKey = 'concurrent_test_lock';
        $executionOrder = [];
        
        // 第一個操作獲取鎖
        Cache::put($lockKey, 'first_lock', 5);
        
        // 第二個操作應該等待或失敗
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('無法在 1 秒內獲取分布式鎖');
        
        ConcurrencyHelper::withDistributedLock(
            $lockKey,
            function () use (&$executionOrder) {
                $executionOrder[] = 'second';
                return 'second';
            },
            ttl: 5,
            waitTimeout: 1 // 只等待1秒
        );
    }

    #[Test]
    public function it_executes_batch_operation_with_deadlock_prevention()
    {
        // 創建測試產品
        $products = [];
        for ($i = 1; $i <= 3; $i++) {
            $products[] = \App\Models\Product::factory()->create(['name' => "Product $i"]);
        }

        $result = ConcurrencyHelper::withDeadlockPrevention(
            [3, 1, 2], // 無序的ID
            function ($resourceId) {
                // 每個資源會單獨處理
                return \App\Models\Product::find($resourceId)->name;
            }
        );

        // 結果應該是一個關聯數組，鍵是排序後的資源ID
        $this->assertCount(3, $result);
        $this->assertEquals('Product 1', $result[1]);
        $this->assertEquals('Product 2', $result[2]);
        $this->assertEquals('Product 3', $result[3]);
    }

    #[Test]
    public function it_loads_models_with_pessimistic_lock()
    {
        // Skip this test in SQLite as it doesn't support FIELD function
        if (DB::getDriverName() === 'sqlite') {
            $this->markTestSkipped('SQLite does not support FIELD function');
        }
        
        // 創建測試訂單
        $order = \App\Models\Order::factory()->create([
            'order_number' => 'TEST-001',
            'grand_total' => 1000
        ]);

        $result = ConcurrencyHelper::withPessimisticLock(
            \App\Models\Order::class,
            [$order->id],
            function ($models) {
                $this->assertCount(1, $models);
                $this->assertEquals('TEST-001', $models->first()->order_number);
                
                // 修改訂單
                $models->first()->update(['grand_total' => 2000]);
                
                return 'updated';
            }
        );

        $this->assertEquals('updated', $result);
        
        // 驗證更新成功
        $order->refresh();
        $this->assertEquals(2000, $order->grand_total);
    }

    #[Test]
    public function it_performs_atomic_increment()
    {
        $key = 'test_counter';
        
        // 第一次增量
        $result = ConcurrencyHelper::atomicIncrement($key, 5);
        $this->assertEquals(5, $result);
        
        // 第二次增量
        $result = ConcurrencyHelper::atomicIncrement($key, 3);
        $this->assertEquals(8, $result);
        
        // 驗證緩存中的值
        $this->assertEquals(8, Cache::get($key));
    }

    #[Test]
    public function it_performs_conditional_update()
    {
        // 創建測試訂單
        $order = \App\Models\Order::factory()->create([
            'payment_status' => 'pending',
            'grand_total' => 1000
        ]);

        // 執行條件更新
        $success = ConcurrencyHelper::conditionalUpdate(
            \App\Models\Order::class,
            $order->id,
            ['payment_status' => 'pending', 'grand_total' => 1000],
            ['payment_status' => 'paid']
        );

        $this->assertTrue($success);
        
        // 驗證更新成功
        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
    }

    #[Test]
    public function it_fails_conditional_update_when_condition_not_met()
    {
        // 創建測試訂單
        $order = \App\Models\Order::factory()->create([
            'payment_status' => 'paid',
            'grand_total' => 1000
        ]);

        // 執行條件更新（條件不符）
        $success = ConcurrencyHelper::conditionalUpdate(
            \App\Models\Order::class,
            $order->id,
            ['payment_status' => 'pending'], // 條件不符合
            ['payment_status' => 'refunded']
        );

        $this->assertFalse($success);
        
        // 驗證未更新
        $order->refresh();
        $this->assertEquals('paid', $order->payment_status);
    }

    #[Test]
    public function it_releases_lock_on_exception()
    {
        $lockKey = 'exception_test_lock';
        
        try {
            ConcurrencyHelper::withDistributedLock(
                $lockKey,
                function () {
                    throw new Exception('Operation failed');
                }
            );
        } catch (Exception $e) {
            // 預期會拋出異常
        }

        // 驗證鎖已被釋放
        $this->assertFalse(Cache::has($lockKey));
    }

    #[Test]
    public function it_uses_exponential_backoff_for_retries()
    {
        $attemptTimes = [];
        
        try {
            ConcurrencyHelper::withOptimisticLock(function () use (&$attemptTimes) {
                $attemptTimes[] = microtime(true);
                
                // 始終拋出異常以測試重試
                throw new QueryException(
                    'mysql',
                    'UPDATE',
                    [],
                    new Exception('Deadlock')
                );
            }, maxAttempts: 3);
        } catch (Exception $e) {
            // 預期會拋出異常
        }

        // 驗證有3次嘗試
        $this->assertCount(3, $attemptTimes);
        
        // 驗證重試間隔呈指數增長（允許一些誤差）
        if (count($attemptTimes) >= 2) {
            $firstDelay = ($attemptTimes[1] - $attemptTimes[0]) * 1000; // 轉換為毫秒
            $this->assertGreaterThan(90, $firstDelay); // 應該約100ms
            $this->assertLessThan(150, $firstDelay);
        }
        
        if (count($attemptTimes) >= 3) {
            $secondDelay = ($attemptTimes[2] - $attemptTimes[1]) * 1000;
            $this->assertGreaterThan(190, $secondDelay); // 應該約200ms
            $this->assertLessThan(250, $secondDelay);
        }
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }
}