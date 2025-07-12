import React from 'react';
import { render, screen } from '@testing-library/react';
import PurchasesPage from '../page';

// Mock the PurchaseManagement component
jest.mock('@/components/purchases/PurchaseManagement', () => ({
  PurchaseManagement: () => <div data-testid="purchase-management">Purchase Management</div>,
}));

describe('PurchasesPage', () => {
  it('should render purchases page with PurchaseManagement component', () => {
    render(<PurchasesPage />);
    
    expect(screen.getByTestId('purchase-management')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<PurchasesPage />);
    
    // Check if the main container has the correct classes
    const mainContainer = container.querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('mx-auto', 'p-4', 'md:p-8');
  });

  it('should render without crashing', () => {
    expect(() => render(<PurchasesPage />)).not.toThrow();
  });
});