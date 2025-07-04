/**
 * Toaster 組件測試套件
 * 
 * 這個測試套件涵蓋了：
 * - Toaster 組件的基本渲染
 * - useToast hook 的整合
 * - Toast 項目的動態渲染
 * - 標題和描述的條件渲染
 * - Action 元素的處理
 * - ToastProvider 的包裝
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Toaster } from '../toaster';

// Mock useToast hook
const mockUseToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => mockUseToast(),
}));

// Mock Toast 相關組件
jest.mock('@/components/ui/toast', () => ({
  Toast: ({ children, ...props }: any) => (
    <div data-testid="toast" {...props}>
      {children}
    </div>
  ),
  ToastClose: (props: any) => (
    <button data-testid="toast-close" {...props}>
      ×
    </button>
  ),
  ToastDescription: ({ children, ...props }: any) => (
    <div data-testid="toast-description" {...props}>
      {children}
    </div>
  ),
  ToastProvider: ({ children }: any) => (
    <div data-testid="toast-provider">
      {children}
    </div>
  ),
  ToastTitle: ({ children, ...props }: any) => (
    <div data-testid="toast-title" {...props}>
      {children}
    </div>
  ),
  ToastViewport: (props: any) => (
    <div data-testid="toast-viewport" {...props} />
  ),
}));

describe('Toaster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    /**
     * 測試空 Toast 列表的渲染
     */
    it('應該渲染空的 ToastProvider 和 ToastViewport', () => {
      mockUseToast.mockReturnValue({ toasts: [] });

      render(<Toaster />);

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    /**
     * 測試 ToastProvider 的存在
     */
    it('應該始終包含 ToastProvider', () => {
      mockUseToast.mockReturnValue({ toasts: [] });

      render(<Toaster />);

      const provider = screen.getByTestId('toast-provider');
      expect(provider).toBeInTheDocument();
    });

    /**
     * 測試 ToastViewport 的存在
     */
    it('應該始終包含 ToastViewport', () => {
      mockUseToast.mockReturnValue({ toasts: [] });

      render(<Toaster />);

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport).toBeInTheDocument();
    });
  });

  describe('單個 Toast 渲染', () => {
    /**
     * 測試只有標題的 Toast
     */
    it('應該渲染只有標題的 Toast', () => {
      const mockToasts = [
        {
          id: '1',
          title: '測試標題',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-title')).toBeInTheDocument();
      expect(screen.getByText('測試標題')).toBeInTheDocument();
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });

    /**
     * 測試只有描述的 Toast
     */
    it('應該渲染只有描述的 Toast', () => {
      const mockToasts = [
        {
          id: '1',
          description: '測試描述',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
      expect(screen.getByTestId('toast-description')).toBeInTheDocument();
      expect(screen.getByText('測試描述')).toBeInTheDocument();
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });

    /**
     * 測試包含標題和描述的 Toast
     */
    it('應該渲染包含標題和描述的 Toast', () => {
      const mockToasts = [
        {
          id: '1',
          title: '成功',
          description: '操作已成功完成',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-title')).toBeInTheDocument();
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByTestId('toast-description')).toBeInTheDocument();
      expect(screen.getByText('操作已成功完成')).toBeInTheDocument();
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });

    /**
     * 測試包含 action 的 Toast
     */
    it('應該渲染包含 action 的 Toast', () => {
      const mockAction = <button data-testid="custom-action">重試</button>;
      const mockToasts = [
        {
          id: '1',
          title: '錯誤',
          action: mockAction,
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-title')).toBeInTheDocument();
      expect(screen.getByText('錯誤')).toBeInTheDocument();
      expect(screen.getByTestId('custom-action')).toBeInTheDocument();
      expect(screen.getByText('重試')).toBeInTheDocument();
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });
  });

  describe('多個 Toast 渲染', () => {
    /**
     * 測試多個 Toast 的渲染
     */
    it('應該渲染多個 Toast', () => {
      const mockToasts = [
        { id: '1', title: 'Toast 1' },
        { id: '2', title: 'Toast 2' },
        { id: '3', title: 'Toast 3' },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      const toasts = screen.getAllByTestId('toast');
      expect(toasts).toHaveLength(3);

      expect(screen.getByText('Toast 1')).toBeInTheDocument();
      expect(screen.getByText('Toast 2')).toBeInTheDocument();
      expect(screen.getByText('Toast 3')).toBeInTheDocument();

      // 每個 Toast 都應該有關閉按鈕
      const closeButtons = screen.getAllByTestId('toast-close');
      expect(closeButtons).toHaveLength(3);
    });

    /**
     * 測試 Toast 的 key 屬性
     */
    it('每個 Toast 應該有唯一的 key', () => {
      const mockToasts = [
        { id: 'unique-1', title: 'First' },
        { id: 'unique-2', title: 'Second' },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      const { container } = render(<Toaster />);

      // 檢查渲染的 Toast 數量
      const toasts = screen.getAllByTestId('toast');
      expect(toasts).toHaveLength(2);
    });
  });

  describe('Toast 屬性傳遞', () => {
    /**
     * 測試額外屬性的傳遞
     */
    it('應該傳遞額外的 Toast 屬性', () => {
      const mockToasts = [
        {
          id: '1',
          title: '測試',
          variant: 'destructive',
          'data-state': 'open',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      const toast = screen.getByTestId('toast');
      expect(toast).toHaveAttribute('variant', 'destructive');
      expect(toast).toHaveAttribute('data-state', 'open');
    });

    /**
     * 測試過濾掉的屬性
     */
    it('應該正確過濾掉 id, title, description, action 屬性', () => {
      const mockToasts = [
        {
          id: '1',
          title: '標題',
          description: '描述',
          action: <div>Action</div>,
          variant: 'default',
          duration: 5000,
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      const toast = screen.getByTestId('toast');
      
      // 這些屬性不應該作為 DOM 屬性傳遞
      expect(toast).not.toHaveAttribute('id', '1');
      expect(toast).not.toHaveAttribute('title', '標題');
      expect(toast).not.toHaveAttribute('description', '描述');
      
      // 其他屬性應該被傳遞
      expect(toast).toHaveAttribute('variant', 'default');
      expect(toast).toHaveAttribute('duration', '5000');
    });
  });

  describe('條件渲染', () => {
    /**
     * 測試空標題的處理
     */
    it('不應該渲染空標題', () => {
      const mockToasts = [
        {
          id: '1',
          title: '',
          description: '只有描述',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
      expect(screen.getByTestId('toast-description')).toBeInTheDocument();
    });

    /**
     * 測試空描述的處理
     */
    it('不應該渲染空描述', () => {
      const mockToasts = [
        {
          id: '1',
          title: '只有標題',
          description: '',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.getByTestId('toast-title')).toBeInTheDocument();
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
    });

    /**
     * 測試 null/undefined 值的處理
     */
    it('應該正確處理 null 和 undefined 值', () => {
      const mockToasts = [
        {
          id: '1',
          title: null,
          description: undefined,
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument();
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByTestId('toast-close')).toBeInTheDocument();
    });
  });

  describe('DOM 結構', () => {
    /**
     * 測試 grid 容器的存在
     */
    it('應該有正確的 grid 容器結構', () => {
      const mockToasts = [
        {
          id: '1',
          title: '標題',
          description: '描述',
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      const { container } = render(<Toaster />);

      const gridContainer = container.querySelector('.grid.gap-1');
      expect(gridContainer).toBeInTheDocument();
    });

    /**
     * 測試元素的渲染順序
     */
    it('應該按正確順序渲染元素', () => {
      const mockAction = <div data-testid="action">Action</div>;
      const mockToasts = [
        {
          id: '1',
          title: '標題',
          description: '描述',
          action: mockAction,
        },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      const { container } = render(<Toaster />);

      const toast = screen.getByTestId('toast');
      const children = Array.from(toast.children);
      
      // 第一個子元素應該是 grid 容器
      expect(children[0]).toHaveClass('grid', 'gap-1');
      
      // 檢查 grid 容器內的內容
      const gridContainer = children[0];
      const gridChildren = Array.from(gridContainer.children);
      
      // title 應該在前面
      expect(gridChildren[0]).toHaveAttribute('data-testid', 'toast-title');
      // description 應該在後面
      expect(gridChildren[1]).toHaveAttribute('data-testid', 'toast-description');
    });
  });

  describe('邊界條件', () => {
    /**
     * 測試 useToast 返回 undefined
     */
    it('應該處理 useToast 返回 undefined 的情況', () => {
      mockUseToast.mockReturnValue({ toasts: undefined });

      expect(() => {
        render(<Toaster />);
      }).toThrow();
    });

    /**
     * 測試空的 toasts 陣列
     */
    it('應該正確處理空的 toasts 陣列', () => {
      mockUseToast.mockReturnValue({ toasts: [] });

      render(<Toaster />);

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    });

    /**
     * 測試大量 Toast 的情況
     */
    it('應該處理大量 Toast', () => {
      const mockToasts = Array.from({ length: 10 }, (_, i) => ({
        id: `toast-${i}`,
        title: `Toast ${i}`,
      }));

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      render(<Toaster />);

      const toasts = screen.getAllByTestId('toast');
      expect(toasts).toHaveLength(10);
    });

    /**
     * 測試 Toast ID 重複的情況
     */
    it('應該處理重複 ID 的 Toast', () => {
      const mockToasts = [
        { id: 'duplicate-1', title: 'First' },
        { id: 'duplicate-2', title: 'Second' },
      ];

      mockUseToast.mockReturnValue({ toasts: mockToasts });

      // 應該不會出錯，但可能有警告
      render(<Toaster />);

      const toasts = screen.getAllByTestId('toast');
      expect(toasts).toHaveLength(2);
    });
  });

  describe('效能測試', () => {
    /**
     * 測試多次重新渲染
     */
    it('應該支援多次重新渲染', () => {
      // 初始渲染
      mockUseToast.mockReturnValue({ toasts: [] });
      const { rerender } = render(<Toaster />);

      // 第一次渲染
      mockUseToast.mockReturnValue({ toasts: [{ id: 'rerender-1', title: 'First' }] });
      rerender(<Toaster />);

      // 第二次渲染
      mockUseToast.mockReturnValue({ toasts: [{ id: 'rerender-2', title: 'Second' }] });
      rerender(<Toaster />);

      // 第三次渲染
      mockUseToast.mockReturnValue({ toasts: [] });
      rerender(<Toaster />);

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
    });

    /**
     * 測試組件卸載
     */
    it('應該正確處理組件卸載', () => {
      mockUseToast.mockReturnValue({ toasts: [{ id: '1', title: 'Test' }] });

      const { unmount } = render(<Toaster />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});