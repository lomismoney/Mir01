/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserRoleDisplay, RoleBasedContent } from '../user-role-display';

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => (
    <svg data-testid="shield-icon" className={className} {...props}>
      <title>Shield</title>
    </svg>
  ),
  Eye: ({ className, ...props }: any) => (
    <svg data-testid="eye-icon" className={className} {...props}>
      <title>Eye</title>
    </svg>
  ),
}));

describe('UserRoleDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 測試未認證狀態
   */
  it('應該在用戶未認證時不渲染任何內容', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { container } = render(<UserRoleDisplay />);
    expect(container.firstChild).toBeNull();
  });

  /**
   * 測試載入狀態
   */
  it('應該在載入狀態時不渲染任何內容', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { container } = render(<UserRoleDisplay />);
    expect(container.firstChild).toBeNull();
  });

  /**
   * 測試管理員用戶顯示
   */
  it('應該正確顯示管理員用戶資訊', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: '王小明',
          role: 'admin',
          roleDisplay: '系統管理員',
          isAdmin: true,
        },
      },
      status: 'authenticated',
    });

    render(<UserRoleDisplay />);

    // 檢查角色徽章
    expect(screen.getByText('系統管理員')).toBeInTheDocument();
    
    // 檢查用戶名稱
    expect(screen.getByText('王小明')).toBeInTheDocument();
    
    // 檢查管理員標識
    expect(screen.getByText('管理員')).toBeInTheDocument();
    
    // 檢查盾牌圖標
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
  });

  /**
   * 測試一般用戶顯示
   */
  it('應該正確顯示一般用戶資訊', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: '李小華',
          role: 'viewer',
          roleDisplay: '檢視者',
          isAdmin: false,
        },
      },
      status: 'authenticated',
    });

    render(<UserRoleDisplay />);

    // 檢查角色徽章
    expect(screen.getByText('檢視者')).toBeInTheDocument();
    
    // 檢查用戶名稱
    expect(screen.getByText('李小華')).toBeInTheDocument();
    
    // 檢查沒有管理員標識
    expect(screen.queryByText('管理員')).not.toBeInTheDocument();
    
    // 檢查眼睛圖標
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  /**
   * 測試沒有 roleDisplay 時使用 role
   */
  it('應該在沒有 roleDisplay 時使用 role 作為顯示名稱', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: '張三',
          role: 'viewer',
          isAdmin: false,
        },
      },
      status: 'authenticated',
    });

    render(<UserRoleDisplay />);

    // 檢查使用 role 作為顯示名稱
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });
});

describe('RoleBasedContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 測試管理員內容顯示
   */
  it('應該顯示管理員面板內容', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: '管理員',
          role: 'admin',
          isAdmin: true,
        },
      },
    });

    render(<RoleBasedContent />);

    // 檢查管理員面板標題
    expect(screen.getByText('管理員面板')).toBeInTheDocument();
    
    // 檢查管理員權限描述
    expect(screen.getByText('您具有完整的系統管理權限。')).toBeInTheDocument();
    
    // 檢查管理員權限列表
    expect(screen.getByText('• 可以管理所有商品')).toBeInTheDocument();
    expect(screen.getByText('• 可以查看所有用戶')).toBeInTheDocument();
    expect(screen.getByText('• 可以修改系統設定')).toBeInTheDocument();
  });

  /**
   * 測試檢視者內容顯示
   */
  it('應該顯示檢視者面板內容', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: '檢視者',
          role: 'viewer',
          isAdmin: false,
        },
      },
    });

    render(<RoleBasedContent />);

    // 檢查檢視者面板標題
    expect(screen.getByText('檢視者面板')).toBeInTheDocument();
    
    // 檢查檢視者權限描述
    expect(screen.getByText('您具有唯讀權限。')).toBeInTheDocument();
    
    // 檢查檢視者權限列表
    expect(screen.getByText('• 可以查看商品列表')).toBeInTheDocument();
    expect(screen.getByText('• 可以查看商品詳細資訊')).toBeInTheDocument();
    expect(screen.getByText('• 無法修改任何資料')).toBeInTheDocument();
  });

  /**
   * 測試訪客內容顯示（未登入）
   */
  it('應該顯示訪客內容當用戶未登入時', () => {
    mockUseSession.mockReturnValue({
      data: null,
    });

    render(<RoleBasedContent />);

    // 檢查訪客面板標題
    expect(screen.getByText('訪客')).toBeInTheDocument();
    
    // 檢查訪客描述
    expect(screen.getByText('請登入以查看更多內容。')).toBeInTheDocument();
  });
}); 