import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '../select';

describe('Select 組件測試', () => {
  it('應該正確渲染 Select 組件', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="請選擇選項" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項 1</SelectItem>
          <SelectItem value="option2">選項 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('請選擇選項')).toBeInTheDocument();
  });

  it('應該支援點擊展開選項', async () => {
    const user = userEvent.setup();
    
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="選擇水果" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">蘋果</SelectItem>
          <SelectItem value="banana">香蕉</SelectItem>
          <SelectItem value="orange">橘子</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 點擊觸發器展開選項
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('蘋果')).toBeInTheDocument();
      expect(screen.getByText('香蕉')).toBeInTheDocument();
      expect(screen.getByText('橘子')).toBeInTheDocument();
    });
  });

  it('應該支援選擇選項', async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    
    render(
      <Select onValueChange={handleValueChange}>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="選擇顏色" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="red" data-testid="red-option">紅色</SelectItem>
          <SelectItem value="blue" data-testid="blue-option">藍色</SelectItem>
          <SelectItem value="green" data-testid="green-option">綠色</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('red-option')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('red-option'));
    
    expect(handleValueChange).toHaveBeenCalledWith('red');
  });

  it('應該正確渲染 SelectGroup 和 SelectLabel', async () => {
    const user = userEvent.setup();
    
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="選擇分類" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel data-testid="fruit-label">水果</SelectLabel>
            <SelectItem value="apple">蘋果</SelectItem>
            <SelectItem value="banana">香蕉</SelectItem>
          </SelectGroup>
          <SelectSeparator data-testid="separator" />
          <SelectGroup>
            <SelectLabel data-testid="vegetable-label">蔬菜</SelectLabel>
            <SelectItem value="carrot">胡蘿蔔</SelectItem>
            <SelectItem value="lettuce">萵苣</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByTestId('fruit-label')).toBeInTheDocument();
      expect(screen.getByTestId('vegetable-label')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('水果')).toBeInTheDocument();
      expect(screen.getByText('蔬菜')).toBeInTheDocument();
    });
  });

  it('應該支援 disabled 選項', async () => {
    const user = userEvent.setup();
    
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="選擇狀態" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">啟用</SelectItem>
          <SelectItem value="inactive" disabled data-testid="disabled-option">
            停用
          </SelectItem>
          <SelectItem value="pending">待處理</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    
    await waitFor(() => {
      const disabledOption = screen.getByTestId('disabled-option');
      expect(disabledOption).toBeInTheDocument();
      expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('應該支援預設值', () => {
    render(
      <Select defaultValue="option2">
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">選項 1</SelectItem>
          <SelectItem value="option2">選項 2</SelectItem>
          <SelectItem value="option3">選項 3</SelectItem>
        </SelectContent>
      </Select>
    );
    
    // 預設值應該顯示在觸發器中
    expect(screen.getByText('選項 2')).toBeInTheDocument();
  });

  it('應該支援受控狀態', () => {
    const { rerender } = render(
      <Select value="controlled1">
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="controlled1">受控選項 1</SelectItem>
          <SelectItem value="controlled2">受控選項 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('受控選項 1')).toBeInTheDocument();
    
    rerender(
      <Select value="controlled2">
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="controlled1">受控選項 1</SelectItem>
          <SelectItem value="controlled2">受控選項 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('受控選項 2')).toBeInTheDocument();
  });

  it('應該支援自定義 className', async () => {
    const user = userEvent.setup();
    
    render(
      <Select>
        <SelectTrigger className="custom-trigger" data-testid="trigger">
          <SelectValue placeholder="自定義樣式" />
        </SelectTrigger>
        <SelectContent className="custom-content">
          <SelectItem className="custom-item" value="item1" data-testid="item">
            自定義項目
          </SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('item')).toHaveClass('custom-item');
    });
  });

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="鍵盤導航" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="first">第一項</SelectItem>
          <SelectItem value="second">第二項</SelectItem>
          <SelectItem value="third">第三項</SelectItem>
        </SelectContent>
      </Select>
    );
    
    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(trigger).toHaveFocus();
    
    // 使用 Enter 鍵或空格鍵開啟
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByText('第一項')).toBeInTheDocument();
    });
  });
}); 