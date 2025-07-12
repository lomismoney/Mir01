import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { paths } from '@/types/api';

interface LowStockItem {
  id: number;
  product_variant_id: number;
  store_id: number;
  store_name: string;
  product_name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  shortage: number;
  severity: 'critical' | 'low' | 'normal';
  last_sale_date: string | null;
  average_daily_sales: number;
  estimated_days_until_stockout: number | null;
}

// 使用從 API 生成的類型而不是本地定義
type InventoryAlertSummaryResponse = paths['/api/inventory/alerts/summary']['get']['responses'][200]['content']['application/json'];
type InventoryAlertSummary = NonNullable<InventoryAlertSummaryResponse['data']>;

interface LowStockParams {
  store_id?: number;
  severity?: 'critical' | 'low' | 'all';
  page?: number;
  per_page?: number;
}

export function useLowStockItems(params: LowStockParams = {}) {
  return useQuery({
    queryKey: ['inventory-alerts', 'low-stock', params],
    queryFn: async () => {
      const query: Record<string, any> = {};
      
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
      
      return response.data;
    },
  });
}

export function useInventoryAlertSummary(storeId?: number) {
  return useQuery({
    queryKey: ['inventory-alerts', 'summary', storeId],
    queryFn: async (): Promise<InventoryAlertSummary> => {
      const query: Record<string, any> = {};
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
      return response.data?.data as InventoryAlertSummary;
    },
  });
}

interface ThresholdUpdate {
  inventory_id: number;
  low_stock_threshold: number;
}

export async function updateInventoryThresholds(updates: ThresholdUpdate[]) {
  const response = await apiClient.POST('/api/inventory/alerts/update-thresholds', {
    body: updates as any // 臨時類型修復
  });
  
  if (response.error) {
    throw new Error('更新庫存門檻失敗');
  }
  
  return response.data;
}