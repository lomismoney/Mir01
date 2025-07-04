import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from '../popover';

describe('Popover 組件測試', () => {
  it('應該正確渲染 Popover 組件', () => {
    render(
      <Popover data-testid="popover">
        <PopoverTrigger data-testid="trigger">開啟彈出框</PopoverTrigger>
        <PopoverContent data-testid="content">
          <p>彈出框內容</p>
        </PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('開啟彈出框');
  });

  it('應該正確設置 data-slot 屬性', () => {
    render(
      <Popover>
        <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
        <PopoverContent data-testid="content">內容</PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toHaveAttribute('data-slot', 'popover-trigger');
  });

  it('應該支援點擊觸發器顯示內容', async () => {
    const user = userEvent.setup();
    
    render(
      <Popover>
        <PopoverTrigger data-testid="trigger">點擊開啟</PopoverTrigger>
        <PopoverContent data-testid="content">
          <p>這是彈出框內容</p>
        </PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態內容應該不可見
    expect(screen.queryByText('這是彈出框內容')).not.toBeInTheDocument();
    
    // 點擊觸發器
    await user.click(trigger);
    
    // 等待內容出現
    await waitFor(() => {
      expect(screen.getByText('這是彈出框內容')).toBeInTheDocument();
    });
    
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'popover-content');
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Popover open={false}>
        <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
        <PopoverContent data-testid="content">
          <p>受控內容</p>
        </PopoverContent>
      </Popover>
    );
    
    // 初始狀態關閉
    expect(screen.queryByText('受控內容')).not.toBeInTheDocument();
    
    // 設置為開啟
    rerender(
      <Popover open={true}>
        <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
        <PopoverContent data-testid="content">
          <p>受控內容</p>
        </PopoverContent>
      </Popover>
    );
    
    expect(screen.getByText('受控內容')).toBeInTheDocument();
  });

  it('應該正確設置內容的對齊方式和偏移', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>觸發器</PopoverTrigger>
        <PopoverContent align="start" sideOffset={10} data-testid="content">
          內容
        </PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-slot', 'popover-content');
  });

  it('應該支援自定義 className', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger className="custom-trigger" data-testid="trigger">
          觸發器
        </PopoverTrigger>
        <PopoverContent className="custom-content" data-testid="content">
          內容
        </PopoverContent>
      </Popover>
    );
    
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('應該正確渲染 PopoverAnchor', () => {
    render(
      <Popover open={true}>
        <PopoverAnchor data-testid="anchor">
          <div>錨點元素</div>
        </PopoverAnchor>
        <PopoverTrigger>觸發器</PopoverTrigger>
        <PopoverContent>內容</PopoverContent>
      </Popover>
    );
    
    const anchor = screen.getByTestId('anchor');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('data-slot', 'popover-anchor');
    expect(screen.getByText('錨點元素')).toBeInTheDocument();
  });

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(
      <Popover>
        <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
        <PopoverContent data-testid="content">
          <button data-testid="close-btn">關閉</button>
        </PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 使用 Tab 聚焦到觸發器
    trigger.focus();
    expect(trigger).toHaveFocus();
    
    // 使用 Enter 鍵開啟
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByTestId('close-btn')).toBeInTheDocument();
    });
  });

  it('應該支援 onOpenChange 回調', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();
    
    render(
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger data-testid="trigger">觸發器</PopoverTrigger>
        <PopoverContent>內容</PopoverContent>
      </Popover>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    await user.click(trigger);
    
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('應該具備正確的樣式類別', () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>觸發器</PopoverTrigger>
        <PopoverContent data-testid="content">內容</PopoverContent>
      </Popover>
    );
    
    const content = screen.getByTestId('content');
    expect(content).toHaveClass(
      'bg-popover',
      'text-popover-foreground',
      'z-50',
      'w-72',
      'rounded-md',
      'border',
      'p-4',
      'shadow-md'
    );
  });
}); 