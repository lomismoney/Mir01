/**
 * 庫存管理相關的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { ProductFilters, InventoryTransactionFilters } from '@/types/api-helpers';
import { INVENTORY_KEYS } from '../shared/queryKeys';
import { createCacheInvalidation, createErrorHandler, createSuccessHandler } from '../shared/utils';
import { processPaginatedResponse, processInventoryData } from '../shared/processors';
import { BUSINESS_QUERY_CONFIG } from '../shared/config';

/**
 * 庫存列表查詢 Hook
 */
export const useInventoryList = (filters: ProductFilters = {}) => {
  return useQuery({
    ...BUSINESS_QUERY_CONFIG.INVENTORY.LIST,
    queryKey: INVENTORY_KEYS.LIST(filters),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory', {
        params: {
          query: filters
        }
      });
      
      if (error) {
        throw new Error('獲取庫存列表失敗');
      }
      return data;
    },
    select: (response: any) => 
      processPaginatedResponse(response, (item) => processInventoryData(item as Record<string, unknown>)),
  });
};

/**
 * 獲取單個庫存詳情
 */
export function useInventoryDetail(id: number) {
  return useQuery({
    ...BUSINESS_QUERY_CONFIG.INVENTORY.DETAIL,
    queryKey: INVENTORY_KEYS.DETAIL(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/{inventory}', {
        params: { path: { inventory: id } },
      });
      if (error) {
        throw new Error('獲取庫存詳情失敗');
      }
      return data;
    },
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 庫存調整 Mutation
 */
export function useInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adjustment: {
      product_variant_id: number;
      store_id: number;
      action: 'add' | 'reduce' | 'set';
      quantity: number;
      notes?: string;
      metadata?: Record<string, never> | null;
    }) => {
      const { data, error } = await apiClient.POST('/api/inventory/adjust', {
        body: adjustment
      });
      if (error) {
        throw new Error('庫存調整失敗');
      }
      return data;
    },
    onSuccess: async () => {
      const cacheInvalidation = createCacheInvalidation(queryClient);
      await cacheInvalidation.invalidateAndRefetch(INVENTORY_KEYS.ALL);
    },
  });
}

/**
 * 庫存歷史記錄
 */
export function useInventoryHistory(params: {
  id: number;
  start_date?: string;
  end_date?: string;
  type?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['inventory', 'history', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      if (params.type) queryParams['filter[type]'] = params.type;
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/{inventory}/history', {
        params: { 
          path: { inventory: params.id },
          query: queryParams
        }
      });
      if (error) {
        throw new Error('獲取庫存歷史失敗');
      }
      return data;
    },
    // 🎯 數據精煉廠 - 保持分頁結構並處理庫存歷史數據
    select: (response: any) => {
      // 如果響應有分頁結構，直接返回
      if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
        return response;
      }
      
      // 如果響應是純陣列，包裝成分頁結構
      if (Array.isArray(response)) {
        return {
          data: response,
          total: response.length,
          per_page: params.per_page || 15,
          current_page: params.page || 1,
          last_page: 1,
          from: response.length > 0 ? 1 : 0,
          to: response.length
        };
      }
      
      // 如果響應是直接的數據對象（包含data數組）
      if (response?.data && Array.isArray(response.data)) {
        return {
          data: response.data,
          total: response.total || response.data.length,
          per_page: response.per_page || params.per_page || 15,
          current_page: response.current_page || params.page || 1,
          last_page: response.last_page || 1,
          from: response.from || (response.data.length > 0 ? 1 : 0),
          to: response.to || response.data.length
        };
      }
      
      // 預設空結構
      return {
        data: [],
        total: 0,
        per_page: params.per_page || 15,
        current_page: params.page || 1,
        last_page: 1,
        from: 0,
        to: 0
      };
    },
    enabled: !!params.id,
    staleTime: 30 * 1000,
  });
}

/**
 * SKU 庫存歷史記錄
 */
export function useSkuInventoryHistory(params: {
  sku: string;
  store_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['inventory', 'sku-history', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      
      if (params.store_id) queryParams['filter[store_id]'] = params.store_id;
      if (params.type) queryParams['filter[type]'] = params.type;
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/sku/{sku}/history', {
        params: { 
          path: { sku: params.sku },
          query: queryParams
        }
      });
      if (error) {
        throw new Error('獲取 SKU 庫存歷史失敗');
      }
      return data;
    },
    // 🎯 最終標準化數據精煉廠 - 處理這個特殊的數據結構
    select: (response: any) => {
      // 此 API 返回特殊結構：{ data: transactions[], inventories: inventory[] }
      // 我們保留整個結構，讓 UI 元件可以直接使用
      return {
        data: response?.data || [],           // 交易記錄陣列
        inventories: response?.inventories || [], // 庫存項目陣列
        message: response?.message,
        pagination: response?.pagination
      };
    },
    enabled: !!params.sku,
    staleTime: 30 * 1000,
  });
}

