<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ConcurrencyHelper
{
    /**
     * 樂觀鎖重試次數
     */
    private const MAX_RETRY_ATTEMPTS = 3;
    
    /**
     * 重試間隔（毫秒）
     */
    private const RETRY_DELAY_MS = 100;
    
    /**
     * 分布式鎖預設過期時間（秒）
     */
    private const DEFAULT_LOCK_TTL = 30;
    
    /**
     * 使用樂觀鎖執行操作
     * 
     * @param callable $operation 要執行的操作
     * @param int $maxAttempts 最大重試次數
     * @return mixed 操作結果
     * @throws \Exception 當所有重試都失敗時
     */
    public static function withOptimisticLock(callable $operation, int $maxAttempts = self::MAX_RETRY_ATTEMPTS)
    {
        $attempts = 0;
        $lastException = null;
        
        while ($attempts < $maxAttempts) {
            try {
                return $operation();
            } catch (\Illuminate\Database\QueryException $e) {
                $lastException = $e;
                
                // 檢查是否為樂觀鎖衝突
                if (self::isOptimisticLockException($e)) {
                    $attempts++;
                    
                    if ($attempts < $maxAttempts) {
                        // 指數退避延遲
                        $delay = self::RETRY_DELAY_MS * pow(2, $attempts - 1);
                        usleep($delay * 1000);
                        
                        Log::info("樂觀鎖衝突，正在重試", [
                            'attempt' => $attempts,
                            'max_attempts' => $maxAttempts,
                            'delay_ms' => $delay
                        ]);
                        
                        continue;
                    }
                }
                
                // 非樂觀鎖錯誤或重試次數耗盡，直接拋出異常
                throw $e;
            }
        }
        
        throw new \Exception(
            "樂觀鎖操作失敗，已重試 {$maxAttempts} 次。最後錯誤：" . $lastException->getMessage(),
            0,
            $lastException
        );
    }
    
    /**
     * 使用分布式鎖執行操作
     * 
     * @param string $lockKey 鎖的鍵名
     * @param callable $operation 要執行的操作
     * @param int $ttl 鎖的過期時間（秒）
     * @param int $waitTimeout 等待鎖的超時時間（秒）
     * @return mixed 操作結果
     * @throws \Exception 當無法獲取鎖或操作失敗時
     */
    public static function withDistributedLock(
        string $lockKey,
        callable $operation,
        int $ttl = self::DEFAULT_LOCK_TTL,
        int $waitTimeout = 10
    ) {
        $lockAcquired = false;
        $lockValue = uniqid(php_uname('n') . '_', true);
        $startTime = time();
        
        try {
            // 嘗試獲取鎖
            while (time() - $startTime < $waitTimeout) {
                if (Cache::add($lockKey, $lockValue, $ttl)) {
                    $lockAcquired = true;
                    break;
                }
                
                // 等待一段時間後重試
                usleep(50000); // 50ms
            }
            
            if (!$lockAcquired) {
                throw new \Exception("無法在 {$waitTimeout} 秒內獲取分布式鎖：{$lockKey}");
            }
            
            Log::info("成功獲取分布式鎖", [
                'lock_key' => $lockKey,
                'lock_value' => $lockValue,
                'ttl' => $ttl
            ]);
            
            // 執行操作
            return $operation();
            
        } finally {
            // 釋放鎖
            if ($lockAcquired) {
                self::releaseLock($lockKey, $lockValue);
            }
        }
    }
    
    /**
     * 批量操作時的死鎖預防
     * 對資源ID進行排序以避免死鎖
     * 
     * @param array $resourceIds 資源ID陣列
     * @param callable $operation 對每個資源執行的操作
     * @param bool $useTransaction 是否使用事務
     * @return array 操作結果
     */
    public static function withDeadlockPrevention(
        array $resourceIds,
        callable $operation,
        bool $useTransaction = true
    ): array {
        // 排序資源ID避免死鎖
        sort($resourceIds);
        
        $executeOperation = function () use ($resourceIds, $operation) {
            $results = [];
            foreach ($resourceIds as $resourceId) {
                $results[$resourceId] = $operation($resourceId);
            }
            return $results;
        };
        
        if ($useTransaction) {
            return DB::transaction($executeOperation);
        }
        
        return $executeOperation();
    }
    
    /**
     * 悲觀鎖批量操作
     * 
     * @param string $modelClass 模型類別
     * @param array $ids ID陣列
     * @param callable $operation 操作回調
     * @return array 操作結果
     */
    public static function withPessimisticLock(
        string $modelClass,
        array $ids,
        callable $operation
    ): array {
        return DB::transaction(function () use ($modelClass, $ids, $operation) {
            // 排序ID避免死鎖
            sort($ids);
            
            // 使用悲觀鎖加載模型
            $models = $modelClass::whereIn('id', $ids)
                ->lockForUpdate()
                ->orderByRaw('FIELD(id, ' . implode(',', $ids) . ')')
                ->get();
            
            return $operation($models);
        });
    }
    
    /**
     * 併發安全的計數器操作
     * 
     * @param string $key 計數器鍵名
     * @param int $increment 增量值
     * @param int $ttl 過期時間（秒）
     * @return int 新的計數值
     */
    public static function atomicIncrement(string $key, int $increment = 1, int $ttl = 3600): int
    {
        // 如果鍵不存在，先設置為 0
        if (!Cache::has($key)) {
            Cache::put($key, 0, $ttl);
        }
        
        // 執行原子增量操作
        return Cache::increment($key, $increment);
    }
    
    /**
     * 併發安全的條件更新
     * 
     * @param string $modelClass 模型類別
     * @param int $id 模型ID
     * @param array $conditions 更新條件
     * @param array $updates 更新數據
     * @return bool 是否更新成功
     */
    public static function conditionalUpdate(
        string $modelClass,
        int $id,
        array $conditions,
        array $updates
    ): bool {
        return DB::transaction(function () use ($modelClass, $id, $conditions, $updates) {
            $model = $modelClass::where('id', $id)->lockForUpdate()->first();
            
            if (!$model) {
                return false;
            }
            
            // 檢查條件
            foreach ($conditions as $field => $expectedValue) {
                // 使用弱類型比較以處理數字類型轉換問題
                if ($model->$field != $expectedValue) {
                    return false;
                }
            }
            
            // 執行更新
            return $model->update($updates);
        });
    }
    
    /**
     * 檢查是否為樂觀鎖異常
     * 
     * @param \Exception $exception 異常對象
     * @return bool 是否為樂觀鎖異常
     */
    private static function isOptimisticLockException(\Exception $exception): bool
    {
        $message = strtolower($exception->getMessage());
        
        // 檢查常見的樂觀鎖錯誤訊息
        $optimisticLockKeywords = [
            'deadlock',
            'lock wait timeout',
            'version',
            'updated_at',
            'concurrent update'
        ];
        
        foreach ($optimisticLockKeywords as $keyword) {
            if (strpos($message, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 釋放分布式鎖
     * 
     * @param string $lockKey 鎖的鍵名
     * @param string $lockValue 鎖的值
     * @return bool 是否成功釋放
     */
    private static function releaseLock(string $lockKey, string $lockValue): bool
    {
        // 使用Lua腳本確保原子性操作
        $script = "
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
        ";
        
        try {
            // 如果使用Redis作為Cache驅動
            if (config('cache.default') === 'redis') {
                $redis = Cache::getRedis();
                $result = $redis->eval($script, 1, $lockKey, $lockValue);
                
                Log::info("釋放分布式鎖", [
                    'lock_key' => $lockKey,
                    'lock_value' => $lockValue,
                    'success' => $result === 1
                ]);
                
                return $result === 1;
            }
            
            // 降級處理：直接刪除（可能有競態條件）
            $currentValue = Cache::get($lockKey);
            if ($currentValue === $lockValue) {
                Cache::forget($lockKey);
                return true;
            }
            
        } catch (\Exception $e) {
            Log::error("釋放分布式鎖失敗", [
                'lock_key' => $lockKey,
                'error' => $e->getMessage()
            ]);
        }
        
        return false;
    }
}