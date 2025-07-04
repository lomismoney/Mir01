import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs 組件測試', () => {
  it('應該正確渲染 Tabs 組件', () => {
    render(
      <Tabs defaultValue="tab1" data-testid="tabs">
        <TabsList>
          <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    const tabs = screen.getByTestId('tabs');
    expect(tabs).toBeInTheDocument();
  });

  it('應該正確渲染 TabsList', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    const tabsList = screen.getByTestId('tabs-list');
    expect(tabsList).toBeInTheDocument();
    expect(tabsList).toHaveRole('tablist');
  });

  it('應該正確渲染 TabsTrigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');
    
    expect(trigger1).toBeInTheDocument();
    expect(trigger1).toHaveRole('tab');
    expect(trigger1).toHaveTextContent('標籤 1');
    
    expect(trigger2).toBeInTheDocument();
    expect(trigger2).toHaveRole('tab');
    expect(trigger2).toHaveTextContent('標籤 2');
  });

  it('應該正確渲染 TabsContent', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content1">內容 1</TabsContent>
        <TabsContent value="tab2" data-testid="content2">內容 2</TabsContent>
      </Tabs>
    );
    
    const content1 = screen.getByTestId('content1');
    expect(content1).toBeInTheDocument();
    expect(content1).toHaveRole('tabpanel');
    expect(content1).toHaveTextContent('內容 1');
    
    // 預設情況下第二個內容應該不可見或在 DOM 中但隱藏
    const content2 = screen.getByTestId('content2');
    expect(content2).toBeInTheDocument();
  });

  it('應該支援點擊切換標籤', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content1">內容 1</TabsContent>
        <TabsContent value="tab2" data-testid="content2">內容 2</TabsContent>
      </Tabs>
    );
    
    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');
    
    // 初始狀態
    expect(trigger1).toHaveAttribute('data-state', 'active');
    expect(trigger2).toHaveAttribute('data-state', 'inactive');
    
    // 點擊第二個標籤
    await user.click(trigger2);
    
    expect(trigger1).toHaveAttribute('data-state', 'inactive');
    expect(trigger2).toHaveAttribute('data-state', 'active');
  });

  it('應該支援預設值', () => {
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');
    
    expect(trigger1).toHaveAttribute('data-state', 'inactive');
    expect(trigger2).toHaveAttribute('data-state', 'active');
  });

  it('應該支援受控值', () => {
    const { rerender } = render(
      <Tabs value="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    let trigger1 = screen.getByTestId('trigger1');
    let trigger2 = screen.getByTestId('trigger2');
    
    expect(trigger1).toHaveAttribute('data-state', 'active');
    expect(trigger2).toHaveAttribute('data-state', 'inactive');
    
    rerender(
      <Tabs value="tab2">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
      </Tabs>
    );
    
    trigger1 = screen.getByTestId('trigger1');
    trigger2 = screen.getByTestId('trigger2');
    
    expect(trigger1).toHaveAttribute('data-state', 'inactive');
    expect(trigger2).toHaveAttribute('data-state', 'active');
  });

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="trigger2">標籤 2</TabsTrigger>
          <TabsTrigger value="tab3" data-testid="trigger3">標籤 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">內容 1</TabsContent>
        <TabsContent value="tab2">內容 2</TabsContent>
        <TabsContent value="tab3">內容 3</TabsContent>
      </Tabs>
    );
    
    const trigger1 = screen.getByTestId('trigger1');
    const trigger2 = screen.getByTestId('trigger2');
    
    // 聚焦第一個標籤
    trigger1.focus();
    expect(trigger1).toHaveFocus();
    
    // 使用方向鍵導航到下一個標籤
    await user.keyboard('{ArrowRight}');
    expect(trigger2).toHaveFocus();
  });

  it('應該支援自定義 className', () => {
    render(
      <Tabs defaultValue="tab1" className="custom-tabs" data-testid="tabs">
        <TabsList className="custom-tabs-list" data-testid="tabs-list">
          <TabsTrigger 
            value="tab1" 
            className="custom-trigger" 
            data-testid="trigger1"
          >
            標籤 1
          </TabsTrigger>
        </TabsList>
        <TabsContent 
          value="tab1" 
          className="custom-content" 
          data-testid="content1"
        >
          內容 1
        </TabsContent>
      </Tabs>
    );
    
    const tabs = screen.getByTestId('tabs');
    const tabsList = screen.getByTestId('tabs-list');
    const trigger = screen.getByTestId('trigger1');
    const content = screen.getByTestId('content1');
    
    expect(tabs).toHaveClass('custom-tabs');
    expect(tabsList).toHaveClass('custom-tabs-list');
    expect(trigger).toHaveClass('custom-trigger');
    expect(content).toHaveClass('custom-content');
  });

  it('應該正確設定 aria 屬性', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger1">標籤 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content1">內容 1</TabsContent>
      </Tabs>
    );
    
    const trigger = screen.getByTestId('trigger1');
    const content = screen.getByTestId('content1');
    
    expect(trigger).toHaveAttribute('aria-selected', 'true');
    expect(content).toHaveAttribute('role', 'tabpanel');
  });
}); 