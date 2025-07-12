import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createColumns } from '../columns';
import { Order, ProcessedOrder } from '@/types/api-helpers';
import { useDeleteOrder } from '@/hooks';
import { ColumnDef } from '@tanstack/react-table';

// Mock hooks
jest.mock('@/hooks', () => ({
  useDeleteOrder: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockedLink.displayName = 'Link';
  return MockedLink;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: () => 'MoreHorizontal',
  Eye: () => 'Eye',
  FileText: () => 'FileText',
  DollarSign: () => 'DollarSign',
  Truck: () => 'Truck',
  Undo2: () => 'Undo2',
  Ban: () => 'Ban',
  Pencil: () => 'Pencil',
  Trash2: () => 'Trash2',
  Calendar: () => 'Calendar',
  Package: () => 'Package',
  User: () => 'User',
  Store: () => 'Store',
}));

const mockUseDeleteOrder = useDeleteOrder as jest.MockedFunction<typeof useDeleteOrder>;

// 測試數據
const mockOrder: Order = {
  id: 1,
  order_number: 'ORD-2024-001',
  customer_id: 1,
  customer: {
    id: 1,
    name: '測試客戶',
    phone: '0912345678',
  },
  formatted_created_date: '2024/01/01',
  grand_total: '1000.00',
  paid_amount: '500.00',
  remaining_amount: '500.00',
  status: 'processing',
  payment_status: 'partial',
  shipping_status: 'pending',
  notes: '測試訂單',
  has_custom_items: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  order_items: [
    {
      id: 1,
      order_id: 1,
      product_variant_id: 1,
      quantity: 2,
      unit_price: '500.00',
      subtotal: '1000.00',
      product_variant: {
        id: 1,
        product_id: 1,
        sku: 'SKU-001',
        price: '500.00',
        product: {
          id: 1,
          name: '測試產品',
          category_id: 1,
        },
      },
    },
  ],
} as any;

// Helper function to render table cell
const renderCell = (column: ColumnDef<Order>, order: Order, columnId?: string) => {
  const cell = column.cell;
  if (!cell || typeof cell !== 'function') return null;

  const mockRow = {
    original: order,
    getValue: (key: string) => {
      // Handle nested keys like 'customer.name'
      if (key.includes('.')) {
        const keys = key.split('.');
        let value: any = order;
        for (const k of keys) {
          value = value?.[k];
        }
        return value;
      }
      return order[key as keyof Order];
    },
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
    getValue: () => columnId ? order[columnId as keyof Order] : undefined,
    renderValue: () => columnId ? order[columnId as keyof Order] : undefined,
    cell: { column: mockColumn, getContext: () => ({}) },
  };

  return render(<div>{cell(cellProps as any)}</div>);
};

