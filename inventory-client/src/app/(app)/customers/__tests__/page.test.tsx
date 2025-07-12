import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomersPage from '../page';

// Mock the CustomerClientComponent
jest.mock('@/components/customers/CustomerClientComponent', () => ({
  CustomerClientComponent: () => <div data-testid="customer-client-component">Customer Client Component</div>,
}));

describe('CustomersPage', () => {
  it('should render customers page with title and description', () => {
    render(<CustomersPage />);
    
    expect(screen.getByText('客戶管理')).toBeInTheDocument();
    expect(screen.getByText('管理您的所有客戶資料、地址與訂單歷史。')).toBeInTheDocument();
  });

  it('should render CustomerClientComponent', () => {
    render(<CustomersPage />);
    
    expect(screen.getByTestId('customer-client-component')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<CustomersPage />);
    
    // Check if the main container has the correct class
    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
    
    // Check if the title section exists
    const titleElement = screen.getByText('客戶管理');
    expect(titleElement).toHaveClass('text-2xl', 'font-bold');
    
    // Check if the description has correct styling
    const descriptionElement = screen.getByText('管理您的所有客戶資料、地址與訂單歷史。');
    expect(descriptionElement).toHaveClass('text-muted-foreground');
  });
});