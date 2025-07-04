import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../skeleton';

describe('Skeleton 組件測試', () => {
  it('應該正確渲染 Skeleton 組件', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('應該具有正確的基本樣式', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass(
      'animate-pulse',
      'rounded-md',
      'bg-accent'
    );
  });

  it('應該支援自定義 className', () => {
    render(
      <Skeleton 
        className="custom-skeleton w-full h-4" 
        data-testid="skeleton" 
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton', 'w-full', 'h-4');
  });

  it('應該渲染為 div 元素', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.tagName).toBe('DIV');
  });

  it('應該支援不同的尺寸', () => {
    render(
      <div>
        <Skeleton className="h-4 w-[250px]" data-testid="skeleton-small" />
        <Skeleton className="h-8 w-[300px]" data-testid="skeleton-medium" />
        <Skeleton className="h-12 w-[400px]" data-testid="skeleton-large" />
      </div>
    );
    
    expect(screen.getByTestId('skeleton-small')).toHaveClass('h-4', 'w-[250px]');
    expect(screen.getByTestId('skeleton-medium')).toHaveClass('h-8', 'w-[300px]');
    expect(screen.getByTestId('skeleton-large')).toHaveClass('h-12', 'w-[400px]');
  });

  it('應該支援圓形 skeleton', () => {
    render(
      <Skeleton 
        className="h-12 w-12 rounded-full" 
        data-testid="skeleton-circle" 
      />
    );
    
    const skeleton = screen.getByTestId('skeleton-circle');
    expect(skeleton).toHaveClass('h-12', 'w-12', 'rounded-full');
  });

  it('應該正確處理多個 skeleton 組合', () => {
    render(
      <div className="flex items-center space-x-4" data-testid="skeleton-group">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
    
    const group = screen.getByTestId('skeleton-group');
    expect(group).toBeInTheDocument();
    
    const skeletons = group.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
  });

  it('應該支援其他 HTML 屬性', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        id="test-skeleton"
        role="presentation"
        aria-label="正在載入"
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'test-skeleton');
    expect(skeleton).toHaveAttribute('role', 'presentation');
    expect(skeleton).toHaveAttribute('aria-label', '正在載入');
  });

  it('應該正確處理卡片 skeleton 佈局', () => {
    render(
      <div className="flex flex-col space-y-3" data-testid="card-skeleton">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
    
    const cardSkeleton = screen.getByTestId('card-skeleton');
    expect(cardSkeleton).toBeInTheDocument();
    
    const skeletons = cardSkeleton.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
    
    // 檢查第一個是圖片 skeleton
    expect(skeletons[0]).toHaveClass('h-[125px]', 'w-[250px]', 'rounded-xl');
  });

  it('應該正確處理表格 skeleton', () => {
    render(
      <div className="space-y-2" data-testid="table-skeleton">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
    
    const tableSkeleton = screen.getByTestId('table-skeleton');
    expect(tableSkeleton).toBeInTheDocument();
    
    const skeletons = tableSkeleton.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(12); // 3 rows × 4 columns
  });
});
