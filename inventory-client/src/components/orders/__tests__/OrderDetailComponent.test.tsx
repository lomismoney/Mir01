import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderDetailComponent } from '../OrderDetailComponent';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderDetail, useUpdateOrderItemStatus } from '@/hooks';
import { format } from 'date-fns';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useOrderDetail: jest.fn(),
  useUpdateOrderItemStatus: jest.fn(),
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }),
}));

// Mock RecordPaymentModal
jest.mock('@/components/orders/RecordPaymentModal', () => ({
  __esModule: true,
  default: ({ order, open, onOpenChange }: any) => (
    open ? (
      <div data-testid="record-payment-modal">
        <h2>記錄付款</h2>
        <p>訂單編號: {order?.order_number}</p>
        <button onClick={() => onOpenChange(false)}>關閉</button>
      </div>
    ) : null
  ),
}));

// Mock ProductStatusBadge
jest.mock('@/components/orders/ProductStatusBadge', () => ({
  ProductStatusBadge: ({ item }: any) => (
    <span data-testid={`product-status-${item.id}`}>
      {item.is_custom ? '訂製' : '標準'}
    </span>
  ),
}));

const mockUseOrderDetail = useOrderDetail as jest.MockedFunction<typeof useOrderDetail>;
const mockUseUpdateOrderItemStatus = useUpdateOrderItemStatus as jest.MockedFunction<typeof useUpdateOrderItemStatus>;

// Mock data
const mockOrder = {
  id: 1,
  order_number: 'ORD-001',
  created_at: '2024-01-15T10:00:00Z',
  shipping_status: 'processing',
  payment_status: 'partial',
  grand_total: 1060,
  paid_amount: 500,
  shipping_fee: 60,
  discount_amount: 0,
  tax_amount: 0,
  shipping_address: '台北市信義區忠孝東路100號',
  notes: '請小心包裝',
  customer: {
    id: 1,
    name: '王小明',
    phone: '0912345678',
  },
  items: [
    {
      id: 1,
      product_name: '商品A',
      sku: 'SKU-001',
      price: 500,
      quantity: 2,
      status: '待處理',
      is_custom: false,
    },
  ],
  payment_records: [
    {
      id: 1,
      amount: 500,
      payment_method: 'cash',
      payment_date: '2024-01-16T14:00:00Z',
      notes: '訂金',
      creator: {
        name: '張三',
      },
    },
  ],
};

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

