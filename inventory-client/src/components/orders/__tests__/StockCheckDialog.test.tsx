import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StockCheckDialog from '../StockCheckDialog';

// 測試數據
const mockInsufficientStockItems = [
  {
    product_name: 'iPhone 15 Pro',
    sku: 'IPH15PRO128',
    requested_quantity: 10,
    available_quantity: 3,
    shortage: 7,
  },
  {
    product_name: 'Samsung Galaxy S24',
    sku: 'SGS24256',
    requested_quantity: 5,
    available_quantity: 0,
    shortage: 5,
  },
];

describe('StockCheckDialog', () => {
  // 預設 props
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    insufficientStockItems: mockInsufficientStockItems,
    onConfirmBackorder: jest.fn(),
    onCancel: jest.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本渲染測試', () => {
    test('當 open 為 true 時應正確渲染所有元素', () => {
      render(<StockCheckDialog {...defaultProps} />);

      expect(screen.getByText('庫存不足警告')).toBeInTheDocument();
      expect(screen.getByText('以下商品庫存不足，您可以選擇建立預訂訂單，待供應商補貨後出貨。')).toBeInTheDocument();
      expect(screen.getByText('取消建單')).toBeInTheDocument();
      expect(screen.getByText('確認建立預訂訂單')).toBeInTheDocument();
    });

    test('當 open 為 false 時不應渲染 Modal 內容', () => {
      render(<StockCheckDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('庫存不足警告')).not.toBeInTheDocument();
      expect(screen.queryByText('取消建單')).not.toBeInTheDocument();
    });

    test('應該顯示正確的統計資訊', () => {
      render(<StockCheckDialog {...defaultProps} />);

      // 影響商品數量：2 項
      expect(screen.getByText('2 項')).toBeInTheDocument();
      
      // 總缺貨量：7 + 5 = 12 件
      expect(screen.getByText('12 件')).toBeInTheDocument();
      
      // 處理方式
      expect(screen.getByText('預訂出貨')).toBeInTheDocument();
    });
  });

  describe('缺貨商品表格測試', () => {
    test('應該正確顯示缺貨商品列表', () => {
      render(<StockCheckDialog {...defaultProps} />);

      // 檢查商品名稱
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument();

      // 檢查 SKU
      expect(screen.getByText('SKU: IPH15PRO128')).toBeInTheDocument();
      expect(screen.getByText('SKU: SGS24256')).toBeInTheDocument();

      // 檢查數量
      expect(screen.getByText('10')).toBeInTheDocument(); // 需求數量
      expect(screen.getByText('3')).toBeInTheDocument();  // 現有庫存
      expect(screen.getByText('-7')).toBeInTheDocument(); // 缺貨數量
    });

    test('應該顯示正確的表格標題', () => {
      render(<StockCheckDialog {...defaultProps} />);

      expect(screen.getByText('商品資訊')).toBeInTheDocument();
      expect(screen.getByText('需求數量')).toBeInTheDocument();
      expect(screen.getByText('現有庫存')).toBeInTheDocument();
      expect(screen.getByText('缺貨數量')).toBeInTheDocument();
      expect(screen.getByText('狀態')).toBeInTheDocument();
    });

    test('應該為每個商品顯示待補貨狀態', () => {
      render(<StockCheckDialog {...defaultProps} />);

      const waitingBadges = screen.getAllByText('待補貨');
      expect(waitingBadges).toHaveLength(2);
    });
  });

  describe('互動功能測試', () => {
    test('點擊取消建單按鈕應該調用正確的回調函數', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      const onOpenChange = jest.fn();

      render(
        <StockCheckDialog 
          {...defaultProps} 
          onCancel={onCancel}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByText('取消建單');
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onCancel).toHaveBeenCalled();
    });

    test('點擊確認建立預訂訂單按鈕應該調用正確的回調函數', async () => {
      const user = userEvent.setup();
      const onConfirmBackorder = jest.fn();

      render(
        <StockCheckDialog 
          {...defaultProps} 
          onConfirmBackorder={onConfirmBackorder}
        />
      );

      const confirmButton = screen.getByText('確認建立預訂訂單');
      await user.click(confirmButton);

      expect(onConfirmBackorder).toHaveBeenCalled();
    });
  });

  describe('載入狀態測試', () => {
    test('當 isProcessing 為 true 時應該顯示載入狀態', () => {
      render(<StockCheckDialog {...defaultProps} isProcessing={true} />);

      expect(screen.getByText('建立中...')).toBeInTheDocument();
      expect(screen.getByText('取消建單')).toBeDisabled();
      expect(screen.getByText('建立中...')).toBeDisabled();
    });

    test('當 isProcessing 為 false 時按鈕應該正常顯示', () => {
      render(<StockCheckDialog {...defaultProps} isProcessing={false} />);

      expect(screen.getByText('確認建立預訂訂單')).toBeInTheDocument();
      expect(screen.getByText('取消建單')).not.toBeDisabled();
      expect(screen.getByText('確認建立預訂訂單')).not.toBeDisabled();
    });
  });

  describe('說明區域測試', () => {
    test('應該顯示預訂模式說明', () => {
      render(<StockCheckDialog {...defaultProps} />);

      expect(screen.getByText('預訂模式說明')).toBeInTheDocument();
      expect(screen.getByText(/立即建立訂單/)).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return content.includes('補貨通知') && content.includes('採購部門');
      })).toBeInTheDocument();
      expect(screen.getByText(/分批出貨/)).toBeInTheDocument();
      expect(screen.getByText(/客戶通知/)).toBeInTheDocument();
    });
  });

  describe('邊界條件測試', () => {
    test('當缺貨商品列表為空時應該正確處理', () => {
      render(<StockCheckDialog {...defaultProps} insufficientStockItems={[]} />);

      expect(screen.getByText('0 項')).toBeInTheDocument(); // 影響商品
      expect(screen.getByText('0 件')).toBeInTheDocument(); // 總缺貨量
    });

    test('當有商品庫存為 0 時應該正確顯示', () => {
      const zeroStockItems = [
        {
          product_name: '測試商品',
          sku: 'TEST001',
          requested_quantity: 5,
          available_quantity: 0,
          shortage: 5,
        },
      ];

      render(<StockCheckDialog {...defaultProps} insufficientStockItems={zeroStockItems} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // 現有庫存顯示為 0
      expect(screen.getByText('-5')).toBeInTheDocument(); // 缺貨數量
    });
  });

  describe('可訪問性測試', () => {
    test('對話框應該具有正確的可訪問性屬性', () => {
      render(<StockCheckDialog {...defaultProps} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    test('表格應該具有正確的結構', () => {
      render(<StockCheckDialog {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(5);
      expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
    });

    test('按鈕應該具有正確的角色', () => {
      render(<StockCheckDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // 取消和確認按鈕
    });
  });

  describe('統計計算測試', () => {
    test('應該正確計算多個商品的總缺貨量', () => {
      const multipleItems = [
        { product_name: '商品1', sku: 'SKU1', requested_quantity: 10, available_quantity: 3, shortage: 7 },
        { product_name: '商品2', sku: 'SKU2', requested_quantity: 5, available_quantity: 0, shortage: 5 },
        { product_name: '商品3', sku: 'SKU3', requested_quantity: 8, available_quantity: 2, shortage: 6 },
      ];

      render(<StockCheckDialog {...defaultProps} insufficientStockItems={multipleItems} />);

      expect(screen.getByText('3 項')).toBeInTheDocument();  // 影響商品數量
      expect(screen.getByText('18 件')).toBeInTheDocument(); // 總缺貨量 (7+5+6=18)
    });
  });
});
