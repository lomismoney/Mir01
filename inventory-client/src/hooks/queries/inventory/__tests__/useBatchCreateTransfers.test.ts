import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBatchCreateTransfers } from '../useBatchCreateTransfers';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/lib/apiClient');
jest.mock('sonner');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedToast = toast as jest.Mocked<typeof toast>;

describe('useBatchCreateTransfers', () => {
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

  it('should successfully create batch transfers', async () => {
    const mockResponse = {
      data: [
        { id: 1, from_store_id: 1, to_store_id: 2, status: 'pending' },
        { id: 2, from_store_id: 2, to_store_id: 3, status: 'pending' },
      ],
      message: '成功建立 2 筆庫存轉移單',
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    const requestData = {
      transfers: [
        {
          from_store_id: 1,
          to_store_id: 2,
          product_variant_id: 1,
          quantity: 10,
          notes: '緊急調貨',
        },
        {
          from_store_id: 2,
          to_store_id: 3,
          product_variant_id: 2,
          quantity: 5,
        },
      ],
      order_id: 123,
    };

    result.current.mutate(requestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApiClient.POST).toHaveBeenCalledWith(
      '/api/inventory/transfers/batch',
      { body: requestData }
    );
    expect(result.current.data).toEqual(mockResponse);
  });

  it('should show success toast on successful creation', async () => {
    const mockResponse = {
      data: [{ id: 1 }],
      message: '庫存轉移單建立成功',
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 10,
      }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedToast.success).toHaveBeenCalledWith('庫存轉移單建立成功');
  });

  it('should invalidate queries on success', async () => {
    const mockResponse = {
      data: [{ id: 1 }],
      message: 'Success',
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 10,
      }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inventory-transfers'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['inventory'] });
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Insufficient stock';
    mockedApiClient.POST.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 100,
      }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
    expect(mockedToast.error).toHaveBeenCalledWith('建立庫存轉移失敗', {
      description: errorMessage,
    });
  });

  it('should handle missing response data', async () => {
    mockedApiClient.POST.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 10,
      }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Failed to create inventory transfers');
    expect(mockedToast.error).toHaveBeenCalledWith('建立庫存轉移失敗', {
      description: 'Failed to create inventory transfers',
    });
  });

  it('should log errors to console', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Network error');
    mockedApiClient.POST.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 10,
      }],
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Batch transfer creation failed:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should handle transfers with optional fields', async () => {
    const mockResponse = {
      data: [{ id: 1 }],
      message: 'Success',
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    const requestData = {
      transfers: [
        {
          from_store_id: 1,
          to_store_id: 2,
          product_variant_id: 1,
          quantity: 10,
          notes: '緊急調貨',
          status: 'pending' as const,
        },
      ],
    };

    result.current.mutate(requestData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedApiClient.POST).toHaveBeenCalledWith(
      '/api/inventory/transfers/batch',
      { body: requestData }
    );
  });

  it('should handle default success message', async () => {
    const mockResponse = {
      data: [{ id: 1 }],
      message: '', // Empty message to test default
    };

    mockedApiClient.POST.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useBatchCreateTransfers(), { wrapper });

    result.current.mutate({
      transfers: [{
        from_store_id: 1,
        to_store_id: 2,
        product_variant_id: 1,
        quantity: 10,
      }],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedToast.success).toHaveBeenCalledWith('庫存轉移單建立成功');
  });
});