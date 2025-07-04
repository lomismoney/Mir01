import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from '../drawer';

describe('Drawer 組件測試', () => {
  it('應該正確渲染 Drawer 組件', () => {
    render(
      <Drawer data-testid="drawer">
        <DrawerTrigger data-testid="trigger">開啟抽屜</DrawerTrigger>
        <DrawerContent data-testid="content">
          <p>抽屜內容</p>
        </DrawerContent>
      </Drawer>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('開啟抽屜');
    expect(trigger).toHaveAttribute('data-slot', 'drawer-trigger');
  });

  it('應該支援點擊觸發器開啟抽屜', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerContent data-testid="content">
          <DrawerHeader>
            <DrawerTitle>標題</DrawerTitle>
            <DrawerDescription>描述</DrawerDescription>
          </DrawerHeader>
          <p>這是抽屜內容</p>
        </DrawerContent>
      </Drawer>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態內容應該不可見
    expect(screen.queryByText('這是抽屜內容')).not.toBeInTheDocument();
    
    // 點擊觸發器
    await user.click(trigger);
    
    // 等待內容出現
    await waitFor(() => {
      expect(screen.getByText('這是抽屜內容')).toBeInTheDocument();
    });
    
    const content = screen.getByTestId('content');
    expect(content).toHaveAttribute('data-slot', 'drawer-content');
  });

  it('應該正確渲染 DrawerHeader', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader data-testid="header">
            <DrawerTitle data-testid="title">抽屜標題</DrawerTitle>
            <DrawerDescription data-testid="description">
              這是抽屜的描述文字
            </DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'drawer-header');
      expect(header).toHaveClass('flex', 'flex-col', 'gap-0.5', 'p-4');
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'drawer-title');
      expect(title).toHaveClass('text-foreground', 'font-semibold');
      expect(title).toHaveTextContent('抽屜標題');
      
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'drawer-description');
      expect(description).toHaveClass('text-muted-foreground', 'text-sm');
      expect(description).toHaveTextContent('這是抽屜的描述文字');
    });
  });

  it('應該正確渲染 DrawerFooter', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerContent>
          <DrawerFooter data-testid="footer">
            <button>確認</button>
            <button>取消</button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'drawer-footer');
      expect(footer).toHaveClass('mt-auto', 'flex', 'flex-col', 'gap-2', 'p-4');
      expect(screen.getByText('確認')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  it('應該支援 DrawerClose 關閉抽屜', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerContent>
          <p>抽屜內容</p>
          <DrawerClose data-testid="close">關閉</DrawerClose>
        </DrawerContent>
      </Drawer>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟抽屜
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('抽屜內容')).toBeInTheDocument();
    });
    
    // 檢查關閉按鈕存在並有正確屬性
    const closeButton = screen.getByTestId('close');
    expect(closeButton).toHaveAttribute('data-slot', 'drawer-close');
    expect(closeButton).toBeInTheDocument();
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Drawer open={false}>
        <DrawerTrigger>觸發器</DrawerTrigger>
        <DrawerContent data-testid="content">
          <p>受控內容</p>
        </DrawerContent>
      </Drawer>
    );
    
    // 初始狀態關閉
    expect(screen.queryByText('受控內容')).not.toBeInTheDocument();
    
    // 設置為開啟
    rerender(
      <Drawer open={true}>
        <DrawerTrigger>觸發器</DrawerTrigger>
        <DrawerContent data-testid="content">
          <p>受控內容</p>
        </DrawerContent>
      </Drawer>
    );
    
    expect(screen.getByText('受控內容')).toBeInTheDocument();
  });

  it('應該支援不同方向', () => {
    render(
      <Drawer direction="right" open={true}>
        <DrawerTrigger>觸發器</DrawerTrigger>
        <DrawerContent data-testid="content">
          右側抽屜
        </DrawerContent>
      </Drawer>
    );
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(screen.getByText('右側抽屜')).toBeInTheDocument();
  });

  it('應該正確渲染 DrawerPortal', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerPortal data-testid="portal">
          <DrawerOverlay data-testid="overlay" />
          <DrawerContent data-testid="content">
            Portal 內容
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByText('Portal 內容')).toBeInTheDocument();
    });
  });

  it('應該正確渲染 DrawerOverlay', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger data-testid="trigger">開啟</DrawerTrigger>
        <DrawerContent>
          <p>有覆蓋層的抽屜</p>
        </DrawerContent>
      </Drawer>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      // DrawerContent 內部自動包含 DrawerOverlay
      expect(screen.getByText('有覆蓋層的抽屜')).toBeInTheDocument();
    });
  });

  it('應該支援自定義 className', async () => {
    const user = userEvent.setup();
    
    render(
      <Drawer>
        <DrawerTrigger className="custom-trigger" data-testid="trigger">
          觸發器
        </DrawerTrigger>
        <DrawerContent className="custom-content" data-testid="content">
          <DrawerHeader className="custom-header" data-testid="header">
            <DrawerTitle className="custom-title" data-testid="title">
              標題
            </DrawerTitle>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
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
      <Drawer onOpenChange={handleOpenChange}>
        <DrawerTrigger data-testid="trigger">觸發器</DrawerTrigger>
        <DrawerContent>
          <DrawerClose data-testid="close">關閉</DrawerClose>
        </DrawerContent>
      </Drawer>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟抽屜
    await user.click(trigger);
    expect(handleOpenChange).toHaveBeenCalledWith(true);
    
    await waitFor(() => {
      expect(screen.getByTestId('close')).toBeInTheDocument();
    });
  });

  it('應該包含拖拽手柄（bottom 方向）', () => {
    render(
      <Drawer direction="bottom" open={true}>
        <DrawerTrigger>觸發器</DrawerTrigger>
        <DrawerContent data-testid="content">
          底部抽屜
        </DrawerContent>
      </Drawer>
    );
    
    const content = screen.getByTestId('content');
    
    // 檢查是否有拖拽手柄元素
    const dragHandle = content.querySelector('.bg-muted.mx-auto.mt-4.hidden.h-2.w-\\[100px\\]');
    expect(dragHandle).toBeInTheDocument();
  });
}); 