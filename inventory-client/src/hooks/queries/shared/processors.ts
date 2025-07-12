/**
 * 統一的數據處理器
 * 提供標準化的數據轉換和處理邏輯
 */

/**
 * 通用分頁響應介面
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface PaginationLinks {
  first?: string;
  last?: string;
  prev?: string;
  next?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: PaginationLinks;
}

/**
 * 通用 API 響應介面
 */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
  message?: string;
  status?: string;
}

/**
 * 通用分頁響應處理器
 * 標準化不同 API 端點的分頁響應格式
 */
export const processPaginatedResponse = <T>(
  response: any,
  itemProcessor?: (item: any) => T
): PaginatedResponse<T> => {
  // 處理不同的響應結構
  const data = response?.data?.data || response?.data || response || [];
  
  // 提取分頁元數據
  const meta: PaginationMeta = response?.meta || response?.data?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: Array.isArray(data) ? data.length : 0,
    total: Array.isArray(data) ? data.length : 0,
  };

  // 提取分頁連結
  const links = response?.links || response?.data?.links;

  // 處理數據項目
  const processedData = Array.isArray(data) 
    ? (itemProcessor ? data.map(itemProcessor) : data)
    : [];

  return {
    data: processedData,
    meta,
    links,
  };
};

/**
 * 通用單項響應處理器
 * 標準化單項數據響應格式
 */
export const processSingleItemResponse = <T>(
  response: any,
  itemProcessor?: (item: any) => T
): T => {
  const data = response?.data || response;
  return itemProcessor ? itemProcessor(data) : data;
};

/**
 * 金額欄位處理器
 * 將字符串金額轉換為數字，處理 null/undefined 值
 */
export const processMoneyFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const processed = { ...obj };
  
  fields.forEach(field => {
    if (processed[field] !== undefined && processed[field] !== null) {
      (processed as any)[field] = parseFloat(String(processed[field]) || '0');
    } else {
      (processed as any)[field] = 0;
    }
  });
  
  return processed;
};

/**
 * 日期欄位處理器
 * 標準化日期格式處理
 */
export const processDateFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const processed = { ...obj };
  
  fields.forEach(field => {
    if (processed[field] && typeof processed[field] === 'string') {
      (processed as any)[field] = new Date(processed[field] as string);
    }
  });
  
  return processed;
};

/**
 * 布林欄位處理器
 * 處理 '1'/'0', 'true'/'false', 1/0 等不同的布林值格式
 */
export const processBooleanFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const processed = { ...obj };
  
  fields.forEach(field => {
    const value = processed[field];
    if (value !== undefined && value !== null) {
      (processed as any)[field] = Boolean(
        value === 1 || 
        value === '1' || 
        value === true || 
        value === 'true'
      );
    }
  });
  
  return processed;
};

/**
 * 數字欄位處理器
 * 將字符串數字轉換為實際數字
 */
export const processNumberFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const processed = { ...obj };
  
  fields.forEach(field => {
    const value = processed[field];
    if (value !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      (processed as any)[field] = isNaN(numValue) ? 0 : numValue;
    } else {
      (processed as any)[field] = 0;
    }
  });
  
  return processed;
};

/**
 * 陣列欄位處理器
 * 確保指定欄位始終為陣列
 */
export const processArrayFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const processed = { ...obj };
  
  fields.forEach(field => {
    if (!Array.isArray(processed[field])) {
      (processed as any)[field] = [];
    }
  });
  
  return processed;
};

/**
 * 組合處理器
 * 允許一次性應用多個處理器
 */
export const processWithMultipleProcessors = <T extends Record<string, any>>(
  obj: T,
  processors: Array<(obj: T) => T>
): T => {
  return processors.reduce((processed, processor) => processor(processed), obj);
};

/**
 * 商品特定處理器
 * 處理商品相關的數據轉換
 */
export const processProductData = (product: any) => {
  return processWithMultipleProcessors(product, [
    (p) => processMoneyFields(p, ['price', 'cost_price', 'selling_price']),
    (p) => processNumberFields(p, ['stock_quantity', 'reserved_quantity', 'available_quantity']),
    (p) => processBooleanFields(p, ['is_active', 'track_stock', 'is_variable']),
    (p) => processArrayFields(p, ['variants', 'attributes', 'categories']),
    (p) => processDateFields(p, ['created_at', 'updated_at']),
  ]);
};

