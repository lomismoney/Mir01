import { Category } from '@/types/category';
import { operations } from '@/types/api';

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
 * 注意：price 字段在 API 中是字符串格式
 */
export type ProductVariant = {
  id?: number;
  sku?: string;
  price?: string;  // API 回傳字符串格式的價格
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
  image_urls?: {
    original?: string;
    thumb?: string;
    medium?: string;
    large?: string;
  } | null;
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

// 從 API 類型中提取 Store 相關類型
// 由於 OpenAPI 規範問題，暫時使用手動類型定義
export type CreateStoreRequest = {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
};

export type UpdateStoreRequest = {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
};

export type StoreResponse = {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
};

export type StoresListResponse = {
  data: StoreResponse[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

// User Stores 相關類型
export type UserStoresResponse = {
  data: StoreResponse[];
};

export type AssignUserStoresRequest = {
  store_ids: number[];
};

/**
 * 商品篩選參數類型定義
 * 
 * 對應後端 API 的查詢參數，用於商品列表的篩選功能
 * 所有參數都是可選的，支援任意組合的篩選條件
 */
export type ProductFilters = {
  /** 商品名稱模糊搜尋 */
  product_name?: string;
  /** 門市 ID 篩選 */
  store_id?: number;
  /** 分類 ID 篩選 */
  category_id?: number;
  /** 只顯示低庫存商品 */
  low_stock?: boolean;
  /** 只顯示缺貨商品 */
  out_of_stock?: boolean;
  /** 搜尋關鍵字（保留向後相容性） */
  search?: string;
  /** 分頁參數 */
  page?: number;
  /** 每頁項目數 */
  per_page?: number;
  /** 是否分頁 */
  paginate?: boolean;
};

/**
 * 庫存管理頁面專用的商品類型
 * 此類型對應後端 InventoryManagementController::index() 返回的資料結構
 * 基於 ProductResource，包含完整的變體和庫存資訊
 */
export type InventoryProductItem = {
  id?: number;
  name?: string;
  description?: string;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
  image_urls?: {
    original?: string;
    thumb?: string;
    medium?: string;
    large?: string;
  } | null;
  category?: {
    id?: number;
    name?: string;
    description?: string;
  };
  variants?: {
    id?: number;
    sku?: string;
    price?: string;  // API 回傳字符串格式
    product_id?: number;
    created_at?: string;
    updated_at?: string;
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
  }[];
  price_range?: {
    min?: number;
    max?: number;
    count?: number;
  };
  attributes?: {
    id?: number;
    name?: string;
    type?: string;
    description?: string;
  }[];
};

/**
 * 庫存交易記錄類型定義
 * 對應後端 getAllTransactions API 的返回資料結構
 */
export type InventoryTransaction = {
  id?: number;
  inventory_id?: number;
  user_id?: number;
  type?: string;
  quantity?: number;
  before_quantity?: number;
  after_quantity?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  store?: {
    id?: number;
    name?: string;
  };
  user?: {
    name?: string;
  };
  product?: {
    name?: string;
    sku?: string;
  };
};

/**
 * 庫存交易記錄查詢參數類型
 */
export type InventoryTransactionFilters = {
  /** 門市 ID 篩選 */
  store_id?: number;
  /** 交易類型篩選 */
  type?: string;
  /** 起始日期 */
  start_date?: string;
  /** 結束日期 */
  end_date?: string;
  /** 商品名稱搜尋 */
  product_name?: string;
  /** 分頁參數 */
  page?: number;
  /** 每頁項目數 */
  per_page?: number;
};

/**
 * 客戶地址類型定義
 * 
 * 對應後端 CustomerAddress 模型的前端類型
 */
export type CustomerAddress = {
  id?: number;
  customer_id?: number;
  address?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

/**
 * 客戶類型定義
 * 
 * 對應後端 Customer 模型的前端類型，包含所有客戶相關資訊
 */
export type Customer = {
  id?: number;
  name?: string;
  phone?: string;
  is_company?: boolean;
  tax_id?: string | null;
  industry_type?: string | null;
  payment_type?: string;
  contact_address?: string | null;
  total_unpaid_amount?: string;
  total_completed_amount?: string;
  created_at?: string;
  updated_at?: string;
  addresses?: CustomerAddress[];
  default_address?: CustomerAddress | null;
};

/**
 * 客戶篩選參數類型定義
 * 
 * 對應後端 API 的查詢參數，用於客戶列表的篩選功能
 */
export type CustomerFilters = {
  /** 關鍵字搜尋，匹配姓名、電話、統一編號 */
  search?: string;
  /** 按創建日期篩選的開始日期 */
  start_date?: string;
  /** 按創建日期篩選的結束日期 */
  end_date?: string;
  /** 分頁參數 */
  page?: number;
  /** 每頁項目數 */
  per_page?: number;
};

/**
 * 屬性路徑參數類型定義
 * 
 * 用於需要同時傳遞屬性 ID 和相關 ID 的 API 端點
 * 例如：更新屬性、刪除屬性值等操作
 */
export type AttributePathParams = {
  id: number;
  attribute: number;
};