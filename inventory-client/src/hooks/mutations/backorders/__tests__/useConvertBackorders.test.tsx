import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useConvertBackorders } from '../useConvertBackorders';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    POST: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Test data
const mockSuccessResponse = {
  data: {
    message: '成功轉換 3 個預訂項目為進貨單',
    purchase_id: 123,
    converted_items: [
      {
        backorder_item_id: 1,
        purchase_item_id: 10,
        product_variant_id: 1,
        quantity: 5,
      },
      {
        backorder_item_id: 2,
        purchase_item_id: 11,
        product_variant_id: 2,
        quantity: 3,
      },
      {
        backorder_item_id: 3,
        purchase_item_id: 12,
        product_variant_id: 3,
        quantity: 2,
      },
    ],
  },
};

const mockErrorResponse = {
  response: {
    data: {
      message: '部分商品庫存不足，無法轉換',
      errors: {
        item_ids: ['商品 1 庫存不足'],
      },
    },
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

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConvertBackorders', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Spy on queryClient methods
    jest.spyOn(queryClient, 'invalidateQueries');
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('成功場景', () => {
    it('應該成功轉換預訂為進貨單', async () => {
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      const convertData = {
        item_ids: ['1', '2', '3'],
        store_id: 1,
      };

      result.current.mutate(convertData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', { body: convertData });
      expect(result.current.data).toEqual(mockSuccessResponse.data);
    });

    it('應該處理沒有 store_id 的請求', async () => {
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      const convertData = {
        item_ids: ['1', '2'],
      };

      result.current.mutate(convertData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', { body: convertData });
    });

    it('應該處理單一項目轉換', async () => {
      const singleItemResponse = {
        data: {
          message: '成功轉換 1 個預訂項目為進貨單',
          purchase_id: 124,
          converted_items: [
            {
              backorder_item_id: 1,
              purchase_item_id: 10,
              product_variant_id: 1,
              quantity: 5,
            },
          ],
        },
      };

      mockApiClient.POST.mockResolvedValueOnce(singleItemResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      const convertData = {
        item_ids: [1],
        store_id: 1,
      };

      result.current.mutate(convertData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', { body: convertData });
      expect(result.current.data).toEqual(singleItemResponse.data);
    });
  });

  describe('成功回調處理', () => {
    it('應該顯示成功訊息', async () => {
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1, 2, 3] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('成功轉換為進貨單');
    });

    it('應該在沒有訊息時使用預設成功訊息', async () => {
      const responseWithoutMessage = {
        data: {
          purchase_id: 123,
          converted_items: [],
        },
      };

      mockApiClient.POST.mockResolvedValueOnce(responseWithoutMessage);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('成功轉換為進貨單');
    });

    it('應該清除相關查詢快取', async () => {
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: TestWrapper,
      });

      result.current.mutate({ item_ids: [1, 2, 3] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['backorders'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['backorder-stats'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['backorder-summary'] });
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['purchases'] });
    });
  });

  describe('錯誤處理', () => {
    it('應該處理 API 錯誤並顯示錯誤訊息', async () => {
      mockApiClient.POST.mockRejectedValueOnce(mockErrorResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1, 2, 3] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(mockErrorResponse.response.data.message);
      expect(result.current.error).toEqual(mockErrorResponse);
    });

    it('應該處理沒有錯誤訊息的錯誤', async () => {
      const errorWithoutMessage = new Error('Network error');
      mockApiClient.POST.mockRejectedValueOnce(errorWithoutMessage);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('轉換失敗');
      expect(result.current.error).toEqual(errorWithoutMessage);
    });

    it('應該處理網路超時錯誤', async () => {
      const timeoutError = {
        response: {
          data: {
            message: '請求超時，請稍後再試',
          },
        },
      };

      mockApiClient.POST.mockRejectedValueOnce(timeoutError);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1, 2] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(timeoutError.response.data.message);
    });

    it('應該處理權限錯誤', async () => {
      const permissionError = {
        response: {
          data: {
            message: '您沒有權限執行此操作',
          },
        },
      };

      mockApiClient.POST.mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(permissionError.response.data.message);
    });
  });

  describe('邊界情況', () => {
    it('應該處理空的 item_ids 陣列', async () => {
      const emptyResponse = {
        data: {
          message: '沒有可轉換的項目',
          purchase_id: null,
          converted_items: [],
        },
      };

      mockApiClient.POST.mockResolvedValueOnce(emptyResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', { body: { item_ids: [] } });
      expect(result.current.data).toEqual(emptyResponse.data);
    });

    it('應該處理大量項目轉換', async () => {
      const largeItemsList = Array.from({ length: 100 }, (_, i) => i + 1);
      
      const largeResponse = {
        data: {
          message: `成功轉換 ${largeItemsList.length} 個預訂項目為進貨單`,
          purchase_id: 125,
          converted_items: largeItemsList.map(id => ({
            backorder_item_id: id,
            purchase_item_id: id + 100,
            product_variant_id: id,
            quantity: 1,
          })),
        },
      };

      mockApiClient.POST.mockResolvedValueOnce(largeResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: largeItemsList, store_id: 1 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', {
        body: {
          item_ids: largeItemsList,
          store_id: 1,
        }
      });
      expect(result.current.data).toEqual(largeResponse.data);
    });

    it('應該處理 store_id 為 0 的情況', async () => {
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      const convertData = {
        item_ids: [1, 2],
        store_id: 0,
      };

      result.current.mutate(convertData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/backorders/convert', { body: convertData });
    });
  });

  describe('載入狀態', () => {
    it('應該正確顯示載入狀態', async () => {
      // 讓 API 調用延遲
      mockApiClient.POST.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSuccessResponse), 100))
      );

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ item_ids: [1, 2, 3] });

      // 等待一個 tick 後檢查載入狀態
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('重試機制', () => {
    it('應該能夠重新執行轉換', async () => {
      // 第一次調用失敗
      mockApiClient.POST.mockRejectedValueOnce(new Error('Network error'));
      // 第二次調用成功
      mockApiClient.POST.mockResolvedValueOnce(mockSuccessResponse);

      const { result } = renderHook(() => useConvertBackorders(), {
        wrapper: createWrapper(),
      });

      // 第一次嘗試
      result.current.mutate({ item_ids: [1, 2] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('轉換失敗');

      // 重置狀態並重試
      result.current.reset();
      result.current.mutate({ item_ids: [1, 2] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockToast.success).toHaveBeenCalledWith('成功轉換為進貨單');
      expect(mockApiClient.POST).toHaveBeenCalledTimes(2);
    });
  });
});