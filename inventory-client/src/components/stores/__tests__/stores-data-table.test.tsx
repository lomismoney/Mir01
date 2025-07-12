import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoresDataTable } from '../stores-data-table';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children, colSpan }: any) => <td colSpan={colSpan}>{children}</td>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: any) => (
    <div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {children}
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDown: () => 'ChevronDown',
  Plus: () => 'Plus',
  Store: () => 'Store',
  Search: () => 'Search',
}));

// 測試數據類型
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

// 測試數據
const mockStores: Store[] = [
  {
    id: 1,
    name: '總店',
    address: '台北市信義區',
    phone: '02-12345678',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    inventory_count: 100,
    users_count: 5,
  },
  {
    id: 2,
    name: '分店一',
    address: '台北市大安區',
    phone: '02-87654321',
    status: 'active',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    inventory_count: 50,
    users_count: 3,
  },
];

// 模擬的列定義
const mockColumns = [
  {
    id: 'name',
    header: '分店名稱',
    accessorKey: 'name',
    cell: ({ row }: any) => <div>{row.original.name}</div>,
  },
  {
    id: 'address',
    header: '地址',
    accessorKey: 'address',
    cell: ({ row }: any) => <div>{row.original.address}</div>,
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: any) => (
      <div>
        <button>編輯</button>
        <button>刪除</button>
      </div>
    ),
    enableHiding: false,
  },
];

describe('StoresDataTable', () => {
  const mockOnAddStore = jest.fn();
  const mockOnSearchChange = jest.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  test('應該正確渲染分店資料表格', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('總店')).toBeInTheDocument();
    expect(screen.getByText('分店一')).toBeInTheDocument();
    expect(screen.getByText('台北市信義區')).toBeInTheDocument();
    expect(screen.getByText('台北市大安區')).toBeInTheDocument();
  });

  test('應該顯示搜尋輸入框', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索分店名稱或地址...');
    expect(searchInput).toBeInTheDocument();
  });

  test('沒有搜尋功能時不應該顯示搜尋輸入框', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
      />
    );

    expect(screen.queryByPlaceholderText('搜索分店名稱或地址...')).not.toBeInTheDocument();
  });

  test('應該顯示新增分店按鈕', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        showAddButton={true}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: /新增分店/i })).toBeInTheDocument();
  });

  test('不應該顯示新增分店按鈕當 showAddButton 為 false', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        showAddButton={false}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.queryByRole('button', { name: /新增分店/i })).not.toBeInTheDocument();
  });

  test('點擊新增分店按鈕應該觸發 onAddStore', async () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        showAddButton={true}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const addButton = screen.getByRole('button', { name: /新增分店/i });
    await user.click(addButton);

    expect(mockOnAddStore).toHaveBeenCalledTimes(1);
  });

  test('應該顯示載入狀態', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        isLoading={true}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  test('應該顯示空狀態訊息', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        isLoading={false}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('尚無分店資料')).toBeInTheDocument();
    expect(screen.getByText('建立您的第一個分店開始管理')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /建立第一個分店/i })).toBeInTheDocument();
  });

  test('應該處理搜尋輸入變更', async () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索分店名稱或地址...');
    await user.type(searchInput, '總店');

    // 檢查 onChange 回調是否被調用
    expect(mockOnSearchChange).toHaveBeenCalled();
    expect(mockOnSearchChange).toHaveBeenCalledTimes(2);
  });

  test('應該同步外部搜尋值變更', () => {
    const { rerender } = render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        searchValue=""
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索分店名稱或地址...');
    expect(searchInput).toHaveValue('');

    rerender(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        searchValue="總店"
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(searchInput).toHaveValue('總店');
  });

  test('應該顯示欄位控制下拉選單', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: /欄位/i })).toBeInTheDocument();
  });

  test('應該正確顯示資料統計', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('共 2 個分店')).toBeInTheDocument();
  });

  test('應該顯示搜尋統計', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        searchValue="總店"
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('找到 2 個分店')).toBeInTheDocument();
  });

  test('搜尋無結果時應該顯示建議', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        searchValue="不存在的分店"
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('找到 0 個分店')).toBeInTheDocument();
    expect(screen.getByText('嘗試調整搜索條件')).toBeInTheDocument();
  });

  test('應該顯示分頁控制', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: '上一頁' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一頁' })).toBeInTheDocument();
    expect(screen.getByText(/第 1 頁/)).toBeInTheDocument();
  });

  test('載入狀態下應該禁用搜尋輸入框', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        isLoading={true}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜索分店名稱或地址...');
    expect(searchInput).toBeDisabled();
  });

  test('載入狀態下應該禁用分頁按鈕', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        isLoading={true}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: '上一頁' });
    const nextButton = screen.getByRole('button', { name: '下一頁' });
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('應該正確處理沒有 onAddStore 的情況', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        showAddButton={true}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 不應該顯示新增分店按鈕
    expect(screen.queryByRole('button', { name: /新增分店/i })).not.toBeInTheDocument();
  });

  test('應該正確處理沒有 onSearchChange 的情況', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
      />
    );

    // 不應該顯示搜尋輸入框
    expect(screen.queryByPlaceholderText('搜索分店名稱或地址...')).not.toBeInTheDocument();
  });

  test('應該正確渲染表格標題', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('分店名稱')).toBeInTheDocument();
    // 使用 getAllByText 來處理重複的文本
    expect(screen.getAllByText('地址')[0]).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('應該正確渲染表格資料', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 檢查第一行資料
    expect(screen.getByText('總店')).toBeInTheDocument();
    expect(screen.getByText('台北市信義區')).toBeInTheDocument();
    
    // 檢查第二行資料
    expect(screen.getByText('分店一')).toBeInTheDocument();
    expect(screen.getByText('台北市大安區')).toBeInTheDocument();
    
    // 檢查操作按鈕
    const editButtons = screen.getAllByText('編輯');
    expect(editButtons).toHaveLength(2);
    
    const deleteButtons = screen.getAllByText('刪除');
    expect(deleteButtons).toHaveLength(2);
  });

  test('應該正確處理空的 columns 陣列', () => {
    render(
      <StoresDataTable
        columns={[]}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 表格應該仍然存在
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('應該正確處理空的 data 陣列', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('尚無分店資料')).toBeInTheDocument();
  });

  test('空狀態下點擊建立第一個分店按鈕應該觸發 onAddStore', async () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        isLoading={false}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    const addButton = screen.getByRole('button', { name: /建立第一個分店/i });
    await user.click(addButton);

    expect(mockOnAddStore).toHaveBeenCalledTimes(1);
  });

  test('應該正確顯示店鋪圖標在空狀態', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={[]}
        isLoading={false}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('Store')).toBeInTheDocument();
  });

  test('應該正確顯示搜尋圖標', () => {
    render(
      <StoresDataTable
        columns={mockColumns}
        data={mockStores}
        onAddStore={mockOnAddStore}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});