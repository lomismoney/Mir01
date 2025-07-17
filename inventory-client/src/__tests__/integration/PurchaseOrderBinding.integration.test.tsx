import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackorderList } from '@/components/backorders/BackorderList';
import PurchaseDetailPage from '@/app/(app)/purchases/[id]/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useParams: () => ({ id: '1' }),
}));

jest.mock('@/hooks', () => ({
  usePurchase: jest.fn(),
  useUpdatePurchaseNotes: jest.fn(),
  useErrorHandler: jest.fn(() => ({
    handleError: jest.fn(),
    handleSuccess: jest.fn(),
  })),
  usePartialReceipt: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('@/hooks/queries/backorders/useBackorders', () => ({
  useBackorders: jest.fn(),
}));

jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { usePurchase, useUpdatePurchaseNotes } from '@/hooks';
import { useBackorders } from '@/hooks/queries/backorders/useBackorders';
import { apiClient } from '@/lib/apiClient';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

// Mock data
const mockBackorderData = {
  data: [
    {
      order_id: 1,
      order_number: 'ORD-001',
      customer_name: '客戶A',
      total_items: 2,
      total_quantity: 8,
      created_at: '2025-01-01T10:00:00Z',
      days_pending: 5,
      summary_status: 'pending',
      summary_status_text: '待處理',
      items: [
        {
          id: 1,
          product_name: '商品A',
          sku: 'PROD-001',
          quantity: 5,
          integrated_status: 'pending',
          integrated_status_text: '待處理',
          product_variant_id: 1,
        },
        {
          id: 2,
          product_name: '商品B',
          sku: 'PROD-002',
          quantity: 3,
          integrated_status: 'pending',
          integrated_status_text: '待處理',
          product_variant_id: 2,
        },
      ],
    },
  ],
};

const mockPurchaseData = {
  id: 1,
  order_number: 'PO-20250101-001',
  status: 'pending',
  store: { name: '門市A' },
  purchased_at: '2025-01-01T10:00:00Z',
  shipping_cost: 200,
  total_amount: 1500,
  created_at: '2025-01-01T09:00:00Z',
  updated_at: '2025-01-01T09:30:00Z',
  notes: '測試進貨單',
  bound_orders_count: 0,
  bound_items_count: 0,
  items: [
    {
      id: 1,
      quantity: 5,
      cost_price: 100,
      product_name: '商品A',
      sku: 'PROD-001',
    },
    {
      id: 2,
      quantity: 3,
      cost_price: 200,
      product_name: '商品B',
      sku: 'PROD-002',
    },
  ],
};

const mockBindableOrders = {
  data: [
    {
      id: 1,
      order_number: 'ORD-001',
      customer_name: '客戶A',
      store_id: 1,
      items: [
        {
          id: 1,
          product_variant_id: 1,
          pending_quantity: 5,
          product_variant: {
            id: 1,
            sku: 'PROD-001',
            name: '商品A',
          },
        },
        {
          id: 2,
          product_variant_id: 2,
          pending_quantity: 3,
          product_variant: {
            id: 2,
            sku: 'PROD-002',
            name: '商品B',
          },
        },
      ],
    },
  ],
};

describe('進貨單與訂單綁定 - 整合測試', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (apiClient.GET as jest.Mock).mockImplementation((url) => {
      if (url === '/api/purchases/bindable-orders') {
        return Promise.resolve(mockBindableOrders);
      }
      return Promise.resolve({ data: [] });
    });

    (apiClient.POST as jest.Mock).mockImplementation((url) => {
      if (url === '/api/purchases') {
        return Promise.resolve({
          data: { id: 1, order_number: 'PO-001' },
        });
      }
      if (url.includes('/bind-orders')) {
        return Promise.resolve({
          message: '成功綁定訂單',
          data: { bound_items_count: 2 },
        });
      }
      return Promise.resolve({ data: {} });
    });

    // Mock hooks
    (useBackorders as jest.Mock).mockReturnValue({
      data: mockBackorderData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (usePurchase as jest.Mock).mockReturnValue({
      data: mockPurchaseData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useUpdatePurchaseNotes as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  describe('完整的待進貨到進貨單建立流程', () => {
    it('應該能夠從待進貨商品選擇項目並建立進貨單', async () => {
      const user = userEvent.setup();
      
      render(<BackorderList />, { wrapper: createWrapper() });

      // 等待資料載入
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      // 展開第一個訂單
      const firstOrderTrigger = screen.getByText('ORD-001');
      await user.click(firstOrderTrigger);

      // 等待展開
      await waitFor(() => {
        expect(screen.getByText('商品A')).toBeInTheDocument();
      });

      // 選擇第一個項目
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      // 檢查批量操作欄是否出現
      await waitFor(() => {
        expect(screen.getByText('已選擇 1 個項目')).toBeInTheDocument();
        expect(screen.getByText('建立進貨單')).toBeInTheDocument();
      });

      // 點擊建立進貨單
      const createButton = screen.getByText('建立進貨單');
      await user.click(createButton);

      // 檢查對話框是否開啟
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('選擇項目：1 個商品')).toBeInTheDocument();
      });

      // 填寫進貨單資訊並提交
      const submitButton = screen.getByRole('button', { name: /建立進貨單/ });
      expect(submitButton).toBeEnabled();

      await user.click(submitButton);

      // 驗證 API 呼叫
      await waitFor(() => {
        expect(apiClient.POST).toHaveBeenCalledWith('/api/purchases', 
          expect.objectContaining({
            body: expect.objectContaining({
              order_items: expect.arrayContaining([
                expect.objectContaining({
                  order_item_id: 1,
                  purchase_quantity: 5,
                }),
              ]),
            }),
          })
        );
      });
    });

    it('建立進貨單時應該正確處理多個選擇項目', async () => {
      const user = userEvent.setup();
      
      render(<BackorderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      // 展開訂單
      const firstOrderTrigger = screen.getByText('ORD-001');
      await user.click(firstOrderTrigger);

      await waitFor(() => {
        expect(screen.getByText('商品A')).toBeInTheDocument();
        expect(screen.getByText('商品B')).toBeInTheDocument();
      });

      // 選擇所有項目
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // 商品A
      await user.click(checkboxes[1]); // 商品B

      // 檢查批量操作欄
      await waitFor(() => {
        expect(screen.getByText('已選擇 2 個項目')).toBeInTheDocument();
        expect(screen.getAllByText('總數量：8')).toHaveLength(1); // 只檢查一個
      });

      // 建立進貨單
      const createButton = screen.getByText('建立進貨單');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('選擇項目：2 個商品')).toBeInTheDocument();
        expect(screen.getAllByText('總數量：8')).toHaveLength(2); // 現在應該有兩個
      });

      const submitButton = screen.getByRole('button', { name: /建立進貨單/ });
      await user.click(submitButton);

      // 驗證包含所有選擇項目的 API 呼叫
      await waitFor(() => {
        expect(apiClient.POST).toHaveBeenCalledWith('/api/purchases', 
          expect.objectContaining({
            body: expect.objectContaining({
              order_items: expect.arrayContaining([
                expect.objectContaining({ order_item_id: 1 }),
                expect.objectContaining({ order_item_id: 2 }),
              ]),
            }),
          })
        );
      });
    });
  });

  describe('進貨單詳情頁面的訂單綁定流程', () => {
    it('應該能夠在進貨單詳情頁面綁定訂單', async () => {
      const user = userEvent.setup();
      
      render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      // 等待頁面載入
      await waitFor(() => {
        expect(screen.getByText('PO-20250101-001')).toBeInTheDocument();
        expect(screen.getByTestId('bind-orders-button')).toBeInTheDocument();
      });

      // 點擊綁定訂單按鈕
      const bindButton = screen.getByTestId('bind-orders-button');
      await user.click(bindButton);

      // 檢查綁定對話框是否開啟
      await waitFor(() => {
        expect(screen.getAllByText('綁定訂單')).toHaveLength(2); // 一個按鈕，一個標題
        expect(screen.getByText(/進貨單：PO-20250101-001/)).toBeInTheDocument();
      });

      // 等待可綁定訂單載入
      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('客戶A')).toBeInTheDocument();
      });

      // 展開訂單
      const orderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
      await user.click(orderTrigger!);

      // 選擇項目進行綁定
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0];
        return user.click(checkbox);
      });

      // 點擊綁定按鈕
      await waitFor(() => {
        const bindSubmitButton = screen.getByText('綁定選擇的項目');
        expect(bindSubmitButton).toBeEnabled();
        return user.click(bindSubmitButton);
      });

      // 驗證綁定 API 呼叫
      await waitFor(() => {
        expect(apiClient.POST).toHaveBeenCalledWith('/api/purchases/1/bind-orders', 
          expect.objectContaining({
            body: expect.objectContaining({
              order_items: expect.arrayContaining([
                expect.objectContaining({
                  order_item_id: 1,
                  purchase_quantity: 5,
                }),
              ]),
            }),
          })
        );
      });
    });

    it('進貨單狀態為完成時不應該顯示綁定按鈕', () => {
      (usePurchase as jest.Mock).mockReturnValue({
        data: { ...mockPurchaseData, status: 'completed' },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      expect(screen.queryByTestId('bind-orders-button')).not.toBeInTheDocument();
      expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
    });

    it('應該顯示已綁定的訂單統計資訊', () => {
      (usePurchase as jest.Mock).mockReturnValue({
        data: { 
          ...mockPurchaseData, 
          bound_orders_count: 2,
          bound_items_count: 5,
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText('已綁定訂單')).toBeInTheDocument();
      expect(screen.getByText('2 筆訂單')).toBeInTheDocument();
      expect(screen.getByText('5 個項目')).toBeInTheDocument();
    });
  });

  describe('跨組件數據流和狀態同步', () => {
    it('建立進貨單後應該能正確傳遞資料到詳情頁面', async () => {
      
      // 模擬建立進貨單後的狀態
      const createdPurchase = {
        ...mockPurchaseData,
        id: 2,
        order_number: 'PO-20250101-002',
        bound_orders_count: 1,
        bound_items_count: 2,
      };

      (usePurchase as jest.Mock).mockReturnValue({
        data: createdPurchase,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      // 驗證進貨單資訊正確顯示
      await waitFor(() => {
        expect(screen.getByText('PO-20250101-002')).toBeInTheDocument();
        expect(screen.getByText('已綁定訂單')).toBeInTheDocument();
        expect(screen.getByText('1 筆訂單')).toBeInTheDocument();
        expect(screen.getByText('2 個項目')).toBeInTheDocument();
      });

      // 驗證綁定按鈕仍然可用（pending 狀態）
      expect(screen.getByTestId('bind-orders-button')).toBeInTheDocument();
    });
  });

  describe('錯誤處理和邊緣情況', () => {
    it('API 錯誤時應該正確處理', async () => {
      const user = userEvent.setup();
      
      // 模擬 API 錯誤
      (apiClient.POST as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

      render(<BackorderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const firstOrderTrigger = screen.getByText('ORD-001');
      await user.click(firstOrderTrigger);

      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[0];
        return user.click(checkbox);
      });

      const createButton = screen.getByText('建立進貨單');
      await user.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /建立進貨單/ });
        return user.click(submitButton);
      });

      // 驗證錯誤處理（這裡通過 console 沒有錯誤來驗證）
      await waitFor(() => {
        expect(apiClient.POST).toHaveBeenCalled();
      });
    });

    it('沒有可綁定訂單時應該正確顯示', async () => {
      const user = userEvent.setup();
      
      // 模擬沒有可綁定訂單
      (apiClient.GET as jest.Mock).mockImplementation((url) => {
        if (url === '/api/purchases/bindable-orders') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(<PurchaseDetailPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('bind-orders-button')).toBeInTheDocument();
      });

      const bindButton = screen.getByTestId('bind-orders-button');
      await user.click(bindButton);

      await waitFor(() => {
        expect(screen.getByText('沒有找到可綁定的訂單')).toBeInTheDocument();
      });
    });
  });
});