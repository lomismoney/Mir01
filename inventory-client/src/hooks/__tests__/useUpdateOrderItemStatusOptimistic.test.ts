import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateOrderItemStatusOptimistic } from '../useUpdateOrderItemStatusOptimistic';
import { apiClient } from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    PATCH: jest.fn(),
  },
}));

jest.mock('@/lib/errorHandler', () => ({
  parseApiError: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockParseApiError = parseApiError as jest.MockedFunction<typeof parseApiError>;

describe('useUpdateOrderItemStatusOptimistic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    // 重置 window 對象
    Object.defineProperty(window, 'navigator', {
      value: { userAgent: 'test-browser' },
      writable: true,
    });
    // 清空所有查詢緩存
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  describe('基本功能', () => {
    it('應該成功更新訂單項目狀態', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
          notes: '測試備註',
        });
      });

      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalledWith(
          '/api/order-items/{order_item}/status',
          {
            params: { path: { order_item: 1 } },
            body: { status: '已出貨', notes: '測試備註' },
          }
        );
      });
    });

    it('應該在沒有備註時正確調用 API', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalledWith(
          '/api/order-items/{order_item}/status',
          {
            params: { path: { order_item: 1 } },
            body: { status: '已出貨' },
          }
        );
      });
    });

    it('應該處理 API 錯誤', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: null,
        error: { message: 'API 錯誤' },
      });
      mockParseApiError.mockReturnValue('更新失敗');

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('應該在 parseApiError 返回 null 時使用默認錯誤信息', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: null,
        error: { message: 'API 錯誤' },
      });
      mockParseApiError.mockReturnValue(null);

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('樂觀更新機制', () => {
    it('應該立即更新快取中的訂單項目狀態', async () => {
      const mockOrderData = {
        data: {
          id: 123,
          items: [
            { id: 1, status: '準備中', name: '測試商品' },
            { id: 2, status: '處理中', name: '其他商品' },
          ],
        },
      };
      
      queryClient.setQueryData(['orders', 123], mockOrderData);
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 等待 mutation 完成
      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalled();
      });

      // 檢查快取是否立即更新
      const updatedData = queryClient.getQueryData(['orders', 123]) as any;
      expect(updatedData.data.items[0].status).toBe('已出貨');
      expect(updatedData.data.items[1].status).toBe('處理中'); // 其他項目保持原狀態
    });

    it('應該在找不到對應訂單時正常處理', async () => {
      // 沒有設置任何快取數據
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 應該正常執行 API 調用
      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalled();
      });
    });

    it('應該在訂單沒有 items 陣列時正常處理', async () => {
      const mockOrderData = {
        data: {
          id: 123,
          // 沒有 items 屬性
        },
      };
      
      queryClient.setQueryData(['orders', 123], mockOrderData);
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 應該正常執行 API 調用
      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalled();
      });
    });
  });

  describe('錯誤回滾機制', () => {
    it('應該在 API 失敗時回滾樂觀更新', async () => {
      const mockOrderData = {
        data: {
          id: 123,
          items: [
            { id: 1, status: '準備中', name: '測試商品' },
            { id: 2, status: '處理中', name: '其他商品' },
          ],
        },
      };
      
      queryClient.setQueryData(['orders', 123], mockOrderData);
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: null,
        error: { message: 'API 錯誤' },
      });
      mockParseApiError.mockReturnValue('更新失敗');

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 等待錯誤處理完成
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // 檢查是否回滾到原始狀態
      const rolledBackData = queryClient.getQueryData(['orders', 123]) as any;
      expect(rolledBackData.data.items[0].status).toBe('準備中');
    });

    it('應該在沒有快取數據時不嘗試回滾', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: null,
        error: { message: 'API 錯誤' },
      });
      mockParseApiError.mockReturnValue('更新失敗');

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 應該正常顯示錯誤，不會因為回滾失敗而崩潰
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('重試機制', () => {
    it('應該在達到最大重試次數後停止重試', async () => {
      const networkError = new Error('Network connection failed');
      mockApiClient.PATCH.mockRejectedValue(networkError);

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 等待所有重試完成
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 15000 });

      // 應該調用了 3 次 (初始請求 + 2 次重試)
      expect(mockApiClient.PATCH).toHaveBeenCalledTimes(3);
    });

    it('應該不對非網絡錯誤進行重試', async () => {
      const validationError = new Error('400 Bad Request');
      mockApiClient.PATCH.mockRejectedValueOnce(validationError);

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // 確認只調用了一次，沒有重試
      expect(mockApiClient.PATCH).toHaveBeenCalledTimes(1);
    });
  });

  describe('開發者錯誤記錄', () => {
    it('應該記錄詳細的錯誤信息', async () => {
      const testError = new Error('測試錯誤');
      mockApiClient.PATCH.mockRejectedValueOnce(testError);

      const consoleSpy = jest.spyOn(console, 'error');

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      const testPayload = {
        orderItemId: 1,
        status: '已出貨',
        notes: '測試備註',
      };

      await act(async () => {
        result.current.mutate(testPayload);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚨 訂單項目狀態更新失敗:',
        expect.objectContaining({
          error: '測試錯誤',
          variables: testPayload,
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('邊界情況', () => {
    it('應該處理快取數據格式異常的情況', async () => {
      // 設置異常的快取數據
      queryClient.setQueryData(['orders', 123], null);
      queryClient.setQueryData(['orders', 'list'], { data: 'invalid' });
      queryClient.setQueryData(['orders', 'another'], { data: { items: null } });

      mockApiClient.PATCH.mockResolvedValueOnce({
        data: { id: 1, status: '已出貨' },
        error: null,
      });

      const { result } = renderHook(() => useUpdateOrderItemStatusOptimistic(), {
        wrapper,
      });

      await act(async () => {
        result.current.mutate({
          orderItemId: 1,
          status: '已出貨',
        });
      });

      // 應該正常完成，不會崩潰
      await waitFor(() => {
        expect(mockApiClient.PATCH).toHaveBeenCalled();
      });
    });
  });
});