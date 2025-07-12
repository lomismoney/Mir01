import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface BackorderFilters {
  group_by_variant?: boolean;
  date_from?: string;
  date_to?: string;
  product_variant_id?: number;
}

export function useBackorders(filters: BackorderFilters = {}) {
  return useQuery({
    queryKey: ['backorders', filters],
    queryFn: async () => {
      const response = await apiClient.GET('/api/backorders', {
        params: { query: filters },
      });
      return response.data;
    },
  });
}

export function useBackorderStats() {
  return useQuery({
    queryKey: ['backorder-stats'],
    queryFn: async () => {
      const response = await apiClient.GET('/api/backorders/stats', {});
      return response.data;
    },
  });
}

export function useBackorderSummary(filters: {
  store_id?: number;
  date_from?: string;
  date_to?: string;
} = {}) {
  return useQuery({
    queryKey: ['backorder-summary', filters],
    queryFn: async () => {
      const response = await apiClient.GET('/api/backorders/summary', {
        params: { query: filters },
      });
      return response.data;
    },
  });
}

interface ConvertBackorderRequest {
  item_ids: string[]; // 修復類型匹配問題
  order_item_ids?: number[];
  purchase_id?: number;
  expected_arrival_date?: string;
  notes?: string;
  store_id?: number | null;
}

export function useConvertBackorderMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ConvertBackorderRequest) => {
      const response = await apiClient.POST('/api/backorders/convert', {
        body: data
      });
      
      if (response.error) {
        throw new Error('轉換預訂失敗');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // 刷新相關查詢
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}