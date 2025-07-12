import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryManagementPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the components and hooks
jest.mock('@/components/inventory/InventoryManagement', () => ({
  InventoryManagement: () => <div data-testid="inventory-management">Inventory Management</div>,
}));

describe('InventoryManagementPage', () => {
  let queryClient: QueryClient;

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
  });

  it('should render inventory management page', () => {
    render(<InventoryManagementPage />, { wrapper: createWrapper });

    expect(screen.getByTestId('inventory-management')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<InventoryManagementPage />, { wrapper: createWrapper });
    }).not.toThrow();
  });
});