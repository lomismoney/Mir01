import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '../command';

describe('Command 組件測試', () => {
  it('應該正確渲染基本 Command 組件', () => {
    render(
      <Command data-testid="command">
        <CommandInput placeholder="搜索..." />
        <CommandList>
          <CommandItem>測試項目</CommandItem>
        </CommandList>
      </Command>
    );
    
    const command = screen.getByTestId('command');
    expect(command).toBeInTheDocument();
    expect(command).toHaveAttribute('data-slot', 'command');
    expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
    expect(screen.getByText('測試項目')).toBeInTheDocument();
  });

  it('應該正確渲染 CommandInput', () => {
    render(
      <Command>
        <CommandInput placeholder="輸入搜索內容..." data-testid="input" />
      </Command>
    );
    
    const input = screen.getByTestId('input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('data-slot', 'command-input');
    expect(input).toHaveAttribute('placeholder', '輸入搜索內容...');
    
    // 檢查搜索圖標存在於包裝器中
    const wrapper = input.closest('[data-slot="command-input-wrapper"]');
    expect(wrapper).toBeInTheDocument();
    const searchIcon = wrapper?.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('應該支援輸入搜索', async () => {
    const user = userEvent.setup();
    
    render(
      <Command>
        <CommandInput data-testid="input" />
        <CommandList>
          <CommandItem>Apple</CommandItem>
          <CommandItem>Banana</CommandItem>
          <CommandItem>Cherry</CommandItem>
        </CommandList>
      </Command>
    );
    
    const input = screen.getByTestId('input');
    
    await user.type(input, 'app');
    expect(input).toHaveValue('app');
  });

  it('應該正確渲染 CommandList', () => {
    render(
      <Command>
        <CommandList data-testid="list">
          <CommandItem>項目1</CommandItem>
          <CommandItem>項目2</CommandItem>
        </CommandList>
      </Command>
    );
    
    const list = screen.getByTestId('list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('data-slot', 'command-list');
  });

  it('應該正確渲染 CommandEmpty', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty data-testid="empty">
            找不到結果
          </CommandEmpty>
        </CommandList>
      </Command>
    );
    
    const empty = screen.getByTestId('empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveAttribute('data-slot', 'command-empty');
    expect(empty).toHaveTextContent('找不到結果');
  });

  it('應該正確渲染 CommandGroup', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="建議" data-testid="group">
            <CommandItem>項目1</CommandItem>
            <CommandItem>項目2</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    
    const group = screen.getByTestId('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('data-slot', 'command-group');
  });

  it('應該正確渲染 CommandItem', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();
    
    render(
      <Command>
        <CommandList>
          <CommandItem onSelect={handleSelect} data-testid="item">
            可選項目
          </CommandItem>
        </CommandList>
      </Command>
    );
    
    const item = screen.getByTestId('item');
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute('data-slot', 'command-item');
    expect(item).toHaveTextContent('可選項目');
    
    await user.click(item);
    expect(handleSelect).toHaveBeenCalled();
  });

  it('應該正確渲染 CommandShortcut', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>
            複製
            <CommandShortcut data-testid="shortcut">⌘C</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    );
    
    const shortcut = screen.getByTestId('shortcut');
    expect(shortcut).toBeInTheDocument();
    expect(shortcut).toHaveAttribute('data-slot', 'command-shortcut');
    expect(shortcut).toHaveTextContent('⌘C');
  });

  it('應該正確渲染 CommandSeparator', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem>項目1</CommandItem>
          <CommandSeparator data-testid="separator" />
          <CommandItem>項目2</CommandItem>
        </CommandList>
      </Command>
    );
    
    const separator = screen.getByTestId('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('data-slot', 'command-separator');
  });

  it('應該正確渲染 CommandDialog', () => {
    render(
      <CommandDialog open={true} data-testid="dialog">
        <CommandInput placeholder="搜索命令..." />
        <CommandList>
          <CommandItem>測試命令</CommandItem>
        </CommandList>
      </CommandDialog>
    );
    
    expect(screen.getByPlaceholderText('搜索命令...')).toBeInTheDocument();
    expect(screen.getByText('測試命令')).toBeInTheDocument();
  });

  it('應該支援自定義 className', () => {
    render(
      <Command className="custom-command" data-testid="command">
        <CommandInput className="custom-input" data-testid="input" />
        <CommandList className="custom-list" data-testid="list">
          <CommandGroup className="custom-group" data-testid="group">
            <CommandItem className="custom-item" data-testid="item">
              測試
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
    
    expect(screen.getByTestId('command')).toHaveClass('custom-command');
    expect(screen.getByTestId('input')).toHaveClass('custom-input');
    expect(screen.getByTestId('list')).toHaveClass('custom-list');
    expect(screen.getByTestId('group')).toHaveClass('custom-group');
    expect(screen.getByTestId('item')).toHaveClass('custom-item');
  });
}); 