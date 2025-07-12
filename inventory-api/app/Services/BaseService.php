<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

abstract class BaseService
{
    /**
     * 統一的事務管理模式
     * 在測試環境或已有事務時直接執行，否則開啟新事務
     */
    protected function executeInTransaction(callable $callback)
    {
        if (app()->environment('testing') || DB::transactionLevel() > 0) {
            return $callback();
        }
        
        return DB::transaction($callback);
    }
    
    /**
     * 驗證用戶認證
     * 
     * @param string $operation 操作名稱，用於錯誤訊息
     * @return int 已認證的用戶ID
     * @throws \InvalidArgumentException 當用戶未認證時
     */
    protected function requireAuthentication(string $operation = '操作'): int
    {
        $userId = Auth::id();
        if (!$userId) {
            throw new \InvalidArgumentException("用戶必須經過認證才能執行{$operation}");
        }
        
        return $userId;
    }
    
    /**
     * 記錄服務操作日誌
     * 
     * @param string $operation 操作名稱
     * @param array $data 額外的日誌數據
     * @param string $level 日誌級別
     */
    protected function logOperation(string $operation, array $data = [], string $level = 'info'): void
    {
        Log::$level($operation, array_merge([
            'service' => static::class,
            'user_id' => Auth::id(),
            'timestamp' => now()->toISOString()
        ], $data));
    }
    
    /**
     * 安全的批量處理
     * 將大量數據分批處理以避免記憶體溢出
     * 
     * @param array $items 要處理的項目
     * @param callable $callback 處理回調函數
     * @param int $chunkSize 批量大小
     * @return array 處理結果
     */
    protected function processBatch(array $items, callable $callback, int $chunkSize = 100): array
    {
        $results = [];
        $chunks = array_chunk($items, $chunkSize);
        
        foreach ($chunks as $chunk) {
            $chunkResults = $callback($chunk);
            if (is_array($chunkResults)) {
                $results = array_merge($results, $chunkResults);
            }
        }
        
        return $results;
    }
    
    /**
     * 統一的錯誤處理
     * 
     * @param \Exception $exception 異常對象
     * @param string $operation 操作名稱
     * @param array $context 上下文數據
     * @throws \Exception 重新拋出異常
     */
    protected function handleException(\Exception $exception, string $operation, array $context = []): void
    {
        $this->logOperation("錯誤: {$operation}", array_merge([
            'error_message' => $exception->getMessage(),
            'error_file' => $exception->getFile(),
            'error_line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ], $context), 'error');
        
        throw $exception;
    }
}