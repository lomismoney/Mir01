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
  static processOrdersList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      orders: (data as any[]).map((order: any) => {
        // 臨時修復：直接返回處理後的對象
        const processedOrder = {
          id: order?.id || 0,
          order_number: order?.order_number || '',
          status: order?.status || 'pending',
          payment_status: order?.payment_status || 'pending',
          shipping_status: order?.shipping_status || 'pending',
          total_amount: order?.total_amount || 0,
          customer_name: order?.customer?.name || '未知客戶',
          store_name: order?.store?.name || '未知門市',
          created_at: order?.created_at || '',
        };
        
        // 合併原始屬性
        return Object.assign({}, order || {}, processedOrder);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理客戶列表響應
   */
  static processCustomersList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      customers: (data as any[]).map((customer: any) => {
        const processedCustomer = {
          id: customer?.id || 0,
          name: customer?.name || '未知客戶',
          email: customer?.email || '',
          phone: customer?.phone || '',
          company: customer?.company || '',
          created_at: customer?.created_at || '',
        };
        
        return Object.assign({}, customer || {}, processedCustomer);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理商品列表響應
   */
  static processProductsList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      products: (data as any[]).map((product: any) => {
        const processedProduct = {
          id: product?.id || 0,
          name: product?.name || '未知商品',
          sku: product?.sku || '',
          status: product?.status || 'active',
          category_name: product?.category?.name || '未分類',
          variants_count: product?.variants?.length || 0,
          created_at: product?.created_at || '',
        };
        
        return Object.assign({}, product || {}, processedProduct);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理庫存列表響應
   */
  static processInventoryList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      inventory: (data as any[]).map((item: any) => {
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
        
        return Object.assign({}, item || {}, processedItem);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理安裝列表響應
   */
  static processInstallationsList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      installations: (data as any[]).map((installation: any) => {
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
        
        return Object.assign({}, installation || {}, processedInstallation);
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理採購列表響應
   */
  static processPurchasesList(response: any) {
    const data = safeExtractData(response, []);
    const meta = safeExtractMeta(response);
    
    return {
      purchases: (data as any[]).map((purchase: any) => {
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
        
        return Object.assign({}, purchase || {}, processedPurchase);
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
  static processOrderDetail(response: any) {
    const order = ApiResponseHandler.handleItemResponse(response);
    
    if (!order.data) {
      return { order: null, exists: false };
    }

    return {
      order: Object.assign({}, order.data as any, {
        customer_name: (order.data as any)?.customer?.name || '未知客戶',
        store_name: (order.data as any)?.store?.name || '未知門市',
        items: (order.data as any)?.items?.map((item: any) => 
          Object.assign({}, item, {
            product_name: item.product_variant?.product?.name || '未知商品',
            variant_name: item.product_variant?.name || '',
            sku: item.product_variant?.sku || '',
          })
        ) || [],
      }),
      exists: true,
    };
  }

  /**
   * 處理客戶詳情響應
   */
  static processCustomerDetail(response: any) {
    const customer = ApiResponseHandler.handleItemResponse(response);
    
    if (!customer.data) {
      return { customer: null, exists: false };
    }

    return {
      customer: Object.assign({}, customer.data as any, {
        name: (customer.data as any)?.name || '未知客戶',
        email: (customer.data as any)?.email || '',
        phone: (customer.data as any)?.phone || '',
        company: (customer.data as any)?.company || '',
      }),
      exists: true,
    };
  }

  /**
   * 處理商品詳情響應
   */
  static processProductDetail(response: any) {
    const product = ApiResponseHandler.handleItemResponse(response);
    
    if (!product.data) {
      return { product: null, exists: false };
    }

    return {
      product: Object.assign({}, product.data as any, {
        category_name: (product.data as any)?.category?.name || '未分類',
        variants: (product.data as any)?.variants?.map((variant: any) => 
          Object.assign({}, variant, {
            stock_status: variant.stock_quantity > 0 ? 'in_stock' : 'out_of_stock',
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
  static processInventoryStats(response: any) {
    const stats = ApiResponseHandler.handleItemResponse(response);
    
    return {
      total_products: (stats.data as any)?.total_products || 0,
      total_variants: (stats.data as any)?.total_variants || 0,
      low_stock_count: (stats.data as any)?.low_stock_count || 0,
      out_of_stock_count: (stats.data as any)?.out_of_stock_count || 0,
      total_value: (stats.data as any)?.total_value || 0,
      last_updated: (stats.data as any)?.last_updated || '',
    };
  }

  /**
   * 處理銷售統計響應
   */
  static processSalesStats(response: any) {
    const stats = ApiResponseHandler.handleItemResponse(response);
    
    return {
      total_orders: (stats.data as any)?.total_orders || 0,
      total_revenue: (stats.data as any)?.total_revenue || 0,
      pending_orders: (stats.data as any)?.pending_orders || 0,
      completed_orders: (stats.data as any)?.completed_orders || 0,
      average_order_value: (stats.data as any)?.average_order_value || 0,
      growth_rate: (stats.data as any)?.growth_rate || 0,
    };
  }
}

/**
 * 通用響應處理器工廠
 * 
 * 根據響應類型自動選擇合適的處理器
 */
export class ResponseProcessorFactory {
  private static processors: Record<string, any> = {
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
  static process(type: string, response: any) {
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
  static registerProcessor(type: string, processor: (response: any) => any) {
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
  processList: <T>(response: any, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.list`, response);
    }
    return ApiResponseHandler.handleListResponse<T>(response);
  },

  /**
   * 在 Hook 中處理項目響應
   */
  processItem: <T>(response: any, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.detail`, response);
    }
    return ApiResponseHandler.handleItemResponse<T>(response);
  },

  /**
   * 在 Hook 中處理統計響應
   */
  processStats: (response: any, type?: string) => {
    if (type && ResponseProcessorFactory.process) {
      return ResponseProcessorFactory.process(`${type}.stats`, response);
    }
    return ApiResponseHandler.handleItemResponse(response);
  },
};