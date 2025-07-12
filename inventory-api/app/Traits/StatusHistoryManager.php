<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * 狀態歷史管理 Trait
 * 
 * 提供統一的狀態變更歷史記錄功能。
 * 使用此 trait 的模型需要有對應的狀態歷史關聯。
 */
trait StatusHistoryManager
{
    /**
     * 記錄狀態變更歷史
     * 
     * @param Model $model 主模型實例（如 Order, Purchase）
     * @param string $fromStatus 原始狀態
     * @param string $toStatus 新狀態
     * @param string $statusType 狀態類型（如 'payment', 'shipping'）
     * @param string|null $notes 備註
     * @param int|null $userId 操作用戶ID（null時使用當前認證用戶）
     * @return Model 創建的歷史記錄
     */
    protected function recordStatusChange(
        Model $model,
        string $fromStatus,
        string $toStatus,
        string $statusType,
        ?string $notes = null,
        ?int $userId = null
    ): Model {
        // 取得狀態歷史關聯名稱
        $historyRelation = $this->getHistoryRelationName($model);
        
        // 創建歷史記錄
        $history = $model->$historyRelation()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'status_type' => $statusType,
            'user_id' => $userId ?? Auth::id(),
            'notes' => $notes,
        ]);
        
        // 記錄日誌
        $this->logStatusChange($model, $fromStatus, $toStatus, $statusType, $notes);
        
        return $history;
    }
    
    /**
     * 記錄批量狀態變更
     * 
     * @param array $models 模型實例陣列
     * @param string $statusType 狀態類型
     * @param string $toStatus 新狀態
     * @param string|null $notes 備註
     * @return void
     */
    protected function recordBatchStatusChange(
        array $models,
        string $statusType,
        string $toStatus,
        ?string $notes = null
    ): void {
        $userId = Auth::id();
        $batchId = uniqid('batch_');
        
        foreach ($models as $model) {
            // 取得原始狀態
            $fromStatus = $this->getModelStatus($model, $statusType);
            
            if ($fromStatus !== $toStatus) {
                $this->recordStatusChange(
                    $model,
                    $fromStatus,
                    $toStatus,
                    $statusType,
                    ($notes ? $notes . ' ' : '') . "[批次操作: {$batchId}]",
                    $userId
                );
            }
        }
    }
    
    /**
     * 檢查狀態是否已變更
     * 
     * @param Model $model
     * @param string $statusField 狀態欄位名稱
     * @return bool
     */
    protected function hasStatusChanged(Model $model, string $statusField): bool
    {
        return $model->wasChanged($statusField);
    }
    
    /**
     * 自動記錄狀態變更（在模型更新後調用）
     * 
     * @param Model $model
     * @param array $statusFields 狀態欄位配置 ['field_name' => 'status_type']
     * @param string|null $notes 備註
     * @return void
     */
    protected function autoRecordStatusChanges(
        Model $model,
        array $statusFields,
        ?string $notes = null
    ): void {
        foreach ($statusFields as $field => $statusType) {
            if ($this->hasStatusChanged($model, $field)) {
                $this->recordStatusChange(
                    $model,
                    $model->getOriginal($field),
                    $model->$field,
                    $statusType,
                    $notes
                );
            }
        }
    }
    
    /**
     * 取得狀態變更歷史
     * 
     * @param Model $model
     * @param string|null $statusType 狀態類型篩選
     * @param int|null $limit 限制筆數
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function getStatusHistory(
        Model $model,
        ?string $statusType = null,
        ?int $limit = null
    ) {
        $historyRelation = $this->getHistoryRelationName($model);
        $query = $model->$historyRelation();
        
        if ($statusType) {
            $query->where('status_type', $statusType);
        }
        
        $query->orderBy('created_at', 'desc');
        
        if ($limit) {
            $query->limit($limit);
        }
        
        return $query->get();
    }
    
    /**
     * 取得最後一次狀態變更
     * 
     * @param Model $model
     * @param string|null $statusType
     * @return Model|null
     */
    protected function getLastStatusChange(Model $model, ?string $statusType = null)
    {
        return $this->getStatusHistory($model, $statusType, 1)->first();
    }
    
    /**
     * 記錄狀態變更日誌
     * 
     * @param Model $model
     * @param string $fromStatus
     * @param string $toStatus
     * @param string $statusType
     * @param string|null $notes
     * @return void
     */
    private function logStatusChange(
        Model $model,
        string $fromStatus,
        string $toStatus,
        string $statusType,
        ?string $notes
    ): void {
        $modelClass = class_basename($model);
        $modelId = $model->getKey();
        
        Log::info("Status change: {$modelClass}", [
            'model_type' => $modelClass,
            'model_id' => $modelId,
            'status_type' => $statusType,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'user_id' => Auth::id(),
            'notes' => $notes
        ]);
    }
    
    /**
     * 取得歷史關聯名稱
     * 
     * @param Model $model
     * @return string
     */
    private function getHistoryRelationName(Model $model): string
    {
        // 預設關聯名稱映射
        $relationMap = [
            'Order' => 'statusHistories',
            'Purchase' => 'statusHistories',
            'Installation' => 'statusHistories',
        ];
        
        $modelClass = class_basename($model);
        
        return $relationMap[$modelClass] ?? 'statusHistories';
    }
    
    /**
     * 取得模型的狀態值
     * 
     * @param Model $model
     * @param string $statusType
     * @return string|null
     */
    private function getModelStatus(Model $model, string $statusType): ?string
    {
        // 狀態類型到欄位名稱的映射
        $fieldMap = [
            'payment' => 'payment_status',
            'shipping' => 'shipping_status',
            'status' => 'status',
        ];
        
        $field = $fieldMap[$statusType] ?? $statusType;
        
        return $model->$field ?? null;
    }
}