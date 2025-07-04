import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from '../toggle';

describe('Toggle 組件測試', () => {
  it('應該正確渲染 Toggle 組件', () => {
    render(<Toggle data-testid="toggle">切換</Toggle>);
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('切換');
    expect(toggle).toHaveAttribute('type', 'button');
  });

  it('應該支援點擊切換狀態', async () => {
    const user = userEvent.setup();
    const handlePressedChange = jest.fn();
    
    render(
      <Toggle onPressedChange={handlePressedChange} data-testid="toggle">
        切換
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    
    await user.click(toggle);
    expect(handlePressedChange).toHaveBeenCalledWith(true);
    
    await user.click(toggle);
    expect(handlePressedChange).toHaveBeenCalledWith(false);
  });

  it('應該支援預設按下狀態', () => {
    render(
      <Toggle defaultPressed={true} data-testid="toggle">
        切換
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('data-state', 'on');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Toggle pressed={false} data-testid="toggle">
        切換
      </Toggle>
    );
    
    let toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('data-state', 'off');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    
    rerender(
      <Toggle pressed={true} data-testid="toggle">
        切換
      </Toggle>
    );
    
    toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('data-state', 'on');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('應該支援 disabled 狀態', () => {
    render(
      <Toggle disabled data-testid="toggle">
        切換
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toBeDisabled();
  });

  it('應該支援不同大小', () => {
    const { rerender } = render(
      <Toggle size="sm" data-testid="toggle">
        小
      </Toggle>
    );
    
    let toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('h-8', 'px-1.5', 'min-w-8');
    
    rerender(
      <Toggle size="lg" data-testid="toggle">
        大
      </Toggle>
    );
    
    toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('h-10', 'px-2.5', 'min-w-10');
  });

  it('應該支援不同變體', () => {
    const { rerender } = render(
      <Toggle variant="default" data-testid="toggle">
        預設
      </Toggle>
    );
    
    let toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('bg-transparent');
    
    rerender(
      <Toggle variant="outline" data-testid="toggle">
        輪廓
      </Toggle>
    );
    
    toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('border', 'border-input');
  });

  it('應該支援自定義 className', () => {
    render(
      <Toggle className="custom-toggle-class" data-testid="toggle">
        自定義
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveClass('custom-toggle-class');
  });

  it('應該支援鍵盤操作', async () => {
    const user = userEvent.setup();
    const handlePressedChange = jest.fn();
    
    render(
      <Toggle onPressedChange={handlePressedChange} data-testid="toggle">
        切換
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    
    toggle.focus();
    expect(toggle).toHaveFocus();
    
    // 第一次按 Enter，應該切換到 true
    await user.keyboard('{Enter}');
    expect(handlePressedChange).toHaveBeenCalledWith(true);
    
    // 清除 mock 調用記錄
    handlePressedChange.mockClear();
    
    // 第二次按 Enter，應該切換到 false（因為當前狀態是 true）
    await user.keyboard('{Enter}');
    expect(handlePressedChange).toHaveBeenCalledWith(false);
  });

  it('應該支援 aria 標籤', () => {
    render(
      <Toggle aria-label="切換設定" data-testid="toggle">
        切換
      </Toggle>
    );
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('aria-label', '切換設定');
  });

  it('應該作為 button 元素渲染', () => {
    render(<Toggle data-testid="toggle">切換</Toggle>);
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle.tagName).toBe('BUTTON');
  });
}); 