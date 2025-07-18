/**
 * 進貨管理相關的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';

/**
 * 創建進貨單類型
 */
type CreatePurchasePayload = {
  store_id: number;
  order_number?: string;
  purchased_at?: string;
  shipping_cost: number;
  status?: string;
  items: {
    product_variant_id: number;
    quantity: number;
    cost_price: number;
  }[];
};

/**
 * 進貨單相關查詢 Hooks
 */
export function usePurchases(params?: {
  store_id?: number
  status?: string
  order_number?: string
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
  sort?: string
}) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => {
      const query: Record<string, string | number> = {}
      
      if (params?.store_id) query['filter[store_id]'] = params.store_id
      if (params?.status) query['filter[status]'] = params.status
      if (params?.order_number) query['filter[order_number]'] = params.order_number
      if (params?.start_date) query['filter[start_date]'] = params.start_date
      if (params?.end_date) query['filter[end_date]'] = params.end_date
      if (params?.page) query.page = params.page
      if (params?.per_page) query.per_page = params.per_page
      if (params?.sort) query.sort = params.sort

      const { data, error } = await apiClient.GET('/api/purchases', {
        params: { query }
      })
      
      if (error) {
        throw new Error('獲取進貨單列表失敗')
      }
      
      return data
    },
    select: (response: any) => {
      const data = response?.data || response || [];
      const meta = response?.meta || null;
      const links = response?.links || null;
      
      return {
        data: Array.isArray(data) ? data : [],
        meta: meta,
        links: links
      };
    },
    placeholderData: keepPreviousData,
  })
}

/**
 * 獲取單一進貨單
 */
export function usePurchase(id: number | string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const { data, error } = await apiClient.GET('/api/purchases/{purchase}', {
        params: { path: { purchase: numericId } }
      });
      
      if (error) {
        throw new Error('獲取進貨單失敗');
      }
      
      return data;
    },
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 創建進貨單
 */
export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePurchasePayload) => {
      const { data: response, error } = await apiClient.POST('/api/purchases', { body: data });
      if (error) {
        throw new Error('創建進貨單失敗');
      }
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * 更新進貨單
 */
export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreatePurchasePayload> }) => {
      const { data: response, error } = await apiClient.PUT('/api/purchases/{purchase}', {
        params: { path: { purchase: id } },
        body: data
      });
      if (error) {
        throw new Error('更新進貨單失敗');
      }
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * 更新進貨單狀態
 */
export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{purchase}/status', {
        params: { path: { purchase: id } },
        body: { status }
      });
      if (error) {
        // 提取具體的錯誤訊息
        const errorMessage = (error as any)?.message || '更新進貨單狀態失敗';
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * 取消進貨單
 */
export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{purchase}/cancel', {
        params: { path: { purchase: id } }
      });
      if (error) {
        throw new Error('取消進貨單失敗');
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * 刪除進貨單
 */
export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/api/purchases/{purchase}', {
        params: { path: { purchase: id } }
      });
      if (error) {
        throw new Error('刪除進貨單失敗');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * 部分收貨處理
 */
export function usePartialReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, receiptData }: { 
      id: number; 
      receiptData: {
        items: Array<{
          purchase_item_id: number;
          received_quantity: number;
        }>;
        notes?: string;
      }
    }) => {
      const { data, error } = await apiClient.POST('/api/purchases/{purchase}/partial-receipt', {
        params: { path: { purchase: id } },
        body: receiptData
      });
      if (error) {
        throw new Error('部分收貨處理失敗');
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
      await queryClient.invalidateQueries({ queryKey: ['purchase'] });
    },
  });
}

/**
 * 更新進貨單記事
 */
export function useUpdatePurchaseNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{purchase}/notes', {
        params: { path: { purchase: id } },
        body: { notes }
      });
      if (error) {
        throw new Error('更新記事失敗');
      }
      return data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
      await queryClient.invalidateQueries({ queryKey: ['purchase', variables.id] });
    },
  });
}

/**
 * 更新進貨單運費
 */
export function useUpdateShippingCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, shipping_cost }: { id: number; shipping_cost: number }) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{purchase}/shipping-cost', {
        params: { path: { purchase: id } },
        body: { shipping_cost }
      });
      if (error) {
        throw new Error('更新運費失敗');
      }
      return data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
      await queryClient.invalidateQueries({ queryKey: ['purchase', variables.id] });
    },
  });
}
