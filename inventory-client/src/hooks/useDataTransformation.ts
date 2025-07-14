import { useMemo } from 'react';

/**
 * 商品巢狀顯示項目類型
 */
export interface ExpandedProductItem {
  id: string | number;
  originalId?: number;
  name: string;
  sku?: string;
  status: string;
  category_name?: string;
  variants_count: number;
  created_at: string;
  isVariantRow?: boolean;
  parentId?: number;
  processedVariants?: ExpandedProductItem[];
  // 變體分頁功能
  isViewMoreRow?: boolean; // 標記是否為"查看更多"行
  remainingCount?: number; // 剩餘變體數量
  allVariants?: ExpandedProductItem[]; // 保存所有變體資料
  // 變體專用字段
  variantInfo?: {
    id: number;
    sku: string;
    price: number;
    attribute_values?: Array<{
      id: number;
      value: string;
      attribute?: {
        id: number;
        name: string;
      };
    }>;
    inventory?: Array<{
      store_id: number;
      quantity: number;
      store?: {
        id: number;
        name: string;
      };
    }>;
  };
  // 兼容現有結構
  category?: { name: string };
  variants?: any[];
}

/**
 * 訂單項目處理類型
 */
export interface ProcessedOrderItem {
  id: number;
  order_id: number;
  product_variant_id: number;
  quantity: number;
  price: number;
  total: number;
  product_name: string;
  variant_name: string;
  sku: string;
  status?: string;
  is_fulfilled?: boolean;
}

/**
 * 處理後的訂單類型
 */
export interface ProcessedOrder {
  id: number;
  order_number: string;
  customer_id: number;
  store_id: number;
  status: string;
  payment_status: string;
  shipping_status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  store_name: string;
  items: ProcessedOrderItem[];
  items_count: number;
}

/**
 * 商品數據轉換 Hook
 * 
 * 將原始商品數據轉換為巢狀顯示格式
 */
export function useProductDataTransformation(rawProducts: any[] = []) {
  const transformedProducts = useMemo(() => {
    if (!Array.isArray(rawProducts)) {
      return [];
    }

    return rawProducts.map((product) => {
      // 主商品行
      const mainProduct: ExpandedProductItem = {
        ...product, // 保留原始結構
        id: `product-${product.id}`, // 轉換為字符串 ID
        originalId: product.id, // 保存原始數字 ID
        name: product.name || '未知商品',
        sku: product.sku || '',
        status: product.status || 'active',
        category_name: product.category?.name || '未分類',
        variants_count: product.variants?.length || 0,
        created_at: product.created_at || '',
        isVariantRow: false,
      };

      // 處理變體 - 兼容現有邏輯
      if (product.variants && product.variants.length > 1) {
        const processedVariants: ExpandedProductItem[] = product.variants.map((variant: any) => ({
          ...product, // 繼承 SPU 資訊
          id: `product-${product.id}-variant-${variant.id}`, // 創建唯一字符串 ID
          originalId: product.id, // 保存原始 SPU ID
          isVariantRow: true,
          parentId: product.id,
          variantInfo: {
            id: variant.id || 0,
            sku: variant.sku || "",
            price: parseFloat(variant.price || "0"),
            attribute_values: (variant.attribute_values || []).map((attr: any) => ({
              id: attr.id || 0,
              value: attr.value || "",
              attribute: attr.attribute
                ? {
                    id: attr.attribute.id || 0,
                    name: attr.attribute.name || "",
                  }
                : undefined,
            })),
            inventory: Array.isArray(variant.inventory)
              ? variant.inventory.map((inv: any) => ({
                  store_id: inv.store?.id || inv.id || 0, // 優先使用 store.id，如果沒有則使用 inv.id
                  quantity: inv.quantity || 0,
                  store: inv.store
                    ? {
                        id: inv.store.id || 0,
                        name: inv.store.name || "",
                      }
                    : undefined,
                }))
              : [],
          },
          name: product.name || '未知商品',
          variants_count: 0,
        }));

        mainProduct.processedVariants = processedVariants;
      }

      return mainProduct;
    });
  }, [rawProducts]);

  // 展開的產品列表（包含變體行）
  const expandedProducts = useMemo(() => {
    const expanded: ExpandedProductItem[] = [];
    
    for (const product of transformedProducts) {
      expanded.push(product);
      
      if (product.processedVariants) {
        expanded.push(...product.processedVariants);
      }
    }
    
    return expanded;
  }, [transformedProducts]);

  // 獲取子行的函數 - 簡化版，不展開變體
  const getSubRows = (row: ExpandedProductItem) => {
    // 不再自動展開變體，所有變體通過點擊商品名稱查看
    return undefined;
  };

  return {
    transformedProducts,
    expandedProducts,
    getSubRows,
    hasVariants: (product: ExpandedProductItem) => Boolean(product.processedVariants?.length),
    isMainProduct: (item: ExpandedProductItem) => !item.isVariantRow,
    isVariant: (item: ExpandedProductItem) => Boolean(item.isVariantRow),
  };
}

