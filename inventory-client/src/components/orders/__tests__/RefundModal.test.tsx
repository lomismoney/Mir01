import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RefundModal from '../RefundModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderDetail } from '@/hooks';
import { ProcessedOrder } from '@/types/api-helpers';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useOrderDetail: jest.fn(),
  useCreateRefund: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

// Mock child components
jest.mock('../refund-modal/components/RefundModalStates', () => ({
  RefundModalStates: ({ open, onOpenChange, orderNumber, type }: any) => (
    <div data-testid="refund-modal-states">
      <span>狀態: {type}</span>
      <span>訂單編號: {orderNumber}</span>
      <button onClick={() => onOpenChange(false)}>關閉</button>
    </div>
  ),
}));

jest.mock('../refund-modal/components/RefundItemsTable', () => ({
  RefundItemsTable: ({ fields = [], watchedItems = [], onSelectAll, onItemSelect, onQuantityChange }: any) => (
    <div data-testid="refund-items-table">
      <button onClick={onSelectAll}>全選</button>
      {fields.map((field: any, index: number) => {
        const item = watchedItems[index] || {};
        return (
          <div key={index}>
            <input
              type="checkbox"
              checked={item.is_selected || false}
              onChange={(e) => onItemSelect(index, e.target.checked)}
              data-testid={`item-checkbox-${index}`}
            />
            <span>{field.product_name}</span>
            <input
              type="number"
              value={item.quantity || 0}
              onChange={(e) => onQuantityChange(index, parseInt(e.target.value))}
              data-testid={`item-quantity-${index}`}
            />
          </div>
        );
      })}
    </div>
  ),
}));

jest.mock('../refund-modal/components/RefundInfoForm', () => ({
  RefundInfoForm: ({ control }: any) => (
    <div data-testid="refund-info-form">
      <textarea placeholder="退款原因" />
    </div>
  ),
}));

jest.mock('../refund-modal/components/RefundSummary', () => ({
  RefundSummary: ({ totalRefundAmount, refundPercentage, selectedItemsCount }: any) => (
    <div data-testid="refund-summary">
      <div>退款金額: ${totalRefundAmount}</div>
      <div>退款比例: {refundPercentage}%</div>
      <div>選擇項目: {selectedItemsCount}</div>
    </div>
  ),
}));

const mockUseOrderDetail = useOrderDetail as jest.MockedFunction<typeof useOrderDetail>;

// Mock data
const mockOrder: ProcessedOrder = {
  id: 1,
  order_number: 'ORD-001',
  grand_total: 1000,
  items: [
    {
      id: 1,
      product_name: '商品A',
      quantity: 2,
      price: 200,
      subtotal: 400,
      status: 'delivered',
    },
    {
      id: 2,
      product_name: '商品B',
      quantity: 1,
      price: 600,
      subtotal: 600,
      status: 'delivered',
    },
  ],
} as ProcessedOrder;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('RefundModal', () => {
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('載入狀態', () => {
    it('應該在載入訂單詳情時顯示載入狀態', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('refund-modal-states')).toBeInTheDocument();
      expect(screen.getByText('狀態: loading')).toBeInTheDocument();
      expect(screen.getByText('訂單編號: ORD-001')).toBeInTheDocument();
    });

    it('應該在沒有訂單時顯示載入狀態', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(
        <RefundModal
          order={null}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('refund-modal-states')).toBeInTheDocument();
      expect(screen.getByText('狀態: loading')).toBeInTheDocument();
    });
  });

  describe('空狀態', () => {
    it('應該在訂單沒有商品時顯示空狀態', () => {
      const emptyOrder = { ...mockOrder, items: [] };
      mockUseOrderDetail.mockReturnValue({
        data: emptyOrder,
        isLoading: false,
        error: null,
      } as any);

      render(
        <RefundModal
          order={emptyOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('refund-modal-states')).toBeInTheDocument();
      expect(screen.getByText('狀態: no-items')).toBeInTheDocument();
    });
  });

  describe('正常顯示', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);
    });

    it('應該顯示退款對話框的標題和描述', () => {
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('處理訂單退款')).toBeInTheDocument();
      expect(screen.getByText(/訂單編號: ORD-001/)).toBeInTheDocument();
    });

    it('應該顯示所有必要的組件', () => {
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('refund-items-table')).toBeInTheDocument();
      expect(screen.getByTestId('refund-info-form')).toBeInTheDocument();
      expect(screen.getByTestId('refund-summary')).toBeInTheDocument();
    });

    it('應該顯示訂單商品', () => {
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.getByText('商品B')).toBeInTheDocument();
    });
  });

  describe('商品選擇功能', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);
    });

    it('應該能選擇單個商品', async () => {
      const user = userEvent.setup();
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const checkbox = screen.getByTestId('item-checkbox-0');
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('應該能全選商品', async () => {
      const user = userEvent.setup();
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('全選'));

      const checkbox1 = screen.getByTestId('item-checkbox-0');
      const checkbox2 = screen.getByTestId('item-checkbox-1');
      
      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
    });

    it('應該能更改退款數量', async () => {
      const user = userEvent.setup();
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const quantityInput = screen.getByTestId('item-quantity-0');
      await user.clear(quantityInput);
      await user.type(quantityInput, '1');

      expect(quantityInput).toHaveValue(1);
    });
  });

  describe('表單提交', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);
    });

    it('應該顯示提交按鈕', () => {
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/確認退款/)).toBeInTheDocument();
    });

    it('應該能取消退款', async () => {
      const user = userEvent.setup();
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('取消'));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('退款摘要', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);
    });

    it('應該顯示退款摘要資訊', () => {
      render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const summary = screen.getByTestId('refund-summary');
      expect(summary).toHaveTextContent('退款金額:');
      expect(summary).toHaveTextContent('退款比例:');
      expect(summary).toHaveTextContent('選擇項目:');
    });
  });

  describe('關閉時重置', () => {
    it('應該在關閉時不顯示內容', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        error: null,
      } as any);

      const { rerender } = render(
        <RefundModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('處理訂單退款')).toBeInTheDocument();

      // 關閉對話框
      rerender(
        <RefundModal
          order={mockOrder}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByText('處理訂單退款')).not.toBeInTheDocument();
    });
  });
});