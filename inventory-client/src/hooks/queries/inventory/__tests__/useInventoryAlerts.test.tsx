import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useLowStockItems, useInventoryAlertSummary, updateInventoryThresholds } from '../useInventoryAlerts';
import { apiClient } from '@/lib/apiClient';

// Mock the API
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

const mockApi = apiClient as jest.Mocked<typeof apiClient>;

// Test data
const mockLowStockItems = {
  data: [
    {
      id: 1,
      product_variant_id: 1,
      store_id: 1,
      store_name: '主門市',
      product_name: 'iPhone 15 Pro',
      sku: 'IPH15PRO128',
      quantity: 2,
      low_stock_threshold: 10,
      shortage: 8,
      severity: 'critical' as const,
      last_sale_date: '2024-01-15T10:00:00Z',
      average_daily_sales: 1.5,
      estimated_days_until_stockout: 1,
    },
    {
      id: 2,
      product_variant_id: 2,
      store_id: 1,
      store_name: '主門市',
      product_name: 'Samsung Galaxy S24',
      sku: 'SGS24256',
      quantity: 5,
      low_stock_threshold: 15,
      shortage: 10,
      severity: 'low' as const,
      last_sale_date: '2024-01-14T15:30:00Z',
      average_daily_sales: 0.8,
      estimated_days_until_stockout: 6,
    },
  ],
  links: {
    first: 'http://localhost/api/inventory/alerts/low-stock?page=1',
    last: 'http://localhost/api/inventory/alerts/low-stock?page=1',
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: 'http://localhost/api/inventory/alerts/low-stock',
    per_page: 15,
    to: 2,
    total: 2,
  },
};

const mockAlertSummary = {
  data: {
    total_products: 150,
    critical_stock_count: 3,
    low_stock_count: 12,
    normal_stock_count: 135,
    total_inventory_value: 125000,
    alerts: {
      critical_percentage: 2.0,
      low_percentage: 8.0,
      health_score: 90.0,
    },
    top_urgent_items: [
      {
        product_name: 'iPhone 15 Pro',
        sku: 'IPH15PRO128',
        quantity: 2,
        average_daily_sales: 1.5,
      },
      {
        product_name: 'iPad Pro',
        sku: 'IPADPRO11',
        quantity: 1,
        average_daily_sales: 0.8,
      },
    ],
  },
};

