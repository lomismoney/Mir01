import type { paths } from './api';

// 產品類型定義（與 API 契約轉換層完全匹配）
export interface Product {
  id: number;
  name: string;
  sku: string;
  description?: string | null;  // ✅ 匹配後端 API 的 null 值序列化
  selling_price: number;
  cost_price: number;
  category_id?: number | null;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
}

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