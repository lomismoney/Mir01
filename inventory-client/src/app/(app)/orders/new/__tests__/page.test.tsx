import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useCreateOrder } from '@/hooks';
import { toast } from 'sonner';
import NewOrderPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks', () => ({
  useCreateOrder: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Create a variable to hold the mock implementation
let mockFormData = {
  customer_id: 1,
  shipping_status: 'pending',
  payment_status: 'pending',
  shipping_fee: 100,
  tax: 50,
  discount_amount: 20,
  payment_method: 'credit_card',
  order_source: 'online',
  shipping_address: '123 Test St',
  notes: 'Test notes',
  items: [
    {
      product_variant_id: 1,
      is_stocked_sale: true,
      status: 'pending',
      custom_specifications: { color: 'red' },
      product_name: 'Test Product',
      sku: 'TEST-SKU',
      price: 100,
      quantity: 2,
    }
  ]
};

jest.mock('@/components/orders/OrderForm', () => ({
  OrderForm: ({ onSubmit, isSubmitting }: { onSubmit: (data: typeof mockFormData) => void; isSubmitting: boolean }) => (
    <div data-testid="order-form">
      <button 
        onClick={() => onSubmit(mockFormData)}
        disabled={isSubmitting}
      >
        Submit
      </button>
    </div>
  ),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseCreateOrder = useCreateOrder as jest.MockedFunction<typeof useCreateOrder>;

describe('NewOrderPage', () => {
  const mockPush = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset form data to default values
    mockFormData = {
      customer_id: 1,
      shipping_status: 'pending',
      payment_status: 'pending',
      shipping_fee: 100,
      tax: 50,
      discount_amount: 20,
      payment_method: 'credit_card',
      order_source: 'online',
      shipping_address: '123 Test St',
      notes: 'Test notes',
      items: [
        {
          product_variant_id: 1,
          is_stocked_sale: true,
          status: 'pending',
          custom_specifications: { color: 'red' },
          product_name: 'Test Product',
          sku: 'TEST-SKU',
          price: 100,
          quantity: 2,
        }
      ]
    };
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseCreateOrder.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  describe('頁面渲染', () => {
    it('應該顯示新增訂單標題', () => {
      render(<NewOrderPage />);
      
      expect(screen.getByText('新增訂單')).toBeInTheDocument();
      expect(screen.getByText('填寫以下資訊以創建一筆新的銷售訂單。')).toBeInTheDocument();
    });

    it('應該顯示訂單表單', () => {
      render(<NewOrderPage />);
      
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('表單提交', () => {
    it('應該成功提交表單', async () => {
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_id: 1,
            shipping_status: 'pending',
            payment_status: 'pending',
            shipping_fee: 100,
            tax: 50,
            discount_amount: 20,
            payment_method: 'credit_card',
            order_source: 'online',
            shipping_address: '123 Test St',
            notes: 'Test notes',
            force_create_despite_stock: 0,
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: 1,
                is_stocked_sale: true,
                status: 'pending',
                custom_specifications: '{"color":"red"}',
                product_name: 'Test Product',
                sku: 'TEST-SKU',
                price: 100,
                quantity: 2,
              })
            ])
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('應該處理默認值', async () => {
      // Update mockFormData to have minimal data
      mockFormData = {
        customer_id: 1,
        payment_method: 'cash',
        order_source: 'store',
        shipping_address: '123 Test St',
        items: [
          {
            is_stocked_sale: true,
            product_name: 'Test Product',
            sku: 'TEST-SKU',
            price: '100',
            quantity: '2',
          }
        ]
      };

      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_id: 1,
            shipping_status: 'pending',
            payment_status: 'pending',
            shipping_fee: 0,
            tax: 0,
            discount_amount: 0,
            payment_method: 'cash',
            order_source: 'store',
            shipping_address: '123 Test St',
            notes: null,
            force_create_despite_stock: 0,
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: null,
                is_stocked_sale: true,
                status: 'pending',
                custom_specifications: null,
                product_name: 'Test Product',
                sku: 'TEST-SKU',
                price: 100,
                quantity: 2,
              })
            ])
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('成功處理', () => {
    it('應該在成功時顯示成功訊息並重定向到訂單詳情', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ data: { id: 123, order_number: 'ORD-001' } });
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('訂單建立成功！', {
          description: '訂單編號：ORD-001'
        });
        expect(mockPush).toHaveBeenCalledWith('/orders/123');
      });
    });

    it('應該在沒有訂單ID時重定向到訂單列表', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ data: { order_number: 'ORD-001' } });
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/orders');
      });
    });

    it('應該在強制建單模式時顯示預訂成功訊息', async () => {
      // Test the forceCreate path by triggering it through stock error
      let secondCall = false;
      
      mockMutate.mockImplementation((data, options) => {
        if (!secondCall) {
          secondCall = true;
          // First call fails with stock error
          options.onError({
            stockCheckResults: [{ insufficient: true }],
            message: 'Stock insufficient'
          });
        } else {
          // Second call (force create) succeeds
          options.onSuccess({ data: { id: 123, order_number: 'ORD-001' } });
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('部分商品庫存不足，系統已自動轉為預訂訂單', {
          description: '商品將於補貨後自動出貨'
        });
        expect(toast.success).toHaveBeenCalledWith('訂單建立成功！', {
          description: '訂單編號：ORD-001'
        });
        expect(mockPush).toHaveBeenCalledWith('/orders/123');
      });
    });
  });

  describe('庫存錯誤處理', () => {
    it('應該在庫存不足時自動轉為預訂模式', async () => {
      let callCount = 0;
      
      mockMutate.mockImplementation((data, options) => {
        callCount++;
        if (callCount === 1) {
          // First call fails with stock error
          options.onError({
            stockCheckResults: [{ insufficient: true }],
            message: 'Stock insufficient'
          });
        } else {
          // Second call (force create) succeeds
          options.onSuccess({ data: { id: 123, order_number: 'ORD-001' } });
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledTimes(2);
        
        // First call should be normal
        expect(mockMutate).toHaveBeenNthCalledWith(1, 
          expect.objectContaining({
            force_create_despite_stock: 0
          }),
          expect.any(Object)
        );
        
        // Second call should be force create
        expect(mockMutate).toHaveBeenNthCalledWith(2, 
          expect.objectContaining({
            force_create_despite_stock: 1
          }),
          expect.any(Object)
        );
      });
    });

    it('應該在庫存不足錯誤使用 insufficientStockItems 屬性', async () => {
      let callCount = 0;
      
      mockMutate.mockImplementation((data, options) => {
        callCount++;
        if (callCount === 1) {
          // First call fails with stock error using insufficientStockItems
          options.onError({
            insufficientStockItems: [{ product_id: 1, available: 0 }],
            message: 'Stock insufficient'
          });
        } else {
          // Second call (force create) succeeds
          options.onSuccess({ data: { id: 123, order_number: 'ORD-001' } });
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('部分商品庫存不足，系統已自動轉為預訂訂單', {
          description: '商品將於補貨後自動出貨'
        });
        expect(mockMutate).toHaveBeenCalledTimes(2);
      });
    });

    it('應該在強制建單仍然失敗時顯示錯誤', async () => {
      let callCount = 0;
      
      mockMutate.mockImplementation((data, options) => {
        callCount++;
        if (callCount === 1) {
          // First call fails with stock error
          options.onError({
            stockCheckResults: [{ insufficient: true }],
            message: 'Stock insufficient'
          });
        } else {
          // Second call (force create) also fails
          options.onError({ message: 'Force create failed' });
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('預訂訂單建立失敗', {
          description: 'Force create failed'
        });
      });
    });

    it('應該在強制建單失敗且沒有錯誤訊息時顯示預設訊息', async () => {
      let callCount = 0;
      
      mockMutate.mockImplementation((data, options) => {
        callCount++;
        if (callCount === 1) {
          // First call fails with stock error
          options.onError({
            stockCheckResults: [{ insufficient: true }],
            message: 'Stock insufficient'
          });
        } else {
          // Second call (force create) fails without message
          options.onError({});
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('預訂訂單建立失敗', {
          description: '請稍後再試'
        });
      });
    });
  });

  describe('一般錯誤處理', () => {
    it('應該在一般錯誤時顯示錯誤訊息', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('General error'));
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('訂單建立失敗', {
          description: 'General error'
        });
      });
    });

    it('應該在沒有錯誤訊息時顯示預設訊息', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onError({});
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('訂單建立失敗', {
          description: '請檢查輸入資料並重試。'
        });
      });
    });

    it('應該記錄錯誤到控制台', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Test error'));
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('❌ 訂單創建失敗:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('應該記錄強制建單失敗到控制台', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let callCount = 0;
      
      mockMutate.mockImplementation((data, options) => {
        callCount++;
        if (callCount === 1) {
          options.onError({
            stockCheckResults: [{ insufficient: true }],
            message: 'Stock insufficient'
          });
        } else {
          options.onError(new Error('Force create failed'));
        }
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('❌ 預訂訂單仍然失敗:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('載入狀態', () => {
    it('應該在提交時顯示載入狀態', () => {
      mockUseCreateOrder.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeDisabled();
    });

    it('應該在沒有載入時啟用提交按鈕', () => {
      mockUseCreateOrder.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      
      render(<NewOrderPage />);
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).not.toBeDisabled();
    });
  });
});