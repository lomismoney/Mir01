import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VariantDetailsModal from '../VariantDetailsModal';
import { ProductItem } from '@/types/api-helpers';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

const mockProduct: ProductItem = {
  id: 1,
  name: '測試商品',
  description: '測試描述',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  price_range: {
    min: 100,
    max: 200
  },
  variants: [
    {
      id: 1,
      sku: 'TEST001',
      price: '100',
      created_at: '2023-01-01T00:00:00Z',
      attribute_values: [
        {
          id: 1,
          value: '紅色',
          attribute: {
            id: 1,
            name: '顏色'
          }
        },
        {
          id: 2,
          value: 'L',
          attribute: {
            id: 2,
            name: '尺寸'
          }
        }
      ],
      inventory: [
        {
          id: 1,
          quantity: 10,
          store: {
            id: 1,
            name: '主門市'
          }
        }
      ]
    },
    {
      id: 2,
      sku: 'TEST002',
      price: '200',
      created_at: '2023-01-02T00:00:00Z',
      attribute_values: [
        {
          id: 3,
          value: '藍色',
          attribute: {
            id: 1,
            name: '顏色'
          }
        }
      ]
    }
  ]
};

const mockProductWithoutVariants: ProductItem = {
  id: 2,
  name: '無規格商品',
  description: '測試描述',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  variants: []
};

describe('VariantDetailsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <VariantDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.queryByText('商品規格詳情')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('商品規格詳情')).toBeInTheDocument();
    expect(screen.getByText('- 測試商品')).toBeInTheDocument();
  });

  it('should render product summary information', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('測試商品')).toBeInTheDocument();
    expect(screen.getByText('2 個 SKU')).toBeInTheDocument();
    expect(screen.getByText('$100 - $200')).toBeInTheDocument();
  });

  it('should render SKU table with variants', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('TEST001')).toBeInTheDocument();
    expect(screen.getByText('TEST002')).toBeInTheDocument();
    expect(screen.getByText('顏色: 紅色, 尺寸: L')).toBeInTheDocument();
    expect(screen.getByText('顏色: 藍色')).toBeInTheDocument();
  });

  it('should render prices correctly', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('should render inventory information', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('10 件')).toBeInTheDocument();
    expect(screen.getByText('待對接')).toBeInTheDocument();
  });

  it('should render creation dates', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('2023/01/01')).toBeInTheDocument();
    expect(screen.getByText('2023/01/02')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋 SKU 編碼...');
    
    fireEvent.change(searchInput, { target: { value: 'TEST001' } });

    await waitFor(() => {
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.queryByText('TEST002')).not.toBeInTheDocument();
    });
  });

  it('should handle pagination', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    expect(screen.getByText('共 2 個 SKU')).toBeInTheDocument();
    expect(screen.getByText('上一頁')).toBeInTheDocument();
    expect(screen.getByText('下一頁')).toBeInTheDocument();
  });

  it('should render empty state when no variants', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProductWithoutVariants}
      />
    );

    expect(screen.getByText('此商品尚無 SKU 規格')).toBeInTheDocument();
    expect(screen.getByText('請先為商品添加規格變體')).toBeInTheDocument();
  });

  it('should render empty state when no product', () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={null}
      />
    );

    expect(screen.getByText('請選擇一個商品以查看其規格詳情')).toBeInTheDocument();
  });

  it('should handle variant with no SKU', () => {
    const productWithEmptySku: ProductItem = {
      ...mockProduct,
      variants: [
        {
          id: 1,
          sku: '',
          price: '100',
          created_at: '2023-01-01T00:00:00Z',
          attribute_values: []
        }
      ]
    };

    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={productWithEmptySku}
      />
    );

    expect(screen.getByText('無 SKU')).toBeInTheDocument();
    expect(screen.getByText('無規格')).toBeInTheDocument();
  });

  it('should handle variant with no price', () => {
    const productWithNoPrice: ProductItem = {
      ...mockProduct,
      variants: [
        {
          id: 1,
          sku: 'TEST001',
          price: undefined,
          created_at: '2023-01-01T00:00:00Z',
          attribute_values: []
        }
      ]
    };

    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={productWithNoPrice}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle variant with no created_at', () => {
    const productWithNoDate: ProductItem = {
      ...mockProduct,
      variants: [
        {
          id: 1,
          sku: 'TEST001',
          price: '100',
          created_at: undefined,
          attribute_values: []
        }
      ]
    };

    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={productWithNoDate}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should handle attribute values with missing data', () => {
    const productWithInvalidAttrs: ProductItem = {
      ...mockProduct,
      variants: [
        {
          id: 1,
          sku: 'TEST001',
          price: '100',
          created_at: '2023-01-01T00:00:00Z',
          attribute_values: [
            {
              id: 1,
              value: '',
              attribute: {
                id: 1,
                name: ''
              }
            }
          ]
        }
      ]
    };

    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={productWithInvalidAttrs}
      />
    );

    expect(screen.getByText('未知屬性: 未知值')).toBeInTheDocument();
  });

  it('should show no results message when search has no matches', async () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    const searchInput = screen.getByPlaceholderText('搜尋 SKU 編碼...');
    
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } });

    await waitFor(() => {
      expect(screen.getByText('沒有找到相符的 SKU')).toBeInTheDocument();
    });
  });

  it('should handle edit action click', async () => {
    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
      />
    );

    await waitFor(() => {
      const actionButtons = screen.getAllByText('開啟選單');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  it('should handle product without price range', () => {
    const productWithoutPriceRange: ProductItem = {
      ...mockProduct,
      price_range: undefined
    };

    render(
      <VariantDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        product={productWithoutPriceRange}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});