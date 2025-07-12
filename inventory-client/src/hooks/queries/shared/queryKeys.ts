/**
 * 統一查詢鍵管理
 * 
 * 集中管理所有 React Query 的查詢鍵，
 * 確保快取鍵值的一致性和可維護性
 */

/**
 * 產品相關查詢鍵
 */
export const PRODUCT_KEYS = {
  // 產品列表和搜索
  ALL: ['products'] as const,
  LIST: (filters?: any) => ['products', 'list', filters] as const,
  SEARCH: (query: string, filters?: any) => ['products', 'search', query, filters] as const,
  
  // 單個產品
  DETAIL: (id: number) => ['products', id] as const,
  
  // 產品變體
  VARIANTS: (productId: number) => ['products', productId, 'variants'] as const,
  VARIANT: (id: number) => ['product-variants', id] as const,
  VARIANT_DETAIL: (id: number) => ['product-variants', id, 'detail'] as const,
  
  // 產品相關功能
  ATTRIBUTES: (productId: number) => ['products', productId, 'attributes'] as const,
  CATEGORIES: (productId: number) => ['products', productId, 'categories'] as const,
  INVENTORY: (productId: number) => ['products', productId, 'inventory'] as const,
} as const;

/**
 * 訂單相關查詢鍵
 */
export const ORDER_KEYS = {
  // 訂單列表
  ALL: ['orders'] as const,
  LIST: (filters?: any) => ['orders', 'list', filters] as const,
  
  // 單個訂單
  DETAIL: (id: number) => ['orders', id] as const,
  ITEMS: (orderId: number) => ['orders', orderId, 'items'] as const,
  
  // 訂單狀態和歷史
  STATUS_HISTORY: (orderId: number) => ['orders', orderId, 'status-history'] as const,
  PAYMENTS: (orderId: number) => ['orders', orderId, 'payments'] as const,
  SHIPMENTS: (orderId: number) => ['orders', orderId, 'shipments'] as const,
  
  // 訂單統計
  STATS: (filters?: any) => ['orders', 'stats', filters] as const,
} as const;

/**
 * 客戶相關查詢鍵
 */
export const CUSTOMER_KEYS = {
  // 客戶列表
  ALL: ['customers'] as const,
  LIST: (filters?: any) => ['customers', 'list', filters] as const,
  SEARCH: (query: string) => ['customers', 'search', query] as const,
  
  // 單個客戶
  DETAIL: (id: number) => ['customers', id] as const,
  ADDRESSES: (customerId: number) => ['customers', customerId, 'addresses'] as const,
  ORDERS: (customerId: number) => ['customers', customerId, 'orders'] as const,
  
  // 客戶統計
  STATS: (customerId: number) => ['customers', customerId, 'stats'] as const,
} as const;

/**
 * 庫存相關查詢鍵
 */
export const INVENTORY_KEYS = {
  // 庫存列表
  ALL: ['inventory'] as const,
  LIST: (filters?: any) => ['inventory', 'list', filters] as const,
  
  // 單個庫存項目
  DETAIL: (id: number) => ['inventory', id] as const,
  
  // 庫存歷史和交易
  HISTORY: (params?: any) => ['inventory', 'history', params] as const,
  TRANSACTIONS: (filters?: any) => ['inventory', 'transactions', filters] as const,
  
  // 庫存轉移
  TRANSFERS: (params?: any) => ['inventory', 'transfers', params] as const,
  TRANSFER: (id: number) => ['inventory', 'transfers', id] as const,
  
  // 庫存警報
  ALERTS: (params?: any) => ['inventory', 'alerts', params] as const,
  LOW_STOCK: (storeId?: number) => ['inventory', 'low-stock', storeId] as const,
  
  // 庫存統計
  STATS: (storeId?: number) => ['inventory', 'stats', storeId] as const,
} as const;

/**
 * 安裝相關查詢鍵
 */
export const INSTALLATION_KEYS = {
  // 安裝列表
  ALL: ['installations'] as const,
  LIST: (filters?: any) => ['installations', 'list', filters] as const,
  
  // 單個安裝
  DETAIL: (id: number) => ['installations', id] as const,
  ITEMS: (installationId: number) => ['installations', installationId, 'items'] as const,
  
  // 安裝排程
  SCHEDULE: (params?: any) => ['installations', 'schedule', params] as const,
  TECHNICIANS: ['installations', 'technicians'] as const,
  
  // 安裝進度
  PROGRESS: (installationId: number) => ['installations', installationId, 'progress'] as const,
} as const;

/**
 * 類別相關查詢鍵
 */
export const CATEGORY_KEYS = {
  // 類別列表
  ALL: ['categories'] as const,
  LIST: ['categories', 'list'] as const,
  TREE: ['categories', 'tree'] as const,
  
  // 單個類別
  DETAIL: (id: number) => ['categories', id] as const,
  CHILDREN: (parentId: number) => ['categories', parentId, 'children'] as const,
  PRODUCTS: (categoryId: number) => ['categories', categoryId, 'products'] as const,
} as const;

