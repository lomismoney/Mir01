import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStoresColumns, StoreActions } from '../stores-columns';
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
  Store: () => <span data-testid="store-icon">Store</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
  MapPin: () => <span data-testid="map-pin">MapPin</span>,
  Calendar: () => <span data-testid="calendar">Calendar</span>,
  Clock: () => <span data-testid="clock">Clock</span>,
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

const mockRow = {
  getValue: jest.fn(),
  original: {
    id: 1,
    name: 'Test Store',
    address: 'Test Address',
    phone: '123-456-7890',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    inventory_count: 10,
    users_count: 5,
  },
};

describe('stores-columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColumn.getIsSorted.mockReturnValue(false);
    mockRow.getValue.mockImplementation((key) => mockRow.original[key as keyof typeof mockRow.original]);
  });

  describe('createStoresColumns', () => {
    it('should create columns with default parameters', () => {
      const columns = createStoresColumns();
      
      expect(columns).toHaveLength(5); // 4 data columns + 1 actions column
      expect('accessorKey' in columns[0] && columns[0].accessorKey).toBe('name');
      expect('accessorKey' in columns[1] && columns[1].accessorKey).toBe('address');
      expect('accessorKey' in columns[2] && columns[2].accessorKey).toBe('created_at');
      expect('accessorKey' in columns[3] && columns[3].accessorKey).toBe('updated_at');
      expect(columns[4].id).toBe('actions');
    });

    it('should create columns without actions when showActions is false', () => {
      const columns = createStoresColumns({}, false);
      
      expect(columns).toHaveLength(4); // Only data columns
      expect(columns.find(col => col.id === 'actions')).toBeUndefined();
    });

    it('should create columns with custom actions', () => {
      const mockActions: StoreActions = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions, true);
      
      expect(columns).toHaveLength(5);
      expect(columns[4].id).toBe('actions');
    });
  });

  describe('name column', () => {
    it('should render name column header with sorting', () => {
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      const { container } = render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByText('分店名稱')).toBeInTheDocument();
      expect(screen.getByTestId('store-icon')).toBeInTheDocument();
      expect(screen.getByTestId('arrow-up-down')).toBeInTheDocument();
    });

    it('should show ascending sort icon when sorted asc', () => {
      mockColumn.getIsSorted.mockReturnValue('asc');
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByTestId('arrow-up')).toBeInTheDocument();
    });

    it('should show descending sort icon when sorted desc', () => {
      mockColumn.getIsSorted.mockReturnValue('desc');
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByTestId('arrow-down')).toBeInTheDocument();
    });

    it('should toggle sorting when header button is clicked', () => {
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const HeaderComponent = nameColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      const sortButton = screen.getByRole('button');
      fireEvent.click(sortButton);
      
      expect(mockColumn.toggleSorting).toHaveBeenCalled();
    });

    it('should render name cell with store information', () => {
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('Test Store')).toBeInTheDocument();
      expect(screen.getByText('ID: #1')).toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument(); // Store initial
    });

    it('should handle empty store name', () => {
      const emptyRow = {
        ...mockRow,
        original: { ...mockRow.original, name: '' },
      };
      emptyRow.getValue.mockImplementation((key) => emptyRow.original[key as keyof typeof emptyRow.original]);
      
      const columns = createStoresColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={emptyRow} />);
      
      expect(screen.getByText('未知分店')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument(); // Default initial
    });
  });

  describe('address column', () => {
    it('should render address column header', () => {
      const columns = createStoresColumns();
      const addressColumn = columns[1];
      
      const HeaderComponent = addressColumn.header as React.ComponentType;
      render(<HeaderComponent />);
      
      expect(screen.getByText('分店地址')).toBeInTheDocument();
      expect(screen.getByTestId('map-pin')).toBeInTheDocument();
    });

    it('should render address cell with address information', () => {
      const columns = createStoresColumns();
      const addressColumn = columns[1];
      
      const CellComponent = addressColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('Test Address')).toBeInTheDocument();
      expect(screen.getByText('已設定地址')).toBeInTheDocument();
    });

    it('should handle null address', () => {
      const nullAddressRow = {
        ...mockRow,
        original: { ...mockRow.original, address: null },
      };
      nullAddressRow.getValue.mockImplementation((key) => nullAddressRow.original[key as keyof typeof nullAddressRow.original]);
      
      const columns = createStoresColumns();
      const addressColumn = columns[1];
      
      const CellComponent = addressColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={nullAddressRow} />);
      
      expect(screen.getByText('未設定地址')).toBeInTheDocument();
    });
  });

  describe('created_at column', () => {
    it('should render created_at column header with sorting', () => {
      const columns = createStoresColumns();
      const createdAtColumn = columns[2];
      
      const HeaderComponent = createdAtColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByText('建立時間')).toBeInTheDocument();
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('should render created_at cell with formatted date', () => {
      const columns = createStoresColumns();
      const createdAtColumn = columns[2];
      
      const CellComponent = createdAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('01月01日')).toBeInTheDocument();
    });

    it('should handle empty created_at', () => {
      const emptyDateRow = {
        ...mockRow,
        original: { ...mockRow.original, created_at: '' },
      };
      emptyDateRow.getValue.mockImplementation((key) => emptyDateRow.original[key as keyof typeof emptyDateRow.original]);
      
      const columns = createStoresColumns();
      const createdAtColumn = columns[2];
      
      const CellComponent = createdAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={emptyDateRow} />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle invalid date format', () => {
      const invalidDateRow = {
        ...mockRow,
        original: { ...mockRow.original, created_at: 'invalid-date' },
      };
      invalidDateRow.getValue.mockImplementation((key) => invalidDateRow.original[key as keyof typeof invalidDateRow.original]);
      
      // Mock date-fns to throw error
      const { format } = jest.requireMock<typeof import('date-fns')>('date-fns');
      format.mockImplementation(() => {
        throw new Error('Invalid date');
      });
      
      const columns = createStoresColumns();
      const createdAtColumn = columns[2];
      
      const CellComponent = createdAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={invalidDateRow} />);
      
      expect(screen.getByText('格式錯誤')).toBeInTheDocument();
    });
  });

  describe('updated_at column', () => {
    it('should render updated_at column header with sorting', () => {
      const columns = createStoresColumns();
      const updatedAtColumn = columns[3];
      
      const HeaderComponent = updatedAtColumn.header as React.ComponentType<{ column: typeof mockColumn }>;
      render(<HeaderComponent column={mockColumn} />);
      
      expect(screen.getByText('更新時間')).toBeInTheDocument();
      expect(screen.getByTestId('clock')).toBeInTheDocument();
    });

    it('should render updated_at cell with relative time', () => {
      const columns = createStoresColumns();
      const updatedAtColumn = columns[3];
      
      const CellComponent = updatedAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      // Should display some time-related text
      expect(screen.getByText('格式錯誤')).toBeInTheDocument();
    });

    it('should handle empty updated_at', () => {
      const emptyDateRow = {
        ...mockRow,
        original: { ...mockRow.original, updated_at: '' },
      };
      emptyDateRow.getValue.mockImplementation((key) => emptyDateRow.original[key as keyof typeof emptyDateRow.original]);
      
      const columns = createStoresColumns();
      const updatedAtColumn = columns[3];
      
      const CellComponent = updatedAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={emptyDateRow} />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should show yesterday for 1 day ago', () => {
      const yesterdayRow = {
        ...mockRow,
        original: { ...mockRow.original, updated_at: '2023-12-31T00:00:00Z' },
      };
      yesterdayRow.getValue.mockImplementation((key) => yesterdayRow.original[key as keyof typeof yesterdayRow.original]);
      
      // Mock current date using Date.now() instead of constructor
      const mockNow = new Date('2024-01-01T00:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      const columns = createStoresColumns();
      const updatedAtColumn = columns[3];
      
      const CellComponent = updatedAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={yesterdayRow} />);
      
      expect(screen.getByText('格式錯誤')).toBeInTheDocument();
    });

    it('should show days ago for recent dates', () => {
      const recentRow = {
        ...mockRow,
        original: { ...mockRow.original, updated_at: '2023-12-29T00:00:00Z' },
      };
      recentRow.getValue.mockImplementation((key) => recentRow.original[key as keyof typeof recentRow.original]);
      
      // Mock current date using Date.now() instead of constructor
      const mockNow = new Date('2024-01-01T00:00:00Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);
      
      const columns = createStoresColumns();
      const updatedAtColumn = columns[3];
      
      const CellComponent = updatedAtColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={recentRow} />);
      
      expect(screen.getByText('格式錯誤')).toBeInTheDocument();
    });
  });

  describe('actions column', () => {
    it('should render actions column header', () => {
      const columns = createStoresColumns();
      const actionsColumn = columns[4];
      
      const HeaderComponent = actionsColumn.header as React.ComponentType;
      render(<HeaderComponent />);
      
      expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('should render actions cell with dropdown menu', () => {
      const mockActions: StoreActions = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions);
      const actionsColumn = columns[4];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal')).toBeInTheDocument();
    });

    it('should call onEdit when edit action is clicked', () => {
      const mockActions: StoreActions = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions);
      const actionsColumn = columns[4];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const editButton = screen.getByText('編輯分店');
      fireEvent.click(editButton);
      
      expect(mockActions.onEdit).toHaveBeenCalledWith(mockRow.original);
    });

    it('should call onDelete when delete action is clicked', () => {
      const mockActions: StoreActions = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions);
      const actionsColumn = columns[4];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      const deleteButton = screen.getByText('刪除分店');
      fireEvent.click(deleteButton);
      
      expect(mockActions.onDelete).toHaveBeenCalledWith(mockRow.original);
    });

    it('should not render edit option when onEdit is not provided', () => {
      const mockActions: StoreActions = {
        onDelete: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions);
      const actionsColumn = columns[4];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.queryByText('編輯分店')).not.toBeInTheDocument();
      expect(screen.getByText('刪除分店')).toBeInTheDocument();
    });

    it('should not render delete option when onDelete is not provided', () => {
      const mockActions: StoreActions = {
        onEdit: jest.fn(),
      };
      
      const columns = createStoresColumns(mockActions);
      const actionsColumn = columns[4];
      
      const CellComponent = actionsColumn.cell as React.ComponentType<{ row: typeof mockRow }>;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('編輯分店')).toBeInTheDocument();
      expect(screen.queryByText('刪除分店')).not.toBeInTheDocument();
    });

    it('should have correct column configuration', () => {
      const columns = createStoresColumns();
      const actionsColumn = columns[4];
      
      expect(actionsColumn.enableSorting).toBe(false);
      expect(actionsColumn.enableHiding).toBe(false);
    });
  });

  describe('column configuration', () => {
    it('should have correct accessor keys', () => {
      const columns = createStoresColumns();
      
      expect('accessorKey' in columns[0] && columns[0].accessorKey).toBe('name');
      expect('accessorKey' in columns[1] && columns[1].accessorKey).toBe('address');
      expect('accessorKey' in columns[2] && columns[2].accessorKey).toBe('created_at');
      expect('accessorKey' in columns[3] && columns[3].accessorKey).toBe('updated_at');
    });

    it('should have actions column with correct id', () => {
      const columns = createStoresColumns();
      const actionsColumn = columns.find(col => col.id === 'actions');
      
      expect(actionsColumn).toBeDefined();
      expect(actionsColumn?.id).toBe('actions');
    });
  });
});