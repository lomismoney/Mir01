<?php

namespace App\Services\Traits;

use App\Models\OrderStatusHistory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

trait HandlesStatusHistory
{
    /**
     * 記錄狀態變更歷史
     * 
     * @param Model $model 要記錄狀態的模型
     * @param string|null $fromStatus 原始狀態
     * @param string $toStatus 新狀態
     * @param string $statusType 狀態類型 (shipping_status, payment_status, etc.)
     * @param string|null $notes 備註
     * @return OrderStatusHistory 狀態歷史記錄
     */
    protected function recordStatusChange(
        Model $model,
        ?string $fromStatus,
        string $toStatus,
        string $statusType,
        string $notes = null
    ): OrderStatusHistory {
        return $model->statusHistories()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'status_type' => $statusType,
            'user_id' => $this->requireAuthentication('狀態變更'),
            'notes' => $notes,
        ]);
    }
    
    /**
     * 批量狀態更新
     * 
     * @param string $modelClass 模型類別名稱
     * @param array $ids ID陣列
     * @param string $statusField 狀態欄位名稱
     * @param string $statusValue 新狀態值
     * @param string $statusType 狀態類型
     * @param string|null $notes 備註
     * @return array 更新結果
     */
    protected function batchUpdateStatus(
        string $modelClass,
        array $ids,
        string $statusField,
        string $statusValue,
        string $statusType,
        ?string $notes = null
    ): array {
        if (empty($ids)) {
            return [];
        }
        
        // 排序ID避免死鎖
        $sortedIds = $this->sortIdsForDeadlockPrevention($ids);
        
        $models = $modelClass::whereIn('id', $sortedIds)
            ->lockForUpdate()
            ->get();
        
        $results = [];
        foreach ($models as $model) {
            $originalStatus = $model->{$statusField};
            
            if ($originalStatus !== $statusValue) {
                $model->update([$statusField => $statusValue]);
                
                $this->recordStatusChange(
                    $model,
                    $originalStatus,
                    $statusValue,
                    $statusType,
                    $notes
                );
                
                $results[] = [
                    'id' => $model->id,
                    'from_status' => $originalStatus,
                    'to_status' => $statusValue,
                    'success' => true
                ];
            } else {
                $results[] = [
                    'id' => $model->id,
                    'from_status' => $originalStatus,
                    'to_status' => $statusValue,
                    'success' => false,
                    'message' => '狀態未變更'
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * 驗證狀態轉換是否合法
     * 
     * @param string $fromStatus 原始狀態
     * @param string $toStatus 目標狀態
     * @param array $allowedTransitions 允許的狀態轉換規則
     * @return bool 是否允許轉換
     */
    protected function isValidStatusTransition(
        string $fromStatus,
        string $toStatus,
        array $allowedTransitions
    ): bool {
        if (!isset($allowedTransitions[$fromStatus])) {
            return false;
        }
        
        return in_array($toStatus, $allowedTransitions[$fromStatus]);
    }
    
    /**
     * 強制狀態轉換驗證
     * 
     * @param string $fromStatus 原始狀態
     * @param string $toStatus 目標狀態
     * @param array $allowedTransitions 允許的狀態轉換規則
     * @param string $context 上下文描述
     * @throws \InvalidArgumentException 當狀態轉換不合法時
     */
    protected function validateStatusTransition(
        string $fromStatus,
        string $toStatus,
        array $allowedTransitions,
        string $context = '狀態轉換'
    ): void {
        if (!$this->isValidStatusTransition($fromStatus, $toStatus, $allowedTransitions)) {
            $allowedStates = isset($allowedTransitions[$fromStatus]) 
                ? implode(', ', $allowedTransitions[$fromStatus])
                : '無';
                
            throw new \InvalidArgumentException(
                "{$context}：無法從 '{$fromStatus}' 轉換到 '{$toStatus}'。" .
                "允許的轉換狀態：{$allowedStates}"
            );
        }
    }
    
    /**
     * 獲取模型的狀態歷史
     * 
     * @param Model $model 模型實例
     * @param string|null $statusType 狀態類型篩選
     * @param int $limit 限制數量
     * @return Collection 狀態歷史集合
     */
    protected function getStatusHistory(
        Model $model,
        ?string $statusType = null,
        int $limit = 50
    ): Collection {
        $query = $model->statusHistories()
            ->with('user:id,name,email')
            ->latest();
        
        if ($statusType) {
            $query->where('status_type', $statusType);
        }
        
        return $query->limit($limit)->get();
    }
    
    /**
     * 檢查模型是否具有特定狀態
     * 
     * @param Model $model 模型實例
     * @param string $statusField 狀態欄位名稱
     * @param string|array $statusValues 要檢查的狀態值
     * @return bool 是否具有指定狀態
     */
    protected function hasStatus(Model $model, string $statusField, $statusValues): bool
    {
        $currentStatus = $model->{$statusField};
        
        if (is_array($statusValues)) {
            return in_array($currentStatus, $statusValues);
        }
        
        return $currentStatus === $statusValues;
    }
    
    /**
     * 批量檢查狀態
     * 
     * @param Collection $models 模型集合
     * @param string $statusField 狀態欄位名稱
     * @param string|array $statusValues 要檢查的狀態值
     * @return array 檢查結果 ['matching' => Collection, 'non_matching' => Collection]
     */
    protected function filterByStatus(
        Collection $models,
        string $statusField,
        $statusValues
    ): array {
        $matching = $models->filter(function ($model) use ($statusField, $statusValues) {
            return $this->hasStatus($model, $statusField, $statusValues);
        });
        
        $nonMatching = $models->reject(function ($model) use ($statusField, $statusValues) {
            return $this->hasStatus($model, $statusField, $statusValues);
        });
        
        return [
            'matching' => $matching,
            'non_matching' => $nonMatching
        ];
    }
}