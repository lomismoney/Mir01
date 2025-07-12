import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 樂觀更新配置選項
 */
interface OptimisticUpdateConfig {
  showSuccessToast?: boolean;
  successMessage?: string;
  rollbackOnError?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * 樂觀更新操作類型
 */
type OptimisticOperation = 'create' | 'update' | 'delete' | 'custom';

/**
 * 樂觀更新 Hook
 * 
 * 提供即時的使用者界面更新，在後端響應之前就更新 UI
 * 如果操作失敗，則回滾到之前的狀態
 * 
 * @returns 樂觀更新工具函式
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  /**
   * 執行樂觀更新
   * 
   * @param queryKey 查詢鍵
   * @param updater 更新函式
   * @param config 配置選項
   */
  const optimisticUpdate = useCallback(async <T>(
    queryKey: any[],
    updater: (oldData: T) => T,
    config: OptimisticUpdateConfig = {}
  ) => {
    const {
      showSuccessToast = false,
      successMessage = '操作成功',
      rollbackOnError = true,
      onSuccess,
      onError,
    } = config;

    // 取消正在進行的查詢（避免覆蓋樂觀更新）
    await queryClient.cancelQueries({ queryKey });

    // 獲取當前數據快照
    const previousData = queryClient.getQueryData<T>(queryKey);

    try {
      // 執行樂觀更新
      queryClient.setQueryData(queryKey, updater);

      if (showSuccessToast) {
        toast.success(successMessage);
      }

      onSuccess?.();

      return previousData;
    } catch (error) {
      // 如果樂觀更新失敗，回滾數據
      if (rollbackOnError && previousData !== undefined) {
        queryClient.setQueryData(queryKey, previousData);
      }

      onError?.(error);
      console.error('樂觀更新失敗:', error);
      throw error;
    }
  }, [queryClient]);

  /**
   * 回滾到之前的數據狀態
   */
  const rollback = useCallback(<T>(
    queryKey: any[],
    previousData: T
  ) => {
    queryClient.setQueryData(queryKey, previousData);
  }, [queryClient]);

  /**
   * 樂觀創建項目
   */
  const optimisticCreate = useCallback(<T extends { id?: number | string }>(
    queryKey: any[],
    newItem: T,
    config: OptimisticUpdateConfig = {}
  ) => {
    const tempId = `temp_${Date.now()}`;
    const itemWithTempId = { ...newItem, id: newItem.id || tempId };

    return optimisticUpdate<T[]>(
      queryKey,
      (oldData = []) => [...oldData, itemWithTempId],
      {
        successMessage: '新增成功',
        ...config,
      }
    );
  }, [optimisticUpdate]);

  /**
   * 樂觀更新項目
   */
  const optimisticUpdateItem = useCallback(<T extends { id: number | string }>(
    queryKey: any[],
    updatedItem: T,
    config: OptimisticUpdateConfig = {}
  ) => {
    return optimisticUpdate<T[]>(
      queryKey,
      (oldData = []) => oldData.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ),
      {
        successMessage: '更新成功',
        ...config,
      }
    );
  }, [optimisticUpdate]);

  /**
   * 樂觀刪除項目
   */
  const optimisticDelete = useCallback(<T extends { id: number | string }>(
    queryKey: any[],
    itemId: number | string,
    config: OptimisticUpdateConfig = {}
  ) => {
    return optimisticUpdate<T[]>(
      queryKey,
      (oldData = []) => oldData.filter(item => item.id !== itemId),
      {
        successMessage: '刪除成功',
        ...config,
      }
    );
  }, [optimisticUpdate]);

  /**
   * 樂觀批量刪除
   */
  const optimisticBatchDelete = useCallback(<T extends { id: number | string }>(
    queryKey: any[],
    itemIds: (number | string)[],
    config: OptimisticUpdateConfig = {}
  ) => {
    return optimisticUpdate<T[]>(
      queryKey,
      (oldData = []) => oldData.filter(item => !itemIds.includes(item.id)),
      {
        successMessage: `已刪除 ${itemIds.length} 個項目`,
        ...config,
      }
    );
  }, [optimisticUpdate]);

  /**
   * 樂觀批量更新狀態
   */
  const optimisticBatchUpdateStatus = useCallback(<T extends { id: number | string }>(
    queryKey: any[],
    itemIds: (number | string)[],
    statusUpdate: Partial<T>,
    config: OptimisticUpdateConfig = {}
  ) => {
    return optimisticUpdate<T[]>(
      queryKey,
      (oldData = []) => oldData.map(item => 
        itemIds.includes(item.id) ? { ...item, ...statusUpdate } : item
      ),
      {
        successMessage: `已更新 ${itemIds.length} 個項目`,
        ...config,
      }
    );
  }, [optimisticUpdate]);

  return {
    // 基礎方法
    optimisticUpdate,
    rollback,
    
    // 便捷方法
    optimisticCreate,
    optimisticUpdateItem,
    optimisticDelete,
    optimisticBatchDelete,
    optimisticBatchUpdateStatus,
  };
}

/**
 * 專用的列表操作樂觀更新 Hook
 * 
 * 針對常見的列表 CRUD 操作提供專門的樂觀更新支援
 */
export function useOptimisticListOperations<T extends { id: number | string }>(
  queryKey: any[]
) {
  const {
    optimisticCreate,
    optimisticUpdateItem,
    optimisticDelete,
    optimisticBatchDelete,
    optimisticBatchUpdateStatus,
    rollback,
  } = useOptimisticUpdate();

  const createItem = useCallback((
    newItem: Omit<T, 'id'> & { id?: number | string },
    config?: OptimisticUpdateConfig
  ) => {
    return optimisticCreate<T>(queryKey, newItem as T, config);
  }, [queryKey, optimisticCreate]);

  const updateItem = useCallback((
    updatedItem: T,
    config?: OptimisticUpdateConfig
  ) => {
    return optimisticUpdateItem<T>(queryKey, updatedItem, config);
  }, [queryKey, optimisticUpdateItem]);

  const deleteItem = useCallback((
    itemId: number | string,
    config?: OptimisticUpdateConfig
  ) => {
    return optimisticDelete<T>(queryKey, itemId, config);
  }, [queryKey, optimisticDelete]);

  const batchDelete = useCallback((
    itemIds: (number | string)[],
    config?: OptimisticUpdateConfig
  ) => {
    return optimisticBatchDelete<T>(queryKey, itemIds, config);
  }, [queryKey, optimisticBatchDelete]);

  const batchUpdateStatus = useCallback((
    itemIds: (number | string)[],
    statusUpdate: Partial<T>,
    config?: OptimisticUpdateConfig
  ) => {
    return optimisticBatchUpdateStatus<T>(queryKey, itemIds, statusUpdate, config);
  }, [queryKey, optimisticBatchUpdateStatus]);

  return {
    createItem,
    updateItem,
    deleteItem,
    batchDelete,
    batchUpdateStatus,
    rollback: (previousData: T[]) => rollback(queryKey, previousData),
  };
}