import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';
import { useProductVariants } from '@/hooks';

// Mock components
jest.mock('@/components/section-cards', () => ({
  SectionCards: () => <div data-testid="section-cards">Section Cards</div>
}));

jest.mock('@/components/backorders/BackorderAlert', () => ({
  BackorderAlert: () => <div data-testid="backorder-alert">Backorder Alert</div>
}));

jest.mock('@/components/inventory/InventoryAlert', () => ({
  InventoryAlert: () => <div data-testid="inventory-alert">Inventory Alert</div>
}));

jest.mock('@/components/chart-area-interactive', () => ({
  ChartAreaInteractive: ({ productVariantId }: { productVariantId: number | null }) => (
    <div data-testid="chart-area" data-product-variant-id={productVariantId}>
      Chart Area Interactive
    </div>
  )
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <button onClick={() => onValueChange('1')} data-testid="select-item-1">Select Item 1</button>
      <button onClick={() => onValueChange('2')} data-testid="select-item-2">Select Item 2</button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

// Mock hooks
jest.mock('@/hooks');

// Helper function to create QueryClient wrapper
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

describe('DashboardPage', () => {
  const mockProductVariants = [
    {
      id: 1,
      sku: 'SKU001',
      price: 100,
      product_id: 1,
      product: {
        id: 1,
        name: 'Product 1',
        description: 'Description 1'
      },
      attribute_values: [
        {
          id: 1,
          value: 'Red',
          attribute_id: 1,
          attribute: {
            id: 1,
            name: 'Color'
          }
        }
      ]
    },
    {
      id: 2,
      sku: 'SKU002',
      price: 200,
      product_id: 2,
      product: {
        id: 2,
        name: 'Product 2',
        description: null
      },
      attribute_values: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useProductVariants as jest.Mock).mockReturnValue({
      data: mockProductVariants,
      isLoading: false,
      isSuccess: true,
      error: null
    });
  });

  it('should render dashboard page with all components', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    // Check section cards
    expect(screen.getByTestId('section-cards')).toBeInTheDocument();

    // Check card structure
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByText('庫存趨勢分析')).toBeInTheDocument();

    // Check select component
    expect(screen.getByTestId('select')).toBeInTheDocument();
    expect(screen.getByText('選擇商品查看庫存趨勢')).toBeInTheDocument();

    // Check chart area
    expect(screen.getByTestId('chart-area')).toBeInTheDocument();
  });

  it('should display loading state when loading variants', () => {
    (useProductVariants as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isSuccess: false,
      error: null
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('select-value')).toHaveTextContent('載入商品中...');
  });

  it('should display placeholder when not loading', () => {
    (useProductVariants as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      error: null
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('select-value')).toHaveTextContent('請選擇商品');
  });

  it('should render product variants in select', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    // Check if variants are rendered
    const selectContent = screen.getByTestId('select-content');
    expect(selectContent).toBeInTheDocument();

    // Verify variant rendering logic through text content
    expect(screen.getByText(/Product 1 - SKU001/)).toBeInTheDocument();
    expect(screen.getByText(/Product 2 - SKU002/)).toBeInTheDocument();
    expect(screen.getByText(/Red/)).toBeInTheDocument();
  });

  it('should handle product variant selection', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    // Initial state - no selection
    const chartArea = screen.getByTestId('chart-area');
    // 當值為 null 時，屬性不存在
    expect(chartArea).not.toHaveAttribute('data-product-variant-id');

    // Select a product variant - get all buttons and select the last one
    const selectButtons = screen.getAllByTestId('select-item-1');
    fireEvent.click(selectButtons[selectButtons.length - 1]);

    await waitFor(() => {
      const updatedChartArea = screen.getByTestId('chart-area');
      expect(updatedChartArea).toHaveAttribute('data-product-variant-id', '1');
    });
  });

  it('should handle selection of second product variant', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    // Select second product variant - get all buttons and select the last one
    const selectButtons = screen.getAllByTestId('select-item-2');
    fireEvent.click(selectButtons[selectButtons.length - 1]);

    await waitFor(() => {
      const chartArea = screen.getByTestId('chart-area');
      expect(chartArea).toHaveAttribute('data-product-variant-id', '2');
    });
  });

  it('should handle empty product variants', () => {
    (useProductVariants as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isSuccess: true,
      error: null
    });

    render(<DashboardPage />, { wrapper: createWrapper() });

    // Should still render without errors
    expect(screen.getByTestId('section-cards')).toBeInTheDocument();
    expect(screen.getByTestId('chart-area')).toBeInTheDocument();
  });

  it('should pass correct props to useProductVariants', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(useProductVariants).toHaveBeenCalledWith({
      per_page: 100
    });
  });
});