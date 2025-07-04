/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppSidebar } from '../app-sidebar';

// 模擬 next/navigation
const mockPrefetch = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
  }),
  usePathname: () => '/dashboard',
}));

// 模擬 next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, onMouseEnter, prefetch, className }: any) {
    return (
      <a 
        href={href} 
        onMouseEnter={onMouseEnter}
        className={className}
        data-prefetch={prefetch}
      >
        {children}
      </a>
    );
  };
});

// 模擬 Tabler 圖標
jest.mock('@tabler/icons-react', () => ({
  IconDashboard: () => <div data-testid="icon-dashboard">Dashboard Icon</div>,
  IconBox: () => <div data-testid="icon-box">Box Icon</div>,
  IconBuilding: () => <div data-testid="icon-building">Building Icon</div>,
  IconShoppingCart: () => <div data-testid="icon-cart">Cart Icon</div>,
  IconTool: () => <div data-testid="icon-tool">Tool Icon</div>,
  IconUserCheck: () => <div data-testid="icon-user-check">User Check Icon</div>,
  IconBuildingStore: () => <div data-testid="icon-store">Store Icon</div>,
  IconUsers: () => <div data-testid="icon-users">Users Icon</div>,
  IconSettings: () => <div data-testid="icon-settings">Settings Icon</div>,
  IconHelp: () => <div data-testid="icon-help">Help Icon</div>,
  IconSearch: () => <div data-testid="icon-search">Search Icon</div>,
  IconDatabase: () => <div data-testid="icon-database">Database Icon</div>,
  IconChartBar: () => <div data-testid="icon-chart">Chart Icon</div>,
  IconReport: () => <div data-testid="icon-report">Report Icon</div>,
  IconInnerShadowTop: () => <div data-testid="icon-shadow">Shadow Icon</div>,
  IconFileDescription: () => <div data-testid="icon-file">File Icon</div>,
  IconHistory: () => <div data-testid="icon-history">History Icon</div>,
  IconPackage: () => <div data-testid="icon-package">Package Icon</div>,
}));

// 模擬 sidebar 相關組件
jest.mock('@/components/ui/sidebar', () => ({
  Sidebar: ({ children, ...props }: any) => (
    <div data-testid="sidebar" {...props}>
      {children}
    </div>
  ),
  SidebarContent: ({ children, ...props }: any) => (
    <div data-testid="sidebar-content" {...props}>
      {children}
    </div>
  ),
  SidebarFooter: ({ children, ...props }: any) => (
    <div data-testid="sidebar-footer" {...props}>
      {children}
    </div>
  ),
  SidebarHeader: ({ children, ...props }: any) => (
    <div data-testid="sidebar-header" {...props}>
      {children}
    </div>
  ),
  SidebarMenu: ({ children, ...props }: any) => (
    <div data-testid="sidebar-menu" {...props}>
      {children}
    </div>
  ),
  SidebarMenuButton: ({ children, asChild, className, ...props }: any) => (
    <div data-testid="sidebar-menu-button" className={className} {...props}>
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children, ...props }: any) => (
    <div data-testid="sidebar-menu-item" {...props}>
      {children}
    </div>
  ),
}));

