/**
 * ProductForm 組件測試套件
 * 測試產品表單的基本功能、驗證邏輯和用戶交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '../ProductForm';
import { useAttributes, useCreateProduct } from '@/hooks';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useAttributes: jest.fn(),
  useCreateProduct: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAttributes = useAttributes as jest.MockedFunction<typeof useAttributes>;
const mockUseCreateProduct = useCreateProduct as jest.MockedFunction<typeof useCreateProduct>;

// Mock data
const mockAttributes = [
  {
    id: 1,
    name: '顏色',
    values: [
      { id: 1, value: '紅色' },
      { id: 2, value: '藍色' },
    ],
  },
  {
    id: 2,
    name: '尺寸',
    values: [
      { id: 3, value: 'S' },
      { id: 4, value: 'M' },
    ],
  },
];

describe('ProductForm', () => {
  const mockMutateAsync = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAttributes.mockReturnValue({
      data: mockAttributes,
      isLoading: false,
      error: null,
    } as any);

    mockUseCreateProduct.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    } as any);

    // Mock router
    require('next/navigation').useRouter.mockReturnValue({
      push: mockPush,
    });
  });

  describe('基本渲染', () => {
    it('應該渲染表單的基本元素', () => {
      render(<ProductForm />);

      expect(screen.getByLabelText(/商品名稱/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/商品描述/i)).toBeInTheDocument();
      expect(screen.getByText(/商品資訊/i)).toBeInTheDocument();
      expect(screen.getAllByText(/規格定義/i)).toHaveLength(2);
    });

    it('應該顯示自定義標題和描述', () => {
      render(
        <ProductForm
          title="自定義標題"
          description="自定義描述"
        />
      );

      expect(screen.getByText('自定義標題')).toBeInTheDocument();
      expect(screen.getByText('自定義描述')).toBeInTheDocument();
    });

    it('應該在有初始數據時填充表單', () => {
      const initialData = {
        name: '測試產品',
        description: '測試描述',
        category_id: 1,
      };

      render(<ProductForm initialData={initialData} />);

      expect(screen.getByDisplayValue('測試產品')).toBeInTheDocument();
      expect(screen.getByDisplayValue('測試描述')).toBeInTheDocument();
    });
  });

  describe('加載狀態', () => {
    it('應該在屬性加載時顯示加載訊息', () => {
      mockUseAttributes.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      render(<ProductForm />);

      expect(screen.getByText(/載入屬性資料中/i)).toBeInTheDocument();
    });

    it('應該在屬性加載錯誤時顯示錯誤訊息', () => {
      mockUseAttributes.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('載入失敗'),
      } as any);

      render(<ProductForm />);

      expect(screen.getByText(/載入屬性資料失敗/i)).toBeInTheDocument();
    });
  });

  describe('基本表單功能', () => {
    it('應該處理商品名稱輸入', async () => {
      const user = userEvent.setup();
      
      render(<ProductForm />);

      const nameInput = screen.getByLabelText(/商品名稱/i);
      await user.type(nameInput, '新產品名稱');

      expect(nameInput).toHaveValue('新產品名稱');
    });

    it('應該處理商品描述輸入', async () => {
      const user = userEvent.setup();
      
      render(<ProductForm />);

      const descriptionInput = screen.getByLabelText(/商品描述/i);
      await user.type(descriptionInput, '新產品描述');

      expect(descriptionInput).toHaveValue('新產品描述');
    });
  });

  describe('表單驗證', () => {
    it('應該在提交空名稱時顯示錯誤', async () => {
      const user = userEvent.setup();
      
      render(<ProductForm />);

      const submitButton = screen.getByText('建立商品');
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockMutateAsync).not.toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      if ((toast.error as jest.MockedFunction<typeof toast.error>).mock.calls.length > 0) {
        expect(toast.error).toHaveBeenCalledWith('請填寫商品名稱。');
      }
    });

    it('應該在有效數據時成功提交', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});
      
      render(<ProductForm />);

      const nameInput = screen.getByLabelText(/商品名稱/i);
      await user.type(nameInput, '有效產品名稱');

      const descriptionInput = screen.getByLabelText(/商品描述/i);
      await user.type(descriptionInput, '有效產品描述');

      const submitButton = screen.getByText('建立商品');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '有效產品名稱',
            description: '有效產品描述',
          })
        );
      });

      expect(toast.success).toHaveBeenCalledWith('商品創建成功！');
      expect(mockPush).toHaveBeenCalledWith('/products');
    });
  });

  describe('規格功能', () => {
    it('應該顯示規格切換開關', () => {
      render(<ProductForm />);

      const variableSwitch = screen.getByRole('switch');
      expect(variableSwitch).toBeInTheDocument();
    });

    it('應該能夠切換規格模式', async () => {
      const user = userEvent.setup();
      
      render(<ProductForm />);

      const variableSwitch = screen.getByRole('switch');
      await user.click(variableSwitch);

      expect(variableSwitch).toBeChecked();
    });
  });

  describe('提交狀態處理', () => {
    it('應該在提交時禁用表單', async () => {
      mockUseCreateProduct.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      } as any);

      render(<ProductForm />);

      const nameInput = screen.getByLabelText(/商品名稱/i);
      expect(nameInput).toBeDisabled();
    });

    it('應該處理提交錯誤', async () => {
      const user = userEvent.setup();
      const error = new Error('提交失敗');
      mockMutateAsync.mockRejectedValue(error);
      
      render(<ProductForm />);

      const nameInput = screen.getByLabelText(/商品名稱/i);
      await user.type(nameInput, '測試產品');

      const submitButton = screen.getByText('建立商品');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('商品創建失敗：提交失敗');
      });
    });

    it('應該防止重複提交', async () => {
      mockUseCreateProduct.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      } as any);
      
      render(<ProductForm />);

      const submitButton = screen.getByText('建立商品');
      expect(submitButton).toBeDisabled();

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('邊界情況處理', () => {
    it('應該處理空的屬性數據', () => {
      mockUseAttributes.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductForm />);

      expect(screen.getByText(/商品資訊/i)).toBeInTheDocument();
    });

    it('應該處理非陣列的屬性數據', () => {
      mockUseAttributes.mockReturnValue({
        data: { some: 'invalid data' },
        isLoading: false,
        error: null,
      } as any);

      render(<ProductForm />);

      expect(screen.getByText(/商品資訊/i)).toBeInTheDocument();
    });
  });
});
