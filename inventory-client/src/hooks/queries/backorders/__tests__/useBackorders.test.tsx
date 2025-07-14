import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useBackorders, useBackorderStats, useBackorderSummary } from '../useBackorders';
import { apiClient } from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
    PUT: jest.fn(),
    DELETE: jest.fn(),
  },
}));

// Mock next-auth/react to prevent authentication errors in tests
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
      },
      accessToken: 'test-token-123',
    },
    status: 'authenticated',
  })),
  getSession: jest.fn(() => Promise.resolve({
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
    accessToken: 'test-token-123',
  })),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test data
const mockBackorders = {
  data: [
    {
      id: 1,
      product_variant_id: 1,
      store_id: 1,
      quantity: 5,
      status: 'pending',
      created_at: '2024-01-15T10:00:00Z',
      expected_restock_date: '2024-01-20T00:00:00Z',
      product_variant: {
        id: 1,
        sku: 'IPH15PRO128',
        product: {
          id: 1,
          name: 'iPhone 15 Pro',
        },
      },
      store: {
        id: 1,
        name: '主門市',
      },
    },
    {
      id: 2,
      product_variant_id: 2,
      store_id: 1,
      quantity: 3,
      status: 'fulfilled',
      created_at: '2024-01-12T14:30:00Z',
      expected_restock_date: '2024-01-18T00:00:00Z',
      product_variant: {
        id: 2,
        sku: 'SGS24256',
        product: {
          id: 2,
          name: 'Samsung Galaxy S24',
        },
      },
      store: {
        id: 1,
        name: '主門市',
      },
    },
  ],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: 'http://localhost/api/backorders',
    per_page: 15,
    to: 2,
    total: 2,
  },
};

// API 回應格式（包含 data wrapper）
const mockBackorderStatsResponse = {
  data: {
    total_backorders: 15,
    pending_backorders: 8,
    fulfilled_backorders: 7,
    total_quantity: 45,
    average_fulfillment_time_hours: 72,
    top_backordered_products: [
      {
        product_variant_id: 1,
        product_name: 'iPhone 15 Pro',
        sku: 'IPH15PRO128',
        total_quantity: 12,
      },
      {
        product_variant_id: 2,
        product_name: 'Samsung Galaxy S24',
        sku: 'SGS24256',
        total_quantity: 8,
      },
    ],
  },
};

// 預期的解包後數據（Hook 的 select 函數會移除 data wrapper）
const mockBackorderStats = {
  total_backorders: 15,
  pending_backorders: 8,
  fulfilled_backorders: 7,
  total_quantity: 45,
  average_fulfillment_time_hours: 72,
  top_backordered_products: [
    {
      product_variant_id: 1,
      product_name: 'iPhone 15 Pro',
      sku: 'IPH15PRO128',
      total_quantity: 12,
    },
    {
      product_variant_id: 2,
      product_name: 'Samsung Galaxy S24',
      sku: 'SGS24256',
      total_quantity: 8,
    },
  ],
};

const mockBackorderSummary = {
  data: {
    summary: {
      total_orders: 25,
      pending_orders: 10,
      fulfilled_orders: 15,
      total_value: 125000,
      pending_value: 50000,
    },
    trends: {
      daily_backorders: [
        { date: '2024-01-15', count: 3, value: 15000 },
        { date: '2024-01-16', count: 2, value: 10000 },
        { date: '2024-01-17', count: 5, value: 25000 },
      ],
    },
    top_stores: [
      {
        store_id: 1,
        store_name: '主門市',
        backorder_count: 8,
        total_value: 40000,
      },
      {
        store_id: 2,
        store_name: '分店A',
        backorder_count: 5,
        total_value: 25000,
      },
    ],
  },
};

