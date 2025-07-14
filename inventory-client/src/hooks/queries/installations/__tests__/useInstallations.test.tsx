import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useInstallations,
  useInstallation,
  useCreateInstallation,
  useCreateInstallationFromOrder,
  useUpdateInstallation,
  useDeleteInstallation,
  useAssignInstaller,
  useUpdateInstallationStatus,
  useInstallationSchedule
} from '../useInstallations';
import apiClient from '@/lib/apiClient';

// Mock the API client
jest.mock('@/lib/apiClient', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  PATCH: jest.fn(),
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

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('useInstallations hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useInstallations', () => {
    it('should fetch installations list successfully', async () => {
      const mockData = {
        data: {
          data: [
            {
              id: 1,
              installation_number: 'INS-001',
              order_id: 1,
              customer_name: 'John Doe',
              customer_phone: '1234567890',
              installation_address: '123 Main St',
              installer_user_id: 1,
              status: 'pending',
              scheduled_date: '2023-01-01',
              actual_start_time: null,
              actual_end_time: null,
              notes: 'Test installation',
              created_by: 1,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              installer: {
                id: 1,
                name: 'John Installer',
                username: 'installer1'
              },
              creator: {
                id: 1,
                name: 'John Creator',
                username: 'creator1'
              },
              order: {
                id: 1,
                order_number: 'ORD-001',
                customer_name: 'John Doe'
              },
              items: [
                {
                  id: 1,
                  installation_id: 1,
                  order_item_id: 1,
                  product_name: 'Product 1',
                  sku: 'SKU-001',
                  quantity: 1,
                  specifications: null,
                  status: 'pending',
                  notes: null
                }
              ]
            }
          ],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
          links: { first: 'first', last: 'last' }
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          installation_number: 'INS-001',
          customer_name: 'John Doe',
          status: 'pending',
          installer: expect.objectContaining({
            id: 1,
            name: 'John Installer'
          }),
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              product_name: 'Product 1'
            })
          ])
        })
      );

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/installations', {
        params: {
          query: {
            include: 'items,installer,creator,order'
          }
        }
      });
    });

    it('should handle filters properly', async () => {
      const filters = {
        search: 'test',
        status: 'completed',
        installer_user_id: 1,
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        page: 1,
        per_page: 20
      };

      const mockData = { data: { data: [], meta: {}, links: {} } };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallations(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/installations', {
        params: {
          query: {
            'filter[search]': 'test',
            'filter[status]': 'completed',
            'filter[installer_user_id]': 1,
            'filter[start_date]': '2023-01-01',
            'filter[end_date]': '2023-12-31',
            page: 1,
            per_page: 20,
            include: 'items,installer,creator,order'
          }
        }
      });
    });

    it('should handle non-array data gracefully', async () => {
      const mockData = {
        data: { data: { invalid: 'structure' }, meta: null, links: null }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallations(), {
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

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useInstallations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Network error'));
    });

    it('should transform data with default values', async () => {
      const mockData = {
        data: {
          data: [
            {
              // Missing most fields to test default values
              id: 1,
              installation_number: 'INS-001'
            }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallations(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          installation_number: 'INS-001',
          order_id: null,
          customer_name: '',
          customer_phone: null,
          installation_address: '',
          installer_user_id: null,
          status: 'pending',
          scheduled_date: null,
          installer: null,
          creator: null,
          order: null,
          items: []
        })
      );
    });
  });

  describe('useInstallation', () => {
    it('should fetch single installation successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          installation_number: 'INS-001',
          customer_name: 'John Doe',
          status: 'pending'
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallation(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData.data);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/installations/{installation}', {
        params: {
          path: { installation: 1 },
          query: { include: 'items,installer,creator,order' }
        }
      });
    });

    it('should not fetch when id is falsy', () => {
      const { result } = renderHook(() => useInstallation(0), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it.skip('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Installation not found' }
      });

      const { result } = renderHook(() => useInstallation(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Installation not found'));
    });
  });

  describe('useCreateInstallation', () => {
    it('should create installation successfully', async () => {
      const mockData = {
        data: { id: 1, installation_number: 'INS-001' }
      };
      const installationData = {
        customer_name: 'John Doe',
        installation_address: '123 Main St',
        scheduled_date: '2023-01-01',
        notes: 'Test installation'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(installationData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/installations', {
        body: installationData
      });
    });

    it('should handle error during creation', async () => {
      const installationData = {
        customer_name: 'John Doe',
        installation_address: '123 Main St'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Creation failed' }
      });

      const { result } = renderHook(() => useCreateInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(installationData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Creation failed'));
    });
  });

  describe('useCreateInstallationFromOrder', () => {
    it('should create installation from order successfully', async () => {
      const mockData = {
        data: { installation_number: 'INS-002' }
      };
      const orderData = {
        order_id: 1,
        customer_name: 'Jane Doe',
        installation_address: '456 Oak St'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateInstallationFromOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate(orderData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/installations/create-from-order', {
        body: orderData
      });
    });

    it('should handle error during creation from order', async () => {
      const orderData = {
        order_id: 1,
        customer_name: 'Jane Doe'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Order not found' }
      });

      const { result } = renderHook(() => useCreateInstallationFromOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate(orderData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Order not found'));
    });
  });

  describe('useUpdateInstallation', () => {
    it('should update installation successfully', async () => {
      const mockData = { id: 1, updated: true };
      const updateData = {
        id: 1,
        customer_name: 'John Doe Updated',
        installation_address: '789 Pine St',
        status: 'in_progress'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/installations/{installation}', {
        params: { path: { installation: 1 } },
        body: {
          customer_name: 'John Doe Updated',
          installation_address: '789 Pine St',
          status: 'in_progress'
        }
      });
    });

    it('should handle error during update', async () => {
      const updateData = {
        id: 1,
        status: 'completed'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      });

      const { result } = renderHook(() => useUpdateInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Update failed'));
    });
  });

  describe('useDeleteInstallation', () => {
    it('should delete installation successfully', async () => {
      const mockData = { success: true };

      mockApiClient.DELETE.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useDeleteInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/installations/{installation}', {
        params: { path: { installation: 1 } }
      });
    });

    it('should handle error during deletion', async () => {
      mockApiClient.DELETE.mockResolvedValueOnce({
        data: null,
        error: { message: 'Cannot delete installation in progress' }
      });

      const { result } = renderHook(() => useDeleteInstallation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Cannot delete installation in progress'));
    });
  });

  describe('useAssignInstaller', () => {
    it('should assign installer successfully', async () => {
      const mockData = { success: true };
      const assignData = {
        installationId: 1,
        installer_user_id: 2,
        scheduled_date: '2023-01-02'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useAssignInstaller(), {
        wrapper: createWrapper()
      });

      result.current.mutate(assignData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/installations/{installation}/assign', {
        params: { path: { installation: 1 } },
        body: {
          installer_user_id: 2,
          scheduled_date: '2023-01-02'
        }
      });
    });

    it('should handle error during installer assignment', async () => {
      const assignData = {
        installationId: 1,
        installer_user_id: 999
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Installer not found' }
      });

      const { result } = renderHook(() => useAssignInstaller(), {
        wrapper: createWrapper()
      });

      result.current.mutate(assignData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Installer not found'));
    });
  });

  describe('useUpdateInstallationStatus', () => {
    it('should update installation status successfully', async () => {
      const mockData = { id: 1, status: 'completed' };
      const statusData = {
        installationId: 1,
        status: 'completed',
        reason: 'Installation finished successfully'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateInstallationStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate(statusData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/installations/{installation}/status', {
        params: { path: { installation: 1 } },
        body: {
          status: 'completed',
          reason: 'Installation finished successfully'
        }
      });
    });

    it('should update status without reason', async () => {
      const mockData = { id: 1, status: 'cancelled' };
      const statusData = {
        installationId: 1,
        status: 'cancelled'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateInstallationStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate(statusData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/installations/{installation}/status', {
        params: { path: { installation: 1 } },
        body: { status: 'cancelled' }
      });
    });

    it('should handle error during status update', async () => {
      const statusData = {
        installationId: 1,
        status: 'invalid_status'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid status' }
      });

      const { result } = renderHook(() => useUpdateInstallationStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate(statusData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Invalid status'));
    });
  });

  describe('useInstallationSchedule', () => {
    it('should fetch installation schedule successfully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            installation_number: 'INS-001',
            scheduled_date: '2023-01-01',
            installer: { name: 'John Installer' }
          }
        ]
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallationSchedule(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData.data);
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/installations/schedule', {
        params: { query: {} }
      });
    });

    it('should handle schedule filters properly', async () => {
      const params = {
        installer_user_id: 1,
        start_date: '2023-01-01',
        end_date: '2023-01-31'
      };

      const mockData = { data: [] };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallationSchedule(params), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/installations/schedule', {
        params: {
          query: {
            'installer_user_id': 1,
            'start_date': '2023-01-01',
            'end_date': '2023-01-31'
          }
        }
      });
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Schedule fetch failed' }
      });

      const { result } = renderHook(() => useInstallationSchedule(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Schedule fetch failed'));
    });

    it('should handle empty response gracefully', async () => {
      const mockData = {};

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useInstallationSchedule(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });
  });
});