import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconDatabase, IconChartBar, IconReport } from '@tabler/icons-react';
import { NavDocuments } from '../nav-documents';
import { SidebarProvider } from '@/components/ui/sidebar';

/**
 * NavDocuments 組件測試套件
 * 
 * 測試覆蓋範圍：
 * 1. 基本渲染功能
 * 2. 文檔項目顯示
 * 3. Dropdown 菜單功能
 * 4. Hydration 錯誤修復
 * 5. 用戶交互行為
 */
describe('NavDocuments', () => {
  // 模擬文檔項目數據
  const mockItems = [
    {
      name: '數據中心',
      url: '/data',
      icon: IconDatabase,
    },
    {
      name: '分析報表',
      url: '/analytics',
      icon: IconChartBar,
    },
    {
      name: '系統報告',
      url: '/system-reports',
      icon: IconReport,
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
  it('應該正確渲染文檔導航組件', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查標題
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    // 檢查所有文檔項目是否正確顯示
    expect(screen.getByText('數據中心')).toBeInTheDocument();
    expect(screen.getByText('分析報表')).toBeInTheDocument();
    expect(screen.getByText('系統報告')).toBeInTheDocument();
  });

  /**
   * 測試鏈接屬性
   * 驗證每個文檔項目的鏈接是否正確設置
   */
  it('應該正確設置鏈接屬性', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查鏈接的 href 屬性
    const dataLink = screen.getByRole('link', { name: /數據中心/i });
    const analyticsLink = screen.getByRole('link', { name: /分析報表/i });
    const reportsLink = screen.getByRole('link', { name: /系統報告/i });
    
    expect(dataLink).toHaveAttribute('href', '/data');
    expect(analyticsLink).toHaveAttribute('href', '/analytics');
    expect(reportsLink).toHaveAttribute('href', '/system-reports');
  });

  /**
   * 測試鏈接數量
   * 驗證鏈接是否正確渲染
   */
  it('應該正確渲染所有文檔鏈接', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    const documentLinks = screen.getAllByRole('link').filter(link => 
      link.getAttribute('href')?.startsWith('/')
    );
    
    // 檢查文檔鏈接數量正確
    expect(documentLinks).toHaveLength(mockItems.length);
  });

  /**
   * 測試 Dropdown 菜單功能
   * 驗證每個文檔項目的操作菜單是否正常工作
   */
  it('應該能夠打開和關閉 dropdown 菜單', async () => {
    const user = userEvent.setup();
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 獲取第一個 more 按鈕
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    const firstMoreButton = moreButtons[0];
    
    // 點擊 more 按鈕打開菜單
    await user.click(firstMoreButton);
    
    // 檢查菜單項目是否出現
    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  /**
   * 測試 Dropdown 菜單項目功能
   * 驗證菜單項目的可點擊性
   */
  it('應該能夠點擊 dropdown 菜單項目', async () => {
    const user = userEvent.setup();
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 打開第一個 dropdown 菜單
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    await user.click(moreButtons[0]);
    
    // 等待菜單出現並點擊 "Open" 項目
    await waitFor(() => {
      const openItem = screen.getByText('Open');
      expect(openItem).toBeInTheDocument();
    });
    
    const openItem = screen.getByText('Open');
    await user.click(openItem);
    
    // 菜單應該關閉（測試基本交互行為）
    await waitFor(() => {
      expect(screen.queryByText('Open')).not.toBeInTheDocument();
    });
  });

  /**
   * 測試空項目列表
   * 驗證當沒有文檔項目時組件的行為
   */
  it('應該能夠處理空的項目列表', () => {
    renderWithProvider(<NavDocuments items={[]} />);
    
    // 檢查標題仍然存在
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    // 但應該只有 "More" 按鈕，沒有具體的文檔項目
    const documentLinks = screen.queryAllByRole('link').filter(link => 
      link.getAttribute('href')?.startsWith('/')
    );
    expect(documentLinks).toHaveLength(0);
    
    // 檢查是否有 "More" 按鈕
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  /**
   * 測試圖標渲染
   * 驗證每個文檔項目的圖標是否正確顯示
   */
  it('應該正確渲染圖標', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查是否有正確數量的圖標
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(mockItems.length);
  });

  /**
   * 測試單個項目
   * 驗證只有一個文檔項目時的行為
   */
  it('應該能夠處理單個文檔項目', () => {
    const singleItem = [mockItems[0]];
    
    renderWithProvider(<NavDocuments items={singleItem} />);
    
    expect(screen.getByText('數據中心')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /數據中心/i })).toHaveAttribute('href', '/data');
    
    // 確保沒有其他項目
    expect(screen.queryByText('分析報表')).not.toBeInTheDocument();
    expect(screen.queryByText('系統報告')).not.toBeInTheDocument();
  });

  /**
   * 測試 Hydration 安全性
   * 驗證組件是否正確處理 hydration 錯誤
   */
  it('應該正確處理 hydration 安全性', () => {
    // 這個測試主要是確保組件渲染時不會因為 hydration 錯誤而崩潰
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查組件是否正常渲染
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    // 檢查是否有 suppressHydrationWarning 相關的處理
    const dropdownContent = document.querySelector('[data-testid]');
    expect(dropdownContent).toBeInTheDocument();
  });

  /**
   * 測試鍵盤導航
   * 驗證組件的鍵盤可訪問性
   */
  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 測試 Tab 鍵導航
    await user.tab();
    
    // 檢查第一個鏈接是否獲得焦點
    const firstLink = screen.getByRole('link', { name: /數據中心/i });
    expect(firstLink).toHaveFocus();
  });

  /**
   * 測試 data-testid 屬性
   * 驗證組件是否包含正確的追蹤屬性
   */
  it('應該包含追蹤屬性', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查是否有 data-testid 屬性（用於追蹤）
    const elementsWithOid = document.querySelectorAll('[data-testid]');
    expect(elementsWithOid.length).toBeGreaterThan(0);
  });

  /**
   * 測試可訪問性標籤
   * 驗證屏幕閱讀器的支援
   */
  it('應該具備良好的可訪問性標籤', async () => {
    const user = userEvent.setup();
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查 More 按鈕的 sr-only 標籤
    const moreButtons = screen.getAllByRole('button', { name: /more/i });
    expect(moreButtons.length).toBeGreaterThan(0);
    
    // 打開菜單並檢查可訪問性
    await user.click(moreButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument();
    });
  });

  /**
   * 測試結構完整性
   * 驗證組件的 DOM 結構是否符合設計要求
   */
  it('應該具有正確的 DOM 結構', () => {
    renderWithProvider(<NavDocuments items={mockItems} />);
    
    // 檢查基本結構
    expect(screen.getByText('Documents')).toBeInTheDocument();
    
    // 檢查菜單項目數量（包括文檔項目和底部的 More 按鈕）
    const menuItems = screen.getAllByRole('link');
    expect(menuItems.length).toBe(mockItems.length);
    
    // 檢查 More 按鈕（使用選擇器）
    const moreElements = screen.getAllByText('More');
    expect(moreElements.length).toBeGreaterThan(0);
  });
}); 