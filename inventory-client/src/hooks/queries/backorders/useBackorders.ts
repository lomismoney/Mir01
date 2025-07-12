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

/**
 * 獲取預訂商品統計資料
 * 
 * @returns 解包後的統計資料，直接包含 total_items、unique_products 等欄位
 */
export function useBackorderStats() {
  return useQuery({
    queryKey: ['backorder-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.GET('/api/backorders/stats', {});
        // 確保有錯誤處理
        if (response.error) {
          console.error('API 錯誤回應:', response.error);
          throw new Error('獲取待進貨統計失敗');
        }
        // 檢查回應數據
        if (!response.data) {
          console.warn('API 回應沒有 data 欄位');
          return {
            data: {
              total_items: 0,
              unique_products: 0,
              days_pending: 0,
            }
          };
        }
        return response.data;
      } catch (error) {
        console.error('useBackorderStats 請求失敗:', error);
        throw error;
      }
    },
    // 🎯 數據精煉廠：解包 API 回應的 data 欄位
    select: (response: any) => {
      // 如果 response 是 undefined，返回預設值
      if (!response) {
        console.warn('select: response 是 undefined');
        return {
          total_items: 0,
          unique_products: 0,
          days_pending: 0,
        };
      }
      // 如果 API 回應有 data 欄位，直接回傳 data 內容
      // 否則回傳整個回應（向後兼容）
      const result = response?.data || response;
      return result || {
        total_items: 0,
        unique_products: 0,
        days_pending: 0,
      };
    },
    // 添加重試和錯誤處理配置
    retry: 1,
    retryDelay: 1000,
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