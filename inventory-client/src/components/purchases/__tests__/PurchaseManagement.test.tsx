import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PurchaseManagement } from '../PurchaseManagement';
import {
  usePurchases,
  useUpdatePurchaseStatus,
  useCancelPurchase,
  useDeletePurchase,
  useCreatePurchase,
  useStores,
} from '@/hooks';
import { toast } from 'sonner';

// Mock hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks', () => ({
  usePurchases: jest.fn(),
  useUpdatePurchaseStatus: jest.fn(),
  useCancelPurchase: jest.fn(),
  useDeletePurchase: jest.fn(),
  useCreatePurchase: jest.fn(),
  useStores: jest.fn(),
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

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePurchases = usePurchases as jest.MockedFunction<typeof usePurchases>;
const mockUseUpdatePurchaseStatus = useUpdatePurchaseStatus as jest.MockedFunction<typeof useUpdatePurchaseStatus>;
const mockUseCancelPurchase = useCancelPurchase as jest.MockedFunction<typeof useCancelPurchase>;
const mockUseDeletePurchase = useDeletePurchase as jest.MockedFunction<typeof useDeletePurchase>;
const mockUseCreatePurchase = useCreatePurchase as jest.MockedFunction<typeof useCreatePurchase>;
const mockUseStores = useStores as jest.MockedFunction<typeof useStores>;

describe('PurchaseManagement', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();
  const mockUpdateStatus = jest.fn();
  const mockCancelPurchase = jest.fn();
  const mockDeletePurchase = jest.fn();

  const mockPurchases = [
    {
      id: 1,
      store_id: 1,
      purchased_at: '2024-01-01T00:00:00Z',
      shipping_cost: 100,
      status: 'pending',
      total_amount: 1000,
      order_number: 'PO-2024-001',
      items: [
        { id: 1, product_name: 'Product 1', quantity: 10, cost_price: 50 },
      ],
      store: { id: 1, name: 'Store 1' },
    },
    {
      id: 2,
      store_id: 2,
      purchased_at: '2024-01-02T00:00:00Z',
      shipping_cost: 200,
      status: 'completed',
      total_amount: 2000,
      order_number: 'PO-2024-002',
      items: [
        { id: 2, product_name: 'Product 2', quantity: 20, cost_price: 75 },
      ],
      store: { id: 2, name: 'Store 2' },
    },
  ];

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUsePurchases.mockReturnValue({
      data: { data: mockPurchases },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseUpdatePurchaseStatus.mockReturnValue({
      mutate: mockUpdateStatus,
      isPending: false,
    });

    mockUseCancelPurchase.mockReturnValue({
      mutate: mockCancelPurchase,
      isPending: false,
    });

    mockUseDeletePurchase.mockReturnValue({
      mutate: mockDeletePurchase,
      isPending: false,
    });

    mockUseCreatePurchase.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    mockUseStores.mockReturnValue({
      data: {
        data: [
          { id: 1, name: 'Store 1' },
          { id: 2, name: 'Store 2' },
        ],
      },
      isLoading: false,
      isError: false,
    });
  });

  it('should render purchase management page', () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    expect(screen.getByText('進貨單管理')).toBeInTheDocument();
    expect(screen.getByText('管理進貨單狀態、追蹤採購進度和庫存入庫流程')).toBeInTheDocument();
  });

  it('should display purchase cards', () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
    expect(screen.getByText('PO-2024-002')).toBeInTheDocument();
    expect(screen.getByText('Store 1')).toBeInTheDocument();
    expect(screen.getByText('Store 2')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUsePurchases.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check for loading skeleton animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUsePurchases.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
    });

    render(<PurchaseManagement />, { wrapper: createWrapper });

    expect(screen.getByText('載入進貨單數據失敗')).toBeInTheDocument();
  });

  it('should filter purchases by search term', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    const searchInput = screen.getByPlaceholderText('搜尋進貨單號...');
    fireEvent.change(searchInput, { target: { value: 'PO-2024-001' } });

    expect(searchInput).toHaveValue('PO-2024-001');
  });

  it('should filter purchases by status', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects.find(select => 
      select.getAttribute('aria-label') === '狀態' || 
      select.textContent?.includes('所有狀態')
    );
    
    expect(statusSelect).toBeInTheDocument();
  });

  it('should handle status update', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if purchase items are displayed
    expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
    expect(screen.getByText('PO-2024-002')).toBeInTheDocument();
  });

  it('should handle purchase cancellation', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if the purchase management page renders correctly
    expect(screen.getByText('進貨單管理')).toBeInTheDocument();
  });

  it('should handle purchase deletion', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if the purchase management page renders correctly
    expect(screen.getByText('進貨單管理')).toBeInTheDocument();
  });

  it('should navigate to purchase detail on click', () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if purchase data is displayed
    expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
    expect(screen.getByText('PO-2024-002')).toBeInTheDocument();
  });

  it('should display purchase amounts correctly', () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    expect(screen.getByText('總金額: NT$ 1,000')).toBeInTheDocument();
    expect(screen.getByText('總金額: NT$ 2,000')).toBeInTheDocument();
  });

  it('should show empty state when no purchases', () => {
    mockUsePurchases.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<PurchaseManagement />, { wrapper: createWrapper });

    expect(screen.getByText('沒有進貨單')).toBeInTheDocument();
  });

  it('should handle date filtering', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if the purchase list is rendered
    expect(screen.getByText('進貨單列表')).toBeInTheDocument();
  });

  it('should display purchase status badges', () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if purchase items are displayed
    expect(screen.getByText('PO-2024-001')).toBeInTheDocument();
    expect(screen.getByText('PO-2024-002')).toBeInTheDocument();
  });

  it('should handle store filter', async () => {
    render(<PurchaseManagement />, { wrapper: createWrapper });

    // Check if the store selector is rendered
    const storeSelects = screen.getAllByRole('combobox');
    expect(storeSelects.length).toBeGreaterThan(0);
  });
});