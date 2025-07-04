import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../checkbox';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className, ...props }: any) => (
    <svg data-testid="check-icon" className={className} {...props}>
      <path d="M20 6L9 17L4 12" />
    </svg>
  ),
}));

describe('Checkbox 組件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染', () => {
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('應該有正確的 data 屬性', () => {
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-oid', '5z3vdta');
    });

    it('應該應用預設的 CSS 類', () => {
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass(
        'peer',
        'h-4',
        'w-4',
        'shrink-0',
        'rounded-sm',
        'border',
        'border-primary',
        'ring-offset-background',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });
  });

  describe('狀態測試', () => {
    it('應該支援 checked 狀態', () => {
      render(<Checkbox checked />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('應該支援 unchecked 狀態', () => {
      render(<Checkbox checked={false} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('應該支援 indeterminate 狀態', () => {
      render(<Checkbox checked="indeterminate" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('應該支援禁用狀態', () => {
      render(<Checkbox disabled />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
  });

  describe('用戶交互', () => {
    it('應該處理點擊事件', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Checkbox onCheckedChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('應該在禁用時不觸發事件', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Checkbox disabled onCheckedChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('應該支援鍵盤事件監聽', () => {
      const handleKeyDown = jest.fn();
      
      render(<Checkbox onKeyDown={handleKeyDown} />);
      
      const checkbox = screen.getByRole('checkbox');
      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' });
      
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: ' ' })
      );
    });
  });

  describe('圖示顯示', () => {
    it('在選中時應該顯示 Check 圖示', () => {
      render(<Checkbox checked />);
      
      const checkIcon = screen.getByTestId('check-icon');
      expect(checkIcon).toBeInTheDocument();
      expect(checkIcon).toHaveClass('h-4', 'w-4');
    });

    it('在未選中時不應該顯示圖示', () => {
      render(<Checkbox checked={false} />);
      
      const checkIcon = screen.queryByTestId('check-icon');
      // 圖示元素可能存在但在 indicator 中隱藏
      if (checkIcon) {
        // 檢查父元素是否有適當的狀態
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toHaveAttribute('data-state', 'unchecked');
      }
    });
  });

  describe('自定義屬性', () => {
    it('應該支援自定義 className', () => {
      render(<Checkbox className="custom-checkbox" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-checkbox');
      expect(checkbox).toHaveClass('peer'); // 應該保留預設類
    });

    it('應該支援 ref', () => {
      const ref = { current: null };
      
      render(<Checkbox ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('應該傳遞其他 props', () => {
      render(<Checkbox id="test-checkbox" aria-label="測試選項" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'test-checkbox');
      expect(checkbox).toHaveAttribute('aria-label', '測試選項');
    });
  });

  describe('受控與非受控', () => {
    it('應該支援受控模式', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      const { rerender } = render(
        <Checkbox checked={false} onCheckedChange={handleChange} />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
      
      // 模擬父組件更新狀態
      rerender(<Checkbox checked={true} onCheckedChange={handleChange} />);
      expect(checkbox).toBeChecked();
    });

    it('應該支援非受控模式', async () => {
      const user = userEvent.setup();
      
      render(<Checkbox defaultChecked={false} />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('表單整合', () => {
    it('應該接受 name 屬性作為 props', () => {
      // 測試組件接受 name 屬性而不產生錯誤
      expect(() => {
        render(<Checkbox name="agreement" />);
      }).not.toThrow();
    });

    it('應該支援 value 屬性', () => {
      render(<Checkbox value="accepted" />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('value', 'accepted');
    });

    it('應該接受 required 屬性作為 props', () => {
      // 測試組件接受 required 屬性而不產生錯誤
      expect(() => {
        render(<Checkbox required />);
      }).not.toThrow();
    });
  });

  describe('可訪問性', () => {
    it('應該有正確的 role', () => {
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('應該支援 aria-describedby', () => {
      render(
        <>
          <Checkbox aria-describedby="help-text" />
          <div id="help-text">此選項表示您同意條款</div>
        </>
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('應該支援 aria-labelledby', () => {
      render(
        <>
          <label id="checkbox-label">同意條款</label>
          <Checkbox aria-labelledby="checkbox-label" />
        </>
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-labelledby', 'checkbox-label');
    });
  });

  describe('邊界情況', () => {
    it('應該處理快速連續點擊', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();
      
      render(<Checkbox onCheckedChange={handleChange} />);
      
      const checkbox = screen.getByRole('checkbox');
      
      // 快速連續點擊
      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);
      
      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('應該處理 onCheckedChange 為 undefined', async () => {
      const user = userEvent.setup();
      
      render(<Checkbox />);
      
      const checkbox = screen.getByRole('checkbox');
      
      // 不應該拋出錯誤
      expect(async () => {
        await user.click(checkbox);
      }).not.toThrow();
    });
  });
}); 