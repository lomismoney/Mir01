import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  usePurchases,
  usePurchase,
  useCreatePurchase,
  useUpdatePurchase,
  useUpdatePurchaseStatus,
  useCancelPurchase,
  useDeletePurchase
} from '../usePurchases';
import apiClient from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  PATCH: jest.fn(),
  DELETE: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Create a wrapper component for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePurchases hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePurchases', () => {
    it('should fetch purchases list successfully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            order_number: 'PUR-001',
            store_id: 1,
            status: 'pending',
            shipping_cost: 100,
            purchased_at: '2023-01-01'
          }
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        links: { first: 'first', last: 'last' }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchases(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: mockData.data,
        meta: mockData.meta,
        links: mockData.links
      });
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/purchases', {
        params: { query: {} }
      });
    });

    it('should handle filters properly', async () => {
      const params = {
        store_id: 1,
        status: 'completed',
        order_number: 'PUR-001',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        page: 1,
        per_page: 20,
        sort: 'created_at:desc'
      };

      const mockData = { data: [], meta: {}, links: {} };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchases(params), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/purchases', {
        params: {
          query: {
            'filter[store_id]': 1,
            'filter[status]': 'completed',
            'filter[order_number]': 'PUR-001',
            'filter[start_date]': '2023-01-01',
            'filter[end_date]': '2023-12-31',
            page: 1,
            per_page: 20,
            sort: 'created_at:desc'
          }
        }
      });
    });

    it('should handle array response without meta/links', async () => {
      const mockData = [
        {
          id: 1,
          order_number: 'PUR-001',
          store_id: 1,
          status: 'pending'
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchases(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: mockData,
        meta: null,
        links: null
      });
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => usePurchases(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取進貨單列表失敗'));
    });

    it('should handle non-array data gracefully', async () => {
      const mockData = {
        data: { invalid: 'structure' },
        meta: null,
        links: null
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchases(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [],
        meta: null,
        links: null
      });
    });
  });

  describe('usePurchase', () => {
    it('should fetch single purchase successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          order_number: 'PUR-001',
          store_id: 1,
          status: 'pending',
          shipping_cost: 100,
          items: [
            {
              id: 1,
              product_variant_id: 1,
              quantity: 10,
              cost_price: 50
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchase(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData.data);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/purchases/{id}', {
        params: { path: { id: '1' } }
      });
    });

    it('should handle string ID', async () => {
      const mockData = { data: { id: 1, order_number: 'PUR-001' } };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => usePurchase('1'), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/purchases/{id}', {
        params: { path: { id: '1' } }
      });
    });

    it('should not fetch when id is falsy', () => {
      const { result } = renderHook(() => usePurchase(0), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Purchase not found' }
      });

      const { result } = renderHook(() => usePurchase(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取進貨單失敗'));
    });
  });

  describe('useCreatePurchase', () => {
    it('should create purchase successfully', async () => {
      const mockData = { id: 1, order_number: 'PUR-001' };
      const purchaseData = {
        store_id: 1,
        order_number: 'PUR-001',
        purchased_at: '2023-01-01',
        shipping_cost: 100,
        status: 'pending',
        items: [
          {
            product_variant_id: 1,
            quantity: 10,
            cost_price: 50
          }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreatePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(purchaseData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/purchases', {
        body: purchaseData
      });
    });

    it('should handle error during creation', async () => {
      const purchaseData = {
        store_id: 1,
        shipping_cost: 100,
        items: [
          {
            product_variant_id: 1,
            quantity: 10,
            cost_price: 50
          }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Creation failed' }
      });

      const { result } = renderHook(() => useCreatePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(purchaseData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('創建進貨單失敗'));
    });

    it('should create purchase with minimal data', async () => {
      const mockData = { id: 2, order_number: 'PUR-002' };
      const minimalData = {
        store_id: 1,
        shipping_cost: 0,
        items: [
          {
            product_variant_id: 1,
            quantity: 5,
            cost_price: 25
          }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreatePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(minimalData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/purchases', {
        body: minimalData
      });
    });
  });

  describe('useUpdatePurchase', () => {
    it('should update purchase successfully', async () => {
      const mockData = { id: 1, updated: true };
      const updateData = {
        order_number: 'PUR-001-UPDATED',
        shipping_cost: 150,
        status: 'completed'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdatePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/purchases/{id}', {
        params: { path: { id: '1' } },
        body: updateData
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        shipping_cost: 200
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const { result } = renderHook(() => useUpdatePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('更新進貨單失敗'));
    });
  });

  describe('useUpdatePurchaseStatus', () => {
    it('should update purchase status successfully', async () => {
      const mockData = { id: 1, status: 'completed' };

      mockApiClient.PATCH.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdatePurchaseStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        id: 1,
        status: 'completed',
        notes: 'Purchase completed successfully'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PATCH).toHaveBeenCalledWith('/api/purchases/{id}/status', {
        params: { path: { id: '1' } },
        body: { status: 'completed', notes: 'Purchase completed successfully' }
      });
    });

    it('should update status without notes', async () => {
      const mockData = { id: 1, status: 'cancelled' };

      mockApiClient.PATCH.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdatePurchaseStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        id: 1,
        status: 'cancelled'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.PATCH).toHaveBeenCalledWith('/api/purchases/{id}/status', {
        params: { path: { id: '1' } },
        body: { status: 'cancelled', notes: undefined }
      });
    });

    it('should handle error during status update', async () => {
      mockApiClient.PATCH.mockResolvedValueOnce({
        data: null,
        error: { message: 'Status update failed' }
      });

      const { result } = renderHook(() => useUpdatePurchaseStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        id: 1,
        status: 'invalid_status'
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('更新進貨單狀態失敗'));
    });
  });

  describe('useCancelPurchase', () => {
    it('should cancel purchase successfully', async () => {
      const mockData = { id: 1, status: 'cancelled' };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCancelPurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        id: 1,
        reason: 'Supplier unavailable'
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/purchases/{id}/cancel', {
        params: { path: { id: '1' } },
        body: { reason: 'Supplier unavailable' }
      });
    });

    it('should cancel purchase without reason', async () => {
      const mockData = { id: 1, status: 'cancelled' };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCancelPurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/purchases/{id}/cancel', {
        params: { path: { id: '1' } },
        body: { reason: undefined }
      });
    });

    it('should handle error during cancellation', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Cannot cancel completed purchase' }
      });

      const { result } = renderHook(() => useCancelPurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('取消進貨單失敗'));
    });
  });

  describe('useDeletePurchase', () => {
    it('should delete purchase successfully', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeletePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/purchases/{id}', {
        params: { path: { id: '1' } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Cannot delete purchase with items' }
      });

      const { result } = renderHook(() => useDeletePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('刪除進貨單失敗'));
    });

    it('should handle deletion with multiple different IDs', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeletePurchase(), {
        wrapper: createWrapper()
      });

      result.current.mutate(999);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/purchases/{id}', {
        params: { path: { id: '999' } }
      });
    });
  });
});