/**
 * 門市相關查詢鍵
 */
export const STORE_KEYS = {
  // 門市列表
  ALL: ['stores'] as const,
  LIST: ['stores', 'list'] as const,
  
  // 單個門市
  DETAIL: (id: number) => ['stores', id] as const,
  INVENTORY: (storeId: number) => ['stores', storeId, 'inventory'] as const,
  
  // 門市統計
  STATS: (storeId: number) => ['stores', storeId, 'stats'] as const,
} as const;

/**
 * 用戶相關查詢鍵
 */
export const USER_KEYS = {
  // 用戶列表
  ALL: ['users'] as const,
  LIST: (filters?: any) => ['users', 'list', filters] as const,
  
  // 單個用戶
  DETAIL: (id: number) => ['users', id] as const,
  PERMISSIONS: (userId: number) => ['users', userId, 'permissions'] as const,
  STORES: (userId: number) => ['users', userId, 'stores'] as const,
  
  // 當前用戶
  CURRENT: ['users', 'current'] as const,
} as const;

/**
 * 屬性相關查詢鍵
 */
export const ATTRIBUTE_KEYS = {
  // 屬性列表
  ALL: ['attributes'] as const,
  LIST: ['attributes', 'list'] as const,
  
  // 單個屬性
  DETAIL: (id: number) => ['attributes', id] as const,
  VALUES: (attributeId: number) => ['attributes', attributeId, 'values'] as const,
} as const;

/**
 * 採購相關查詢鍵
 */
export const PURCHASE_KEYS = {
  // 採購列表
  ALL: ['purchases'] as const,
  LIST: (filters?: any) => ['purchases', 'list', filters] as const,
  
  // 單個採購
  DETAIL: (id: number) => ['purchases', id] as const,
  ITEMS: (purchaseId: number) => ['purchases', purchaseId, 'items'] as const,
  
  // 採購統計
  STATS: (filters?: any) => ['purchases', 'stats', filters] as const,
} as const;

/**
 * 待辦事項相關查詢鍵
 */
export const BACKORDER_KEYS = {
  // 待辦事項列表
  ALL: ['backorders'] as const,
  LIST: (filters?: any) => ['backorders', 'list', filters] as const,
  
  // 單個待辦事項
  DETAIL: (id: number) => ['backorders', id] as const,
  
  // 待辦事項統計
  STATS: ['backorders', 'stats'] as const,
} as const;

/**
 * 統一的查詢鍵導出
 * 向後兼容現有代碼
 */
export const QUERY_KEYS = {
  // 產品
  PRODUCTS: PRODUCT_KEYS.ALL,
  PRODUCT: PRODUCT_KEYS.DETAIL,
  PRODUCT_VARIANTS: ['product-variants'] as const,
  PRODUCT_VARIANT: PRODUCT_KEYS.VARIANT,
  
  // 訂單
  ORDERS: ORDER_KEYS.ALL,
  ORDER: ORDER_KEYS.DETAIL,
  
  // 客戶
  CUSTOMERS: CUSTOMER_KEYS.ALL,
  CUSTOMER: CUSTOMER_KEYS.DETAIL,
  
  // 庫存
  INVENTORY: INVENTORY_KEYS.ALL,
  
  // 安裝
  INSTALLATIONS: INSTALLATION_KEYS.ALL,
  INSTALLATION: INSTALLATION_KEYS.DETAIL,
  
  // 類別
  CATEGORIES: CATEGORY_KEYS.ALL,
  CATEGORY: CATEGORY_KEYS.DETAIL,
  
  // 門市
  STORES: STORE_KEYS.ALL,
  STORE: STORE_KEYS.DETAIL,
  
  // 用戶
  USERS: USER_KEYS.ALL,
  USER: USER_KEYS.DETAIL,
  
  // 屬性
  ATTRIBUTES: ATTRIBUTE_KEYS.ALL,
  ATTRIBUTE: ATTRIBUTE_KEYS.DETAIL,
  
  // 採購
  PURCHASES: PURCHASE_KEYS.ALL,
  PURCHASE: PURCHASE_KEYS.DETAIL,
  
  // 待辦事項
  BACKORDERS: BACKORDER_KEYS.ALL,
  BACKORDER: BACKORDER_KEYS.DETAIL,
} as const;

/**
 * 向後兼容的安裝查詢鍵
 */
export const INSTALLATION_QUERY_KEYS = INSTALLATION_KEYS;

/**
 * 統一的查詢鍵對象（用於預加載策略）
 */
export const queryKeys = {
  products: PRODUCT_KEYS,
  orders: ORDER_KEYS,
  customers: CUSTOMER_KEYS,
  inventory: INVENTORY_KEYS,
  installations: INSTALLATION_KEYS,
  categories: CATEGORY_KEYS,
  stores: STORE_KEYS,
  users: USER_KEYS,
  attributes: ATTRIBUTE_KEYS,
  purchases: PURCHASE_KEYS,
  backorders: BACKORDER_KEYS,
} as const; 