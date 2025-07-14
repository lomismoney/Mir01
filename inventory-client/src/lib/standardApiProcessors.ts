/**
 * 標準化 API 處理器
 * 
 * 提供統一的 API 響應處理邏輯，消除重複代碼
 * 針對不同業務場景提供專門的處理函式
 */

import { ApiResponseHandler, safeExtractData, safeExtractMeta } from './apiResponseHelpers';

/**
 * 標準化列表處理器
 * 
 * 統一處理所有列表相關的 API 響應
 */
export class StandardListProcessor {
  /**
   * 處理訂單列表響應
   */
  static processOrdersList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      orders: (data as unknown[]).map((order: unknown) => {
        // 臨時修復：直接返回處理後的對象
        const processedOrder = {
          id: (order as Record<string, unknown>)?.id as number || 0,
          order_number: (order as Record<string, unknown>)?.order_number as string || '',
          status: (order as Record<string, unknown>)?.status as string || 'pending',
          payment_status: (order as Record<string, unknown>)?.payment_status as string || 'pending',
          shipping_status: (order as Record<string, unknown>)?.shipping_status as string || 'pending',
          total_amount: (order as Record<string, unknown>)?.total_amount as number || 0,
          customer_name: (order as Record<string, unknown> & { customer?: { name?: string } })?.customer?.name || '未知客戶',
          store_name: (order as Record<string, unknown> & { store?: { name?: string } })?.store?.name || '未知門市',
          created_at: (order as Record<string, unknown>)?.created_at as string || '',
        };
        
        // 合併原始屬性
        return Object.assign({}, (order as Record<string, unknown>) || {}, processedOrder);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理客戶列表響應
   */
  static processCustomersList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      customers: (data as unknown[]).map((customer: unknown) => {
        const processedCustomer = {
          id: customer?.id || 0,
          name: customer?.name || '未知客戶',
          email: customer?.email || '',
          phone: customer?.phone || '',
          company: customer?.company || '',
          created_at: customer?.created_at || '',
        };
        
        return Object.assign({}, (customer as Record<string, unknown>) || {}, processedCustomer);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理商品列表響應
   */
  static processProductsList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      products: (data as unknown[]).map((product: unknown) => {
        const processedProduct = {
          id: product?.id || 0,
          name: product?.name || '未知商品',
          sku: product?.sku || '',
          status: product?.status || 'active',
          category_name: product?.category?.name || '未分類',
          variants_count: product?.variants?.length || 0,
          created_at: product?.created_at || '',
        };
        
        return Object.assign({}, (product as Record<string, unknown>) || {}, processedProduct);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理庫存列表響應
   */
  static processInventoryList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      inventory: (data as unknown[]).map((item: unknown) => {
        const processedItem = {
          id: item?.id || 0,
          quantity: item?.quantity || 0,
          reserved_quantity: item?.reserved_quantity || 0,
          available_quantity: item?.available_quantity || 0,
          product_name: item?.product_variant?.product?.name || '未知商品',
          variant_name: item?.product_variant?.name || '',
          sku: item?.product_variant?.sku || '',
          store_name: item?.store?.name || '未知門市',
          last_updated: item?.last_updated || '',
        };
        
        return Object.assign({}, (item as Record<string, unknown>) || {}, processedItem);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理安裝列表響應
   */
  static processInstallationsList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      installations: (data as unknown[]).map((installation: unknown) => {
        const processedInstallation = {
          id: installation?.id || 0,
          installation_number: installation?.installation_number || '',
          status: installation?.status || 'pending',
          customer_name: installation?.customer?.name || '未知客戶',
          technician_name: installation?.technician?.name || '未指派',
          scheduled_date: installation?.scheduled_date || '',
          items_count: installation?.items?.length || 0,
          created_at: installation?.created_at || '',
        };
        
        return Object.assign({}, (installation as Record<string, unknown>) || {}, processedInstallation);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理採購列表響應
   */
  static processPurchasesList(response: unknown) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      purchases: (data as unknown[]).map((purchase: unknown) => {
        const processedPurchase = {
          id: purchase?.id || 0,
          purchase_number: purchase?.purchase_number || '',
          status: purchase?.status || 'pending',
          total_amount: purchase?.total_amount || 0,
          supplier_name: purchase?.supplier?.name || '未知供應商',
          items_count: purchase?.items?.length || 0,
          received_date: purchase?.received_date || '',
          created_at: purchase?.created_at || '',
        };
        
        return Object.assign({}, (purchase as Record<string, unknown>) || {}, processedPurchase);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }
}

/**
 * 標準化項目處理器
 * 
 * 處理單一項目的 API 響應
 */
export class StandardItemProcessor {
  /**
   * 處理訂單詳情響應
   */
  static processOrderDetail(response: unknown) {
    const order = ApiResponseHandler.handleItemResponse(response);
    
    if (!order.data) {
      return { order: null, exists: false };
    }

    return {
      order: Object.assign({}, order.data as Record<string, unknown>, {
        customer_name: (order.data as Record<string, unknown> & { customer?: { name?: string } })?.customer?.name || '未知客戶',
        store_name: (order.data as Record<string, unknown> & { store?: { name?: string } })?.store?.name || '未知門市',
        items: (order.data as Record<string, unknown> & { items?: unknown[] })?.items?.map((item: unknown) => 
          Object.assign({}, item as Record<string, unknown>, {
            product_name: (item as Record<string, unknown> & { product_variant?: { product?: { name?: string } } })?.product_variant?.product?.name || '未知商品',
            variant_name: (item as Record<string, unknown> & { product_variant?: { name?: string } })?.product_variant?.name || '',
            sku: (item as Record<string, unknown> & { product_variant?: { sku?: string } })?.product_variant?.sku || '',
          })
        ) || [],
      }),
      exists: true,
    };
  }

  /**
   * 處理客戶詳情響應
   */
  static processCustomerDetail(response: unknown) {
    const customer = ApiResponseHandler.handleItemResponse(response);
    
    if (!customer.data) {
      return { customer: null, exists: false };
    }

    return {
      customer: Object.assign({}, customer.data as Record<string, unknown>, {
        name: (customer.data as Record<string, unknown> & { name?: string })?.name || '未知客戶',
        email: (customer.data as Record<string, unknown> & { email?: string })?.email || '',
        phone: (customer.data as Record<string, unknown> & { phone?: string })?.phone || '',
        company: (customer.data as Record<string, unknown> & { company?: string })?.company || '',
      }),
      exists: true,
    };
  }

  /**
   * 處理商品詳情響應
   */
  static processProductDetail(response: unknown) {
    const product = ApiResponseHandler.handleItemResponse(response);
    
    if (!product.data) {
      return { product: null, exists: false };
    }

    return {
      product: Object.assign({}, product.data as Record<string, unknown>, {
        category_name: (product.data as Record<string, unknown> & { category?: { name?: string } })?.category?.name || '未分類',
        variants: (product.data as Record<string, unknown> & { variants?: unknown[] })?.variants?.map((variant: unknown) => 
          Object.assign({}, variant as Record<string, unknown>, {
            stock_status: ((variant as Record<string, unknown>)?.stock_quantity as number) > 0 ? 'in_stock' : 'out_of_stock',
          })
        ) || [],
      }),
      exists: true,
    };
  }
}

/**
 * 標準化統計處理器
 * 
 * 處理統計和報表相關的 API 響應
 */
export class StandardStatsProcessor {
  /**
   * 處理庫存統計響應
   */
  static processInventoryStats(response: unknown) {
    const stats = ApiResponseHandler.handleItemResponse(response);
    
    return {
      total_products: (stats.data as Record<string, unknown>)?.total_products as number || 0,
      total_variants: (stats.data as Record<string, unknown>)?.total_variants as number || 0,
      low_stock_count: (stats.data as Record<string, unknown>)?.low_stock_count as number || 0,
      out_of_stock_count: (stats.data as Record<string, unknown>)?.out_of_stock_count as number || 0,
      total_value: (stats.data as Record<string, unknown>)?.total_value as number || 0,
      last_updated: (stats.data as Record<string, unknown>)?.last_updated as string || '',
    };
  }

  /**
   * 處理銷售統計響應
   */
  static processSalesStats(response: unknown) {
    const stats = ApiResponseHandler.handleItemResponse(response);
    
    return {
      total_orders: (stats.data as Record<string, unknown>)?.total_orders as number || 0,
      total_revenue: (stats.data as Record<string, unknown>)?.total_revenue as number || 0,
      pending_orders: (stats.data as Record<string, unknown>)?.pending_orders as number || 0,
      completed_orders: (stats.data as Record<string, unknown>)?.completed_orders as number || 0,
      average_order_value: (stats.data as Record<string, unknown>)?.average_order_value as number || 0,
      growth_rate: (stats.data as Record<string, unknown>)?.growth_rate as number || 0,
    };
  }
}

/**
 * 通用響應處理器工廠
 * 
 * 根據響應類型自動選擇合適的處理器
 */
export class ResponseProcessorFactory {
  private static processors: Record<string, (response: unknown) => unknown> = {
    // 列表處理器
    'orders.list': StandardListProcessor.processOrdersList,
    'customers.list': StandardListProcessor.processCustomersList,
    'products.list': StandardListProcessor.processProductsList,
    'inventory.list': StandardListProcessor.processInventoryList,
    'installations.list': StandardListProcessor.processInstallationsList,
    'purchases.list': StandardListProcessor.processPurchasesList,
    
    // 項目處理器
    'orders.detail': StandardItemProcessor.processOrderDetail,
    'customers.detail': StandardItemProcessor.processCustomerDetail,
    'products.detail': StandardItemProcessor.processProductDetail,
    
    // 統計處理器
    'inventory.stats': StandardStatsProcessor.processInventoryStats,
    'sales.stats': StandardStatsProcessor.processSalesStats,
  };

  /**
   * 根據類型處理響應
   */
  static process(type: string, response: unknown) {
    const processor = this.processors[type];
    
    if (processor) {
      return processor(response);
    }

    // 回退到通用處理器
    return ApiResponseHandler.handleListResponse(response);
  }

  /**
   * 註冊自定義處理器
   */
  static registerProcessor(type: string, processor: (response: unknown) => unknown) {
    this.processors[type] = processor;
  }
}

/**
 * Hook 友善的響應處理器
 * 
 * 為 React Query Hook 提供便利的響應處理
 */
export const useApiProcessor = {
  /**
   * 在 Hook 中處理列表響應
   */
  processList: <T>(response: unknown, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.list`, response);
    }
    return ApiResponseHandler.handleListResponse<T>(response);
  },

  /**
   * 在 Hook 中處理項目響應
   */
  processItem: <T>(response: unknown, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.detail`, response);
    }
    return ApiResponseHandler.handleItemResponse<T>(response);
  },

  /**
   * 在 Hook 中處理統計響應
   */
  processStats: (response: unknown, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.stats`, response);
    }
    return ApiResponseHandler.handleItemResponse(response);
  },
};