import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProductWizard } from '../CreateProductWizard';
import { ProductItem } from '@/types/api-helpers';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
}));

jest.mock('@/hooks', () => ({
  useCreateProduct: jest.fn(),
  useUpdateProduct: jest.fn(),
  useProductDetail: jest.fn(),
  useAttributes: jest.fn(),
  useUploadProductImage: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock step components
jest.mock('../wizard-steps', () => ({
  Step1_BasicInfo: ({ formData, updateFormData }: any) => (
    <div data-testid="step1-basic-info">
      <div>基本資訊步驟</div>
      <input
        data-testid="product-name"
        value={formData.basicInfo.name}
        onChange={(e) => updateFormData('basicInfo', { name: e.target.value })}
        placeholder="商品名稱"
      />
    </div>
  ),
  Step1_BasicInfoWithImage: ({ formData, updateFormData }: any) => (
    <div data-testid="step1-basic-info-with-image">
      <div>基本資訊步驟（含圖片）</div>
      <input
        data-testid="product-name"
        value={formData.basicInfo.name}
        onChange={(e) => updateFormData('basicInfo', { name: e.target.value })}
        placeholder="商品名稱"
      />
    </div>
  ),
  Step2_DefineSpecs: ({ formData, updateFormData }: any) => (
    <div data-testid="step2-define-specs">
      <div>規格定義步驟</div>
      <label>
        <input
          type="checkbox"
          checked={formData.specifications.isVariable}
          onChange={(e) => updateFormData('specifications', { isVariable: e.target.checked })}
          data-testid="is-variable-checkbox"
        />
        多規格商品
      </label>
    </div>
  ),
  Step3_ConfigureVariants: ({ formData, updateFormData }: any) => (
    <div data-testid="step3-configure-variants">
      <div>變體配置步驟</div>
      <input
        data-testid="variant-sku"
        value={formData.variants.items[0]?.sku || ''}
        onChange={(e) => {
          const newVariants = [{
            key: 'variant-1',
            sku: e.target.value,
            price: formData.variants.items[0]?.price || '',
            options: []
          }];
          updateFormData('variants', { items: newVariants });
        }}
        placeholder="SKU"
      />
      <input
        data-testid="variant-price"
        value={formData.variants.items[0]?.price || ''}
        onChange={(e) => {
          const newVariants = [{
            key: 'variant-1',
            sku: formData.variants.items[0]?.sku || '',
            price: e.target.value,
            options: []
          }];
          updateFormData('variants', { items: newVariants });
        }}
        placeholder="價格"
      />
    </div>
  ),
  Step4_Review: ({ formData }: any) => (
    <div data-testid="step4-review">
      <div>預覽確認步驟</div>
      <div data-testid="review-content">
        商品名稱：{formData.basicInfo.name}
      </div>
    </div>
  ),
  EditProductFormSkeleton: () => (
    <div data-testid="loading-skeleton">載入中...</div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, ...props }: any) => (
    <div data-testid="progress-bar" data-value={value} {...props} />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

// Import mocked modules
import {
  useCreateProduct,
  useUpdateProduct,
  useProductDetail,
  useAttributes,
  useUploadProductImage,
} from '@/hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const mockUseCreateProduct = useCreateProduct as jest.MockedFunction<typeof useCreateProduct>;
const mockUseUpdateProduct = useUpdateProduct as jest.MockedFunction<typeof useUpdateProduct>;
const mockUseProductDetail = useProductDetail as jest.MockedFunction<typeof useProductDetail>;
const mockUseAttributes = useAttributes as jest.MockedFunction<typeof useAttributes>;
const mockUseUploadProductImage = useUploadProductImage as jest.MockedFunction<typeof useUploadProductImage>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('CreateProductWizard', () => {
  const mockPush = jest.fn();
  const mockMutateAsync = jest.fn();

  const mockProduct: ProductItem = {
    id: 1,
    name: '測試商品',
    description: '測試描述',
    category_id: 1,
    variants: [
      {
        id: 1,
        sku: 'TEST-001',
        price: '100.00',
        product_id: 1,
      },
    ],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockAttributes = {
    data: [
      {
        id: 1,
        name: '顏色',
        values: [
          { id: 1, value: '紅色', attribute_id: 1 },
          { id: 2, value: '藍色', attribute_id: 1 },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      replace: jest.fn(),
    } as any);

    mockUseCreateProduct.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      error: null,
    } as any);

    mockUseUpdateProduct.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      error: null,
    } as any);

    mockUseProductDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);

    mockUseAttributes.mockReturnValue({
      data: mockAttributes,
      isLoading: false,
      error: null,
    } as any);

    mockUseUploadProductImage.mockReturnValue({
      mutateAsync: jest.fn(),
      isLoading: false,
      error: null,
    } as any);
  });

  describe('基本渲染', () => {
    test('在創建模式下應該正確渲染', () => {
      render(<CreateProductWizard />);

      expect(screen.getByText('基本資訊')).toBeInTheDocument();
      expect(screen.getByTestId('step1-basic-info-with-image')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    test('應該顯示正確的步驟標題', () => {
      render(<CreateProductWizard />);

      expect(screen.getByText('基本資訊')).toBeInTheDocument();
      expect(screen.getByText('規格定義')).toBeInTheDocument();
      expect(screen.getByText('設定變體')).toBeInTheDocument();
      expect(screen.getByText('預覽確認')).toBeInTheDocument();
    });

    test('應該顯示正確的進度條', () => {
      render(<CreateProductWizard />);

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('data-value', '25');
    });
  });

  describe('編輯模式', () => {
    test('在編輯模式下應該顯示載入骨架', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);

      render(<CreateProductWizard productId={1} />);

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    test('在編輯模式下應該預填商品數據', async () => {
      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any);

      render(<CreateProductWizard productId={1} />);

      await waitFor(() => {
        const nameInput = screen.getByTestId('product-name');
        expect(nameInput).toHaveValue('測試商品');
      });
    });

    test('應該處理商品載入錯誤', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('載入失敗'),
      } as any);

      render(<CreateProductWizard productId={1} />);

      // 有錯誤時應該顯示錯誤訊息
      expect(screen.getByText('無法載入商品')).toBeInTheDocument();
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });
  });

  describe('步驟導航', () => {
    test('應該能夠導航到下一步', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 填寫商品名稱
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      // 點擊下一步 (使用外部按鈕)
      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 應該進入第二步
      expect(screen.getByTestId('step2-define-specs')).toBeInTheDocument();
    });

    test('應該能夠導航到上一步', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 先進入第二步
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 點擊上一步
      const prevButton = screen.getByRole('button', { name: /上一步/ });
      await user.click(prevButton);

      // 應該回到第一步
      expect(screen.getByTestId('step1-basic-info-with-image')).toBeInTheDocument();
    });

    test('當表單驗證失敗時不應該能夠進入下一步', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 不填寫商品名稱直接點擊下一步
      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 應該仍然在第一步
      expect(screen.getByTestId('step1-basic-info-with-image')).toBeInTheDocument();
    });
  });

  describe('表單數據管理', () => {
    test('應該能夠更新基本資訊', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '新商品名稱');

      expect(nameInput).toHaveValue('新商品名稱');
    });

    test('應該能夠切換商品類型', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 先進入第二步
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 切換為多規格商品
      const variableCheckbox = screen.getByTestId('is-variable-checkbox');
      await user.click(variableCheckbox);

      expect(variableCheckbox).toBeChecked();
    });

    test('應該能夠配置變體資訊', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 進入第三步
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 配置變體
      const skuInput = screen.getByTestId('variant-sku');
      const priceInput = screen.getByTestId('variant-price');

      await user.type(skuInput, 'TEST-001');
      await user.type(priceInput, '100');

      expect(skuInput).toHaveValue('TEST-001');
      expect(priceInput).toHaveValue('100');
    });
  });

  describe('表單驗證', () => {
    test('第一步應該驗證商品名稱', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 不填寫商品名稱直接點擊下一步
      const nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 應該仍然在第一步
      expect(screen.getByTestId('step1-basic-info-with-image')).toBeInTheDocument();
    });

    test('第三步應該驗證變體資訊', async () => {
      const user = userEvent.setup();
      render(<CreateProductWizard />);

      // 進入第三步
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 不填寫變體資訊直接點擊下一步
      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 應該仍然在第三步
      expect(screen.getByTestId('step3-configure-variants')).toBeInTheDocument();
    });
  });

  describe('API 整合', () => {
    test('應該能夠成功創建商品', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ data: { id: 1 } });

      render(<CreateProductWizard />);

      // 填寫完整的表單
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      // 進入第二步
      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 進入第三步
      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 填寫變體資訊
      const skuInput = screen.getByTestId('variant-sku');
      const priceInput = screen.getByTestId('variant-price');
      await user.type(skuInput, 'TEST-001');
      await user.type(priceInput, '100');

      // 進入第四步
      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /完成創建/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    test('應該能夠成功更新商品', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ data: { id: 1 } });

      mockUseProductDetail.mockReturnValue({
        data: mockProduct,
        isLoading: false,
        error: null,
      } as any);

      render(<CreateProductWizard productId={1} />);

      // 等待資料載入
      await waitFor(() => {
        expect(screen.getByTestId('product-name')).toHaveValue('測試商品');
      });

      // 進入最後一步
      const nameInput = screen.getByTestId('product-name');
      expect(nameInput).toHaveValue('測試商品');

      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /完成更新/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    test('應該處理 API 錯誤', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error('API 錯誤'));

      render(<CreateProductWizard />);

      // 填寫完整的表單
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      // 進入最後一步
      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      const skuInput = screen.getByTestId('variant-sku');
      const priceInput = screen.getByTestId('variant-price');
      await user.type(skuInput, 'TEST-001');
      await user.type(priceInput, '100');

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /完成創建/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('商品創建失敗', {
          id: 'submit-progress',
          description: 'API 錯誤',
          duration: 6000,
        });
      });
    });
  });

  describe('提交狀態', () => {
    test('提交時應該顯示載入狀態', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateProductWizard />);

      // 填寫完整的表單並進入最後一步
      const nameInput = screen.getByTestId('product-name');
      await user.type(nameInput, '測試商品');

      let nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      const skuInput = screen.getByTestId('variant-sku');
      const priceInput = screen.getByTestId('variant-price');
      await user.type(skuInput, 'TEST-001');
      await user.type(priceInput, '100');

      nextButton = screen.getByRole('button', { name: /下一步/ });
      await user.click(nextButton);

      // 提交表單
      const submitButton = screen.getByRole('button', { name: /完成創建/ });
      
      // 模擬載入狀態
      mockUseCreateProduct.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isLoading: true,
        error: null,
      } as any);

      await user.click(submitButton);

      // 應該顯示載入狀態 - 檢查按鈕被禁用
      expect(submitButton).toBeDisabled();
    });
  });

  describe('錯誤處理', () => {
    test('應該處理無效的產品 ID', () => {
      mockUseProductDetail.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('找不到商品'),
      } as any);

      render(<CreateProductWizard productId="invalid" />);

      // 應該顯示錯誤訊息
      expect(screen.getByText('無法載入商品')).toBeInTheDocument();
    });

    test('應該處理空的屬性資料', () => {
      mockUseAttributes.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<CreateProductWizard />);

      // 應該正常渲染
      expect(screen.getByTestId('step1-basic-info-with-image')).toBeInTheDocument();
    });
  });
}); 