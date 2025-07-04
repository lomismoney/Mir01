import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Icons from '../icons';

describe('Icons 組件測試', () => {
  it('應該正確導出基本圖標', () => {
    expect(Icons.ArrowLeft).toBeDefined();
    expect(Icons.ArrowRight).toBeDefined();
    expect(Icons.Calendar).toBeDefined();
    expect(Icons.Check).toBeDefined();
    expect(Icons.Search).toBeDefined();
    expect(Icons.User).toBeDefined();
    expect(Icons.X).toBeDefined();
  });

  it('應該正確導出 UI 相關圖標', () => {
    expect(Icons.ChevronLeft).toBeDefined();
    expect(Icons.ChevronRight).toBeDefined();
    expect(Icons.MoreVertical).toBeDefined();
    expect(Icons.Plus).toBeDefined();
    expect(Icons.Settings).toBeDefined();
    expect(Icons.Loader2).toBeDefined();
  });

  it('應該正確導出主題相關圖標', () => {
    expect(Icons.Moon).toBeDefined();
    expect(Icons.SunMedium).toBeDefined();
    expect(Icons.Laptop).toBeDefined();
  });

  it('應該正確導出文件相關圖標', () => {
    expect(Icons.File).toBeDefined();
    expect(Icons.FileText).toBeDefined();
    expect(Icons.FileDown).toBeDefined();
    expect(Icons.FileUp).toBeDefined();
    expect(Icons.Image).toBeDefined();
  });

  it('應該正確導出庫存相關圖標', () => {
    expect(Icons.Warehouse).toBeDefined();
    expect(Icons.Package).toBeDefined();
    expect(Icons.Truck).toBeDefined();
    expect(Icons.Box).toBeDefined();
  });

  it('應該正確導出動作圖標', () => {
    expect(Icons.Pencil).toBeDefined();
    expect(Icons.Save).toBeDefined();
    expect(Icons.Trash).toBeDefined();
    expect(Icons.RefreshIcon).toBeDefined();
    expect(Icons.MinusIcon).toBeDefined();
    expect(Icons.Eye).toBeDefined();
  });

  it('應該正確導出狀態圖標', () => {
    expect(Icons.PlusCircle).toBeDefined();
    expect(Icons.CheckCircle).toBeDefined();
    expect(Icons.XCircle).toBeDefined();
    expect(Icons.AlertTriangle).toBeDefined();
    expect(Icons.HelpCircle).toBeDefined();
  });

  it('應該正確導出其他實用圖標', () => {
    expect(Icons.Clock).toBeDefined();
    expect(Icons.CreditCard).toBeDefined();
    expect(Icons.ArrowUpDown).toBeDefined();
    expect(Icons.Filter).toBeDefined();
  });

  it('應該能夠渲染圖標組件', () => {
    const { Search, User, Settings } = Icons;
    
    render(
      <div>
        <Search data-testid="search-icon" />
        <User data-testid="user-icon" />
        <Settings data-testid="settings-icon" />
      </div>
    );
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('應該渲染為 SVG 元素', () => {
    const { Check } = Icons;
    
    render(<Check data-testid="check-icon" />);
    
    const icon = screen.getByTestId('check-icon');
    expect(icon.tagName).toBe('svg');
  });

  it('應該支援自定義屬性', () => {
    const { Plus } = Icons;
    
    render(
      <Plus 
        data-testid="plus-icon" 
        className="custom-class" 
        size={32}
      />
    );
    
    const icon = screen.getByTestId('plus-icon');
    expect(icon).toHaveClass('custom-class');
    expect(icon).toHaveAttribute('width', '32');
    expect(icon).toHaveAttribute('height', '32');
  });

  it('應該確保所有庫存系統圖標都可用', () => {
    const inventoryIcons = [
      'Warehouse', 'Package', 'Truck', 'Box', 'ArrowUpDown', 
      'Filter', 'Search', 'Plus', 'Pencil', 'Trash', 'Save',
      'RefreshIcon', 'Eye', 'CheckCircle', 'XCircle'
    ] as const;
    
    inventoryIcons.forEach(iconName => {
      expect(Icons[iconName]).toBeDefined();
      expect(typeof Icons[iconName]).toBe('object'); // React component is object
    });
  });
}); 