describe('OrderDetailComponent', () => {
  const mockUpdateItemStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateOrderItemStatus.mockReturnValue({
      mutate: mockUpdateItemStatus,
      isPending: false,
    } as any);
  });

  describe('載入狀態', () => {
    it('應該在載入時顯示骨架畫面', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 檢查是否有骨架畫面元素
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('錯誤狀態', () => {
    it('應該在發生錯誤時顯示錯誤訊息', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { message: '網路錯誤' },
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText(/無法加載訂單詳情: 網路錯誤/)).toBeInTheDocument();
    });

    it('應該在找不到訂單時顯示提示訊息', () => {
      mockUseOrderDetail.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('找不到訂單資料。')).toBeInTheDocument();
    });
  });

  describe('正常顯示', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
    });

    it('應該顯示訂單基本資訊', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 訂單號碼
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      // 客戶名稱
      expect(screen.getByText('王小明')).toBeInTheDocument();
      // 客戶電話
      expect(screen.getByText('0912345678')).toBeInTheDocument();
    });

    it('應該顯示訂單項目', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.getByText('SKU-001')).toBeInTheDocument();
      // 找到單價欄位（在項目表格中）
      const priceCell = screen.getByRole('cell', { name: /\$500/ });
      expect(priceCell).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 數量
      
      // 找到訂單品項卡片
      const itemsCard = screen.getByText('訂單品項').closest('[data-slot="card"]');
      // 在訂單品項中找小計
      const subtotalCell = within(itemsCard!).getByText('$1,000');
      expect(subtotalCell).toBeInTheDocument();
    });

    it('應該顯示金額摘要', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 找到訂單摘要區塊
      const orderSummary = screen.getByText('訂單摘要').closest('[data-slot="card"]');
      
      // 在訂單摘要中找運費
      const shippingFee = within(orderSummary!).getByText('$60');
      expect(shippingFee).toBeInTheDocument();
      
      // 訂單總額（在訂單摘要卡片中查找）
      const totalAmount = within(orderSummary!).getByText('$1,060');
      expect(totalAmount).toBeInTheDocument();
    });

    it('應該顯示付款進度', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('付款進度')).toBeInTheDocument();
      expect(screen.getByText('47%')).toBeInTheDocument(); // 500/1060 ≈ 47%
      
      // 找到付款進度卡片
      const paymentCard = screen.getByText('付款進度').closest('[data-slot="card"]');
      
      // 在付款進度卡片中找已付金額和未付金額
      const paidAmount = within(paymentCard!).getByText('$500');
      expect(paidAmount).toBeInTheDocument();
      
      const unpaidAmount = within(paymentCard!).getByText('$560');
      expect(unpaidAmount).toBeInTheDocument();
    });

    it('應該顯示付款記錄', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('付款記錄')).toBeInTheDocument();
      
      // 找到付款記錄卡片
      const paymentRecordsCard = screen.getByText('付款記錄').closest('[data-slot="card"]');
      
      // 在付款記錄卡片中找相關資訊
      expect(within(paymentRecordsCard!).getByText('$500')).toBeInTheDocument();
      expect(within(paymentRecordsCard!).getByText('現金')).toBeInTheDocument();
      expect(within(paymentRecordsCard!).getByText('訂金')).toBeInTheDocument();
      expect(within(paymentRecordsCard!).getByText('張三')).toBeInTheDocument();
    });

    it('應該顯示配送地址和備註', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('台北市信義區忠孝東路100號')).toBeInTheDocument();
      expect(screen.getByText('請小心包裝')).toBeInTheDocument();
    });

    it('應該顯示狀態徽章', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('處理中')).toBeInTheDocument(); // 貨物狀態
      expect(screen.getByText('部分付款')).toBeInTheDocument(); // 付款狀態
    });
  });

  describe('項目狀態更新', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
    });

    it('應該能更新項目狀態', async () => {
      const user = userEvent.setup();
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 找到狀態選擇器
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      // 選擇新狀態
      const newStatusOption = screen.getByText('已叫貨');
      await user.click(newStatusOption);

      // 確認更新函數被調用
      expect(mockUpdateItemStatus).toHaveBeenCalledWith({
        orderItemId: 1,
        status: '已叫貨',
      });
    });

    it('應該在更新時顯示載入狀態', () => {
      mockUseUpdateOrderItemStatus.mockReturnValue({
        mutate: mockUpdateItemStatus,
        isPending: true,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 檢查是否有載入圖標
      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

  describe('記錄付款功能', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
    });

    it('應該在未完全付款時顯示記錄付款按鈕', () => {
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('記錄付款')).toBeInTheDocument();
    });

    it('應該在已付清時不顯示記錄付款按鈕', () => {
      const paidOrder = {
        ...mockOrder,
        payment_status: 'paid',
        paid_amount: 1060,
      };

      mockUseOrderDetail.mockReturnValue({
        data: paidOrder,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.queryByText('記錄付款')).not.toBeInTheDocument();
    });

    it('應該能開啟記錄付款對話框', async () => {
      const user = userEvent.setup();
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      const recordPaymentButton = screen.getByText('記錄付款');
      await user.click(recordPaymentButton);

      expect(screen.getByTestId('record-payment-modal')).toBeInTheDocument();
      expect(screen.getByText('訂單編號: ORD-001')).toBeInTheDocument();
    });

    it('應該能關閉記錄付款對話框', async () => {
      const user = userEvent.setup();
      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      // 開啟對話框
      const recordPaymentButton = screen.getByText('記錄付款');
      await user.click(recordPaymentButton);

      // 關閉對話框
      const closeButton = screen.getByText('關閉');
      await user.click(closeButton);

      expect(screen.queryByTestId('record-payment-modal')).not.toBeInTheDocument();
    });
  });

  describe('訂製商品顯示', () => {
    it('應該正確顯示訂製規格', () => {
      const orderWithCustomItem = {
        ...mockOrder,
        items: [
          {
            id: 1,
            product_name: '訂製商品',
            sku: 'CUSTOM-001',
            price: 800,
            quantity: 1,
            status: '待處理',
            is_custom: true,
            custom_specifications: JSON.stringify({
              尺寸: 'L',
              顏色: '紅色',
              材質: '棉質',
            }),
          },
        ],
      };

      mockUseOrderDetail.mockReturnValue({
        data: orderWithCustomItem,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.getByText('訂製規格：')).toBeInTheDocument();
      expect(screen.getByText('尺寸:')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('顏色:')).toBeInTheDocument();
      expect(screen.getByText('紅色')).toBeInTheDocument();
      expect(screen.getByText('材質:')).toBeInTheDocument();
      expect(screen.getByText('棉質')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該處理沒有客戶資訊的情況', () => {
      const orderWithoutCustomer = {
        ...mockOrder,
        customer: null,
      };

      mockUseOrderDetail.mockReturnValue({
        data: orderWithoutCustomer,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      const customerNameElements = screen.getAllByText('未提供');
      expect(customerNameElements.length).toBeGreaterThan(0);
    });

    it('應該處理沒有付款記錄的情況', () => {
      const orderWithoutPayments = {
        ...mockOrder,
        payment_records: [],
      };

      mockUseOrderDetail.mockReturnValue({
        data: orderWithoutPayments,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<OrderDetailComponent orderId={1} />, { wrapper: createWrapper() });

      expect(screen.queryByText('付款記錄')).not.toBeInTheDocument();
    });
  });
});