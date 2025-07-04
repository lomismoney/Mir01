import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '../sheet';

describe('Sheet 組件測試', () => {
  it('應該正確渲染 Sheet 組件', () => {
    render(
      <Sheet data-testid="sheet">
        <SheetTrigger data-testid="trigger">開啟側邊欄</SheetTrigger>
        <SheetContent data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <p>側邊欄內容</p>
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('開啟側邊欄');
    expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
  });

  it('應該支援點擊觸發器開啟側邊欄', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">開啟</SheetTrigger>
        <SheetContent data-testid="content">
          <SheetHeader>
            <SheetTitle>側邊欄標題</SheetTitle>
            <SheetDescription>側邊欄描述</SheetDescription>
          </SheetHeader>
          <p>這是側邊欄內容</p>
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態內容應該不可見
    expect(screen.queryByText('這是側邊欄內容')).not.toBeInTheDocument();
    
    // 點擊觸發器
    await user.click(trigger);
    
    // 等待內容出現
    await waitFor(() => {
      expect(screen.getByText('這是側邊欄內容')).toBeInTheDocument();
    });
    
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'sheet-content');
  });

  it('應該正確渲染 SheetHeader 和相關組件', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">開啟</SheetTrigger>
        <SheetContent>
          <SheetHeader data-testid="header">
            <SheetTitle data-testid="title">側邊欄標題</SheetTitle>
            <SheetDescription data-testid="description">
              這是側邊欄的描述文字
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'sheet-header');
      expect(header).toHaveClass('flex', 'flex-col', 'gap-1.5', 'p-4');
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'sheet-title');
      expect(title).toHaveClass('text-foreground', 'font-semibold');
      expect(title).toHaveTextContent('側邊欄標題');
      
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'sheet-description');
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
      expect(description).toHaveTextContent('這是側邊欄的描述文字');
    });
  });

  it('應該正確渲染 SheetFooter', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">開啟</SheetTrigger>
        <SheetContent>
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <SheetFooter data-testid="footer">
            <button>確認</button>
            <button>取消</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'sheet-footer');
      expect(footer).toHaveClass('mt-auto', 'flex', 'flex-col', 'gap-2', 'p-4');
      expect(screen.getByText('確認')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  it('應該支援不同的側邊方向', () => {
    const { rerender } = render(
      <Sheet open={true}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent side="right" data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          右側內容
        </SheetContent>
      </Sheet>
    );
    
    let content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('right-0', 'border-l');
    
    rerender(
      <Sheet open={true}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent side="left" data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          左側內容
        </SheetContent>
      </Sheet>
    );
    
    content = screen.getByTestId('content');
    expect(content).toHaveClass('left-0', 'border-r');
    
    rerender(
      <Sheet open={true}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent side="top" data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          頂部內容
        </SheetContent>
      </Sheet>
    );
    
    content = screen.getByTestId('content');
    expect(content).toHaveClass('top-0', 'border-b');
    
    rerender(
      <Sheet open={true}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent side="bottom" data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          底部內容
        </SheetContent>
      </Sheet>
    );
    
    content = screen.getByTestId('content');
    expect(content).toHaveClass('bottom-0', 'border-t');
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Sheet open={false}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <p>受控內容</p>
        </SheetContent>
      </Sheet>
    );
    
    // 初始狀態關閉
    expect(screen.queryByText('受控內容')).not.toBeInTheDocument();
    
    // 設置為開啟
    rerender(
      <Sheet open={true}>
        <SheetTrigger>觸發器</SheetTrigger>
        <SheetContent data-testid="content">
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <p>受控內容</p>
        </SheetContent>
      </Sheet>
    );
    
    expect(screen.getByText('受控內容')).toBeInTheDocument();
  });

  it('應該包含關閉按鈕並能關閉側邊欄', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">開啟</SheetTrigger>
        <SheetContent>
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <p>內容</p>
          {/* SheetContent 自動包含關閉按鈕 */}
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟側邊欄
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('內容')).toBeInTheDocument();
    });
    
    // 找到關閉按鈕（X 圖標）
    const closeButton = screen.getByText('Close').closest('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('應該支援 SheetClose 組件', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">開啟</SheetTrigger>
        <SheetContent>
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          <p>側邊欄內容</p>
          <SheetClose data-testid="close">自定義關閉</SheetClose>
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟側邊欄
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('側邊欄內容')).toBeInTheDocument();
    });
    
    // 檢查自定義關閉按鈕存在
    const closeButton = screen.getByTestId('close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('data-slot', 'sheet-close');
    expect(closeButton).toHaveTextContent('自定義關閉');
  });

  it('應該支援自定義 className', async () => {
    const user = userEvent.setup();
    
    render(
      <Sheet>
        <SheetTrigger className="custom-trigger" data-testid="trigger">
          觸發器
        </SheetTrigger>
        <SheetContent className="custom-content" data-testid="content">
          <SheetHeader className="custom-header" data-testid="header">
            <SheetTitle className="custom-title" data-testid="title">
              標題
            </SheetTitle>
            <SheetDescription>測試描述</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
    
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
    });
  });

  it('應該支援 onOpenChange 回調', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();
    
    render(
      <Sheet onOpenChange={handleOpenChange}>
        <SheetTrigger data-testid="trigger">觸發器</SheetTrigger>
        <SheetContent>
          <SheetTitle>測試標題</SheetTitle>
          <SheetDescription>測試描述</SheetDescription>
          內容
        </SheetContent>
      </Sheet>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟側邊欄
    await user.click(trigger);
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });
}); 