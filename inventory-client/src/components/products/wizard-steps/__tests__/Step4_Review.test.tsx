import React from 'react';
import { render, screen } from '@testing-library/react';
import { Step4_Review } from '../Step4_Review';
import { WizardFormData } from '../../CreateProductWizard';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useAttributes: jest.fn(),
  useCategories: jest.fn(),
}));

describe('Step4_Review', () => {
  const mockUpdateFormData = jest.fn();
  const mockUseAttributes = require('@/hooks').useAttributes;
  const mockUseCategories = require('@/hooks').useCategories;

  // Mock 屬性資料
  const mockAttributes = [
    { id: 1, name: '顏色', values: [] },
    { id: 2, name: '尺寸', values: [] },
  ];

  // Mock 分類資料
  const mockCategories = [
    { id: 1, name: '電子產品' },
    { id: 2, name: '服裝' },
  ];

  // 基本表單資料
  const baseFormData: WizardFormData = {
    basicInfo: {
      name: '測試商品',
      category_id: 1,
      description: '這是一個測試商品的詳細描述',
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
      items: [
        { key: 'single', options: [], sku: 'TEST-001', price: '100' },
      ],
    },
  };

  // 多規格表單資料
  const multiVariantFormData: WizardFormData = {
    ...baseFormData,
    specifications: {
      isVariable: true,
      selectedAttributes: [1, 2],
      attributeValues: {
        1: ['紅色', '藍色'],
        2: ['S', 'M'],
      },
    },
    variants: {
      items: [
        { 
          key: 'variant-0', 
          options: [{ attributeId: 1, value: '紅色' }, { attributeId: 2, value: 'S' }], 
          sku: 'TEST-RED-S', 
          price: '150' 
        },
        { 
          key: 'variant-1', 
          options: [{ attributeId: 1, value: '紅色' }, { attributeId: 2, value: 'M' }], 
          sku: 'TEST-RED-M', 
          price: '160' 
        },
        { 
          key: 'variant-2', 
          options: [{ attributeId: 1, value: '藍色' }, { attributeId: 2, value: 'S' }], 
          sku: 'TEST-BLUE-S', 
          price: '155' 
        },
        { 
          key: 'variant-3', 
          options: [{ attributeId: 1, value: '藍色' }, { attributeId: 2, value: 'M' }], 
          sku: 'TEST-BLUE-M', 
          price: '165' 
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAttributes.mockReturnValue({
      data: mockAttributes,
    });
    mockUseCategories.mockReturnValue({
      data: mockCategories,
    });
  });

  describe('基本渲染', () => {
    it('應該渲染步驟標題和說明', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('預覽確認')).toBeInTheDocument();
      expect(screen.getByText('請仔細檢查所有配置資訊，確認無誤後即可提交創建商品。')).toBeInTheDocument();
    });

    it('應該顯示所有主要區塊標題', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('基本資訊')).toBeInTheDocument();
      expect(screen.getByText('規格配置')).toBeInTheDocument();
      expect(screen.getByText('變體配置')).toBeInTheDocument();
    });
  });

  describe('基本資訊預覽', () => {
    it('應該顯示商品名稱和分類', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('商品名稱')).toBeInTheDocument();
      expect(screen.getByText('測試商品')).toBeInTheDocument();
      expect(screen.getByText('商品分類')).toBeInTheDocument();
      expect(screen.getByText('電子產品')).toBeInTheDocument();
    });

    it('應該顯示商品描述', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('商品描述')).toBeInTheDocument();
      expect(screen.getByText('這是一個測試商品的詳細描述')).toBeInTheDocument();
    });

    it('當沒有分類時應該顯示未分類', () => {
      const dataWithoutCategory: WizardFormData = {
        ...baseFormData,
        basicInfo: {
          ...baseFormData.basicInfo,
          category_id: null,
        },
      };

      render(
        <Step4_Review
          formData={dataWithoutCategory}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('未分類')).toBeInTheDocument();
    });

    it('當商品名稱為空時應該顯示未設定', () => {
      const dataWithoutName: WizardFormData = {
        ...baseFormData,
        basicInfo: {
          ...baseFormData.basicInfo,
          name: '',
        },
      };

      render(
        <Step4_Review
          formData={dataWithoutName}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('未設定')).toBeInTheDocument();
    });

    it('當沒有描述時不應該顯示描述區塊', () => {
      const dataWithoutDescription: WizardFormData = {
        ...baseFormData,
        basicInfo: {
          ...baseFormData.basicInfo,
          description: '',
        },
      };

      render(
        <Step4_Review
          formData={dataWithoutDescription}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.queryByText('商品描述')).not.toBeInTheDocument();
    });
  });

  describe('規格配置預覽', () => {
    it('應該顯示單規格商品', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('規格類型')).toBeInTheDocument();
      expect(screen.getByText('單規格商品')).toBeInTheDocument();
    });

    it('應該顯示多規格商品配置', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('多規格商品')).toBeInTheDocument();
      expect(screen.getByText('已選擇的屬性 (2)')).toBeInTheDocument();
      expect(screen.getByText('屬性值配置')).toBeInTheDocument();
    });

    it('應該顯示選中的屬性', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 使用 getAllByText 處理多個相同元素
      const colorElements = screen.getAllByText(/^顏色$/);
      const sizeElements = screen.getAllByText(/^尺寸$/);
      
      expect(colorElements.length).toBeGreaterThan(0);
      expect(sizeElements.length).toBeGreaterThan(0);
    });

    it('應該顯示屬性值配置', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('紅色')).toBeInTheDocument();
      expect(screen.getByText('藍色')).toBeInTheDocument();
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });

  describe('變體配置預覽', () => {
    it('應該顯示變體數量', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('4 個變體')).toBeInTheDocument();
    });

    it('應該顯示每個變體的詳細信息', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 檢查 SKU 信息
      expect(screen.getByText('TEST-RED-S')).toBeInTheDocument();
      expect(screen.getByText('TEST-RED-M')).toBeInTheDocument();
      expect(screen.getByText('TEST-BLUE-S')).toBeInTheDocument();
      expect(screen.getByText('TEST-BLUE-M')).toBeInTheDocument();

      // 檢查價格信息
      expect(screen.getByText('NT$ 150')).toBeInTheDocument();
      expect(screen.getByText('NT$ 160')).toBeInTheDocument();
      expect(screen.getByText('NT$ 155')).toBeInTheDocument();
      expect(screen.getByText('NT$ 165')).toBeInTheDocument();
    });

    it('當沒有變體時應該顯示提示訊息', () => {
      const dataWithoutVariants: WizardFormData = {
        ...baseFormData,
        variants: {
          items: [],
        },
      };

      render(
        <Step4_Review
          formData={dataWithoutVariants}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('尚未配置任何變體')).toBeInTheDocument();
    });

    it('應該顯示變體的屬性組合', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 檢查屬性組合顯示（使用 getAllByText 處理多個相同元素）
      const colorRedElements = screen.getAllByText(/顏色: 紅色/);
      const sizeElements = screen.getAllByText(/尺寸: S|尺寸: M/);
      
      expect(colorRedElements.length).toBeGreaterThan(0);
      expect(sizeElements.length).toBeGreaterThan(0);
    });
  });

  describe('統計摘要', () => {
    it('應該顯示總變體數量統計', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('總變體數量')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('個變體組合')).toBeInTheDocument();
    });

    it('應該顯示商品總價值統計', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('商品總價值')).toBeInTheDocument();
      expect(screen.getByText('$630')).toBeInTheDocument(); // 150+160+155+165
      expect(screen.getByText('所有變體合計')).toBeInTheDocument();
    });

    it('應該顯示平均價格統計', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('平均價格')).toBeInTheDocument();
      expect(screen.getByText('$158')).toBeInTheDocument(); // (150+160+155+165)/4 = 157.5 -> 158
      expect(screen.getByText('每個變體平均')).toBeInTheDocument();
    });

    it('應該顯示使用屬性統計', () => {
      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('使用屬性')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('已選擇')).toBeInTheDocument();
      expect(screen.getByText('共 4 個屬性值')).toBeInTheDocument(); // 2個顏色值 + 2個尺寸值
    });

    it('應該正確計算單規格商品的統計', () => {
      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('總變體數量')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('商品總價值')).toBeInTheDocument();
      
      // 檢查 $100 出現（總價值和平均價格都是 $100）
      const priceElements = screen.getAllByText(/^\$100$/);
      expect(priceElements.length).toBe(2); // 總價值和平均價格
      
      expect(screen.getByText('平均價格')).toBeInTheDocument();
      expect(screen.getByText('使用屬性')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('共 0 個屬性值')).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該處理屬性資料載入失敗', () => {
      mockUseAttributes.mockReturnValue({
        data: undefined,
      });

      render(
        <Step4_Review
          formData={multiVariantFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 應該顯示預設的屬性名稱（使用 getAllByText 處理多個相同元素）
      const attr1Elements = screen.getAllByText(/屬性 1/);
      const attr2Elements = screen.getAllByText(/屬性 2/);
      
      expect(attr1Elements.length).toBeGreaterThan(0);
      expect(attr2Elements.length).toBeGreaterThan(0);
    });

    it('應該處理分類資料載入失敗', () => {
      mockUseCategories.mockReturnValue({
        data: undefined,
      });

      render(
        <Step4_Review
          formData={baseFormData}
          updateFormData={mockUpdateFormData}
        />
      );

      // 應該顯示預設的分類名稱
      expect(screen.getByText('分類 1')).toBeInTheDocument();
    });

    it('應該處理找不到分類的情況', () => {
      const dataWithUnknownCategory: WizardFormData = {
        ...baseFormData,
        basicInfo: {
          ...baseFormData.basicInfo,
          category_id: 999, // 不存在的分類 ID
        },
      };

      render(
        <Step4_Review
          formData={dataWithUnknownCategory}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('分類 999')).toBeInTheDocument();
    });

    it('應該處理找不到屬性的情況', () => {
      const dataWithUnknownAttribute: WizardFormData = {
        ...multiVariantFormData,
        specifications: {
          ...multiVariantFormData.specifications,
          selectedAttributes: [999], // 不存在的屬性 ID
        },
      };

      render(
        <Step4_Review
          formData={dataWithUnknownAttribute}
          updateFormData={mockUpdateFormData}
        />
      );

      // 使用 getAllByText 處理多個相同元素
      const attr999Elements = screen.getAllByText(/屬性 999/);
      expect(attr999Elements.length).toBeGreaterThan(0);
    });

    it('應該處理無效價格的統計計算', () => {
      const dataWithInvalidPrice: WizardFormData = {
        ...baseFormData,
        variants: {
          items: [
            { key: 'variant-0', options: [], sku: 'TEST-001', price: 'invalid' },
            { key: 'variant-1', options: [], sku: 'TEST-002', price: '' },
            { key: 'variant-2', options: [], sku: 'TEST-003', price: '100' },
          ],
        },
      };

      render(
        <Step4_Review
          formData={dataWithInvalidPrice}
          updateFormData={mockUpdateFormData}
        />
      );

      expect(screen.getByText('$100')).toBeInTheDocument(); // 總價值
      expect(screen.getByText('$33')).toBeInTheDocument(); // 平均價格 100/3 = 33.33 -> 33
    });

    it('應該處理空變體陣列的統計計算', () => {
      const dataWithoutVariants: WizardFormData = {
        ...baseFormData,
        variants: {
          items: [],
        },
      };

      render(
        <Step4_Review
          formData={dataWithoutVariants}
          updateFormData={mockUpdateFormData}
        />
      );

      // 檢查變體數量為 0（使用 getAllByText 處理多個 0）
      const zeroElements = screen.getAllByText(/^0$/);
      expect(zeroElements.length).toBeGreaterThan(0); // 總變體數量和使用屬性都是 0
      
      // 檢查總價值和平均價格都是 $0
      const priceZeroElements = screen.getAllByText(/^\$0$/);
      expect(priceZeroElements.length).toBe(2); // 總價值和平均價格
    });
  });
}); 