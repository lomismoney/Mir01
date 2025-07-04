import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InventoryPagination } from '../InventoryPagination';

/**
 * Mock UI 組件
 */
jest.mock('@/components/ui/pagination', () => ({
  Pagination: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination">{children}</div>
  ),
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination-content">{children}</div>
  ),
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pagination-item">{children}</div>
  ),
  PaginationLink: ({ 
    children, 
    onClick, 
    isActive, 
    ...props 
  }: { 
    children: React.ReactNode; 
    onClick?: (e: React.MouseEvent) => void; 
    isActive?: boolean; 
  }) => (
    <button 
      onClick={onClick} 
      data-testid="pagination-link"
      data-active={isActive}
      {...props}
    >
      {children}
    </button>
  ),
  PaginationNext: ({ 
    onClick, 
    className, 
    ...props 
  }: { 
    onClick?: (e: React.MouseEvent) => void; 
    className?: string; 
  }) => (
    <button 
      onClick={onClick} 
      data-testid="pagination-next"
      className={className}
      {...props}
    >
      Next
    </button>
  ),
  PaginationPrevious: ({ 
    onClick, 
    className, 
    ...props 
  }: { 
    onClick?: (e: React.MouseEvent) => void; 
    className?: string; 
  }) => (
    <button 
      onClick={onClick} 
      data-testid="pagination-previous"
      className={className}
      {...props}
    >
      Previous
    </button>
  ),
}));

describe('InventoryPagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  /**
   * 測試當總數小於每頁數量時不渲染分頁
   */
  it('當總數小於每頁數量時不應該渲染分頁', () => {
    const meta = {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 5,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    // 應該不渲染分頁組件
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  /**
   * 測試基本分頁渲染
   */
  it('應該正確渲染分頁組件', () => {
    const meta = {
      current_page: 2,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    // 檢查基本結構
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-content')).toBeInTheDocument();
    
    // 檢查前一頁和後一頁按鈕
    expect(screen.getByTestId('pagination-previous')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
    
    // 檢查頁碼按鈕數量
    const pageLinks = screen.getAllByTestId('pagination-link');
    expect(pageLinks).toHaveLength(5);
  });

  /**
   * 測試第一頁時前一頁按鈕的禁用狀態
   */
  it('在第一頁時前一頁按鈕應該被禁用', () => {
    const meta = {
      current_page: 1,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const previousButton = screen.getByTestId('pagination-previous');
    expect(previousButton).toHaveClass('pointer-events-none opacity-50');
  });

  /**
   * 測試最後一頁時後一頁按鈕的禁用狀態
   */
  it('在最後一頁時後一頁按鈕應該被禁用', () => {
    const meta = {
      current_page: 5,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const nextButton = screen.getByTestId('pagination-next');
    expect(nextButton).toHaveClass('pointer-events-none opacity-50');
  });

  /**
   * 測試頁碼按鈕的點擊事件
   */
  it('點擊頁碼按鈕應該調用 onPageChange', () => {
    const meta = {
      current_page: 2,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const pageLinks = screen.getAllByTestId('pagination-link');
    
    // 點擊第3頁
    fireEvent.click(pageLinks[2]);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  /**
   * 測試前一頁按鈕的點擊事件
   */
  it('點擊前一頁按鈕應該調用 onPageChange', () => {
    const meta = {
      current_page: 3,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const previousButton = screen.getByTestId('pagination-previous');
    fireEvent.click(previousButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  /**
   * 測試後一頁按鈕的點擊事件
   */
  it('點擊後一頁按鈕應該調用 onPageChange', () => {
    const meta = {
      current_page: 3,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const nextButton = screen.getByTestId('pagination-next');
    fireEvent.click(nextButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  /**
   * 測試當前頁面的高亮顯示
   */
  it('當前頁面應該被高亮顯示', () => {
    const meta = {
      current_page: 3,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const pageLinks = screen.getAllByTestId('pagination-link');
    
    // 檢查第3頁（index 2）是否為活躍狀態
    expect(pageLinks[2]).toHaveAttribute('data-active', 'true');
    
    // 檢查其他頁面不是活躍狀態
    expect(pageLinks[0]).toHaveAttribute('data-active', 'false');
    expect(pageLinks[1]).toHaveAttribute('data-active', 'false');
  });

  /**
   * 測試邊界情況：第一頁點擊前一頁不應該觸發回調
   */
  it('在第一頁點擊前一頁不應該觸發回調', () => {
    const meta = {
      current_page: 1,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const previousButton = screen.getByTestId('pagination-previous');
    fireEvent.click(previousButton);
    
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  /**
   * 測試邊界情況：最後一頁點擊後一頁不應該觸發回調
   */
  it('在最後一頁點擊後一頁不應該觸發回調', () => {
    const meta = {
      current_page: 5,
      last_page: 5,
      per_page: 10,
      total: 50,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    const nextButton = screen.getByTestId('pagination-next');
    fireEvent.click(nextButton);
    
    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  /**
   * 測試當 meta 為空時的處理
   */
  it('當 meta 為空時不應該渲染分頁', () => {
    // @ts-expect-error Testing edge case
    render(<InventoryPagination meta={null} onPageChange={mockOnPageChange} />);
    
    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  /**
   * 測試單頁情況
   */
  it('只有一頁時應該正確渲染', () => {
    const meta = {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 15,
    };

    render(<InventoryPagination meta={meta} onPageChange={mockOnPageChange} />);
    
    // 檢查是否只有一個頁碼按鈕
    const pageLinks = screen.getAllByTestId('pagination-link');
    expect(pageLinks).toHaveLength(1);
    expect(pageLinks[0]).toHaveTextContent('1');
    expect(pageLinks[0]).toHaveAttribute('data-active', 'true');
  });
}); 