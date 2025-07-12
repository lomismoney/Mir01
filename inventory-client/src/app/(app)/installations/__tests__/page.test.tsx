import React from 'react';
import { render, screen } from '@testing-library/react';
import InstallationsPage from '../page';

// Mock the InstallationClientComponent
jest.mock('@/components/installations/InstallationClientComponent', () => ({
  InstallationClientComponent: () => <div data-testid="installation-client-component">Installation Client Component</div>,
}));

describe('InstallationsPage', () => {
  it('should render installations page with title and description', () => {
    render(<InstallationsPage />);
    
    expect(screen.getByText('安裝管理')).toBeInTheDocument();
    expect(screen.getByText('管理您的所有安裝單、分配安裝師傅、追蹤安裝進度與狀態。')).toBeInTheDocument();
  });

  it('should render InstallationClientComponent', () => {
    render(<InstallationsPage />);
    
    expect(screen.getByTestId('installation-client-component')).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<InstallationsPage />);
    
    // Check if the main container has the correct class
    const mainContainer = container.querySelector('.space-y-6');
    expect(mainContainer).toBeInTheDocument();
    
    // Check if the title section exists
    const titleElement = screen.getByText('安裝管理');
    expect(titleElement).toHaveClass('text-2xl', 'font-bold');
    
    // Check if the description has correct styling
    const descriptionElement = screen.getByText('管理您的所有安裝單、分配安裝師傅、追蹤安裝進度與狀態。');
    expect(descriptionElement).toHaveClass('text-muted-foreground');
  });
});