// Helper function to create wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        retryDelay: 0,
      },
      mutations: { 
        retry: false,
        retryDelay: 0,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('useBackorders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useBackorders', () => {
    it('應該成功獲取預訂商品列表', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const { result } = renderHook(() => useBackorders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
        params: { query: {} },
      });
      expect(result.current.data).toEqual(mockBackorders.data);
    });

    it('應該使用正確的查詢參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = {
        group_by_variant: true,
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        product_variant_id: 1,
      };

      renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: filters },
        });
      });
    });

    it('應該處理部分參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = {
        group_by_variant: true,
        date_from: '2024-01-01',
      };

      renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: filters },
        });
      });
    });

    it('應該處理空參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      renderHook(() => useBackorders({}), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: {} },
        });
      });
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Network error');
      mockApiClient.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useBackorders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('應該使用正確的查詢鍵包含篩選器', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = { group_by_variant: true };
      
      const { result } = renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 驗證 API 調用包含正確的參數
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
        params: { query: filters },
      });
    });
  });

  describe('useBackorderStats', () => {
    it('應該成功獲取預訂統計資料', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderStatsResponse, error: null });

      const { result } = renderHook(() => useBackorderStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/stats', {});
      expect(result.current.data).toEqual(mockBackorderStats);
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.GET.mockRejectedValue(error);

      const { result } = renderHook(() => useBackorderStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(error);
    });

    it('應該使用正確的查詢鍵', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderStatsResponse, error: null });

      const { result } = renderHook(() => useBackorderStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 驗證 API 調用正確
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/stats', {});
    });
  });

  describe('useBackorderSummary', () => {
    it('應該成功獲取預訂摘要', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderSummary, error: null });

      const { result } = renderHook(() => useBackorderSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
        params: { query: {} },
      });
      expect(result.current.data).toEqual(mockBackorderSummary);
    });

    it('應該使用正確的查詢參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderSummary, error: null });

      const filters = {
        store_id: 1,
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      };

      renderHook(() => useBackorderSummary(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
          params: { query: filters },
        });
      });
    });

    it('應該處理部分參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderSummary, error: null });

      const filters = {
        store_id: 1,
      };

      renderHook(() => useBackorderSummary(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
          params: { query: filters },
        });
      });
    });

    it('應該處理 API 錯誤', async () => {
      const error = new Error('Server error');
      mockApiClient.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useBackorderSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('應該使用正確的查詢鍵包含篩選器', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderSummary, error: null });

      const filters = { store_id: 2 };
      
      const { result } = renderHook(() => useBackorderSummary(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 驗證 API 調用包含正確的參數
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
        params: { query: filters },
      });
    });
  });

  describe('邊界情況', () => {
    it('useBackorders 應該處理 undefined 參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      renderHook(() => useBackorders(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: {} },
        });
      });
    });

    it('useBackorderSummary 應該處理 undefined 參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorderSummary, error: null });

      renderHook(() => useBackorderSummary(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
          params: { query: {} },
        });
      });
    });

    it('應該處理空字串日期參數', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = {
        date_from: '',
        date_to: '',
      };

      renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: filters },
        });
      });
    });

    it('應該處理 0 作為 product_variant_id', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = {
        product_variant_id: 0,
      };

      renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: filters },
        });
      });
    });

    it('應該處理 false 作為 group_by_variant', async () => {
      mockApiClient.GET.mockResolvedValueOnce({ data: mockBackorders.data, error: null });

      const filters = {
        group_by_variant: false,
      };

      renderHook(() => useBackorders(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: filters },
        });
      });
    });
  });

  describe('緩存行為', () => {
    it('useBackorders 應該根據篩選器變化重新查詢', async () => {
      mockApiClient.GET.mockResolvedValue(mockBackorders);

      const { rerender } = renderHook(
        ({ filters }: { filters: any }) => useBackorders(filters),
        {
          wrapper: createWrapper(),
          initialProps: { filters: { group_by_variant: true } },
        }
      );

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: { group_by_variant: true } },
        });
      });

      // 清除調用記錄並重新渲染不同的篩選器
      mockApiClient.GET.mockClear();
      
      rerender({ filters: { date_from: '2024-01-01' } });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders', {
          params: { query: { date_from: '2024-01-01' } },
        });
      });
    });

    it('useBackorderSummary 應該根據篩選器變化重新查詢', async () => {
      mockApiClient.GET.mockResolvedValue(mockBackorderSummary);

      const { rerender } = renderHook(
        ({ filters }: { filters: any }) => useBackorderSummary(filters),
        {
          wrapper: createWrapper(),
          initialProps: { filters: { store_id: 1 } },
        }
      );

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
          params: { query: { store_id: 1 } },
        });
      });

      // 清除調用記錄並重新渲染不同的篩選器
      mockApiClient.GET.mockClear();
      
      rerender({ filters: { store_id: 2 } });

      await waitFor(() => {
        expect(mockApiClient.GET).toHaveBeenCalledWith('/api/backorders/summary', {
          params: { query: { store_id: 2 } },
        });
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該處理網路超時錯誤', async () => {
      const error = new Error('Request timeout');
      mockApiClient.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useBackorders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });

    it('應該處理 404 錯誤', async () => {
      const error = new Error('Not found');
      mockApiClient.GET.mockRejectedValue(error);

      const { result } = renderHook(() => useBackorderStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(error);
    });

    it('應該處理權限錯誤', async () => {
      const error = new Error('Forbidden');
      mockApiClient.GET.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useBackorderSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});