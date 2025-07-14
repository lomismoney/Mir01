import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { useQueryInvalidation } from './useQueryInvalidation';
import { useApiErrorHandler } from './useErrorHandler';
import { toast } from 'sonner';

/**
 * CRUD 操作配置
 */
interface CRUDConfig<T> {
  queryKey: any[];
  entityName: string;
  optimistic?: boolean;
  showToasts?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  invalidateRelated?: string[]; // 相關的查詢鍵前綴
}

/**
 * 創建操作配置
 */
interface CreateConfig<T, TInput> extends CRUDConfig<T> {
  mutationFn: (input: TInput) => Promise<T>;
  optimisticData?: (input: TInput) => T;
}

/**
 * 更新操作配置
 */
interface UpdateConfig<T, TInput> extends CRUDConfig<T> {
  mutationFn: (input: { id: number | string; data: TInput }) => Promise<T>;
  optimisticData?: (input: TInput, currentData: T) => T;
}

/**
 * 刪除操作配置
 */
interface DeleteConfig extends Omit<CRUDConfig<void>, 'onSuccess'> {
  mutationFn: (id: number | string) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * 批量操作配置
 */
interface BatchConfig<T, TInput> extends CRUDConfig<T[]> {
  mutationFn: (input: TInput) => Promise<T[]>;
  optimisticData?: (input: TInput) => T[];
}

/**
 * 樂觀 CRUD 操作 Hook
 * 
 * 整合樂觀更新、錯誤處理和緩存失效的完整 CRUD 解決方案
 * 
 * @param config 基礎配置
 * @returns CRUD 操作函式
 */
export function useOptimisticCRUD<T extends { id: number | string }>(
  baseConfig?: Partial<CRUDConfig<T>>
) {
  const queryClient = useQueryClient();
  const { optimisticCreate, optimisticUpdateItem, optimisticDelete, rollback } = useOptimisticUpdate();
  const { smartInvalidate, invalidateQueries } = useQueryInvalidation();
  const { handleError, handleSuccess } = useApiErrorHandler();

  /**
   * 樂觀創建操作
   */
  const createOptimisticCreateMutation = <TInput>(config: CreateConfig<T, TInput>) => {
      const {
        queryKey,
        entityName,
        mutationFn,
        optimisticData,
        optimistic = true,
        showToasts = true,
        onSuccess,
        onError,
        invalidateRelated = [],
      } = { ...baseConfig, ...config };

      return useMutation({
        mutationFn,
        onMutate: async (input: TInput) => {
          if (optimistic && optimisticData) {
            const newItem = optimisticData(input);
            return await optimisticCreate(queryKey, newItem, {
              showSuccessToast: false, // 我們手動管理 toast
            });
          }
          return undefined;
        },
        onSuccess: (data, variables, context) => {
          if (showToasts) {
            handleSuccess(`${entityName}新增成功`);
          }
          
          // 失效相關查詢
          smartInvalidate('create', entityName.toLowerCase() as any, data.id as any);
          
          // 失效額外的相關查詢
          if (invalidateRelated.length > 0) {
            invalidateQueries(
              invalidateRelated.map(prefix => [prefix]),
              { delay: 50 }
            );
          }

          onSuccess?.(data);
        },
        onError: (error, variables, context) => {
          // 回滾樂觀更新
          if (optimistic && context) {
            rollback(queryKey, context);
          }

          if (showToasts) {
            handleError(error);
          }

          onError?.(error);
        },
      });
  };

  /**
   * 樂觀更新操作
   */
  const createOptimisticUpdateMutation = <TInput>(config: UpdateConfig<T, TInput>) => {
      const {
        queryKey,
        entityName,
        mutationFn,
        optimisticData,
        optimistic = true,
        showToasts = true,
        onSuccess,
        onError,
        invalidateRelated = [],
      } = { ...baseConfig, ...config };

      return useMutation({
        mutationFn,
        onMutate: async (input: { id: number | string; data: TInput }) => {
          if (optimistic && optimisticData) {
            // 獲取當前數據
            const currentData = queryClient.getQueryData<T[]>(queryKey);
            const existingItem = currentData?.find(item => item.id === input.id);
            
            if (existingItem) {
              const updatedItem = optimisticData(input.data, existingItem);
              return await optimisticUpdateItem(queryKey, updatedItem, {
                showSuccessToast: false,
              });
            }
          }
          return undefined;
        },
        onSuccess: (data, variables, context) => {
          if (showToasts) {
            handleSuccess(`${entityName}更新成功`);
          }

          // 失效相關查詢
          smartInvalidate('update', entityName.toLowerCase() as any, variables.id as any);
          
          // 失效額外的相關查詢
          if (invalidateRelated.length > 0) {
            invalidateQueries(
              invalidateRelated.map(prefix => [prefix]),
              { delay: 50 }
            );
          }

          onSuccess?.(data);
        },
        onError: (error, variables, context) => {
          // 回滾樂觀更新
          if (optimistic && context) {
            rollback(queryKey, context);
          }

          if (showToasts) {
            handleError(error);
          }

          onError?.(error);
        },
      });
  };

  /**
   * 樂觀刪除操作
   */
  const createOptimisticDeleteMutation = (config: DeleteConfig) => {
      const {
        queryKey,
        entityName,
        mutationFn,
        optimistic = true,
        showToasts = true,
        onSuccess,
        onError,
        invalidateRelated = [],
      } = { ...baseConfig, ...config };

      return useMutation({
        mutationFn,
        onMutate: async (id: number | string) => {
          if (optimistic) {
            return await optimisticDelete(queryKey, id, {
              showSuccessToast: false,
            });
          }
          return undefined;
        },
        onSuccess: (data, variables, context) => {
          if (showToasts) {
            handleSuccess(`${entityName}刪除成功`);
          }

          // 失效相關查詢
          smartInvalidate('delete', entityName.toLowerCase() as any, undefined as any);
          
          // 失效額外的相關查詢
          if (invalidateRelated.length > 0) {
            invalidateQueries(
              invalidateRelated.map(prefix => [prefix]),
              { delay: 50 }
            );
          }

          onSuccess?.(data as any);
        },
        onError: (error, variables, context) => {
          // 回滾樂觀更新
          if (optimistic && context) {
            rollback(queryKey, context);
          }

          if (showToasts) {
            handleError(error);
          }

          onError?.(error);
        },
      });
  };

  /**
   * 批量刪除操作
   */
  const createOptimisticBatchDeleteMutation = (config: BatchConfig<void, { ids: (number | string)[] }>) => {
      const {
        queryKey,
        entityName,
        mutationFn,
        optimistic = true,
        showToasts = true,
        onSuccess,
        onError,
        invalidateRelated = [],
      } = { ...baseConfig, ...config };

      return useMutation({
        mutationFn,
        onMutate: async (input: { ids: (number | string)[] }) => {
          if (optimistic) {
            const currentData = queryClient.getQueryData<T[]>(queryKey) || [];
            const previousData = [...currentData];
            
            // 樂觀移除選中的項目
            const newData = currentData.filter(item => !input.ids.includes(item.id));
            queryClient.setQueryData(queryKey, newData);
            
            return previousData;
          }
          return undefined;
        },
        onSuccess: (data, variables, context) => {
          if (showToasts) {
            handleSuccess(`成功刪除 ${variables.ids.length} 個${entityName}`);
          }

          // 失效相關查詢
          smartInvalidate('delete', entityName.toLowerCase() as any, undefined as any);
          
          // 失效額外的相關查詢
          if (invalidateRelated.length > 0) {
            invalidateQueries(
              invalidateRelated.map(prefix => [prefix]),
              { delay: 50 }
            );
          }

          onSuccess?.(data as any);
        },
        onError: (error, variables, context) => {
          // 回滾樂觀更新
          if (optimistic && context) {
            queryClient.setQueryData(queryKey, context);
          }

          if (showToasts) {
            handleError(error);
          }

          onError?.(error);
        },
      });
  };

  return {
    createOptimisticCreateMutation,
    createOptimisticUpdateMutation,
    createOptimisticDeleteMutation,
    createOptimisticBatchDeleteMutation,
  };
}

/**
 * 預定義的實體 CRUD Hooks
 */

/**
 * 訂單 CRUD 操作
 */
export function useOrderCRUD() {
  return useOptimisticCRUD({
    queryKey: ['orders'],
    entityName: '訂單',
    invalidateRelated: ['customers', 'inventory'],
  });
}

/**
 * 客戶 CRUD 操作
 */
export function useCustomerCRUD() {
  return useOptimisticCRUD({
    queryKey: ['customers'],
    entityName: '客戶',
    invalidateRelated: ['orders'],
  });
}

/**
 * 商品 CRUD 操作
 */
export function useProductCRUD() {
  return useOptimisticCRUD({
    queryKey: ['products'],
    entityName: '商品',
    invalidateRelated: ['inventory', 'categories'],
  });
}

/**
 * 庫存 CRUD 操作
 */
export function useInventoryCRUD() {
  return useOptimisticCRUD({
    queryKey: ['inventory'],
    entityName: '庫存',
    invalidateRelated: ['products', 'orders'],
  });
}

/**
 * 安裝 CRUD 操作
 */
export function useInstallationCRUD() {
  return useOptimisticCRUD({
    queryKey: ['installations'],
    entityName: '安裝',
    invalidateRelated: ['orders', 'customers'],
  });
}

/**
 * 採購 CRUD 操作
 */
export function usePurchaseCRUD() {
  return useOptimisticCRUD({
    queryKey: ['purchases'],
    entityName: '採購',
    invalidateRelated: ['inventory', 'products'],
  });
}

/**
 * 通用 CRUD 工廠函式
 * 
 * 為任何實體快速創建 CRUD 操作
 */
export function createCRUDHooks<T extends { id: number | string }>(
  config: {
    queryKey: any[];
    entityName: string;
    invalidateRelated?: string[];
  }
) {
  return () => useOptimisticCRUD<T>(config);
}