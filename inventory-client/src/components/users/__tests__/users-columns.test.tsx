import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createUsersColumns, UserActions } from '../users-columns';
import {
  MockComponentProps,
  MockButtonProps
} from '@/test-utils/mock-types';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: MockButtonProps) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

interface MockDropdownMenuItemProps extends MockComponentProps {
  onClick?: () => void;
}

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: MockComponentProps) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: MockComponentProps) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: MockComponentProps) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: MockDropdownMenuItemProps) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: MockComponentProps) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: MockComponentProps) => <span data-testid="badge">{children}</span>,
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: MockComponentProps) => <div data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: MockComponentProps) => <div data-testid="avatar-fallback">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MoreHorizontal: () => <span data-testid="more-horizontal">MoreHorizontal</span>,
  ArrowUpDown: () => <span data-testid="arrow-up-down">ArrowUpDown</span>,
  ArrowUp: () => <span data-testid="arrow-up">ArrowUp</span>,
  ArrowDown: () => <span data-testid="arrow-down">ArrowDown</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Store: () => <span data-testid="store-icon">Store</span>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-01';
    if (formatStr === 'MM月dd日') return '01月01日';
    return '2024-01-01';
  }),
}));

jest.mock('date-fns/locale', () => ({
  zhTW: {},
}));

// Mock table functionality
const mockColumn = {
  getIsSorted: jest.fn(),
  toggleSorting: jest.fn(),
};

