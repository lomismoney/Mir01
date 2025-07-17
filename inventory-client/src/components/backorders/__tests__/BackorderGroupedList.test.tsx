import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackorderGroupedList } from '../BackorderGroupedList';

// Mock dependencies
jest.mock('../BackorderStatusDialog', () => ({
  BackorderStatusDialog: jest.fn(({ open, onOpenChange, onSuccess }) => 
    open ? (
      <div data-testid="status-dialog">
        <button onClick={() => onOpenChange(false)}>Close</button>
        <button onClick={() => onSuccess()}>Save</button>
      </div>
    ) : null
  ),
}));

const mockGroupedData = [
  {
    order_id: 1,
    order_number: 'ORD-2025-001',
    customer_name: '客戶一',
    total_items: 2,
    total_quantity: 5,
    created_at: '2025-01-17T10:00:00Z',
    days_pending: 3,
    summary_status: 'transfer_in_progress',
    summary_status_text: '調撥處理中',
    items: [
      {
        id: 101,
        product_name: '商品A',
        sku: 'SKU-A',
        quantity: 2,
        integrated_status: 'transfer_in_transit',
        integrated_status_text: '庫存調撥中',
        transfer: {
          id: 10,
          status: 'in_transit',
          from_store_id: 1,
          to_store_id: 2,
        },
      },
      {
        id: 102,
        product_name: '商品B',
        sku: 'SKU-B',
        quantity: 3,
        integrated_status: 'purchase_pending_purchase',
        integrated_status_text: '待建立進貨單',
      },
    ],
  },
  {
    order_id: 2,
    order_number: 'ORD-2025-002',
    customer_name: '客戶二',
    total_items: 1,
    total_quantity: 1,
    created_at: '2025-01-16T10:00:00Z',
    days_pending: 4,
    summary_status: 'pending',
    summary_status_text: '待處理',
    items: [
      {
        id: 201,
        product_name: '商品C',
        sku: 'SKU-C',
        quantity: 1,
        integrated_status: 'purchase_pending_purchase',
        integrated_status_text: '待建立進貨單',
      },
    ],
  },
];

describe('BackorderGroupedList', () => {
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該顯示所有訂單的摘要資訊', () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 檢查訂單編號
    expect(screen.getByText('ORD-2025-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-2025-002')).toBeInTheDocument();
    
    // 檢查客戶名稱
    expect(screen.getByText('客戶一')).toBeInTheDocument();
    expect(screen.getByText('客戶二')).toBeInTheDocument();
    
    // 檢查彙總狀態
    expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    expect(screen.getByText('待處理')).toBeInTheDocument();
    
    // 檢查待處理天數
    expect(screen.getByText('3 天')).toBeInTheDocument();
    expect(screen.getByText('4 天')).toBeInTheDocument();
  });

  it('點擊訂單應該展開顯示詳細項目', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 初始應該不顯示商品詳情
    expect(screen.queryByText('商品A')).not.toBeInTheDocument();
    
    // 點擊第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 應該顯示該訂單的商品
    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText('商品B')).toBeInTheDocument();
    expect(screen.getByText('SKU-A')).toBeInTheDocument();
    expect(screen.getByText('SKU-B')).toBeInTheDocument();
    
    // 但不應該顯示第二個訂單的商品
    expect(screen.queryByText('商品C')).not.toBeInTheDocument();
  });

  it('應該正確顯示商品的狀態和轉移編號', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 展開第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 檢查狀態標籤
    expect(screen.getByText('庫存調撥中')).toBeInTheDocument();
    expect(screen.getAllByText('待建立進貨單')).toHaveLength(1);
    
    // 檢查轉移編號
    expect(screen.getByText('轉移 #10')).toBeInTheDocument();
  });

  it('有轉移記錄的商品應該顯示更新轉移狀態選項', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 展開第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 找到有轉移記錄的商品的操作按鈕
    const actionButtons = screen.getAllByRole('button', { name: '開啟選單' });
    await userEvent.click(actionButtons[0]); // 第一個商品有轉移記錄
    
    // 應該看到更新轉移狀態選項
    expect(screen.getByText('更新轉移狀態')).toBeInTheDocument();
  });

  it('沒有轉移記錄的商品不應該顯示更新轉移狀態選項', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 展開第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 找到沒有轉移記錄的商品的操作按鈕
    const actionButtons = screen.getAllByRole('button', { name: '開啟選單' });
    await userEvent.click(actionButtons[1]); // 第二個商品沒有轉移記錄
    
    // 不應該看到更新轉移狀態選項
    expect(screen.queryByText('更新轉移狀態')).not.toBeInTheDocument();
    expect(screen.getByText('查看商品')).toBeInTheDocument();
  });

  it('點擊更新轉移狀態應該開啟對話框', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 展開第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 開啟操作選單
    const actionButtons = screen.getAllByRole('button', { name: '開啟選單' });
    await userEvent.click(actionButtons[0]);
    
    // 點擊更新轉移狀態
    await userEvent.click(screen.getByText('更新轉移狀態'));
    
    // 檢查對話框是否開啟
    expect(screen.getByTestId('status-dialog')).toBeInTheDocument();
  });

  it('成功更新狀態後應該調用 refetch', async () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 展開第一個訂單
    const firstOrder = screen.getByText('ORD-2025-001').closest('div');
    await userEvent.click(firstOrder!);
    
    // 開啟更新狀態對話框
    const actionButtons = screen.getAllByRole('button', { name: '開啟選單' });
    await userEvent.click(actionButtons[0]);
    await userEvent.click(screen.getByText('更新轉移狀態'));
    
    // 點擊保存按鈕
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
    
    // 檢查是否調用了 refetch
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('應該根據狀態顯示不同的圖標', () => {
    render(<BackorderGroupedList data={mockGroupedData} onRefetch={mockRefetch} />);
    
    // 檢查是否有正確的狀態徽章
    expect(screen.getByText('調撥處理中')).toBeInTheDocument();
    expect(screen.getByText('待處理')).toBeInTheDocument();
    
    // 確保有圖標（透過檢查包含 SVG 的容器）
    const container = screen.getByText('調撥處理中').closest('div');
    expect(container?.querySelector('svg')).toBeInTheDocument();
  });

  it('超過7天的訂單應該以紅色顯示天數', () => {
    const dataWithOldOrder = [
      {
        ...mockGroupedData[0],
        days_pending: 10,
      },
    ];
    
    render(<BackorderGroupedList data={dataWithOldOrder} onRefetch={mockRefetch} />);
    
    const daysElement = screen.getByText('10 天');
    expect(daysElement).toHaveClass('text-destructive');
  });
});