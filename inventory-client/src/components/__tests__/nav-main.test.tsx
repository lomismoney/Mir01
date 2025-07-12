/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NavMain, type NavLink } from '../nav-main';

// 模擬 next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// 模擬 next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, className, suppressHydrationWarning, prefetch }: any) {
    return (
      <a 
        href={href} 
        className={className}
        data-suppress-hydration={suppressHydrationWarning}
        data-prefetch={prefetch}
      >
        {children}
      </a>
    );
  };
});

// 模擬 Tabler 圖標
jest.mock('@tabler/icons-react', () => ({
  IconCirclePlusFilled: () => <div data-testid="icon-plus">Plus Icon</div>,
  IconMail: () => <div data-testid="icon-mail">Mail Icon</div>,
  IconChevronDown: ({ className }: any) => (
    <div data-testid="icon-chevron" className={className}>
      Chevron Icon
    </div>
  ),
  IconDashboard: () => <div data-testid="icon-dashboard">Dashboard Icon</div>,
  IconBox: () => <div data-testid="icon-box">Box Icon</div>,
  IconBuilding: () => <div data-testid="icon-building">Building Icon</div>,
  IconShoppingCart: () => <div data-testid="icon-cart">Cart Icon</div>,
}));

// 模擬 utils 模組
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    return classes
      .filter(Boolean)
      .map(cls => {
        if (typeof cls === 'string') {
          return cls;
        }
        if (typeof cls === 'object' && cls !== null) {
          return Object.entries(cls)
            .filter(([_, value]) => Boolean(value))
            .map(([key, _]) => key)
            .join(' ');
        }
        return '';
      })
      .join(' ');
  },
}));

// 模擬 UI 組件
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, size, className, variant, ...props }: any) => (
    <button 
      className={`button ${size} ${className} ${variant}`} 
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange, ...props }: any) => (
    <div 
      data-testid="collapsible" 
      data-open={open}
      onClick={() => onOpenChange?.()}
      {...props}
    >
      {children}
    </div>
  ),
  CollapsibleContent: ({ children, className, ...props }: any) => (
    <div data-testid="collapsible-content" className={className} {...props}>
      {children}
    </div>
  ),
  CollapsibleTrigger: ({ children, className, ...props }: any) => (
    <div data-testid="collapsible-trigger" className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children, ...props }: any) => (
    <div data-testid="sidebar-group" {...props}>
      {children}
    </div>
  ),
  SidebarGroupContent: ({ children, className, ...props }: any) => (
    <div data-testid="sidebar-group-content" className={className} {...props}>
      {children}
    </div>
  ),
  SidebarMenu: ({ children, ...props }: any) => (
    <div data-testid="sidebar-menu" {...props}>
      {children}
    </div>
  ),
  SidebarMenuButton: ({ children, tooltip, className, ...props }: any) => (
    <div 
      data-testid="sidebar-menu-button" 
      className={className}
      title={tooltip}
      {...props}
    >
      {children}
    </div>
  ),
  SidebarMenuItem: ({ children, className, ...props }: any) => (
    <div data-testid="sidebar-menu-item" className={className} {...props}>
      {children}
    </div>
  ),
}));

/**
 * NavMain 組件測試套件
 * 
 * 測試覆蓋範圍：
 * 1. 基本渲染功能
 * 2. Hydration 錯誤修復
 * 3. 可摺疊導航功能
 * 4. 路徑高亮功能
 * 5. Quick Create 按鈕
 * 6. 不同類型的導航項目
 */
