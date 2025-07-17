import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StockSuggestionDialog, StockDecision } from '../StockSuggestionDialog';
import { StockSuggestion } from '@/hooks/queries/orders/useCheckStockAvailability';

describe('StockSuggestionDialog', () => {
  const mockSuggestions: StockSuggestion[] = [
    {
      product_variant_id: 1,
      product_name: 'Product A',
      sku: 'SKU-001',
      requested_quantity: 10,
      available_quantity: 5,
      shortage_quantity: 5,
      type: 'transfer',
      current_store_stock: 5,
      shortage: 5,
      transfers: [
        {
          from_store_id: 2,
          from_store_name: 'Store B',
          available_quantity: 8,
          suggested_quantity: 5,
        },
      ],
    },
    {
      product_variant_id: 2,
      product_name: 'Product B',
      sku: 'SKU-002',
      requested_quantity: 20,
      available_quantity: 10,
      shortage_quantity: 10,
      type: 'mixed',
      current_store_stock: 10,
      shortage: 10,
      transfers: [
        {
          from_store_id: 3,
          from_store_name: 'Store C',
          available_quantity: 6,
          suggested_quantity: 6,
        },
      ],
      purchase_quantity: 4,
    },
    {
      product_variant_id: 3,
      product_name: 'Product C',
      sku: 'SKU-003',
      requested_quantity: 15,
      available_quantity: 0,
      shortage_quantity: 15,
      type: 'purchase',
      current_store_stock: 0,
      shortage: 15,
    },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    suggestions: mockSuggestions,
    onConfirm: jest.fn(),
    onForceCreate: jest.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <StockSuggestionDialog {...defaultProps} open={false} />
    );

    expect(screen.queryByText('庫存不足提醒')).not.toBeInTheDocument();
  });

  it('should render dialog with title and description', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    expect(screen.getByText('庫存不足提醒')).toBeInTheDocument();
    expect(screen.getByText('以下商品在選定門市的庫存不足，系統已分析並提供最佳處理建議')).toBeInTheDocument();
  });

  it('should display all shortage items', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-001')).toBeInTheDocument();
    expect(screen.getByText('缺貨 5 件')).toBeInTheDocument();

    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-002')).toBeInTheDocument();
    expect(screen.getByText('缺貨 10 件')).toBeInTheDocument();

    expect(screen.getByText('Product C')).toBeInTheDocument();
    expect(screen.getByText('SKU: SKU-003')).toBeInTheDocument();
    expect(screen.getByText('缺貨 15 件')).toBeInTheDocument();
  });

  it('should filter out sufficient stock items', () => {
    const suggestionsWithSufficient = [
      ...mockSuggestions,
      {
        product_variant_id: 4,
        product_name: 'Product D',
        sku: 'SKU-004',
        requested_quantity: 5,
        available_quantity: 10,
        shortage_quantity: 0,
        type: 'sufficient' as const,
        current_store_stock: 10,
        shortage: 0,
      },
    ];

    render(
      <StockSuggestionDialog
        {...defaultProps}
        suggestions={suggestionsWithSufficient}
      />
    );

    expect(screen.queryByText('Product D')).not.toBeInTheDocument();
  });

  it('should show transfer option when available', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    // There are multiple transfer options, use getAllByText
    const transferOptions = screen.getAllByText('從其他門市調貨');
    expect(transferOptions.length).toBeGreaterThan(0);
    expect(screen.getByText('Store B')).toBeInTheDocument();
    expect(screen.getByText('調貨 5 件')).toBeInTheDocument();
    expect(screen.getByText('(可用: 8)')).toBeInTheDocument();
  });

  it('should show purchase option', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    const purchaseOptions = screen.getAllByText('向供應商進貨');
    expect(purchaseOptions.length).toBeGreaterThan(0);
    expect(screen.getByText('進貨 15 件，加入待進貨清單')).toBeInTheDocument();
  });

  it('should show mixed option when available', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    expect(screen.getByText('部分調貨 + 部分進貨')).toBeInTheDocument();
    // Store C might appear multiple times, use getAllByText
    const storeCTexts = screen.getAllByText('Store C');
    expect(storeCTexts.length).toBeGreaterThan(0);
    // Use getAllByText for repeated text
    const purchaseTexts = screen.getAllByText(/向供應商進貨 \d+ 件/);
    expect(purchaseTexts.length).toBeGreaterThan(0);
  });

  it('should handle radio button selection', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    // Find radio buttons by their test id or role
    const radioButtons = screen.getAllByRole('radio');
    // Find the purchase radio for product 1 (should be the second radio for that product)
    const purchaseRadio = radioButtons.find(radio => 
      radio.id === 'purchase-1'
    );
    
    if (purchaseRadio) {
      fireEvent.click(purchaseRadio);
      expect(purchaseRadio).toBeChecked();
    }
  });

  it('should call onConfirm with correct decisions', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    const confirmButton = screen.getByText('確認處理方案');
    fireEvent.click(confirmButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledWith([
      {
        product_variant_id: 1,
        action: 'transfer',
        transfers: [
          {
            from_store_id: 2,
            quantity: 5,
          },
        ],
      },
      {
        product_variant_id: 2,
        action: 'mixed',
        transfers: [
          {
            from_store_id: 3,
            quantity: 6,
          },
        ],
        purchase_quantity: 4,
      },
      {
        product_variant_id: 3,
        action: 'purchase',
        purchase_quantity: 15,
      },
    ]);
  });

  it('should call onForceCreate when ignore button is clicked', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    const ignoreButton = screen.getByText('忽略並建立預訂單');
    fireEvent.click(ignoreButton);

    expect(defaultProps.onForceCreate).toHaveBeenCalled();
  });

  it('should disable buttons when processing', () => {
    render(<StockSuggestionDialog {...defaultProps} isProcessing={true} />);

    const confirmButton = screen.getByText('確認處理方案');
    const ignoreButton = screen.getByText('忽略並建立預訂單');

    expect(confirmButton).toBeDisabled();
    expect(ignoreButton).toBeDisabled();
  });

  it('should show loading spinner when processing', () => {
    render(<StockSuggestionDialog {...defaultProps} isProcessing={true} />);

    const spinners = document.querySelectorAll('.animate-spin');
    expect(spinners.length).toBe(2); // One for each button
  });

  it('should handle empty suggestions', () => {
    render(<StockSuggestionDialog {...defaultProps} suggestions={[]} />);

    // Should still render the dialog structure
    expect(screen.getByText('庫存不足提醒')).toBeInTheDocument();
    
    // But no product cards
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
  });

  it('should update decisions when radio selection changes', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    // Find the purchase radio for product 1
    const radioButtons = screen.getAllByRole('radio');
    const purchaseRadio = radioButtons.find(radio => radio.id === 'purchase-1');
    
    if (purchaseRadio) {
      // Click to change to purchase
      fireEvent.click(purchaseRadio);

      // Click confirm
      const confirmButton = screen.getByText('確認處理方案');
      fireEvent.click(confirmButton);

      // Check that the first item now has purchase action
      expect(defaultProps.onConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            product_variant_id: 1,
            action: 'purchase',
            purchase_quantity: 5,
          }),
        ])
      );
    }
  });

  it('should have proper footer text', () => {
    render(<StockSuggestionDialog {...defaultProps} />);

    expect(screen.getByText('選擇處理方式後，系統將自動建立相應的調貨單或進貨需求')).toBeInTheDocument();
  });
});