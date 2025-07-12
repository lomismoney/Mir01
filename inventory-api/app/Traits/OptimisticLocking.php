<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;

/**
 * 樂觀鎖 Trait
 * 
 * 提供基於版本號的樂觀鎖功能，用於處理並發更新。
 * 使用此 trait 的模型需要有 'version' 欄位。
 */
trait OptimisticLocking
{
    /**
     * Boot the trait
     */
    public static function bootOptimisticLocking()
    {
        // 在創建時設置默認版本號
        static::creating(function (Model $model) {
            $versionColumn = $model->getVersionColumn();
            if (!isset($model->$versionColumn)) {
                $model->$versionColumn = 0;
            }
        });
        
        // 在更新前檢查版本
        static::updating(function (Model $model) {
            $model->checkVersion();
        });
        
        // 在更新後遞增版本
        static::updated(function (Model $model) {
            $model->incrementVersion();
        });
    }
    
    /**
     * 檢查版本是否匹配
     * 
     * @throws \Exception
     */
    protected function checkVersion()
    {
        $versionColumn = $this->getVersionColumn();
        
        // 取得原始版本號
        $originalVersion = $this->getOriginal($versionColumn);
        
        // 查詢資料庫中的當前版本
        $currentVersion = static::where($this->getKeyName(), $this->getKey())
            ->value($versionColumn);
        
        // 如果版本不匹配，拋出異常
        if ($originalVersion !== $currentVersion) {
            throw new \Exception(
                "樂觀鎖衝突：記錄已被其他用戶修改。" .
                "期望版本：{$originalVersion}，當前版本：{$currentVersion}"
            );
        }
    }
    
    /**
     * 遞增版本號
     */
    protected function incrementVersion()
    {
        $versionColumn = $this->getVersionColumn();
        
        // 直接在資料庫中遞增，避免觸發模型事件
        static::where($this->getKeyName(), $this->getKey())
            ->increment($versionColumn);
        
        // 更新模型實例的版本號
        $this->setAttribute($versionColumn, $this->getAttribute($versionColumn) + 1);
        $this->syncOriginal([$versionColumn]);
    }
    
    /**
     * 取得版本欄位名稱
     * 
     * @return string
     */
    protected function getVersionColumn(): string
    {
        return property_exists($this, 'versionColumn') 
            ? $this->versionColumn 
            : 'version';
    }
    
    /**
     * 使用樂觀鎖更新
     * 
     * @param array $attributes
     * @return bool
     * @throws \Exception
     */
    public function updateWithLock(array $attributes): bool
    {
        $this->fill($attributes);
        
        try {
            return $this->save();
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), '樂觀鎖衝突')) {
                // 重新載入模型並返回 false
                $this->refresh();
                return false;
            }
            
            throw $e;
        }
    }
    
    /**
     * 重試更新直到成功
     * 
     * @param callable $callback 更新邏輯回調
     * @param int $maxAttempts 最大重試次數
     * @return bool
     * @throws \Exception
     */
    public function retryUpdate(callable $callback, int $maxAttempts = 3): bool
    {
        $attempts = 0;
        
        while ($attempts < $maxAttempts) {
            $attempts++;
            
            try {
                // 重新載入最新數據
                if ($attempts > 1) {
                    $this->refresh();
                }
                
                // 執行更新邏輯
                $callback($this);
                
                // 保存變更
                if ($this->save()) {
                    return true;
                }
            } catch (\Exception $e) {
                if (!str_contains($e->getMessage(), '樂觀鎖衝突') || $attempts >= $maxAttempts) {
                    throw $e;
                }
            }
        }
        
        return false;
    }
}