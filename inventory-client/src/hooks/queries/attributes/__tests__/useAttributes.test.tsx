/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
  useAttributeValues,
} from '../useAttributes';
import apiClient from '@/lib/apiClient';

// Mock modules
jest.mock('@/lib/apiClient');
jest.mock('@/lib/errorHandler', () => ({
  parseApiError: jest.fn((error) => error?.message || '請求失敗'),
}));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

/**
 * 測試用的 QueryClient 包裝器
 */
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

describe('useAttributes hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAttributes', () => {
    test('應該成功獲取屬性列表', async () => {
      // Arrange
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              name: '顏色',
              type: 'text',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              values: [
                {
                  id: 1,
                  value: '紅色',
                  attribute_id: 1,
                  created_at: '2024-01-01T00:00:00Z',
                  updated_at: '2024-01-01T00:00:00Z',
                },
              ],
              products_count: 5,
            },
          ],
          meta: {
            total: 1,
            per_page: 100,
            current_page: 1,
            last_page: 1,
          },
        },
      };

      mockApiClient.GET.mockResolvedValue({ data: mockResponse, error: undefined });

      // Act
      const { result } = renderHook(() => useAttributes(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [
          {
            id: 1,
            name: '顏色',
            type: 'text',
            description: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            values: [
              {
                id: 1,
                value: '紅色',
                attribute_id: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            attribute_values: [
              {
                id: 1,
                value: '紅色',
                attribute_id: 1,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
              },
            ],
            products_count: 5,
          },
        ],
        meta: {
          total: 1,
          per_page: 100,
          current_page: 1,
          last_page: 1,
        },
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/attributes');
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.GET.mockResolvedValue({
        data: undefined,
        error: { message: 'API 錯誤' },
      });

      // Act
      const { result } = renderHook(() => useAttributes(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取屬性列表失敗'));
    });

    test('應該正確處理空數據', async () => {
      // Arrange
      mockApiClient.GET.mockResolvedValue({ 
        data: { data: [] }, 
        error: undefined 
      });

      // Act
      const { result } = renderHook(() => useAttributes(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [],
        meta: {
          total: 0,
          per_page: 100,
          current_page: 1,
          last_page: 1,
        },
      });
    });
  });

  describe('useCreateAttribute', () => {
    test('應該成功創建屬性', async () => {
      // Arrange
      const mockResponse = {
        id: 1,
        name: '新屬性',
        type: 'text',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockApiClient.POST.mockResolvedValue({
        data: mockResponse,
        error: undefined,
      });

      // Act
      const { result } = renderHook(() => useCreateAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      const mutateResult = await result.current.mutateAsync({ name: '新屬性' });
      expect(mutateResult).toEqual(mockResponse);

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/attributes', {
        body: { name: '新屬性' },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.POST.mockResolvedValue({
        data: undefined,
        error: { message: '創建失敗' },
      });

      // Act
      const { result } = renderHook(() => useCreateAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync({ name: '新屬性' })
      ).rejects.toThrow('創建失敗');
    });
  });

  describe('useUpdateAttribute', () => {
    test('應該成功更新屬性', async () => {
      // Arrange
      const mockResponse = {
        id: 1,
        name: '更新後的屬性',
        type: 'text',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockApiClient.PUT.mockResolvedValue({
        data: mockResponse,
        error: undefined,
      });

      // Act
      const { result } = renderHook(() => useUpdateAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      const mutateResult = await result.current.mutateAsync({
        id: 1,
        body: { name: '更新後的屬性' },
      });
      expect(mutateResult).toEqual(mockResponse);

      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/attributes/{attribute}', {
        params: { path: { attribute: 1 } },
        body: { name: '更新後的屬性' },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.PUT.mockResolvedValue({
        data: undefined,
        error: { name: ['名稱已存在'] },
      });

      // Act
      const { result } = renderHook(() => useUpdateAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync({
          id: 1,
          body: { name: '重複名稱' },
        })
      ).rejects.toThrow('名稱已存在');
    });
  });

  describe('useDeleteAttribute', () => {
    test('應該成功刪除屬性', async () => {
      // Arrange
      mockApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: undefined,
      });

      // Act
      const { result } = renderHook(() => useDeleteAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      await result.current.mutateAsync({ id: 1 });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/attributes/{attribute}', {
        params: { path: { attribute: 1 } },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: { message: '刪除失敗' },
      });

      // Act
      const { result } = renderHook(() => useDeleteAttribute(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync({ id: 1 })
      ).rejects.toThrow('刪除屬性失敗');
    });
  });

  describe('useCreateAttributeValue', () => {
    test('應該成功創建屬性值', async () => {
      // Arrange
      const mockResponse = {
        id: 1,
        value: '新值',
        attribute_id: 1,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockApiClient.POST.mockResolvedValue({
        data: mockResponse,
        error: undefined,
      });

      // Act
      const { result } = renderHook(() => useCreateAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      const mutateResult = await result.current.mutateAsync({
        attributeId: 1,
        body: { value: '新值' },
      });
      expect(mutateResult).toEqual(mockResponse);

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/attributes/{attribute}/values', {
        params: { path: { attribute: 1 } },
        body: { value: '新值' },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.POST.mockResolvedValue({
        data: undefined,
        error: { value: ['值已存在'] },
      });

      // Act
      const { result } = renderHook(() => useCreateAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync({
          attributeId: 1,
          body: { value: '重複值' },
        })
      ).rejects.toThrow('值已存在');
    });
  });

  describe('useAttributeValues', () => {
    test('應該成功獲取屬性值列表', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: 1,
            value: '紅色',
            attribute_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        meta: {
          total: 1,
          per_page: 100,
          current_page: 1,
          last_page: 1,
        },
      };

      mockApiClient.GET.mockResolvedValue({
        data: mockResponse,
        error: undefined,
      });

      // Act
      const { result } = renderHook(() => useAttributeValues(1), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [
          {
            id: 1,
            value: '紅色',
            attribute_id: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        meta: {
          total: 1,
          per_page: 100,
          current_page: 1,
          last_page: 1,
        },
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/attributes/{attribute}/values', {
        params: { path: { attribute: 1 } },
      });
    });

    test('當 attributeId 為 null 時應該禁用查詢且不發起請求', async () => {
      // Act
      const { result } = renderHook(() => useAttributeValues(null), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.GET.mockResolvedValue({
        data: undefined,
        error: { message: 'API 錯誤' },
      });

      // Act
      const { result } = renderHook(() => useAttributeValues(1), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('API 錯誤'));
    });
  });

  describe('useUpdateAttributeValue', () => {
    test('應該成功更新屬性值', async () => {
      // Arrange
      const mockResponse = {
        id: 1,
        value: '更新後的值',
        attribute_id: 1,
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockApiClient.PUT.mockResolvedValue({
        data: mockResponse,
        error: undefined,
      });

      // Mock window for toast
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });

      // Act
      const { result } = renderHook(() => useUpdateAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      const mutateResult = await result.current.mutateAsync({
        valueId: 1,
        body: { value: '更新後的值' },
      });
      expect(mutateResult).toEqual(mockResponse);

      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/values/{value}', {
        params: { path: { value: 1 } },
        body: { value: '更新後的值' },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.PUT.mockResolvedValue({
        data: undefined,
        error: { value: ['值已存在'] },
      });

      // Act
      const { result } = renderHook(() => useUpdateAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync({
          valueId: 1,
          body: { value: '重複值' },
        })
      ).rejects.toThrow('值已存在');
    });
  });

  describe('useDeleteAttributeValue', () => {
    test('應該成功刪除屬性值', async () => {
      // Arrange
      mockApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: undefined,
      });

      // Mock window for toast
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });

      // Act
      const { result } = renderHook(() => useDeleteAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      await result.current.mutateAsync(1);

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/values/{value}', {
        params: { path: { value: 1 } },
      });
    });

    test('當 API 返回錯誤時應該拋出異常', async () => {
      // Arrange
      mockApiClient.DELETE.mockResolvedValue({
        data: undefined,
        error: { message: '刪除失敗' },
      });

      // Act
      const { result } = renderHook(() => useDeleteAttributeValue(), {
        wrapper: createWrapper(),
      });

      // Assert
      await expect(
        result.current.mutateAsync(1)
      ).rejects.toThrow('刪除選項失敗');
    });
  });
}); 