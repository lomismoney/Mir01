import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '../toast';

describe('Toast 組件測試', () => {
  it('應該正確渲染 ToastProvider', () => {
    render(
      <ToastProvider data-testid="provider">
        <div>子元素</div>
      </ToastProvider>
    );
    
    expect(screen.getByText('子元素')).toBeInTheDocument();
  });

  it('應該正確渲染 ToastViewport', () => {
    render(
      <ToastProvider>
        <ToastViewport data-testid="viewport" />
      </ToastProvider>
    );
    
    const viewport = screen.getByTestId('viewport');
    expect(viewport).toBeInTheDocument();
    expect(viewport).toHaveClass('fixed', 'top-0', 'z-[100]', 'flex', 'max-h-screen', 'w-full');
  });

  it('應該正確渲染基本 Toast', () => {
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast data-testid="toast" open={true}>
          <ToastTitle data-testid="title">通知標題</ToastTitle>
          <ToastDescription data-testid="description">通知描述</ToastDescription>
        </Toast>
      </ToastProvider>
    );
    
    const toast = screen.getByTestId('toast');
    const title = screen.getByTestId('title');
    const description = screen.getByTestId('description');
    
    expect(toast).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('通知標題');
    expect(title).toHaveClass('text-sm', 'font-semibold');
    
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent('通知描述');
    expect(description).toHaveClass('text-sm', 'opacity-90');
  });

  it('應該支援不同變體', () => {
    const { rerender } = render(
      <ToastProvider>
        <ToastViewport />
        <Toast variant="default" open={true} data-testid="toast">
          預設通知
        </Toast>
      </ToastProvider>
    );
    
    let toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('border', 'bg-background', 'text-foreground');
    
    rerender(
      <ToastProvider>
        <ToastViewport />
        <Toast variant="destructive" open={true} data-testid="toast">
          錯誤通知
        </Toast>
      </ToastProvider>
    );
    
    toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('destructive', 'group', 'border-destructive', 'bg-destructive');
  });

  it('應該正確渲染 ToastClose', async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast open={true}>
          <ToastClose onClick={handleClose} data-testid="close" />
        </Toast>
      </ToastProvider>
    );
    
    const closeButton = screen.getByTestId('close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('absolute', 'right-2', 'top-2', 'rounded-md');
    
    // 檢查 X 圖標
    const xIcon = closeButton.querySelector('svg');
    expect(xIcon).toBeInTheDocument();
    
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('應該正確渲染 ToastAction', async () => {
    const user = userEvent.setup();
    const handleAction = jest.fn();
    
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast open={true}>
          <ToastAction onClick={handleAction} altText="重試動作" data-testid="action">
            重試
          </ToastAction>
        </Toast>
      </ToastProvider>
    );
    
    const actionButton = screen.getByTestId('action');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent('重試');
    expect(actionButton).toHaveClass('inline-flex', 'h-8', 'shrink-0', 'items-center');
    
    await user.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('應該支援自定義 className', () => {
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast className="custom-toast" open={true} data-testid="toast">
          <ToastTitle className="custom-title" data-testid="title">標題</ToastTitle>
          <ToastDescription className="custom-desc" data-testid="desc">描述</ToastDescription>
        </Toast>
      </ToastProvider>
    );
    
    expect(screen.getByTestId('toast')).toHaveClass('custom-toast');
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
    expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
  });

  it('應該正確渲染完整的 Toast 範例', () => {
    render(
      <ToastProvider>
        <ToastViewport />
        <Toast variant="destructive" open={true} data-testid="complete-toast">
          <ToastTitle>操作失敗</ToastTitle>
          <ToastDescription>
            無法保存檔案，請稍後重試。
          </ToastDescription>
          <ToastAction altText="重試操作" data-testid="retry-action">重試</ToastAction>
          <ToastClose data-testid="close-button" />
        </Toast>
      </ToastProvider>
    );
    
    expect(screen.getByText('操作失敗')).toBeInTheDocument();
    expect(screen.getByText('無法保存檔案，請稍後重試。')).toBeInTheDocument();
    expect(screen.getByTestId('retry-action')).toBeInTheDocument();
    expect(screen.getByTestId('close-button')).toBeInTheDocument();
  });
}); 