// Helper function to render header
const renderHeader = (column: ColumnDef<Order>) => {
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

describe('Order Columns', () => {
  const mockCallbacks = {
    onPreview: jest.fn(),
    onShip: jest.fn(),
    onRecordPayment: jest.fn(),
    onRefund: jest.fn(),
    onCancel: jest.fn(),
    onDelete: jest.fn(),
  };

  const mockDeleteMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeleteOrder.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as any);
  });

  describe('列定義結構', () => {
    test('應該返回正確數量的列', () => {
      const cols = createColumns(mockCallbacks);
      expect(cols).toHaveLength(8); // select, order_number, formatted_created_date, customer.name, grand_total, payment_status, shipping_status, actions
    });

    test('所有列應該有正確的屬性', () => {
      const cols = createColumns(mockCallbacks);
      
      // 檢查 select 列
      expect(cols[0].id).toBe('select');
      expect(cols[0].enableSorting).toBe(false);
      expect(cols[0].enableHiding).toBe(false);
      expect(cols[0].size).toBe(40);

      // 檢查 order_number 列
      expect(cols[1].accessorKey).toBe('order_number');

      // 檢查 formatted_created_date 列
      expect(cols[2].accessorKey).toBe('formatted_created_date');

      // 檢查 customer 列
      expect(cols[3].accessorKey).toBe('customer.name');

      // 檢查 grand_total 列
      expect(cols[4].accessorKey).toBe('grand_total');

      // 檢查 payment_status 列
      expect(cols[5].accessorKey).toBe('payment_status');

      // 檢查 shipping_status 列
      expect(cols[6].accessorKey).toBe('shipping_status');
      
      // 檢查 actions 列
      expect(cols[7].id).toBe('actions');
    });
  });

  describe('選擇功能', () => {
    test('表頭選擇框應該正確渲染', () => {
      const cols = createColumns(mockCallbacks);
      renderHeader(cols[0]);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select all' });
      expect(checkbox).toBeInTheDocument();
    });

    test('單行選擇框應該正確渲染', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[0], mockOrder);
      
      const checkbox = screen.getByRole('checkbox', { name: 'Select row' });
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('訂單編號列', () => {
    test('應該正確顯示訂單編號', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[1], mockOrder);
      
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    });

    test('點擊訂單編號應該觸發預覽', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[1], mockOrder);
      
      const orderButton = screen.getByRole('button', { name: 'ORD-2024-001' });
      await user.click(orderButton);
      
      expect(mockCallbacks.onPreview).toHaveBeenCalledWith(1);
    });
  });

  describe('客戶列', () => {
    test('應該正確顯示客戶名稱', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[3], mockOrder);
      
      expect(screen.getByText('測試客戶')).toBeInTheDocument();
    });

    test('沒有客戶時應該顯示橫線', () => {
      const orderWithoutCustomer = { ...mockOrder, customer: null };
      const cols = createColumns(mockCallbacks);
      renderCell(cols[3], orderWithoutCustomer);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('日期列', () => {
    test('應該正確顯示日期', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[2], mockOrder);
      
      expect(screen.getByText('2024/01/01')).toBeInTheDocument();
    });
  });

  describe('金額列', () => {
    test('應該正確顯示總金額', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[4], mockOrder);
      
      expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });
  });

  describe('付款狀態列', () => {
    test('應該正確顯示付款狀態', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[5], mockOrder);
      
      expect(screen.getByText('部分付款')).toBeInTheDocument();
    });
  });

  describe('出貨狀態列', () => {
    test('應該正確顯示出貨狀態', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[6], mockOrder);
      
      expect(screen.getByText('待處理')).toBeInTheDocument();
    });
  });

  describe('操作列', () => {
    test('應該顯示更多選項按鈕', () => {
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      expect(moreButton).toBeInTheDocument();
    });

    test('點擊預覽應該觸發回調', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const previewItem = await screen.findByRole('menuitem', { name: /快速預覽/ });
      await user.click(previewItem);
      
      expect(mockCallbacks.onPreview).toHaveBeenCalledWith(1);
    });

    test('點擊查看詳情應該導航到訂單頁面', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const detailLink = await screen.findByRole('link', { name: /查看完整詳情/ });
      expect(detailLink).toHaveAttribute('href', '/orders/1');
    });

    test('點擊收款應該觸發回調', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const paymentItem = await screen.findByText('記錄收款');
      await user.click(paymentItem);
      
      expect(mockCallbacks.onRecordPayment).toHaveBeenCalledWith(mockOrder);
    });

    test('取消訂單應該觸發回調', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const cancelItem = await screen.findByText('取消訂單');
      await user.click(cancelItem);
      
      expect(mockCallbacks.onCancel).toHaveBeenCalledWith(mockOrder);
    });

    test('刪除訂單應該顯示確認對話框', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const deleteItem = await screen.findByText('刪除');
      await user.click(deleteItem);
      
      expect(await screen.findByText('確定要刪除此訂單嗎？')).toBeInTheDocument();
      expect(screen.getByText(/此操作無法撤銷。這將永久刪除訂單「ORD-2024-001」/)).toBeInTheDocument();
    });

    test('確認刪除訂單應該調用 deleteOrder hook', async () => {
      const user = userEvent.setup();
      const cols = createColumns(mockCallbacks);
      renderCell(cols[7], mockOrder);
      
      const moreButton = screen.getByRole('button');
      await user.click(moreButton);
      
      const deleteItem = await screen.findByText('刪除');
      await user.click(deleteItem);
      
      const confirmButton = await screen.findByRole('button', { name: '確定刪除' });
      await user.click(confirmButton);
      
      expect(mockDeleteMutate).toHaveBeenCalledWith(1);
    });
  });
});