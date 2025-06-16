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