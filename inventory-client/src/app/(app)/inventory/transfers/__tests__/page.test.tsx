import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryTransfersPage from '../page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the components and hooks
jest.mock('@/components/inventory/InventoryTransfer', () => ({
  __esModule: true,
  default: () => <div data-testid="inventory-transfer">Inventory Transfer</div>,
}));

describe('InventoryTransfersPage', () => {
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

  it('should render inventory transfers page', () => {
    render(<InventoryTransfersPage />, { wrapper: createWrapper });

    expect(screen.getByTestId('inventory-transfer')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<InventoryTransfersPage />, { wrapper: createWrapper });
    }).not.toThrow();
  });
});