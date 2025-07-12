import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { 
  QUERY_KEYS,
  PRODUCT_KEYS,
  ORDER_KEYS,
  CUSTOMER_KEYS,
  INVENTORY_KEYS,
  INSTALLATION_KEYS,
  CATEGORY_KEYS,
  STORE_KEYS,
  USER_KEYS,
  ATTRIBUTE_KEYS,
  PURCHASE_KEYS,
  BACKORDER_KEYS,
} from './queries/shared/queryKeys';

/**
 * 緩存失效配置選項
 */
interface InvalidationConfig {
  refetchType?: 'active' | 'inactive' | 'all';
  exact?: boolean;
  cancelRefetch?: boolean;
}

/**
 * 批量失效配置
 */
interface BatchInvalidationConfig {
  delay?: number; // 延遲失效（毫秒）
  deduplicate?: boolean; // 去重複失效
}

/**
 * 統一的緩存失效管理 Hook
 * 
 * 提供一致的緩存失效策略，包括：
 * - 單一查詢失效
 * - 相關查詢批量失效
 * - 條件式失效
 * - 智能失效策略
 * 
 * @returns 緩存失效管理器
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  /**
   * 基礎失效函式
   */
  const invalidateQuery = useCallback(
    async (
      queryKey: any[],
      config: InvalidationConfig = {}
    ) => {
      const {
        refetchType = 'active',
        exact = false,
        cancelRefetch = true,
      } = config;

      return await queryClient.invalidateQueries({
        queryKey,
        exact,
        refetchType,
      });
    },
    [queryClient]
  );

  /**
   * 批量失效函式
   */
  const invalidateQueries = useCallback(
    async (
      queryKeys: any[][],
      config: InvalidationConfig & BatchInvalidationConfig = {}
    ) => {
      const {
        refetchType = 'active',
        exact = false,
        delay = 0,
        deduplicate = true,
      } = config;

      // 去重複
      const uniqueKeys = deduplicate
        ? Array.from(new Set(queryKeys.map(key => JSON.stringify(key))))
            .map(key => JSON.parse(key))
        : queryKeys;

      if (delay > 0) {
        setTimeout(async () => {
          await Promise.all(
            uniqueKeys.map(queryKey =>
              queryClient.invalidateQueries({
                queryKey,
                exact,
                refetchType,
              })
            )
          );
        }, delay);
      } else {
        await Promise.all(
          uniqueKeys.map(queryKey =>
            queryClient.invalidateQueries({
              queryKey,
              exact,
              refetchType,
            })
          )
        );
      }
    },
    [queryClient]
  );

  /**
   * 商品相關失效
   */
  const invalidateProducts = useCallback(
    async (productId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        PRODUCT_KEYS.ALL,
        PRODUCT_KEYS.LIST(),
      ];

      if (productId) {
        keysToInvalidate.push(
          PRODUCT_KEYS.DETAIL(productId) as any,
          PRODUCT_KEYS.VARIANTS(productId) as any,
          PRODUCT_KEYS.INVENTORY(productId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 訂單相關失效
   */
  const invalidateOrders = useCallback(
    async (orderId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        ORDER_KEYS.ALL,
        ORDER_KEYS.LIST(),
        ORDER_KEYS.STATS(),
      ];

      if (orderId) {
        keysToInvalidate.push(
          ORDER_KEYS.DETAIL(orderId) as any,
          ORDER_KEYS.ITEMS(orderId) as any,
          ORDER_KEYS.STATUS_HISTORY(orderId) as any,
          ORDER_KEYS.PAYMENTS(orderId) as any,
          ORDER_KEYS.SHIPMENTS(orderId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 客戶相關失效
   */
  const invalidateCustomers = useCallback(
    async (customerId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        CUSTOMER_KEYS.ALL,
        CUSTOMER_KEYS.LIST(),
      ];

      if (customerId) {
        keysToInvalidate.push(
          CUSTOMER_KEYS.DETAIL(customerId) as any,
          CUSTOMER_KEYS.ADDRESSES(customerId) as any,
          CUSTOMER_KEYS.ORDERS(customerId) as any,
          CUSTOMER_KEYS.STATS(customerId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 庫存相關失效
   */
  const invalidateInventory = useCallback(
    async (inventoryId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        INVENTORY_KEYS.ALL,
        INVENTORY_KEYS.LIST(),
        INVENTORY_KEYS.STATS(),
        INVENTORY_KEYS.ALERTS(),
        INVENTORY_KEYS.LOW_STOCK(),
      ];

      if (inventoryId) {
        keysToInvalidate.push(
          INVENTORY_KEYS.DETAIL(inventoryId) as any,
          INVENTORY_KEYS.HISTORY() as any,
          INVENTORY_KEYS.TRANSACTIONS() as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 安裝相關失效
   */
  const invalidateInstallations = useCallback(
    async (installationId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        INSTALLATION_KEYS.ALL,
        INSTALLATION_KEYS.LIST(),
        INSTALLATION_KEYS.SCHEDULE(),
      ];

      if (installationId) {
        keysToInvalidate.push(
          INSTALLATION_KEYS.DETAIL(installationId) as any,
          INSTALLATION_KEYS.ITEMS(installationId) as any,
          INSTALLATION_KEYS.PROGRESS(installationId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 採購相關失效
   */
  const invalidatePurchases = useCallback(
    async (purchaseId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        PURCHASE_KEYS.ALL,
        PURCHASE_KEYS.LIST(),
        PURCHASE_KEYS.STATS(),
      ];

      if (purchaseId) {
        keysToInvalidate.push(
          PURCHASE_KEYS.DETAIL(purchaseId) as any,
          PURCHASE_KEYS.ITEMS(purchaseId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 類別相關失效
   */
  const invalidateCategories = useCallback(
    async (categoryId?: number, config?: InvalidationConfig) => {
      const keysToInvalidate: any[] = [
        CATEGORY_KEYS.ALL,
        CATEGORY_KEYS.LIST,
        CATEGORY_KEYS.TREE,
      ];

      if (categoryId) {
        keysToInvalidate.push(
          CATEGORY_KEYS.DETAIL(categoryId) as any,
          CATEGORY_KEYS.CHILDREN(categoryId) as any,
          CATEGORY_KEYS.PRODUCTS(categoryId) as any
        );
      }

      await invalidateQueries(keysToInvalidate as any, config);
    },
    [invalidateQueries]
  );

  /**
   * 智能失效：根據操作類型自動失效相關查詢
   */
  const smartInvalidate = useCallback(
    async (
      operation: 'create' | 'update' | 'delete',
      entity: 'product' | 'order' | 'customer' | 'inventory' | 'installation' | 'purchase',
      entityId?: number,
      config?: InvalidationConfig
    ) => {
      const invalidationMap = {
        product: invalidateProducts,
        order: invalidateOrders,
        customer: invalidateCustomers,
        inventory: invalidateInventory,
        installation: invalidateInstallations,
        purchase: invalidatePurchases,
      };

      const invalidateFunction = invalidationMap[entity];
      
      if (invalidateFunction) {
        await invalidateFunction(entityId, config);

        // 根據操作類型進行額外的失效
        if (operation === 'create' || operation === 'delete') {
          // 創建或刪除操作可能影響統計數據
          await invalidateQuery(['stats'], config);
        }

        // 特定實體的關聯失效
        if (entity === 'order') {
          // 訂單變更可能影響庫存和客戶數據
          await invalidateInventory(undefined, config);
          
          if (entityId) {
            // 可能需要失效相關客戶資料
            await invalidateQuery(CUSTOMER_KEYS.ALL as any, config);
          }
        }

        if (entity === 'inventory') {
          // 庫存變更可能影響商品和訂單數據
          await invalidateProducts(undefined, config);
        }
      }
    },
    [
      invalidateProducts,
      invalidateOrders,
      invalidateCustomers,
      invalidateInventory,
      invalidateInstallations,
      invalidatePurchases,
      invalidateQuery,
    ]
  );

  /**
   * 全局重新整理
   */
  const refreshAll = useCallback(
    async (config?: InvalidationConfig) => {
      await queryClient.invalidateQueries({
        refetchType: config?.refetchType || 'active',
      });
    },
    [queryClient]
  );

  /**
   * 清除所有緩存
   */
  const clearAll = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  /**
   * 預取失效後的查詢
   */
  const invalidateAndPrefetch = useCallback(
    async (
      queryKey: any[],
      queryFn: () => Promise<any>,
      config?: InvalidationConfig
    ) => {
      await invalidateQuery(queryKey, config);
      
      // 預取新數據
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5分鐘
      });
    },
    [invalidateQuery, queryClient]
  );

  return {
    // 基礎失效
    invalidateQuery,
    invalidateQueries,

    // 實體特定失效
    invalidateProducts,
    invalidateOrders,
    invalidateCustomers,
    invalidateInventory,
    invalidateInstallations,
    invalidatePurchases,
    invalidateCategories,

    // 智能失效
    smartInvalidate,

    // 全局操作
    refreshAll,
    clearAll,

    // 進階功能
    invalidateAndPrefetch,
  };
}

/**
 * 條件式失效 Hook
 * 
 * 根據條件決定是否執行失效操作
 */
export function useConditionalInvalidation() {
  const { smartInvalidate, invalidateQuery } = useQueryInvalidation();

  /**
   * 僅在條件滿足時失效
   */
  const invalidateIf = useCallback(
    async (
      condition: boolean | (() => boolean),
      queryKey: any[],
      config?: InvalidationConfig
    ) => {
      const shouldInvalidate = typeof condition === 'function' ? condition() : condition;
      
      if (shouldInvalidate) {
        await invalidateQuery(queryKey, config);
      }
    },
    [invalidateQuery]
  );

  /**
   * 延遲失效
   */
  const invalidateAfter = useCallback(
    async (
      delay: number,
      queryKey: any[],
      config?: InvalidationConfig
    ) => {
      setTimeout(async () => {
        await invalidateQuery(queryKey, config);
      }, delay);
    },
    [invalidateQuery]
  );

  /**
   * 批次操作的智能失效
   */
  const invalidateForBatch = useCallback(
    async (
      operations: Array<{
        operation: 'create' | 'update' | 'delete';
        entity: string;
        entityId?: number;
      }>,
      config?: InvalidationConfig
    ) => {
      // 收集所有需要失效的實體類型
      const entitiesToInvalidate = new Set(operations.map(op => op.entity));
      
      // 批量失效，避免重複
      for (const entity of entitiesToInvalidate) {
        await smartInvalidate(
          'update', // 使用通用的更新操作
          entity as any,
          undefined, // 不指定特定ID，失效整個類型
          config // 移除不支持的 delay 屬性
        );
      }
    },
    [smartInvalidate]
  );

  return {
    invalidateIf,
    invalidateAfter,
    invalidateForBatch,
  };
}

/**
 * 失效策略工廠
 * 
 * 提供預定義的失效策略
 */
export const InvalidationStrategies = {
  /**
   * 立即失效策略
   */
  immediate: {
    refetchType: 'active' as const,
    exact: false,
    cancelRefetch: true,
  },

  /**
   * 延遲失效策略（適用於批量操作）
   */
  delayed: {
    refetchType: 'active' as const,
    exact: false,
    cancelRefetch: true,
    delay: 100,
  },

  /**
   * 精確失效策略（僅失效指定查詢）
   */
  exact: {
    refetchType: 'active' as const,
    exact: true,
    cancelRefetch: true,
  },

  /**
   * 溫和失效策略（不取消正在進行的請求）
   */
  gentle: {
    refetchType: 'inactive' as const,
    exact: false,
    cancelRefetch: false,
  },

  /**
   * 全面失效策略（包括非活躍查詢）
   */
  comprehensive: {
    refetchType: 'all' as const,
    exact: false,
    cancelRefetch: true,
  },
};