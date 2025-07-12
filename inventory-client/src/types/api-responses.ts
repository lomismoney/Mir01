/**
 * API 響應的統一類型定義
 * 
 * 解決 as any 類型斷言問題，提供類型安全的 API 響應處理
 */

/**
 * 分頁資訊類型
 */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

/**
 * 分頁響應的基礎類型
 */
export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
}

/**
 * 標準 API 響應類型
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

/**
 * 列表響應類型（可能有分頁或無分頁）
 */
export type ListResponse<T> = T[] | PaginatedResponse<T>;

/**
 * 錯誤響應類型
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
  code?: string;
}

/**
 * 訂單相關響應類型
 */
export interface OrdersResponse {
  data: Array<{
    id: number;
    order_number: string;
    customer_id: number;
    store_id: number;
    status: string;
    payment_status: string;
    shipping_status: string;
    total_amount: number;
    created_at: string;
    updated_at: string;
    customer?: {
      id: number;
      name: string;
      email?: string;
    };
    store?: {
      id: number;
      name: string;
    };
    items?: Array<{
      id: number;
      product_variant_id: number;
      quantity: number;
      price: number;
      total: number;
    }>;
  }>;
  meta?: PaginationMeta;
}

/**
 * 客戶相關響應類型
 */
export interface CustomersResponse {
  data: Array<{
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    company?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;
  meta?: PaginationMeta;
}

/**
 * 商品相關響應類型
 */
export interface ProductsResponse {
  data: Array<{
    id: number;
    name: string;
    description?: string;
    category_id?: number;
    sku?: string;
    status: string;
    created_at: string;
    updated_at: string;
    category?: {
      id: number;
      name: string;
    };
    variants?: Array<{
      id: number;
      sku: string;
      name: string;
      price: number;
      cost?: number;
      stock_quantity: number;
      attributes?: Record<string, any>;
    }>;
  }>;
  meta?: PaginationMeta;
}

/**
 * 庫存相關響應類型
 */
export interface InventoryResponse {
  data: Array<{
    id: number;
    product_variant_id: number;
    store_id: number;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    last_updated: string;
    product_variant?: {
      id: number;
      sku: string;
      name: string;
      product?: {
        id: number;
        name: string;
      };
    };
    store?: {
      id: number;
      name: string;
    };
  }>;
  meta?: PaginationMeta;
}

/**
 * 安裝相關響應類型
 */
export interface InstallationsResponse {
  data: Array<{
    id: number;
    installation_number: string;
    customer_id: number;
    status: string;
    scheduled_date?: string;
    completed_date?: string;
    technician_id?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    customer?: {
      id: number;
      name: string;
    };
    technician?: {
      id: number;
      name: string;
    };
    items?: Array<{
      id: number;
      product_variant_id: number;
      quantity: number;
    }>;
  }>;
  meta?: PaginationMeta;
}

/**
 * 採購相關響應類型
 */
export interface PurchasesResponse {
  data: Array<{
    id: number;
    purchase_number: string;
    supplier_id?: number;
    status: string;
    total_amount: number;
    received_date?: string;
    created_at: string;
    updated_at: string;
    supplier?: {
      id: number;
      name: string;
    };
    items?: Array<{
      id: number;
      product_variant_id: number;
      quantity: number;
      cost: number;
      total: number;
    }>;
  }>;
  meta?: PaginationMeta;
}

/**
 * 類型守衛函式：檢查是否為分頁響應
 */
export function isPaginatedResponse<T>(
  response: ListResponse<T>
): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'meta' in response &&
    Array.isArray((response as PaginatedResponse<T>).data)
  );
}

/**
 * 安全的響應數據提取函式
 */
export function extractResponseData<T>(response: ListResponse<T>): T[] {
  if (isPaginatedResponse(response)) {
    return response.data;
  }
  return Array.isArray(response) ? response : [];
}

/**
 * 安全的分頁資訊提取函式
 */
export function extractPaginationMeta<T>(
  response: ListResponse<T>
): PaginationMeta | undefined {
  if (isPaginatedResponse(response)) {
    return response.meta;
  }
  return undefined;
}