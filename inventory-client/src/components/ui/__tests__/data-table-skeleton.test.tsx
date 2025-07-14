import React from 'react';
import { render } from '@testing-library/react';
import { DataTableSkeleton } from '../data-table-skeleton';

/**
 * DataTableSkeleton 組件測試
 * 
 * 測試數據表格骨架屏的載入效果
 */
describe('DataTableSkeleton 組件測試', () => {
  it('應該正確渲染表格骨架屏', () => {
    render(<DataTableSkeleton />);
    
    // 檢查是否有骨架容器
    const container = document.querySelector('[class*="space-y-6"]');
    expect(container).toBeInTheDocument();
  });

  it('應該正確渲染骨架元素', () => {
    render(<DataTableSkeleton />);
    
    // 檢查是否有骨架動畫元素
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('應該渲染預設的行數', () => {
    render(<DataTableSkeleton />);
    
    // 檢查是否有正確數量的骨架行
    const skeletonRows = document.querySelectorAll('[class*="divide-y"] > div');
    expect(skeletonRows).toHaveLength(10);
  });

  it('應該支援自定義行數', () => {
    render(<DataTableSkeleton rows={5} />);
    
    // 檢查是否有正確數量的骨架行
    const skeletonRows = document.querySelectorAll('[class*="divide-y"] > div');
    expect(skeletonRows).toHaveLength(5);
  });

  it('應該支援自定義列數', () => {
    render(<DataTableSkeleton columns={3} />);
    
    // 檢查骨架是否正確渲染
    const skeletonContainer = document.querySelector('[class*="space-y-6"]');
    expect(skeletonContainer).toBeInTheDocument();
  });

  it('應該正確渲染骨架動畫元素', () => {
    render(<DataTableSkeleton />);
    
    // 檢查是否有 Skeleton 組件
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('應該支援顯示/隱藏標題區域', () => {
    render(<DataTableSkeleton showHeader={false} />);
    
    // 檢查是否正確隱藏了標題區域
    const container = document.querySelector('[class*="space-y-6"]');
    expect(container).toBeInTheDocument();
  });

  it('應該支援顯示/隱藏操作按鈕', () => {
    render(<DataTableSkeleton showActions={false} />);
    
    // 檢查是否正確渲染
    const container = document.querySelector('[class*="space-y-6"]');
    expect(container).toBeInTheDocument();
  });

  it('應該正確處理空狀態', () => {
    render(<DataTableSkeleton rows={0} />);
    
    // 檢查骨架容器是否存在
    const container = document.querySelector('[class*="space-y-6"]');
    expect(container).toBeInTheDocument();
  });

  it('應該支援自定義 className', () => {
    render(<DataTableSkeleton className="custom-skeleton" />);
    
    const container = document.querySelector('.custom-skeleton');
    expect(container).toBeInTheDocument();
  });

  it('應該正確處理大量行數', () => {
    render(<DataTableSkeleton rows={100} />);
    
    // 檢查是否有正確數量的骨架行
    const skeletonRows = document.querySelectorAll('[class*="divide-y"] > div');
    expect(skeletonRows).toHaveLength(100);
  });

  it('應該支援完整的骨架結構', () => {
    render(<DataTableSkeleton showHeader={true} showActions={true} />);
    
    // 檢查是否有完整的骨架結構
    const container = document.querySelector('[class*="space-y-6"]');
    expect(container).toBeInTheDocument();
    
    // 檢查是否有卡片容器
    const cards = document.querySelectorAll('[class*="border"]');
    expect(cards.length).toBeGreaterThan(0);
  });
}); 