import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import PurchaseDetailPage from '../[id]/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock hooks
jest.mock('@/hooks', () => ({
  usePurchase: jest.fn(),
  useUpdatePurchaseNotes: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock components
jest.mock('@/components/purchases/PartialReceiptDialog', () => ({
  PartialReceiptDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="partial-receipt-dialog">
        <button onClick={onClose}>關閉部分收貨對話框</button>
      </div>
    ) : null
  ),
}));

jest.mock('@/components/purchases/BindOrdersDialog', () => ({
  BindOrdersDialog: ({ 
    open, 
    onOpenChange, 
    purchase, 
    onSuccess 
  }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    purchase: any; 
    onSuccess: () => void; 
  }) => (
    open ? (
      <div data-testid="bind-orders-dialog">
        <h2>綁定訂單</h2>
        <p>進貨單：{purchase?.order_number}</p>
        <button onClick={() => onOpenChange(false)}>取消</button>
        <button onClick={onSuccess}>綁定成功</button>
      </div>
    ) : null
  ),
}));

import { usePurchase, useUpdatePurchaseNotes } from '@/hooks';

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

const mockPurchase = {
  id: 1,
  order_number: 'PO-20250101-001',
  status: 'pending',
  store: { name: '門市A' },
  purchased_at: '2025-01-01T10:00:00Z',
  shipping_cost: 200,
  total_amount: 1500,
  created_at: '2025-01-01T09:00:00Z',
  updated_at: '2025-01-01T09:30:00Z',
  notes: '測試進貨單記事',
  items: [
    {
      id: 1,
      quantity: 5,
      received_quantity: 3,
      receipt_status: 'partial',
      cost_price: 100,
      allocated_shipping_cost: 50,
      product_name: '商品A',
      sku: 'PROD-001',
    },
    {
      id: 2,
      quantity: 3,
      received_quantity: 3,
      receipt_status: 'full',
      cost_price: 200,
      allocated_shipping_cost: 150,
      product_name: '商品B',
      sku: 'PROD-002',
    },
  ],
};

describe('PurchaseDetailPage - 綁定訂單功能', () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };
  const mockUpdateNotesMutation = { mutate: jest.fn(), isPending: false };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (usePurchase as jest.Mock).mockReturnValue({
      data: mockPurchase,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useUpdatePurchaseNotes as jest.Mock).mockReturnValue(mockUpdateNotesMutation);
  });

  it('應該顯示綁定訂單按鈕', () => {
    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('綁定訂單')).toBeInTheDocument();
    expect(screen.getByTestId('bind-orders-button')).toBeInTheDocument();
  });

  it('點擊綁定訂單按鈕應該開啟綁定對話框', async () => {
    const user = userEvent.setup();
    
    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    const bindButton = screen.getByTestId('bind-orders-button');
    await user.click(bindButton);

    expect(screen.getByTestId('bind-orders-dialog')).toBeInTheDocument();
    expect(screen.getByText('進貨單：PO-20250101-001')).toBeInTheDocument();
  });

  it('應該能夠關閉綁定訂單對話框', async () => {
    const user = userEvent.setup();
    
    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    const bindButton = screen.getByTestId('bind-orders-button');
    await user.click(bindButton);

    expect(screen.getByTestId('bind-orders-dialog')).toBeInTheDocument();

    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);

    expect(screen.queryByTestId('bind-orders-dialog')).not.toBeInTheDocument();
  });

  it('綁定成功後應該關閉對話框並刷新數據', async () => {
    const user = userEvent.setup();
    
    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    const bindButton = screen.getByTestId('bind-orders-button');
    await user.click(bindButton);

    const successButton = screen.getByText('綁定成功');
    await user.click(successButton);

    expect(screen.queryByTestId('bind-orders-dialog')).not.toBeInTheDocument();
  });

  it('已完成狀態的進貨單不應該顯示綁定訂單按鈕', () => {
    (usePurchase as jest.Mock).mockReturnValue({
      data: { ...mockPurchase, status: 'completed' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bind-orders-button')).not.toBeInTheDocument();
  });

  it('取消狀態的進貨單不應該顯示綁定訂單按鈕', () => {
    (usePurchase as jest.Mock).mockReturnValue({
      data: { ...mockPurchase, status: 'cancelled' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bind-orders-button')).not.toBeInTheDocument();
  });

  it('待處理和確認狀態的進貨單應該顯示綁定訂單按鈕', () => {
    const testStatuses = ['pending', 'confirmed'];
    
    testStatuses.forEach(status => {
      (usePurchase as jest.Mock).mockReturnValue({
        data: { ...mockPurchase, status },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      const { rerender } = render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('綁定訂單')).toBeInTheDocument();
      expect(screen.getByTestId('bind-orders-button')).toBeInTheDocument();

      rerender(<div />); // 清理
    });
  });

  it('應該在進貨單資訊卡片中顯示綁定狀態', () => {
    const purchaseWithBoundOrders = {
      ...mockPurchase,
      bound_orders_count: 2,
      bound_items_count: 5,
    };

    (usePurchase as jest.Mock).mockReturnValue({
      data: purchaseWithBoundOrders,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText('已綁定訂單')).toBeInTheDocument();
    expect(screen.getByText('2 筆訂單')).toBeInTheDocument();
    expect(screen.getByText('5 個項目')).toBeInTheDocument();
  });

  it('綁定訂單按鈕應該在適當的位置顯示', () => {
    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    const bindButton = screen.getByTestId('bind-orders-button');
    const editButtons = screen.getAllByText('編輯');
    // 使用頁面頭部區域的編輯按鈕（第一個）
    const editButton = editButtons[0];
    
    // 確認按鈕在操作區域
    const buttonContainer = bindButton.closest('div');
    expect(buttonContainer).toContainElement(editButton);
  });

  it('載入狀態時不應該顯示綁定訂單按鈕', () => {
    (usePurchase as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bind-orders-button')).not.toBeInTheDocument();
  });

  it('錯誤狀態時不應該顯示綁定訂單按鈕', () => {
    (usePurchase as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
    });

    render(<PurchaseDetailPage />, { wrapper: createWrapper() });

    expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bind-orders-button')).not.toBeInTheDocument();
  });
});