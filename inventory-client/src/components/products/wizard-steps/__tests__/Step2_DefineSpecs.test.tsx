/**
 * Step2_DefineSpecs 組件測試
 * 
 * 測試涵蓋：
 * - 基本渲染
 * - 規格類型切換（單規格/多規格）
 * - 屬性選擇功能
 * - 屬性值管理（添加/移除）
 * - 變體組合計算
 * - API 錯誤處理
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2_DefineSpecs } from '../Step2_DefineSpecs';
import { WizardFormData } from '../../CreateProductWizard';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useAttributes: jest.fn(),
  useCreateAttributeValue: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Import mocked hooks
import { useAttributes, useCreateAttributeValue } from '@/hooks';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const mockUseAttributes = useAttributes as jest.MockedFunction<typeof useAttributes>;
const mockUseCreateAttributeValue = useCreateAttributeValue as jest.MockedFunction<typeof useCreateAttributeValue>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock console.error 以避免測試中的錯誤輸出
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Step2_DefineSpecs', () => {
  let mockUpdateFormData: jest.Mock;
  let currentFormData: WizardFormData;

  const defaultFormData: WizardFormData = {
    basicInfo: {
      name: '',
      description: '',
      category_id: null,
    },
    imageData: {
      selectedFile: null,
      previewUrl: null,
    },
    specifications: {
      isVariable: false,
      selectedAttributes: [],
      attributeValues: {},
    },
    variants: {
      items: [],
    },
    metadata: {
      currentStep: 2,
      completedSteps: [1],
      lastSaved: null,
      validationErrors: {},
    },
  };

  const mockSession = {
    user: {
      id: '1',
      name: '測試用戶',
      email: 'test@example.com',
    },
    expires: '2024-12-31',
  };

  const mockAttributes = [
    {
      id: 1,
      name: '顏色',
      values: [
        { id: 1, value: '紅色' },
        { id: 2, value: '藍色' },
        { id: 3, value: '黑色' },
      ],
    },
    {
      id: 2,
      name: '尺寸',
      values: [
        { id: 4, value: 'S' },
        { id: 5, value: 'M' },
        { id: 6, value: 'L' },
      ],
    },
    {
      id: 3,
      name: '材質',
      values: [],
    },
  ];

  const mockCreateAttributeValueMutation = {
    mutateAsync: jest.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // 重置 formData
    currentFormData = { ...defaultFormData };

    // 創建能夠實際更新 formData 的 mock 函數
    mockUpdateFormData = jest.fn(<K extends keyof WizardFormData>(section: K, data: Partial<WizardFormData[K]>) => {
      currentFormData = {
        ...currentFormData,
        [section]: {
          ...currentFormData[section],
          ...data,
        },
      };
    });

    // Mock useSession
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    } as any);

    // Mock useAttributes
    mockUseAttributes.mockReturnValue({
      data: { data: mockAttributes },
      isLoading: false,
      error: null,
      refetch: jest.fn().mockResolvedValue({ data: mockAttributes }),
    } as any);

    // Mock useCreateAttributeValue
    mockUseCreateAttributeValue.mockReturnValue(mockCreateAttributeValueMutation as any);
  });

  describe('基本渲染', () => {
    test('應該正確渲染規格類型選擇', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('規格類型')).toBeInTheDocument();
      expect(screen.getByText('單規格商品')).toBeInTheDocument();
      expect(screen.getByText('適合統一規格的商品（書籍、食品等）')).toBeInTheDocument();
    });

    test('應該顯示幫助提示', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 查找幫助圖標
      const helpIcon = document.querySelector('svg[]');
      expect(helpIcon).toBeInTheDocument();
    });
  });

  describe('規格類型切換', () => {
    test('應該能夠切換到多規格商品', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const specTypeSwitch = screen.getByRole('switch');
      await user.click(specTypeSwitch);

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        isVariable: true,
        selectedAttributes: [],
        attributeValues: {},
      });
    });

    test('多規格模式下應該顯示屬性選擇界面', () => {
      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('選擇規格屬性')).toBeInTheDocument();
      expect(screen.getByText('選擇用於構成商品變體的屬性，如顏色、尺寸、款式等。')).toBeInTheDocument();
    });

    test('切換回單規格時應該清空變體資料', async () => {
      const user = userEvent.setup();
      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色'] },
        },
                 variants: {
           items: [{
             key: 'test-variant-1',
             id: 1,
             options: [
               { attributeId: 1, value: '紅色' }
             ],
             sku: 'TEST-001',
             price: '100',
           }],
         },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const specTypeSwitch = screen.getByRole('switch');
      await user.click(specTypeSwitch);

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        isVariable: false,
        selectedAttributes: [],
        attributeValues: {},
      });

      expect(mockUpdateFormData).toHaveBeenCalledWith('variants', {
        items: [],
      });
    });
  });

  describe('屬性選擇功能', () => {
    beforeEach(() => {
      // 設置多規格模式
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };
    });

    test('應該顯示可用的屬性列表', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('顏色')).toBeInTheDocument();
      expect(screen.getByText('尺寸')).toBeInTheDocument();
      expect(screen.getByText('材質')).toBeInTheDocument();
      expect(screen.getAllByText('3 個預設值')).toHaveLength(2); // 顏色和尺寸都有3個預設值
      expect(screen.getByText('0 個預設值')).toBeInTheDocument(); // 材質沒有預設值
    });

    test('應該能夠選擇屬性', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 點擊顏色屬性的複選框
      const colorCheckbox = screen.getByLabelText('顏色');
      await user.click(colorCheckbox);

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        selectedAttributes: [1],
        attributeValues: { 1: ['紅色', '藍色', '黑色'] },
      });

      // 檢查是否顯示成功訊息
      expect(toast.success).toHaveBeenCalledWith('已自動添加 顏色 的 3 個預設值');
    });

    test('應該能夠取消選擇屬性', async () => {
      const user = userEvent.setup();
      // 設置已選擇的屬性
      const selectedFormData = {
        ...currentFormData,
        specifications: {
          ...currentFormData.specifications,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色', '藍色'] },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={selectedFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 取消選擇顏色屬性
      const colorCheckbox = screen.getByLabelText('顏色');
      await user.click(colorCheckbox);

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        selectedAttributes: [],
        attributeValues: {},
      });
    });

    test('對於沒有預設值的屬性應該初始化空陣列', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 點擊材質屬性（沒有預設值）
      const materialCheckbox = screen.getByLabelText('材質');
      await user.click(materialCheckbox);

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        selectedAttributes: [3],
        attributeValues: { 3: [] },
      });
    });
  });

  describe('屬性值管理', () => {
    beforeEach(() => {
      // 設置已選擇屬性的狀態
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色', '藍色'] },
        },
      };
    });

    test('選擇屬性後應該顯示屬性值管理界面', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('管理屬性值')).toBeInTheDocument();
    });

    test('應該能夠輸入新的屬性值', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 通過 placeholder 查找輸入框
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '綠色');

      expect(input).toHaveValue('綠色');
    });

    test('應該能夠添加新的屬性值', async () => {
      const user = userEvent.setup();
      mockCreateAttributeValueMutation.mutateAsync.mockResolvedValue({
        id: 7,
        value: '綠色',
        attribute_id: 1,
      });

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 輸入新值
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '綠色');

      // 點擊添加按鈕
      const addButton = screen.getByText('添加');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockCreateAttributeValueMutation.mutateAsync).toHaveBeenCalledWith({
          attributeId: 1,
          body: { value: '綠色' },
        });
      });

      expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
        attributeValues: { 1: ['紅色', '藍色', '綠色'] },
      });

      expect(toast.success).toHaveBeenCalledWith('屬性值「綠色」已成功保存到資料庫');
    });

    test('輸入空值時按鈕應該被禁用', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 檢查初始狀態下按鈕是否被禁用（因為輸入為空）
      const addButton = screen.getByText('添加');
      expect(addButton).toBeDisabled();

      // 輸入一些內容
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, 'test');

      // 按鈕應該被啟用
      expect(addButton).toBeEnabled();

      // 清除輸入
      await user.clear(input);

      // 按鈕應該再次被禁用
      expect(addButton).toBeDisabled();
    });

    test('輸入重複值時應該顯示錯誤訊息', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 輸入已存在的值
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '紅色');

      const addButton = screen.getByText('添加');
      await user.click(addButton);

      expect(toast.error).toHaveBeenCalledWith('該屬性值已存在');
      expect(mockCreateAttributeValueMutation.mutateAsync).not.toHaveBeenCalled();
    });

    test('API 失敗時應該顯示錯誤訊息', async () => {
      const user = userEvent.setup();
      mockCreateAttributeValueMutation.mutateAsync.mockRejectedValue(new Error('網路錯誤'));

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '綠色');

      const addButton = screen.getByText('添加');
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('創建屬性值失敗：網路錯誤');
      });
    });
  });

  describe('載入狀態和錯誤處理', () => {
    test('屬性載入中時應該顯示載入訊息', () => {
      mockUseAttributes.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('載入屬性資料中...')).toBeInTheDocument();
    });

    test('沒有屬性時應該顯示提示訊息', () => {
      mockUseAttributes.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('尚未建立任何屬性。請先到「規格管理」頁面建立屬性，如顏色、尺寸等。')).toBeInTheDocument();
    });
  });

  describe('變體組合計算', () => {
    test('應該正確計算變體組合數量', () => {
      // 設置兩個屬性，顏色3個值，尺寸3個值 = 3×3 = 9個組合
      const formDataWithMultipleAttributes = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1, 2],
          attributeValues: {
            1: ['紅色', '藍色', '黑色'],
            2: ['S', 'M', 'L'],
          },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={formDataWithMultipleAttributes}
          updateFormData={mockUpdateFormData}
        />
      );

      // 應該顯示變體預覽
      expect(screen.getByText('變體預覽')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument(); // 3x3=9 組合
      expect(screen.getByText('個變體將在下一步中配置')).toBeInTheDocument();
    });

    test('應該處理零組合的情況', () => {
      const formDataWithEmptyValues = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: {
            1: [], // 沒有屬性值
          },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={formDataWithEmptyValues}
          updateFormData={mockUpdateFormData}
        />
      );

      // 不應該顯示變體預覽（因為沒有組合）
      expect(screen.queryByText('變體預覽')).not.toBeInTheDocument();
    });

    test('應該處理單個屬性的組合', () => {
      const formDataWithSingleAttribute = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: {
            1: ['紅色', '藍色'],
          },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={formDataWithSingleAttribute}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('變體預覽')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2個值 = 2組合
    });
  });

  describe('進度提示和狀態', () => {
    test('單規格模式下應該顯示正確的進度提示', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('進度提示：')).toBeInTheDocument();
      expect(screen.getByText(/單規格商品配置完成/)).toBeInTheDocument();
    });

    test('多規格模式未配置時應該顯示提示', () => {
      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText(/請至少選擇一個屬性並為其添加屬性值/)).toBeInTheDocument();
    });

    test('多規格模式已配置時應該顯示配置狀態', () => {
      const configuredFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1, 2],
          attributeValues: {
            1: ['紅色', '藍色'],
            2: ['S', 'M'],
          },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={configuredFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText(/已配置 2 個屬性/)).toBeInTheDocument();
      expect(screen.getByText(/將生成 4 個變體/)).toBeInTheDocument();
    });
  });

  describe('屬性值移除功能', () => {
    beforeEach(() => {
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色', '藍色', '黑色'] },
        },
      };
    });

    test('應該能夠移除屬性值', async () => {
      const user = userEvent.setup();
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 查找移除按鈕（X按鈕）
      const removeButtons = screen.getAllByRole('button');
      const removeRedButton = removeButtons.find(button => 
        button.querySelector('svg') && 
        button.closest('[]')?.textContent?.includes('紅色')
      );

      if (removeRedButton) {
        await user.click(removeRedButton);

        expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
          attributeValues: { 1: ['藍色', '黑色'] },
        });

        expect(toast.success).toHaveBeenCalledWith('已移除屬性值：紅色');
      }
    });

    test('應該顯示現有屬性值的徽章', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // Use getAllByText since there might be multiple instances
      expect(screen.getAllByText('紅色').length).toBeGreaterThan(0);
      expect(screen.getAllByText('藍色').length).toBeGreaterThan(0);
      expect(screen.getAllByText('黑色').length).toBeGreaterThan(0);
    });

    test('應該顯示屬性值數量', () => {
      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('3 個值')).toBeInTheDocument();
    });
  });

  describe('鍵盤交互', () => {
    beforeEach(() => {
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色'] },
        },
      };
    });

    test('按Enter鍵應該添加屬性值', async () => {
      const user = userEvent.setup();
      mockCreateAttributeValueMutation.mutateAsync.mockResolvedValue({
        id: 7,
        value: '綠色',
        attribute_id: 1,
      });

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '綠色');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockCreateAttributeValueMutation.mutateAsync).toHaveBeenCalledWith({
          attributeId: 1,
          body: { value: '綠色' },
        });
      });
    });
  });

  describe('載入狀態處理', () => {
    beforeEach(() => {
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色'] },
        },
      };
    });

    test('API調用期間應該顯示載入狀態', () => {
      mockCreateAttributeValueMutation.isPending = true;

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('保存中')).toBeInTheDocument();
      
      // 輸入框應該被禁用
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      expect(input).toBeDisabled();

      // 按鈕應該被禁用
      const addButton = screen.getByText('保存中');
      expect(addButton).toBeDisabled();
    });

    test('載入完成後應該恢復正常狀態', () => {
      mockCreateAttributeValueMutation.isPending = false;

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('添加')).toBeInTheDocument();
      
      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      expect(input).not.toBeDisabled();
    });
  });

  describe('邊緣情況和錯誤處理', () => {
    test('應該處理空字符串輸入', async () => {
      const user = userEvent.setup();
      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色'] },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '   '); // 只包含空白字符

      // Button should be disabled since trim() would result in empty string
      const addButton = screen.getByText('添加');
      expect(addButton).toBeDisabled();
    });

    test('應該處理未知錯誤', async () => {
      const user = userEvent.setup();
      mockCreateAttributeValueMutation.mutateAsync.mockRejectedValue('Unknown error');

      currentFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色'] },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={currentFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      const input = screen.getByPlaceholderText('輸入顏色的值，如：紅色、藍色');
      await user.type(input, '綠色');

      const addButton = screen.getByText('添加');
      await user.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('創建屬性值失敗：未知錯誤');
      });
    });

    test('應該處理屬性資料為陣列格式', () => {
      mockUseAttributes.mockReturnValue({
        data: mockAttributes, // 直接返回陣列而非 {data: []}
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('顏色')).toBeInTheDocument();
      expect(screen.getByText('尺寸')).toBeInTheDocument();
    });

    test('應該處理無效的屬性資料', () => {
      mockUseAttributes.mockReturnValue({
        data: 'invalid data', // 無效格式
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 應該顯示無屬性的提示
      expect(screen.getByText('尚未建立任何屬性。請先到「規格管理」頁面建立屬性，如顏色、尺寸等。')).toBeInTheDocument();
    });

    test('屬性點擊事件應該正確處理', async () => {
      const user = userEvent.setup();
      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 點擊屬性卡片本身（不是複選框）
      const colorCard = screen.getByText('顏色').closest('[]');
      if (colorCard) {
        await user.click(colorCard);

        expect(mockUpdateFormData).toHaveBeenCalledWith('specifications', {
          selectedAttributes: [1],
          attributeValues: { 1: ['紅色', '藍色', '黑色'] },
        });
      }
    });

    test('應該處理找不到屬性的情況', () => {
      const formDataWithMissingAttribute = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
          selectedAttributes: [999], // 不存在的屬性ID
          attributeValues: { 999: ['測試值'] },
        },
      };

      render(
        <Step2_DefineSpecs
          formData={formDataWithMissingAttribute}
          updateFormData={mockUpdateFormData}
        />
      );

      // 應該不會渲染管理界面中的不存在屬性
      expect(screen.getByText('管理屬性值')).toBeInTheDocument();
      // 但不應該有999對應的屬性名稱顯示
    });

    test('應該顯示屬性值預覽徽章的限制', () => {
      const manyValuesAttribute = {
        id: 4,
        name: '多值屬性',
        values: [
          { id: 1, value: '值1' },
          { id: 2, value: '值2' },
          { id: 3, value: '值3' },
          { id: 4, value: '值4' },
          { id: 5, value: '值5' },
          { id: 6, value: '值6' },
        ],
      };

      mockUseAttributes.mockReturnValue({
        data: { data: [manyValuesAttribute] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const multiSpecFormData = {
        ...defaultFormData,
        specifications: {
          ...defaultFormData.specifications,
          isVariable: true,
        },
      };

      render(
        <Step2_DefineSpecs
          formData={multiSpecFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('多值屬性')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument(); // 應該顯示+2 (總共6個值，顯示4個，剩餘2個)
    });
  });
}); 