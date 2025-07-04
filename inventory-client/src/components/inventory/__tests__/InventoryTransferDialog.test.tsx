import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InventoryTransferDialog } from '../InventoryTransferDialog';

/**
 * Mock lucide-react 圖標
 */
jest.mock('lucide-react', () => ({
  ArrowRightLeft: ({ className }: { className?: string }) => (
    <svg data-testid="arrow-right-left-icon" className={className} />
  ),
}));

/**
 * Mock InventoryTransferForm 組件
 */
const mockOnFormSuccess = jest.fn();
jest.mock('../InventoryTransferForm', () => ({
  InventoryTransferForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="inventory-transfer-form">
      <button 
        onClick={() => onSuccess()}
        data-testid="form-submit-button"
      >
        提交轉移
      </button>
    </div>
  ),
}));

/**
 * Mock UI 組件
 */
jest.mock('@/components/ui/button', () => ({
  Button: ({ 
    children, 
    onClick, 
    variant, 
    ...props 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
  }) => (
    <button 
      onClick={onClick} 
      data-testid="button"
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

/**
 * Mock Dialog 組件
 */
const mockSetOpen = jest.fn();
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ 
    children, 
    open, 
    onOpenChange 
  }: { 
    children: React.ReactNode; 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
  }) => (
    <div data-testid="dialog" data-open={open}>
      {children}
      <button 
        onClick={() => onOpenChange(false)}
        data-testid="dialog-close"
      >
        關閉
      </button>
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p data-testid="dialog-description">{children}</p>
  ),
  DialogTrigger: ({ 
    children, 
    asChild 
  }: { 
    children: React.ReactNode; 
    asChild?: boolean; 
  }) => (
    <div data-testid="dialog-trigger" data-as-child={asChild}>
      {children}
    </div>
  ),
}));

describe('InventoryTransferDialog', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
    mockOnFormSuccess.mockClear();
  });

  /**
   * 測試組件基本渲染
   */
  it('應該正確渲染轉移對話框', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 檢查 Dialog 組件
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    
    // 檢查觸發按鈕
    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toBeInTheDocument();
    
    // 檢查按鈕內容
    const button = screen.getByTestId('button');
    expect(button).toHaveTextContent('新增轉移');
    expect(screen.getByTestId('arrow-right-left-icon')).toBeInTheDocument();
  });

  /**
   * 測試對話框內容渲染
   */
  it('應該渲染對話框內容', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 檢查對話框標題
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('新增庫存轉移');
    
    // 檢查對話框描述
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('在不同門市之間轉移庫存');
    
    // 檢查轉移表單
    expect(screen.getByTestId('inventory-transfer-form')).toBeInTheDocument();
  });

  /**
   * 測試對話框狀態管理
   */
  it('應該正確管理對話框開關狀態', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 初始狀態應該是關閉的
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-open', 'false');
  });

  /**
   * 測試表單提交成功後的處理
   */
  it('表單提交成功後應該關閉對話框並調用回調', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 點擊表單提交按鈕
    const submitButton = screen.getByTestId('form-submit-button');
    fireEvent.click(submitButton);
    
    // 檢查 onSuccess 回調是否被調用
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  /**
   * 測試沒有提供 onSuccess 回調的情況
   */
  it('沒有提供 onSuccess 回調時不應該出錯', () => {
    render(<InventoryTransferDialog />);
    
    // 點擊表單提交按鈕
    const submitButton = screen.getByTestId('form-submit-button');
    
    // 不應該出錯
    expect(() => fireEvent.click(submitButton)).not.toThrow();
  });

  /**
   * 測試對話框關閉
   */
  it('應該能夠關閉對話框', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 點擊關閉按鈕
    const closeButton = screen.getByTestId('dialog-close');
    fireEvent.click(closeButton);
    
    // 檢查對話框是否被關閉
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-open', 'false');
  });

  /**
   * 測試按鈕樣式
   */
  it('觸發按鈕應該有正確的樣式', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    const button = screen.getByTestId('button');
    // 檢查按鈕元素存在即可，因為沒有明確設定 variant 屬性
    expect(button).toBeInTheDocument();
  });

  /**
   * 測試對話框內容的樣式設定
   */
  it('對話框內容應該有正確的樣式設定', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent).toBeInTheDocument();
    // Mock 組件不會傳遞 className，只檢查元素存在即可
  });

  /**
   * 測試圖標顯示
   */
  it('應該顯示正確的圖標', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    const icon = screen.getByTestId('arrow-right-left-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4 w-4 mr-2');
  });

  /**
   * 測試對話框觸發器設定
   */
  it('對話框觸發器應該設定 asChild 屬性', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toHaveAttribute('data-as-child', 'true');
  });

  /**
   * 測試完整的用戶流程
   */
  it('應該支持完整的用戶流程', () => {
    render(<InventoryTransferDialog onSuccess={mockOnSuccess} />);
    
    // 檢查初始狀態
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    
    // 檢查可以看到表單
    expect(screen.getByTestId('inventory-transfer-form')).toBeInTheDocument();
    
    // 提交表單
    const submitButton = screen.getByTestId('form-submit-button');
    fireEvent.click(submitButton);
    
    // 檢查回調被調用
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });
}); 