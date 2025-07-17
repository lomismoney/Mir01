import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BindOrdersDialog } from '../BindOrdersDialog';

// Mock toast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock API client
jest.mock('@/lib/apiClient', () => ({
  apiClient: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

import { apiClient } from '@/lib/apiClient';

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
  store_id: 1,
  status: 'pending',
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
    {
      id: 2,
      order_number: 'ORD-002',
      customer_name: '客戶B',
      store_id: 1,
      items: [
        {
          id: 3,
          product_variant_id: 1,
          pending_quantity: 2,
          product_variant: {
            id: 1,
            sku: 'PROD-001',
            name: '商品A',
          },
        },
      ],
    },
  ],
};

describe('BindOrdersDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.GET as jest.Mock).mockResolvedValue(mockBindableOrders);
  });

  it('當 open 為 false 時應該不顯示對話框', () => {
    render(
      <BindOrdersDialog
        open={false}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('綁定訂單')).not.toBeInTheDocument();
  });

  it('當 open 為 true 時應該顯示對話框並載入可綁定訂單', async () => {
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('綁定訂單')).toBeInTheDocument();
    expect(screen.getByText(/進貨單：PO-20250101-001/)).toBeInTheDocument();

    // 等待可綁定訂單載入
    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalledWith('/api/purchases/bindable-orders', {
        params: {
          query: { store_id: 1 },
        },
      });
    });
  });

  it('應該顯示可綁定的訂單列表', async () => {
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('客戶A')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('客戶B')).toBeInTheDocument();
    });
  });

  it('應該顯示訂單項目詳細資訊', async () => {
    const user = userEvent.setup();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    await waitFor(() => {
      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.getByText('PROD-001')).toBeInTheDocument();
      expect(screen.getByText('商品B')).toBeInTheDocument();
      expect(screen.getByText('PROD-002')).toBeInTheDocument();
    });
  });

  it('應該允許用戶選擇訂單項目', async () => {
    const user = userEvent.setup();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    await waitFor(() => {
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      return user.click(firstCheckbox);
    });

    const firstCheckbox = screen.getAllByRole('checkbox')[0];
    expect(firstCheckbox).toBeChecked();
  });

  it('應該允許用戶編輯進貨數量', async () => {
    const user = userEvent.setup();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    // 編輯進貨數量
    await waitFor(() => {
      const quantityInput = screen.getByDisplayValue('5');
      expect(quantityInput).toBeInTheDocument();
    });
    
    const quantityInput = screen.getByDisplayValue('5');
    await user.clear(quantityInput);
    await user.type(quantityInput, '3');

    expect(quantityInput).toHaveValue(3);
  });

  it('進貨數量不能超過待處理數量', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    // 等待數量輸入框出現
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    // 嘗試輸入超過待處理數量的值
    const quantityInput = screen.getByDisplayValue('5');
    await user.clear(quantityInput);
    await user.type(quantityInput, '10'); // 超過待處理數量 5

    // 觸發表單驗證
    const bindButton = screen.getByText('綁定選擇的項目');
    await user.click(bindButton);

    // 等待一段時間，確認 API 沒有被調用（因為驗證失敗）
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 確認 API 沒有被調用，說明驗證生效了
    expect(apiClient.POST).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('當沒有選擇項目時應該禁用綁定按鈕', async () => {
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    const bindButton = screen.getByText('綁定選擇的項目');
    expect(bindButton).toBeDisabled();
  });

  it('當有選擇項目時應該啟用綁定按鈕', async () => {
    const user = userEvent.setup();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    await waitFor(() => {
      const bindButton = screen.getByText('綁定選擇的項目');
      expect(bindButton).toBeEnabled();
    });
  });

  it('應該正確提交綁定請求', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    const mockOnOpenChange = jest.fn();

    (apiClient.POST as jest.Mock).mockResolvedValueOnce({
      message: '成功綁定訂單',
      data: { bound_items_count: 1 },
    });

    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        purchase={mockPurchase}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    // 等待按鈕啟用後點擊
    let bindButton: HTMLElement;
    await waitFor(() => {
      bindButton = screen.getByText('綁定選擇的項目');
      expect(bindButton).toBeEnabled();
    });
    
    await user.click(bindButton!);

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/api/purchases/1/bind-orders', {
        body: {
          order_items: [
            {
              order_item_id: 1,
              purchase_quantity: 5,
            },
          ],
        },
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('應該在 API 錯誤時顯示錯誤訊息', async () => {
    const user = userEvent.setup();

    (apiClient.POST as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    // 等待按鈕啟用後點擊
    let bindButton: HTMLElement;
    await waitFor(() => {
      bindButton = screen.getByText('綁定選擇的項目');
      expect(bindButton).toBeEnabled();
    });
    
    await user.click(bindButton!);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '綁定失敗',
        description: '訂單綁定失敗，請稍後再試',
        variant: 'destructive',
      });
    });
  });

  it('應該支援搜尋功能', async () => {
    const user = userEvent.setup();
    
    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });

    // 搜尋 ORD-001
    const searchInput = screen.getByPlaceholderText('搜尋訂單編號或客戶名稱...');
    await user.type(searchInput, 'ORD-001');

    // 應該只顯示 ORD-001
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
  });

  it('應該顯示載入狀態', () => {
    (apiClient.GET as jest.Mock).mockImplementation(() => new Promise(() => {})); // 永不解決的 Promise

    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('應該處理沒有可綁定訂單的情況', async () => {
    (apiClient.GET as jest.Mock).mockResolvedValueOnce({ data: [] });

    render(
      <BindOrdersDialog
        open={true}
        onOpenChange={jest.fn()}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('沒有找到可綁定的訂單')).toBeInTheDocument();
    });
  });

  it('應該在關閉時重置表單', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = jest.fn();

    const { rerender } = render(
      <BindOrdersDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單
    const firstOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(firstOrderTrigger!);

    // 等待展開並選擇第一個項目
    let firstCheckbox: HTMLElement;
    await waitFor(() => {
      firstCheckbox = screen.getAllByRole('checkbox')[0];
      expect(firstCheckbox).toBeInTheDocument();
    });
    
    await user.click(firstCheckbox!);

    // 關閉對話框
    rerender(
      <BindOrdersDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />
    );

    // 重新開啟
    rerender(
      <BindOrdersDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        purchase={mockPurchase}
        onSuccess={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // 展開第一個訂單檢查重置狀態
    const reopenedOrderTrigger = screen.getByText('ORD-001').closest('[data-slot="collapsible-trigger"]');
    await user.click(reopenedOrderTrigger!);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });
});