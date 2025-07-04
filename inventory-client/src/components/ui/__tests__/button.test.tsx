import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '../button';

// Mock @radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

/**
 * Button 組件測試套件
 * 
 * 測試範圍：
 * - 基本渲染功能
 * - 所有變體 (variants) 樣式
 * - 所有大小 (sizes) 選項
 * - asChild 屬性功能
 * - 點擊事件處理
 * - 禁用狀態
 * - 自定義 className
 * - 可訪問性屬性
 */
describe('Button 組件測試', () => {
  describe('基本功能測試', () => {
    it('應該正確渲染基本按鈕', () => {
      render(<Button>測試按鈕</Button>);
      
      const button = screen.getByRole('button', { name: '測試按鈕' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('測試按鈕');
    });

    it('應該有正確的 data 屬性', () => {
      render(<Button>測試按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
      expect(button).toHaveAttribute('data-oid', 'x676yg7');
    });

    it('應該正確處理點擊事件', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>點擊我</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('應該支援自定義 className', () => {
      render(<Button className="custom-class">測試按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('變體 (Variants) 測試', () => {
    it('應該渲染 default 變體', () => {
      render(<Button variant="default">Default 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('應該渲染 destructive 變體', () => {
      render(<Button variant="destructive">Destructive 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-white');
    });

    it('應該渲染 outline 變體', () => {
      render(<Button variant="outline">Outline 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('應該渲染 secondary 變體', () => {
      render(<Button variant="secondary">Secondary 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('應該渲染 ghost 變體', () => {
      render(<Button variant="ghost">Ghost 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('應該渲染 link 變體', () => {
      render(<Button variant="link">Link 按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('大小 (Sizes) 測試', () => {
    it('應該渲染 default 大小', () => {
      render(<Button size="default">Default 大小</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'py-2');
    });

    it('應該渲染 sm 大小', () => {
      render(<Button size="sm">Small 大小</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3');
    });

    it('應該渲染 lg 大小', () => {
      render(<Button size="lg">Large 大小</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-6');
    });

    it('應該渲染 icon 大小', () => {
      render(<Button size="icon">🔍</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });
  });

  describe('asChild 屬性測試', () => {
    it('asChild=false 時應該渲染為 button 元素', () => {
      render(<Button asChild={false}>普通按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('asChild=true 時應該使用 Slot 組件', () => {
      render(
        <Button asChild={true}>
          <a href="/test">連結按鈕</a>
        </Button>
      );
      
      // 當使用 asChild 時，應該有我們 mock 的 Slot 行為
      const element = screen.getByText('連結按鈕');
      expect(element).toBeInTheDocument();
    });

    it('預設情況下 asChild 應該為 false', () => {
      render(<Button>預設按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('狀態測試', () => {
    it('應該正確處理禁用狀態', () => {
      render(<Button disabled>禁用按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('禁用狀態下不應該觸發點擊事件', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>禁用按鈕</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('組合屬性測試', () => {
    it('應該正確組合 variant 和 size', () => {
      render(<Button variant="outline" size="lg">大型邊框按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border'); // outline variant
      expect(button).toHaveClass('h-10'); // lg size
    });

    it('應該正確組合所有屬性', () => {
      const handleClick = jest.fn();
      render(
        <Button 
          variant="secondary" 
          size="sm" 
          className="extra-class"
          onClick={handleClick}
          disabled={false}
        >
          完整測試按鈕
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary'); // variant
      expect(button).toHaveClass('h-8'); // size
      expect(button).toHaveClass('extra-class'); // custom class
      expect(button).not.toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('可訪問性測試', () => {
    it('應該支援 aria-label', () => {
      render(<Button aria-label="關閉對話框">×</Button>);
      
      const button = screen.getByRole('button', { name: '關閉對話框' });
      expect(button).toBeInTheDocument();
    });

    it('應該支援 aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="help-text">提交</Button>
          <div id="help-text">點擊此按鈕提交表單</div>
        </div>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('應該支援 type 屬性', () => {
      render(<Button type="submit">提交按鈕</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('事件處理測試', () => {
    it('應該正確處理 onMouseEnter 事件', () => {
      const handleMouseEnter = jest.fn();
      render(<Button onMouseEnter={handleMouseEnter}>Hover 按鈕</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);
      
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('應該正確處理 onFocus 事件', () => {
      const handleFocus = jest.fn();
      render(<Button onFocus={handleFocus}>Focus 按鈕</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('應該正確處理鍵盤事件', () => {
      const handleKeyDown = jest.fn();
      render(<Button onKeyDown={handleKeyDown}>鍵盤按鈕</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyDown).toHaveBeenCalledWith(expect.objectContaining({
        key: 'Enter'
      }));
    });
  });

  describe('buttonVariants 函數測試', () => {
    it('應該產生正確的基礎 class', () => {
      const result = buttonVariants();
      expect(result).toContain('inline-flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-center');
    });

    it('應該正確應用 variant', () => {
      const destructiveVariant = buttonVariants({ variant: 'destructive' });
      expect(destructiveVariant).toContain('bg-destructive');
      expect(destructiveVariant).toContain('text-white');
    });

    it('應該正確應用 size', () => {
      const smallSize = buttonVariants({ size: 'sm' });
      expect(smallSize).toContain('h-8');
      expect(smallSize).toContain('px-3');
    });

    it('應該正確組合多個變體', () => {
      const combined = buttonVariants({ 
        variant: 'outline', 
        size: 'lg',
        className: 'custom-class'
      });
      expect(combined).toContain('border'); // outline
      expect(combined).toContain('h-10'); // lg
      expect(combined).toContain('custom-class');
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理空的 children', () => {
      render(<Button></Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    it('應該處理複雜的 children', () => {
      render(
        <Button>
          <span>圖示</span>
          <strong>重要文字</strong>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('圖示')).toBeInTheDocument();
      expect(screen.getByText('重要文字')).toBeInTheDocument();
    });

    it('應該處理數字 children', () => {
      render(<Button>{42}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('42');
    });
  });
});