<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\BaseService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\Sanctum;

class BaseServiceCompleteTest extends TestCase
{
    use RefreshDatabase;

    private $testService;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        // 創建測試用的 BaseService 實現
        $this->testService = new class extends BaseService {
            public function testExecuteInTransaction(callable $callback)
            {
                return $this->executeInTransaction($callback);
            }
            
            public function testRequireAuthentication(string $operation = '操作'): int
            {
                return $this->requireAuthentication($operation);
            }
            
            public function testLogOperation(string $operation, array $data = [], string $level = 'info'): void
            {
                $this->logOperation($operation, $data, $level);
            }
            
            public function testProcessBatch(array $items, callable $callback, int $chunkSize = 100): array
            {
                return $this->processBatch($items, $callback, $chunkSize);
            }
            
            public function testHandleException(\Exception $exception, string $operation, array $context = []): void
            {
                $this->handleException($exception, $operation, $context);
            }
        };
    }

    public function test_execute_in_transaction_creates_transaction_in_production()
    {
        // 模擬非測試環境
        app()->instance('env', 'production');
        
        $callbackExecuted = false;
        $result = $this->testService->testExecuteInTransaction(function () use (&$callbackExecuted) {
            $callbackExecuted = true;
            return 'success';
        });
        
        $this->assertTrue($callbackExecuted);
        $this->assertEquals('success', $result);
    }

    public function test_execute_in_transaction_executes_directly_in_testing()
    {
        // 測試環境應該直接執行
        $callbackExecuted = false;
        $result = $this->testService->testExecuteInTransaction(function () use (&$callbackExecuted) {
            $callbackExecuted = true;
            return 'test_success';
        });
        
        $this->assertTrue($callbackExecuted);
        $this->assertEquals('test_success', $result);
    }

    public function test_execute_in_transaction_executes_directly_when_transaction_exists()
    {
        DB::beginTransaction();
        
        try {
            $callbackExecuted = false;
            $result = $this->testService->testExecuteInTransaction(function () use (&$callbackExecuted) {
                $callbackExecuted = true;
                $this->assertGreaterThan(0, DB::transactionLevel());
                return 'nested_success';
            });
            
            $this->assertTrue($callbackExecuted);
            $this->assertEquals('nested_success', $result);
        } finally {
            DB::rollBack();
        }
    }

    public function test_execute_in_transaction_handles_callback_exception()
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('測試異常');
        
        $this->testService->testExecuteInTransaction(function () {
            throw new \RuntimeException('測試異常');
        });
    }

    public function test_require_authentication_returns_user_id_when_authenticated()
    {
        Sanctum::actingAs($this->user);
        
        $userId = $this->testService->testRequireAuthentication();
        
        $this->assertEquals($this->user->id, $userId);
    }

    public function test_require_authentication_with_custom_operation_name()
    {
        Sanctum::actingAs($this->user);
        
        $userId = $this->testService->testRequireAuthentication('庫存管理');
        
        $this->assertEquals($this->user->id, $userId);
    }

    public function test_require_authentication_throws_exception_when_not_authenticated()
    {
        // 確保用戶未認證
        Auth::logout();
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行操作');
        
        $this->testService->testRequireAuthentication();
    }

    public function test_require_authentication_throws_exception_with_custom_operation()
    {
        Auth::logout();
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('用戶必須經過認證才能執行庫存管理');
        
        $this->testService->testRequireAuthentication('庫存管理');
    }

    public function test_log_operation_logs_with_default_info_level()
    {
        Sanctum::actingAs($this->user);
        
        Log::shouldReceive('info')
            ->once()
            ->with('測試操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => $this->user->id
            ]));
        
        $this->testService->testLogOperation('測試操作');
    }

    public function test_log_operation_logs_with_custom_level()
    {
        Sanctum::actingAs($this->user);
        
        Log::shouldReceive('warning')
            ->once()
            ->with('警告操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => $this->user->id
            ]));
        
        $this->testService->testLogOperation('警告操作', [], 'warning');
    }

    public function test_log_operation_includes_additional_data()
    {
        Sanctum::actingAs($this->user);
        
        $additionalData = [
            'product_id' => 123,
            'quantity' => 10
        ];
        
        Log::shouldReceive('info')
            ->once()
            ->with('庫存操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => $this->user->id,
                'product_id' => 123,
                'quantity' => 10
            ]));
        
        $this->testService->testLogOperation('庫存操作', $additionalData);
    }

    public function test_log_operation_handles_unauthenticated_user()
    {
        Auth::logout();
        
        Log::shouldReceive('info')
            ->once()
            ->with('系統操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => null
            ]));
        
        $this->testService->testLogOperation('系統操作');
    }

    public function test_process_batch_processes_items_in_chunks()
    {
        $items = range(1, 250); // 250 個項目
        $processedChunks = [];
        
        $result = $this->testService->testProcessBatch($items, function ($chunk) use (&$processedChunks) {
            $processedChunks[] = count($chunk);
            return array_map(function ($item) {
                return $item * 2;
            }, $chunk);
        }, 100);
        
        // 預設批量大小 100，所以應該有 3 個批次：100, 100, 50
        $this->assertEquals([100, 100, 50], $processedChunks);
        $this->assertCount(250, $result);
        $this->assertEquals(2, $result[0]); // 第一個項目 1 * 2 = 2
        $this->assertEquals(500, $result[249]); // 最後一個項目 250 * 2 = 500
    }

    public function test_process_batch_with_custom_chunk_size()
    {
        $items = range(1, 10);
        $processedChunks = [];
        
        $result = $this->testService->testProcessBatch($items, function ($chunk) use (&$processedChunks) {
            $processedChunks[] = count($chunk);
            return $chunk;
        }, 3); // 自定義批量大小 3
        
        // 應該有 4 個批次：3, 3, 3, 1
        $this->assertEquals([3, 3, 3, 1], $processedChunks);
        $this->assertCount(10, $result);
    }

    public function test_process_batch_handles_empty_array()
    {
        $callbackExecuted = false;
        
        $result = $this->testService->testProcessBatch([], function ($chunk) use (&$callbackExecuted) {
            $callbackExecuted = true;
            return $chunk;
        });
        
        $this->assertFalse($callbackExecuted);
        $this->assertEquals([], $result);
    }

    public function test_process_batch_handles_non_array_callback_return()
    {
        $items = [1, 2, 3];
        
        $result = $this->testService->testProcessBatch($items, function ($chunk) {
            return 'not_an_array'; // 回調返回非數組
        });
        
        $this->assertEquals([], $result);
    }

    public function test_process_batch_handles_null_callback_return()
    {
        $items = [1, 2, 3];
        
        $result = $this->testService->testProcessBatch($items, function ($chunk) {
            return null; // 回調返回 null
        });
        
        $this->assertEquals([], $result);
    }

    public function test_process_batch_merges_multiple_chunk_results()
    {
        $items = [1, 2, 3, 4, 5];
        
        $result = $this->testService->testProcessBatch($items, function ($chunk) {
            return array_map(function ($item) {
                return "processed_{$item}";
            }, $chunk);
        }, 2);
        
        $expected = ['processed_1', 'processed_2', 'processed_3', 'processed_4', 'processed_5'];
        $this->assertEquals($expected, $result);
    }

    public function test_handle_exception_logs_error_and_rethrows()
    {
        Sanctum::actingAs($this->user);
        
        $exception = new \RuntimeException('測試錯誤');
        
        Log::shouldReceive('error')
            ->once()
            ->with('錯誤: 測試操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => $this->user->id,
                'error_message' => '測試錯誤'
            ]));
        
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('測試錯誤');
        
        $this->testService->testHandleException($exception, '測試操作');
    }

    public function test_handle_exception_includes_context_data()
    {
        Sanctum::actingAs($this->user);
        
        $exception = new \InvalidArgumentException('參數錯誤');
        $context = [
            'product_id' => 123,
            'user_input' => 'invalid_data'
        ];
        
        Log::shouldReceive('error')
            ->once()
            ->with('錯誤: 參數驗證', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => $this->user->id,
                'error_message' => '參數錯誤',
                'product_id' => 123,
                'user_input' => 'invalid_data'
            ]));
        
        $this->expectException(\InvalidArgumentException::class);
        
        $this->testService->testHandleException($exception, '參數驗證', $context);
    }

    public function test_handle_exception_works_with_unauthenticated_user()
    {
        Auth::logout();
        
        $exception = new \Exception('系統錯誤');
        
        Log::shouldReceive('error')
            ->once()
            ->with('錯誤: 系統操作', \Mockery::subset([
                'service' => get_class($this->testService),
                'user_id' => null,
                'error_message' => '系統錯誤'
            ]));
        
        $this->expectException(\Exception::class);
        
        $this->testService->testHandleException($exception, '系統操作');
    }

    public function test_integration_all_methods_work_together()
    {
        Sanctum::actingAs($this->user);
        
        // 測試所有方法的綜合使用
        $items = [1, 2, 3, 4, 5];
        
        Log::shouldReceive('info')
            ->once()
            ->with('開始批量處理', \Mockery::any());
        
        $result = $this->testService->testExecuteInTransaction(function () use ($items) {
            $userId = $this->testService->testRequireAuthentication('批量處理');
            $this->testService->testLogOperation('開始批量處理');
            
            return $this->testService->testProcessBatch($items, function ($chunk) use ($userId) {
                return array_map(function ($item) use ($userId) {
                    return ['item' => $item, 'processed_by' => $userId];
                }, $chunk);
            }, 2);
        });
        
        $this->assertCount(5, $result);
        $this->assertEquals(['item' => 1, 'processed_by' => $this->user->id], $result[0]);
        $this->assertEquals(['item' => 5, 'processed_by' => $this->user->id], $result[4]);
    }
}