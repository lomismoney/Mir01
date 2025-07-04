import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useCustomerDetail,
  useCreateCustomer,
  useDeleteCustomer,
  useCheckCustomerExistence,
  useCustomers,
  useUpdateCustomer
} from '../useCustomers';
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

describe('useCustomers hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useCustomerDetail', () => {
    it('should fetch customer detail successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          name: 'John Doe',
          phone: '1234567890',
          is_company: false,
          industry_type: 'retail',
          payment_type: 'cash',
          contact_address: '123 Main St',
          addresses: [
            {
              id: 1,
              address: '123 Main St',
              is_default: true
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCustomerDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData.data);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/customers/{customer}', {
        params: { path: { customer: 1 } }
      });
    });

    it('should not fetch when customerId is null', () => {
      const { result } = renderHook(() => useCustomerDetail(null), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should not fetch when customerId is 0', () => {
      const { result } = renderHook(() => useCustomerDetail(0), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should handle null return from queryFn', async () => {
      const { result } = renderHook(() => useCustomerDetail(null), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateCustomer', () => {
    it('should create customer successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe' }
      };
      const customerData = {
        name: 'John Doe',
        phone: '1234567890',
        is_company: false,
        tax_id: '',
        industry_type: 'retail',
        payment_type: 'cash',
        contact_address: '123 Main St',
        addresses: [
          {
            address: '123 Main St',
            is_default: true
          }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(customerData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/customers', {
        body: {
          name: 'John Doe',
          phone: '1234567890',
          is_company: false,
          tax_id: undefined,
          industry_type: 'retail',
          payment_type: 'cash',
          contact_address: '123 Main St',
          addresses: ['123 Main St']
        }
      });
    });

    it('should create customer with minimal data', async () => {
      const mockData = {
        data: { id: 2, name: 'Jane Doe' }
      };
      const minimalData = {
        name: 'Jane Doe',
        is_company: true,
        industry_type: 'wholesale',
        payment_type: 'credit'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(minimalData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/customers', {
        body: {
          name: 'Jane Doe',
          phone: undefined,
          is_company: true,
          tax_id: undefined,
          industry_type: 'wholesale',
          payment_type: 'credit',
          contact_address: undefined,
          addresses: []
        }
      });
    });

    it('should handle error during creation', async () => {
      const customerData = {
        name: 'John Doe',
        is_company: false,
        industry_type: 'retail',
        payment_type: 'cash'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Customer already exists' }
      });

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(customerData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Customer already exists'));
    });

    it('should handle addresses transformation', async () => {
      const mockData = {
        data: { id: 3, name: 'Test User' }
      };
      const customerData = {
        name: 'Test User',
        is_company: false,
        industry_type: 'retail',
        payment_type: 'cash',
        addresses: [
          { id: 1, address: 'Address 1', is_default: true },
          { id: 2, address: 'Address 2', is_default: false }
        ]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(customerData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/customers', {
        body: expect.objectContaining({
          addresses: ['Address 1', 'Address 2']
        })
      });
    });
  });

  describe('useDeleteCustomer', () => {
    it('should delete customer successfully', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useDeleteCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/customers/{customer}', {
        params: { path: { customer: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Customer has orders' }
      });

      const { result } = renderHook(() => useDeleteCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Customer has orders' });
    });
  });

  describe('useCheckCustomerExistence', () => {
    it('should check customer existence successfully', async () => {
      const mockData = { exists: true };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCheckCustomerExistence('John Doe'), {
        wrapper: createWrapper()
      });

      // Query is disabled by default, need to manually refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/customers/check-existence', {
        params: { query: { name: 'John Doe' } }
      });
    });

    it('should handle error during existence check', async () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'API error' }
      });

      const { result } = renderHook(() => useCheckCustomerExistence('John Doe'), {
        wrapper: createWrapper()
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ exists: false });
      expect(consoleSpy).toHaveBeenCalledWith('客戶名稱檢查失敗', { message: 'API error' });

      consoleSpy.mockRestore();
    });

    it('should handle null data response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const { result } = renderHook(() => useCheckCustomerExistence('John Doe'), {
        wrapper: createWrapper()
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ exists: false });
    });

    it('should not execute query by default (enabled: false)', () => {
      const { result } = renderHook(() => useCheckCustomerExistence('John Doe'), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });
  });

  describe('useCustomers', () => {
    it('should fetch customers list successfully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              name: 'John Doe',
              phone: '1234567890',
              is_company: false
            }
          ],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 }
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: mockData.data.data,
        meta: mockData.data.meta
      });
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/customers', {
        params: { query: {} }
      });
    });

    it('should handle filters properly', async () => {
      const filters = {
        search: 'John',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        page: 1,
        per_page: 20
      };

      const mockData = { data: { data: [], meta: {} } };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCustomers(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/customers', {
        params: {
          query: {
            'filter[search]': 'John',
            'filter[start_date]': '2023-01-01',
            'filter[end_date]': '2023-12-31',
            page: 1,
            per_page: 20
          }
        }
      });
    });

    it('should handle array response without nested structure', async () => {
      const mockData = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Doe' }
      ];

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: mockData,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 2,
          total: 2
        }
      });
    });

    it('should handle non-array data gracefully', async () => {
      const mockData = { invalid: 'structure' };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 0,
          total: 0
        }
      });
    });

    it('should handle error response', async () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useCustomers(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Network error'));
      expect(consoleSpy).toHaveBeenCalledWith('客戶 API 錯誤:', { message: 'Network error' });

      consoleSpy.mockRestore();
    });
  });

  describe('useUpdateCustomer', () => {
    it('should update customer successfully', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe Updated' }
      };
      const updateData = {
        name: 'John Doe Updated',
        phone: '0987654321',
        is_company: true
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/customers/{customer}', {
        params: { path: { customer: 1 } },
        body: updateData
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        name: 'John Doe',
        phone: 'invalid-phone'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid phone format' }
      });

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Invalid phone format' });
    });

    it('should handle empty update data', async () => {
      const mockData = {
        data: { id: 1, name: 'John Doe' }
      };
      const updateData = {};

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateCustomer(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/customers/{customer}', {
        params: { path: { customer: 1 } },
        body: {}
      });
    });
  });
});