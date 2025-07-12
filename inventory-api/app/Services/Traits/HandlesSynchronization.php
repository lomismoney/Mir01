<?php

namespace App\Services\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Arr;

trait HandlesSynchronization
{
    /**
     * 同步關聯數據
     * 通用的關聯數據同步方法，支援創建、更新、刪除操作
     * 
     * @param Model $parent 父模型實例
     * @param string $relationMethod 關聯方法名稱
     * @param array $newData 新數據陣列
     * @param string $idField ID欄位名稱，預設為 'id'
     * @param callable|null $createCallback 創建回調函數
     * @param callable|null $updateCallback 更新回調函數
     * @param callable|null $deleteCallback 刪除回調函數
     * @return array 同步結果統計
     */
    protected function syncRelatedData(
        Model $parent,
        string $relationMethod,
        array $newData,
        string $idField = 'id',
        callable $createCallback = null,
        callable $updateCallback = null,
        callable $deleteCallback = null
    ): array {
        // 獲取現有記錄ID
        $existingIds = $parent->$relationMethod()->pluck($idField)->all();
        
        // 獲取新數據中的ID
        $newIds = Arr::pluck(
            Arr::where($newData, fn($item) => isset($item[$idField])),
            $idField
        );
        
        // 計算要刪除的ID
        $idsToDelete = array_diff($existingIds, $newIds);
        
        // 刪除不再需要的記錄
        $deletedCount = 0;
        if (!empty($idsToDelete)) {
            if ($deleteCallback) {
                foreach ($idsToDelete as $id) {
                    $item = $parent->$relationMethod()->find($id);
                    if ($item) {
                        $deleteCallback($item);
                        $deletedCount++;
                    }
                }
            } else {
                $deletedCount = $parent->$relationMethod()->whereIn($idField, $idsToDelete)->delete();
            }
        }
        
        // 更新或創建記錄
        $createdCount = 0;
        $updatedCount = 0;
        
        foreach ($newData as $itemData) {
            if (isset($itemData[$idField]) && in_array($itemData[$idField], $existingIds)) {
                // 更新現有記錄
                $item = $parent->$relationMethod()->find($itemData[$idField]);
                if ($item) {
                    if ($updateCallback) {
                        $updateCallback($item, $itemData);
                    } else {
                        $item->update($itemData);
                    }
                    $updatedCount++;
                }
            } else {
                // 創建新記錄
                if ($createCallback) {
                    $createCallback($parent, $itemData);
                } else {
                    $parent->$relationMethod()->create($itemData);
                }
                $createdCount++;
            }
        }
        
        return [
            'created' => $createdCount,
            'updated' => $updatedCount,
            'deleted' => $deletedCount,
            'total_processed' => count($newData)
        ];
    }
    
    /**
     * 同步多對多關聯
     * 
     * @param Model $parent 父模型實例
     * @param string $relationMethod 關聯方法名稱
     * @param array $newIds 新的關聯ID陣列
     * @param array $pivotData 樞紐表額外數據
     * @param bool $detaching 是否分離不存在的關聯，預設為 true
     * @return array 同步結果
     */
    protected function syncManyToManyRelation(
        Model $parent,
        string $relationMethod,
        array $newIds,
        array $pivotData = [],
        bool $detaching = true
    ): array {
        $relation = $parent->$relationMethod();
        
        // 準備同步數據
        $syncData = [];
        foreach ($newIds as $id) {
            $syncData[$id] = $pivotData;
        }
        
        // 執行同步
        $result = $relation->sync($syncData, $detaching);
        
        return [
            'attached' => count($result['attached']),
            'detached' => count($result['detached']),
            'updated' => count($result['updated'])
        ];
    }
    
