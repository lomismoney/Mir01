import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '../useUsers';
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
  parseApiError: jest.fn((error) => error?.message || null)
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

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('useUsers hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useUsers', () => {
    it('should fetch users list successfully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'John Doe',
              username: 'johndoe',
              email: 'john@example.com',
              stores: [
                { id: 1, name: 'Main Store' },
                { id: 2, name: 'Branch Store' }
              ],
              roles: ['admin', 'manager'],
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z'
            },
            {
              id: 2,
              name: 'Jane Smith',
              username: 'janesmith',
              email: 'jane@example.com',
              stores: [
                { id: 1, name: 'Main Store' }
              ],
              roles: ['user'],
              created_at: '2023-01-02T00:00:00Z',
              updated_at: '2023-01-02T00:00:00Z'
            }
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 2
          }
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'John Doe',
          username: 'johndoe',
          stores: [
            { id: 1, name: 'Main Store' },
            { id: 2, name: 'Branch Store' }
          ],
          roles: ['admin', 'manager']
        })
      );
      expect(result.current.data?.meta).toEqual(mockData.data.meta);

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/users', {
        params: { query: {} }
      });
    });

    it('should handle search filters properly', async () => {
      const mockData = { data: { data: [], meta: {} } };
      const filters = {
        'filter[search]': 'john',
        'filter[role]': 'admin',
        page: 1,
        per_page: 20
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/users', {
        params: { query: filters }
      });
    });

    it('should handle direct array response', async () => {
      const mockData = [
        {
          id: 1,
          name: 'John Doe',
          username: 'johndoe',
          stores: [],
          roles: []
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'John Doe',
          username: 'johndoe',
          stores: [],
          roles: []
        })
      );
      expect(result.current.data?.meta).toEqual({});
    });

    it('should handle users with missing fields', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              // Missing name, username, stores, roles
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: '未知用戶',
          username: 'n/a',
          stores: [],
          roles: []
        })
      );
    });

    it('should handle non-array data gracefully', async () => {
      const mockData = { invalid: 'structure' };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([]);
      expect(result.current.data?.meta).toEqual({});
    });

    it('should handle invalid stores and roles formats', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'Test User',
              stores: 'invalid_format', // Not an array
              roles: 123 // Not an array
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test User',
          stores: [],
          roles: []
        })
      );
    });

    it('should handle roles array with different types', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'Test User',
              stores: [],
              roles: [1, 'admin', 2, 'user'] // Mixed types
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Test User',
          stores: [],
          roles: ['1', 'admin', '2', 'user'] // All converted to strings
        })
      );
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('獲取用戶列表失敗'));
    });

    it('should pass correct query key to queryFn', async () => {
      const mockData = { data: { data: [], meta: {} } };
      const filters = { page: 2, per_page: 10 };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUsers(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/users', {
        params: { query: filters }
      });
    });
  });

  describe('useCreateUser', () => {
    it('should create user successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe' }
      };
      const userData = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        role: 'user',
        stores: [1, 2],
        roles: ['admin', 'manager']
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(userData as { name: string; username: string; email: string; password: string; password_confirmation: string; role: string; stores: number[]; roles: string[] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/users', {
        body: userData
      });
    });

    it('should handle error during creation', async () => {
      const userData = {
        name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        role: 'user'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'User already exists' }
      });

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(userData as { name: string; username: string; email: string; password: string; password_confirmation: string; role: string; stores: number[]; roles: string[] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('User already exists'));
    });

    it('should handle success with missing user name', async () => {
      const mockData = { data: { id: 1 } }; // No name field
      const userData = { 
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        role: 'user'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(userData as { name: string; username: string; email: string; password: string; password_confirmation: string; role: string; stores: number[]; roles: string[] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });

    it('should handle error without message', async () => {
      const userData = { 
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        role: 'user'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: {} // No message
      });

      const { result } = renderHook(() => useCreateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(userData as { name: string; username: string; email: string; password: string; password_confirmation: string; role: string; stores: number[]; roles: string[] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('建立用戶失敗'));
    });
  });

  describe('useUpdateUser', () => {
    it('should update user successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe Updated' }
      };
      const updatePayload = {
        id: 1,
        body: {
          name: 'John Doe Updated',
          username: 'johndoe',
          email: 'john.updated@example.com',
          stores: [1],
          roles: ['user']
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updatePayload as { id: number; name?: string; username?: string; email?: string; role?: string; stores?: number[]; roles?: string[] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/users/{user}', {
        params: { path: { user: 1 } },
        body: updatePayload.body
      });
    });

    it('should handle error during update', async () => {
      const updatePayload = {
        id: 1,
        body: {
          name: 'John Doe',
          username: 'johndoe',
          email: 'invalid-email'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updatePayload as { id: number; name?: string; username?: string; email?: string; role?: string; stores?: number[]; roles?: string[] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Invalid email format'));
    });

    it('should handle partial update', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe' }
      };
      const updatePayload = {
        id: 1,
        body: {
          name: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com',
          stores: [2, 3]
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updatePayload as { id: number; name?: string; username?: string; email?: string; role?: string; stores?: number[]; roles?: string[] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/users/{user}', {
        params: { path: { user: 1 } },
        body: updatePayload.body
      });
    });

    it('should handle error without message', async () => {
      const updatePayload = {
        id: 1,
        body: { 
          name: 'Test',
          username: 'test',
          email: 'test@example.com'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: {} // No message
      });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updatePayload as { id: number; name?: string; username?: string; email?: string; role?: string; stores?: number[]; roles?: string[] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('更新用戶失敗'));
    });

    it('should handle success with missing user name', async () => {
      const mockData = { data: { id: 1 } }; // No name field
      const updatePayload = {
        id: 1,
        body: { 
          name: 'Updated User',
          username: 'updateduser',
          email: 'updated@example.com'
        }
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updatePayload as { id: number; name?: string; username?: string; email?: string; role?: string; stores?: number[]; roles?: string[] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useDeleteUser', () => {
    it('should delete user successfully', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/users/{user}', {
        params: { path: { user: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'User has orders' }
      });

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'User has orders' });
    });

    it('should handle deletion of different user IDs', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper()
      });

      result.current.mutate(999);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/users/{user}', {
        params: { path: { user: 999 } }
      });
    });

    it('should handle empty path params', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteUser(), {
        wrapper: createWrapper()
      });

      // This test is logically flawed, as mutate expects a number.
      // We are testing that the hook doesn't break with bad input,
      // but in a typed world this would be a compile error.
      // For JS robustness, we test it. The hook should handle it gracefully.
      (result.current.mutate as () => void)(); 

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/users/{user}', {
        params: { path: { user: undefined } }
      });
    });
  });

  describe('useUsers data processing', () => {
    it('should handle users with missing optional fields', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          username: 'user1'
          // 缺少 stores, roles
        },
        {
          id: 2,
          // 缺少 name, username
          stores: ['store1'],
          roles: ['admin', 'manager']
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockUsers,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([
        {
          id: 1,
          name: 'User 1',
          username: 'user1',
          stores: [],
          roles: []
        },
        {
          id: 2,
          name: '未知用戶',
          username: 'n/a',
          stores: ['store1'],
          roles: ['admin', 'manager']
        }
      ]);
    });

    it('should handle non-array stores and roles', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          username: 'user1',
          stores: 'not-an-array',
          roles: 'not-an-array'
        }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockUsers,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([
        {
          id: 1,
          name: 'User 1',
          username: 'user1',
          stores: [],
          roles: []
        }
      ]);
    });

    it('should handle nested data structure', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              name: 'User 1',
              username: 'user1',
              stores: [{ id: 1, name: 'Store 1' }],
              roles: [1, 2, 3] // 數字類型的 roles
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual([
        {
          id: 1,
          name: 'User 1',
          username: 'user1',
          stores: [{ id: 1, name: 'Store 1' }],
          roles: ['1', '2', '3'] // 轉換為字串陣列
        }
      ]);
    });

    it('should handle non-array response data', async () => {
      const mockResponse = {
        users: [{ id: 1, name: 'User 1' }]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockResponse,
        error: null
      });

      const { result } = renderHook(() => useUsers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [],
        meta: {}
      });
    });
  });
});