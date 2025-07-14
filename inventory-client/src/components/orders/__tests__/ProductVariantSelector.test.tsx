import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductVariantSelector } from '../ProductVariantSelector';
import { ProductItem, ProductVariant } from '@/types/api-helpers';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useProducts: jest.fn(),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid="search-input"
    />
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="products-table">{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children, onClick, className }: any) => (
    <tr onClick={onClick} className={className}>
      {children}
    </tr>
  ),
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children, colSpan }: any) => <td colSpan={colSpan}>{children}</td>,
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange && onChange(e.target.checked)}
      data-testid="variant-checkbox"
    />
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

// Import mocked modules
import { useProducts } from '@/hooks';
import { useDebounce } from '@/hooks/use-debounce';

const mockUseProducts = useProducts as jest.MockedFunction<typeof useProducts>;
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

describe('ProductVariantSelector', () => {
  const mockProducts: ProductItem[] = [
    {
      id: 1,
      name: '筆記型電腦',
      category: { id: 1, name: '電腦設備' },
      variants: [
        {
          id: 1,
          sku: 'LAPTOP-001',
          price: '25000',
          attribute_values: [
            { id: 1, value: '13吋' },
            { id: 2, value: '銀色' }
          ],
          inventory: [
            { id: 1, quantity: 15 }
          ]
        },
        {
          id: 2,
          sku: 'LAPTOP-002',
          price: '30000',
          attribute_values: [
            { id: 3, value: '15吋' },
            { id: 4, value: '黑色' }
          ],
          inventory: [
            { id: 2, quantity: 5 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: '桌上型電腦',
      category: { id: 1, name: '電腦設備' },
      variants: [
        {
          id: 3,
          sku: 'DESKTOP-001',
          price: '15000',
          attribute_values: [],
          inventory: [
            { id: 3, quantity: 0 }
          ]
        }
      ]
    }
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDebounce.mockImplementation((value) => value);
    mockUseProducts.mockReturnValue({
      data: { data: mockProducts },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  describe('基本渲染', () => {
    test('當 open 為 true 時應該顯示對話框', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByText('選擇商品項目')).toBeInTheDocument();
    });

    test('當 open 為 false 時不應該顯示對話框', () => {
      render(<ProductVariantSelector {...defaultProps} open={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('應該顯示搜尋輸入框', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', '搜尋商品名稱或 SKU...');
    });

    test('應該顯示已選擇項目數量', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText(/已選擇 0 項/)).toBeInTheDocument();
    });
  });

  describe('商品列表顯示', () => {
    test('應該顯示所有商品變體', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getAllByText('筆記型電腦')).toHaveLength(2); // 兩個筆記型電腦變體
      expect(screen.getByText('桌上型電腦')).toBeInTheDocument();
      expect(screen.getByText('LAPTOP-001')).toBeInTheDocument();
      expect(screen.getByText('LAPTOP-002')).toBeInTheDocument();
      expect(screen.getByText('DESKTOP-001')).toBeInTheDocument();
    });

    test('應該顯示價格資訊', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('$25,000')).toBeInTheDocument();
      expect(screen.getByText('$30,000')).toBeInTheDocument();
      expect(screen.getByText('$15,000')).toBeInTheDocument();
    });

    test('應該顯示屬性值', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('13吋, 銀色')).toBeInTheDocument();
      expect(screen.getByText('15吋, 黑色')).toBeInTheDocument();
    });

    test('應該顯示庫存數量', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('當載入中時應該顯示載入訊息', () => {
      mockUseProducts.mockReturnValue({
        data: { data: [] },
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    test('當沒有商品時應該顯示空狀態訊息', () => {
      mockUseProducts.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('暫無商品資料')).toBeInTheDocument();
    });
  });

  describe('庫存狀態顯示', () => {
    test('應該正確顯示庫存狀態', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');
      
      // 檢查庫存狀態徽章
      const stockBadges = badges.filter(badge => 
        badge.textContent === '有庫存' || 
        badge.textContent === '低庫存' || 
        badge.textContent === '缺貨'
      );

      expect(stockBadges).toHaveLength(3);
      expect(screen.getByText('有庫存')).toBeInTheDocument(); // 15 件庫存
      expect(screen.getByText('低庫存')).toBeInTheDocument(); // 5 件庫存
      expect(screen.getByText('缺貨')).toBeInTheDocument(); // 0 件庫存
    });
  });

  describe('搜尋功能', () => {
    test('應該可以搜尋商品', async () => {
      const user = userEvent.setup();
      render(<ProductVariantSelector {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, '筆記型');

      expect(mockUseDebounce).toHaveBeenCalledWith('筆記型', 300);
    });

    test('當搜尋無結果時應該顯示無結果訊息', () => {
      mockUseProducts.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { rerender } = render(<ProductVariantSelector {...defaultProps} />);

      // 模擬有搜尋查詢但無結果
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      rerender(<ProductVariantSelector {...defaultProps} />);
      
      expect(screen.getByText('找不到符合條件的商品')).toBeInTheDocument();
    });
  });

  describe('變體選擇功能', () => {
    test('應該渲染選擇框', async () => {
      render(<ProductVariantSelector {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('variant-checkbox');
      expect(checkboxes).toHaveLength(3); // 3個變體
    });

    test('點擊行應該觸發交互', async () => {
      const user = userEvent.setup();
      render(<ProductVariantSelector {...defaultProps} />);

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // 有標題行和資料行
      
      // 驗證可以點擊行
      await user.click(rows[1]);
      // 只驗證點擊沒有拋出錯誤
    });

    test('應該顯示選擇框', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('variant-checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('對話框操作', () => {
    test('點擊取消按鈕應該調用 onOpenChange', async () => {
      const user = userEvent.setup();
      const onOpenChange = jest.fn();

      render(
        <ProductVariantSelector
          {...defaultProps}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    test('應該顯示確認和取消按鈕', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText(/確認添加/)).toBeInTheDocument();
    });

    test('確認按鈕初始狀態應該被禁用', () => {
      render(<ProductVariantSelector {...defaultProps} />);

      const confirmButton = screen.getByText(/確認添加/);
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('錯誤處理', () => {
    test('應該處理無效的 API 響應', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('暫無商品資料')).toBeInTheDocument();
    });

    test('應該處理沒有變體的商品', () => {
      const productsWithoutVariants = [
        {
          id: 1,
          name: '測試商品',
          category: { id: 1, name: '測試分類' },
          variants: null
        }
      ];

      mockUseProducts.mockReturnValue({
        data: { data: productsWithoutVariants },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<ProductVariantSelector {...defaultProps} />);

      expect(screen.getByText('暫無商品資料')).toBeInTheDocument();
    });
  });
}); 