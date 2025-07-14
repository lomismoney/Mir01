// 庫存相關的類型定義

import { ProductBasic } from './product';
import { Store } from '@/types/store';
import { User } from './user';

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: string;  // API 回傳字符串格式的價格
  product?: ProductBasic;
  attributeValues?: AttributeValue[];
}

export interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  attribute?: {
    id: number;
    name: string;
  };
}

export interface Inventory {
  id: number;
  product_variant_id: number;
  store_id: number;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
  productVariant?: ProductVariant;
  store?: Store;
  transactions?: InventoryTransaction[];
}

export interface InventoryTransaction {
  id: number;
  inventory_id: number;
  user_id: number;
  type: 'addition' | 'reduction' | 'adjustment' | 'transfer_in' | 'transfer_out';
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;  // 使用 unknown 替代 any
  created_at: string;
  updated_at: string;
  user?: User;
  inventory?: Inventory;
}

export interface InventoryTransfer {
  id: number;
  from_store_id: number;
  to_store_id: number;
  user_id: number;
  product_variant_id: number;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  fromStore?: Store;
  toStore?: Store;
  user?: User;
  productVariant?: ProductVariant;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * 低庫存預警項目
 */
export interface LowStockItem {
  id: number;
  product_variant_id: number;
  store_id: number;
  store_name: string;
  product_name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  shortage: number;
  severity: 'critical' | 'low' | 'normal';
  last_sale_date: string | null;
  average_daily_sales: number;
  estimated_days_until_stockout: number | null;
}

/**
 * 低庫存預警響應類型
 */
export interface LowStockResponse {
  data: LowStockItem[];
  meta: PaginatedResponse<LowStockItem>['links'] extends infer L ? 
    Omit<PaginatedResponse<LowStockItem>, 'data' | 'links'> & { links?: L } : never;
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

/**
 * 庫存預警統計摘要
 */
export interface InventoryAlertSummary {
  total_products: number;
  critical_stock_count: number;
  low_stock_count: number;
  alerts: {
    critical_percentage: number;
    low_percentage: number;
    health_score: number;
  };
} 