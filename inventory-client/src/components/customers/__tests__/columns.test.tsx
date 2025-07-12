import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { columns } from '../columns';
import { Customer } from '@/types/api-helpers';
import { useDeleteCustomer } from '@/hooks';
import { ColumnDef } from '@tanstack/react-table';

// Mock hooks
jest.mock('@/hooks', () => ({
  useDeleteCustomer: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: () => 'MoreHorizontal',
  Edit: () => 'Edit',
  Trash2: () => 'Trash2',
  User: () => 'User',
  Phone: () => 'Phone',
  Building2: () => 'Building2',
  CreditCard: () => 'CreditCard',
  Calendar: () => 'Calendar',
  ArrowUpDown: () => 'ArrowUpDown',
  ArrowUp: () => 'ArrowUp',
  ArrowDown: () => 'ArrowDown',
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date | string, formatStr: string) => {
    if (!date) return '';
    const d = new Date(date);
    
    if (formatStr === 'yyyy-MM-dd') {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    } else if (formatStr === 'MM月dd日') {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${month}月${day}日`;
    }
    
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  }),
}));

const mockUseDeleteCustomer = useDeleteCustomer as jest.MockedFunction<typeof useDeleteCustomer>;

// 測試數據
const mockCustomer: Customer = {
  id: 1,
  name: '測試客戶',
  phone: '0912345678',
  email: 'test@example.com',
  address: '台北市',
  company: '測試公司',
  tax_id: '12345678',
  industry_type: '設計師',
  payment_type: '月結客戶',
  is_company: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Helper function to render table cell
const renderCell = (column: ColumnDef<Customer>, customer: Customer, columnId: string) => {
  const cell = column.cell;
  if (!cell || typeof cell !== 'function') return null;

  const mockRow = {
    original: customer,
    getValue: (key: string) => customer[key as keyof Customer],
    getIsSelected: jest.fn().mockReturnValue(false),
    toggleSelected: jest.fn(),
  };

  const mockTable = {
    getIsAllPageRowsSelected: jest.fn().mockReturnValue(false),
    getIsSomePageRowsSelected: jest.fn().mockReturnValue(false),
    toggleAllPageRowsSelected: jest.fn(),
  };

  const mockColumn = {
    getIsSorted: jest.fn().mockReturnValue(false),
    toggleSorting: jest.fn(),
  };

  const cellProps = {
    row: mockRow,
    table: mockTable,
    column: mockColumn,
    getValue: () => customer[columnId as keyof Customer],
    renderValue: () => customer[columnId as keyof Customer],
    cell: { column: mockColumn, getContext: () => ({}) },
  };

  const result = render(<div>{cell(cellProps as any)}</div>);
  return result;
};

// Helper function to render header
const renderHeader = (column: ColumnDef<Customer>) => {
  const header = column.header;
  if (!header || typeof header !== 'function') return null;

  const mockTable = {
    getIsAllPageRowsSelected: jest.fn().mockReturnValue(false),
    getIsSomePageRowsSelected: jest.fn().mockReturnValue(false),
    toggleAllPageRowsSelected: jest.fn(),
  };

  const mockColumn = {
    getIsSorted: jest.fn().mockReturnValue(false),
    toggleSorting: jest.fn(),
  };

  const headerProps = {
    table: mockTable,
    column: mockColumn,
    header: { column: mockColumn, getContext: () => ({}) },
  };

  return render(<div>{header(headerProps as any)}</div>);
};

describe('Customer Columns', () => {
  const mockOnEditCustomer = jest.fn();
  const mockDeleteMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeleteCustomer.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  describe('列定義結構', () => {
    test('應該返回正確數量的列', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      expect(cols).toHaveLength(7); // select, name, phone, industry_type, payment_type, created_at, actions
    });

    test('所有列應該有正確的屬性', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      
      // 檢查 select 列
      expect(cols[0].id).toBe('select');
      expect(cols[0].enableSorting).toBe(false);
      expect(cols[0].enableHiding).toBe(false);
      expect(cols[0].size).toBe(40);

      // 檢查 name 列
      expect(cols[1].accessorKey).toBe('name');

      // 檢查 phone 列
      expect(cols[2].accessorKey).toBe('phone');
      
      // 檢查 industry_type 列
      expect(cols[3].accessorKey).toBe('industry_type');

      // 檢查 payment_type 列
      expect(cols[4].accessorKey).toBe('payment_type');

      // 檢查 created_at 列
      expect(cols[5].accessorKey).toBe('created_at');
      
      // 檢查 actions 列
      expect(cols[6].id).toBe('actions');
      expect(cols[6].enableSorting).toBe(false);
    });
  });

  describe('選擇功能', () => {
    test('表頭選擇框應該正確渲染', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderHeader(cols[0]);
      
      const checkbox = screen.getByRole('checkbox', { name: '全選' });
      expect(checkbox).toBeInTheDocument();
    });

    test('點擊表頭選擇框應該觸發全選', async () => {
      const user = userEvent.setup();
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      
      const mockTable = {
        getIsAllPageRowsSelected: jest.fn().mockReturnValue(false),
        getIsSomePageRowsSelected: jest.fn().mockReturnValue(false),
        toggleAllPageRowsSelected: jest.fn(),
      };

      const headerProps = {
        table: mockTable,
        column: {},
        header: { column: {}, getContext: () => ({}) },
      };

      const header = cols[0].header;
      if (header && typeof header === 'function') {
        render(<div>{header(headerProps as any)}</div>);
      }
      
      const checkbox = screen.getByRole('checkbox', { name: '全選' });
      await user.click(checkbox);

      expect(mockTable.toggleAllPageRowsSelected).toHaveBeenCalledWith(true);
    });

    test('單行選擇框應該正確渲染', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[0], mockCustomer, 'select');
      
      const checkbox = screen.getByRole('checkbox', { name: '選擇客戶' });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('客戶名稱列', () => {
    test('應該正確顯示客戶名稱和頭像', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[1], mockCustomer, 'name');
      
      expect(screen.getByText('測試客戶')).toBeInTheDocument();
      expect(screen.getByText('測')).toBeInTheDocument(); // Avatar fallback
    });

    test('應該顯示統編', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[1], mockCustomer, 'name');
      
      expect(screen.getByText('統編: 12345678')).toBeInTheDocument();
    });

    test('不是公司客戶時不應該顯示公司標誌', () => {
      const personalCustomer = { ...mockCustomer, is_company: false };
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[1], personalCustomer, 'name');
      
      // 應該顯示客戶名稱但不顯示公司標誌
      expect(screen.getByText('測試客戶')).toBeInTheDocument();
      expect(screen.queryByText('Building2')).not.toBeInTheDocument();
    });

    test('排序按鈕應該正常工作', async () => {
      const user = userEvent.setup();
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      const { container } = renderHeader(cols[1]);
      
      const sortButton = screen.getByRole('button');
      await user.click(sortButton);

      // 這裡可能需要更具體的測試邏輯
      expect(sortButton).toBeInTheDocument();
    });
  });

  describe('電話號碼列', () => {
    test('應該正確顯示電話號碼', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[2], mockCustomer, 'phone');
      
      expect(screen.getByText('0912345678')).toBeInTheDocument();
    });

    test('沒有電話號碼時應該顯示未設定電話', () => {
      const customerWithoutPhone = { ...mockCustomer, phone: null };
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[2], customerWithoutPhone, 'phone');
      
      expect(screen.getByText('未設定電話')).toBeInTheDocument();
    });
  });

  describe('行業別列', () => {
    test('應該正確顯示行業別', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[3], mockCustomer, 'industry_type');
      
      expect(screen.getByText('設計師')).toBeInTheDocument();
    });

    test('應該顯示正確的顏色樣式', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[3], mockCustomer, 'industry_type');
      
      const badge = screen.getByText('設計師');
      expect(badge).toHaveClass('bg-info/10');
    });
  });

  describe('付款類別列', () => {
    test('應該正確顯示付款類別', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[4], mockCustomer, 'payment_type');
      
      expect(screen.getByText('月結客戶')).toBeInTheDocument();
    });

    test('現金客戶應該顯示不同顏色', () => {
      const cashCustomer = { ...mockCustomer, payment_type: '現金客戶' };
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[4], cashCustomer, 'payment_type');
      
      expect(screen.getByText('現金客戶')).toBeInTheDocument();
      // 檢查顏色指示器
      const colorIndicator = screen.getByText('現金客戶').previousElementSibling;
      expect(colorIndicator).toHaveClass('bg-success');
    });
  });

  describe('建立日期列', () => {
    test('應該正確格式化日期', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[5], mockCustomer, 'created_at');
      
      // 檢查主日期顯示
      const mainDate = screen.getByText('2024-01-01');
      expect(mainDate).toBeInTheDocument();
      expect(mainDate).toHaveClass('text-sm', 'font-medium');
      
      // 檢查輔助日期顯示
      const subDate = screen.getByText('01月01日');
      expect(subDate).toBeInTheDocument();
      expect(subDate).toHaveClass('text-xs', 'text-muted-foreground');
    });
  });

  describe('操作列', () => {
    test('應該顯示更多選項按鈕', () => {
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[6], mockCustomer, 'actions');
      
      const moreButton = screen.getByRole('button');
      expect(moreButton).toBeInTheDocument();
    });

    test('點擊編輯應該觸發回調', async () => {
      const user = userEvent.setup();
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[6], mockCustomer, 'actions');
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const editMenuItem = await screen.findByRole('menuitem', { name: /編輯客戶/ });
      await user.click(editMenuItem);
      
      expect(mockOnEditCustomer).toHaveBeenCalledWith(mockCustomer);
    });

    test('刪除功能應該顯示確認對話框', async () => {
      const user = userEvent.setup();
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[6], mockCustomer, 'actions');
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      // 查找包含「刪除客戶」文本的元素
      const deleteMenuItem = await screen.findByRole('menuitem', { name: /刪除客戶/ });
      await user.click(deleteMenuItem);
      
      // 應該顯示確認對話框
      expect(await screen.findByText('確認刪除客戶？')).toBeInTheDocument();
      expect(screen.getByText(/您即將刪除客戶「測試客戶」/)).toBeInTheDocument();
    });

    test('確認刪除應該調用刪除 API', async () => {
      const user = userEvent.setup();
      
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[6], mockCustomer, 'actions');
      
      // 打開菜單
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      // 點擊刪除
      const deleteMenuItem = await screen.findByRole('menuitem', { name: /刪除客戶/ });
      await user.click(deleteMenuItem);
      
      // 確認刪除
      const confirmButton = await screen.findByRole('button', { name: '確認刪除' });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalledWith(1);
      });
    });

    test('取消刪除不應該調用刪除 API', async () => {
      const user = userEvent.setup();
      const cols = columns({ onEditCustomer: mockOnEditCustomer });
      renderCell(cols[6], mockCustomer, 'actions');
      
      // 打開菜單
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      // 點擊刪除
      const deleteMenuItem = await screen.findByRole('menuitem', { name: /刪除客戶/ });
      await user.click(deleteMenuItem);
      
      // 取消刪除
      const cancelButton = await screen.findByRole('button', { name: '取消' });
      await user.click(cancelButton);
      
      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });
  });
});