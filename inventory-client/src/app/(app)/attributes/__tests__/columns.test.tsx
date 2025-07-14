import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { columns } from '../columns';
import { Attribute } from '@/types/attribute';
import { ColumnDef } from '@tanstack/react-table';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: () => 'MoreHorizontal',
  Edit: () => 'Edit',
  Trash2: () => 'Trash2',
  Tags: () => 'Tags',
}));

// 測試數據
const mockAttribute: Attribute = {
  id: 1,
  name: '顏色',
  values: [
    { id: 1, value: '紅色', attribute_id: 1 },
    { id: 2, value: '藍色', attribute_id: 1 },
    { id: 3, value: '綠色', attribute_id: 1 },
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Helper function to render table cell
const renderCell = (column: ColumnDef<Attribute>, attribute: Attribute, columnId?: string) => {
  const cell = column.cell;
  if (!cell || typeof cell !== 'function') return null;

  const mockRow = {
    original: attribute,
    getValue: (key: string) => attribute[key as keyof Attribute],
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
    getValue: () => columnId ? attribute[columnId as keyof Attribute] : undefined,
    renderValue: () => columnId ? attribute[columnId as keyof Attribute] : undefined,
    cell: { column: mockColumn, getContext: () => ({}) },
  };

  return render(<div>{cell(cellProps as any)}</div>);
};

// Helper function to render header
const renderHeader = (column: ColumnDef<Attribute>) => {
  const header = column.header;
  if (!header) return null;

  if (typeof header === 'string') {
    return render(<div>{header}</div>);
  }

  if (typeof header === 'function') {
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
  }

  return null;
};

describe('Attribute Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('列定義結構', () => {
    test('應該返回正確數量的列', () => {
      expect(columns).toHaveLength(5); // select, name, value_count, created_at, actions
    });

    test('所有列應該有正確的屬性', () => {
      // 檢查 select 列
      expect(columns[0].id).toBe('select');
      expect(columns[0].enableSorting).toBe(false);
      expect(columns[0].enableHiding).toBe(false);
      expect(columns[0].size).toBe(40);

      // 檢查 name 列
      expect((columns[1] as any).accessorKey).toBe('name');

      // 檢查 value_count 列
      expect(columns[2].id).toBe('value_count');
      expect(columns[2].enableSorting).toBe(false);

      // 檢查 created_at 列
      expect((columns[3] as any).accessorKey).toBe('created_at');
      
      // 檢查 actions 列
      expect(columns[4].id).toBe('actions');
      expect(columns[4].enableSorting).toBe(false);
      expect(columns[4].enableHiding).toBe(false);
    });
  });

  describe('選擇功能', () => {
    test('表頭選擇框應該正確渲染', () => {
      renderHeader(columns[0]);
      
      const checkbox = screen.getByRole('checkbox', { name: '選擇全部' });
      expect(checkbox).toBeInTheDocument();
    });

    test('單行選擇框應該正確渲染', () => {
      renderCell(columns[0], mockAttribute);
      
      const checkbox = screen.getByRole('checkbox', { name: '選擇此行' });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('規格名稱列', () => {
    test('應該正確顯示規格名稱', () => {
      renderCell(columns[1], mockAttribute);
      
      expect(screen.getByText('顏色')).toBeInTheDocument();
    });

    test('沒有名稱時應該顯示未命名規格', () => {
      const attributeWithoutName = { ...mockAttribute, name: '' };
      renderCell(columns[1], attributeWithoutName);
      
      expect(screen.getByText('未命名規格')).toBeInTheDocument();
    });
  });

  describe('規格值數量列', () => {
    test('應該正確顯示規格值數量', () => {
      renderCell(columns[2], mockAttribute);
      
      // 檢查數量顯示
      expect(screen.getByText('3 個值')).toBeInTheDocument();
    });

    test('沒有規格值時應該顯示無值', () => {
      const attributeWithoutValues = { ...mockAttribute, values: [] };
      renderCell(columns[2], attributeWithoutValues);
      
      expect(screen.getByText('無值')).toBeInTheDocument();
    });

    test('values 為 undefined 時應該顯示無值', () => {
      const attributeWithUndefinedValues = { ...mockAttribute, values: undefined };
      renderCell(columns[2], attributeWithUndefinedValues);
      
      expect(screen.getByText('無值')).toBeInTheDocument();
    });
  });

  describe('創建時間列', () => {
    test('應該正確格式化日期', () => {
      renderCell(columns[3], mockAttribute);
      
      expect(screen.getByText('2024/01/01')).toBeInTheDocument();
    });

    test('沒有日期時應該顯示 N/A', () => {
      const attributeWithoutDate = { ...mockAttribute, created_at: undefined };
      renderCell(columns[3], attributeWithoutDate);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    test('無效日期時應該顯示無效日期', () => {
      const attributeWithInvalidDate = { ...mockAttribute, created_at: 'invalid-date' };
      renderCell(columns[3], attributeWithInvalidDate);
      
      // toLocaleDateString 對無效日期會返回 "Invalid Date"
      expect(screen.getByText('Invalid Date')).toBeInTheDocument();
    });
  });

  describe('操作列', () => {
    let mockDispatchEvent: jest.SpyInstance;

    beforeEach(() => {
      mockDispatchEvent = jest.spyOn(window, 'dispatchEvent');
    });

    afterEach(() => {
      mockDispatchEvent.mockRestore();
    });

    test('應該顯示更多選項按鈕', () => {
      renderCell(columns[4], mockAttribute);
      
      const moreButton = screen.getByRole('button');
      expect(moreButton).toBeInTheDocument();
    });

    test('點擊編輯應該觸發自定義事件', async () => {
      const user = userEvent.setup();
      renderCell(columns[4], mockAttribute);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      // 使用 role 來查找菜單項
      const editItem = await screen.findByRole('menuitem', { name: /編輯規格/ });
      await user.click(editItem);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editAttribute',
          detail: mockAttribute,
        })
      );
    });

    test('點擊管理規格值應該觸發自定義事件', async () => {
      const user = userEvent.setup();
      renderCell(columns[4], mockAttribute);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const manageItem = await screen.findByRole('menuitem', { name: /管理規格值/ });
      await user.click(manageItem);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'manageAttributeValues',
          detail: mockAttribute,
        })
      );
    });

    test('點擊刪除應該觸發自定義事件', async () => {
      const user = userEvent.setup();
      renderCell(columns[4], mockAttribute);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const deleteItem = await screen.findByRole('menuitem', { name: /刪除規格/ });
      await user.click(deleteItem);
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'deleteAttribute',
          detail: mockAttribute,
        })
      );
    });
  });
});