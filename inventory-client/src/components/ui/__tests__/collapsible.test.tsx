import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../collapsible';

describe('Collapsible 組件測試', () => {
  it('應該正確渲染 Collapsible 組件', () => {
    render(
      <Collapsible data-testid="collapsible">
        <CollapsibleTrigger>點擊展開</CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    const collapsible = screen.getByTestId('collapsible');
    expect(collapsible).toBeInTheDocument();
    expect(collapsible).toHaveAttribute('data-slot', 'collapsible');
  });

  it('應該正確渲染 CollapsibleTrigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger data-testid="trigger">
          點擊展開
        </CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('點擊展開');
    expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
  });

  it('應該支援點擊展開和收起', async () => {
    const user = userEvent.setup();
    
    render(
      <Collapsible data-testid="collapsible">
        <CollapsibleTrigger data-testid="trigger">
          點擊展開
        </CollapsibleTrigger>
        <CollapsibleContent data-testid="content">
          可折疊的內容
        </CollapsibleContent>
      </Collapsible>
    );
    
    const trigger = screen.getByTestId('trigger');
    const collapsible = screen.getByTestId('collapsible');
    
    // 初始狀態應該是關閉的
    expect(collapsible).toHaveAttribute('data-state', 'closed');
    
    // 點擊展開
    await user.click(trigger);
    expect(collapsible).toHaveAttribute('data-state', 'open');
    
    // 再次點擊收起
    await user.click(trigger);
    expect(collapsible).toHaveAttribute('data-state', 'closed');
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Collapsible open={false} data-testid="collapsible">
        <CollapsibleTrigger>點擊展開</CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    let collapsible = screen.getByTestId('collapsible');
    expect(collapsible).toHaveAttribute('data-state', 'closed');
    
    rerender(
      <Collapsible open={true} data-testid="collapsible">
        <CollapsibleTrigger>點擊展開</CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    collapsible = screen.getByTestId('collapsible');
    expect(collapsible).toHaveAttribute('data-state', 'open');
  });

  it('應該支援 disabled 狀態', () => {
    render(
      <Collapsible disabled data-testid="collapsible">
        <CollapsibleTrigger data-testid="trigger">
          點擊展開
        </CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeDisabled();
  });

  it('應該渲染 CollapsibleContent', () => {
    render(
      <Collapsible defaultOpen={true}>
        <CollapsibleTrigger>點擊展開</CollapsibleTrigger>
        <CollapsibleContent data-testid="content">
          可折疊的內容
        </CollapsibleContent>
      </Collapsible>
    );
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('可折疊的內容');
    expect(content).toHaveAttribute('data-slot', 'collapsible-content');
  });

  it('應該支援鍵盤操作', async () => {
    const user = userEvent.setup();
    
    render(
      <Collapsible data-testid="collapsible">
        <CollapsibleTrigger data-testid="trigger">
          點擊展開
        </CollapsibleTrigger>
        <CollapsibleContent>內容</CollapsibleContent>
      </Collapsible>
    );
    
    const trigger = screen.getByTestId('trigger');
    const collapsible = screen.getByTestId('collapsible');
    
    trigger.focus();
    expect(trigger).toHaveFocus();
    
    // 使用 Enter 鍵展開
    await user.keyboard('{Enter}');
    expect(collapsible).toHaveAttribute('data-state', 'open');
  });
}); 