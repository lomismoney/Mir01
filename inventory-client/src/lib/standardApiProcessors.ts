/**
 * 標準化 API 處理器
 * 
 * 提供統一的 API 響應處理邏輯，消除重複代碼
 * 針對不同業務場景提供專門的處理函式
 */

import { ApiResponseHandler, safeExtractData, safeExtractMeta } from './apiResponseHelpers';
import type { paths } from '@/types/api';

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
    const data = safeExtractData(response, []) as NonNullable<paths['/api/orders']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      orders: data.map((order) => {
        // 多型欄位必須先判斷型別
        const hasStatus = typeof order === 'object' && order !== null && 'status' in order && typeof (order as any).status === 'string';
        const hasPaymentStatus = typeof order === 'object' && order !== null && 'payment_status' in order && typeof (order as any).payment_status === 'string';
        const hasShippingStatus = typeof order === 'object' && order !== null && 'shipping_status' in order && typeof (order as any).shipping_status === 'string';
        const hasTotalAmount = typeof order === 'object' && order !== null && 'total_amount' in order && typeof (order as any).total_amount === 'number';
        let customerName = '未知客戶';
        if (typeof order === 'object' && order !== null && 'customer' in order && typeof (order as any).customer === 'object' && (order as any).customer !== null && 'name' in (order as any).customer && typeof (order as any).customer.name === 'string') {
          customerName = (order as any).customer.name;
        }
        let storeName = '未知門市';
        if (typeof order === 'object' && order !== null && 'store' in order && typeof (order as any).store === 'object' && (order as any).store !== null && 'name' in (order as any).store && typeof (order as any).store.name === 'string') {
          storeName = (order as any).store.name;
        }
        return {
          id: order.id ?? 0,
          order_number: order.order_number ?? '',
          status: hasStatus ? (order as any).status : '',
          payment_status: hasPaymentStatus ? (order as any).payment_status : '',
          shipping_status: hasShippingStatus ? (order as any).shipping_status : '',
          total_amount: hasTotalAmount ? (order as any).total_amount : 0,
          customer_name: customerName,
          store_name: storeName,
          created_at: order.created_at ?? '',
          updated_at: order.updated_at ?? '',
        };
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理客戶列表，嚴格型別守護
   */
  static processCustomersList(response: unknown) {
    // 取出資料並明確標註型別
    const data = safeExtractData(response, []) as NonNullable<paths['/api/customers']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      customers: data.map((customer) => {
        // 僅取有定義於 OpenAPI 的欄位，並加上型別守護
        return {
          id: customer.id ?? 0,
          name: customer.name ?? '未知客戶',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          // company 欄位不存在於 OpenAPI，自動省略
          created_at: customer.created_at ?? '',
          updated_at: customer.updated_at ?? '',
        };
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理商品列表，嚴格型別守護與多型欄位判斷
   */
  static processProductsList(response: unknown) {
    const data = safeExtractData(response, []) as NonNullable<paths['/api/products']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      products: data.map((product) => {
        // 多型欄位必須先判斷型別
        const hasSku = typeof product === 'object' && product !== null && 'sku' in product && typeof (product as any).sku === 'string';
        const hasStatus = typeof product === 'object' && product !== null && 'status' in product && typeof (product as any).status === 'string';
        const hasCategory = typeof product === 'object' && product !== null && 'category' in product && typeof (product as any).category === 'object' && (product as any).category !== null && 'name' in (product as any).category;
        const hasVariants = typeof product === 'object' && product !== null && 'variants' in product && Array.isArray((product as any).variants);
        return {
          id: product.id ?? 0,
          name: product.name ?? '未知商品',
          sku: hasSku ? (product as any).sku : '',
          status: hasStatus ? (product as any).status : '',
          category_name: hasCategory && (product as any).category && 'name' in (product as any).category && typeof (product as any).category.name === 'string' ? (product as any).category.name : '未分類',
          variants_count: hasVariants ? (product as any).variants.length : 0,
          created_at: product.created_at ?? '',
          updated_at: product.updated_at ?? '',
        };
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理庫存列表，嚴格型別守護與多型欄位判斷
   */
  static processInventoryList(response: unknown) {
    const data = safeExtractData(response, []) as NonNullable<paths['/api/inventory']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      inventory: data.map((item) => {
        // 多型欄位必須先判斷型別
        const hasQuantity = typeof item === 'object' && item !== null && 'quantity' in item && typeof (item as any).quantity === 'number';
        const hasReserved = typeof item === 'object' && item !== null && 'reserved_quantity' in item && typeof (item as any).reserved_quantity === 'number';
        const hasAvailable = typeof item === 'object' && item !== null && 'available_quantity' in item && typeof (item as any).available_quantity === 'number';
        const hasProductVariant = typeof item === 'object' && item !== null && 'product_variant' in item && typeof (item as any).product_variant === 'object' && (item as any).product_variant !== null;
        const hasStore = typeof item === 'object' && item !== null && 'store' in item && typeof (item as any).store === 'object' && (item as any).store !== null;
        let productName = '未知商品';
        let variantName = '';
        let sku = '';
        if (hasProductVariant) {
          const pv = (item as any).product_variant;
          if (typeof pv === 'object' && pv !== null && 'product' in pv && typeof pv.product === 'object' && pv.product !== null && 'name' in pv.product && typeof pv.product.name === 'string') {
            productName = pv.product.name;
          }
          if ('name' in pv && typeof pv.name === 'string') {
            variantName = pv.name;
          }
          if ('sku' in pv && typeof pv.sku === 'string') {
            sku = pv.sku;
          }
        }
        let storeName = '未知門市';
        if (hasStore) {
          const st = (item as any).store;
          if ('name' in st && typeof st.name === 'string') {
            storeName = st.name;
          }
        }
        return {
          id: item.id ?? 0,
          quantity: hasQuantity ? (item as any).quantity : 0,
          reserved_quantity: hasReserved ? (item as any).reserved_quantity : 0,
          available_quantity: hasAvailable ? (item as any).available_quantity : 0,
          product_name: productName,
          variant_name: variantName,
          sku: sku,
          store_name: storeName,
          last_updated: typeof item === 'object' && item !== null && 'last_updated' in item && typeof (item as any).last_updated === 'string' ? (item as any).last_updated : '',
        };
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理安裝列表，嚴格型別守護與多型欄位判斷
   */
  static processInstallationsList(response: unknown) {
    const data = safeExtractData(response, []) as NonNullable<paths['/api/installations']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      installations: data.map((installation) => {
        // 多型欄位必須先判斷型別
        let customerName = '未知客戶';
        let technicianName = '未指派';
        if (typeof installation === 'object' && installation !== null && 'customer' in installation && typeof (installation as any).customer === 'object' && (installation as any).customer !== null && 'name' in (installation as any).customer && typeof (installation as any).customer.name === 'string') {
          customerName = (installation as any).customer.name;
        }
        if (typeof installation === 'object' && installation !== null && 'technician' in installation && typeof (installation as any).technician === 'object' && (installation as any).technician !== null && 'name' in (installation as any).technician && typeof (installation as any).technician.name === 'string') {
          technicianName = (installation as any).technician.name;
        }
        const hasItems = typeof installation === 'object' && installation !== null && 'items' in installation && Array.isArray((installation as any).items);
        return {
          id: installation.id ?? 0,
          installation_number: installation.installation_number ?? '',
          status: installation.status ?? 'pending',
          customer_name: customerName,
          technician_name: technicianName,
          scheduled_date: installation.scheduled_date ?? '',
          items_count: hasItems ? (installation as any).items.length : 0,
          created_at: installation.created_at ?? '',
          updated_at: installation.updated_at ?? '',
        };
      }),
      pagination: meta,
      total: meta?.total || data.length,
      isEmpty: data.length === 0,
    };
  }

  /**
   * 處理採購列表，嚴格型別守護與多型欄位判斷
   */
  static processPurchasesList(response: unknown) {
    const data = safeExtractData(response, []) as NonNullable<paths['/api/purchases']['get']['responses'][200]['content']['application/json']['data']>;
    const meta = safeExtractMeta(response);
    return {
      purchases: data.map((purchase) => {
        // 多型欄位必須先判斷型別
        const hasPurchaseNumber = typeof purchase === 'object' && purchase !== null && 'purchase_number' in purchase && typeof (purchase as any).purchase_number === 'string';
        const hasStatus = typeof purchase === 'object' && purchase !== null && 'status' in purchase && typeof (purchase as any).status === 'string';
        const hasTotalAmount = typeof purchase === 'object' && purchase !== null && 'total_amount' in purchase && typeof (purchase as any).total_amount === 'number';
        const hasSupplier = typeof purchase === 'object' && purchase !== null && 'supplier' in purchase && typeof (purchase as any).supplier === 'object' && (purchase as any).supplier !== null && 'name' in (purchase as any).supplier;
        const hasItems = typeof purchase === 'object' && purchase !== null && 'items' in purchase && Array.isArray((purchase as any).items);
        const hasReceivedDate = typeof purchase === 'object' && purchase !== null && 'received_date' in purchase && typeof (purchase as any).received_date === 'string';
        let supplierName = '未知供應商';
        if (hasSupplier && (purchase as any).supplier && 'name' in (purchase as any).supplier && typeof (purchase as any).supplier.name === 'string') {
          supplierName = (purchase as any).supplier.name;
        }
        return {
          id: purchase.id ?? 0,
          purchase_number: hasPurchaseNumber ? (purchase as any).purchase_number : '',
          status: hasStatus ? (purchase as any).status : '',
          total_amount: hasTotalAmount ? (purchase as any).total_amount : 0,
          supplier_name: supplierName,
          items_count: hasItems ? (purchase as any).items.length : 0,
          received_date: hasReceivedDate ? (purchase as any).received_date : '',
          created_at: purchase.created_at ?? '',
          updated_at: purchase.updated_at ?? '',
        };
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