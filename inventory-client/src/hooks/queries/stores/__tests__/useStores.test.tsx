import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useStores,
  useStore,
  useCreateStore,
  useUpdateStore,
  useDeleteStore
} from '../useStores';
import apiClient from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
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

describe('useStores hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useStores', () => {
    it('should fetch stores list successfully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'Main Store',
              address: '123 Main St',
              phone: '1234567890',
              status: 'active',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              inventory_count: 100,
              users_count: 5
            },
            {
              id: 2,
              name: 'Branch Store',
              address: '456 Oak St',
              phone: '0987654321',
              status: 'active',
              created_at: '2023-01-02T00:00:00Z',
              updated_at: '2023-01-02T00:00:00Z',
              inventory_count: 50,
              users_count: 3
            }
          ],
          meta: {
            total: 2,
            per_page: 100,
            current_page: 1,
            last_page: 1
          }
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Main Store',
          address: '123 Main St',
          phone: '1234567890',
          status: 'active',
          inventory_count: 100,
          users_count: 5
        })
      );
      expect(result.current.data?.meta).toEqual(mockData.data.meta);

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/stores');
    });

    it('should handle direct array response', async () => {
      const mockData: Array<{ id: number; name: string; address: string; status: string }> = [
        {
          id: 1,
          name: 'Store 1',
          address: '123 Main St',
          status: 'active'
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.meta).toEqual({
        total: 1,
        per_page: 100,
        current_page: 1,
        last_page: 1
      });
    });

    it('should handle stores with missing fields', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            // Missing name and other fields
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: '未命名門市',
          address: null,
          phone: null,
          status: 'active',
          created_at: '',
          updated_at: '',
          inventory_count: 0,
          users_count: 0
        })
      );
    });

    it('should handle non-array response', async () => {
      const mockData = { invalid: 'structure' };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([]);
      expect(result.current.data?.meta).toEqual({
        total: 0,
        per_page: 100,
        current_page: 1,
        last_page: 1
      });
    });

    it('should handle params in meta generation', async () => {
      const mockData: any[] = [];
      const params = { page: 2, per_page: 50 };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(params), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.meta).toEqual({
        total: 0,
        per_page: 50,
        current_page: 2,
        last_page: 1
      });
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取門市列表失敗'));
    });
  });

  describe('useStore', () => {
    it('should fetch single store successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          name: 'Main Store',
          address: '123 Main St',
          phone: '1234567890',
          status: 'active'
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStore(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData.data);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/stores/{store}', {
        params: { path: { store: 1 } }
      });
    });

    it('should not fetch when id is falsy', () => {
      const { result } = renderHook(() => useStore(0), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Store not found' }
      });

      const { result } = renderHook(() => useStore(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取門市詳情失敗'));
    });

    it('should handle null data response', async () => {
      const mockData = { data: null };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStore(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ data: null });
    });
  });

  describe('useCreateStore', () => {
    it('should create store successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'New Store' }
      };
      const storeData = {
        name: 'New Store',
        address: '789 Pine St',
        phone: '5555555555',
        status: 'active' as const,
        description: 'A new store'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(storeData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/stores', {
        body: storeData
      });
    });

    it('should create store with minimal data', async () => {
      const mockData = {
        data: { id: 2, name: 'Minimal Store' }
      };
      const minimalData = {
        name: 'Minimal Store'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(minimalData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/stores', {
        body: minimalData
      });
    });

    it('should handle error during creation', async () => {
      const storeData = {
        name: 'New Store'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Store name already exists' }
      });

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(storeData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('創建門市失敗'));
    });

    it('should handle success without store name in response', async () => {
      const mockData = { data: { id: 1 } }; // No name field
      const storeData = { name: 'Test Store' };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(storeData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useUpdateStore', () => {
    it('should update store successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'Updated Store' }
      };
      const updateData = {
        id: 1,
        body: {
          name: 'Updated Store',
          address: '999 Updated St',
          phone: '1111111111'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/stores/{store}', {
        params: { path: { store: 1 } },
        body: updateData.body
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        id: 1,
        body: {
          name: 'Updated Store'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const { result } = renderHook(() => useUpdateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('更新門市失敗'));
    });

    it('should handle partial update', async () => {
      const mockData = {
        data: { id: 1, name: 'Store' }
      };
      const updateData = {
        id: 1,
        body: {
          name: 'Store',
          status: 'inactive' as const
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/stores/{store}', {
        params: { path: { store: 1 } },
        body: { name: 'Store', status: 'inactive' }
      });
    });
  });

  describe('useDeleteStore', () => {
    it('should delete store successfully', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/stores/{store}', {
        params: { path: { store: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Store has inventory items' }
      });

      const { result } = renderHook(() => useDeleteStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('刪除門市失敗'));
    });

    it('should handle deletion of different store IDs', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteStore(), {
        wrapper: createWrapper()
      });

      result.current.mutate(999);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/stores/{store}', {
        params: { path: { store: 999 } }
      });
    });
  });

  describe('useStores data processing', () => {
    it('should handle stores with missing optional fields', async () => {
      const mockStores = [
        {
          id: 1,
          name: 'Store 1',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
          // 缺少 address, phone, inventory_count
        },
        {
          id: 2,
          // 缺少 name
          address: '123 Main St',
          phone: '555-1234',
          status: 'inactive',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          inventory_count: 50
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockStores,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([
        {
          id: 1,
          name: 'Store 1',
          address: null,
          phone: null,
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          inventory_count: 0,
          users_count: 0
        },
        {
          id: 2,
          name: '未命名門市',
          address: '123 Main St',
          phone: '555-1234',
          status: 'inactive',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
          inventory_count: 50,
          users_count: 0
        }
      ]);
    });

    it('should handle completely invalid store data', async () => {
      const mockStores = [
        {
          // 缺少 id
          name: 'Store 1'
        },
        {
          id: 2
          // 缺少其他所有字段
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockStores,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([
        {
          id: 0,
          name: 'Store 1',
          address: null,
          phone: null,
          status: 'active',
          created_at: '',
          updated_at: '',
          inventory_count: 0,
          users_count: 0
        },
        {
          id: 2,
          name: '未命名門市',
          address: null,
          phone: null,
          status: 'active',
          created_at: '',
          updated_at: '',
          inventory_count: 0,
          users_count: 0
        }
      ]);
    });

    it('should handle non-array data', async () => {
      const mockData = {
        stores: [{ id: 1, name: 'Store 1' }]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useStores(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([]);
    });
  });
});