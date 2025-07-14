import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

interface BackorderFilters {
  group_by_variant?: boolean;
  date_from?: string;
  date_to?: string;
  product_variant_id?: number;
}

interface BackorderStatsData {
  total_items: number;
  unique_products: number;
  affected_orders: number;
  total_quantity: number;
  oldest_backorder_date: string | null;
  days_pending: number;
}

interface BackorderStatsResponse {
  data: BackorderStatsData;
}

/**
 * 獲取待進貨清單資料
 * 
 * @param filters 篩選條件
 * @returns 待進貨清單查詢結果
 */
export function useBackorders(filters: BackorderFilters = {}) {
  return useQuery({
    queryKey: ['backorders', filters],
    queryFn: async () => {
      const response = await apiClient.GET('/api/backorders', {
        params: { query: filters },
      });
      
      // 🔧 修復類型錯誤：正確處理 openapi-fetch 的返回類型
      if (!response.data) {
        console.error('API 錯誤回應:', response);
        throw new Error('獲取待進貨清單失敗');
      }
      
      return response.data;
    },
    select: (data) => {
      // 確保數據格式正確
      return data || { data: [] };
    },
  });
}

/**
 * 獲取預訂商品統計資料
 * 
 * @returns 解包後的統計資料，直接包含 total_items、unique_products 等欄位
 */
export function useBackorderStats() {
  return useQuery<BackorderStatsResponse, Error, BackorderStatsData>({
    queryKey: ['backorder-stats'],
    queryFn: async (): Promise<BackorderStatsResponse> => {
      try {
        const response = await apiClient.GET('/api/backorders/stats', {});
        
        // 🔧 修復類型錯誤：正確處理 openapi-fetch 的返回類型
        if (!response.data) {
          console.error('API 錯誤回應:', response);
          throw new Error('獲取待進貨統計失敗');
        }
        
        // 檢查回應數據
        if (!response.data) {
          console.warn('API 回應沒有 data 欄位');
          return {
            data: {
              total_items: 0,
              unique_products: 0,
              affected_orders: 0,
              total_quantity: 0,
              oldest_backorder_date: null,
              days_pending: 0,
            }
          };
        }
        return response.data as BackorderStatsResponse;
      } catch (error) {
        console.error('useBackorderStats 請求失敗:', error);
        throw error;
      }
    },
    // 🎯 數據精煉廠：解包 API 回應的 data 欄位
    select: (response: BackorderStatsResponse): BackorderStatsData => {
      // 如果 response 是 undefined，返回預設值
      if (!response) {
        console.warn('select: response 是 undefined');
        return {
          total_items: 0,
          unique_products: 0,
          affected_orders: 0,
          total_quantity: 0,
          oldest_backorder_date: null,
          days_pending: 0,
        };
      }
      // 如果 API 回應有 data 欄位，直接回傳 data 內容
      // 否則回傳整個回應（向後兼容）
      const result = response?.data || response;
      return result || {
        total_items: 0,
        unique_products: 0,
        affected_orders: 0,
        total_quantity: 0,
        oldest_backorder_date: null,
        days_pending: 0,
      };
    },
    // 添加重試和錯誤處理配置
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * 獲取預訂商品彙總資料
 * 
 * @param filters 篩選條件
 * @returns 預訂商品彙總查詢結果
 */
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
      
      // 🔧 修復類型錯誤：確保返回有效數據
      if (!response.data) {
        console.error('API 錯誤回應:', response);
        throw new Error('獲取預訂商品彙總失敗');
      }
      
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

/**
 * 轉換預訂為進貨單的變異函數
 * 
 * @returns 轉換預訂的變異函數
 */
export function useConvertBackorderMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ConvertBackorderRequest) => {
      const response = await apiClient.POST('/api/backorders/convert', {
        body: data
      });
      
      // 🔧 修復類型錯誤：正確處理 openapi-fetch 的返回類型
      if (!response.data) {
        console.error('API 錯誤回應:', response);
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