/**
 * 訂單特定處理器
 * 處理訂單相關的數據轉換
 */
export const processOrderData = (order: any) => {
  return processWithMultipleProcessors(order, [
    (o) => processMoneyFields(o, ['total_amount', 'paid_amount', 'discount_amount', 'tax_amount']),
    (o) => processNumberFields(o, ['quantity', 'item_count']),
    (o) => processBooleanFields(o, ['is_paid', 'is_shipped', 'is_completed']),
    (o) => processArrayFields(o, ['items', 'payments', 'shipments']),
    (o) => processDateFields(o, ['created_at', 'updated_at', 'shipped_at', 'completed_at']),
  ]);
};

/**
 * 客戶特定處理器
 * 處理客戶相關的數據轉換
 */
export const processCustomerData = (customer: any) => {
  return processWithMultipleProcessors(customer, [
    (c) => processArrayFields(c, ['addresses', 'orders', 'contacts']),
    (c) => processBooleanFields(c, ['is_active', 'is_vip']),
    (c) => processDateFields(c, ['created_at', 'updated_at', 'last_order_at']),
  ]);
};

/**
 * 庫存特定處理器
 * 處理庫存相關的數據轉換
 */
export const processInventoryData = (inventory: any) => {
  return processWithMultipleProcessors(inventory, [
    (i) => processNumberFields(i, ['quantity', 'reserved_quantity', 'available_quantity', 'min_stock', 'max_stock']),
    (i) => processMoneyFields(i, ['unit_cost', 'total_value']),
    (i) => processBooleanFields(i, ['track_stock', 'is_low_stock']),
    (i) => processDateFields(i, ['created_at', 'updated_at', 'last_movement_at']),
  ]);
};

/**
 * 安裝特定處理器
 * 處理安裝相關的數據轉換
 */
export const processInstallationData = (installation: any) => {
  return processWithMultipleProcessors(installation, [
    (i) => processMoneyFields(i, ['total_amount', 'labor_cost', 'material_cost']),
    (i) => processArrayFields(i, ['items', 'technicians']),
    (i) => processBooleanFields(i, ['is_completed', 'is_scheduled']),
    (i) => processDateFields(i, ['created_at', 'updated_at', 'scheduled_at', 'completed_at']),
  ]);
};

/**
 * 創建自定義數據處理器
 * 允許為特定需求創建自定義處理邏輯
 */
export const createCustomProcessor = <T extends Record<string, any>>(
  processors: {
    moneyFields?: (keyof T)[];
    numberFields?: (keyof T)[];
    booleanFields?: (keyof T)[];
    arrayFields?: (keyof T)[];
    dateFields?: (keyof T)[];
  }
) => {
  return (data: T): T => {
    let processed = { ...data } as T;

    if (processors.moneyFields?.length) {
      processed = processMoneyFields(processed, processors.moneyFields) as T;
    }
    if (processors.numberFields?.length) {
      processed = processNumberFields(processed, processors.numberFields) as T;
    }
    if (processors.booleanFields?.length) {
      processed = processBooleanFields(processed, processors.booleanFields) as T;
    }
    if (processors.arrayFields?.length) {
      processed = processArrayFields(processed, processors.arrayFields) as T;
    }
    if (processors.dateFields?.length) {
      processed = processDateFields(processed, processors.dateFields) as T;
    }

    return processed;
  };
};

/**
 * 查詢響應處理器工廠
 * 創建標準化的查詢響應處理器
 */
export const createQueryProcessor = <T>(
  itemProcessor?: (item: any) => T
) => ({
  /**
   * 處理分頁響應
   */
  paginated: (response: any): PaginatedResponse<T> => 
    processPaginatedResponse(response, itemProcessor),

  /**
   * 處理單項響應
   */
  single: (response: any): T => 
    processSingleItemResponse(response, itemProcessor),

  /**
   * 處理陣列響應（非分頁）
   */
  array: (response: any): T[] => {
    const data = response?.data || response || [];
    return Array.isArray(data) 
      ? (itemProcessor ? data.map(itemProcessor) : data)
      : [];
  }
});