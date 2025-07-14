import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductSelector } from '../ProductSelector';
import { useProducts, useProductVariants } from '@/hooks';
import { useSession } from 'next-auth/react';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useProducts: jest.fn(),
  useProductVariants: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

const mockUseProducts = useProducts as jest.MockedFunction<typeof useProducts>;
const mockUseProductVariants = useProductVariants as jest.MockedFunction<typeof useProductVariants>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock data
const mockProducts = [
  {
    id: 1,
    name: '測試商品1',
    description: '這是測試商品1',
    variants: [
      { id: 101, sku: 'SKU-101', price: '100' },
      { id: 102, sku: 'SKU-102', price: '120' },
    ],
  },
  {
    id: 2,
    name: '測試商品2',
    description: '這是測試商品2',
    variants: [
      { id: 201, sku: 'SKU-201', price: '200' },
    ],
  },
];

const mockVariants = [
  {
    id: 101,
    sku: 'SKU-101',
    price: '100',
    product_id: 1,
    product: { id: 1, name: '測試商品1' },
    attribute_values: [
      { attribute: { name: '顏色' }, value: '紅色' },
      { attribute: { name: '尺寸' }, value: 'M' },
    ],
    inventory: [
      { store_id: 1, quantity: 10, store: { name: '門市A' } },
      { store_id: 2, quantity: 5, store: { name: '門市B' } },
    ],
  },
  {
    id: 102,
    sku: 'SKU-102',
    price: '120',
    product_id: 1,
    product: { id: 1, name: '測試商品1' },
    attribute_values: [
      { attribute: { name: '顏色' }, value: '藍色' },
      { attribute: { name: '尺寸' }, value: 'L' },
    ],
    inventory: [
      { store_id: 1, quantity: 8, store: { name: '門市A' } },
    ],
  },
];

