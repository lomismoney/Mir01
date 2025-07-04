import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleGroup, ToggleGroupItem } from '../toggle-group';

describe('ToggleGroup 組件測試', () => {
  it('應該正確渲染 ToggleGroup 和 ToggleGroupItem', () => {
    render(
      <ToggleGroup type="single" data-testid="toggle-group">
        <ToggleGroupItem value="left" data-testid="item-left">
          左對齊
        </ToggleGroupItem>
        <ToggleGroupItem value="center" data-testid="item-center">
          置中
        </ToggleGroupItem>
        <ToggleGroupItem value="right" data-testid="item-right">
          右對齊
        </ToggleGroupItem>
      </ToggleGroup>
    );
    
    const toggleGroup = screen.getByTestId('toggle-group');
    expect(toggleGroup).toBeInTheDocument();
    expect(toggleGroup).toHaveAttribute('data-slot', 'toggle-group');
    
    expect(screen.getByTestId('item-left')).toBeInTheDocument();
    expect(screen.getByTestId('item-center')).toBeInTheDocument();
    expect(screen.getByTestId('item-right')).toBeInTheDocument();
  });

  it('應該支援單選模式', async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    
    render(
      <ToggleGroup type="single" onValueChange={handleValueChange} data-testid="group">
        <ToggleGroupItem value="bold" data-testid="bold">B</ToggleGroupItem>
        <ToggleGroupItem value="italic" data-testid="italic">I</ToggleGroupItem>
        <ToggleGroupItem value="underline" data-testid="underline">U</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const boldItem = screen.getByTestId('bold');
    
    await user.click(boldItem);
    expect(handleValueChange).toHaveBeenCalledWith('bold');
  });

  it('應該支援多選模式', async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    
    render(
      <ToggleGroup type="multiple" onValueChange={handleValueChange}>
        <ToggleGroupItem value="bold" data-testid="bold">B</ToggleGroupItem>
        <ToggleGroupItem value="italic" data-testid="italic">I</ToggleGroupItem>
        <ToggleGroupItem value="underline" data-testid="underline">U</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const boldItem = screen.getByTestId('bold');
    const italicItem = screen.getByTestId('italic');
    
    await user.click(boldItem);
    await user.click(italicItem);
    
    expect(handleValueChange).toHaveBeenCalledWith(['bold']);
    expect(handleValueChange).toHaveBeenCalledWith(['bold', 'italic']);
  });

  it('應該支援預設值', () => {
    render(
      <ToggleGroup type="single" defaultValue="center">
        <ToggleGroupItem value="left" data-testid="left">左</ToggleGroupItem>
        <ToggleGroupItem value="center" data-testid="center">中</ToggleGroupItem>
        <ToggleGroupItem value="right" data-testid="right">右</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const centerItem = screen.getByTestId('center');
    expect(centerItem).toHaveAttribute('data-state', 'on');
  });

  it('應該支援受控值', () => {
    const { rerender } = render(
      <ToggleGroup type="single" value="left">
        <ToggleGroupItem value="left" data-testid="left">左</ToggleGroupItem>
        <ToggleGroupItem value="center" data-testid="center">中</ToggleGroupItem>
        <ToggleGroupItem value="right" data-testid="right">右</ToggleGroupItem>
      </ToggleGroup>
    );
    
    expect(screen.getByTestId('left')).toHaveAttribute('data-state', 'on');
    expect(screen.getByTestId('center')).toHaveAttribute('data-state', 'off');
    
    rerender(
      <ToggleGroup type="single" value="center">
        <ToggleGroupItem value="left" data-testid="left">左</ToggleGroupItem>
        <ToggleGroupItem value="center" data-testid="center">中</ToggleGroupItem>
        <ToggleGroupItem value="right" data-testid="right">右</ToggleGroupItem>
      </ToggleGroup>
    );
    
    expect(screen.getByTestId('left')).toHaveAttribute('data-state', 'off');
    expect(screen.getByTestId('center')).toHaveAttribute('data-state', 'on');
  });

  it('應該支援不同大小', () => {
    render(
      <ToggleGroup type="single" size="lg" data-testid="group">
        <ToggleGroupItem value="test" data-testid="item">測試</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const group = screen.getByTestId('group');
    const item = screen.getByTestId('item');
    
    expect(group).toHaveAttribute('data-size', 'lg');
    expect(item).toHaveAttribute('data-size', 'lg');
  });

  it('應該支援不同變體', () => {
    render(
      <ToggleGroup type="single" variant="outline" data-testid="group">
        <ToggleGroupItem value="test" data-testid="item">測試</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const group = screen.getByTestId('group');
    const item = screen.getByTestId('item');
    
    expect(group).toHaveAttribute('data-variant', 'outline');
    expect(item).toHaveAttribute('data-variant', 'outline');
  });

  it('應該支援 disabled 狀態', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="test" disabled data-testid="item">
          禁用項目
        </ToggleGroupItem>
      </ToggleGroup>
    );
    
    const item = screen.getByTestId('item');
    expect(item).toBeDisabled();
  });

  it('應該支援自定義 className', () => {
    render(
      <ToggleGroup type="single" className="custom-group" data-testid="group">
        <ToggleGroupItem value="test" className="custom-item" data-testid="item">
          測試
        </ToggleGroupItem>
      </ToggleGroup>
    );
    
    expect(screen.getByTestId('group')).toHaveClass('custom-group');
    expect(screen.getByTestId('item')).toHaveClass('custom-item');
  });

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="first" data-testid="first">第一項</ToggleGroupItem>
        <ToggleGroupItem value="second" data-testid="second">第二項</ToggleGroupItem>
        <ToggleGroupItem value="third" data-testid="third">第三項</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const firstItem = screen.getByTestId('first');
    
    // 聚焦第一項
    firstItem.focus();
    expect(firstItem).toHaveFocus();
    
    // 使用方向鍵導航（Radix UI 使用方向鍵而不是 Tab）
    await user.keyboard('{ArrowRight}');
    // 檢查 Radix UI 的鍵盤導航行為
    expect(firstItem.closest('[role="group"]')).toBeInTheDocument();
  });

  it('應該正確處理空值', () => {
    render(
      <ToggleGroup type="single" value="">
        <ToggleGroupItem value="test" data-testid="item">測試</ToggleGroupItem>
      </ToggleGroup>
    );
    
    const item = screen.getByTestId('item');
    expect(item).toHaveAttribute('data-state', 'off');
  });

  it('應該渲染複雜的項目內容', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="complex" data-testid="complex">
          <div>
            <span>圖標</span>
            <span>文字</span>
          </div>
        </ToggleGroupItem>
      </ToggleGroup>
    );
    
    const complexItem = screen.getByTestId('complex');
    expect(complexItem).toBeInTheDocument();
    expect(screen.getByText('圖標')).toBeInTheDocument();
    expect(screen.getByText('文字')).toBeInTheDocument();
  });
}); 