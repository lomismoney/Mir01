import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallationForm, InstallationFormValues } from '../InstallationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useUsers: jest.fn(() => ({
    data: {
      data: [
        {
          id: 1,
          name: '安裝師傅1',
          email: 'installer1@example.com',
          roles: ['installer'],
        },
        {
          id: 2,
          name: '安裝師傅2',
          email: 'installer2@example.com',
          roles: ['installer'],
        },
        {
          id: 3,
          name: '管理員',
          email: 'admin@example.com',
          roles: ['admin'],
        },
      ],
    },
    isLoading: false,
  })),
  useErrorHandler: jest.fn(() => ({
    handleError: jest.fn(),
  })),
}));

interface MockProductSelectorProps {
  onValueChange?: (productVariantId: number, productVariant?: {
    id: number;
    sku: string;
    product: { name: string };
  }) => void;
  disabled?: boolean;
  placeholder?: string;
  showCurrentStock?: boolean;
}

jest.mock('@/components/inventory/ProductSelector', () => ({
  ProductSelector: ({ onValueChange, disabled, placeholder, showCurrentStock }: MockProductSelectorProps) => (
    <div>
      <input
        data-testid="product-selector"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const value = parseInt(e.target.value);
          if (value > 0) {
            onValueChange?.(value, {
              id: value,
              sku: `SKU-${value}`,
              product: { name: `產品${value}` },
            });
          }
        }}
      />
      {showCurrentStock && <span>庫存顯示</span>}
    </div>
  ),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Helper to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('InstallationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('新增模式', () => {
    it('應該顯示正確的標題和預設欄位', () => {
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('新增安裝單')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('請輸入客戶姓名')).toHaveValue('');
      expect(screen.getByPlaceholderText('請輸入客戶電話')).toHaveValue('');
      expect(screen.getByPlaceholderText('請輸入詳細的安裝地址')).toHaveValue('');
    });

    it('應該顯示一個預設的安裝項目', () => {
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('安裝項目 #1')).toBeInTheDocument();
      expect(screen.getByTestId('product-selector')).toBeInTheDocument();
    });

    it('應該能新增安裝項目', async () => {
      const user = userEvent.setup();
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByText('新增項目');
      await user.click(addButton);

      expect(screen.getByText('安裝項目 #1')).toBeInTheDocument();
      expect(screen.getByText('安裝項目 #2')).toBeInTheDocument();
    });

    it('應該能刪除安裝項目', async () => {
      const user = userEvent.setup();
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 先新增一個項目
      await user.click(screen.getByText('新增項目'));
      expect(screen.getByText('安裝項目 #2')).toBeInTheDocument();

      // 刪除第二個項目 - 透過尋找包含"安裝項目 #2"的區塊中的刪除按鈕
      const allItems = screen.getAllByText(/安裝項目 #\d+/);
      const secondItem = allItems[1]; // 第二個項目
      const secondItemContainer = secondItem.closest('.border');
      
      if (secondItemContainer) {
        const deleteButton = secondItemContainer.querySelector('button[class*="hover:bg-destructive"]');
        if (deleteButton) {
          await user.click(deleteButton);
        }
      }

      expect(screen.queryByText('安裝項目 #2')).not.toBeInTheDocument();
    });

    it('應該驗證必填欄位', async () => {
      const user = userEvent.setup();
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 直接提交空表單
      const submitButton = screen.getByText('創建安裝單');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('表單驗證失敗', {
          description: '請檢查必填欄位是否已正確填寫'
        });
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('應該能填寫並提交表單', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();
      render(
        <InstallationForm
          onSubmit={handleSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 填寫客戶資訊
      await user.type(screen.getByPlaceholderText('請輸入客戶姓名'), '張三');
      await user.type(screen.getByPlaceholderText('請輸入客戶電話'), '0912345678');
      await user.type(screen.getByPlaceholderText('請輸入詳細的安裝地址'), '台北市信義區信義路五段7號');

      // 選擇商品
      const productSelector = screen.getByTestId('product-selector');
      fireEvent.change(productSelector, { target: { value: '1' } });

      // 提交表單
      await user.click(screen.getByText('創建安裝單'));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it.skip('應該只顯示有 installer 角色的用戶', async () => {
      // TODO: 這個測試需要重新設計，因為安裝師傅選擇在右側欄
      // 目前的測試結構無法正確渲染完整的表單佈局
      const user = userEvent.setup();
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 點擊選擇框以顯示選項
      // 找到包含「選擇安裝師傅」文字的按鈕
      const selectTrigger = screen.getByText('選擇安裝師傅');
      await user.click(selectTrigger);

      // 等待選項出現
      await waitFor(() => {
        expect(screen.getByText('安裝師傅1')).toBeInTheDocument();
        expect(screen.getByText('安裝師傅2')).toBeInTheDocument();
        // 管理員不應該出現，因為他沒有 installer 角色
        expect(screen.queryByText('管理員')).not.toBeInTheDocument();
      });
    });
  });

  describe('編輯模式', () => {
    const initialData: Partial<InstallationFormValues> = {
      customer_name: '李四',
      customer_phone: '0987654321',
      installation_address: '台中市西區台灣大道二段2號',
      installer_user_id: 2,
      scheduled_date: '2024-03-15',
      notes: '請準時到達',
      items: [
        {
          product_variant_id: 10,
          product_name: '既有產品',
          sku: 'SKU-10',
          quantity: 3,
          specifications: '牆掛式',
          notes: '客廳安裝',
        },
      ],
    };

    it('應該顯示正確的標題和初始資料', () => {
      render(
        <InstallationForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('編輯安裝單')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('請輸入客戶姓名')).toHaveValue('李四');
      expect(screen.getByPlaceholderText('請輸入客戶電話')).toHaveValue('0987654321');
      expect(screen.getByPlaceholderText('請輸入詳細的安裝地址')).toHaveValue('台中市西區台灣大道二段2號');
    });

    it('應該顯示已選擇的商品資訊', () => {
      render(
        <InstallationForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('既有產品')).toBeInTheDocument();
      expect(screen.getByText('SKU: SKU-10')).toBeInTheDocument();
      expect(screen.getByText('ID: 10', { exact: false })).toBeInTheDocument();
    });

    it('應該能更換已選擇的商品', async () => {
      const user = userEvent.setup();
      render(
        <InstallationForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 點擊更換商品按鈕
      await user.click(screen.getByText('更換商品'));

      // 應該顯示商品選擇器
      expect(screen.getByTestId('product-selector')).toBeInTheDocument();
      
      // 原有的商品資訊應該被隱藏
      expect(screen.queryByText('既有產品')).not.toBeInTheDocument();
    });
  });

  describe('日期選擇功能', () => {
    it('應該顯示日期選擇按鈕', () => {
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />,
        { wrapper: createWrapper() }
      );

      // 確認日期選擇按鈕存在
      expect(screen.getByText('選擇安裝日期')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在提交時顯示載入狀態', () => {
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />,
        { wrapper: createWrapper() }
      );

      // 檢查提交按鈕顯示載入狀態
      expect(screen.getByText('創建中...')).toBeInTheDocument();
      expect(screen.getByText('創建中...')).toBeDisabled();
      
      // 檢查商品選擇器是否被禁用
      expect(screen.getByTestId('product-selector')).toBeDisabled();
    });
  });

  describe('取消功能', () => {
    it('應該在有 onCancel 時顯示取消按鈕', () => {
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('應該在點擊取消時呼叫 onCancel', async () => {
      const user = userEvent.setup();
      render(
        <InstallationForm
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
        />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByText('取消'));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});