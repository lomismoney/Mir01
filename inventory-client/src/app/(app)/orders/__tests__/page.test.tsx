import React from 'react';
import { render, screen } from '@testing-library/react';
import OrdersPage from '../page';

// Mock the OrderClientComponent
jest.mock('@/components/orders/OrderClientComponent', () => ({
  OrderClientComponent: () => <div data-testid="order-client-component">Order Client Component</div>,
}));

describe('OrdersPage', () => {
  it('should render orders page with title and description', () => {
    render(<OrdersPage />);
    
    expect(screen.getByText('訂單管理')).toBeInTheDocument();
    expect(screen.getByText('管理您的所有銷售訂單、追蹤出貨與付款狀態。')).toBeInTheDocument();
  });

  it('should render OrderClientComponent', () => {
    render(<OrdersPage />);
    
    expect(screen.getByTestId('order-client-component')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<OrdersPage />);
    
    // Check if the main container has the correct class
    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
    
    // Check if the title section exists
    const titleElement = screen.getByText('訂單管理');
    expect(titleElement).toHaveClass('text-2xl', 'font-bold');
    
    // Check if the description has correct styling
    const descriptionElement = screen.getByText('管理您的所有銷售訂單、追蹤出貨與付款狀態。');
    expect(descriptionElement).toHaveClass('text-muted-foreground');
  });
});