import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductStatusBadge } from '../ProductStatusBadge';
import { ProcessedOrderItem } from '@/types/api-helpers';

/**
 * Mock Badge 組件
 */
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

describe('ProductStatusBadge', () => {
  /**
   * 創建測試用的基礎商品項目
   */
  const createMockItem = (overrides: Partial<ProcessedOrderItem> = {}): ProcessedOrderItem => ({
    id: 1,
    product_variant_id: 1,
    quantity: 1,
    unit_price: 1000,
    subtotal: 1000,
    is_stocked_sale: true,
    is_backorder: false,
    custom_specifications: null,
    ...overrides,
  } as ProcessedOrderItem);

  /**
   * 測試組件基本渲染
   */
  it('應該正確渲染徽章組件', () => {
    const item = createMockItem();
    render(<ProductStatusBadge item={item} />);
    
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  describe('訂製商品', () => {
    test('當 is_stocked_sale 為 false 時應該顯示訂製徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: false,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    test('當有 custom_specifications 時應該顯示訂製徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: { color: 'red', size: 'large' },
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    test('當 is_stocked_sale 為 false 且有 custom_specifications 時應該顯示訂製徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: false,
        is_backorder: true,
        custom_specifications: { material: 'wood' },
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('預訂商品', () => {
    test('當標準商品為 backorder 時應該顯示預訂徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: true,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('預訂');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });
  });

  describe('庫存商品', () => {
    test('當標準商品有庫存時應該顯示庫存商品徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    test('當 custom_specifications 為 null 且 is_stocked_sale 為 true 且非 backorder 時應該顯示庫存商品徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('樣式屬性', () => {
    test('應該應用默認的 className', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-xs');
    });

    test('應該應用自訂的 className', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} className="custom-class" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('邊界條件', () => {
    test('當 custom_specifications 為空對象時應該顯示訂製徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: {},
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    test('當所有條件為假值時應該顯示庫存商品徽章', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: false,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('優先級測試', () => {
    test('當商品既是非庫存銷售又是 backorder 時應該優先顯示訂製', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: false,
        is_backorder: true,
        custom_specifications: null,
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    test('當商品有自訂規格且是 backorder 時應該優先顯示訂製', () => {
      const item: ProcessedOrderItem = {
        id: 1,
        is_stocked_sale: true,
        is_backorder: true,
        custom_specifications: { type: 'custom' },
      } as ProcessedOrderItem;

      render(<ProductStatusBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });
  });
}); 