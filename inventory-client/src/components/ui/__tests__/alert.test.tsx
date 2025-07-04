import React from 'react';
import { render, screen } from '@testing-library/react';
import { Alert, AlertDescription, AlertTitle } from '../alert';

describe('Alert 組件測試', () => {
  it('應該正確渲染 Alert 組件', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>警告標題</AlertTitle>
        <AlertDescription>這是警告描述</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('應該正確渲染 AlertTitle', () => {
    render(
      <Alert>
        <AlertTitle data-testid="title">測試標題</AlertTitle>
      </Alert>
    );
    
    const title = screen.getByTestId('title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
    expect(title).toHaveTextContent('測試標題');
  });

  it('應該正確渲染 AlertDescription', () => {
    render(
      <Alert>
        <AlertDescription data-testid="description">測試描述</AlertDescription>
      </Alert>
    );
    
    const description = screen.getByTestId('description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
    expect(description).toHaveTextContent('測試描述');
  });

  it('應該支援不同的變體', () => {
    const { rerender } = render(
      <Alert variant="default" data-testid="alert">
        <AlertTitle>預設警告</AlertTitle>
      </Alert>
    );
    
    let alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('bg-background', 'text-foreground');
    
    rerender(
      <Alert variant="destructive" data-testid="alert">
        <AlertTitle>危險警告</AlertTitle>
      </Alert>
    );
    
    alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive', 'dark:border-destructive');
  });

  it('應該支援自定義 className', () => {
    render(
      <Alert className="custom-alert" data-testid="alert">
        <AlertTitle className="custom-title" data-testid="title">
          標題
        </AlertTitle>
        <AlertDescription className="custom-description" data-testid="description">
          描述
        </AlertDescription>
      </Alert>
    );
    
    expect(screen.getByTestId('alert')).toHaveClass('custom-alert');
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
    expect(screen.getByTestId('description')).toHaveClass('custom-description');
  });

  it('應該正確處理複雜內容', () => {
    render(
      <Alert>
        <AlertTitle>複雜警告</AlertTitle>
        <AlertDescription>
          這是一個包含 <strong>粗體文字</strong> 和 <em>斜體文字</em> 的描述。
          <p>還包含段落標籤。</p>
        </AlertDescription>
      </Alert>
    );
    
    expect(screen.getByText('複雜警告')).toBeInTheDocument();
    expect(screen.getByText('粗體文字')).toBeInTheDocument();
    expect(screen.getByText('斜體文字')).toBeInTheDocument();
    expect(screen.getByText('還包含段落標籤。')).toBeInTheDocument();
  });

  it('應該能夠只包含標題', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle>僅標題警告</AlertTitle>
      </Alert>
    );
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('僅標題警告')).toBeInTheDocument();
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('應該能夠只包含描述', () => {
    render(
      <Alert data-testid="alert">
        <AlertDescription>僅描述警告</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('僅描述警告')).toBeInTheDocument();
  });

  it('應該正確處理空內容', () => {
    render(<Alert data-testid="alert" />);
    
    const alert = screen.getByTestId('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toBeEmptyDOMElement();
  });
}); 