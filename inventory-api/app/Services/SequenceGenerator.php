<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

abstract class SequenceGenerator
{
    /**
     * 序號前綴
     */
    protected string $prefix = '';
    
    /**
     * 序號長度（不包含前綴）
     */
    protected int $length = 8;
    
    /**
     * 是否包含日期格式
     */
    protected bool $includeDate = true;
    
    /**
     * 日期格式
     */
    protected string $dateFormat = 'Ymd';
    
    /**
     * 數據庫表名
     */
    protected string $tableName = '';
    
    /**
     * 序號欄位名
     */
    protected string $numberField = '';
    
    /**
     * 緩存鍵前綴
     */
    protected string $cachePrefix = '';
    
    /**
     * 生成下一個序號
     * 
     * @param string|null $key 額外的鍵值（用於多租戶或分組）
     * @return string 生成的序號
     */
    public function generateNextNumber(?string $key = null): string
    {
        return ConcurrencyHelper::withOptimisticLock(function () use ($key) {
            return $this->doGenerateNumber($key);
        });
    }
    
    /**
     * 為特定日期生成序號
     * 
     * @param \DateTime|null $date 日期，為null時使用當前日期
     * @param string|null $key 額外的鍵值
     * @return string 生成的序號
     */
    public function generateForDate(?\DateTime $date = null, ?string $key = null): string
    {
        $date = $date ?? new \DateTime();
        
        return ConcurrencyHelper::withOptimisticLock(function () use ($date, $key) {
            return $this->doGenerateNumberForDate($date, $key);
        });
    }
    
    /**
     * 批量生成序號
     * 
     * @param int $count 生成數量
     * @param string|null $key 額外的鍵值
     * @return array 生成的序號陣列
     */
    public function generateBatch(int $count, ?string $key = null): array
    {
        if ($count <= 0) {
            return [];
        }
        
        return ConcurrencyHelper::withOptimisticLock(function () use ($count, $key) {
            $numbers = [];
            $currentNumber = $this->getNextSequence($key);
            
            for ($i = 0; $i < $count; $i++) {
                $numbers[] = $this->formatNumber($currentNumber + $i, $key);
            }
            
            // 更新序號到最後一個
            $this->updateSequence($currentNumber + $count - 1, $key);
            
            return $numbers;
        });
    }
    
    /**
     * 重置序號（謹慎使用）
     * 
     * @param string|null $key 額外的鍵值
     * @param int $startFrom 重置起始號碼
     * @return bool 是否重置成功
     */
    public function resetSequence(?string $key = null, int $startFrom = 1): bool
    {
        return ConcurrencyHelper::withDistributedLock(
            $this->getLockKey($key),
            function () use ($key, $startFrom) {
                $this->updateSequence($startFrom - 1, $key);
                $this->clearCache($key);
                return true;
            }
        );
    }
    
    /**
     * 驗證序號格式
     * 
     * @param string $number 要驗證的序號
     * @return bool 是否為有效格式
     */
    public function validateNumber(string $number): bool
    {
        $pattern = $this->getValidationPattern();
        return preg_match($pattern, $number) === 1;
    }
    
    /**
     * 解析序號獲取信息
     * 
     * @param string $number 序號
     * @return array 解析結果
     */
    public function parseNumber(string $number): array
    {
        if (!$this->validateNumber($number)) {
            return ['valid' => false];
        }
        
        $result = ['valid' => true];
        
        // 移除前綴
        if ($this->prefix) {
            $number = substr($number, strlen($this->prefix));
        }
        
        // 提取日期部分
        if ($this->includeDate) {
            $dateLength = strlen($this->formatDate(new \DateTime()));
            $dateStr = substr($number, 0, $dateLength);
            
            try {
                $result['date'] = \DateTime::createFromFormat($this->dateFormat, $dateStr);
                $number = substr($number, $dateLength);
            } catch (\Exception $e) {
                $result['date'] = null;
            }
        }
        
        // 提取序號部分
        $result['sequence'] = (int) $number;
        
        return $result;
    }
    
    /**
     * 執行序號生成（內部方法）
     * 
     * @param string|null $key 額外的鍵值
     * @return string 生成的序號
     */
    protected function doGenerateNumber(?string $key = null): string
    {
        return $this->doGenerateNumberForDate(new \DateTime(), $key);
    }
    
    /**
     * 為特定日期執行序號生成（內部方法）
     * 
     * @param \DateTime $date 日期
     * @param string|null $key 額外的鍵值
     * @return string 生成的序號
     */
    protected function doGenerateNumberForDate(\DateTime $date, ?string $key = null): string
    {
        $sequence = $this->getNextSequence($key, $date);
        return $this->formatNumber($sequence, $key, $date);
    }
    
