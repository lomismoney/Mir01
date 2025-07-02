import type { paths } from './api';

/**
 * 商品相關類型定義助手檔案
 * 
 * 此檔案從 OpenAPI 生成的 api.ts 中提取和重新導出商品相關的類型，
 * 並建立額外的輔助類型，以確保整個應用程式的類型安全。
 * 
 * 設計原則：
 * 1. 所有基礎類型來自 api.ts（Single Source of Truth）
 * 2. 提供語義明確的類型別名
 * 3. 建立聯合類型以處理複雜的業務邏輯
 * 4. 支援前端表單和後端 API 之間的類型轉換
 */

// === 基礎商品類型 ===
type ProductsGetResponse = paths['/api/products']['get']['responses'][200]['content']['application/json'];
type ProductGetResponse = paths['/api/products/{product}']['get']['responses'][200]['content']['application/json'];
type ProductCreateRequest = paths['/api/products/{product}']['put']['requestBody']['content']['application/json'];

/**
 * 商品基礎資料類型
 * 從 API 響應中提取的標準商品資料結構
 */
export type Product = NonNullable<ProductGetResponse['data']>;

/**
 * 商品列表項目類型
 * 用於商品列表顯示的簡化商品資料
 */
export type ProductListItem = NonNullable<ProductsGetResponse['data']>[number];

/**
 * 商品建立/更新請求類型
 * 用於提交商品資料到後端 API
 */
export type ProductRequest = ProductCreateRequest;

// === 屬性和屬性值類型 ===

/**
 * 商品屬性類型
 * 例如：顏色、尺寸、材質等
 */
export interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

/**
 * 屬性值類型
 * 例如：紅色、藍色、S、M、L 等
 */
export interface AttributeValue {
  id: number;
  value: string;
  attribute_id: number;
}

// === 前端表單相關類型 ===

/**
 * 前端商品表單資料類型
 * 用於 react-hook-form 和表單狀態管理
 */
export interface ProductFormData {
  /** 商品名稱 */
  name: string;
  /** 商品描述 */
  description?: string;
  /** 商品分類 ID */
  category_id?: number | null;
  /** 是否為多規格商品 */
  is_variable?: boolean;
  /** 商品屬性配置（多規格商品使用） */
  attributes?: ProductAttributeConfig[];
  /** 商品變體配置（多規格商品使用） */
  variants?: ProductVariantConfig[];
}

/**
 * 商品屬性配置類型
 * 用於前端多規格商品的屬性設定
 */
export interface ProductAttributeConfig {
  /** 屬性 ID */
  attribute_id: number;
  /** 屬性名稱（用於顯示） */
  attribute_name: string;
  /** 選中的屬性值 ID 陣列 */
  attribute_value_ids: number[];
}

/**
 * 商品變體配置類型
 * 用於前端多規格商品的 SKU 配置
 */
export interface ProductVariantConfig {
  /** 變體的唯一標識符（由屬性值 ID 組成） */
  key: string;
  /** 屬性選項組合 */
  options: {
    attribute_id: number;
    attribute_name: string;
    value: string;
    value_id: number;
  }[];
  /** SKU 編號 */
  sku: string;
  /** 價格 */
  price: number;
  /** 成本價 */
  cost_price?: number;
  /** 庫存數量 */
  stock_quantity?: number;
}

// === API 提交資料類型 ===

/**
 * 向後端 API 提交的商品資料類型
 * 
 * 這個類型解決了 ProductForm 中的 any 類型問題，
 * 明確定義了提交給後端的資料結構
 */
export interface ProductSubmissionData {
  /** 商品基本資訊 */
  name: string;
  description?: string | null;
  category_id?: number | null;
  
  /** 多規格商品專用欄位 */
  /** 選中的屬性 ID 陣列 - 用於標識商品使用哪些屬性 */
  attributes: number[];
  
  /** 變體配置陣列 - 實際的 SKU 變體資料 */
  variants: {
    sku: string;
    price: number;
    cost_price?: number;
    stock_quantity?: number;
    attribute_value_ids: number[];
  }[];
}

// === 類型守衛和工具函式類型 ===

/**
 * 檢查是否為有效的商品資料
 */
export function isValidProduct(data: unknown): data is Product {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as Product).id === 'number' &&
    typeof (data as Product).name === 'string'
  );
}

/**
 * 檢查是否為有效的屬性資料
 */
export function isValidAttribute(data: unknown): data is Attribute {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'values' in data &&
    typeof (data as Attribute).id === 'number' &&
    typeof (data as Attribute).name === 'string' &&
    Array.isArray((data as Attribute).values)
  );
}

// === 類型轉換輔助函式類型 ===

/**
 * 表單資料轉換為 API 提交資料的轉換器類型
 */
export type FormDataToSubmissionDataConverter = (
  formData: ProductFormData,
  attributesMap: Map<number, Attribute>
) => ProductSubmissionData;

/**
 * API 響應資料轉換為表單資料的轉換器類型
 */
export type ApiDataToFormDataConverter = (
  apiData: Product
) => ProductFormData; 