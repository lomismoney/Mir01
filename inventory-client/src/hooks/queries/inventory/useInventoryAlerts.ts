import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { LowStockResponse, InventoryAlertSummary } from '@/types/inventory';


interface LowStockParams {
  store_id?: number;
  severity?: 'critical' | 'low' | 'all';
  page?: number;
  per_page?: number;
}

export function useLowStockItems(params: LowStockParams = {}) {
  return useQuery<LowStockResponse>({
    queryKey: ['inventory-alerts', 'low-stock', params],
    queryFn: async (): Promise<LowStockResponse> => {
      const query: Record<string, string | number> = {};
      
      if (params.store_id) {
        query.store_id = params.store_id;
      }
      if (params.severity) {
        query.severity = params.severity;
      }
      if (params.page) {
        query.page = params.page;
      }
      if (params.per_page) {
        query.per_page = params.per_page;
      }
      
      const response = await apiClient.GET('/api/inventory/alerts/low-stock', {
        params: { query }
      });
      
      if (response.error) {
        throw new Error('獲取低庫存警報失敗');
      }
      
      return (response.data as LowStockResponse) || { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 }, links: { first: '', last: '', prev: null, next: null } };
    },
  });
}

export function useInventoryAlertSummary(storeId?: number) {
  return useQuery<InventoryAlertSummary>({
    queryKey: ['inventory-alerts', 'summary', storeId],
    queryFn: async (): Promise<InventoryAlertSummary> => {
      const query: Record<string, number> = {};
      if (storeId) {
        query.store_id = storeId;
      }
      
      const response = await apiClient.GET('/api/inventory/alerts/summary', {
        params: { query }
      });
      
      if (response.error) {
        throw new Error('獲取庫存警報摘要失敗');
      }
      
      // 確保返回正確的數據結構
      return (response.data as { data: InventoryAlertSummary })?.data || {
        total_products: 0,
        critical_stock_count: 0,
        low_stock_count: 0,
        alerts: {
          critical_percentage: 0,
          low_percentage: 0,
          health_score: 100,
        },
      };
    },
  });
}

interface ThresholdUpdate {
  inventory_id: number;
  low_stock_threshold: number;
}

export async function updateInventoryThresholds(updates: ThresholdUpdate[]) {
  const response = await apiClient.POST('/api/inventory/alerts/update-thresholds', {
    body: updates
  });
  
  if (response.error) {
    throw new Error('更新庫存門檻失敗');
  }
  
  return response.data || {};
}