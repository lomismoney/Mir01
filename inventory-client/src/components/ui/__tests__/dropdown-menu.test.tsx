import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from '../dropdown-menu';

describe('DropdownMenu 組件測試', () => {
  it('應該正確渲染 DropdownMenu', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">開啟選單</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>選項 1</DropdownMenuItem>
          <DropdownMenuItem>選項 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('開啟選單');
  });

  it('應該支援點擊觸發器展開選單', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">選單</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>編輯</DropdownMenuItem>
          <DropdownMenuItem>刪除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    const trigger = screen.getByTestId('trigger');
    
    // 初始狀態選單項目不可見
    expect(screen.queryByText('編輯')).not.toBeInTheDocument();
    
    // 點擊觸發器
    await user.click(trigger);
    
    // 等待選單項目出現
    await waitFor(() => {
      expect(screen.getByText('編輯')).toBeInTheDocument();
      expect(screen.getByText('刪除')).toBeInTheDocument();
    });
  });

  it('應該正確渲染 DropdownMenuLabel 和 DropdownMenuSeparator', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">帳戶選單</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel data-testid="label">我的帳戶</DropdownMenuLabel>
          <DropdownMenuSeparator data-testid="separator" />
          <DropdownMenuItem>設定</DropdownMenuItem>
          <DropdownMenuItem>登出</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('label')).toBeInTheDocument();
      expect(screen.getByTestId('separator')).toBeInTheDocument();
      expect(screen.getByText('我的帳戶')).toBeInTheDocument();
      expect(screen.getByText('設定')).toBeInTheDocument();
    });
  });

  it('應該支援帶快捷鍵的選單項目', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">檔案</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            新增檔案
            <DropdownMenuShortcut data-testid="shortcut">⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            儲存
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByText('新增檔案')).toBeInTheDocument();
      expect(screen.getByTestId('shortcut')).toHaveTextContent('⌘N');
      expect(screen.getByText('⌘S')).toBeInTheDocument();
    });
  });

  it('應該支援 CheckboxItem', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">檢視</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem 
            checked={true} 
            data-testid="status-bar"
          >
            狀態列
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem 
            checked={false} 
            data-testid="activity-bar"
          >
            活動列
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      const statusBar = screen.getByTestId('status-bar');
      const activityBar = screen.getByTestId('activity-bar');
      
      expect(statusBar).toBeInTheDocument();
      expect(activityBar).toBeInTheDocument();
      expect(screen.getByText('狀態列')).toBeInTheDocument();
      expect(screen.getByText('活動列')).toBeInTheDocument();
    });
  });

  it('應該支援 RadioGroup 和 RadioItem', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">主題</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="light">
            <DropdownMenuRadioItem value="light" data-testid="light">
              淺色主題
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" data-testid="dark">
              深色主題
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" data-testid="system">
              系統主題
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('light')).toBeInTheDocument();
      expect(screen.getByTestId('dark')).toBeInTheDocument();
      expect(screen.getByTestId('system')).toBeInTheDocument();
      expect(screen.getByText('淺色主題')).toBeInTheDocument();
    });
  });

  it('應該支援子選單', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">選項</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>基本選項</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger data-testid="sub-trigger">
              進階選項
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>子選項 1</DropdownMenuItem>
              <DropdownMenuItem>子選項 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByTestId('sub-trigger')).toBeInTheDocument();
    });
    
    // 懸停在子選單觸發器上
    await user.hover(screen.getByTestId('sub-trigger'));
    
    await waitFor(() => {
      expect(screen.getByText('子選項 1')).toBeInTheDocument();
      expect(screen.getByText('子選項 2')).toBeInTheDocument();
    });
  });

  it('應該支援選單分組', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">工具</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>編輯工具</DropdownMenuLabel>
            <DropdownMenuItem>複製</DropdownMenuItem>
            <DropdownMenuItem>貼上</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>檔案工具</DropdownMenuLabel>
            <DropdownMenuItem>開啟</DropdownMenuItem>
            <DropdownMenuItem>儲存</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    await user.click(screen.getByTestId('trigger'));
    
    await waitFor(() => {
      expect(screen.getByText('編輯工具')).toBeInTheDocument();
      expect(screen.getByText('檔案工具')).toBeInTheDocument();
      expect(screen.getByText('複製')).toBeInTheDocument();
      expect(screen.getByText('開啟')).toBeInTheDocument();
    });
  });

  it('應該支援自定義 className', async () => {
    const user = userEvent.setup();
    
    render(
      <DropdownMenu>
        <DropdownMenuTrigger 
          className="custom-trigger" 
          data-testid="trigger"
        >
          自定義
        </DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem className="custom-item" data-testid="item">
            項目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
      <DropdownMenu>
        <DropdownMenuTrigger data-testid="trigger">鍵盤選單</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem data-testid="item1">項目 1</DropdownMenuItem>
          <DropdownMenuItem data-testid="item2">項目 2</DropdownMenuItem>
          <DropdownMenuItem data-testid="item3">項目 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    const trigger = screen.getByTestId('trigger');
    trigger.focus();
    expect(trigger).toHaveFocus();
    
    // 使用 Enter 鍵開啟選單
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(screen.getByTestId('item1')).toBeInTheDocument();
    });
  });
}); 