/**
 * 查詢金鑰定義
 * 
 * 統一管理所有 React Query 的查詢金鑰，
 * 確保快取鍵值的一致性和可維護性
 */
export const QUERY_KEYS = {
    PRODUCTS: ['products'] as const,
    PRODUCT: (id: number) => ['products', id] as const,
    PRODUCT_VARIANTS: ['product-variants'] as const,
    PRODUCT_VARIANT: (id: number) => ['product-variants', id] as const,
    USERS: ['users'] as const,
    USER: (id: number) => ['users', id] as const,
    CUSTOMERS: ['customers'] as const,
    CUSTOMER: (id: number) => ['customers', id] as const,
    CATEGORIES: ['categories'] as const,
    CATEGORY: (id: number) => ['categories', id] as const,
    ATTRIBUTES: ['attributes'] as const,
    ORDERS: ['orders'] as const,
    ORDER: (id: number) => ['orders', id] as const,
} as const;

/**
 * 安裝管理相關的查詢金鑰定義
 */
export const INSTALLATION_QUERY_KEYS = {
    INSTALLATIONS: ['installations'] as const,
    INSTALLATION: (id: number) => ['installations', id] as const,
    SCHEDULE: ['installations', 'schedule'] as const,
} as const; 