import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge 組件測試', () => {
  it('應該正確渲染 Badge 組件', () => {
    render(<Badge data-testid="badge">測試徽章</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('測試徽章');
  });

  it('應該具有正確的基本樣式', () => {
    render(<Badge data-testid="badge">徽章</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    );
  });

  it('應該支援不同的變體', () => {
    const { rerender } = render(
      <Badge variant="default" data-testid="badge">
        預設徽章
      </Badge>
    );
    
    let badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('border-transparent', 'bg-primary', 'text-primary-foreground');
    
    rerender(
      <Badge variant="secondary" data-testid="badge">
        次要徽章
      </Badge>
    );
    
    badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('border-transparent', 'bg-secondary', 'text-secondary-foreground');
    
    rerender(
      <Badge variant="destructive" data-testid="badge">
        危險徽章
      </Badge>
    );
    
    badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('border-transparent', 'bg-destructive', 'text-destructive-foreground');
    
    rerender(
      <Badge variant="outline" data-testid="badge">
        外框徽章
      </Badge>
    );
    
    badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('border-transparent');
  });

  it('應該支援自定義 className', () => {
    render(
      <Badge className="custom-badge" data-testid="badge">
        自定義徽章
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('應該正確處理複雜內容', () => {
    render(
      <Badge data-testid="badge">
        <span>計數: </span>
        <strong>42</strong>
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('計數:')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('應該支援數字內容', () => {
    render(<Badge data-testid="badge">{99}</Badge>);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('99');
  });

  it('應該正確處理空內容', () => {
    render(<Badge data-testid="badge" />);
    
    const badge = screen.getByTestId('badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toBeEmptyDOMElement();
  });

  it('應該支援所有 HTML div 屬性', () => {
    render(
      <Badge 
        data-testid="badge"
        id="test-badge"
        role="status"
        aria-label="通知徽章"
        onClick={() => {}}
      >
        可點擊徽章
      </Badge>
    );
    
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('id', 'test-badge');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-label', '通知徽章');
  });

  it('應該組合多個徽章', () => {
    render(
      <div data-testid="badge-group">
        <Badge variant="default">主要</Badge>
        <Badge variant="secondary">次要</Badge>
        <Badge variant="destructive">警告</Badge>
        <Badge variant="outline">外框</Badge>
      </div>
    );
    
    const group = screen.getByTestId('badge-group');
    expect(group).toBeInTheDocument();
    
    expect(screen.getByText('主要')).toBeInTheDocument();
    expect(screen.getByText('次要')).toBeInTheDocument();
    expect(screen.getByText('警告')).toBeInTheDocument();
    expect(screen.getByText('外框')).toBeInTheDocument();
  });
}); 