    /**
     * 批量同步模型屬性
     * 
     * @param Collection $models 模型集合
     * @param array $updates 更新數據，格式：[id => [field => value, ...], ...]
     * @param array $fillableFields 允許更新的欄位
     * @return array 更新結果
     */
    protected function batchSyncAttributes(
        Collection $models,
        array $updates,
        array $fillableFields = []
    ): array {
        $updatedCount = 0;
        $errors = [];
        
        foreach ($models as $model) {
            $modelId = $model->getKey();
            
            if (isset($updates[$modelId])) {
                $updateData = $updates[$modelId];
                
                // 過濾允許更新的欄位
                if (!empty($fillableFields)) {
                    $updateData = Arr::only($updateData, $fillableFields);
                }
                
                try {
                    $model->update($updateData);
                    $updatedCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'model_id' => $modelId,
                        'error' => $e->getMessage()
                    ];
                }
            }
        }
        
        return [
            'updated_count' => $updatedCount,
            'total_models' => $models->count(),
            'errors' => $errors
        ];
    }
    
    /**
     * 智能數據合併
     * 合併新數據到現有數據，支援深度合併
     * 
     * @param array $existingData 現有數據
     * @param array $newData 新數據
     * @param array $mergeRules 合併規則
     * @return array 合併後的數據
     */
    protected function smartMergeData(
        array $existingData,
        array $newData,
        array $mergeRules = []
    ): array {
        $result = $existingData;
        
        foreach ($newData as $key => $value) {
            $rule = $mergeRules[$key] ?? 'replace';
            
            switch ($rule) {
                case 'merge':
                    // 深度合併陣列
                    if (is_array($value) && isset($result[$key]) && is_array($result[$key])) {
                        $result[$key] = array_merge_recursive($result[$key], $value);
                    } else {
                        $result[$key] = $value;
                    }
                    break;
                    
                case 'append':
                    // 添加到陣列末尾
                    if (isset($result[$key]) && is_array($result[$key])) {
                        $result[$key][] = $value;
                    } else {
                        $result[$key] = [$value];
                    }
                    break;
                    
                case 'sum':
                    // 數值累加
                    if (isset($result[$key]) && is_numeric($result[$key]) && is_numeric($value)) {
                        $result[$key] += $value;
                    } else {
                        $result[$key] = $value;
                    }
                    break;
                    
                case 'max':
                    // 取最大值
                    if (isset($result[$key])) {
                        $result[$key] = max($result[$key], $value);
                    } else {
                        $result[$key] = $value;
                    }
                    break;
                    
                case 'ignore_if_exists':
                    // 如果已存在則忽略
                    if (!isset($result[$key])) {
                        $result[$key] = $value;
                    }
                    break;
                    
                case 'replace':
                default:
                    // 直接替換
                    $result[$key] = $value;
                    break;
            }
        }
        
        return $result;
    }
    
    /**
     * 驗證同步數據完整性
     * 
     * @param array $originalData 原始數據
     * @param array $syncedData 同步後數據
     * @param array $requiredFields 必需欄位
     * @return array 驗證結果
     */
    protected function validateSyncIntegrity(
        array $originalData,
        array $syncedData,
        array $requiredFields = []
    ): array {
        $missingFields = [];
        $invalidFields = [];
        
        // 檢查必需欄位
        foreach ($requiredFields as $field) {
            if (!isset($syncedData[$field]) || $syncedData[$field] === null) {
                $missingFields[] = $field;
            }
        }
        
        // 檢查數據類型一致性
        foreach ($originalData as $key => $value) {
            if (isset($syncedData[$key])) {
                $originalType = gettype($value);
                $syncedType = gettype($syncedData[$key]);
                
                if ($originalType !== $syncedType && $value !== null && $syncedData[$key] !== null) {
                    $invalidFields[] = [
                        'field' => $key,
                        'expected_type' => $originalType,
                        'actual_type' => $syncedType
                    ];
                }
            }
        }
        
        return [
            'valid' => empty($missingFields) && empty($invalidFields),
            'missing_fields' => $missingFields,
            'invalid_fields' => $invalidFields
        ];
    }
}