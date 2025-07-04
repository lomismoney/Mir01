import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
  CategoryNode
} from '../useCategories';
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

// Mock the error handler
jest.mock('@/lib/errorHandler', () => ({
  parseApiError: jest.fn((error) => error?.message || 'API Error')
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

describe('useCategories hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
    // Mock console.error for error tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useCategories', () => {
    it('should fetch categories and build tree structure successfully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            name: 'Electronics',
            description: 'Electronic products',
            parent_id: null,
            sort_order: 1,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            products_count: 5,
            total_products_count: 15
          },
          {
            id: 2,
            name: 'Phones',
            description: 'Mobile phones',
            parent_id: 1,
            sort_order: 1,
            created_at: '2023-01-02T00:00:00Z',
            updated_at: '2023-01-02T00:00:00Z',
            products_count: 3,
            total_products_count: 3
          },
          {
            id: 3,
            name: 'Laptops',
            description: 'Laptop computers',
            parent_id: 1,
            sort_order: 2,
            created_at: '2023-01-03T00:00:00Z',
            updated_at: '2023-01-03T00:00:00Z',
            products_count: 7,
            total_products_count: 7
          },
          {
            id: 4,
            name: 'Clothing',
            description: 'Clothing items',
            parent_id: null,
            sort_order: 2,
            created_at: '2023-01-04T00:00:00Z',
            updated_at: '2023-01-04T00:00:00Z',
            products_count: 10,
            total_products_count: 10
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const tree = result.current.data as CategoryNode[];
      expect(tree).toHaveLength(2); // 2 root categories

      // Check Electronics category with children
      const electronics = tree.find(cat => cat.name === 'Electronics');
      expect(electronics).toBeDefined();
      expect(electronics?.children).toHaveLength(2);
      expect(electronics?.children.map(c => c.name)).toEqual(['Phones', 'Laptops']);

      // Check Clothing category (no children)
      const clothing = tree.find(cat => cat.name === 'Clothing');
      expect(clothing).toBeDefined();
      expect(clothing?.children).toHaveLength(0);

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/categories', {
        params: {
          query: {
            per_page: 100
          }
        }
      });
    });

    it('should handle search filters properly', async () => {
      const mockData = { data: [] };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories({ search: 'electronics' }), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/categories', {
        params: {
          query: {
            'filter[search]': 'electronics',
            per_page: 100
          }
        }
      });
    });

    it('should handle empty response', async () => {
      const mockData = { data: [] };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle non-array response', async () => {
      const mockData = { invalid: 'structure' };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should handle direct array response', async () => {
      const mockData = [
        {
          id: 1,
          name: 'Test Category',
          parent_id: null,
          sort_order: 1,
          products_count: 0,
          total_products_count: 0
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test Category',
          children: []
        })
      );
    });

    it('should handle categories with missing fields', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            name: 'Minimal Category',
            // Missing other fields
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Minimal Category',
          description: null,
          parent_id: null,
          sort_order: 0,
          created_at: '',
          updated_at: '',
          products_count: 0,
          total_products_count: 0,
          children: []
        })
      );
    });

    it('should handle nested tree structure (3 levels)', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            name: 'Electronics',
            parent_id: null,
            sort_order: 1
          },
          {
            id: 2,
            name: 'Phones',
            parent_id: 1,
            sort_order: 1
          },
          {
            id: 3,
            name: 'Smartphones',
            parent_id: 2,
            sort_order: 1
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const tree = result.current.data as CategoryNode[];
      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Electronics');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].name).toBe('Phones');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].name).toBe('Smartphones');
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取分類列表失敗'));
    });

    it('should handle invalid category data gracefully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            name: 'Valid Category',
            parent_id: null
          },
          {
            // Missing id - should be filtered out
            name: 'Invalid Category',
            parent_id: null
          },
          {
            id: 'invalid', // Invalid id type
            name: 'Another Invalid',
            parent_id: null
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Only valid category should be included
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0].name).toBe('Valid Category');
    });
  });

  describe('useCreateCategory', () => {
    it('should create category successfully', async () => {
      const mockData = { data: { id: 1, name: 'New Category' } };
      const categoryData = {
        name: 'New Category',
        description: 'A new category',
        parent_id: null,
        sort_order: 1
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(categoryData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/categories', {
        body: categoryData
      });
    });

    it('should handle error during creation', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'A new category'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Category already exists' }
      });

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(categoryData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Category already exists' });
    });
  });

  describe('useUpdateCategory', () => {
    it('should update category successfully', async () => {
      const mockData = { data: { id: 1, name: 'Updated Category' } };
      const updateData = {
        id: 1,
        data: {
          name: 'Updated Category',
          description: 'Updated description'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/categories/{id}', {
        params: { path: { id: 1 } },
        body: updateData.data
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        id: 1,
        data: {
          name: 'Updated Category'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Update failed' });
    });
  });

  describe('useDeleteCategory', () => {
    it('should delete category successfully', async () => {
      const mockData = { success: true };

      mockApiClient.DELETE.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/categories/{id}', {
        params: { path: { id: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Category has products' }
      });

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Category has products' });
    });
  });

  describe('useReorderCategories', () => {
    it('should reorder categories successfully', async () => {
      const reorderData = [
        { id: 1, sort_order: 2 },
        { id: 2, sort_order: 1 }
      ];

      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useReorderCategories(), {
        wrapper: createWrapper()
      });

      result.current.mutate(reorderData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/categories/batch-reorder', {
        body: { items: reorderData }
      });
    });

    it('should handle error during reordering', async () => {
      const reorderData = [
        { id: 1, sort_order: 2 },
        { id: 2, sort_order: 1 }
      ];

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Reorder failed' }
      });

      const { result } = renderHook(() => useReorderCategories(), {
        wrapper: createWrapper()
      });

      result.current.mutate(reorderData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Reorder failed'));
      expect(console.error).toHaveBeenCalledWith(
        '🚫 [useReorderCategories] API 調用失敗:',
        'Reorder failed'
      );
    });

    it('should handle empty reorder data', async () => {
      const reorderData: { id: number; sort_order: number }[] = [];

      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useReorderCategories(), {
        wrapper: createWrapper()
      });

      result.current.mutate(reorderData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/categories/batch-reorder', {
        body: { items: [] }
      });
    });

    it('should handle multiple categories reorder', async () => {
      const reorderData = [
        { id: 1, sort_order: 3 },
        { id: 2, sort_order: 1 },
        { id: 3, sort_order: 2 },
        { id: 4, sort_order: 4 }
      ];

      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useReorderCategories(), {
        wrapper: createWrapper()
      });

      result.current.mutate(reorderData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/categories/batch-reorder', {
        body: { items: reorderData }
      });
    });
  });
});