/**
 * 訂單數據轉換 Hook
 * 
 * 將原始訂單數據轉換為處理後的格式
 */
export function useOrderDataTransformation(rawOrders: any[] = []) {
  const processedOrders = useMemo(() => {
    return rawOrders.map((order): ProcessedOrder => {
      const processedItems: ProcessedOrderItem[] = (order.items || []).map((item: any) => ({
        id: item.id || 0,
        order_id: order.id || 0,
        product_variant_id: item.product_variant_id || 0,
        quantity: item.quantity || 0,
        price: item.price || 0,
        total: item.total || (item.quantity * item.price) || 0,
        product_name: item.product_variant?.product?.name || '未知商品',
        variant_name: item.product_variant?.name || '',
        sku: item.product_variant?.sku || '',
        status: item.status || 'pending',
        is_fulfilled: item.is_fulfilled || false,
      }));

      return {
        id: order.id || 0,
        order_number: order.order_number || '',
        customer_id: order.customer_id || 0,
        store_id: order.store_id || 0,
        status: order.status || 'pending',
        payment_status: order.payment_status || 'pending',
        shipping_status: order.shipping_status || 'pending',
        total_amount: order.total_amount || 0,
        created_at: order.created_at || '',
        customer_name: order.customer?.name || '未知客戶',
        store_name: order.store?.name || '未知門市',
        items: processedItems,
        items_count: processedItems.length,
      };
    });
  }, [rawOrders]);

  return {
    processedOrders,
    getOrderById: (id: number) => processedOrders.find(order => order.id === id),
    getOrdersByStatus: (status: string) => processedOrders.filter(order => order.status === status),
    getOrdersByPaymentStatus: (paymentStatus: string) => 
      processedOrders.filter(order => order.payment_status === paymentStatus),
    getTotalRevenue: () => processedOrders.reduce((sum, order) => sum + order.total_amount, 0),
  };
}

/**
 * 庫存數據轉換 Hook
 * 
 * 將原始庫存數據轉換為處理後的格式
 */
export function useInventoryDataTransformation(rawInventory: any[] = []) {
  const processedInventory = useMemo(() => {
    return rawInventory.map((item: any) => ({
      id: item.id || 0,
      product_variant_id: item.product_variant_id || 0,
      store_id: item.store_id || 0,
      quantity: item.quantity || 0,
      reserved_quantity: item.reserved_quantity || 0,
      available_quantity: item.available_quantity || (item.quantity - item.reserved_quantity) || 0,
      product_name: item.product_variant?.product?.name || '未知商品',
      variant_name: item.product_variant?.name || '',
      sku: item.product_variant?.sku || '',
      store_name: item.store?.name || '未知門市',
      last_updated: item.last_updated || '',
      // 計算狀態
      stock_status: (() => {
        const available = item.available_quantity || (item.quantity - item.reserved_quantity) || 0;
        if (available <= 0) return 'out_of_stock';
        if (available <= 10) return 'low_stock';
        return 'in_stock';
      })(),
      // 價值計算（如果有成本資訊）
      unit_cost: item.product_variant?.cost || 0,
      total_value: (item.quantity || 0) * (item.product_variant?.cost || 0),
    }));
  }, [rawInventory]);

  return {
    processedInventory,
    getLowStockItems: (threshold: number = 10) => 
      processedInventory.filter(item => item.available_quantity <= threshold),
    getOutOfStockItems: () => 
      processedInventory.filter(item => item.available_quantity <= 0),
    getInventoryByStore: (storeId: number) => 
      processedInventory.filter(item => item.store_id === storeId),
    getTotalInventoryValue: () => 
      processedInventory.reduce((sum, item) => sum + item.total_value, 0),
    getInventoryStats: () => ({
      total_items: processedInventory.length,
      low_stock_count: processedInventory.filter(item => item.stock_status === 'low_stock').length,
      out_of_stock_count: processedInventory.filter(item => item.stock_status === 'out_of_stock').length,
      total_value: processedInventory.reduce((sum, item) => sum + item.total_value, 0),
    }),
  };
}

