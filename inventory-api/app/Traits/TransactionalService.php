<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * 事務處理服務 Trait
 * 
 * 提供統一的事務處理邏輯，避免嵌套事務問題，
 * 並提供錯誤處理和日誌記錄功能。
 */
trait TransactionalService
{
    /**
     * 在事務中執行操作
     * 
     * @param callable $callback 要執行的回調函數
     * @param string|null $operationName 操作名稱（用於日誌記錄）
     * @return mixed 回調函數的返回值
     * @throws \Throwable
     */
    protected function executeInTransaction(callable $callback, ?string $operationName = null)
    {
        // 如果已在事務中，直接執行回調
        if (DB::transactionLevel() > 0) {
            return $this->executeCallback($callback, $operationName);
        }
        
        // 否則，開啟新事務
        return DB::transaction(function () use ($callback, $operationName) {
            return $this->executeCallback($callback, $operationName);
        });
    }
    
    /**
     * 執行回調並記錄日誌
     * 
     * @param callable $callback
     * @param string|null $operationName
     * @return mixed
     * @throws \Throwable
     */
    private function executeCallback(callable $callback, ?string $operationName)
    {
        $startTime = microtime(true);
        
        try {
            $result = $callback();
            
            if ($operationName) {
                $duration = round((microtime(true) - $startTime) * 1000, 2);
                Log::info("Transaction completed: {$operationName}", [
                    'duration_ms' => $duration,
                    'transaction_level' => DB::transactionLevel()
                ]);
            }
            
            return $result;
        } catch (\Throwable $e) {
            if ($operationName) {
                Log::error("Transaction failed: {$operationName}", [
                    'error' => $e->getMessage(),
                    'transaction_level' => DB::transactionLevel()
                ]);
            }
            
            throw $e;
        }
    }
    
    /**
     * 使用指定的隔離級別執行事務
     * 
     * @param callable $callback
     * @param string $isolationLevel 隔離級別 (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
     * @param string|null $operationName
     * @return mixed
     * @throws \Throwable
     */
    protected function executeWithIsolationLevel(callable $callback, string $isolationLevel, ?string $operationName = null)
    {
        $originalLevel = DB::select('SELECT @@tx_isolation')[0]->{'@@tx_isolation'};
        
        try {
            // 設置新的隔離級別
            DB::statement("SET TRANSACTION ISOLATION LEVEL {$isolationLevel}");
            
            return $this->executeInTransaction($callback, $operationName);
        } finally {
            // 恢復原始隔離級別
            DB::statement("SET TRANSACTION ISOLATION LEVEL {$originalLevel}");
        }
    }
    
    /**
     * 使用可重試的事務執行操作
     * 
     * @param callable $callback
     * @param int $maxAttempts 最大重試次數
     * @param int $delayMs 重試延遲（毫秒）
     * @param string|null $operationName
     * @return mixed
     * @throws \Throwable
     */
    protected function executeWithRetry(callable $callback, int $maxAttempts = 3, int $delayMs = 100, ?string $operationName = null)
    {
        $attempts = 0;
        $lastException = null;
        
        while ($attempts < $maxAttempts) {
            $attempts++;
            
            try {
                return $this->executeInTransaction($callback, $operationName);
            } catch (\Throwable $e) {
                $lastException = $e;
                
                // 檢查是否為死鎖或鎖等待超時
                if ($this->isRetriableException($e) && $attempts < $maxAttempts) {
                    if ($operationName) {
                        Log::warning("Retrying transaction: {$operationName}", [
                            'attempt' => $attempts,
                            'error' => $e->getMessage()
                        ]);
                    }
                    
                    // 延遲後重試
                    usleep($delayMs * 1000);
                    continue;
                }
                
                // 非可重試異常，直接拋出
                throw $e;
            }
        }
        
        // 達到最大重試次數
        throw $lastException;
    }
    
    /**
     * 判斷異常是否可重試
     * 
     * @param \Throwable $e
     * @return bool
     */
    private function isRetriableException(\Throwable $e): bool
    {
        $message = $e->getMessage();
        
        return str_contains($message, 'Deadlock') ||
               str_contains($message, 'Lock wait timeout') ||
               str_contains($message, 'deadlock') ||
               str_contains($message, 'lock timeout');
    }
}