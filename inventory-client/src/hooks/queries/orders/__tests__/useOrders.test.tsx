import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useOrders,
  useCreateOrder,
  useOrderDetail,
  useConfirmOrderPayment,
  useCreateOrderShipment,
  useAddOrderPayment,
  useUpdateOrder,
  useDeleteOrder,
  useUpdateOrderItemStatus,
  useCreateRefund,
  useCancelOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus
} from '../useOrders';
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

import { parseApiError } from '@/lib/errorHandler';
const mockParseApiError = parseApiError as jest.MockedFunction<typeof parseApiError>;

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

describe('useOrders hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParseApiError.mockClear();
    // Mock window object for toast
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true
    });
  });

  describe('useOrders', () => {
    it('should fetch orders list successfully', async () => {
      const mockData = {
        data: [
          {
            id: 1,
            subtotal: '100.00',
            shipping_fee: '10.00',
            tax_amount: '8.00',
            discount_amount: '5.00',
            grand_total: '113.00',
            paid_amount: '113.00',
            created_at: '2023-01-01T00:00:00Z'
          }
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        links: { first: 'first', last: 'last' }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0]).toEqual(
        expect.objectContaining({
          id: 1,
          subtotal: 100,
          shipping_fee: 10,
          tax_amount: 8,
          discount_amount: 5,
          grand_total: 113,
          paid_amount: 113,
          formatted_created_date: expect.any(String)
        })
      );
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/orders', {
        params: { query: {} }
      });
    });

    it('should handle filters properly', async () => {
      const filters = {
        search: 'test',
        shipping_status: 'shipped',
        payment_status: 'paid',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        page: 1,
        per_page: 20
      };

      const mockData = { data: [], meta: {}, links: {} };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useOrders(filters), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/orders', {
        params: {
          query: {
            'filter[search]': 'test',
            'filter[shipping_status]': 'shipped',
            'filter[payment_status]': 'paid',
            'filter[start_date]': '2023-01-01',
            'filter[end_date]': '2023-12-31',
            page: 1,
            per_page: 20
          }
        }
      });
    });

    it('should handle error response', async () => {
      mockApiClient.GET.mockResolvedValueOnce({
        data: null,
        error: { message: 'Network error' }
      });

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Network error' });
    });
  });

  describe('useCreateOrder', () => {
    it('should create order successfully', async () => {
      const mockData = { id: 1, order_number: 'ORD-001' };
      const orderData = {
        customer_id: 1,
        shipping_status: 'pending',
        payment_status: 'pending',
        shipping_fee: 10,
        tax: 8,
        discount_amount: 5,
        payment_method: 'cash',
        order_source: 'online',
        shipping_address: '123 Main St',
        notes: 'Test order',
        items: [{ product_variant_id: 1, quantity: 2, price: 50 }]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate(orderData as any);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders', {
        body: expect.objectContaining({
          customer_id: 1,
          shipping_status: 'pending',
          payment_status: 'pending',
          items: orderData.items
        })
      });
    });

    it('should handle stock error with detailed information', async () => {
      const stockError = {
        stockCheckResults: [
          { product_variant_id: 1, available: 5, requested: 10 }
        ],
        insufficientStockItems: [1]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: stockError
      });

      const { result } = renderHook(() => useCreateOrder(), {
        wrapper: createWrapper()
      });

      const orderData = {
        customer_id: 1,
        items: [{ product_variant_id: 1, quantity: 10, price: 50 }]
      };

      result.current.mutate(orderData as any);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(stockError);
    });

    it('should handle general API error', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'General error' }
      });

      const { result } = renderHook(() => useCreateOrder(), {
        wrapper: createWrapper()
      });

      const orderData = {
        customer_id: 1,
        items: [{ product_variant_id: 1, quantity: 2, price: 50 }]
      };

      result.current.mutate(orderData as any);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('General error'));
    });
  });

  describe('useOrderDetail', () => {
    it('should fetch order detail successfully', async () => {
      const mockData = {
        data: {
          id: 1,
          subtotal: '100.00',
          shipping_fee: '10.00',
          tax_amount: '8.00',
          discount_amount: '5.00',
          grand_total: '113.00',
          paid_amount: '113.00',
          items: [
            {
              id: 1,
              price: '50.00',
              cost: '30.00',
              quantity: '2',
              tax_rate: '0.08',
              discount_amount: '0.00',
              is_backorder: false
            }
          ],
          customer: { id: 1, name: 'John Doe' },
          creator: { id: 1, name: 'Admin' },
          payment_records: [
            { id: 1, amount: '113.00', method: 'cash' }
          ]
        }
      };

      mockApiClient.GET.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useOrderDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        expect.objectContaining({
          id: 1,
          subtotal: 100,
          shipping_fee: 10,
          tax_amount: 8,
          discount_amount: 5,
          grand_total: 113,
          paid_amount: 113,
          items: [
            expect.objectContaining({
              id: 1,
              price: 50,
              cost: 30,
              quantity: 2,
              tax_rate: 0.08,
              discount_amount: 0,
              is_backorder: false
            })
          ],
          payment_records: [
            expect.objectContaining({ id: 1, amount: 113 })
          ]
        })
      );
    });

    it('should not fetch when orderId is null', () => {
      const { result } = renderHook(() => useOrderDetail(null), {
        wrapper: createWrapper()
      });

      expect(result.current.status).toBe('pending');
      expect(result.current.fetchStatus).toBe('idle');
      expect(mockApiClient.GET).not.toHaveBeenCalled();
    });

    it('should handle null data response', async () => {
      // Mock API to return success response with null data
      mockApiClient.GET.mockResolvedValueOnce({
        data: { data: null },
        error: null
      });

      const { result } = renderHook(() => useOrderDetail(1), {
        wrapper: createWrapper()
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should return null for non-existing data
      expect(result.current.data).toBeNull();
      expect(mockApiClient.GET).toHaveBeenCalledWith('/api/orders/{id}', {
        params: { path: { id: 1 } }
      });
    });
  });

  describe('useConfirmOrderPayment', () => {
    it('should confirm order payment successfully', async () => {
      const mockData = { success: true };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useConfirmOrderPayment(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/confirm-payment', {
        params: { path: { order_id: 1 } }
      });
    });

    it('should handle error during payment confirmation', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment confirmation failed' }
      });

      const { result } = renderHook(() => useConfirmOrderPayment(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual({ message: 'Payment confirmation failed' });
    });
  });

  describe('useCreateOrderShipment', () => {
    it('should create order shipment successfully', async () => {
      const mockData = { id: 1, tracking_number: 'TRACK123' };
      const shipmentData = {
        tracking_number: 'TRACK123',
        carrier: 'FedEx',
        notes: 'Shipped via FedEx'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateOrderShipment(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1, data: shipmentData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/create-shipment', {
        params: { path: { order_id: 1 } },
        body: shipmentData
      });
    });
  });

  describe('useAddOrderPayment', () => {
    it('should add order payment successfully', async () => {
      const mockData = { id: 1, amount: 100 };
      const paymentData = {
        amount: 100,
        method: 'credit_card',
        notes: 'Partial payment'
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useAddOrderPayment(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1, data: paymentData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/add-payment', {
        params: { path: { order_id: 1 } },
        body: paymentData
      });
    });
  });

  describe('useUpdateOrder', () => {
    it('should update order successfully', async () => {
      const mockData = { id: 1, updated: true };
      const updateData = {
        customer_id: 2,
        shipping_status: 'shipped',
        payment_status: 'paid',
        notes: 'Updated order'
      };

      mockApiClient.PUT.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ id: 1, data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PUT).toHaveBeenCalledWith('/api/orders/{id}', {
        params: { path: { id: 1 } },
        body: updateData
      });
    });
  });

  describe('useDeleteOrder', () => {
    it('should delete order successfully', async () => {
      const mockData = { success: true };

      mockApiClient.DELETE.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useDeleteOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.DELETE).toHaveBeenCalledWith('/api/orders/{id}', {
        params: { path: { id: 1 } }
      });
    });
  });

  describe('useUpdateOrderItemStatus', () => {
    it('should update order item status successfully', async () => {
      const mockData = { data: { id: 1 } };
      const statusData = {
        orderItemId: 1,
        status: 'shipped',
        notes: 'Item shipped'
      };

      mockApiClient.PATCH.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateOrderItemStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate(statusData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.PATCH).toHaveBeenCalledWith('/api/order-items/{order_item_id}/status', {
        params: { path: { order_item_id: 1 } },
        body: { status: 'shipped', notes: 'Item shipped' }
      });
    });

    it('should handle status update without notes', async () => {
      const mockData = { data: { id: 1 } };
      const statusData = {
        orderItemId: 1,
        status: 'delivered'
      };

      mockApiClient.PATCH.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useUpdateOrderItemStatus(), {
        wrapper: createWrapper()
      });

      result.current.mutate(statusData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.PATCH).toHaveBeenCalledWith('/api/order-items/{order_item_id}/status', {
        params: { path: { order_item_id: 1 } },
        body: { status: 'delivered' }
      });
    });
  });

  describe('useCreateRefund', () => {
    it('should create refund successfully', async () => {
      const mockData = { data: { total_refund_amount: '50.00' } };
      const refundData = {
        items: [{ order_item_id: 1, quantity: 1, reason: 'defective' }],
        restore_stock: true
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateRefund(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1, data: refundData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/refunds', {
        params: { path: { order_id: 1 } },
        body: refundData
      });
    });

    it('should handle refund amount as number', async () => {
      const mockData = { data: { total_refund_amount: 75.5 } };
      const refundData = {
        items: [{ order_item_id: 1, quantity: 1, reason: 'changed mind' }]
      };

      mockApiClient.POST.mockResolvedValueOnce({
        data: mockData,
        error: null
      });

      const { result } = renderHook(() => useCreateRefund(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1, data: refundData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('useCancelOrder', () => {
    it('should cancel order successfully', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useCancelOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1, reason: 'Customer request' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/cancel', {
        params: { path: { order_id: 1 } },
        body: { reason: 'Customer request' }
      });
    });

    it('should cancel order without reason', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useCancelOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1 });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/{order_id}/cancel', {
        params: { path: { order_id: 1 } },
        body: { reason: undefined }
      });
    });

    it('should handle cancellation error', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Cannot cancel shipped order' }
      });

      const { result } = renderHook(() => useCancelOrder(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ orderId: 1 });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Cannot cancel shipped order'));
    });
  });

  describe('useBatchDeleteOrders', () => {
    it('should batch delete orders successfully', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useBatchDeleteOrders(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ ids: [1, 2, 3] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/batch-delete', {
        body: { ids: ['1', '2', '3'] }
      });
    });

    it('should handle mixed number and string IDs', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useBatchDeleteOrders(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ ids: [1, '2', 3] });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/batch-delete', {
        body: { ids: ['1', '2', '3'] }
      });
    });

    it('should handle batch delete error', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Some orders cannot be deleted' }
      });

      const { result } = renderHook(() => useBatchDeleteOrders(), {
        wrapper: createWrapper()
      });

      result.current.mutate({ ids: [1, 2] });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Some orders cannot be deleted'));
    });
  });

  describe('useBatchUpdateStatus', () => {
    it('should batch update payment status successfully', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useBatchUpdateStatus(), {
        wrapper: createWrapper()
      });

      const payload = {
        ids: [1, 2, 3],
        status_type: 'payment_status' as const,
        status_value: 'paid',
        notes: 'Batch payment confirmation'
      };

      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/batch-update-status', {
        body: {
          ids: ['1', '2', '3'],
          status_type: 'payment_status',
          status_value: 'paid',
          notes: 'Batch payment confirmation'
        }
      });
    });

    it('should batch update shipping status successfully', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: { success: true },
        error: null
      });

      const { result } = renderHook(() => useBatchUpdateStatus(), {
        wrapper: createWrapper()
      });

      const payload = {
        ids: ['1', '2'],
        status_type: 'shipping_status' as const,
        status_value: 'shipped'
      };

      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.POST).toHaveBeenCalledWith('/api/orders/batch-update-status', {
        body: {
          ids: ['1', '2'],
          status_type: 'shipping_status',
          status_value: 'shipped'
        }
      });
    });

    it('should handle batch update status error', async () => {
      mockApiClient.POST.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid status value' }
      });

      const { result } = renderHook(() => useBatchUpdateStatus(), {
        wrapper: createWrapper()
      });

      const payload = {
        ids: [1, 2],
        status_type: 'payment_status' as const,
        status_value: 'invalid_status'
      };

      result.current.mutate(payload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('Invalid status value'));
    });
  });
});