    /**
     * 獲取下一個序號
     * 
     * @param string|null $key 額外的鍵值
     * @param \DateTime|null $date 日期
     * @return int 下一個序號
     */
    protected function getNextSequence(?string $key = null, ?\DateTime $date = null): int
    {
        $date = $date ?? new \DateTime();
        $cacheKey = $this->getCacheKey($key, $date);
        
        // 嘗試從緩存獲取
        $sequence = Cache::get($cacheKey);
        
        if ($sequence === null) {
            // 從數據庫獲取最大序號
            $sequence = $this->getMaxSequenceFromDatabase($key, $date);
        }
        
        $nextSequence = $sequence + 1;
        
        // 更新緩存和數據庫
        Cache::put($cacheKey, $nextSequence, now()->addDay());
        $this->updateSequence($nextSequence, $key, $date);
        
        return $nextSequence;
    }
    
    /**
     * 從數據庫獲取最大序號
     * 
     * @param string|null $key 額外的鍵值
     * @param \DateTime $date 日期
     * @return int 最大序號
     */
    protected function getMaxSequenceFromDatabase(?string $key = null, \DateTime $date = new \DateTime()): int
    {
        if (!$this->tableName || !$this->numberField) {
            return 0;
        }
        
        $query = DB::table($this->tableName);
        
        if ($this->includeDate) {
            $dateStr = $this->formatDate($date);
            $pattern = $this->prefix . $dateStr . '%';
            $query->where($this->numberField, 'LIKE', $pattern);
        } else if ($this->prefix) {
            $query->where($this->numberField, 'LIKE', $this->prefix . '%');
        }
        
        $maxNumber = $query->max($this->numberField);
        
        if (!$maxNumber) {
            return 0;
        }
        
        $parsed = $this->parseNumber($maxNumber);
        return $parsed['valid'] ? $parsed['sequence'] : 0;
    }
    
    /**
     * 更新序號到緩存和數據庫
     * 
     * @param int $sequence 序號
     * @param string|null $key 額外的鍵值
     * @param \DateTime|null $date 日期
     */
    protected function updateSequence(int $sequence, ?string $key = null, ?\DateTime $date = null): void
    {
        $date = $date ?? new \DateTime();
        $cacheKey = $this->getCacheKey($key, $date);
        
        Cache::put($cacheKey, $sequence, now()->addDay());
    }
    
    /**
     * 格式化序號
     * 
     * @param int $sequence 序號
     * @param string|null $key 額外的鍵值
     * @param \DateTime|null $date 日期
     * @return string 格式化的序號
     */
    protected function formatNumber(int $sequence, ?string $key = null, ?\DateTime $date = null): string
    {
        $date = $date ?? new \DateTime();
        $number = '';
        
        // 添加前綴
        $number .= $this->prefix;
        
        // 添加日期
        if ($this->includeDate) {
            $number .= $this->formatDate($date);
        }
        
        // 添加序號（補零）
        $sequenceLength = $this->length - strlen($number);
        $number .= str_pad($sequence, $sequenceLength, '0', STR_PAD_LEFT);
        
        return $number;
    }
    
    /**
     * 格式化日期
     * 
     * @param \DateTime $date 日期
     * @return string 格式化的日期字符串
     */
    protected function formatDate(\DateTime $date): string
    {
        return $date->format($this->dateFormat);
    }
    
    /**
     * 獲取緩存鍵
     * 
     * @param string|null $key 額外的鍵值
     * @param \DateTime $date 日期
     * @return string 緩存鍵
     */
    protected function getCacheKey(?string $key = null, \DateTime $date = new \DateTime()): string
    {
        $parts = [$this->cachePrefix, 'sequence'];
        
        if ($this->includeDate) {
            $parts[] = $this->formatDate($date);
        }
        
        if ($key) {
            $parts[] = $key;
        }
        
        return implode(':', $parts);
    }
    
    /**
     * 獲取分布式鎖鍵
     * 
     * @param string|null $key 額外的鍵值
     * @return string 鎖鍵
     */
    protected function getLockKey(?string $key = null): string
    {
        $parts = [$this->cachePrefix, 'lock'];
        
        if ($key) {
            $parts[] = $key;
        }
        
        return implode(':', $parts);
    }
    
    /**
     * 清除緩存
     * 
     * @param string|null $key 額外的鍵值
     */
    protected function clearCache(?string $key = null): void
    {
        $pattern = $this->getCacheKey($key, new \DateTime()) . '*';
        
        // 這裡需要根據緩存驅動實現清除邏輯
        // 簡化版本：清除當天的緩存
        Cache::forget($this->getCacheKey($key, new \DateTime()));
    }
    
    /**
     * 獲取驗證正則表達式
     * 
     * @return string 正則表達式
     */
    protected function getValidationPattern(): string
    {
        $pattern = '^' . preg_quote($this->prefix, '/');
        
        if ($this->includeDate) {
            // 根據日期格式生成對應的正則
            $datePattern = str_replace(
                ['Y', 'm', 'd', 'H', 'i', 's'],
                ['\d{4}', '\d{2}', '\d{2}', '\d{2}', '\d{2}', '\d{2}'],
                $this->dateFormat
            );
            $pattern .= $datePattern;
        }
        
        // 使用加號量詞匹配一個或多個數字（更靈活的序號匹配）
        $pattern .= '\d+$';
        
        return '/' . $pattern . '/';
    }
}