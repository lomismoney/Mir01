import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryTransfer from '../InventoryTransfer';

/**
 * Mock InventoryTransferDialog 組件
 */
jest.mock('../InventoryTransferDialog', () => ({
  InventoryTransferDialog: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button 
      onClick={() => onSuccess?.()} 
      data-testid="inventory-transfer-dialog"
    >
      新增轉移
    </button>
  ),
}));

/**
 * Mock InventoryTransferList 組件
 */
jest.mock('../InventoryTransferList', () => ({
  InventoryTransferList: () => (
    <div data-testid="inventory-transfer-list">
      轉移列表
    </div>
  ),
}));

/**
 * Mock UI 組件
 */
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}));

describe('InventoryTransfer', () => {
  /**
   * 測試組件基本渲染
   */
  it('應該正確渲染庫存轉移管理界面', () => {
    render(<InventoryTransfer />);
    
    // 檢查卡片標題
    expect(screen.getByTestId('card-title')).toHaveTextContent('庫存轉移管理');
    
    // 檢查是否包含轉移對話框
    expect(screen.getByTestId('inventory-transfer-dialog')).toBeInTheDocument();
    
    // 檢查是否包含轉移列表
    expect(screen.getByTestId('inventory-transfer-list')).toBeInTheDocument();
  });

  /**
   * 測試組件結構
   */
  it('應該有正確的組件結構', () => {
    render(<InventoryTransfer />);
    
    // 檢查卡片結構
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  /**
   * 測試子組件的渲染
   */
  it('應該渲染 InventoryTransferDialog 和 InventoryTransferList', () => {
    render(<InventoryTransfer />);
    
    // 檢查 Dialog 組件
    expect(screen.getByTestId('inventory-transfer-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-transfer-dialog')).toHaveTextContent('新增轉移');
    
    // 檢查 List 組件
    expect(screen.getByTestId('inventory-transfer-list')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-transfer-list')).toHaveTextContent('轉移列表');
  });

  /**
   * 測試無障礙性
   */
  it('應該有適當的無障礙性標籤', () => {
    render(<InventoryTransfer />);
    
    // 檢查標題存在
    const title = screen.getByTestId('card-title');
    expect(title).toHaveTextContent('庫存轉移管理');
  });
}); 