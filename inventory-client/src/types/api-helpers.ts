import { Category } from '@/types/category';

/**
 * 將 API 回傳的分組分類資料轉換為正確的類型
 * 
 * @param groupedCategories - 從 API 獲取的分組分類資料
 * @returns 轉換後的分組分類資料，具有正確的 Category 類型
 * 
 * 功能說明：
 * 1. 將 API 回傳的 Record<string, unknown[]> 轉換為 Record<string, Category[]>
 * 2. 確保類型安全，避免運行時錯誤
 * 3. 處理可能的 null 或 undefined 值
 */
export function transformCategoriesGroupedResponse(
  groupedCategories: Record<string, unknown[]> | undefined
): Record<string, Category[]> {
  if (!groupedCategories) {
    return {};
  }

  const transformed: Record<string, Category[]> = {};
  
  for (const [key, categories] of Object.entries(groupedCategories)) {
    if (Array.isArray(categories)) {
      transformed[key] = categories.map(category => {
        // 確保每個分類物件都有必要的屬性
        if (typeof category === 'object' && category !== null) {
          const cat = category as Record<string, unknown>;
          return {
            id: cat.id,
            name: cat.name || '',
            description: cat.description || null,
            parent_id: cat.parent_id || null,
            created_at: cat.created_at || '',
            updated_at: cat.updated_at || '',
            children: cat.children || []
          } as Category;
        }
        // 如果資料格式不正確，回傳一個預設的分類物件
        return {
          id: 0,
          name: 'Unknown Category',
          description: null,
          parent_id: null,
          created_at: '',
          updated_at: '',
          children: []
        } as Category;
      });
    } else {
      transformed[key] = [];
    }
  }
  
  return transformed;
}

/**
 * 庫存管理相關型別別名
 * 從 API 類型中提取常用的庫存相關型別
 */

// 庫存列表項目型別
export type InventoryItem = NonNullable<
  import('@/types/api').paths['/api/inventory']['get']['responses'][200]['content']['application/json']['data']
>[number];

// 庫存轉移項目型別
export type InventoryTransferItem = NonNullable<
  import('@/types/api').paths['/api/inventory/transfers']['get']['responses'][200]['content']['application/json']['data']
>[number];

// 門市項目型別
export type StoreItem = NonNullable<
  import('@/types/api').operations['getApiStores']['responses'][200]['content']['application/json']['data']
>[number];

// 商品變體項目型別
export type ProductVariantItem = NonNullable<
  import('@/types/api').paths['/api/products/variants']['get']['responses'][200]['content']['application/json']['data']
>[number];

// 用戶項目型別（擴展版本，包含 stores 欄位）
export type UserItem = NonNullable<
  import('@/types/api').paths['/api/users']['get']['responses'][200]['content']['application/json']['data']
>[number] & {
  stores?: StoreItem[];
};

/**
 * 商品變體 (SKU) 類型定義
 * 
 * 代表單一商品變體的完整資訊，包含價格、屬性值、庫存等
 */
export type ProductVariant = {
  id?: number;
  sku?: string;
  price?: number;
  product_id?: number;
  created_at?: string;
  updated_at?: string;
  product?: {
    id?: number;
    name?: string;
    description?: string;
    category_id?: number;
  };
  attribute_values?: {
    id?: number;
    value?: string;
    attribute_id?: number;
    attribute?: {
      id?: number;
      name?: string;
    };
  }[];
  inventory?: {
    id?: number;
    quantity?: number;
    low_stock_threshold?: number;
    store?: {
      id?: number;
      name?: string;
    };
  }[];
};

/**
 * 商品項目型別 (SPU) - 統一的 Product 類型定義
 * 
 * 採用 SPU (Standard Product Unit) 架構，包含其下所有 SKU 變體
 * 這個統一類型確保了前端代碼的類型安全性，並提供價格範圍統計
 */
export type ProductItem = {
  id?: number;
  name?: string;
  description?: string;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariant[];
  price_range?: {
    min?: number;
    max?: number;
    count?: number;
  };
  category?: {
    id?: number;
    name?: string;
    description?: string;
  };
}; 