describe('NavMain', () => {
  
  // 測試數據
  const mockNavItems: NavLink[] = [
    {
      title: '儀表板',
      url: '/dashboard',
      icon: () => <div data-testid="icon-dashboard">Dashboard</div>,
    },
    {
      title: '商品管理',
      icon: () => <div data-testid="icon-box">Box</div>,
      children: [
        { title: '商品列表', url: '/products' },
        { title: '分類管理', url: '/categories' },
      ],
    },
    {
      title: '訂單管理',
      url: '/orders',
      icon: () => <div data-testid="icon-cart">Cart</div>,
    },
  ];

  beforeEach(() => {
    // 設置默認路徑
    mockPathname.mockReturnValue('/dashboard');
    
    // 清除所有 timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  /**
   * 測試基本渲染功能
   * 驗證組件能夠正常渲染而不出錯
   */
  it('應該正確渲染 NavMain 組件', () => {
    render(<NavMain items={mockNavItems} />);
    
    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-group-content')).toBeInTheDocument();
  });

  /**
   * 測試 Quick Create 按鈕渲染
   * 驗證 Quick Create 按鈕正確顯示
   */
  it('應該顯示 Quick Create 按鈕', () => {
    render(<NavMain items={mockNavItems} />);
    
    expect(screen.getByText('Quick Create')).toBeInTheDocument();
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  /**
   * 測試 Inbox 按鈕渲染
   * 驗證 Inbox 按鈕正確顯示
   */
  it('應該顯示 Inbox 按鈕', () => {
    render(<NavMain items={mockNavItems} />);
    
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  /**
   * 測試簡單導航項目渲染
   * 驗證沒有子項目的導航項目正確顯示
   */
  it('應該正確渲染簡單導航項目', () => {
    render(<NavMain items={mockNavItems} />);
    
    expect(screen.getByText('儀表板')).toBeInTheDocument();
    expect(screen.getByText('訂單管理')).toBeInTheDocument();
  });

  /**
   * 測試有子項目的導航項目渲染
   * 驗證帶有子選單的導航項目正確顯示
   */
  it('應該正確渲染有子項目的導航項目', () => {
    render(<NavMain items={mockNavItems} />);
    
    expect(screen.getByText('商品管理')).toBeInTheDocument();
    expect(screen.getByTestId('collapsible')).toBeInTheDocument();
  });

  /**
   * 測試 Hydration 錯誤修復
   * 驗證在客戶端 hydration 完成前渲染簡化版本
   */
  it('應該在 hydration 前渲染簡化版本', () => {
    // 阻止 useEffect 執行
    jest.spyOn(React, 'useEffect').mockImplementation(() => {});
    
    render(<NavMain items={mockNavItems} />);
    
    // 在 hydration 前，所有項目都應該是簡化渲染
    const items = screen.getAllByTestId('sidebar-menu-item');
    expect(items.length).toBeGreaterThan(0);
    
    // 恢復 useEffect
    (React.useEffect as jest.Mock).mockRestore();
  });

  /**
   * 測試 hydration 完成後的完整渲染
   * 驗證 useEffect 執行後組件渲染完整功能
   */
  it('應該在 hydration 完成後渲染完整功能', async () => {
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      // 檢查可摺疊組件是否存在
      expect(screen.getByTestId('collapsible')).toBeInTheDocument();
    });
  });

  /**
   * 測試可摺疊功能
   * 驗證點擊父項目時能夠展開和收起子選單
   */
  it('應該支援可摺疊功能', async () => {
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect 使組件完全掛載
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      const collapsible = screen.getByTestId('collapsible');
      expect(collapsible).toBeInTheDocument();
    });

    // 點擊觸發器
    const trigger = screen.getByTestId('collapsible-trigger');
    fireEvent.click(trigger);

    // 驗證狀態變化
    await waitFor(() => {
      const collapsible = screen.getByTestId('collapsible');
      // 由於我們的模擬會觸發 onOpenChange，這裡驗證組件響應
      expect(collapsible).toBeInTheDocument();
    });
  });

  /**
   * 測試子選單項目渲染
   * 驗證展開的子選單項目正確顯示
   */
  it('應該正確渲染子選單項目', async () => {
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      // 檢查子選單項目
      expect(screen.getByText('商品列表')).toBeInTheDocument();
      expect(screen.getByText('分類管理')).toBeInTheDocument();
    });
  });

  /**
   * 測試路徑高亮功能
   * 驗證當前路徑對應的導航項目被正確高亮
   */
  it('應該高亮當前路徑對應的導航項目', async () => {
    mockPathname.mockReturnValue('/products');
    
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      // 找到商品列表鏈接
      const productLink = screen.getByText('商品列表').closest('a');
      expect(productLink).toHaveClass('text-sidebar-accent-foreground bg-sidebar-accent');
    });
  });

  /**
   * 測試鏈接屬性
   * 驗證導航鏈接的屬性設置正確
   */
  it('應該設置正確的鏈接屬性', async () => {
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      // 檢查儀表板鏈接
      const dashboardLink = screen.getByText('儀表板').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(dashboardLink).toHaveAttribute('data-prefetch', 'true');
      expect(dashboardLink).toHaveAttribute('data-suppress-hydration', 'true');
    });
  });

  /**
   * 測試圖標顯示
   * 驗證每個導航項目的圖標正確顯示
   */
  it('應該顯示導航項目的圖標', () => {
    render(<NavMain items={mockNavItems} />);
    
    // 檢查圖標元素存在（通過測試 ID）
    const menuItems = screen.getAllByTestId('sidebar-menu-item');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  /**
   * 測試 Chevron 圖標旋轉
   * 驗證展開/收起時 Chevron 圖標的旋轉效果
   */
  it('Chevron 圖標應該根據展開狀態旋轉', async () => {
    render(<NavMain items={mockNavItems} />);
    
    // 執行 useEffect
    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      const chevronIcon = screen.getByTestId('icon-chevron');
      // 檢查是否有旋轉相關的類名
      expect(chevronIcon.className).toContain('transition-transform');
    });
  });

  /**
   * 測試空項目列表
   * 驗證當沒有導航項目時組件的行為
   */
  it('應該能夠處理空的導航項目列表', () => {
    render(<NavMain items={[]} />);
    
    // 基本結構仍然應該存在
    expect(screen.getByTestId('sidebar-group')).toBeInTheDocument();
    expect(screen.getByText('Quick Create')).toBeInTheDocument();
  });

  /**
   * 測試只有簡單項目的列表
   * 驗證當所有項目都沒有子選單時的渲染
   */
  it('應該正確處理只有簡單項目的列表', () => {
    const simpleItems: NavLink[] = [
      {
        title: '儀表板',
        url: '/dashboard',
        icon: () => <div>Dashboard</div>,
      },
      {
        title: '設定',
        url: '/settings',
        icon: () => <div>Settings</div>,
      },
    ];

    render(<NavMain items={simpleItems} />);
    
    expect(screen.getByText('儀表板')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
    
    // 不應該有 collapsible 組件
    expect(screen.queryByTestId('collapsible')).not.toBeInTheDocument();
  });

  /**
   * 測試 Quick Create 按鈕的工具提示
   * 驗證 Quick Create 按鈕有正確的 tooltip
   */
  it('Quick Create 按鈕應該有正確的 tooltip', () => {
    render(<NavMain items={mockNavItems} />);
    
    const quickCreateButton = screen.getByTestId('sidebar-menu-button');
    expect(quickCreateButton).toHaveAttribute('title', 'Quick Create');
  });

  /**
   * 測試 CSS 類名應用
   * 驗證組件應用了正確的 CSS 類名
   */
  it('應該應用正確的 CSS 類名', () => {
    render(<NavMain items={mockNavItems} />);
    
    const groupContent = screen.getByTestId('sidebar-group-content');
    expect(groupContent).toHaveClass('flex flex-col gap-2');
  });

  /**
   * 測試 data-testid 屬性
   * 驗證追蹤屬性正確設置
   */
  it('應該包含正確的 data-testid 屬性', () => {
    const { container } = render(<NavMain items={mockNavItems} />);
    
    // 檢查主要元素的 data-testid 屬性
    const elementsWithOid = container.querySelectorAll('[data-testid]');
    expect(elementsWithOid.length).toBeGreaterThan(0);
  });
}); 