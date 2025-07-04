import React from 'react';
import { render, screen } from '@testing-library/react';
import { Progress } from '../progress';

describe('Progress 組件測試', () => {
  it('應該正確渲染 Progress 組件', () => {
    render(<Progress value={50} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveClass('relative', 'h-2', 'w-full', 'overflow-hidden', 'rounded-full');
    expect(progress).toHaveAttribute('data-slot', 'progress');
  });

  it('應該顯示正確的進度值', () => {
    render(<Progress value={75} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveStyle('transform: translateX(-25%)');
  });

  it('應該處理 0% 進度', () => {
    render(<Progress value={0} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('應該處理 100% 進度', () => {
    render(<Progress value={100} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    
    expect(indicator).toHaveStyle('transform: translateX(-0%)');
  });

  it('應該處理未定義的 value', () => {
    render(<Progress data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    
    // 當 value 未定義時，應該默認為 0
    expect(indicator).toHaveStyle('transform: translateX(-100%)');
  });

  it('應該支援自定義 className', () => {
    render(
      <Progress 
        value={50} 
        className="custom-progress-class" 
        data-testid="progress" 
      />
    );
    
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveClass('custom-progress-class');
  });

  it('應該包含正確的 data slot', () => {
    render(<Progress value={50} data-testid="progress" />);
    
    const progress = screen.getByTestId('progress');
    expect(progress).toHaveAttribute('data-slot', 'progress');
    
    const indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveAttribute('data-slot', 'progress-indicator');
  });

  it('應該正確處理不同的進度值', () => {
    const { rerender } = render(<Progress value={25} data-testid="progress" />);
    
    let progress = screen.getByTestId('progress');
    let indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle('transform: translateX(-75%)');
    
    rerender(<Progress value={80} data-testid="progress" />);
    
    progress = screen.getByTestId('progress');
    indicator = progress.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveStyle('transform: translateX(-20%)');
  });
}); 