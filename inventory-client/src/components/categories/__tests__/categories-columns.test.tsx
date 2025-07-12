import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createCategoryColumns, CategoryActions } from '../categories-columns';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: ({ className }: any) => (
    <span data-testid="chevron-right" className={className}>ChevronRight</span>
  ),
  MoreHorizontal: () => <span data-testid="more-horizontal">MoreHorizontal</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Folder: () => <span data-testid="folder-icon">Folder</span>,
  FolderOpen: () => <span data-testid="folder-open-icon">FolderOpen</span>,
}));

// Mock CategoryNode type
const mockCategory = {
  id: 1,
  name: 'Test Category',
  parent_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  children: [],
  products_count: 5,
};

const mockSubCategory = {
  id: 2,
  name: 'Sub Category',
  parent_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  children: [],
  products_count: 2,
};

const mockRow = {
  getValue: jest.fn(),
  original: mockCategory,
  depth: 0,
  getCanExpand: jest.fn(),
  getToggleExpandedHandler: jest.fn(),
  getIsExpanded: jest.fn(),
};

describe('categories-columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRow.getValue.mockImplementation((key) => mockCategory[key as keyof typeof mockCategory]);
    mockRow.getCanExpand.mockReturnValue(true);
    mockRow.getToggleExpandedHandler.mockReturnValue(jest.fn());
    mockRow.getIsExpanded.mockReturnValue(false);
  });

  describe('createCategoryColumns', () => {
    it('should create columns with default parameters', () => {
      const columns = createCategoryColumns();
      
      expect(columns).toHaveLength(4);
      expect(columns[0].accessorKey).toBe('name');
      expect(columns[1].accessorKey).toBe('description');
      expect(columns[2].id).toBe('statistics');
      expect(columns[3].id).toBe('actions');
    });

    it('should create columns with custom actions', () => {
      const mockActions: CategoryActions = {
        onAddSubCategory: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      
      expect(columns).toHaveLength(4);
      expect(columns[3].id).toBe('actions');
    });
  });

  describe('name column', () => {
    it('should render category name with expand functionality', () => {
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      // Header is a string, not a component
      expect(nameColumn.header).toBe('分類名稱');
    });

    it('should render category name cell with correct indentation', () => {
      mockRow.depth = 1;
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      const { container } = render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('Test Category')).toBeInTheDocument();
      
      // Check if the padding is applied correctly
      const nameContainer = container.querySelector('[style*="padding-left: 2rem"]');
      expect(nameContainer).toBeInTheDocument();
    });

    it('should show chevron icon when category can expand', () => {
      mockRow.getCanExpand.mockReturnValue(true);
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should not show chevron icon when category cannot expand', () => {
      mockRow.getCanExpand.mockReturnValue(false);
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument();
    });

    it('should show folder icon when category is expanded', () => {
      mockRow.getIsExpanded.mockReturnValue(true);
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('folder-open-icon')).toBeInTheDocument();
    });

    it('should show folder icon when category is collapsed', () => {
      mockRow.getIsExpanded.mockReturnValue(false);
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('folder-icon')).toBeInTheDocument();
    });

    it('should call toggle expand when clicked', () => {
      const mockToggleExpanded = jest.fn();
      mockRow.getToggleExpandedHandler.mockReturnValue(mockToggleExpanded);
      mockRow.getCanExpand.mockReturnValue(true);
      
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      const nameContainer = screen.getByText('Test Category').closest('div');
      fireEvent.click(nameContainer!);
      
      expect(mockToggleExpanded).toHaveBeenCalled();
    });

    it('should not call toggle expand when category cannot expand', () => {
      const mockToggleExpanded = jest.fn();
      mockRow.getToggleExpandedHandler.mockReturnValue(mockToggleExpanded);
      mockRow.getCanExpand.mockReturnValue(false);
      
      const columns = createCategoryColumns();
      const nameColumn = columns[0];
      
      const CellComponent = nameColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      const nameContainer = screen.getByText('Test Category').closest('div');
      fireEvent.click(nameContainer!);
      
      expect(mockToggleExpanded).not.toHaveBeenCalled();
    });
  });

  describe('description column', () => {
    it('should render description column header', () => {
      const columns = createCategoryColumns();
      const descriptionColumn = columns[1];
      
      expect(descriptionColumn.header).toBe('描述');
    });

    it('should render description cell', () => {
      const categoryWithDescription = {
        ...mockCategory,
        description: 'Test description'
      };
      const rowWithDescription = {
        ...mockRow,
        original: categoryWithDescription,
      };
      rowWithDescription.getValue.mockImplementation((key) => categoryWithDescription[key as keyof typeof categoryWithDescription]);
      
      const columns = createCategoryColumns();
      const descriptionColumn = columns[1];
      
      const CellComponent = descriptionColumn.cell as any;
      render(<CellComponent row={rowWithDescription} />);
      
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      const columns = createCategoryColumns();
      const descriptionColumn = columns[1];
      
      const CellComponent = descriptionColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('暫無描述')).toBeInTheDocument();
    });
  });

  describe('statistics column', () => {
    it('should render statistics column header', () => {
      const columns = createCategoryColumns();
      const statisticsColumn = columns[2];
      
      expect(statisticsColumn.header).toBe('統計');
    });

    it('should render statistics cell with product count', () => {
      const categoryWithStats = {
        ...mockCategory,
        total_products_count: 5
      };
      const rowWithStats = {
        ...mockRow,
        original: categoryWithStats,
      };
      rowWithStats.getValue.mockImplementation((key) => categoryWithStats[key as keyof typeof categoryWithStats]);
      
      const columns = createCategoryColumns();
      const statisticsColumn = columns[2];
      
      const CellComponent = statisticsColumn.cell as any;
      render(<CellComponent row={rowWithStats} />);
      
      expect(screen.getByText('5 個商品')).toBeInTheDocument();
    });

    it('should show sub-categories count when has children', () => {
      const categoryWithChildren = {
        ...mockCategory,
        children: [mockSubCategory, { ...mockSubCategory, id: 3 }],
        total_products_count: 10
      };
      const rowWithChildren = {
        ...mockRow,
        original: categoryWithChildren,
      };
      rowWithChildren.getValue.mockImplementation((key) => categoryWithChildren[key as keyof typeof categoryWithChildren]);
      
      const columns = createCategoryColumns();
      const statisticsColumn = columns[2];
      
      const CellComponent = statisticsColumn.cell as any;
      render(<CellComponent row={rowWithChildren} />);
      
      expect(screen.getByText('2 個子分類')).toBeInTheDocument();
      expect(screen.getByText('10 個商品')).toBeInTheDocument();
    });
  });

  describe('actions column', () => {
    it('should render actions column header', () => {
      const columns = createCategoryColumns();
      const actionsColumn = columns[3];
      
      expect(actionsColumn.header).toBe('操作');
    });

    it('should render actions cell with dropdown menu', () => {
      const mockActions: CategoryActions = {
        onAddSubCategory: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      const actionsColumn = columns[3];
      
      const CellComponent = actionsColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      expect(screen.getByTestId('more-horizontal')).toBeInTheDocument();
    });

    it('should call onAddSubCategory when add sub category is clicked', () => {
      const mockActions: CategoryActions = {
        onAddSubCategory: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      const actionsColumn = columns[3];
      
      const CellComponent = actionsColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      const addSubCategoryButton = screen.getByText('新增子分類');
      fireEvent.click(addSubCategoryButton);
      
      expect(mockActions.onAddSubCategory).toHaveBeenCalledWith(mockCategory.id);
    });

    it('should call onEdit when edit action is clicked', () => {
      const mockActions: CategoryActions = {
        onAddSubCategory: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      const actionsColumn = columns[3];
      
      const CellComponent = actionsColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      const editButton = screen.getByText('編輯分類');
      fireEvent.click(editButton);
      
      expect(mockActions.onEdit).toHaveBeenCalledWith(mockCategory);
    });

    it('should call onDelete when delete action is clicked', () => {
      const mockActions: CategoryActions = {
        onAddSubCategory: jest.fn(),
        onEdit: jest.fn(),
        onDelete: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      const actionsColumn = columns[3];
      
      const CellComponent = actionsColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      const deleteButton = screen.getByText('刪除分類');
      fireEvent.click(deleteButton);
      
      expect(mockActions.onDelete).toHaveBeenCalledWith(mockCategory);
    });

    it('should not render actions when not provided', () => {
      const mockActions: CategoryActions = {
        onEdit: jest.fn(),
      };
      
      const columns = createCategoryColumns(mockActions);
      const actionsColumn = columns[3];
      
      const CellComponent = actionsColumn.cell as any;
      render(<CellComponent row={mockRow} />);
      
      expect(screen.getByText('編輯分類')).toBeInTheDocument();
      expect(screen.queryByText('新增子分類')).not.toBeInTheDocument();
      expect(screen.queryByText('刪除分類')).not.toBeInTheDocument();
    });

    it('should have correct column configuration', () => {
      const columns = createCategoryColumns();
      const actionsColumn = columns[3];
      
      expect(actionsColumn.enableSorting).toBe(false);
      expect(actionsColumn.enableHiding).toBe(false);
    });
  });
});