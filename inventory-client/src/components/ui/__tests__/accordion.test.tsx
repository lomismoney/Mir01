import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';

describe('Accordion 組件測試', () => {
  it('應該正確渲染 Accordion 組件', () => {
    render(
      <Accordion type="single" data-testid="accordion">
        <AccordionItem value="test">
          <AccordionTrigger>Test Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const accordion = screen.getByTestId('accordion');
    expect(accordion).toBeInTheDocument();
  });

  it('應該渲染 AccordionTrigger', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="test">
          <AccordionTrigger data-testid="trigger">Test Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Test Trigger');
  });

  it('應該渲染 AccordionContent', async () => {
    const user = userEvent.setup();
    
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="test" data-testid="item">
          <AccordionTrigger data-testid="trigger">Test Trigger</AccordionTrigger>
          <AccordionContent data-testid="content">Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // AccordionContent 預設是隱藏的，需要點擊 trigger 展開
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    
    const content = screen.getByTestId('content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Test Content');
  });

  it('應該能夠展開和收起 Accordion', async () => {
    const user = userEvent.setup();
    
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="test">
          <AccordionTrigger data-testid="trigger">Test Trigger</AccordionTrigger>
          <AccordionContent data-testid="content">Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態應該是關閉的
    expect(trigger).toHaveAttribute('data-state', 'closed');
    
    // 點擊展開
    await user.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'open');
    
    // 再次點擊收起
    await user.click(trigger);
    expect(trigger).toHaveAttribute('data-state', 'closed');
  });
});