/**
 * 獲取所有庫存交易記錄
 */
export function useAllInventoryTransactions(filters: InventoryTransactionFilters = {}) {
  return useQuery({
    queryKey: ['inventory', 'transactions', filters],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      
      if (filters.product_name) queryParams['filter[product_name]'] = filters.product_name;
      if (filters.store_id) queryParams['filter[store_id]'] = filters.store_id;
      if (filters.type) queryParams['filter[type]'] = filters.type;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      
      if (filters.per_page) queryParams.per_page = filters.per_page;
      if (filters.page) queryParams.page = filters.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/transactions', {
        params: {
          query: queryParams
        }
      });
      if (error) {
        throw new Error('獲取庫存交易記錄失敗');
      }
      return data;
    },
    select: (response: any) => {
      if (!response) return { data: [], pagination: null };
      
      // 🎯 修復分頁資訊提取：Laravel API 的分頁資訊通常在 meta 中
      const paginationInfo = response.meta || response.pagination || null;
      
      return {
        data: response.data || [],
        pagination: paginationInfo
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 庫存轉移列表
 */
export function useInventoryTransfers(params: {
  from_store_id?: number;
  to_store_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  per_page?: number;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: ['inventory', 'transfers', params],
    queryFn: async () => {
      const queryParams: Record<string, any> = {};
      
      if (params.from_store_id) queryParams['filter[from_store_id]'] = params.from_store_id;
      if (params.to_store_id) queryParams['filter[to_store_id]'] = params.to_store_id;
      if (params.status) queryParams['filter[status]'] = params.status;
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      if (params.product_name) queryParams['filter[product_name]'] = params.product_name;
      
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/transfers', {
        params: { query: queryParams },
      });
      if (error) {
        throw new Error('獲取庫存轉移列表失敗');
      }
      return data;
    },
    select: (response: any) => {
      const transfers = response?.data || response || [];
      if (!Array.isArray(transfers)) return [];
      
      return transfers;
    },
  });
}

/**
 * 獲取單個庫存轉移詳情
 */
export function useInventoryTransferDetail(id: number) {
  return useQuery({
    queryKey: ['inventory', 'transfer', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/transfers/{transfer}', {
        params: { path: { transfer: id } },
      });
      if (error) {
        throw new Error('獲取庫存轉移詳情失敗');
      }
      return data;
    },
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 創建庫存轉移
 */
export function useCreateInventoryTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: {
      from_store_id: number;
      to_store_id: number;
      product_variant_id: number;
      quantity: number;
      notes?: string;
      status?: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    }) => {
      const { data, error } = await apiClient.POST('/api/inventory/transfers', {
        body: transfer
      });
      if (error) {
        throw new Error('創建庫存轉移失敗');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'list'],
          exact: false
        })
      ]);
    },
  });
}

/**
 * 更新庫存轉移狀態
 */
export function useUpdateInventoryTransferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const { data, error } = await apiClient.PATCH('/api/inventory/transfers/{transfer}/status', {
        params: { path: { transfer: id } },
        body: { status, notes }
      });
      if (error) {
        throw new Error('更新轉移狀態失敗');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfer'],
          exact: false
        })
      ]);
    },
  });
}

/**
 * 取消庫存轉移
 */
export function useCancelInventoryTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const body: any = {};
      if (reason) {
        body.reason = reason;
      }
      
      const { data, error } = await apiClient.PATCH('/api/inventory/transfers/{transfer}/cancel', {
        params: { path: { transfer: id } },
        body
      });
      if (error) {
        throw new Error('取消轉移失敗');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfer'],
          exact: false
        })
      ]);
    },
  });
}

/**
 * 庫存時間序列數據
 */
export function useInventoryTimeSeries(filters: {
  product_variant_id: number | null;
  start_date: string;
  end_date: string;
}) {
  return useQuery({
    queryKey: ['inventory', 'timeseries', filters],
    queryFn: async () => {
      if (!filters.product_variant_id) {
        throw new Error('必須指定商品變體 ID');
      }
      
      const { data, error } = await apiClient.GET('/api/reports/inventory-time-series', {
        params: {
          query: {
            product_variant_id: filters.product_variant_id,
            start_date: filters.start_date,
            end_date: filters.end_date,
          }
        }
      });
      
      if (error) {
        throw new Error('獲取庫存時間序列數據失敗');
      }
      
      return data;
    },
    enabled: !!filters.product_variant_id && !!filters.start_date && !!filters.end_date,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 庫存批量檢查 Hook
 */
export function useInventoryBatchCheck() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      product_variant_ids: string[]; 
      store_id?: number; 
      items?: Array<{ sku: string; quantity: number }> 
    }) => {
      const { data: response, error } = await apiClient.POST('/api/inventory/batch-check', {
        body: data
      });
      if (error) {
        throw new Error('批量庫存檢查失敗');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
