import React from 'react';
import { render, screen } from '@testing-library/react';
import PurchasesLayout from '../layout';

describe('PurchasesLayout', () => {
  it('should render children without modification', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    render(
      <PurchasesLayout>
        {testContent}
      </PurchasesLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <PurchasesLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </PurchasesLayout>
    );
    
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should render without crashing when children is null', () => {
    expect(() => {
      render(<PurchasesLayout>{null}</PurchasesLayout>);
    }).not.toThrow();
  });
});