import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCheckStockAvailability } from '../useCheckStockAvailability';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/apiClient');
jest.mock('sonner');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('useCheckStockAvailability', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('should successfully check stock availability', async () => {
    const mockResponse = {
      data: {
        has_shortage: false,
        suggestions: [],
        cross_store_availability: {},
      },
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    const requestData = {
      store_id: 1,
      items: [
        { product_variant_id: 1, quantity: 10 },
        { product_variant_id: 2, quantity: 5 },
      ],
    };

    result.current.mutate(requestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApiClient.POST).toHaveBeenCalledWith(
      '/api/orders/check-stock-availability',
      { body: requestData }
    );
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should handle stock shortage response', async () => {
    const mockResponse = {
      data: {
        has_shortage: true,
        suggestions: [
          {
            product_variant_id: 1,
            product_name: 'Product A',
            sku: 'SKU-001',
            requested_quantity: 10,
            available_quantity: 5,
            shortage_quantity: 5,
            transfer_options: [
              {
                store_id: 2,
                store_name: 'Store B',
                available_quantity: 8,
                can_fulfill: true,
              },
            ],
          },
        ],
        cross_store_availability: {
          '1': {
            '2': {
              store_name: 'Store B',
              quantity: 8,
              product_name: 'Product A',
              sku: 'SKU-001',
            },
          },
        },
      },
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    result.current.mutate({
      store_id: 1,
      items: [{ product_variant_id: 1, quantity: 10 }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data.has_shortage).toBe(true);
    expect(result.current.data?.data.suggestions).toHaveLength(1);
    expect(result.current.data?.data.suggestions[0].shortage_quantity).toBe(5);
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Network error';
    mockedApiClient.POST.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    result.current.mutate({
      store_id: 1,
      items: [{ product_variant_id: 1, quantity: 10 }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
    expect(mockedToast.error).toHaveBeenCalledWith('無法檢查庫存', {
      description: errorMessage,
    });
  });

  it('should handle missing response data', async () => {
    mockedApiClient.POST.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    result.current.mutate({
      store_id: 1,
      items: [{ product_variant_id: 1, quantity: 10 }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to check stock availability');
    expect(mockedToast.error).toHaveBeenCalledWith('無法檢查庫存', {
      description: 'Failed to check stock availability',
    });
  });

  it('should log errors to console', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');
    mockedApiClient.POST.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    result.current.mutate({
      store_id: 1,
      items: [{ product_variant_id: 1, quantity: 10 }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Stock check failed:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should handle complex suggestions with mixed solutions', async () => {
    const mockResponse = {
      data: {
        has_shortage: true,
        suggestions: [
          {
            product_variant_id: 1,
            product_name: 'Product A',
            sku: 'SKU-001',
            requested_quantity: 20,
            available_quantity: 5,
            shortage_quantity: 15,
            mixed_solution: {
              transfer_quantity: 10,
              purchase_quantity: 5,
              transfer_from: [
                {
                  store_id: 2,
                  store_name: 'Store B',
                  quantity: 6,
                },
                {
                  store_id: 3,
                  store_name: 'Store C',
                  quantity: 4,
                },
              ],
            },
          },
        ],
        cross_store_availability: {},
      },
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCheckStockAvailability(), { wrapper });

    result.current.mutate({
      store_id: 1,
      items: [{ product_variant_id: 1, quantity: 20 }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const suggestion = result.current.data?.data.suggestions[0];
    expect(suggestion?.mixed_solution).toBeDefined();
    expect(suggestion?.mixed_solution?.transfer_quantity).toBe(10);
    expect(suggestion?.mixed_solution?.purchase_quantity).toBe(5);
    expect(suggestion?.mixed_solution?.transfer_from).toHaveLength(2);
  });
});