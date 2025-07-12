import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsersDataTable } from '../users-data-table';
import { UserItem } from '@/types/api-helpers';

// Mock lodash.debounce
jest.mock('lodash.debounce', () => 
  jest.fn((fn) => {
    fn.cancel = jest.fn();
    return fn;
  })
);

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
  Search: () => 'Search',
}));

// 測試數據
const mockUsers: UserItem[] = [
  {
    id: 1,
    name: '管理員',
    username: 'admin',
    email: 'admin@example.com',
    roles: ['admin'],
    stores: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '員工一',
    username: 'staff1',
    email: 'staff1@example.com',
    roles: ['staff'],
    stores: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// 模擬的列定義
const mockColumns = [
  {
    id: 'name',
    header: '姓名',
    accessorKey: 'name',
    cell: ({ row }: any) => <div>{row.original.name}</div>,
  },
  {
    id: 'username',
    header: '帳號',
    accessorKey: 'username',
    cell: ({ row }: any) => <div>{row.original.username}</div>,
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }: any) => <button>編輯</button>,
    enableHiding: false,
  },
];

describe('UsersDataTable', () => {
  const mockOnAddUser = jest.fn();
  const mockOnSearchChange = jest.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  test('應該正確渲染用戶資料表格', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('管理員')).toBeInTheDocument();
    expect(screen.getByText('員工一')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('staff1')).toBeInTheDocument();
  });

  test('應該顯示搜尋輸入框', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋用戶姓名或帳號...');
    expect(searchInput).toBeInTheDocument();
  });

  test('應該顯示新增用戶按鈕', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        showAddButton={true}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: /新增用戶/i })).toBeInTheDocument();
  });

  test('不應該顯示新增用戶按鈕當 showAddButton 為 false', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        showAddButton={false}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.queryByRole('button', { name: /新增用戶/i })).not.toBeInTheDocument();
  });

  test('點擊新增用戶按鈕應該觸發 onAddUser', async () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        showAddButton={true}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const addButton = screen.getByRole('button', { name: /新增用戶/i });
    await user.click(addButton);

    expect(mockOnAddUser).toHaveBeenCalledTimes(1);
  });

  test('應該顯示載入狀態', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={[]}
        isLoading={true}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('載入中...')).toBeInTheDocument();
    expect(screen.getByText('搜尋中...')).toBeInTheDocument();
  });

  test('應該顯示空狀態訊息', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={[]}
        isLoading={false}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('沒有找到用戶資料')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /建立第一個用戶/i })).toBeInTheDocument();
  });

  test('應該顯示搜尋結果的空狀態訊息', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={[]}
        isLoading={false}
        searchValue="test"
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('沒有找到符合 "test" 的用戶')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /建立第一個用戶/i })).not.toBeInTheDocument();
  });

  test('應該處理搜尋輸入變更', async () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋用戶姓名或帳號...');
    await user.type(searchInput, '管理員');

    expect(searchInput).toHaveValue('管理員');
    expect(mockOnSearchChange).toHaveBeenCalledWith('管理員');
  });

  test('應該同步外部搜尋值變更', () => {
    const { rerender } = render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        searchValue=""
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋用戶姓名或帳號...');
    expect(searchInput).toHaveValue('');

    rerender(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        searchValue="admin"
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(searchInput).toHaveValue('admin');
  });

  test('應該顯示欄位控制下拉選單', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: /欄位/i })).toBeInTheDocument();
  });

  test('應該正確顯示資料統計', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('共 2 個用戶')).toBeInTheDocument();
  });

  test('應該顯示搜尋統計', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        searchValue="admin"
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('共 2 個用戶 (搜尋: "admin")')).toBeInTheDocument();
  });

  test('應該顯示分頁控制', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByRole('button', { name: '上一頁' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一頁' })).toBeInTheDocument();
    expect(screen.getByText(/第 1 頁/)).toBeInTheDocument();
  });

  test('載入狀態下應該禁用搜尋輸入框', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        isLoading={true}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋用戶姓名或帳號...');
    expect(searchInput).toBeDisabled();
  });

  test('載入狀態下應該禁用分頁按鈕', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        isLoading={true}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    const prevButton = screen.getByRole('button', { name: '上一頁' });
    const nextButton = screen.getByRole('button', { name: '下一頁' });
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  test('應該正確處理沒有 onAddUser 的情況', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        showAddButton={true}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 不應該顯示新增用戶按鈕
    expect(screen.queryByRole('button', { name: /新增用戶/i })).not.toBeInTheDocument();
  });

  test('應該正確處理沒有 onSearchChange 的情況', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
      />
    );

    // 搜尋功能應該還是存在，但不會觸發回調
    const searchInput = screen.getByPlaceholderText('搜尋用戶姓名或帳號...');
    expect(searchInput).toBeInTheDocument();
  });

  test('應該正確渲染表格標題', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 使用 getAllByText 來處理重複的文本
    expect(screen.getAllByText('姓名')[0]).toBeInTheDocument();
    expect(screen.getAllByText('帳號')[0]).toBeInTheDocument();
    expect(screen.getAllByText('操作')[0]).toBeInTheDocument();
  });

  test('應該正確渲染表格資料', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 檢查第一行資料
    expect(screen.getByText('管理員')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    
    // 檢查第二行資料
    expect(screen.getByText('員工一')).toBeInTheDocument();
    expect(screen.getByText('staff1')).toBeInTheDocument();
    
    // 檢查操作按鈕
    const editButtons = screen.getAllByText('編輯');
    expect(editButtons).toHaveLength(2);
  });

  test('應該正確處理空的 columns 陣列', () => {
    render(
      <UsersDataTable
        columns={[]}
        data={mockUsers}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    // 表格應該仍然存在
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('應該正確處理空的 data 陣列', () => {
    render(
      <UsersDataTable
        columns={mockColumns}
        data={[]}
        onAddUser={mockOnAddUser}
        onSearchChange={mockOnSearchChange}
      />
    );

    expect(screen.getByText('沒有找到用戶資料')).toBeInTheDocument();
  });
});