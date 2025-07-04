import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../alert-dialog';

// Mock button variants
jest.mock('../button', () => ({
  buttonVariants: jest.fn(({ variant } = {}) => {
    const baseClasses = 'inline-flex items-center justify-center';
    if (variant === 'outline') {
      return `${baseClasses} border bg-background`;
    }
    return `${baseClasses} bg-primary text-primary-foreground`;
  }),
}));

describe('AlertDialog 組件', () => {
  describe('基本渲染', () => {
    it('應該正確渲染完整的 AlertDialog', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟對話框</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
              <AlertDialogDescription>
                此操作無法復原。確定要刪除這個項目嗎？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction>確定</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      // 檢查觸發器
      const trigger = screen.getByText('開啟對話框');
      expect(trigger).toBeInTheDocument();

      // 點擊觸發器開啟對話框
      await user.click(trigger);

      // 檢查對話框內容
      await waitFor(() => {
        expect(screen.getByText('確認刪除')).toBeInTheDocument();
        expect(screen.getByText('此操作無法復原。確定要刪除這個項目嗎？')).toBeInTheDocument();
        expect(screen.getByText('取消')).toBeInTheDocument();
        expect(screen.getByText('確定')).toBeInTheDocument();
      });
    });
  });

  describe('AlertDialog 根組件', () => {
    it('應該正確渲染且不產生錯誤', () => {
      expect(() => {
        render(
          <AlertDialog>
            <AlertDialogTrigger>觸發器</AlertDialogTrigger>
          </AlertDialog>
        );
      }).not.toThrow();

      const trigger = screen.getByText('觸發器');
      expect(trigger).toBeInTheDocument();
    });

    it('應該傳遞其他 props', () => {
      render(
        <AlertDialog defaultOpen={false}>
          <AlertDialogTrigger>觸發器</AlertDialogTrigger>
        </AlertDialog>
      );

      expect(screen.getByText('觸發器')).toBeInTheDocument();
    });
  });

  describe('AlertDialogTrigger', () => {
    it('應該正確渲染', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>點擊開啟</AlertDialogTrigger>
        </AlertDialog>
      );

      const trigger = screen.getByText('點擊開啟');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'alert-dialog-trigger');
    });

    it('應該支援自定義 props', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger className="custom-trigger" id="my-trigger">
            觸發器
          </AlertDialogTrigger>
        </AlertDialog>
      );

      const trigger = screen.getByText('觸發器');
      expect(trigger).toHaveClass('custom-trigger');
      expect(trigger).toHaveAttribute('id', 'my-trigger');
    });
  });

  describe('AlertDialogContent', () => {
    it('應該應用預設的 CSS 類', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent data-testid="content">
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試內容</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveClass(
          'bg-background',
          'fixed',
          'top-[50%]',
          'left-[50%]',
          'z-50',
          'grid',
          'w-full',
          'rounded-lg',
          'border',
          'p-6',
          'shadow-lg'
        );
      });
    });

    it('應該支援自定義 className', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent className="custom-content" data-testid="content">
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試內容</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const content = screen.getByTestId('content');
        expect(content).toHaveClass('custom-content');
        expect(content).toHaveClass('bg-background'); // 保留預設類
      });
    });
  });

  describe('AlertDialogHeader', () => {
    it('應該正確渲染', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>標題區域</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const title = screen.getByText('標題區域');
        expect(title).toBeInTheDocument();
        expect(title).toHaveAttribute('data-slot', 'alert-dialog-title');
        
        // 檢查 header 元素的存在和樣式
        const header = title.parentElement;
        expect(header).toHaveAttribute('data-slot', 'alert-dialog-header');
        expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center');
      });
    });
  });

  describe('AlertDialogTitle', () => {
    it('應該正確渲染', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>警告標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const title = screen.getByText('警告標題');
        expect(title).toBeInTheDocument();
        expect(title).toHaveAttribute('data-slot', 'alert-dialog-title');
        expect(title).toHaveClass('text-lg', 'font-semibold');
      });
    });
  });

  describe('AlertDialogDescription', () => {
    it('應該正確渲染', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>這是描述文字</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const description = screen.getByText('這是描述文字');
        expect(description).toBeInTheDocument();
        expect(description).toHaveAttribute('data-slot', 'alert-dialog-description');
        expect(description).toHaveClass('text-muted-foreground', 'text-sm');
      });
    });
  });

  describe('AlertDialogFooter', () => {
    it('應該正確渲染', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
            <AlertDialogFooter>底部區域</AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const footer = screen.getByText('底部區域');
        expect(footer).toBeInTheDocument();
        expect(footer).toHaveAttribute('data-slot', 'alert-dialog-footer');
        expect(footer).toHaveClass('flex', 'flex-col-reverse', 'gap-2');
      });
    });
  });

  describe('AlertDialogAction', () => {
    it('應該正確渲染並應用按鈕樣式', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
            <AlertDialogAction>確認</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const action = screen.getByText('確認');
        expect(action).toBeInTheDocument();
        expect(action).toHaveClass('bg-primary', 'text-primary-foreground');
      });
    });

    it('應該處理點擊事件', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
            <AlertDialogAction onClick={handleClick}>確認</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));
      
      await waitFor(() => {
        const action = screen.getByText('確認');
        expect(action).toBeInTheDocument();
      });

      await user.click(screen.getByText('確認'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('AlertDialogCancel', () => {
    it('應該正確渲染並應用邊框樣式', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
            <AlertDialogCancel>取消</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const cancel = screen.getByText('取消');
        expect(cancel).toBeInTheDocument();
        expect(cancel).toHaveClass('border', 'bg-background');
      });
    });

    it('應該處理點擊事件並關閉對話框', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
            <AlertDialogCancel onClick={handleClick}>取消</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));
      
      await waitFor(() => {
        expect(screen.getByText('標題')).toBeInTheDocument();
      });

      await user.click(screen.getByText('取消'));
      expect(handleClick).toHaveBeenCalledTimes(1);

      // 對話框應該被關閉
      await waitFor(() => {
        expect(screen.queryByText('標題')).not.toBeInTheDocument();
      });
    });
  });

  describe('AlertDialogOverlay', () => {
    it('應該應用正確的樣式', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>內容</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        // 查找覆蓋層（通常是一個背景元素）
        const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50');
      });
    });
  });

  describe('鍵盤交互', () => {
    it('應該支援 Escape 鍵關閉對話框', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試標題</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));
      
      await waitFor(() => {
        expect(screen.getByText('測試標題')).toBeInTheDocument();
      });

      // 按 Escape 鍵
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('測試標題')).not.toBeInTheDocument();
      });
    });
  });

  describe('可訪問性', () => {
    it('應該有正確的角色和屬性', async () => {
      const user = userEvent.setup();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>警告</AlertDialogTitle>
            <AlertDialogDescription>描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByText('開啟'));

      await waitFor(() => {
        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('受控模式', () => {
    it('應該支援受控的開啟/關閉', () => {
      const handleOpenChange = jest.fn();
      
      const { rerender } = render(
        <AlertDialog open={false} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      // 對話框應該是關閉的
      expect(screen.queryByText('測試')).not.toBeInTheDocument();

      // 重新渲染為開啟狀態
      rerender(
        <AlertDialog open={true} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger>開啟</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>測試</AlertDialogTitle>
            <AlertDialogDescription>測試描述</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      // 對話框應該顯示
      expect(screen.getByText('測試')).toBeInTheDocument();
    });
  });

  describe('複雜場景', () => {
    it('應該正確處理多層級的對話框結構', async () => {
      const user = userEvent.setup();
      const handleAction = jest.fn();
      const handleCancel = jest.fn();
      
      render(
        <AlertDialog>
          <AlertDialogTrigger>刪除項目</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認刪除</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可復原。刪除後將無法恢復此項目。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleAction}>
                確定刪除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      // 開啟對話框
      await user.click(screen.getByText('刪除項目'));

      // 檢查所有元素都正確顯示
      await waitFor(() => {
        expect(screen.getByText('確認刪除')).toBeInTheDocument();
        expect(screen.getByText('此操作不可復原。刪除後將無法恢復此項目。')).toBeInTheDocument();
        expect(screen.getByText('取消')).toBeInTheDocument();
        expect(screen.getByText('確定刪除')).toBeInTheDocument();
      });

      // 測試取消功能
      await user.click(screen.getByText('取消'));
      expect(handleCancel).toHaveBeenCalledTimes(1);

      // 對話框應該關閉
      await waitFor(() => {
        expect(screen.queryByText('確認刪除')).not.toBeInTheDocument();
      });
    });
  });
}); 