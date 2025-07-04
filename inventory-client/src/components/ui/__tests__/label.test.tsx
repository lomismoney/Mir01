import { render, screen, fireEvent } from '@testing-library/react';
import { Label } from '../label';

describe('Label 組件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染', () => {
      render(<Label>用戶名</Label>);
      
      const label = screen.getByText('用戶名');
      expect(label).toBeInTheDocument();
    });

    it('應該有正確的 data 屬性', () => {
      render(<Label>標籤</Label>);
      
      const label = screen.getByText('標籤');
      expect(label).toHaveAttribute('data-slot', 'label');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<Label>標籤</Label>);
      
      const label = screen.getByText('標籤');
      expect(label).toHaveClass(
        'flex',
        'items-center',
        'gap-2',
        'text-sm',
        'leading-none',
        'font-medium',
        'select-none'
      );
    });
  });

  describe('自定義屬性', () => {
    it('應該支援自定義 className', () => {
      render(<Label className="custom-label">標籤</Label>);
      
      const label = screen.getByText('標籤');
      expect(label).toHaveClass('custom-label');
      expect(label).toHaveClass('text-sm'); // 應該保留預設類
    });

    it('應該傳遞其他 props', () => {
      render(<Label id="test-label" data-testid="label">標籤</Label>);
      
      const label = screen.getByTestId('label');
      expect(label).toHaveAttribute('id', 'test-label');
    });

    it('應該支援 htmlFor 屬性', () => {
      render(<Label htmlFor="input-field">標籤</Label>);
      
      const label = screen.getByText('標籤');
      expect(label).toHaveAttribute('for', 'input-field');
    });
  });

  describe('表單關聯', () => {
    it('應該與輸入框正確關聯', () => {
      render(
        <div>
          <Label htmlFor="username">用戶名</Label>
          <input id="username" type="text" />
        </div>
      );
      
      const label = screen.getByText('用戶名');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'username');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('應該支援標籤點擊處理', () => {
      const handleClick = jest.fn();
      render(
        <div>
          <Label htmlFor="email" onClick={handleClick}>電子郵箱</Label>
          <input id="email" type="email" />
        </div>
      );
      
      const label = screen.getByText('電子郵箱');
      fireEvent.click(label);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('應該正確設置 for 屬性與 checkbox 關聯', () => {
      render(
        <div>
          <Label htmlFor="terms">同意條款</Label>
          <input id="terms" type="checkbox" />
        </div>
      );
      
      const label = screen.getByText('同意條款');
      const checkbox = screen.getByRole('checkbox');
      
      expect(label).toHaveAttribute('for', 'terms');
      expect(checkbox).toHaveAttribute('id', 'terms');
    });
  });

  describe('禁用狀態', () => {
    it('應該在群組禁用時應用禁用樣式', () => {
      render(
        <div data-disabled="true" className="group">
          <Label>禁用標籤</Label>
        </div>
      );
      
      const label = screen.getByText('禁用標籤');
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none');
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50');
    });

    it('應該在對等元素禁用時應用禁用樣式', () => {
      render(
        <div>
          <input disabled className="peer" />
          <Label>關聯標籤</Label>
        </div>
      );
      
      const label = screen.getByText('關聯標籤');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });
  });

  describe('內容變體', () => {
    it('應該支援純文字內容', () => {
      render(<Label>簡單標籤</Label>);
      
      const label = screen.getByText('簡單標籤');
      expect(label).toBeInTheDocument();
    });

    it('應該支援 HTML 內容', () => {
      render(
        <Label>
          <strong>重要</strong> 標籤
        </Label>
      );
      
      expect(screen.getByText('重要')).toBeInTheDocument();
      expect(screen.getByText('標籤')).toBeInTheDocument();
    });

    it('應該支援包含圖示的內容', () => {
      render(
        <Label>
          <svg data-testid="icon" width="16" height="16">
            <circle cx="8" cy="8" r="4" />
          </svg>
          帶圖示的標籤
        </Label>
      );
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('帶圖示的標籤')).toBeInTheDocument();
    });

    it('應該正確處理 gap 樣式', () => {
      render(
        <Label>
          <span>第一部分</span>
          <span>第二部分</span>
        </Label>
      );
      
      const label = screen.getByText('第一部分').closest('label');
      expect(label).toHaveClass('gap-2');
    });
  });

  describe('可訪問性', () => {
    it('應該有正確的語義', () => {
      render(<Label>標籤文字</Label>);
      
      const label = screen.getByText('標籤文字');
      expect(label.tagName).toBe('LABEL');
    });

    it('應該支援 aria-label', () => {
      render(<Label aria-label="自定義標籤">可見文字</Label>);
      
      const label = screen.getByText('可見文字');
      expect(label).toHaveAttribute('aria-label', '自定義標籤');
    });

    it('應該支援 aria-describedby', () => {
      render(
        <div>
          <Label aria-describedby="help-text">標籤</Label>
          <div id="help-text">幫助文字</div>
        </div>
      );
      
      const label = screen.getByText('標籤');
      expect(label).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('事件處理', () => {
    it('應該支援點擊事件', () => {
      const handleClick = jest.fn();
      
      render(<Label onClick={handleClick}>可點擊標籤</Label>);
      
      const label = screen.getByText('可點擊標籤');
      fireEvent.click(label);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('應該支援鍵盤事件', () => {
      const handleKeyDown = jest.fn();
      
      render(<Label onKeyDown={handleKeyDown}>標籤</Label>);
      
      const label = screen.getByText('標籤');
      fireEvent.keyDown(label, { key: 'Enter' });
      
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' })
      );
    });

    it('應該支援滑鼠事件', () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      
      render(
        <Label 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          標籤
        </Label>
      );
      
      const label = screen.getByText('標籤');
      fireEvent.mouseEnter(label);
      fireEvent.mouseLeave(label);
      
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('邊界情況', () => {
    it('應該處理空內容', () => {
      render(<Label data-testid="empty-label" />);
      
      // 應該能渲染但沒有可見內容
      const label = screen.getByTestId('empty-label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
      expect(label).toBeEmptyDOMElement();
    });

    it('應該處理很長的文字', () => {
      const longText = '這是一個非常長的標籤文字，用於測試組件是否能正確處理長內容而不會出現佈局問題';
      
      render(<Label>{longText}</Label>);
      
      const label = screen.getByText(longText);
      expect(label).toBeInTheDocument();
    });

    it('應該處理特殊字符', () => {
      const specialText = '標籤 & 符號 < > " \' 測試';
      
      render(<Label>{specialText}</Label>);
      
      const label = screen.getByText(specialText);
      expect(label).toBeInTheDocument();
    });
  });

  describe('樣式類別組合', () => {
    it('應該正確組合多個 className', () => {
      render(
        <Label className="text-red-500 font-bold custom-spacing">
          樣式標籤
        </Label>
      );
      
      const label = screen.getByText('樣式標籤');
      expect(label).toHaveClass('text-red-500', 'font-bold', 'custom-spacing');
      expect(label).toHaveClass('text-sm'); // 預設類應該被覆蓋
    });

    it('應該支援條件性 className', () => {
      const isActive = true;
      
      render(
        <Label className={`base-class ${isActive ? 'active' : 'inactive'}`}>
          條件標籤
        </Label>
      );
      
      const label = screen.getByText('條件標籤');
      expect(label).toHaveClass('base-class', 'active');
      expect(label).not.toHaveClass('inactive');
    });
  });
}); 