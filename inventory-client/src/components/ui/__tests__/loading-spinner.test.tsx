/**
 * LoadingSpinner 組件測試套件
 * 
 * 這個測試套件涵蓋了：
 * - LoadingSpinner 組件的基本渲染
 * - 不同尺寸配置的正確應用
 * - 文字顯示功能
 * - 自定義樣式類別的應用
 * - 預設屬性的行為
 * - 可訪問性和動畫效果
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../loading-spinner';

// Mock lucide-react 圖示
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div
      data-testid="loader2-icon"
      className={className}
      {...props}
    />
  ),
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('LoadingSpinner', () => {
  describe('基本渲染', () => {
    /**
     * 測試預設渲染
     */
    it('應該使用預設配置正確渲染', () => {
      render(<LoadingSpinner />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toBeInTheDocument();
    });

    /**
     * 測試預設樣式類別
     */
    it('應該應用正確的預設樣式', () => {
      render(<LoadingSpinner />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('animate-spin');
      expect(icon).toHaveClass('text-primary');
      expect(icon).toHaveClass('h-8');
      expect(icon).toHaveClass('w-8');
    });

    /**
     * 測試容器結構
     */
    it('應該有正確的容器結構', () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('gap-2');
    });
  });

  describe('尺寸配置', () => {
    /**
     * 測試小尺寸
     */
    it('應該正確應用小尺寸樣式', () => {
      render(<LoadingSpinner size="sm" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
    });

    /**
     * 測試中等尺寸（預設）
     */
    it('應該正確應用中等尺寸樣式', () => {
      render(<LoadingSpinner size="md" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-8');
      expect(icon).toHaveClass('w-8');
    });

    /**
     * 測試大尺寸
     */
    it('應該正確應用大尺寸樣式', () => {
      render(<LoadingSpinner size="lg" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-12');
      expect(icon).toHaveClass('w-12');
    });

    /**
     * 測試所有尺寸都包含基本動畫類別
     */
    it('所有尺寸都應該包含動畫類別', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      sizes.forEach(size => {
        const { unmount } = render(<LoadingSpinner size={size} />);
        
        const icon = screen.getByTestId('loader2-icon');
        expect(icon).toHaveClass('animate-spin');
        expect(icon).toHaveClass('text-primary');
        
        unmount();
      });
    });
  });

  describe('文字顯示功能', () => {
    /**
     * 測試不顯示文字時
     */
    it('沒有文字時不應該渲染文字元素', () => {
      const { container } = render(<LoadingSpinner />);

      // 檢查沒有 span 元素（文字容器）
      const spanElements = container.querySelectorAll('span');
      expect(spanElements).toHaveLength(0);
    });

    /**
     * 測試顯示文字
     */
    it('應該正確顯示載入文字', () => {
      const loadingText = '載入中...';
      render(<LoadingSpinner text={loadingText} />);

      const textElement = screen.getByText(loadingText);
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveClass('text-sm');
      expect(textElement).toHaveClass('text-muted-foreground');
      expect(textElement).toHaveClass('animate-pulse');
    });

    /**
     * 測試不同的文字內容
     */
    it('應該支援不同的文字內容', () => {
      const testTexts = [
        '請稍候...',
        'Loading...',
        '正在處理您的請求',
        '資料載入中',
        '',
      ];

      testTexts.forEach(text => {
        const { container, unmount } = render(<LoadingSpinner text={text} />);
        
        if (text) {
          expect(screen.getByText(text)).toBeInTheDocument();
        } else {
          // 空字串時不應該渲染 span 元素
          const spanElements = container.querySelectorAll('span');
          expect(spanElements).toHaveLength(0);
        }
        
        unmount();
      });
    });

    /**
     * 測試長文字內容
     */
    it('應該處理長文字內容', () => {
      const longText = '這是一個很長的載入訊息，用來測試組件是否能正確處理較長的文字內容';
      render(<LoadingSpinner text={longText} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    /**
     * 測試特殊字符
     */
    it('應該正確顯示包含特殊字符的文字', () => {
      const specialText = 'Loading... 🚀 & <progress>50%</progress>';
      render(<LoadingSpinner text={specialText} />);

      expect(screen.getByText(specialText)).toBeInTheDocument();
    });
  });

  describe('自定義樣式', () => {
    /**
     * 測試自定義 className
     */
    it('應該正確應用自定義 className', () => {
      const customClass = 'custom-spinner-class';
      render(<LoadingSpinner className={customClass} />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass(customClass);
    });

    /**
     * 測試多個自定義類別
     */
    it('應該支援多個自定義類別', () => {
      const customClasses = 'custom-1 custom-2 text-blue-500';
      render(<LoadingSpinner className={customClasses} />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('custom-1');
      expect(icon).toHaveClass('custom-2');
      expect(icon).toHaveClass('text-blue-500');
    });

    /**
     * 測試自定義類別與預設類別並存
     */
    it('自定義類別應該與預設類別並存', () => {
      const customClass = 'text-red-500';
      render(<LoadingSpinner className={customClass} size="lg" />);

      const icon = screen.getByTestId('loader2-icon');
      // 預設類別
      expect(icon).toHaveClass('animate-spin');
      expect(icon).toHaveClass('text-primary');
      expect(icon).toHaveClass('h-12');
      expect(icon).toHaveClass('w-12');
      // 自定義類別
      expect(icon).toHaveClass('text-red-500');
    });
  });

  describe('組合功能測試', () => {
    /**
     * 測試所有屬性組合
     */
    it('應該正確處理所有屬性的組合', () => {
      const props = {
        size: 'lg' as const,
        text: '載入大型資料中...',
        className: 'custom-large-spinner',
      };

      render(<LoadingSpinner {...props} />);

      // 檢查圖示
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-12');
      expect(icon).toHaveClass('w-12');
      expect(icon).toHaveClass('custom-large-spinner');
      expect(icon).toHaveClass('animate-spin');

      // 檢查文字
      expect(screen.getByText('載入大型資料中...')).toBeInTheDocument();
    });

    /**
     * 測試最小配置
     */
    it('應該正確處理最小配置', () => {
      const { container } = render(<LoadingSpinner size="sm" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
      
      // 檢查沒有文字元素
      const spanElements = container.querySelectorAll('span');
      expect(spanElements).toHaveLength(0);
    });

    /**
     * 測試完整配置
     */
    it('應該正確處理完整配置', () => {
      render(
        <LoadingSpinner
          size="lg"
          text="載入中，請稍候..."
          className="border-2 border-dashed"
        />
      );

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-12');
      expect(icon).toHaveClass('w-12');
      expect(icon).toHaveClass('border-2');
      expect(icon).toHaveClass('border-dashed');
      
      expect(screen.getByText('載入中，請稍候...')).toBeInTheDocument();
    });
  });

  describe('可訪問性測試', () => {
    /**
     * 測試 ARIA 屬性（雖然這個組件沒有特殊的 ARIA 屬性，但可以測試結構）
     */
    it('應該有適當的 DOM 結構以支援可訪問性', () => {
      render(<LoadingSpinner text="載入中" />);

      // 確保有合適的文字描述載入狀態
      expect(screen.getByText('載入中')).toBeInTheDocument();
    });

    /**
     * 測試語義化標記
     */
    it('應該使用語義化的 HTML 結構', () => {
      const { container } = render(<LoadingSpinner text="Loading..." />);

      // 檢查容器使用適當的元素
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName.toLowerCase()).toBe('div');

      // 檢查文字使用 span 元素
      const textElement = screen.getByText('Loading...');
      expect(textElement.tagName.toLowerCase()).toBe('span');
    });
  });

  describe('效能測試', () => {
    /**
     * 測試多次渲染不會出錯
     */
    it('應該支援多次渲染而不出錯', () => {
      const { rerender } = render(<LoadingSpinner />);

      // 多次重新渲染
      for (let i = 0; i < 10; i++) {
        rerender(
          <LoadingSpinner
            size={i % 2 === 0 ? 'sm' : 'lg'}
            text={i % 3 === 0 ? `載入 ${i}` : undefined}
          />
        );
      }

      // 最後一次渲染應該正常
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    /**
     * 測試快速切換屬性
     */
    it('應該正確處理快速的屬性切換', () => {
      const { rerender, container } = render(<LoadingSpinner size="sm" />);

      rerender(<LoadingSpinner size="md" text="Medium" />);
      rerender(<LoadingSpinner size="lg" text="Large Loading" />);
      rerender(<LoadingSpinner size="sm" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4');
      expect(icon).toHaveClass('w-4');
      
      // 檢查沒有文字元素
      const spanElements = container.querySelectorAll('span');
      expect(spanElements).toHaveLength(0);
    });
  });

  describe('邊界條件測試', () => {
    /**
     * 測試 undefined 和 null 屬性
     */
    it('應該正確處理 undefined 和 null 屬性', () => {
      // 測試邊界條件 - 使用類型斷言來測試運行時行為
      render(<LoadingSpinner {...{size: undefined as any, text: null as any, className: undefined}} />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toBeInTheDocument();
    });

    /**
     * 測試空字串屬性
     */
    it('應該正確處理空字串屬性', () => {
      const { container } = render(<LoadingSpinner text="" className="" />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toBeInTheDocument();
      
      // 檢查沒有文字元素
      const spanElements = container.querySelectorAll('span');
      expect(spanElements).toHaveLength(0);
    });

    /**
     * 測試非標準尺寸值（TypeScript 應該防止這種情況，但測試運行時行為）
     */
    it('應該優雅處理非標準的尺寸值', () => {
      // 測試邊界條件 - 非標準尺寸值的運行時行為
      render(<LoadingSpinner size={"xl" as any} />);

      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toBeInTheDocument();
      // 非標準尺寸應該回退到預設行為
    });
  });
});