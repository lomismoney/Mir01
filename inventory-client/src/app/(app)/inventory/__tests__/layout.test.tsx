import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryLayout from '../layout';

describe('InventoryLayout', () => {
  it('should render children correctly', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    render(
      <InventoryLayout>
        {testContent}
      </InventoryLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render without crashing when children is null', () => {
    expect(() => {
      render(<InventoryLayout>{null}</InventoryLayout>);
    }).not.toThrow();
  });

  it('should render without crashing when children is undefined', () => {
    expect(() => {
      render(<InventoryLayout>{undefined}</InventoryLayout>);
    }).not.toThrow();
  });
});