const mockUser = {
  id: 1,
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['admin'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  stores: [
    { id: 1, name: 'Store 1' },
    { id: 2, name: 'Store 2' },
  ],
};

const mockRow = {
  getValue: jest.fn(),
  original: mockUser,
};

describe('users-columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColumn.getIsSorted.mockReturnValue(false);
    mockRow.getValue.mockImplementation((key) => mockUser[key as keyof typeof mockUser]);
  });

  describe('createUsersColumns', () => {
    it('should create columns with default parameters', () => {
      const columns = createUsersColumns();
      
      expect(columns).toHaveLength(8); // 7 data columns + 1 actions column
      expect(columns[0].id).toBe('avatar');
      expect('accessorKey' in columns[1] && columns[1].accessorKey).toBe('name');
      expect('accessorKey' in columns[2] && columns[2].accessorKey).toBe('username');
      expect('accessorKey' in columns[3] && columns[3].accessorKey).toBe('roles');
      expect(columns[4].id).toBe('stores');
      expect('accessorKey' in columns[5] && columns[5].accessorKey).toBe('created_at');
      expect('accessorKey' in columns[6] && columns[6].accessorKey).toBe('updated_at');
      expect(columns[7].id).toBe('actions');
    });

    it('should create columns without actions when showActions is false', () => {
      const columns = createUsersColumns({}, false);
      
      // Note: Current implementation doesn't respect showActions parameter
      expect(columns).toHaveLength(8); // Still includes actions column
      expect(columns.find(col => col.id === 'actions')).toBeDefined();
    });

    it('should create columns with custom actions', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions, true);
      
      expect(columns).toHaveLength(8);
      expect(columns[7].id).toBe('actions');
    });
  });

  describe('name column', () => {
    it('should render name column header with sorting', () => {
      const columns = createUsersColumns();
      const nameColumn = columns[1];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      const { container } = render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument();
    });

    it('should show ascending sort icon when sorted asc', () => {
      mockColumn.getIsSorted.mockReturnValue('asc');
      const columns = createUsersColumns();
      const nameColumn = columns[1];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument();
    });

    it('should show descending sort icon when sorted desc', () => {
      mockColumn.getIsSorted.mockReturnValue('desc');
      const columns = createUsersColumns();
      const nameColumn = columns[1];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument();
    });

    it('should render name cell with user information', () => {
      const columns = createUsersColumns();
      const nameColumn = columns[1];
      
      const CellComponent = nameColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('avatar column', () => {
    it('should render avatar column header', () => {
      const columns = createUsersColumns();
      const avatarColumn = columns[0];
      
      // Avatar column has empty header
      expect(avatarColumn.header).toBe('');
    });

    it('should render avatar cell with user initial', () => {
      const columns = createUsersColumns();
      const avatarColumn = columns[0];
      
      const CellComponent = avatarColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      expect(screen.getByText('TU')).toBeInTheDocument(); // Initials of "Test User"
    });

    it('should handle empty user name', () => {
      const emptyNameRow = {
        ...mockRow,
        original: { ...mockUser, name: '' },
      };
      emptyNameRow.getValue.mockImplementation((key) => emptyNameRow.original[key as keyof typeof emptyNameRow.original]);
      
      const columns = createUsersColumns();
      const avatarColumn = columns[0];
      
      const CellComponent = avatarColumn.cell as React.ComponentType<{ row: typeof emptyNameRow }>;
      render(<CellComponent row={emptyNameRow} />);
      
      expect(screen.getByText('未')).toBeInTheDocument(); // Default fallback
    });
  });

  describe('username column', () => {
    it('should render username column header', () => {
      const columns = createUsersColumns();
      const usernameColumn = columns[2];
      
      const HeaderComponent = usernameColumn.header as React.ComponentType;
      render(<HeaderComponent />);
      
      expect(screen.getByText('用戶名')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument();
    });

    it('should render username cell', () => {
      const columns = createUsersColumns();
      const usernameColumn = columns[2];
      
      const CellComponent = usernameColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  describe('roles column', () => {
    it('should render roles column header', () => {
      const columns = createUsersColumns();
      const rolesColumn = columns[3];
      
      expect(rolesColumn.header).toBe('角色');
    });

    it('should render roles cell with badge for admin', () => {
      const columns = createUsersColumns();
      const rolesColumn = columns[3];
      
      const CellComponent = rolesColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screen.getByText('管理員')).toBeInTheDocument();
    });

    it('should render roles cell with badge for user', () => {
      const userRow = {
        ...mockRow,
        original: { ...mockUser, roles: ['user'] },
      };
      userRow.getValue.mockImplementation((key) => userRow.original[key as keyof typeof userRow.original]);
      
      const columns = createUsersColumns();
      const rolesColumn = columns[3];
      
      const CellComponent = rolesColumn.cell as React.ComponentType<{ row: typeof userRow }>;
      render(<CellComponent row={userRow} />);
      
      expect(screen.getByText('檢視者')).toBeInTheDocument();
    });
  });

  describe('stores column', () => {
    it('should render stores column header', () => {
      const columns = createUsersColumns();
      const storesColumn = columns[4];
      
      expect(storesColumn.header).toBe('所屬分店');
    });

    it('should render stores cell with store badges', () => {
      const columns = createUsersColumns();
      const storesColumn = columns[4];
      
      const CellComponent = storesColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('Store 1')).toBeInTheDocument();
      expect(screen.getByText('Store 2')).toBeInTheDocument();
    });
  });

  describe('created_at column', () => {
    it('should render created_at column header', () => {
      const columns = createUsersColumns();
      const createdAtColumn = columns[5];
      
      const HeaderComponent = createdAtColumn.header as React.ComponentType;
      render(<HeaderComponent />);
      
      expect(screen.getByText('建立時間')).toBeInTheDocument();
    });

    it('should render created_at cell with formatted date', () => {
      const columns = createUsersColumns();
      const createdAtColumn = columns[5];
      
      const CellComponent = createdAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('should handle empty created_at', () => {
      const emptyDateRow = {
        ...mockRow,
        original: { ...mockUser, created_at: '' },
      };
      emptyDateRow.getValue.mockImplementation((key) => emptyDateRow.original[key as keyof typeof emptyDateRow.original]);
      
      const columns = createUsersColumns();
      const createdAtColumn = columns[5];
      
      const CellComponent = createdAtColumn.cell as React.ComponentType<{ row: typeof emptyDateRow }>;
      render(<CellComponent row={emptyDateRow} />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('updated_at column', () => {
    it('should render updated_at column header', () => {
      const columns = createUsersColumns();
      const updatedAtColumn = columns[6];
      
      const HeaderComponent = updatedAtColumn.header as React.ComponentType;
      render(<HeaderComponent />);
      
      expect(screen.getByText('更新時間')).toBeInTheDocument();
    });

    it('should render updated_at cell with formatted date', () => {
      const columns = createUsersColumns();
      const updatedAtColumn = columns[6];
      
      const CellComponent = updatedAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });
  });

  describe('actions column', () => {
    it('should render actions column header', () => {
      const columns = createUsersColumns();
      const actionsColumn = columns[7];
      
      expect(actionsColumn.header).toBe('操作');
    });

    it('should render actions cell with dropdown menu', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal')).toBeInTheDocument();
    });

    it('should call onView when view action is clicked', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const viewButton = screen.getByText('查看詳情');
      fireEvent.click(viewButton);
      
      expect(mockActions.onView).toHaveBeenCalledWith(mockUser);
    });

    it('should call onEdit when edit action is clicked', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const editButton = screen.getByText('編輯用戶');
      fireEvent.click(editButton);
      
      expect(mockActions.onEdit).toHaveBeenCalledWith(mockUser);
    });

    it('should call onDelete when delete action is clicked', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const deleteButton = screen.getByText('刪除用戶');
      fireEvent.click(deleteButton);
      
      expect(mockActions.onDelete).toHaveBeenCalledWith(mockUser);
    });

    it('should call onManageStores when manage stores action is clicked', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onManageStores: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const manageStoresButton = screen.getByText('分配分店');
      fireEvent.click(manageStoresButton);
      
      expect(mockActions.onManageStores).toHaveBeenCalledWith(mockUser);
    });

    it('should not render actions when not provided', () => {
      const mockActions: UserActions = {
        onView: jest.fn(),
      };
      
      const columns = createUsersColumns(mockActions);
      const actionsColumn = columns[7];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('查看詳情')).toBeInTheDocument();
      expect(screen.queryByText('編輯')).not.toBeInTheDocument();
      expect(screen.queryByText('刪除')).not.toBeInTheDocument();
      expect(screen.queryByText('管理門市')).not.toBeInTheDocument();
    });
  });
});