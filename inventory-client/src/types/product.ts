import type { paths } from './api';

// 從 API 類型中提取產品資料類型
export type Product = NonNullable<
  paths['/api/products']['get']['responses'][200]['content']['application/json']['data']
>[0];

// 商品列表響應類型
export type ProductListResponse = paths['/api/products']['get']['responses'][200]['content']['application/json'];

// 單一商品響應類型
export type ProductResponse = paths['/api/products/{id}']['get']['responses'][200]['content']['application/json'];

// 創建商品的請求類型 (暫時停用 - 等待後端端點實現)
// export type CreateProductRequest = paths['/api/products']['post']['requestBody']['content']['application/json'];

// 更新商品的請求類型
export type UpdateProductRequest = paths['/api/products/{id}']['put']['requestBody']['content']['application/json'];

// 分頁信息類型
export type PaginationMeta = NonNullable<ProductListResponse['meta']>;

// 分頁連結類型
export type PaginationLinks = NonNullable<ProductListResponse['links']>;

// 商品查詢參數類型
export type ProductQueryParams = paths['/api/products']['get']['parameters']['query'];

/**
 * 可選的商品過濾器類型
 */
export interface ProductFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

/**
 * 產品表格行類型（與 API 響應一致）
 */
export interface ProductTableRow {
  id?: number;
  name?: string;
  sku?: string;
  description?: string;
  selling_price?: string;  // API 回傳字串格式
  cost_price?: string;     // API 回傳字串格式
  created_at?: string;
  updated_at?: string;
}

/**
 * 產品表單資料類型（用於建立和編輯，價格為數字）
 */
export interface ProductFormData {
  name: string;
  sku: string;
  description?: string | null;
  selling_price: number;   // 表單中使用數字
  cost_price: number;      // 表單中使用數字
}

/**
 * 產品顯示用類型（確保必要欄位存在）
 */
export interface ProductDisplay {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  selling_price: string;
  cost_price: string;
  created_at: string;
  updated_at: string;
}

/**
 * 產品基本資訊，用於庫存管理系統
 */
export interface ProductBasic {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
}

/**
 * 產品變體，用於庫存管理系統
 */
export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: string;  // API 回傳字符串格式的價格
  created_at: string;
  updated_at: string;
  product?: ProductBasic;
  attributeValues?: {
    id: number;
    attribute_id: number;
    value: string;
    attribute?: {
      id: number;
      name: string;
    };
  }[];
} 