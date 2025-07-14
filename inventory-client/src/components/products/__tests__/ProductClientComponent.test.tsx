/**
 * ProductClientComponent 測試文件
 * 
 * 測試 ProductClientComponent 組件的所有功能，包括：
 * - 權限控制和認證檢查
 * - 商品列表顯示和載入狀態
 * - 搜尋功能和防抖機制
 * - 單個和批量刪除功能
 * - 表格操作（排序、篩選、選擇、展開）
 * - 變體詳情模態框
 * - 路由導航功能
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProductClientComponent from '../ProductClientComponent';
import { ProductItem } from '@/types/api-helpers';

// Mock external dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('@/hooks', () => ({
  useProducts: jest.fn(),
  useDeleteProduct: jest.fn(),
  useDeleteMultipleProducts: jest.fn(),
}));

jest.mock('@/hooks/use-admin-auth', () => ({
  useAdminAuth: jest.fn(),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      {...props}
    />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => (
    <div data-testid="alert" {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? (
    <div data-testid="alert-dialog">
      {children}
    </div>
  ) : null,
  AlertDialogAction: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action" {...props}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-cancel" {...props}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-content" {...props}>
      {children}
    </div>
  ),
  AlertDialogDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-description" {...props}>
      {children}
    </div>
  ),
  AlertDialogFooter: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-footer" {...props}>
      {children}
    </div>
  ),
  AlertDialogHeader: ({ children, ...props }: any) => (
    <div data-testid="alert-dialog-header" {...props}>
      {children}
    </div>
  ),
  AlertDialogTitle: ({ children, ...props }: any) => (
    <h2 data-testid="alert-dialog-title" {...props}>
      {children}
    </h2>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => (
    <table data-testid="products-table" {...props}>
      {children}
    </table>
  ),
  TableHeader: ({ children, ...props }: any) => (
    <thead {...props}>
      {children}
    </thead>
  ),
  TableBody: ({ children, ...props }: any) => (
    <tbody {...props}>
      {children}
    </tbody>
  ),
  TableRow: ({ children, ...props }: any) => (
    <tr {...props}>
      {children}
    </tr>
  ),
  TableHead: ({ children, ...props }: any) => (
    <th {...props}>
      {children}
    </th>
  ),
  TableCell: ({ children, ...props }: any) => (
    <td {...props}>
      {children}
    </td>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children, ...props }: any) => <div data-testid="dropdown-menu-content" {...props}>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <div data-testid="dropdown-menu-trigger" {...props}>{children}</div>,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange, ...props }: any) => (
    <div data-testid="dropdown-menu-checkbox-item" data-checked={checked} onClick={() => onCheckedChange?.(!checked)} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 data-testid="card-title" {...props}>{children}</h3>,
}));

jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader-icon" className={className} {...props} />
  ),
  Package: ({ className, ...props }: any) => (
    <div data-testid="package-icon" className={className} {...props} />
  ),
  Search: ({ className, ...props }: any) => (
    <div data-testid="search-icon" className={className} {...props} />
  ),
  Trash2: ({ className, ...props }: any) => (
    <div data-testid="trash-icon" className={className} {...props} />
  ),
  Info: ({ className, ...props }: any) => (
    <div data-testid="info-icon" className={className} {...props} />
  ),
  ListFilter: ({ className, ...props }: any) => (
    <div data-testid="list-filter-icon" className={className} {...props} />
  ),
  ChevronDown: ({ className, ...props }: any) => (
    <div data-testid="chevron-down-icon" className={className} {...props} />
  ),
}));

// Mock VariantDetailsModal component
jest.mock('../VariantDetailsModal', () => {
  return function MockVariantDetailsModal({ isOpen, onClose, product }: any) {
    return isOpen ? (
      <div data-testid="variant-details-modal">
        <div>Product: {product?.name}</div>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    ) : null;
  };
});

// Mock columns
jest.mock('../columns', () => ({
  columns: [
    {
      id: 'select',
      header: '選擇',
      cell: ({ row }: any) => (
        <input 
          type="checkbox" 
          data-testid={`select-${row.original.id}`}
          checked={row.getIsSelected()}
          onChange={() => row.toggleSelected()}
        />
      ),
    },
    {
      id: 'product',
      header: '商品',
      cell: ({ row }: any) => <div>{row.original.name}</div>,
    },
    {
      id: 'price',
      header: '價格',
      cell: ({ row }: any) => <div>{row.original.price || 0}</div>,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }: any) => (
        <div>
          <button 
            data-testid={`edit-${row.original.originalId || row.original.id}`}
            onClick={() => {
              const event = new CustomEvent('editProduct', {
                detail: { id: row.original.originalId || row.original.id }
              });
              window.dispatchEvent(event);
            }}
          >
            編輯
          </button>
          <button 
            data-testid={`delete-${row.original.originalId || row.original.id}`}
            onClick={() => {
              const event = new CustomEvent('deleteProduct', {
                detail: { 
                  id: row.original.originalId || row.original.id, 
                  name: row.original.name 
                }
              });
              window.dispatchEvent(event);
            }}
          >
            刪除
          </button>
        </div>
      ),
    },
  ],
}));

// Test data
const mockProducts: ProductItem[] = [
  {
    id: 1,
    name: '測試商品1',
    description: '測試商品描述1',
    category_id: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    variants: [
      {
        id: 1,
        sku: 'TEST001',
        price: '100',
        attribute_values: [],
        inventory: [],
      }
    ],
    price_range: {
      min: 100,
      max: 100,
      count: 1,
    },
  },
  {
    id: 2,
    name: '測試商品2',
    description: '測試商品描述2',
    category_id: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    variants: [
      {
        id: 2,
        sku: 'TEST002',
        price: '200',
        attribute_values: [],
        inventory: [],
      }
    ],
    price_range: {
      min: 200,
      max: 200,
      count: 1,
    },
  },
];

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = (queryClient: QueryClient) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductClientComponent />
    </QueryClientProvider>
  );
};

describe('ProductClientComponent', () => {
  let mockUseRouter: jest.Mock;
  let mockUseSession: jest.Mock;
  let mockUseProducts: jest.Mock;
  let mockUseDeleteProduct: jest.Mock;
  let mockUseDeleteMultipleProducts: jest.Mock;
  let mockUseAdminAuth: jest.Mock;
  let mockRouter: { push: jest.Mock };
  let mockDeleteMutation: { mutate: jest.Mock };
  let mockDeleteMultipleMutation: { mutate: jest.Mock };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup router mock
    mockRouter = { push: jest.fn() };
    mockUseRouter = jest.requireMock<typeof import('next/navigation')>('next/navigation').useRouter as jest.Mock;
    mockUseRouter.mockReturnValue(mockRouter);
    
    // Setup session mock
    mockUseSession = jest.requireMock<typeof import('next-auth/react')>('next-auth/react').useSession as jest.Mock;
    mockUseSession.mockReturnValue({
      data: { user: { id: 1, name: 'Test User' } },
      status: 'authenticated',
    });
    
    // Setup hooks mocks
    mockUseProducts = jest.requireMock<typeof import('@/hooks')>('@/hooks').useProducts as jest.Mock;
    mockUseDeleteProduct = jest.requireMock<typeof import('@/hooks')>('@/hooks').useDeleteProduct as jest.Mock;
    mockUseDeleteMultipleProducts = jest.requireMock<typeof import('@/hooks')>('@/hooks').useDeleteMultipleProducts as jest.Mock;
    mockUseAdminAuth = jest.requireMock<typeof import('@/hooks/use-admin-auth')>('@/hooks/use-admin-auth').useAdminAuth as jest.Mock;
    
    // Setup mutation mocks
    mockDeleteMutation = { mutate: jest.fn() };
    mockDeleteMultipleMutation = { mutate: jest.fn() };
    
    // Default hook returns
    mockUseProducts.mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
    });
    
    mockUseDeleteProduct.mockReturnValue(mockDeleteMutation);
    mockUseDeleteMultipleProducts.mockReturnValue(mockDeleteMultipleMutation);
    
    mockUseAdminAuth.mockReturnValue({
      user: { id: 1, name: 'Test User' },
      isLoading: false,
      isAuthorized: true,
    });
  });

  describe('權限和認證', () => {
    it('當載入中時應該顯示載入指示器', () => {
      mockUseAdminAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthorized: false,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('當用戶未授權時應該顯示權限錯誤', () => {
      mockUseAdminAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthorized: false,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('您沒有權限訪問此頁面。請聯繫管理員。')).toBeInTheDocument();
    });

    it('當用戶已授權時應該正常顯示商品管理界面', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('products-table')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('搜尋商品名稱、SKU...')).toBeInTheDocument();
    });
  });

  describe('商品列表顯示', () => {
    it('應該正確渲染商品列表', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('products-table')).toBeInTheDocument();
      expect(screen.getByText('測試商品1')).toBeInTheDocument();
      expect(screen.getByText('測試商品2')).toBeInTheDocument();
    });

    it('當商品載入中時應該顯示載入狀態', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Should show loading spinner
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('當沒有商品時應該顯示空狀態', () => {
      mockUseProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('products-table')).toBeInTheDocument();
      // Table should be rendered but with no data rows
    });
  });

  describe('搜尋功能', () => {
    it('應該支援搜尋商品', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const searchInput = screen.getByPlaceholderText('搜尋商品名稱、SKU...');
      await user.type(searchInput, '測試商品1');

      expect(searchInput).toHaveValue('測試商品1');
    });

    it('應該使用防抖機制進行搜尋', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Initial call should be with empty search
      expect(mockUseProducts).toHaveBeenCalledWith({});
    });
  });

  describe('刪除功能', () => {
    it('應該能夠觸發單個商品刪除', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);

      // Should trigger delete confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      });
    });

    it('應該能夠確認刪除商品', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Trigger delete
      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      });

      // Confirm delete
      const confirmButton = screen.getByTestId('alert-dialog-action');
      await user.click(confirmButton);

      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('應該能夠取消刪除操作', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Trigger delete
      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      });

      // Cancel delete
      const cancelButton = screen.getByTestId('alert-dialog-cancel');
      await user.click(cancelButton);

      expect(mockDeleteMutation.mutate).not.toHaveBeenCalled();
    });

    it('應該支援批量刪除功能', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Select multiple products
      const checkbox1 = screen.getByTestId('select-product-1');
      const checkbox2 = screen.getByTestId('select-product-2');
      
      await user.click(checkbox1);
      await user.click(checkbox2);

      // Batch delete button should appear
      await waitFor(() => {
        expect(screen.getByText(/刪除選中/)).toBeInTheDocument();
      });
    });
  });

  describe('編輯功能', () => {
    it('應該能夠導航到編輯頁面', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const editButton = screen.getByTestId('edit-1');
      await user.click(editButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/products/1/edit');
    });
  });

  describe('表格操作', () => {
    it('應該顯示欄位顯示控制選單', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('dropdown-menu-trigger')).toBeInTheDocument();
      expect(screen.getByText('欄位顯示')).toBeInTheDocument();
    });

    it('應該正確處理商品選擇', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const checkbox = screen.getByTestId('select-product-1');
      await user.click(checkbox);

      // Checkbox should be checked
      expect(checkbox).toBeChecked();
    });
  });

  describe('Hook 調用驗證', () => {
    it('應該正確調用所有必要的 hooks', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(mockUseProducts).toHaveBeenCalled();
      expect(mockUseDeleteProduct).toHaveBeenCalled();
      expect(mockUseDeleteMultipleProducts).toHaveBeenCalled();
      expect(mockUseAdminAuth).toHaveBeenCalled();
      expect(mockUseRouter).toHaveBeenCalled();
      expect(mockUseSession).toHaveBeenCalled();
    });

    it('應該正確處理 API 查詢參數', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Initial call should be with empty parameters
      expect(mockUseProducts).toHaveBeenCalledWith({});
    });
  });

  describe('事件處理', () => {
    it('應該正確處理編輯事件', async () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Trigger custom edit event
      act(() => {
        const event = new CustomEvent('editProduct', {
          detail: { id: 1 }
        });
        window.dispatchEvent(event);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/products/1/edit');
    });

    it('應該正確處理刪除事件', async () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Trigger custom delete event
      act(() => {
        const event = new CustomEvent('deleteProduct', {
          detail: { id: 1, name: '測試商品1' }
        });
        window.dispatchEvent(event);
      });

      // Should show delete confirmation dialog
      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該處理 API 錯誤', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: '網路錯誤' },
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // Should show error message instead of table when there's an error
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('載入商品資料時發生錯誤。請重新整理頁面。')).toBeInTheDocument();
    });

    it('應該處理空的商品數據', () => {
      mockUseProducts.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('products-table')).toBeInTheDocument();
    });
  });
}); 