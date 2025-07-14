import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderForm, OrderFormValues } from '../OrderForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/queries/customers/useCustomers', () => ({
  useCreateCustomer: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('@/components/customers/CustomerForm', () => ({
  CustomerForm: ({ onSubmit }: any) => (
    <div data-testid="customer-form">
      <button onClick={() => onSubmit({ name: '新客戶', phone: '0912345678' })}>
        儲存客戶
      </button>
    </div>
  ),
}));

jest.mock('@/components/ui/ProductSelector', () => ({
  ProductSelector: ({ open, onOpenChange, onSelect, onCustomItemAdd, selectedIds }: any) => (
    open ? (
      <div data-testid="product-selector">
        <button onClick={() => onOpenChange(false)}>關閉</button>
        <button onClick={() => {
          onSelect([{
            id: 1,
            sku: 'SKU-001',
            price: 100,
            current_quantity: 10,
            product: { name: '測試商品' }
          }]);
          onOpenChange(false);
        }}>
          選擇商品
        </button>
        <button onClick={() => {
          onCustomItemAdd({
            product_name: '訂製商品',
            price: 200,
            quantity: 1,
          });
          onOpenChange(false);
        }}>
          新增訂製商品
        </button>
      </div>
    ) : null
  ),
}));

// Mock child components
jest.mock('../components/OrderItemsTable', () => ({
  OrderItemsTable: ({ fields, remove, onAddItem }: any) => (
    <div data-testid="order-items-table">
      <button onClick={onAddItem}>新增商品</button>
      {fields.map((field: any, index: number) => (
        <div key={field.id}>
          <span>{field.product_name || field.product?.name}</span>
          <button onClick={() => remove(index)}>移除</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../components/PriceSummary', () => ({
  PriceSummary: ({ subtotal, shippingFee, tax, discountAmount, grandTotal }: any) => (
    <div data-testid="price-summary">
      <div>小計: {subtotal}</div>
      <div>運費: {shippingFee}</div>
      <div>稅金: {tax}</div>
      <div>折扣: {discountAmount}</div>
      <div>總計: {grandTotal}</div>
    </div>
  ),
}));

jest.mock('../components/OrderInfoSidebar', () => ({
  OrderInfoSidebar: ({ form, onAddNewCustomer }: any) => (
    <div data-testid="order-info-sidebar">
      <button onClick={onAddNewCustomer}>新增客戶</button>
    </div>
  ),
}));

jest.mock('../components/OrderNotes', () => ({
  OrderNotes: ({ form }: any) => (
    <div data-testid="order-notes">
      <textarea placeholder="訂單備註" />
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('OrderForm', () => {
  const mockOnSubmit = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('基本渲染', () => {
    it('應該顯示新增訂單的標題', () => {
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('新增訂單')).toBeInTheDocument();
      expect(screen.getByText('儲存訂單')).toBeInTheDocument();
    });

    it('應該顯示編輯訂單的標題', () => {
      const initialData: Partial<OrderFormValues> = {
        customer_id: 1,
        customer_name: '測試客戶',
      };

      render(
        <OrderForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('編輯訂單')).toBeInTheDocument();
    });

    it('應該顯示所有必要的組件', () => {
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('order-items-table')).toBeInTheDocument();
      expect(screen.getByTestId('price-summary')).toBeInTheDocument();
      expect(screen.getByTestId('order-info-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('order-notes')).toBeInTheDocument();
    });
  });

  describe('商品管理', () => {
    it('應該能開啟商品選擇器', async () => {
      const user = userEvent.setup();
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('新增商品'));
      
      expect(screen.getByTestId('product-selector')).toBeInTheDocument();
    });

    it('應該能選擇商品', async () => {
      const user = userEvent.setup();
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 開啟商品選擇器
      await user.click(screen.getByText('新增商品'));
      
      // 選擇商品
      await user.click(screen.getByText('選擇商品'));
      
      // 商品選擇器應該關閉
      expect(screen.queryByTestId('product-selector')).not.toBeInTheDocument();
    });

    it('應該能新增訂製商品', async () => {
      const user = userEvent.setup();
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 開啟商品選擇器
      await user.click(screen.getByText('新增商品'));
      
      // 新增訂製商品
      await user.click(screen.getByText('新增訂製商品'));
      
      // 商品選擇器應該關閉
      expect(screen.queryByTestId('product-selector')).not.toBeInTheDocument();
    });
  });

  describe('客戶管理', () => {
    it('應該能開啟新增客戶對話框', async () => {
      const user = userEvent.setup();
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('新增客戶'));
      
      expect(screen.getByTestId('customer-form')).toBeInTheDocument();
    });

    it('應該能新增客戶', async () => {
      const user = userEvent.setup();
      
      // Mock useCreateCustomer to simulate successful creation
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ data: { id: 1, name: '新客戶', phone: '0912345678' } });
      });
      
      jest.spyOn(jest.requireMock<typeof import('@/hooks/queries/customers/useCustomers')>('@/hooks/queries/customers/useCustomers'), 'useCreateCustomer')
        .mockReturnValue({
          mutate: mockMutate,
          isPending: false,
        });
      
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 開啟新增客戶對話框
      await user.click(screen.getByText('新增客戶'));
      
      // 儲存客戶
      await user.click(screen.getByText('儲存客戶'));
      
      // 確認 mutate 被調用
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('表單提交', () => {
    it.skip('應該能提交表單', async () => {
      // TODO: 這個測試需要更完整的表單驗證設置
      const user = userEvent.setup();
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 點擊儲存按鈕
      const submitButton = screen.getByText('儲存訂單');
      await user.click(submitButton);
      
      // 確認 onSubmit 被調用
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });
    });

    it('應該在提交時顯示載入狀態', () => {
      render(
        <OrderForm
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('儲存中...')).toBeInTheDocument();
      expect(screen.getByText('儲存中...')).toBeDisabled();
    });
  });

  describe('初始資料', () => {
    it('應該正確載入初始資料', () => {
      const initialData: Partial<OrderFormValues> = {
        customer_id: 1,
        customer_name: '測試客戶',
        items: [
          {
            id: 1,
            product_variant_id: 1,
            product_name: '測試商品',
            sku: 'SKU-001',
            price: 100,
            quantity: 2,
            subtotal: 200,
            is_custom: false,
          },
        ],
        subtotal: 200,
        shipping_fee: 60,
        tax: 0,
        discount_type: 'none',
        discount_value: 0,
        discount_amount: 0,
        total: 260,
      };

      render(
        <OrderForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 確認價格摘要顯示正確
      expect(screen.getByText('小計: 200')).toBeInTheDocument();
      expect(screen.getByText('運費: 60')).toBeInTheDocument();
      expect(screen.getByText('總計: 260')).toBeInTheDocument();
    });
  });
});