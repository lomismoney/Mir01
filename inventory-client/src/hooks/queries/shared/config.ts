/**
 * 標準查詢配置
 * 統一的 React Query 配置選項
 */

import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

/**
 * 緩存時間配置
 * 根據數據更新頻率設置不同的緩存策略
 */
export const CACHE_TIMES = {
  // 短期緩存 - 適合實時性要求高的數據（如庫存、訂單狀態）
  SHORT: 30 * 1000,        // 30秒
  
  // 中期緩存 - 適合中等更新頻率的數據（如訂單、客戶信息）
  MEDIUM: 2 * 60 * 1000,   // 2分鐘
  
  // 長期緩存 - 適合較少變更的數據（如產品、類別）
  LONG: 5 * 60 * 1000,     // 5分鐘
  
  // 超長期緩存 - 適合很少變更的數據（如門市、用戶權限）
  EXTRA_LONG: 15 * 60 * 1000, // 15分鐘
} as const;

/**
 * 垃圾回收時間配置
 */
export const GC_TIMES = {
  SHORT: 5 * 60 * 1000,    // 5分鐘
  MEDIUM: 15 * 60 * 1000,  // 15分鐘
  LONG: 30 * 60 * 1000,    // 30分鐘
  EXTRA_LONG: 60 * 60 * 1000, // 1小時
} as const;

/**
 * 基礎查詢配置
 */
export const BASE_QUERY_OPTIONS = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;

/**
 * 標準查詢配置選項
 */
export const QUERY_CONFIG = {
  /**
   * 實時數據配置 - 庫存、訂單狀態等
   */
  REALTIME: {
    ...BASE_QUERY_OPTIONS,
    staleTime: CACHE_TIMES.SHORT,
    gcTime: GC_TIMES.SHORT,
    refetchInterval: 60 * 1000, // 每分鐘自動刷新
  },

  /**
   * 動態數據配置 - 訂單、客戶等
   */
  DYNAMIC: {
    ...BASE_QUERY_OPTIONS,
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: GC_TIMES.MEDIUM,
  },

  /**
   * 穩定數據配置 - 產品、類別等
   */
  STABLE: {
    ...BASE_QUERY_OPTIONS,
    staleTime: CACHE_TIMES.LONG,
    gcTime: GC_TIMES.LONG,
  },

  /**
   * 靜態數據配置 - 門市、用戶等
   */
  STATIC: {
    ...BASE_QUERY_OPTIONS,
    staleTime: CACHE_TIMES.EXTRA_LONG,
    gcTime: GC_TIMES.EXTRA_LONG,
  },
} as const;

/**
 * 分頁查詢專用配置
 */
export const PAGINATED_QUERY_CONFIG = {
  /**
   * 動態分頁數據 - 訂單列表、客戶列表等
   */
  DYNAMIC: {
    ...QUERY_CONFIG.DYNAMIC,
    placeholderData: (previousData: any) => previousData,
  },

  /**
   * 穩定分頁數據 - 產品列表、類別列表等
   */
  STABLE: {
    ...QUERY_CONFIG.STABLE,
    placeholderData: (previousData: any) => previousData,
  },

  /**
   * 實時分頁數據 - 庫存列表等
   */
  REALTIME: {
    ...QUERY_CONFIG.REALTIME,
    placeholderData: (previousData: any) => previousData,
  },

  /**
   * 靜態分頁數據 - 門市列表、用戶列表等
   */
  STATIC: {
    ...QUERY_CONFIG.STATIC,
    placeholderData: (previousData: any) => previousData,
  },
} as const;

/**
 * Mutation 配置
 */
export const MUTATION_CONFIG = {
  /**
   * 標準 mutation 配置
   */
  STANDARD: {
    retry: 1,
    retryDelay: 1000,
  },

  /**
   * 重要操作 mutation 配置 - 訂單創建、付款等
   */
  CRITICAL: {
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },

  /**
   * 批量操作 mutation 配置
   */
  BATCH: {
    retry: 1,
    retryDelay: 2000,
  },
} as const;

/**
 * 根據數據類型創建查詢配置
 */
export const createQueryConfig = <T = unknown, E = Error>(
  type: 'REALTIME' | 'DYNAMIC' | 'STABLE' | 'STATIC',
  isPaginated: boolean = false,
  overrides: Partial<UseQueryOptions<T, E>> = {}
): UseQueryOptions<T, E> => {
  const baseConfig = isPaginated 
    ? PAGINATED_QUERY_CONFIG[type] 
    : QUERY_CONFIG[type];

  return {
    ...baseConfig,
    ...overrides,
  } as UseQueryOptions<T, E>;
};

/**
 * 根據操作類型創建 mutation 配置
 */