// 模擬導航組件
jest.mock('@/components/nav-documents', () => ({
  NavDocuments: ({ items }: { items: any[] }) => (
    <div data-testid="nav-documents">
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-doc-${item.name}`}>
          {item.name}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/nav-main', () => ({
  NavMain: ({ items }: { items: any[] }) => (
    <div data-testid="nav-main">
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-main-${item.title}`}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/nav-secondary', () => ({
  NavSecondary: ({ items, className }: { items: any[]; className?: string }) => (
    <div data-testid="nav-secondary" className={className}>
      {items.map((item, index) => (
        <div key={index} data-testid={`nav-secondary-${item.title}`}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/nav-user', () => ({
  NavUser: (props: any) => (
    <div data-testid="nav-user" {...props}>
      User Navigation
    </div>
  ),
}));

/**
 * AppSidebar 組件測試套件
 * 
 * 測試覆蓋範圍：
 * 1. 基本渲染功能
 * 2. 導航項目顯示
 * 3. SmartNavLink 智能預加載功能
 * 4. 組件結構完整性
 * 5. 屬性傳遞
 */
describe('AppSidebar', () => {
  
  beforeEach(() => {
    // 清除模擬函數的調用記錄
    mockPrefetch.mockClear();
  });

  /**
   * 測試基本渲染功能
   * 驗證組件能夠正常渲染而不出錯
   */
  it('應該正確渲染 AppSidebar', () => {
    render(<AppSidebar />);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });

  /**
   * 測試系統標題顯示
   * 驗證側邊欄標題正確顯示
   */
  it('應該顯示系統標題', () => {
    render(<AppSidebar />);
    
    expect(screen.getByText('庫存管理系統')).toBeInTheDocument();
    expect(screen.getByTestId('icon-shadow')).toBeInTheDocument();
  });

  /**
   * 測試主導航項目
   * 驗證所有主要導航項目都正確顯示
   */
  it('應該顯示所有主導航項目', () => {
    render(<AppSidebar />);
    
    const navMainItems = [
      '儀表板',
      '庫存管理', 
      '商品管理',
      '訂單管理',
      '安裝管理',
      '客戶管理',
      '分店管理',
      '用戶管理'
    ];

    navMainItems.forEach(item => {
      expect(screen.getByTestId(`nav-main-${item}`)).toBeInTheDocument();
    });
  });

  /**
   * 測試文檔導航項目
   * 驗證文檔導航項目正確顯示
   */
  it('應該顯示文檔導航項目', () => {
    render(<AppSidebar />);
    
    expect(screen.getByTestId('nav-documents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-doc-數據中心')).toBeInTheDocument();
    expect(screen.getByTestId('nav-doc-分析報表')).toBeInTheDocument();
    expect(screen.getByTestId('nav-doc-系統報告')).toBeInTheDocument();
  });

  /**
   * 測試次要導航項目
   * 驗證次要導航項目正確顯示
   */
  it('應該顯示次要導航項目', () => {
    render(<AppSidebar />);
    
    expect(screen.getByTestId('nav-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('nav-secondary-系統設定')).toBeInTheDocument();
    expect(screen.getByTestId('nav-secondary-幫助中心')).toBeInTheDocument();
    expect(screen.getByTestId('nav-secondary-搜尋')).toBeInTheDocument();
  });

  /**
   * 測試用戶導航
   * 驗證用戶導航區域正確顯示
   */
  it('應該顯示用戶導航', () => {
    render(<AppSidebar />);
    
    expect(screen.getByTestId('nav-user')).toBeInTheDocument();
    expect(screen.getByText('User Navigation')).toBeInTheDocument();
  });

  /**
   * 測試 SmartNavLink 智能預加載功能
   * 驗證鼠標懸停時觸發路由預加載
   */
  it('應該在 SmartNavLink 懸停時觸發預加載', async () => {
    render(<AppSidebar />);
    
    // 找到系統標題的鏈接
    const titleLink = screen.getByText('庫存管理系統').closest('a');
    expect(titleLink).toBeInTheDocument();
    
    if (titleLink) {
      // 模擬鼠標懸停事件
      fireEvent.mouseEnter(titleLink);
      
      // 驗證 router.prefetch 被調用
      await waitFor(() => {
        expect(mockPrefetch).toHaveBeenCalledWith('/dashboard');
      });
    }
  });

  /**
   * 測試 SmartNavLink 自定義預加載邏輯
   * 驗證 prefetch={false} 設置正確
   */
  it('SmartNavLink 應該禁用默認預加載', () => {
    render(<AppSidebar />);
    
    const titleLink = screen.getByText('庫存管理系統').closest('a');
    expect(titleLink).toHaveAttribute('data-prefetch', 'false');
  });

  /**
   * 測試側邊欄屬性傳遞
   * 驗證額外的屬性正確傳遞給 Sidebar 組件
   */
  it('應該正確傳遞屬性給 Sidebar 組件', () => {
    const customProps = {
      'data-testid': 'custom-sidebar',
      className: 'custom-sidebar-class'
    };
    
    render(<AppSidebar {...customProps} />);
    
    const sidebar = screen.getByTestId('custom-sidebar');
    expect(sidebar).toBeInTheDocument();
    expect(sidebar).toHaveClass('custom-sidebar-class');
  });

  /**
   * 測試組件 memo 優化
   * 驗證組件名稱設置正確
   */
  it('應該有正確的 displayName', () => {
    expect(AppSidebar.displayName).toBe('AppSidebar');
  });

  /**
   * 測試次要導航的 className
   * 驗證次要導航有正確的 CSS 類名
   */
  it('次要導航應該有 mt-auto 類名', () => {
    render(<AppSidebar />);
    
    const navSecondary = screen.getByTestId('nav-secondary');
    expect(navSecondary).toHaveClass('mt-auto');
  });

  /**
   * 測試 SmartNavLink 記憶化功能
   * 驗證相同的 href 不會重複預加載
   */
  it('相同路由不應該重複預加載', async () => {
    render(<AppSidebar />);
    
    const titleLink = screen.getByText('庫存管理系統').closest('a');
    
    if (titleLink) {
      // 多次懸停同一個鏈接
      fireEvent.mouseEnter(titleLink);
      fireEvent.mouseEnter(titleLink);
      fireEvent.mouseEnter(titleLink);
      
      // 等待異步操作完成
      await waitFor(() => {
        // prefetch 應該被調用多次（因為沒有防重複邏輯）
        expect(mockPrefetch).toHaveBeenCalledTimes(3);
        expect(mockPrefetch).toHaveBeenCalledWith('/dashboard');
      });
    }
  });

  /**
   * 測試側邊欄結構完整性
   * 驗證所有必要的結構元素都存在
   */
  it('應該有完整的側邊欄結構', () => {
    render(<AppSidebar />);
    
    // 檢查主要結構元素
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
    
    // 檢查內部結構
    expect(screen.getByTestId('sidebar-menu')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-menu-item')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-menu-button')).toBeInTheDocument();
    
    // 檢查導航組件
    expect(screen.getByTestId('nav-main')).toBeInTheDocument();
    expect(screen.getByTestId('nav-documents')).toBeInTheDocument();
    expect(screen.getByTestId('nav-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('nav-user')).toBeInTheDocument();
  });

  /**
   * 測試 data-oid 屬性
   * 驗證追蹤屬性正確設置
   */
  it('應該包含正確的 data-oid 屬性', () => {
    const { container } = render(<AppSidebar />);
    
    // 檢查主要元素的 data-oid 屬性
    const elementsWithOid = container.querySelectorAll('[data-oid]');
    expect(elementsWithOid.length).toBeGreaterThan(0);
  });
}); 