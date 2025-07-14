import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryManagement } from '../InventoryManagement';
import {
  useProducts,
  useStores,
  useCategories,
  useInventoryList,
} from '@/hooks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useProducts: jest.fn(),
  useStores: jest.fn(),
  useCategories: jest.fn(),
  useInventoryList: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/components/inventory/InventoryNestedTable', () => ({
  InventoryNestedTable: ({ data, isLoading, onAdjustInventory, onManageProduct }: any) => (
    <div data-testid="inventory-nested-table">
      {isLoading ? (
        <div>載入中...</div>
      ) : (
        <div>
          {data.map((item: any) => (
            <div key={item.id}>
              <span>{item.name}</span>
              <button onClick={() => onManageProduct(item.id)}>管理商品</button>
              <button onClick={() => onAdjustInventory(item.id, item.quantity)}>調整庫存</button>
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

jest.mock('../InventoryPagination', () => ({
  InventoryPagination: ({ meta, onPageChange }: any) => (
    <div data-testid="inventory-pagination">
      <button onClick={() => onPageChange(1)}>第 1 頁</button>
      <button onClick={() => onPageChange(2)}>第 2 頁</button>
      <span>共 {meta.total} 筆</span>
    </div>
  ),
}));

const mockUseStores = useStores as jest.MockedFunction<typeof useStores>;
const mockUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockUseInventoryList = useInventoryList as jest.MockedFunction<typeof useInventoryList>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock data
const mockStores = {
  data: [
    { id: 1, name: '門市A' },
    { id: 2, name: '門市B' },
  ],
};

const mockCategories = [
  { id: 1, name: '電子產品' },
  { id: 2, name: '服飾' },
];

const mockInventoryData = {
  data: [
    { id: 1, name: '商品A', quantity: 10 },
    { id: 2, name: '商品B', quantity: 5 },
  ],
  meta: {
    current_page: 1,
    last_page: 2,
    per_page: 15,
    total: 30,
  },
};

describe('InventoryManagement', () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
    mockUseToast.mockReturnValue({ toast: mockToast } as any);
  });

  describe('基本渲染', () => {
    it('應該顯示頁面標題和描述', () => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      expect(screen.getByText('庫存管理')).toBeInTheDocument();
      expect(screen.getByText('管理商品庫存數量、監控庫存水位和處理庫存調整')).toBeInTheDocument();
    });

    it('應該顯示篩選器區域', () => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      expect(screen.getByText('篩選器')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('搜尋商品名稱...')).toBeInTheDocument();
      expect(screen.getByText('門市')).toBeInTheDocument();
      expect(screen.getByText('分類')).toBeInTheDocument();
      expect(screen.getByText('低庫存')).toBeInTheDocument();
      expect(screen.getByText('缺貨')).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該在載入失敗時顯示錯誤訊息', () => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('載入失敗'),
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('無法載入庫存資料，請稍後再試')).toBeInTheDocument();
      expect(screen.getByText('重試')).toBeInTheDocument();
    });

    it('應該能點擊重試按鈕', async () => {
      const user = userEvent.setup();
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('載入失敗'),
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      await user.click(screen.getByText('重試'));

      expect(mockRefetch).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: '重新整理',
        description: '已重新載入庫存資料',
      });
    });
  });

  describe('篩選功能', () => {
    beforeEach(() => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);
    });

    it('應該能搜尋商品名稱', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...');
      await user.type(searchInput, '測試商品');

      // 等待 debounce
      await waitFor(() => {
        expect(searchInput).toHaveValue('測試商品');
      }, { timeout: 400 });
    });

    it.skip('應該能選擇門市', async () => {
      // TODO: 需要正確模擬 Select 組件的行為
      const user = userEvent.setup();
      render(<InventoryManagement />);

      // 找到門市選擇器的觸發按鈕並點擊
      const storeTriggers = screen.getAllByRole('combobox');
      const storeTrigger = storeTriggers.find(el => el.textContent?.includes('所有門市'));
      if (storeTrigger) {
        await user.click(storeTrigger);

        // 選擇門市A
        await user.click(screen.getByText('門市A'));

        // 確認選擇已更新
        expect(mockUseInventoryList).toHaveBeenCalledWith(
          expect.objectContaining({
            store_id: 1,
          })
        );
      }
    });

    it.skip('應該能選擇分類', async () => {
      // TODO: 需要正確模擬 Select 組件的行為
      const user = userEvent.setup();
      render(<InventoryManagement />);

      // 找到分類選擇器的觸發按鈕並點擊
      const categoryTriggers = screen.getAllByRole('combobox');
      const categoryTrigger = categoryTriggers.find(el => el.textContent?.includes('所有分類'));
      if (categoryTrigger) {
        await user.click(categoryTrigger);

        // 選擇電子產品
        await user.click(screen.getByText('電子產品'));

        // 確認選擇已更新
        expect(mockUseInventoryList).toHaveBeenCalledWith(
          expect.objectContaining({
            category_id: 1,
          })
        );
      }
    });

    it('應該能勾選低庫存篩選', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      const lowStockCheckbox = screen.getByRole('checkbox', { name: /低庫存/i });
      await user.click(lowStockCheckbox);

      expect(lowStockCheckbox).toBeChecked();
    });

    it('應該能勾選缺貨篩選', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      const outOfStockCheckbox = screen.getByRole('checkbox', { name: /缺貨/i });
      await user.click(outOfStockCheckbox);

      expect(outOfStockCheckbox).toBeChecked();
    });

    it('應該能重置所有篩選', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      // 先設定一些篩選
      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...');
      await user.type(searchInput, '測試');

      const lowStockCheckbox = screen.getByRole('checkbox', { name: /低庫存/i });
      await user.click(lowStockCheckbox);

      // 點擊重置
      await user.click(screen.getByText('重置篩選'));

      // 確認所有篩選都被清除
      expect(searchInput).toHaveValue('');
      expect(lowStockCheckbox).not.toBeChecked();
    });

    it('應該顯示篩選器數量標籤', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      // 設定篩選
      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...');
      await user.type(searchInput, '測試');

      await waitFor(() => {
        expect(screen.getByText('1 項篩選')).toBeInTheDocument();
      }, { timeout: 400 });
    });
  });

  describe('庫存表格功能', () => {
    beforeEach(() => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);
    });

    it('應該顯示庫存表格', () => {
      render(<InventoryManagement />);

      expect(screen.getByTestId('inventory-nested-table')).toBeInTheDocument();
      expect(screen.getByText('商品A')).toBeInTheDocument();
      expect(screen.getByText('商品B')).toBeInTheDocument();
    });

    it('應該能管理商品', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      const manageButtons = screen.getAllByText('管理商品');
      await user.click(manageButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/products/1/edit');
    });

    it('應該能調整庫存', async () => {
      const user = userEvent.setup();
      render(<InventoryManagement />);

      const adjustButtons = screen.getAllByText('調整庫存');
      await user.click(adjustButtons[0]);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('分頁功能', () => {
    it('應該顯示分頁資訊', () => {
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      expect(screen.getByTestId('inventory-pagination')).toBeInTheDocument();
      expect(screen.getByText('共 30 筆')).toBeInTheDocument();
    });

    it('應該能切換頁面', async () => {
      const user = userEvent.setup();
      mockUseStores.mockReturnValue({
        data: mockStores,
        isLoading: false,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: mockCategories,
        isLoading: false,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      await user.click(screen.getByText('第 2 頁'));

      // 確認 useInventoryList 被調用時包含正確的頁碼
      expect(mockUseInventoryList).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  describe('載入狀態', () => {
    it('應該在載入時顯示載入狀態', () => {
      mockUseStores.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);
      mockUseCategories.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as any);
      mockUseInventoryList.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
      } as any);

      render(<InventoryManagement />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });
  });
});