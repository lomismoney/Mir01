import React from 'react';
import { render, screen } from '@testing-library/react';
import { IconSettings, IconHelp, IconSearch } from '@tabler/icons-react';
import { NavSecondary } from '../nav-secondary';
import { SidebarProvider } from '@/components/ui/sidebar';

/**
 * NavSecondary 組件測試套件
 * 
 * 測試覆蓋範圍：
 * 1. 基本渲染功能
 * 2. 導航項目顯示
 * 3. 圖標和文字渲染
 * 4. 鏈接屬性驗證
 * 5. 額外屬性傳遞
 */
describe('NavSecondary', () => {
  // 模擬導航項目數據
  const mockItems = [
    {
      title: '系統設定',
      url: '/settings',
      icon: IconSettings,
    },
    {
      title: '幫助中心',
      url: '/help',
      icon: IconHelp,
    },
    {
      title: '搜尋',
      url: '/search',
      icon: IconSearch,
    },
  ];

  // 輔助函數：包裝組件以提供必要的 context
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <SidebarProvider>
        {component}
      </SidebarProvider>
    );
  };

  /**
   * 測試基本渲染功能
   * 驗證組件能夠正常渲染而不出錯
   */
  it('應該正確渲染導航組件', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查所有導航項目是否正確顯示
    expect(screen.getByText('系統設定')).toBeInTheDocument();
    expect(screen.getByText('幫助中心')).toBeInTheDocument();
    expect(screen.getByText('搜尋')).toBeInTheDocument();
  });

  /**
   * 測試鏈接屬性
   * 驗證每個導航項目的鏈接是否正確設置
   */
  it('應該正確設置鏈接屬性', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查鏈接的 href 屬性
    const settingsLink = screen.getByRole('link', { name: /系統設定/i });
    const helpLink = screen.getByRole('link', { name: /幫助中心/i });
    const searchLink = screen.getByRole('link', { name: /搜尋/i });
    
    expect(settingsLink).toHaveAttribute('href', '/settings');
    expect(helpLink).toHaveAttribute('href', '/help');
    expect(searchLink).toHaveAttribute('href', '/search');
  });

  /**
   * 測試預取功能
   * 驗證鏈接是否正確渲染
   */
  it('應該正確渲染鏈接', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    const links = screen.getAllByRole('link');
    
    // 檢查所有鏈接都正確渲染
    expect(links).toHaveLength(mockItems.length);
  });

  /**
   * 測試空項目列表
   * 驗證當沒有導航項目時組件的行為
   */
  it('應該能夠處理空的項目列表', () => {
    renderWithProvider(<NavSecondary items={[]} />);
    
    // 檢查是否仍然渲染了基本結構
    const menuContainer = document.querySelector('[data-sidebar="menu"]');
    expect(menuContainer).toBeInTheDocument();
    
    // 但沒有導航項目
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
  });

  /**
   * 測試額外屬性傳遞
   * 驗證組件能夠接收並正確應用額外的屬性
   */
  it('應該正確傳遞額外的屬性', () => {
    const testId = 'nav-secondary-test';
    const customClassName = 'custom-nav-class';
    
    renderWithProvider(
      <NavSecondary 
        items={mockItems} 
        data-testid={testId}
        className={customClassName}
      />
    );
    
    const navGroup = screen.getByTestId(testId);
    expect(navGroup).toBeInTheDocument();
    expect(navGroup).toHaveClass(customClassName);
  });

  /**
   * 測試圖標渲染
   * 驗證每個導航項目的圖標是否正確顯示
   */
  it('應該正確渲染圖標', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查是否有正確數量的圖標
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(mockItems.length);
  });

  /**
   * 測試單個項目
   * 驗證只有一個導航項目時的行為
   */
  it('應該能夠處理單個導航項目', () => {
    const singleItem = [mockItems[0]];
    
    renderWithProvider(<NavSecondary items={singleItem} />);
    
    expect(screen.getByText('系統設定')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /系統設定/i })).toHaveAttribute('href', '/settings');
    
    // 確保沒有其他項目
    expect(screen.queryByText('幫助中心')).not.toBeInTheDocument();
    expect(screen.queryByText('搜尋')).not.toBeInTheDocument();
  });

  /**
   * 測試 data-testid 屬性
   * 驗證組件是否包含正確的追蹤屬性
   */
  it('應該包含追蹤屬性', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查是否有 data-testid 屬性（用於追蹤）
    const elementsWithOid = document.querySelectorAll('[data-testid]');
    expect(elementsWithOid.length).toBeGreaterThan(0);
  });

  /**
   * 測試可訪問性
   * 驗證組件的可訪問性屬性
   */
  it('應該具備良好的可訪問性', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查所有鏈接是否可以通過鍵盤導航
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toBeVisible();
      expect(link).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  /**
   * 測試結構完整性
   * 驗證組件的 DOM 結構是否符合設計要求
   */
  it('應該具有正確的 DOM 結構', () => {
    renderWithProvider(<NavSecondary items={mockItems} />);
    
    // 檢查基本結構
    const menuContainer = document.querySelector('[data-sidebar="menu"]');
    expect(menuContainer).toBeInTheDocument();
    
    // 檢查菜單項目數量
    const menuItems = screen.getAllByRole('link');
    expect(menuItems).toHaveLength(mockItems.length);
  });
}); 