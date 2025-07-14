/**
 * Dashboard 頁面相關的類型定義
 */

/**
 * 商品變體類型定義（適用於 Dashboard 頁面）
 */
export interface DashboardProductVariant {
  id: number;
  sku: string;
  price: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  attribute_values?: Array<{
    id: number;
    value: string;
    attribute_id: number;
    attribute?: {
      id: number;
      name: string;
    } | null;
  }>;
  inventory?: Array<{
    id: number;
    quantity: number;
    low_stock_threshold?: number;
    store_id?: number;
    store?: {
      id: number;
      name: string;
    } | null;
  }>;
}