import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateBackorderTransferStatus } from '../useUpdateBackorderTransferStatus';
import { apiClient } from '@/lib/apiClient';

// Mock API client
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    POST: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

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

describe('useUpdateBackorderTransferStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該成功更新轉移狀態', async () => {
    const mockResponse = {
      message: '轉移狀態更新成功',
      data: {
        item_id: 1,
        transfer_id: 10,
        new_status: 'completed',
        integrated_status: 'transfer_completed',
        integrated_status_text: '調撥完成',
      },
    };

    mockApiClient.POST.mockResolvedValueOnce({
      data: mockResponse,
      response: {} as any,
    });

    const { result } = renderHook(() => useUpdateBackorderTransferStatus(), {
      wrapper: createWrapper(),
    });

    const params = {
      item_id: 1,
      status: 'completed',
      notes: '貨品已到達',
    };

    result.current.mutate(params);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.POST).toHaveBeenCalledWith(
      '/api/backorders/update-transfer-status',
      {
        body: params,
      }
    );

    expect(result.current.data).toEqual(mockResponse);
  });

  it('應該處理 API 錯誤', async () => {
    const errorMessage = '此訂單項目沒有相關的庫存轉移記錄';

    mockApiClient.POST.mockResolvedValueOnce({
      error: {
        message: errorMessage,
      },
      response: {} as any,
    });

    const { result } = renderHook(() => useUpdateBackorderTransferStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      item_id: 1,
      status: 'completed',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('應該在成功後無效化相關查詢', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    mockApiClient.POST.mockResolvedValueOnce({
      data: {
        message: '成功',
        data: {
          item_id: 1,
          transfer_id: 10,
          new_status: 'completed',
          integrated_status: 'transfer_completed',
          integrated_status_text: '調撥完成',
        },
      },
      response: {} as any,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateBackorderTransferStatus(), {
      wrapper,
    });

    result.current.mutate({
      item_id: 1,
      status: 'completed',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // 檢查是否無效化了正確的查詢
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['backorders'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inventory-transfers'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['orders'] });
  });

  it('應該處理沒有提供備註的情況', async () => {
    mockApiClient.POST.mockResolvedValueOnce({
      data: {
        message: '成功',
        data: {
          item_id: 1,
          transfer_id: 10,
          new_status: 'in_transit',
          integrated_status: 'transfer_in_transit',
          integrated_status_text: '庫存調撥中',
        },
      },
      response: {} as any,
    });

    const { result } = renderHook(() => useUpdateBackorderTransferStatus(), {
      wrapper: createWrapper(),
    });

    // 不提供 notes
    const params = {
      item_id: 1,
      status: 'in_transit',
    };

    result.current.mutate(params);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // 檢查 API 調用時 notes 是否為 undefined
    expect(mockApiClient.POST).toHaveBeenCalledWith(
      '/api/backorders/update-transfer-status',
      {
        body: {
          item_id: 1,
          status: 'in_transit',
        },
      }
    );
  });
});