// Helper function to create wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('useInventoryAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLowStockItems', () => {
    it('應該成功獲取低庫存商品列表', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {"params": {"query": {}}});
      expect(result.current.data).toEqual(mockLowStockItems);
    });

    it('應該使用正確的查詢參數', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });

      const params = {
        store_id: 1,
        severity: 'critical' as const,
        page: 2,
        per_page: 20,
      };

      renderHook(() => useLowStockItems(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {
          "params": {
            "query": {
              "store_id": 1,
              "severity": "critical",
              "page": 2,
              "per_page": 20
            }
          }
        });
      });
    });

    it('應該處理部分參數', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });

      const params = {
        store_id: 1,
        severity: 'low' as const,
      };

      renderHook(() => useLowStockItems(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {
          "params": {
            "query": {
              "store_id": 1,
              "severity": "low"
            }
          }
        });
      });
    });

    it('應該處理空參數', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });

      renderHook(() => useLowStockItems({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {"params": {"query": {}}});
      });
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Network error');
      mockApi.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useLowStockItems(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('應該使用正確的查詢鍵', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });
      
      const params = { store_id: 1, severity: 'critical' as const };
      
      const { result } = renderHook(() => useLowStockItems(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 檢查 API 調用是否使用了正確的參數  
      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {"params": {"query": {"store_id": 1, "severity": "critical"}}});
    });
  });

  describe('useInventoryAlertSummary', () => {
    it('應該成功獲取庫存警示摘要', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockAlertSummary, error: null });

      const { result } = renderHook(() => useInventoryAlertSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/summary', {"params": {"query": {}}});
      expect(result.current.data).toEqual(mockAlertSummary.data);
    });

    it('應該在提供門市 ID 時使用正確的查詢參數', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockAlertSummary, error: null });

      const storeId = 1;
      renderHook(() => useInventoryAlertSummary(storeId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/summary', {"params": {"query": {"store_id": 1}}});
      });
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Unauthorized');
      mockApi.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useInventoryAlertSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('應該使用正確的查詢鍵', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockAlertSummary, error: null });
      
      const storeId = 2;
      
      const { result } = renderHook(() => useInventoryAlertSummary(storeId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/summary', {"params": {"query": {"store_id": 2}}});
    });

    it('應該在沒有門市 ID 時使用正確的 API 路徑', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockAlertSummary, error: null });
      
      const { result } = renderHook(() => useInventoryAlertSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/summary', {"params": {"query": {}}});
    });
  });

  describe('updateInventoryThresholds', () => {
    it('應該成功更新庫存閾值', async () => {
      const mockResponse = {
        message: 'Thresholds updated successfully',
        updated_count: 2,
      };
      
      mockApi.POST.mockResolvedValueOnce({ data: mockResponse, error: null });

      const updates = [
        { inventory_id: 1, low_stock_threshold: 15 },
        { inventory_id: 2, low_stock_threshold: 20 },
      ];

      const result = await updateInventoryThresholds(updates);

      expect(mockApi.POST).toHaveBeenCalledWith('/api/inventory/alerts/update-thresholds', {
        body: updates,
      });
      expect(result).toEqual(mockResponse);
    });

    it('應該處理單一更新', async () => {
      const mockResponse = {
        message: 'Threshold updated successfully',
        updated_count: 1,
      };
      
      mockApi.POST.mockResolvedValueOnce({ data: mockResponse, error: null });

      const updates = [
        { inventory_id: 1, low_stock_threshold: 10 },
      ];

      const result = await updateInventoryThresholds(updates);

      expect(mockApi.POST).toHaveBeenCalledWith('/api/inventory/alerts/update-thresholds', {
        body: updates,
      });
      expect(result).toEqual(mockResponse);
    });

    it('應該處理空更新陣列', async () => {
      const mockResponse = {
        message: 'No updates provided',
        updated_count: 0,
      };
      
      mockApi.POST.mockResolvedValueOnce({ data: mockResponse, error: null });

      const updates: Array<{ inventory_id: number; low_stock_threshold: number }> = [];

      const result = await updateInventoryThresholds(updates);

      expect(mockApi.POST).toHaveBeenCalledWith('/api/inventory/alerts/update-thresholds', {
        body: [],
      });
      expect(result).toEqual(mockResponse);
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Validation failed');
      mockApi.POST.mockRejectedValueOnce(error);

      const updates = [
        { inventory_id: 1, low_stock_threshold: -5 }, // 無效的閾值
      ];

      await expect(updateInventoryThresholds(updates)).rejects.toThrow('Validation failed');

      expect(mockApi.POST).toHaveBeenCalledWith('/api/inventory/alerts/update-thresholds', {
        body: updates,
      });
    });

    it('應該處理網路錯誤', async () => {
      const error = new Error('Network timeout');
      mockApi.POST.mockRejectedValueOnce(error);

      const updates = [
        { inventory_id: 1, low_stock_threshold: 15 },
      ];

      await expect(updateInventoryThresholds(updates)).rejects.toThrow('Network timeout');
    });
  });

  describe('邊界情況', () => {
    it('useLowStockItems 應該處理 null 參數', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockLowStockItems, error: null });

      renderHook(() => useLowStockItems(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/low-stock', {"params": {"query": {}}});
      });
    });

    it('useInventoryAlertSummary 應該處理 0 作為門市 ID', async () => {
      mockApi.GET.mockResolvedValueOnce({ data: mockAlertSummary, error: null });

      const { result } = renderHook(() => useInventoryAlertSummary(0), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 在 JavaScript 中，0 被視為 falsy，所以應該不包含 store_id 參數
      expect(mockApi.GET).toHaveBeenCalledWith('/api/inventory/alerts/summary', {"params": {"query": {}}});
    });

    it('updateInventoryThresholds 應該處理大型更新陣列', async () => {
      const mockResponse = {
        message: 'Bulk update completed',
        updated_count: 100,
      };
      
      mockApi.POST.mockResolvedValueOnce({ data: mockResponse, error: null });

      // 創建 100 個更新項目
      const updates = Array.from({ length: 100 }, (_, index) => ({
        inventory_id: index + 1,
        low_stock_threshold: 10 + (index % 20),
      }));

      const result = await updateInventoryThresholds(updates);

      expect(mockApi.POST).toHaveBeenCalledWith('/api/inventory/alerts/update-thresholds', {
        body: updates,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});