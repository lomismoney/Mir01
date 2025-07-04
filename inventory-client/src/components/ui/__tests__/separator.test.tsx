import React from 'react';
import { render, screen } from '@testing-library/react';
import { Separator } from '../separator';

describe('Separator 組件測試', () => {
  it('應該正確渲染水平分隔線', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveAttribute('data-slot', 'separator');
  });

  it('應該正確渲染垂直分隔線', () => {
    render(<Separator orientation="vertical" data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
    expect(separator).toHaveAttribute('data-slot', 'separator');
  });

  it('應該設定正確的預設屬性', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    expect(separator).toHaveAttribute('role', 'none');
  });

  it('應該支援自定義 className', () => {
    render(
      <Separator 
        className="custom-separator-class" 
        data-testid="separator" 
      />
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('custom-separator-class');
  });

  it('應該支援 decorative 屬性', () => {
    render(
      <Separator 
        decorative={false} 
        data-testid="separator" 
      />
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
  });

  it('應該包含必要的樣式類別', () => {
    render(<Separator data-testid="separator" />);
    
    const separator = screen.getByTestId('separator');
    expect(separator).toHaveClass('shrink-0');
  });

  it('應該根據 orientation 包含正確的樣式', () => {
    const { rerender } = render(<Separator data-testid="separator" />);
    
    let separator = screen.getByTestId('separator');
    // 水平分隔線應該有 data-[orientation=horizontal] 相關樣式
    expect(separator).toHaveAttribute('data-orientation', 'horizontal');
    
    rerender(<Separator orientation="vertical" data-testid="separator" />);
    
    separator = screen.getByTestId('separator');
    // 垂直分隔線應該有 data-[orientation=vertical] 相關樣式
    expect(separator).toHaveAttribute('data-orientation', 'vertical');
  });
}); 