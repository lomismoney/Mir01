import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../switch';

describe('Switch 組件測試', () => {
  it('應該正確渲染 Switch', () => {
    render(<Switch data-testid="switch" />);
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveRole('switch');
  });

  it('應該支援點擊切換', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange}
        data-testid="switch" 
      />
    );
    
    const switchElement = screen.getByTestId('switch');
    
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('應該支援受控狀態', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        checked={true}
        onCheckedChange={handleChange}
        data-testid="switch" 
      />
    );
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
    
    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('應該支援 disabled 狀態', () => {
    render(<Switch disabled data-testid="switch" />);
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toBeDisabled();
  });

  it('應該支援鍵盤操作', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Switch 
        onCheckedChange={handleChange}
        data-testid="switch" 
      />
    );
    
    const switchElement = screen.getByTestId('switch');
    
    // 使用 Tab 聚焦，然後按 Enter 或 Space
    await user.tab();
    expect(switchElement).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('應該支援自定義 className', () => {
    render(
      <Switch 
        className="custom-switch-class" 
        data-testid="switch" 
      />
    );
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveClass('custom-switch-class');
  });

  it('應該包含基本樣式類別', () => {
    render(<Switch data-testid="switch" />);
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveClass('peer', 'inline-flex');
    expect(switchElement).toHaveClass('rounded-full', 'border');
  });

  it('應該顯示正確的狀態指示器', () => {
    const { rerender } = render(<Switch checked={false} data-testid="switch" />);
    
    let switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    
    rerender(<Switch checked={true} data-testid="switch" />);
    
    switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('應該支援 aria 標籤', () => {
    render(
      <Switch 
        aria-label="開關設定"
        data-testid="switch" 
      />
    );
    
    const switchElement = screen.getByTestId('switch');
    expect(switchElement).toHaveAttribute('aria-label', '開關設定');
  });

  it('應該包含 thumb 指示器', () => {
    render(<Switch data-testid="switch" />);
    
    const switchElement = screen.getByTestId('switch');
    const thumb = switchElement.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).toBeInTheDocument();
  });
}); 