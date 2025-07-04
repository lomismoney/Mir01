import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderFormProductBadge } from '../OrderFormProductBadge';

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

/**
 * OrderFormItem 類型
 */
interface OrderFormItem {
  product_variant_id: number | null;
  is_stocked_sale: boolean;
  custom_specifications?: Record<string, any> | null;
  quantity: number;
  stock?: number;
}

describe('OrderFormProductBadge', () => {
  /**
   * 創建測試用的基礎表單項目
   */
  const createMockItem = (overrides: Partial<OrderFormItem> = {}): OrderFormItem => ({
    product_variant_id: 1,
    is_stocked_sale: true,
    custom_specifications: null,
    quantity: 1,
    stock: 10,
    ...overrides,
  });

  /**
   * 測試組件基本渲染
   */
  it('應該正確渲染徽章組件', () => {
    const item = createMockItem();
    render(<OrderFormProductBadge item={item} />);
    
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  describe('訂製商品', () => {
    test('當 product_variant_id 為 null 時應該顯示訂製徽章', () => {
      const item = {
        product_variant_id: null,
        is_stocked_sale: false,
        quantity: 1,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });

    test('當有自訂規格時應該顯示訂製徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        custom_specifications: { color: 'red', size: 'large' },
        quantity: 1,
        stock: 10,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });
  });

  describe('預訂商品', () => {
    test('當標準商品庫存不足時應該顯示預訂徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 10,
        stock: 5, // 庫存不足
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('預訂');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    test('當庫存為 0 時應該顯示預訂徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 1,
        stock: 0,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('預訂');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });
  });

  describe('庫存商品', () => {
    test('當標準商品庫存充足時應該顯示庫存商品徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        stock: 10, // 庫存充足
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    test('當庫存等於需求量時應該顯示庫存商品徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        stock: 5, // 庫存剛好等於需求
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    test('當沒有庫存數據時應該顯示庫存商品徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        // 沒有 stock 屬性
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    test('當 is_stocked_sale 為 false 時應該顯示庫存商品徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: false,
        quantity: 5,
        stock: 2, // 雖然庫存不足，但非庫存銷售
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('樣式屬性', () => {
    test('應該應用默認的 className', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        stock: 10,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('text-xs');
    });

    test('應該應用自訂的 className', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        stock: 10,
      };

      render(<OrderFormProductBadge item={item} className="custom-class" />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('邊界條件', () => {
    test('當 stock 為負數時應該正確處理', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 5,
        stock: -1,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('預訂');
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    test('當 quantity 為 0 時應該正確處理', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        quantity: 0,
        stock: 5,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('庫存商品');
      expect(badge).toHaveAttribute('data-variant', 'outline');
    });

    test('當 custom_specifications 為空對象時應該顯示訂製徽章', () => {
      const item = {
        product_variant_id: 1,
        is_stocked_sale: true,
        custom_specifications: {},
        quantity: 1,
        stock: 10,
      };

      render(<OrderFormProductBadge item={item} />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveTextContent('訂製');
      expect(badge).toHaveAttribute('data-variant', 'secondary');
    });
  });
}); 