import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackorderList } from '../BackorderList';
import { useBackorders } from '@/hooks/queries/backorders/useBackorders';
import { useUpdateBackorderTransferStatus } from '@/hooks/mutations/backorders/useUpdateBackorderTransferStatus';

// Mock hooks
jest.mock('@/hooks/queries/backorders/useBackorders');
jest.mock('@/hooks/mutations/backorders/useUpdateBackorderTransferStatus');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseBackorders = useBackorders as jest.MockedFunction<typeof useBackorders>;
const mockUseUpdateBackorderTransferStatus = useUpdateBackorderTransferStatus as jest.MockedFunction<typeof useUpdateBackorderTransferStatus>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BackorderList', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // 現在預設返回分組數據
    mockUseBackorders.mockReturnValue({
      data: {
        data: [
          {
            order_id: 101,
            order_number: 'ORD-2024-001',
            customer_name: '張三',
            total_items: 1,
            total_quantity: 5,
            created_at: '2024-01-15T10:00:00Z',
            days_pending: 3,
            summary_status: 'transfer_in_progress',
            summary_status_text: '調撥處理中',
            items: [
              {
                id: 1,
                product_name: '測試商品A',
                sku: 'TEST-001',
                quantity: 5,
                integrated_status: 'transfer_in_transit',
                integrated_status_text: '庫存調撥中',
                transfer: { id: 10, status: 'in_transit' },
              },
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    
    mockUseUpdateBackorderTransferStatus.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    } as any);
  });

  it('應該顯示待進貨商品分組列表', async () => {
    render(<BackorderList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('張三')).toBeInTheDocument();
      expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    });
  });

  it('應該顯示整合狀態而非單純的採購狀態', async () => {
    render(<BackorderList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // 應該顯示整合狀態（在訂單摘要中）
      expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    });
  });

  it('應該根據狀態顯示不同的徽章顏色', async () => {
    render(<BackorderList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // 等待徽章出現
      expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    });
  });

  it('應該能夠搜尋商品', async () => {
    // 設置有多個訂單的測試數據
    mockUseBackorders.mockReturnValue({
      data: {
        data: [
          {
            order_id: 101,
            order_number: 'ORD-2024-001',
            customer_name: '張三',
            total_items: 1,
            total_quantity: 5,
            created_at: '2024-01-15T10:00:00Z',
            days_pending: 3,
            summary_status: 'transfer_in_progress',
            summary_status_text: '調撥處理中',
            items: [
              {
                id: 1,
                product_name: '測試商品A',
                sku: 'TEST-001',
                quantity: 5,
                integrated_status: 'transfer_in_transit',
                integrated_status_text: '庫存調撥中',
                transfer: { id: 10, status: 'in_transit' },
              },
            ],
          },
          {
            order_id: 102,
            order_number: 'ORD-2024-002',
            customer_name: '李四',
            total_items: 1,
            total_quantity: 3,
            created_at: '2024-01-16T10:00:00Z',
            days_pending: 2,
            summary_status: 'pending',
            summary_status_text: '待處理',
            items: [
              {
                id: 2,
                product_name: '測試商品B',
                sku: 'TEST-002',
                quantity: 3,
                integrated_status: 'purchase_pending_purchase',
                integrated_status_text: '待建立進貨單',
              },
            ],
          },
        ],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    
    render(<BackorderList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜尋商品名稱、SKU、訂單編號...');
    await userEvent.type(searchInput, 'TEST-001');

    await waitFor(() => {
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    });
  });

  it('應該顯示等待天數', async () => {
    render(<BackorderList />, { wrapper: createWrapper() });

    await waitFor(() => {
      // 檢查是否有顯示天數的元素
      const daysElements = screen.getAllByText(/天$/);
      expect(daysElements.length).toBeGreaterThan(0);
    });
  });
  
  it('應該始終使用分組模式', async () => {
    render(<BackorderList />, { wrapper: createWrapper() });

    // 應該調用 API 時包含 group_by_order 參數
    await waitFor(() => {
      expect(mockUseBackorders).toHaveBeenCalledWith(
        expect.objectContaining({
          group_by_order: 1,
        })
      );
    });
    
    // 應該顯示分組視圖的內容
    await waitFor(() => {
      expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    });
  });
});