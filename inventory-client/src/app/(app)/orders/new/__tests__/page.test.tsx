import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import NewOrderPage from '../page';
import { useCreateOrder } from '@/hooks';
import { useCheckStockAvailability } from '@/hooks/queries/orders/useCheckStockAvailability';
import { useBatchCreateTransfers } from '@/hooks/queries/inventory/useBatchCreateTransfers';
import { toast } from 'sonner';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks
jest.mock('@/hooks', () => ({
  useCreateOrder: jest.fn(),
}));

jest.mock('@/hooks/queries/orders/useCheckStockAvailability', () => ({
  useCheckStockAvailability: jest.fn(),
}));

jest.mock('@/hooks/queries/inventory/useBatchCreateTransfers', () => ({
  useBatchCreateTransfers: jest.fn(),
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock form data that will be submitted
const mockFormData = {
  customer_id: 1,
  store_id: 1,
  items: [
    {
      product_variant_id: 1,
      product_name: 'Test Product',
      sku: 'TEST-001',
      price: 100,
      quantity: 10,
      is_stocked_sale: true,
    }
  ],
  shipping_fee: 50,
  tax: 10,
  discount_amount: 0,
  payment_method: 'cash',
  order_source: 'store',
  shipping_address: 'Test Address',
  notes: 'Test notes',
};

// Mock OrderForm component
jest.mock('@/components/orders/OrderForm', () => ({
  OrderForm: ({ onSubmit, isSubmitting }: any) => {
    // Simulate lazy loading behavior
    React.useEffect(() => {
      // Component is mounted
    }, []);
    
    return (
      <form data-testid="order-form" onSubmit={(e) => {
        e.preventDefault();
        onSubmit(mockFormData);
      }}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交訂單'}
        </button>
      </form>
    );
  },
}));

// Mock other components
jest.mock('@/components/orders/StockSuggestionDialog', () => ({
  StockSuggestionDialog: ({ open, onConfirm, onForceCreate, suggestions }: any) => {
    if (!open) return null;
    
    return (
      <div data-testid="stock-suggestion-dialog">
        <h3>庫存不足提醒</h3>
        <div data-testid="suggestions-count">{suggestions?.length || 0} 項商品庫存不足</div>
        <button onClick={() => onConfirm([{
          product_variant_id: 1,
          action: 'transfer',
          transfers: [{ from_store_id: 2, quantity: 5 }]
        }])}>
          確認處理方案
        </button>
        <button onClick={onForceCreate}>
          忽略並建立預訂單
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/orders/OrderSubmitProgressDialog', () => ({
  OrderSubmitProgressDialog: ({ open, steps, currentStep }: any) => {
    if (!open) return null;
    
    return (
      <div data-testid="progress-dialog">
        <div data-testid="current-step">{currentStep}</div>
        <div data-testid="steps">
          {steps?.map((step: any) => (
            <div key={step.id} data-testid={`step-${step.id}`} data-status={step.status}>
              {step.label}
            </div>
          ))}
        </div>
      </div>
    );
  },
}));

jest.mock('@/components/ui/skeleton', () => ({
  LoadingFallback: () => <div>Loading...</div>,
}));

jest.mock('@/components/orders/OrderFormErrorBoundary', () => ({
  OrderFormErrorBoundary: ({ children }: any) => <>{children}</>,
}));

describe('NewOrderPage Integration Tests', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockCreateOrder = jest.fn();
  const mockCheckStock = jest.fn();
  const mockCreateTransfers = jest.fn();

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create new query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Setup default hook mocks
    (useCreateOrder as jest.Mock).mockReturnValue({
      mutate: mockCreateOrder,
      isPending: false,
    });

    (useCheckStockAvailability as jest.Mock).mockReturnValue({
      mutate: mockCheckStock,
      isPending: false,
    });

    (useBatchCreateTransfers as jest.Mock).mockReturnValue({
      mutate: mockCreateTransfers,
      isPending: false,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Page Rendering', () => {
    it('should render the page with correct title and description', async () => {
      render(<NewOrderPage />, { wrapper });

      expect(screen.getByText('新增訂單')).toBeInTheDocument();
      expect(screen.getByText('填寫以下資訊以創建一筆新的銷售訂單。')).toBeInTheDocument();
      
      // Wait for lazy-loaded form
      await waitFor(() => {
        expect(screen.getByTestId('order-form')).toBeInTheDocument();
      });
    });

    it('should render submit button in correct state', async () => {
      render(<NewOrderPage />, { wrapper });

      await waitFor(() => {
        const submitButton = screen.getByText('提交訂單');
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Order Creation Flow - Sufficient Stock', () => {
    it('should successfully create order when stock is sufficient', async () => {
      // Mock successful stock check
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: {
            has_shortage: false,
            suggestions: []
          }
        });
      });

      // Mock successful order creation
      mockCreateOrder.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({ 
          data: { 
            id: 123, 
            order_number: 'ORD-001' 
          } 
        });
      });

      render(<NewOrderPage />, { wrapper });

      // Submit form
      const submitButton = await screen.findByText('提交訂單');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify stock check was called
      await waitFor(() => {
        expect(mockCheckStock).toHaveBeenCalledWith(
          expect.objectContaining({
            store_id: 1,
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: 1,
                quantity: 10
              })
            ])
          }),
          expect.any(Object)
        );
      });

      // Verify order creation was called
      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_id: 1,
            store_id: 1,
            force_create_despite_stock: 0,
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: 1,
                is_stocked_sale: true,
                price: 100,
                quantity: 10
              })
            ])
          }),
          expect.any(Object)
        );
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith(
        '訂單建立成功！',
        expect.objectContaining({
          description: '訂單編號：ORD-001'
        })
      );

      // Verify navigation after delay
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/orders/123');
      }, { timeout: 2000 });
    });
  });

  describe('Order Creation Flow - Insufficient Stock', () => {
    it('should show stock suggestions dialog when stock is insufficient', async () => {
      // Mock stock check with shortage
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: {
            has_shortage: true,
            suggestions: [{
              product_variant_id: 1,
              product_name: 'Test Product',
              sku: 'TEST-001',
              type: 'transfer',
              shortage: 5,
              current_store_stock: 5,
              requested_quantity: 10,
              available_quantity: 5,
              shortage_quantity: 5,
              transfers: [{
                from_store_id: 2,
                from_store_name: 'Store B',
                available_quantity: 8,
                suggested_quantity: 5
              }]
            }]
          }
        });
      });

      render(<NewOrderPage />, { wrapper });

      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      // Verify stock suggestion dialog appears
      await waitFor(() => {
        expect(screen.getByTestId('stock-suggestion-dialog')).toBeInTheDocument();
        expect(screen.getByText('庫存不足提醒')).toBeInTheDocument();
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('1 項商品庫存不足');
      });
    });

    it('should handle stock decision confirmation with transfers', async () => {
      // Setup mocks
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: {
            has_shortage: true,
            suggestions: [{
              product_variant_id: 1,
              type: 'transfer',
              shortage: 5,
              transfers: [{
                from_store_id: 2,
                from_store_name: 'Store B',
                available_quantity: 8,
                suggested_quantity: 5
              }]
            }]
          }
        });
      });

      mockCreateOrder.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({ 
          data: { 
            id: 123, 
            order_number: 'ORD-001' 
          } 
        });
      });

      mockCreateTransfers.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({});
      });

      render(<NewOrderPage />, { wrapper });

      // Submit form
      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      // Wait for suggestion dialog
      await waitFor(() => {
        expect(screen.getByTestId('stock-suggestion-dialog')).toBeInTheDocument();
      });

      // Confirm stock decisions
      const confirmButton = screen.getByText('確認處理方案');
      fireEvent.click(confirmButton);

      // Verify order creation
      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalled();
      });

      // Verify transfer creation
      await waitFor(() => {
        expect(mockCreateTransfers).toHaveBeenCalledWith(
          expect.objectContaining({
            order_id: 123,
            transfers: expect.arrayContaining([
              expect.objectContaining({
                from_store_id: 2,
                to_store_id: 1,
                product_variant_id: 1,
                quantity: 5,
                notes: '訂單庫存調配',
                status: 'pending'
              })
            ])
          }),
          expect.any(Object)
        );
      });

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith(
        '訂單及調貨單建立成功！',
        expect.any(Object)
      );
    });

    it('should handle force create (ignore stock)', async () => {
      // Setup mocks
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: {
            has_shortage: true,
            suggestions: [{
              product_variant_id: 1,
              type: 'purchase',
              shortage: 10
            }]
          }
        });
      });

      mockCreateOrder.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({ 
          data: { 
            id: 123, 
            order_number: 'ORD-001' 
          } 
        });
      });

      render(<NewOrderPage />, { wrapper });

      // Submit form
      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      // Wait for suggestion dialog
      await waitFor(() => {
        expect(screen.getByTestId('stock-suggestion-dialog')).toBeInTheDocument();
      });

      // Click force create
      const forceCreateButton = screen.getByText('忽略並建立預訂單');
      fireEvent.click(forceCreateButton);

      // Verify order creation with force flag
      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            force_create_despite_stock: 1
          }),
          expect.any(Object)
        );
      });

      // Verify success toast for pre-order
      expect(toast.success).toHaveBeenCalledWith(
        '預訂訂單建立成功！',
        expect.objectContaining({
          description: expect.stringContaining('ORD-001')
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle stock check failure', async () => {
      const error = new Error('Network error');
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onError(error);
      });

      render(<NewOrderPage />, { wrapper });

      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '庫存檢查失敗',
          expect.objectContaining({
            description: '是否要繼續建立訂單？'
          })
        );
      });
    });

    it('should auto-retry with force create on stock error', async () => {
      // First call fails with stock error
      let callCount = 0;
      mockCreateOrder.mockImplementation((_data, callbacks) => {
        callCount++;
        if (callCount === 1) {
          const stockError: any = new Error('Stock insufficient');
          stockError.stockCheckResults = [{ insufficient: true }];
          callbacks.onError(stockError);
        } else {
          callbacks.onSuccess({ 
            data: { 
              id: 123, 
              order_number: 'ORD-001' 
            } 
          });
        }
      });

      // Skip stock check (no stock items)
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: { has_shortage: false, suggestions: [] }
        });
      });

      render(<NewOrderPage />, { wrapper });

      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      // Verify auto-retry with force flag
      await waitFor(() => {
        expect(mockCreateOrder).toHaveBeenCalledTimes(2);
        expect(mockCreateOrder).toHaveBeenLastCalledWith(
          expect.objectContaining({
            force_create_despite_stock: 1
          }),
          expect.any(Object)
        );
      });

      // Verify info toast
      expect(toast.info).toHaveBeenCalledWith(
        '部分商品庫存不足，系統已自動轉為預訂訂單',
        expect.objectContaining({
          description: '商品將於補貨後自動出貨'
        })
      );
    });

    it('should handle general order creation error', async () => {
      mockCheckStock.mockImplementation((_data, callbacks) => {
        callbacks.onSuccess({
          data: { has_shortage: false, suggestions: [] }
        });
      });

      mockCreateOrder.mockImplementation((_data, callbacks) => {
        callbacks.onError(new Error('Validation error'));
      });

      render(<NewOrderPage />, { wrapper });

      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '訂單建立失敗',
          expect.objectContaining({
            description: 'Validation error'
          })
        );
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress dialog during order submission', async () => {
      // Mock delayed response
      mockCheckStock.mockImplementation((_data, callbacks) => {
        setTimeout(() => {
          callbacks.onSuccess({
            data: { has_shortage: false, suggestions: [] }
          });
        }, 100);
      });

      mockCreateOrder.mockImplementation((_data, callbacks) => {
        setTimeout(() => {
          callbacks.onSuccess({ 
            data: { id: 123 } 
          });
        }, 100);
      });

      render(<NewOrderPage />, { wrapper });

      const submitButton = await screen.findByText('提交訂單');
      fireEvent.click(submitButton);

      // Progress dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('progress-dialog')).toBeInTheDocument();
      });

      // Verify steps are shown
      expect(screen.getByTestId('step-validate')).toBeInTheDocument();
      expect(screen.getByTestId('step-check-stock')).toBeInTheDocument();
      expect(screen.getByTestId('step-create-order')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable submit button when processing', async () => {
      (useCreateOrder as jest.Mock).mockReturnValue({
        mutate: mockCreateOrder,
        isPending: true,
      });

      render(<NewOrderPage />, { wrapper });

      await waitFor(() => {
        const submitButton = screen.getByText('提交中...');
        expect(submitButton).toBeDisabled();
      });
    });
  });
});