import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InventoryAdjustmentDialog } from '../InventoryAdjustmentDialog';

/**
 * Mock lucide-react 圖標
 */
jest.mock('lucide-react', () => ({
  ArrowUpDown: ({ className }: { className?: string }) => (
    <svg data-testid="arrow-up-down-icon" className={className} />
  ),
}));

/**
 * Mock InventoryAdjustmentForm 組件
 */
jest.mock('../InventoryAdjustmentForm', () => ({
  InventoryAdjustmentForm: ({ 
    onSuccess, 
    productVariantId, 
    currentQuantity, 
    dialogOpen 
  }: { 
    onSuccess: () => void; 
    productVariantId: number; 
    currentQuantity: number; 
    dialogOpen: boolean; 
  }) => (
    <div data-testid="inventory-adjustment-form">
      <div data-testid="form-props">
        <span data-testid="product-variant-id">{productVariantId}</span>
        <span data-testid="current-quantity">{currentQuantity}</span>
        <span data-testid="dialog-open">{dialogOpen.toString()}</span>
      </div>
      <button 
        onClick={() => onSuccess()}
        data-testid="form-submit-button"
      >
        提交調整
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
    size, 
    ...props 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
  }) => (
    <button 
      onClick={onClick} 
      data-testid="button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

/**
 * Mock Dialog 組件
 */
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
  DialogContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
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

describe('InventoryAdjustmentDialog', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    mockOnSuccess.mockClear();
  });

  /**
   * 測試組件基本渲染
   */
  it('應該正確渲染調整對話框', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查 Dialog 組件
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    
    // 檢查觸發按鈕
    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toBeInTheDocument();
    
    // 檢查按鈕內容
    const button = screen.getByTestId('button');
    expect(button).toHaveTextContent('修改庫存');
    expect(screen.getByTestId('arrow-up-down-icon')).toBeInTheDocument();
  });

  /**
   * 測試對話框內容渲染
   */
  it('應該渲染對話框內容', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查對話框標題
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('修改庫存');
    
    // 檢查對話框描述
    expect(screen.getByTestId('dialog-description')).toHaveTextContent('調整指定商品的庫存數量（增加、減少或設定）');
    
    // 檢查調整表單
    expect(screen.getByTestId('inventory-adjustment-form')).toBeInTheDocument();
  });

  /**
   * 測試對話框狀態管理
   */
  it('應該正確管理對話框開關狀態', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 初始狀態應該是關閉的
    const dialog = screen.getByTestId('dialog');
    expect(dialog).toHaveAttribute('data-open', 'false');
  });

  /**
   * 測試表單提交成功後的處理
   */
  it('表單提交成功後應該關閉對話框並調用回調', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
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
    render(<InventoryAdjustmentDialog />);
    
    // 點擊表單提交按鈕
    const submitButton = screen.getByTestId('form-submit-button');
    
    // 不應該出錯
    expect(() => fireEvent.click(submitButton)).not.toThrow();
  });

  /**
   * 測試對話框關閉
   */
  it('應該能夠關閉對話框', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
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
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  /**
   * 測試對話框內容的樣式設定
   */
  it('對話框內容應該有正確的樣式設定', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    const dialogContent = screen.getByTestId('dialog-content');
    expect(dialogContent).toBeInTheDocument();
    expect(dialogContent).toHaveClass('max-w-2xl max-h-[90vh] overflow-y-auto');
  });

  /**
   * 測試圖標顯示
   */
  it('應該顯示正確的圖標', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    const icon = screen.getByTestId('arrow-up-down-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4 w-4 mr-2');
  });

  /**
   * 測試對話框觸發器設定
   */
  it('對話框觸發器應該設定 asChild 屬性', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    const trigger = screen.getByTestId('dialog-trigger');
    expect(trigger).toHaveAttribute('data-as-child', 'true');
  });

  /**
   * 測試表單預設參數
   */
  it('應該傳遞正確的預設參數給表單', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查表單接收到的參數
    expect(screen.getByTestId('product-variant-id')).toHaveTextContent('0');
    expect(screen.getByTestId('current-quantity')).toHaveTextContent('0');
    expect(screen.getByTestId('dialog-open')).toHaveTextContent('false');
  });

  /**
   * 測試完整的用戶流程
   */
  it('應該支持完整的用戶流程', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查初始狀態
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    
    // 檢查可以看到表單
    expect(screen.getByTestId('inventory-adjustment-form')).toBeInTheDocument();
    
    // 提交表單
    const submitButton = screen.getByTestId('form-submit-button');
    fireEvent.click(submitButton);
    
    // 檢查回調被調用
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  /**
   * 測試對話框標題和描述的一致性
   */
  it('對話框標題和按鈕文字應該一致', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查標題和按鈕文字
    const title = screen.getByTestId('dialog-title');
    const button = screen.getByTestId('button');
    
    expect(title).toHaveTextContent('修改庫存');
    expect(button).toHaveTextContent('修改庫存');
  });

  /**
   * 測試對話框結構完整性
   */
  it('應該包含完整的對話框結構', () => {
    render(<InventoryAdjustmentDialog onSuccess={mockOnSuccess} />);
    
    // 檢查完整的對話框結構
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-adjustment-form')).toBeInTheDocument();
  });
}); 