/**
 * 客戶數據轉換 Hook
 * 
 * 將原始客戶數據轉換為處理後的格式
 */
export function useCustomerDataTransformation(rawCustomers: any[] = []) {
  const processedCustomers = useMemo(() => {
    return rawCustomers.map((customer: any) => ({
      id: customer.id || 0,
      name: customer.name || '未知客戶',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      tax_id: customer.tax_id || '',
      company: customer.company || '',
      notes: customer.notes || '',
      created_at: customer.created_at || '',
      updated_at: customer.updated_at || '',
      // 計算字段
      has_company: Boolean(customer.company),
      contact_info: [customer.email, customer.phone].filter(Boolean).join(' | '),
      display_name: customer.company || customer.name || '未知客戶',
    }));
  }, [rawCustomers]);

  return {
    processedCustomers,
    getCustomerById: (id: number) => processedCustomers.find(customer => customer.id === id),
    getCustomersByCompany: (hasCompany: boolean) => 
      processedCustomers.filter(customer => customer.has_company === hasCompany),
    searchCustomers: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return processedCustomers.filter(customer => 
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.email.toLowerCase().includes(lowerQuery) ||
        customer.company.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(query)
      );
    },
  };
}

/**
 * 通用列表數據轉換 Hook
 * 
 * 提供通用的列表數據處理功能
 */
export function useListDataTransformation<T>(
  rawData: any[] = [],
  transformFn: (item: any) => T
) {
  const transformedData = useMemo(() => {
    if (!Array.isArray(rawData)) {
      return [];
    }
    return rawData.map(transformFn);
  }, [rawData, transformFn]);

  return {
    transformedData,
    isEmpty: transformedData.length === 0,
    count: transformedData.length,
    first: transformedData[0] || null,
    last: transformedData[transformedData.length - 1] || null,
    findById: (id: number | string, idField: keyof T = 'id' as keyof T) =>
      transformedData.find(item => item[idField] === id),
    filterBy: (predicate: (item: T) => boolean) => transformedData.filter(predicate),
    sortBy: (keyFn: (item: T) => any, reverse = false) => {
      const sorted = [...transformedData].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal) return reverse ? 1 : -1;
        if (aVal > bVal) return reverse ? -1 : 1;
        return 0;
      });
      return sorted;
    },
  };
}

/**
 * 分頁數據轉換 Hook
 * 
 * 處理分頁相關的數據轉換
 */
export function usePaginatedDataTransformation<T>(
  response: any,
  transformFn?: (item: any) => T
) {
  const processedData = useMemo(() => {
    const data = Array.isArray(response) ? response : response?.data || [];
    
    if (transformFn) {
      return data.map(transformFn);
    }
    
    return data as T[];
  }, [response, transformFn]);

  const paginationInfo = useMemo(() => {
    if (!response?.meta) {
      return {
        current_page: 1,
        total: processedData.length,
        per_page: processedData.length,
        last_page: 1,
        from: processedData.length > 0 ? 1 : null,
        to: processedData.length,
      };
    }
    
    return response.meta;
  }, [response, processedData.length]);

  return {
    data: processedData,
    pagination: paginationInfo,
    isEmpty: processedData.length === 0,
    isFirstPage: paginationInfo.current_page === 1,
    isLastPage: paginationInfo.current_page === paginationInfo.last_page,
    hasNextPage: paginationInfo.current_page < paginationInfo.last_page,
    hasPrevPage: paginationInfo.current_page > 1,
  };
}