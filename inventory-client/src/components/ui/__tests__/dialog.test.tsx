import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../dialog';

describe('Dialog 組件測試', () => {
  it('應該正確渲染 Dialog 組件', () => {
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟對話框</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>對話框標題</DialogTitle>
            <DialogDescription>對話框描述</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('開啟對話框');
  });

  it('應該支援點擊觸發器開啟對話框', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>測試對話框</DialogTitle>
            <DialogDescription>這是一個測試對話框</DialogDescription>
          </DialogHeader>
          <p>對話框內容</p>
        </DialogContent>
      </Dialog>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態內容應該不可見
    expect(screen.queryByText('對話框內容')).not.toBeInTheDocument();
    
    // 點擊觸發器
    await user.click(trigger);
    
    // 等待內容出現
    await waitFor(() => {
      expect(screen.getByText('對話框內容')).toBeInTheDocument();
    });
  });

  it('應該正確渲染 DialogHeader 組件', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟</DialogTrigger>
        <DialogContent>
          <DialogHeader data-testid="header">
            <DialogTitle data-testid="title">重要通知</DialogTitle>
            <DialogDescription data-testid="description">
              請仔細閱讀以下內容
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const header = screen.getByTestId('header');
      const title = screen.getByTestId('title');
      const description = screen.getByTestId('description');
      
      expect(header).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(description).toBeInTheDocument();
      
      expect(title).toHaveTextContent('重要通知');
      expect(description).toHaveTextContent('請仔細閱讀以下內容');
    });
  });

  it('應該正確渲染 DialogFooter 組件', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認操作</DialogTitle>
          </DialogHeader>
          <p>您確定要執行此操作嗎？</p>
          <DialogFooter data-testid="footer">
            <button>取消</button>
            <button>確認</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('確認')).toBeInTheDocument();
    });
  });

  it('應該支援 DialogClose 關閉對話框', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>可關閉對話框</DialogTitle>
          </DialogHeader>
          <p>對話框內容</p>
          <DialogFooter>
            <DialogClose data-testid="close">關閉</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟對話框
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('對話框內容')).toBeInTheDocument();
    });
    
    // 關閉對話框
    const closeButton = screen.getByTestId('close');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('對話框內容')).not.toBeInTheDocument();
    });
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Dialog open={false}>
        <DialogTrigger>開啟</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>受控對話框</DialogTitle>
          </DialogHeader>
          <p>受控內容</p>
        </DialogContent>
      </Dialog>
    );
    
    // 初始狀態關閉
    expect(screen.queryByText('受控內容')).not.toBeInTheDocument();
    
    // 設置為開啟
    rerender(
      <Dialog open={true}>
        <DialogTrigger>開啟</DialogTrigger>
        <DialogContent data-testid="content">
          <DialogHeader>
            <DialogTitle>受控對話框</DialogTitle>
          </DialogHeader>
          <p>受控內容</p>
        </DialogContent>
      </Dialog>
    );
    
    expect(screen.getByText('受控內容')).toBeInTheDocument();
  });

  it('應該支援自定義 className', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger" data-testid="trigger">
          觸發器
        </DialogTrigger>
        <DialogContent className="custom-content" data-testid="content">
          <DialogHeader className="custom-header" data-testid="header">
            <DialogTitle className="custom-title" data-testid="title">
              標題
            </DialogTitle>
            <DialogDescription className="custom-desc" data-testid="desc">
              描述
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer" data-testid="footer">
            <button>按鈕</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
      expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  it('應該支援 ESC 鍵關閉對話框', async () => {
    const user = userEvent.setup();
    
    render(
      <Dialog>
        <DialogTrigger data-testid="trigger">開啟</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>可用 ESC 關閉</DialogTitle>
          </DialogHeader>
          <p>按 ESC 鍵關閉此對話框</p>
        </DialogContent>
      </Dialog>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟對話框
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('按 ESC 鍵關閉此對話框')).toBeInTheDocument();
    });
    
    // 按 ESC 鍵關閉
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByText('按 ESC 鍵關閉此對話框')).not.toBeInTheDocument();
    });
  });

  it('應該支援 onOpenChange 回調', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();
    
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger data-testid="trigger">觸發器</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回調測試</DialogTitle>
          </DialogHeader>
          <p>內容</p>
        </DialogContent>
      </Dialog>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 開啟對話框
    await user.click(trigger);
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });
}); 