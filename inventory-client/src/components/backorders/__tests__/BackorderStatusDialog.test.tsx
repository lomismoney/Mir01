import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackorderStatusDialog } from '../BackorderStatusDialog';
import { useUpdateBackorderTransferStatus } from '@/hooks/mutations/backorders/useUpdateBackorderTransferStatus';

// Mock dependencies
jest.mock('@/hooks/mutations/backorders/useUpdateBackorderTransferStatus');
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
  toast: jest.fn(),
}));

const mockUseUpdateBackorderTransferStatus = useUpdateBackorderTransferStatus as jest.MockedFunction<typeof useUpdateBackorderTransferStatus>;

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

describe('BackorderStatusDialog', () => {
  const mockItem = {
    id: 1,
    product_name: '測試商品',
    sku: 'TEST-001',
    quantity: 5,
    integrated_status: 'transfer_in_transit',
    integrated_status_text: '庫存調撥中',
    transfer: {
      id: 10,
      status: 'in_transit',
    },
  };

  const mockMutate = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateBackorderTransferStatus.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
    } as any);
    
    // Get the mocked useToast
    const { useToast } = require('@/components/ui/use-toast');
    useToast.mockReturnValue({
      toast: mockToast,
    });
  });

  it('應該顯示商品資訊', () => {
    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('測試商品 - TEST-001')).toBeInTheDocument();
    expect(screen.getByText('數量: 5')).toBeInTheDocument();
    expect(screen.getByText('庫存調撥中')).toBeInTheDocument();
  });

  it('沒有轉移記錄時應該顯示提示訊息', () => {
    const itemWithoutTransfer = {
      ...mockItem,
      transfer: undefined,
    };

    render(
      <BackorderStatusDialog
        item={itemWithoutTransfer}
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('此項目沒有相關的庫存轉移記錄')).toBeInTheDocument();
  });

  it('應該根據當前狀態限制可選狀態', async () => {
    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // 點擊狀態選擇器
    const statusSelect = screen.getByRole('combobox');
    await userEvent.click(statusSelect);

    // in_transit 狀態下應該可以選擇的狀態
    // 使用 getAllByText 因為「運送中」會出現在選中值和選項中
    const inTransitElements = screen.getAllByText('運送中');
    expect(inTransitElements.length).toBeGreaterThan(0);
    
    // 使用 getAllByText 因為這些文字可能出現多次
    const completedElements = screen.getAllByText('已完成');
    expect(completedElements.length).toBeGreaterThan(0);
    
    const cancelledElements = screen.getAllByText('已取消');
    expect(cancelledElements.length).toBeGreaterThan(0);
    
    // 不應該顯示待處理（因為已經是運送中）
    expect(screen.queryByText('待處理')).not.toBeInTheDocument();
  });

  it('應該能夠提交狀態更新', async () => {
    const onSuccess = jest.fn();
    const onOpenChange = jest.fn();

    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // 選擇新狀態
    const statusSelect = screen.getByRole('combobox');
    await userEvent.click(statusSelect);
    // 選擇「已完成」選項 - 使用更具體的選擇器
    const completedOption = screen.getAllByText('已完成').find(el => 
      el.closest('[role="option"]')
    );
    if (completedOption) {
      await userEvent.click(completedOption);
    }

    // 輸入備註
    const notesTextarea = screen.getByPlaceholderText('輸入狀態變更的備註...');
    await userEvent.type(notesTextarea, '貨品已到達');

    // 提交表單
    const submitButton = screen.getByRole('button', { name: '更新狀態' });
    await userEvent.click(submitButton);

    // 檢查是否調用了 mutate
    expect(mockMutate).toHaveBeenCalledWith(
      {
        item_id: 1,
        status: 'completed',
        notes: '貨品已到達',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
        onSettled: expect.any(Function),
      })
    );
  });

  it('成功更新後應該顯示成功訊息並關閉對話框', async () => {
    const onSuccess = jest.fn();
    const onOpenChange = jest.fn();

    mockMutate.mockImplementation((data, options) => {
      // 直接同步執行回調
      options?.onSuccess?.({
        message: '轉移狀態更新成功',
        data: {
          item_id: 1,
          transfer_id: 10,
          new_status: 'completed',
          integrated_status: 'transfer_completed',
          integrated_status_text: '調撥完成',
        },
      });
    });

    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // 等待表單初始化完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // 選擇新狀態
    const statusSelect = screen.getByRole('combobox');
    await userEvent.click(statusSelect);
    
    // 等待選項出現
    await waitFor(() => {
      const options = screen.getAllByText('已完成');
      expect(options.length).toBeGreaterThan(0);
    });
    
    // 選擇「已完成」選項
    const completedOption = screen.getAllByText('已完成').find(el => 
      el.closest('[role="option"]')
    );
    if (completedOption) {
      await userEvent.click(completedOption);
    }

    // 輸入備註
    const notesTextarea = screen.getByPlaceholderText('輸入狀態變更的備註...');
    await userEvent.type(notesTextarea, '貨品已到達');

    // 提交表單
    const submitButton = screen.getByRole('button', { name: '更新狀態' });
    await userEvent.click(submitButton);

    // 檢查是否調用了 mutate 以及正確的參數
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          item_id: 1,
          status: 'completed',
          notes: '貨品已到達',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
          onSettled: expect.any(Function),
        })
      );
    });

    // 檢查回調
    expect(mockToast).toHaveBeenCalledWith({
      title: '成功',
      description: '轉移狀態已更新',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('更新失敗時應該顯示錯誤訊息', async () => {
    const errorMessage = '更新失敗：權限不足';
    
    mockMutate.mockImplementation((data, options) => {
      // 直接同步執行回調
      options?.onError?.(new Error(errorMessage));
      options?.onSettled?.();
    });

    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // 等待表單初始化完成
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // 選擇新狀態
    const statusSelect = screen.getByRole('combobox');
    await userEvent.click(statusSelect);
    
    // 等待選項出現
    await waitFor(() => {
      const options = screen.getAllByText('已完成');
      expect(options.length).toBeGreaterThan(0);
    });
    
    // 選擇「已完成」選項
    const completedOption = screen.getAllByText('已完成').find(el => 
      el.closest('[role="option"]')
    );
    if (completedOption) {
      await userEvent.click(completedOption);
    }

    // 輸入備註
    const notesTextarea = screen.getByPlaceholderText('輸入狀態變更的備註...');
    await userEvent.type(notesTextarea, '測試備註');

    // 提交表單
    const submitButton = screen.getByRole('button', { name: '更新狀態' });
    await userEvent.click(submitButton);

    // 檢查是否調用了 mutate 以及正確的參數
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          item_id: 1,
          status: 'completed',
          notes: '測試備註',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
          onSettled: expect.any(Function),
        })
      );
    });

    // 檢查錯誤提示
    expect(mockToast).toHaveBeenCalledWith({
      variant: 'destructive',
      title: '錯誤',
      description: errorMessage,
    });
  });

  it('點擊取消應該關閉對話框', async () => {
    const onOpenChange = jest.fn();

    render(
      <BackorderStatusDialog
        item={mockItem}
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole('button', { name: '取消' });
    await userEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('已完成狀態的轉移不應該允許更改', async () => {
    const completedItem = {
      ...mockItem,
      transfer: {
        id: 10,
        status: 'completed',
      },
    };

    render(
      <BackorderStatusDialog
        item={completedItem}
        open={true}
        onOpenChange={() => {}}
        onSuccess={() => {}}
      />,
      { wrapper: createWrapper() }
    );

    // 點擊狀態選擇器
    const statusSelect = screen.getByRole('combobox');
    await userEvent.click(statusSelect);

    // 只應該顯示已完成
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    // 使用 getAllByText 因為「已完成」會出現在選中值和選項中
    const completedElements = screen.getAllByText('已完成');
    expect(completedElements.length).toBeGreaterThan(0);
  });
});