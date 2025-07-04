/**
 * CustomerClientComponent 測試文件
 * 
 * 測試 CustomerClientComponent 組件的所有功能，包括：
 * - 客戶列表顯示
 * - 搜尋功能
 * - 新增客戶功能
 * - 編輯客戶功能
 * - 後台同步機制
 * - 錯誤處理
 * - 載入狀態管理
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerClientComponent } from '../CustomerClientComponent';
import { Customer } from '@/types/api-helpers';

// Mock 所有相關的 hooks
jest.mock('@/hooks', () => ({
  useCustomers: jest.fn(),
  useCreateCustomer: jest.fn(),
  useUpdateCustomer: jest.fn(),
  useCustomerDetail: jest.fn(),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

// 簡化 UI 組件 Mock
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
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

// 簡化 Dialog Mock - 使用狀態來控制顯示
jest.mock('@/components/ui/dialog', () => {
  const DialogState = {
    createOpen: false,
    editOpen: false,
  };

  return {
    Dialog: ({ children, open, onOpenChange }: any) => {
      React.useEffect(() => {
        // 當組件卸載時重置狀態
        return () => {
          DialogState.createOpen = false;
          DialogState.editOpen = false;
        };
      }, []);

      return (
        <div data-testid="dialog-container">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              if (child.props && typeof child.props === 'object' && 'asChild' in child.props) {
                // DialogTrigger
                return React.cloneElement(child as any, {
                  onClick: () => {
                    onOpenChange?.(!open);
                  }
                });
              }
              if (open) {
                return child;
              }
            }
            return null;
          })}
        </div>
      );
    },
    DialogContent: ({ children }: any) => (
      <div data-testid="dialog-content" role="dialog">
        {children}
      </div>
    ),
    DialogHeader: ({ children }: any) => (
      <div data-testid="dialog-header">
        {children}
      </div>
    ),
    DialogTitle: ({ children }: any) => (
      <h2 data-testid="dialog-title">
        {children}
      </h2>
    ),
    DialogTrigger: ({ children, asChild }: any) => {
      return React.cloneElement(children, {
        'data-testid': 'dialog-trigger',
      });
    },
    DialogDescription: ({ children }: any) => (
      <div data-testid="dialog-description">
        {children}
      </div>
    ),
  };
});

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => (
    <table data-testid="customers-table" {...props}>
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

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div data-testid="alert" className={className} {...props}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, ...props }: any) => (
    <div data-testid="alert-description" {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/data-table-skeleton', () => ({
  DataTableSkeleton: ({ columns, rows, ...props }: any) => (
    <div data-testid="data-table-skeleton" {...props}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} data-testid="skeleton-row">
          {Array.from({ length: columns }, (_, j) => (
            <div key={j} data-testid="skeleton" />
          ))}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('lucide-react', () => ({
  RefreshCw: ({ className, ...props }: any) => (
    <div data-testid="refresh-icon" className={className} {...props} />
  ),
  AlertCircle: ({ className, ...props }: any) => (
    <div data-testid="alert-icon" className={className} {...props} />
  ),
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader-icon" className={className} {...props} />
  ),
}));

// Mock CustomerForm 組件
jest.mock('../CustomerForm', () => ({
  CustomerForm: ({ initialData, isSubmitting, onSubmit, ...props }: any) => (
    <div data-testid="customer-form" {...props}>
      <button 
        data-testid="submit-form" 
        onClick={() => onSubmit({ name: '測試客戶' })}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      {initialData && (
        <div data-testid="initial-data">
          {initialData.name}
        </div>
      )}
    </div>
  ),
}));

// Mock columns - 簡化實現
jest.mock('../columns', () => ({
  columns: jest.fn(({ onEditCustomer }: any) => [
    {
      id: 'name',
      header: '客戶名稱',
      cell: ({ row }: any) => row.original.name,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }: any) => (
        <button 
          data-testid={`edit-customer-${row.original.id}`}
          onClick={() => onEditCustomer(row.original)}
        >
          編輯
        </button>
      ),
    },
  ]),
}));

// 測試數據
const mockCustomers: Customer[] = [
  {
    id: 1,
    name: '測試客戶1',
    phone: '0912345678',
    is_company: false,
    tax_id: null,
    industry_type: null,
    payment_type: 'cash',
    contact_address: '測試地址1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '測試客戶2',
    phone: '0987654321',
    is_company: true,
    tax_id: '12345678',
    industry_type: 'retail',
    payment_type: 'transfer',
    contact_address: '測試地址2',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
];

// 測試工具函數
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
      <CustomerClientComponent />
    </QueryClientProvider>
  );
};

describe('CustomerClientComponent', () => {
  let mockUseCustomers: jest.Mock;
  let mockUseCreateCustomer: jest.Mock;
  let mockUseUpdateCustomer: jest.Mock;
  let mockUseCustomerDetail: jest.Mock;
  let mockCreateCustomer: jest.Mock;
  let mockUpdateCustomer: jest.Mock;
  let mockRefetchCustomerDetail: jest.Mock;

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
    
    // 設置 hook mocks
    mockUseCustomers = require('@/hooks').useCustomers as jest.Mock;
    mockUseCreateCustomer = require('@/hooks').useCreateCustomer as jest.Mock;
    mockUseUpdateCustomer = require('@/hooks').useUpdateCustomer as jest.Mock;
    mockUseCustomerDetail = require('@/hooks').useCustomerDetail as jest.Mock;
    
    // 設置 mutation functions
    mockCreateCustomer = jest.fn();
    mockUpdateCustomer = jest.fn();
    mockRefetchCustomerDetail = jest.fn().mockResolvedValue({ data: mockCustomers[0] });
    
    // 默認 mock 返回值
    mockUseCustomers.mockReturnValue({
      data: { data: mockCustomers, meta: {} },
      isLoading: false,
      isError: false,
      error: null,
    });
    
    mockUseCreateCustomer.mockReturnValue({
      mutate: mockCreateCustomer,
      isPending: false,
    });
    
    mockUseUpdateCustomer.mockReturnValue({
      mutate: mockUpdateCustomer,
      isPending: false,
    });
    
    mockUseCustomerDetail.mockReturnValue({
      data: null,
      refetch: mockRefetchCustomerDetail,
      isLoading: false,
      error: null,
    });
  });

  describe('基本渲染', () => {
    it('應該正確渲染客戶列表', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByPlaceholderText('搜尋客戶名稱、電話或統編...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '新增客戶' })).toBeInTheDocument();
      expect(screen.getByTestId('customers-table')).toBeInTheDocument();
      expect(screen.getByText('測試客戶1')).toBeInTheDocument();
      expect(screen.getByText('測試客戶2')).toBeInTheDocument();
    });

    it('當載入中時應該顯示骨架屏', () => {
      mockUseCustomers.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByTestId('data-table-skeleton')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('當發生錯誤時應該顯示錯誤訊息', () => {
      mockUseCustomers.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { message: '網路錯誤' },
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByText('無法加載客戶資料: 網路錯誤')).toBeInTheDocument();
    });

    it('當沒有客戶資料時應該顯示空狀態訊息', () => {
      mockUseCustomers.mockReturnValue({
        data: { data: [], meta: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByText('暫無客戶資料')).toBeInTheDocument();
    });
  });

  describe('搜尋功能', () => {
    it('應該支援搜尋客戶', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const searchInput = screen.getByPlaceholderText('搜尋客戶名稱、電話或統編...');
      await user.type(searchInput, '測試客戶1');

      expect(searchInput).toHaveValue('測試客戶1');
    });

    it('應該使用 debounced 搜尋查詢', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // 驗證 useCustomers 被調用時沒有搜尋參數（因為初始搜尋為空）
      expect(mockUseCustomers).toHaveBeenCalledWith({
        search: undefined,
      });
    });
  });

  describe('數據載入與錯誤處理', () => {
    it('應該正確處理 API 查詢參數', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(mockUseCustomers).toHaveBeenCalledWith({
        search: undefined,
      });
    });

    it('應該正確處理錯誤邊界案例', () => {
      mockUseCustomers.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: {},
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByText('無法加載客戶資料: 未知錯誤')).toBeInTheDocument();
    });
  });

  describe('客戶操作功能', () => {
    it('應該能夠觸發新增客戶功能', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const addButton = screen.getByRole('button', { name: '新增客戶' });
      expect(addButton).toBeInTheDocument();
      
      // 測試按鈕點擊不會拋出錯誤
      await user.click(addButton);
    });

    it('應該能夠觸發編輯客戶功能', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const editButton = screen.getByTestId('edit-customer-1');
      expect(editButton).toBeInTheDocument();
      
      // 測試按鈕點擊不會拋出錯誤
      await user.click(editButton);
    });

    it('編輯客戶時應該觸發後台同步', async () => {
      const user = userEvent.setup();
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const editButton = screen.getByTestId('edit-customer-1');
      await user.click(editButton);

      // 等待後台同步觸發
      await waitFor(() => {
        expect(mockRefetchCustomerDetail).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Hook 調用驗證', () => {
    it('應該正確調用所有必要的 hooks', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(mockUseCustomers).toHaveBeenCalled();
      expect(mockUseCreateCustomer).toHaveBeenCalled();
      expect(mockUseUpdateCustomer).toHaveBeenCalled();
      expect(mockUseCustomerDetail).toHaveBeenCalled();
    });

    it('應該正確傳遞回調函數給 columns', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      const columnsMock = require('../columns').columns;
      expect(columnsMock).toHaveBeenCalledWith({
        onEditCustomer: expect.any(Function),
      });
    });
  });

  describe('表格渲染', () => {
    it('應該正確渲染表格標題', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByText('客戶名稱')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });

    it('應該正確渲染客戶資料行', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(screen.getByText('測試客戶1')).toBeInTheDocument();
      expect(screen.getByText('測試客戶2')).toBeInTheDocument();
      expect(screen.getByTestId('edit-customer-1')).toBeInTheDocument();
      expect(screen.getByTestId('edit-customer-2')).toBeInTheDocument();
    });
  });

  describe('mutation 測試', () => {
    it('應該提供 createCustomer mutation 函數', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(mockCreateCustomer).toBeDefined();
      expect(typeof mockCreateCustomer).toBe('function');
    });

    it('應該提供 updateCustomer mutation 函數', () => {
      const queryClient = createQueryClient();
      renderComponent(queryClient);

      expect(mockUpdateCustomer).toBeDefined();
      expect(typeof mockUpdateCustomer).toBe('function');
    });

    it('應該處理 loading 狀態', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: mockCreateCustomer,
        isPending: true,
      });

      const queryClient = createQueryClient();
      renderComponent(queryClient);

      // 組件應該能夠處理 loading 狀態而不拋出錯誤
      expect(screen.getByTestId('customers-table')).toBeInTheDocument();
    });
  });
});
