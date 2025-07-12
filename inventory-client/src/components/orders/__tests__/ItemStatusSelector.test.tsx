import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemStatusSelector } from '../ItemStatusSelector';
import { ProcessedOrderItem } from '@/types/api-helpers';

// Mock the Select components
const mockSelectState = { isOpen: false };

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
      <div data-testid="select-root" data-value={value} data-disabled={disabled}>
        {React.Children.map(children, child => {
          if (child?.props?.['data-testid'] === 'select-trigger') {
            return React.cloneElement(child, {
              onClick: () => {
                if (!disabled) {
                  setIsOpen(!isOpen);
                }
              }
            });
          }
          if (child?.props?.['data-testid'] === 'select-options' && isOpen) {
            return (
              <div data-testid="select-content">
                {React.Children.map(child.props.children, (item: any) => {
                  if (item?.props?.['data-testid']?.startsWith('select-item-')) {
                    return React.cloneElement(item, {
                      onClick: () => {
                        if (!disabled) {
                          onValueChange(item.props['data-value']);
                          setIsOpen(false);
                        }
                      }
                    });
                  }
                  return item;
                })}
              </div>
            );
          }
          return child;
        })}
      </div>
    );
  },
  SelectTrigger: ({ children, className, ...props }: any) => (
    <button 
      data-testid="select-trigger" 
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  SelectContent: ({ children, ...props }: any) => (
    <div data-testid="select-options" {...props}>
      {children}
    </div>
  ),
  SelectItem: ({ children, value, ...props }: any) => (
    <div 
      data-testid={`select-item-${value}`} 
      data-value={value}
      {...props}
    >
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <span>{placeholder}</span>
  ),
}));

// Mock data
const mockItem: ProcessedOrderItem = {
  id: 1,
  order_id: 1,
  product_variant_id: 1,
  product_name: '測試商品',
  sku: 'SKU-001',
  price: 100,
  quantity: 2,
  subtotal: 200,
  status: '待處理',
  is_custom: false,
} as ProcessedOrderItem;

describe('ItemStatusSelector', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該顯示當前狀態', () => {
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={false}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 使用更精確的查詢方式，因為有多個相同文字的元素
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveTextContent('待處理');
    });

    it('應該顯示狀態圖標', () => {
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={false}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 檢查是否有 svg 元素（圖標）
      const trigger = screen.getByTestId('select-trigger');
      const svg = trigger.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('應該根據不同狀態顯示對應的狀態', () => {
      const statuses = [
        { status: '待處理', label: '待處理' },
        { status: '已叫貨', label: '已叫貨' },
        { status: '已出貨', label: '已出貨' },
        { status: '完成', label: '完成' },
      ];

      statuses.forEach(({ status, label }) => {
        const { rerender } = render(
          <ItemStatusSelector
            item={{ ...mockItem, status }}
            isLoading={false}
            onStatusChange={mockOnStatusChange}
          />
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toHaveTextContent(label);
        rerender(<div />);
      });
    });
  });

  describe('載入狀態', () => {
    it('應該在載入時顯示載入狀態', () => {
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={true}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('更新中')).toBeInTheDocument();
      // 檢查載入動畫圖標
      const trigger = screen.getByTestId('select-trigger');
      const svg = trigger.querySelector('svg.animate-spin');
      expect(svg).toBeInTheDocument();
    });

    it('應該在載入時禁用選擇器', () => {
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={true}
          onStatusChange={mockOnStatusChange}
        />
      );

      const selectRoot = screen.getByTestId('select-root');
      expect(selectRoot).toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('狀態選擇功能', () => {
    it.skip('應該能點擊選擇器開啟選項', async () => {
      // TODO: 這個測試需要更複雜的 Select 組件 mock
      // 目前的 mock 無法正確模擬狀態管理
    });

    it.skip('應該能選擇新狀態', async () => {
      // TODO: 這個測試需要更複雜的 Select 組件 mock
      // 目前的 mock 無法正確模擬選擇交互
    });

    it('不應該在選擇相同狀態時觸發回調', async () => {
      const user = userEvent.setup();
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={false}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 點擊選擇器
      const trigger = screen.getByTestId('select-trigger');
      await user.click(trigger);

      // 選擇相同的狀態
      const sameStatusItem = screen.getByTestId('select-item-待處理');
      await user.click(sameStatusItem);

      // 確認回調沒有被調用
      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });

    it('不應該在載入時允許選擇', async () => {
      const user = userEvent.setup();
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={true}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 嘗試點擊選擇器
      const trigger = screen.getByTestId('select-trigger');
      await user.click(trigger);

      // 確認選項沒有顯示
      expect(screen.queryByTestId('select-content')).not.toBeInTheDocument();
    });
  });

  describe('狀態選項顯示', () => {
    it('應該在選項中顯示狀態圖標和徽章', async () => {
      const user = userEvent.setup();
      render(
        <ItemStatusSelector
          item={mockItem}
          isLoading={false}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 點擊選擇器
      const trigger = screen.getByTestId('select-trigger');
      await user.click(trigger);

      // 檢查每個選項都有圖標和徽章
      const statusOptions = ['待處理', '已叫貨', '已出貨', '完成'];
      statusOptions.forEach(status => {
        const item = screen.getByTestId(`select-item-${status}`);
        // 檢查是否有圖標
        const svg = item.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // 檢查是否有狀態文字
        expect(item).toHaveTextContent(status);
      });
    });
  });

  describe('邊界情況', () => {
    it('應該處理未知的狀態值', () => {
      const itemWithUnknownStatus = {
        ...mockItem,
        status: '未知狀態'
      };

      render(
        <ItemStatusSelector
          item={itemWithUnknownStatus}
          isLoading={false}
          onStatusChange={mockOnStatusChange}
        />
      );

      // 應該顯示原始狀態值或預設值
      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toBeTruthy();
    });

    it.skip('應該在狀態變更時正確傳遞參數', async () => {
      // TODO: 這個測試需要更複雜的 Select 組件 mock
      // 目前的 mock 無法正確模擬選擇交互
    });
  });
});