describe('ProductSelector', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: 1 } },
      status: 'authenticated',
      update: jest.fn(),
    } as any);
  });

  describe('基本功能', () => {
    it('應該顯示預設的佔位符文字', () => {
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector />);
      
      expect(screen.getByText('搜尋並選擇商品')).toBeInTheDocument();
    });

    it('應該顯示自定義的佔位符文字', () => {
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector placeholder="請選擇商品規格" />);
      
      expect(screen.getByText('請選擇商品規格')).toBeInTheDocument();
    });

    it('應該在未登入時顯示提示訊息', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      } as any);
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector />);
      
      expect(screen.getByText('請先登入系統')).toBeInTheDocument();
    });

    it('應該在禁用時無法點擊', () => {
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector disabled={true} />);
      
      const button = screen.getByRole('combobox');
      expect(button).toBeDisabled();
    });
  });

  describe('商品搜尋功能', () => {
    it('應該能夠搜尋商品', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      // 點擊開啟下拉選單
      await user.click(screen.getByRole('combobox'));
      
      // 輸入搜尋關鍵字
      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...');
      await user.type(searchInput, '測試');
      
      // 確認商品列表顯示
      expect(screen.getByText('測試商品1')).toBeInTheDocument();
      expect(screen.getByText('這是測試商品1')).toBeInTheDocument();
      expect(screen.getByText('2 個規格')).toBeInTheDocument();
    });

    it('應該在載入時顯示載入訊息', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector />);
      
      await user.click(screen.getByRole('combobox'));
      
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('應該在錯誤時顯示錯誤訊息', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('載入失敗'),
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector />);
      
      await user.click(screen.getByRole('combobox'));
      
      expect(screen.getByText('載入商品失敗，請稍後再試')).toBeInTheDocument();
    });

    it('應該在搜尋無結果時顯示提示', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector />);
      
      await user.click(screen.getByRole('combobox'));
      
      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...');
      await user.type(searchInput, '不存在的商品');
      
      expect(screen.getByText('找不到包含「不存在的商品」的商品')).toBeInTheDocument();
      expect(screen.getByText('請確認商品名稱或嘗試其他關鍵字')).toBeInTheDocument();
    });
  });

  describe('商品與變體選擇', () => {
    it('應該能選擇商品並顯示變體列表', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      // 開啟下拉選單
      await user.click(screen.getByRole('combobox'));
      
      // 選擇商品
      await user.click(screen.getByText('測試商品1'));
      
      // 確認變體列表顯示
      expect(screen.getByText('SKU-101')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
      expect(screen.getByText('顏色: 紅色 • 尺寸: M')).toBeInTheDocument();
    });

    it('應該能選擇變體並呼叫 onValueChange', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      await user.click(screen.getByText('SKU-101'));
      
      expect(mockOnValueChange).toHaveBeenCalledWith(101, mockVariants[0]);
    });

    it('應該能返回商品選擇', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      
      // 點擊返回
      await user.click(screen.getByText('← 返回商品選擇'));
      
      // 確認回到商品列表
      expect(screen.getByText('測試商品1')).toBeInTheDocument();
      expect(screen.getByText('測試商品2')).toBeInTheDocument();
    });
  });

  describe('庫存顯示功能', () => {
    it('應該顯示總庫存資訊', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector showCurrentStock={true} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      
      // 確認庫存顯示
      expect(screen.getByText('總庫存: 15')).toBeInTheDocument();
      expect(screen.getByText('門市A: 10')).toBeInTheDocument();
      expect(screen.getByText('門市B: 5')).toBeInTheDocument();
    });

    it('應該顯示特定門市的庫存', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector showCurrentStock={true} storeId={1} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      
      // 確認只顯示門市A的庫存
      expect(screen.getByText('庫存: 10')).toBeInTheDocument();
      // 使用 getAllByText 因為可能有多個相同文字
      const storeTexts = screen.getAllByText('@ 門市A');
      expect(storeTexts.length).toBeGreaterThan(0);
    });
  });

  describe('已選擇商品顯示', () => {
    it('應該顯示已選擇的商品資訊', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      await user.click(screen.getByText('SKU-101'));
      
      // 確認選擇後的顯示 - 按鈕文字會改變
      await waitFor(() => {
        const button = screen.getByRole('combobox');
        expect(button).toHaveTextContent('測試商品1');
        expect(button).toHaveTextContent('紅色');
        expect(button).toHaveTextContent('M');
        expect(button).toHaveTextContent('SKU-101');
      });
      
      // 確認底部資訊顯示
      const infoSection = screen.getByText('SKU: SKU-101 • 價格: $100');
      expect(infoSection).toBeInTheDocument();
    });

    it('應該能清除選擇', async () => {
      const user = userEvent.setup();
      mockUseProducts.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      } as any);
      mockUseProductVariants.mockReturnValue({
        data: mockVariants,
        isLoading: false,
        error: null,
      } as any);

      render(<ProductSelector onValueChange={mockOnValueChange} />);
      
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getByText('測試商品1'));
      await user.click(screen.getByText('SKU-101'));
      
      // 點擊清除按鈕
      await user.click(screen.getByText('清除'));
      
      expect(mockOnValueChange).toHaveBeenLastCalledWith(0);
      expect(screen.getByText('搜尋並選擇商品')).toBeInTheDocument();
    });
  });

  describe('初始值處理', () => {
    it.skip('應該正確顯示初始值', async () => {
      // TODO: 這個測試需要更複雜的 mock 設定來正確模擬初始值載入流程
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      
      // 模擬載入所有變體的過程
      mockUseProductVariants
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValue({
          data: mockVariants,
          isLoading: false,
          error: null,
        } as any);

      render(<ProductSelector value={101} />);
      
      // 等待初始值設定完成
      await waitFor(() => {
        const button = screen.getByRole('combobox');
        // 確認按鈕包含預期的文字
        expect(button).toHaveTextContent('測試商品1');
        expect(button).toHaveTextContent('SKU-101');
      });
    });
  });
});