import React from "react";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../site-header";

/**
 * SiteHeader 組件測試
 * 
 * 測試範圍：
 * - 基本渲染
 * - 用戶狀態顯示
 * - 麵包屑導航
 * - 路徑映射
 * - 載入狀態
 */

// 模擬 next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// 模擬 next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

// 模擬 next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// 模擬 sidebar 組件
jest.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: ({ className, ...props }: any) => (
    <button className={className} {...props}>
      側邊欄觸發器
    </button>
  ),
}));

// 模擬 mode-toggle 組件
jest.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <button>主題切換</button>,
}));

// 取得模擬的 hooks
const { useSession } = jest.requireMock<typeof import("next-auth/react")>("next-auth/react");
const { usePathname } = jest.requireMock<typeof import("next/navigation")>("next/navigation");

describe("SiteHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 測試基本渲染
   */
  it("應該正確渲染網站頭部", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查基本元素
    expect(screen.getByText("側邊欄觸發器")).toBeInTheDocument();
    expect(screen.getByText("主題切換")).toBeInTheDocument();
    expect(screen.getByText("幫助")).toBeInTheDocument();
    expect(screen.getByText("設定")).toBeInTheDocument();
  });

  /**
   * 測試載入狀態
   */
  it("載入時應該顯示骨架屏", () => {
    useSession.mockReturnValue({
      data: null,
      status: "loading",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查骨架屏元素
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * 測試已登入用戶顯示
   */
  it("應該正確顯示已登入用戶資訊", () => {
    const mockSession = {
      user: {
        name: "張三",
        username: "zhangsan",
      },
    };

    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查用戶資訊顯示
    expect(screen.getByText("張三")).toBeInTheDocument();
    expect(screen.getByText("張")).toBeInTheDocument(); // 頭像首字母
  });

  /**
   * 測試無用戶名稱時的默認顯示
   */
  it("應該在沒有用戶名稱時顯示默認值", () => {
    const mockSession = {
      user: {
        name: null,
      },
    };

    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查默認用戶顯示
    expect(screen.getByText("未知用戶")).toBeInTheDocument();
    expect(screen.getByText("U")).toBeInTheDocument(); // 默認頭像字母
  });

  /**
   * 測試儀表板頁面麵包屑
   */
  it("在儀表板頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("儀表板")).toBeInTheDocument();
  });

  /**
   * 測試商品列表頁面麵包屑
   */
  it("在商品列表頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/products");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("商品管理")).toBeInTheDocument();
    expect(screen.getByText("商品列表")).toBeInTheDocument();
  });

  /**
   * 測試庫存管理頁面麵包屑
   */
  it("在庫存管理頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/inventory/management");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("庫存管理")).toBeInTheDocument();
    expect(screen.getByText("庫存清單")).toBeInTheDocument();
  });

  /**
   * 測試新增商品頁面麵包屑
   */
  it("在新增商品頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/products/new");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("商品管理")).toBeInTheDocument();
    expect(screen.getByText("新增商品")).toBeInTheDocument();
  });

  /**
   * 測試訂單管理頁面麵包屑
   */
  it("在訂單管理頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/orders");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("訂單管理")).toBeInTheDocument();
  });

  /**
   * 測試客戶管理頁面麵包屑
   */
  it("在客戶管理頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/customers");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("客戶管理")).toBeInTheDocument();
  });

  /**
   * 測試動態路由商品詳情頁面麵包屑
   */
  it("在商品詳情頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/products/123");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("商品管理")).toBeInTheDocument();
    expect(screen.getByText("商品列表")).toBeInTheDocument();
    expect(screen.getByText("商品詳情")).toBeInTheDocument();
  });

  /**
   * 測試編輯頁面麵包屑
   */
  it("在編輯頁面應該顯示正確的麵包屑", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/products/123/edit");

    render(<SiteHeader />);
    
    // 檢查麵包屑
    expect(screen.getByText("商品管理")).toBeInTheDocument();
    expect(screen.getByText("商品列表")).toBeInTheDocument();
    expect(screen.getByText("商品詳情")).toBeInTheDocument();
    expect(screen.getByText("編輯")).toBeInTheDocument();
  });

  /**
   * 測試幫助和設定按鈕
   */
  it("應該包含幫助和設定按鈕", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查幫助按鈕
    const helpLink = screen.getByText("幫助").closest("a");
    expect(helpLink).toHaveAttribute("href", "/help");
    
    // 檢查設定按鈕
    const settingsLink = screen.getByText("設定").closest("a");
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  /**
   * 測試麵包屑鏈接
   */
  it("麵包屑中的可點擊項目應該有正確的鏈接", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/products/123/edit");

    render(<SiteHeader />);
    
    // 檢查商品列表鏈接
    const productListLink = screen.getByText("商品列表").closest("a");
    expect(productListLink).toHaveAttribute("href", "/products");
    
    // 檢查商品詳情鏈接
    const productDetailLink = screen.getByText("商品詳情").closest("a");
    expect(productDetailLink).toHaveAttribute("href", "/products/123");
  });

  /**
   * 測試響應式用戶名稱顯示
   */
  it("用戶名稱應該在大螢幕上顯示", () => {
    const mockSession = {
      user: {
        name: "張三",
      },
    };

    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    render(<SiteHeader />);
    
    // 檢查用戶名稱有響應式類別
    const userName = screen.getByText("張三");
    expect(userName).toHaveClass("hidden", "md:inline");
  });

  /**
   * 測試組件快照
   */
  it("應該匹配快照 - 未登入狀態", () => {
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    usePathname.mockReturnValue("/dashboard");

    const { container } = render(<SiteHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });

  /**
   * 測試組件快照 - 已登入狀態
   */
  it("應該匹配快照 - 已登入狀態", () => {
    const mockSession = {
      user: {
        name: "張三",
        username: "zhangsan",
      },
    };

    useSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
    });
    usePathname.mockReturnValue("/products");

    const { container } = render(<SiteHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });
}); 