export const createMutationConfig = <T = unknown, E = Error, V = void>(
  type: 'STANDARD' | 'CRITICAL' | 'BATCH' = 'STANDARD',
  overrides: Partial<UseMutationOptions<T, E, V>> = {}
): UseMutationOptions<T, E, V> => {
  return {
    ...MUTATION_CONFIG[type],
    ...overrides,
  } as UseMutationOptions<T, E, V>;
};

/**
 * 特定業務場景的配置
 */
export const BUSINESS_QUERY_CONFIG = {
  /**
   * 產品相關查詢配置
   */
  PRODUCTS: {
    LIST: createQueryConfig('STABLE', true),
    DETAIL: createQueryConfig('STABLE'),
    VARIANTS: createQueryConfig('STABLE'),
    SEARCH: createQueryConfig('DYNAMIC', true, { staleTime: CACHE_TIMES.SHORT }),
  },

  /**
   * 訂單相關查詢配置
   */
  ORDERS: {
    LIST: createQueryConfig('DYNAMIC', true),
    DETAIL: createQueryConfig('DYNAMIC'),
    STATUS_HISTORY: createQueryConfig('DYNAMIC'),
    REAL_TIME_STATUS: createQueryConfig('REALTIME'),
  },

  /**
   * 客戶相關查詢配置
   */
  CUSTOMERS: {
    LIST: createQueryConfig('DYNAMIC', true),
    DETAIL: createQueryConfig('DYNAMIC'),
    ADDRESSES: createQueryConfig('STABLE'),
  },

  /**
   * 庫存相關查詢配置
   */
  INVENTORY: {
    LIST: createQueryConfig('REALTIME', true),
    DETAIL: createQueryConfig('REALTIME'),
    HISTORY: createQueryConfig('DYNAMIC', true),
    ALERTS: createQueryConfig('REALTIME'),
    TRANSFERS: createQueryConfig('DYNAMIC', true),
  },

  /**
   * 安裝相關查詢配置
   */
  INSTALLATIONS: {
    LIST: createQueryConfig('DYNAMIC', true),
    DETAIL: createQueryConfig('DYNAMIC'),
    SCHEDULE: createQueryConfig('REALTIME'),
  },

  /**
   * 類別相關查詢配置
   */
  CATEGORIES: {
    LIST: createQueryConfig('STABLE'),
    TREE: createQueryConfig('STABLE'),
    DETAIL: createQueryConfig('STABLE'),
  },

  /**
   * 門市相關查詢配置
   */
  STORES: {
    LIST: createQueryConfig('STATIC'),
    DETAIL: createQueryConfig('STATIC'),
  },

  /**
   * 用戶相關查詢配置
   */
  USERS: {
    LIST: createQueryConfig('STATIC', true),
    DETAIL: createQueryConfig('STATIC'),
    PERMISSIONS: createQueryConfig('STATIC'),
  },

  /**
   * 屬性相關查詢配置
   */
  ATTRIBUTES: {
    LIST: createQueryConfig('STABLE'),
    VALUES: createQueryConfig('STABLE'),
  },
} as const;

/**
 * 特定業務場景的 mutation 配置
 */
export const BUSINESS_MUTATION_CONFIG = {
  /**
   * 產品相關操作
   */
  PRODUCTS: {
    CREATE: createMutationConfig('STANDARD'),
    UPDATE: createMutationConfig('STANDARD'),
    DELETE: createMutationConfig('CRITICAL'),
    BULK_UPDATE: createMutationConfig('BATCH'),
  },

  /**
   * 訂單相關操作
   */
  ORDERS: {
    CREATE: createMutationConfig('CRITICAL'),
    UPDATE: createMutationConfig('STANDARD'),
    UPDATE_STATUS: createMutationConfig('CRITICAL'),
    CANCEL: createMutationConfig('CRITICAL'),
    PAYMENT: createMutationConfig('CRITICAL'),
  },

  /**
   * 庫存相關操作
   */
  INVENTORY: {
    ADJUST: createMutationConfig('CRITICAL'),
    TRANSFER: createMutationConfig('CRITICAL'),
    INCOMING: createMutationConfig('STANDARD'),
  },

  /**
   * 客戶相關操作
   */
  CUSTOMERS: {
    CREATE: createMutationConfig('STANDARD'),
    UPDATE: createMutationConfig('STANDARD'),
    DELETE: createMutationConfig('CRITICAL'),
  },
} as const;

/**
 * 開發環境特殊配置
 */
export const DEV_QUERY_CONFIG = process.env.NODE_ENV === 'development' ? {
  // 開發環境下啟用更詳細的日誌
  onError: (error: Error) => {
    console.error('Query Error:', error);
  },
  onSuccess: (data: any) => {
    console.log('Query Success:', data);
  },
} : {};

/**
 * 生產環境特殊配置
 */
export const PROD_QUERY_CONFIG = process.env.NODE_ENV === 'production' ? {
  // 生產環境下的錯誤追蹤
  onError: (error: Error) => {
    // 可以集成到錯誤追蹤服務（如 Sentry）
    // trackError(error);
  },
} : {};