import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryIncomingPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the components and hooks
jest.mock('@/components/purchases/PurchaseManagement', () => ({
  PurchaseManagement: () => <div data-testid="purchase-management">Purchase Management</div>,
}));

describe('InventoryIncomingPage', () => {
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

  it('should render incoming management page', () => {
    render(<InventoryIncomingPage />, { wrapper: createWrapper });

    expect(screen.getByTestId('purchase-management')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<InventoryIncomingPage />, { wrapper: createWrapper });
    }).not.toThrow();
  });
});