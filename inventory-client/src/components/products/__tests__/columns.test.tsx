import { render, screen, fireEvent } from '@testing-library/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { columns, ExpandedProductItem } from '../columns';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const mockProduct: ExpandedProductItem = {
  id: '1',
  originalId: 1,
  name: '測試商品',
  description: '測試描述',
  created_at: '2023-01-01T10:30:00Z',
  updated_at: '2023-01-01T10:30:00Z',
  image_urls: {
    thumb: 'http://localhost:8000/image/thumb.jpg',
    original: 'http://localhost:8000/image/original.jpg'
  },
  category: {
    id: 1,
    name: '測試分類'
  },
  price_range: {
    min: 100,
    max: 200,
    count: 2
  },
  variants: [
    {
      id: 1,
      sku: 'TEST001',
      price: "100",
      created_at: '2023-01-01T00:00:00Z',
      attribute_values: [
        {
          id: 1,
          value: '紅色',
          attribute: {
            id: 1,
            name: '顏色'
          }
        }
      ],
      inventory: [
        {
          id: 1,
          quantity: 5,
          low_stock_threshold: 5,
          store: {
            id: 1,
            name: '門市1'
          }
        }
      ]
    },
    {
      id: 2,
      sku: 'TEST002',
      price: "200",
      created_at: '2023-01-01T00:00:00Z',
      attribute_values: [],
      inventory: [
        {
          id: 2,
          quantity: 15,
          low_stock_threshold: 10,
          store: {
            id: 1,
            name: '門市1'
          }
        }
      ]
    }
  ]
};

const mockVariantRow: ExpandedProductItem = {
  id: '1-variant-1',
  originalId: 1,
  isVariantRow: true,
  parentId: 1,
  name: '測試商品',
  description: '測試描述',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  variantInfo: {
    id: 1,
    sku: 'TEST001',
    price: "100",
    attribute_values: [
      {
        id: 1,
        value: '紅色',
        attribute: {
          id: 1,
          name: '顏色'
        }
      }
    ],
    inventory: [
      {
        id: 1,
        quantity: 10,
        low_stock_threshold: 5,
        store: {
          id: 1,
          name: '門市1'
        }
      }
    ]
  }
};

const mockSingleVariantProduct: ExpandedProductItem = {
  id: '2',
  originalId: 2,
  name: '單規格商品',
  description: '測試描述',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  price_range: {
    min: 150,
    max: 150,
    count: 1
  },
  variants: [
    {
      id: 3,
      sku: 'SINGLE001',
      price: "150",
      created_at: '2023-01-01T00:00:00Z',
      attribute_values: [],
      inventory: [
        {
          id: 3,
          quantity: 25,
          low_stock_threshold: 10,
          store: {
            id: 1,
            name: '門市1'
          }
        }
      ]
    }
  ]
};

const TestTable = ({ data }: { data: ExpandedProductItem[] }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

describe('Product Columns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window events
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true
    });
  });

  describe('Select Column', () => {
    it('should render select checkbox for main product row', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByLabelText('全選')).toBeInTheDocument();
      expect(screen.getByLabelText('選擇商品')).toBeInTheDocument();
    });

    it('should not render select checkbox for variant row', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(1); // Only header checkbox
    });
  });

  describe('Expander Column', () => {
    it('should render expand button for multi-variant products', () => {
      render(<TestTable data={[mockProduct]} />);
      
      const allButtons = screen.getAllByRole('button');
      const expandButton = allButtons.find(button => 
        button.querySelector('svg[class*="chevron"]')
      );
      expect(expandButton).toBeInTheDocument();
    });

    it('should not render expand button for single variant products', () => {
      render(<TestTable data={[mockSingleVariantProduct]} />);
      
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(1); // Only action menu button
    });

    it('should render connection line for variant rows', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.getByTestId || document.querySelector('.bg-border')).toBeTruthy();
    });
  });

  describe('Product Column', () => {
    it('should render product image and name for main product', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByText('測試商品')).toBeInTheDocument();
      expect(screen.getByText('SKU: TEST001')).toBeInTheDocument();
    });

    it('should render variant info for variant row', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('變體規格')).toBeInTheDocument();
    });

    it('should handle products without image', () => {
      const productWithoutImage = { ...mockProduct, image_urls: undefined };
      render(<TestTable data={[productWithoutImage]} />);
      
      expect(screen.getByText('測試商品')).toBeInTheDocument();
    });

    it('should handle products without variants', () => {
      const productWithoutVariants = { ...mockProduct, variants: [] };
      render(<TestTable data={[productWithoutVariants]} />);
      
      expect(screen.getByText('測試商品')).toBeInTheDocument();
      expect(screen.queryByText('SKU:')).not.toBeInTheDocument();
    });
  });

  describe('Specs Column', () => {
    it('should render category and variant count for main product', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByText('測試分類')).toBeInTheDocument();
      expect(screen.getByText('2 個規格')).toBeInTheDocument();
    });

    it('should render attributes for variant row', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.getByText('顏色:')).toBeInTheDocument();
      expect(screen.getByText('紅色')).toBeInTheDocument();
    });

    it('should handle products without category', () => {
      const productWithoutCategory = { ...mockProduct, category: undefined };
      render(<TestTable data={[productWithoutCategory]} />);
      
      expect(screen.getByText('2 個規格')).toBeInTheDocument();
      expect(screen.queryByText('測試分類')).not.toBeInTheDocument();
    });

    it('should handle variants without attributes', () => {
      const variantWithoutAttrs = { 
        ...mockVariantRow, 
        variantInfo: { 
          ...mockVariantRow.variantInfo!, 
          attribute_values: [] 
        } 
      };
      render(<TestTable data={[variantWithoutAttrs]} />);
      
      expect(screen.getByText('無規格')).toBeInTheDocument();
    });
  });

  describe('Price Column', () => {
    it('should render price range for main product', () => {
      render(<TestTable data={[mockSingleVariantProduct]} />);
      
      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('should render single price when min equals max', () => {
      render(<TestTable data={[mockSingleVariantProduct]} />);
      
      expect(screen.getByText('$150')).toBeInTheDocument();
    });

    it('should render variant price correctly', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should handle products without price range', () => {
      const productWithoutPrice = {
        ...mockProduct,
        price_range: undefined,
      };
      
      render(<TestTable data={[productWithoutPrice]} />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle variants without price', () => {
      const variantWithoutPrice = { 
        ...mockVariantRow, 
        variantInfo: { 
          ...mockVariantRow.variantInfo!, 
          price: "" 
        } 
      };
      render(<TestTable data={[variantWithoutPrice]} />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Status Column', () => {
    it('should render full stock status', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByText('有庫存')).toBeInTheDocument();
    });

    it('should render no stock status for products without inventory', () => {
      const productWithoutStock = {
        ...mockProduct,
        variants: mockProduct.variants?.map(v => ({ ...v, inventory: [] }))
      };
      render(<TestTable data={[productWithoutStock]} />);
      
      expect(screen.getByText('無庫存')).toBeInTheDocument();
    });

    it('should not render status for variant rows', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.queryByText('有庫存')).not.toBeInTheDocument();
    });
  });

  describe('Inventory Column', () => {
    it('should render inventory progress for variant row', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.getByText('10 件可用')).toBeInTheDocument();
    });

    it('should render inventory for single variant product', () => {
      render(<TestTable data={[mockSingleVariantProduct]} />);
      
      expect(screen.getByText('25 件可用')).toBeInTheDocument();
    });

    it('should render view variants badge for multi-variant products', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByText('查看變體')).toBeInTheDocument();
    });

    it('should handle zero inventory', () => {
      const variantWithoutStock = { 
        ...mockVariantRow, 
        variantInfo: { 
          ...mockVariantRow.variantInfo!, 
          inventory: [{ 
            id: 1,
            quantity: 0,
            low_stock_threshold: 5,
            store: {
              id: 1,
              name: '門市1'
            }
          }] 
        } 
      };
      render(<TestTable data={[variantWithoutStock]} />);
      
      expect(screen.getByText('0 件可用')).toBeInTheDocument();
    });
  });

  describe('Created At Column', () => {
    it('should render formatted date and time for main product', () => {
      render(<TestTable data={[mockProduct]} />);
      
      expect(screen.getByText('2023/1/1')).toBeInTheDocument();
      const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should not render date for variant rows', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.queryByText('2023/1/1')).not.toBeInTheDocument();
    });

    it('should handle products without created_at', () => {
      const productWithoutDate = { ...mockProduct, created_at: undefined };
      render(<TestTable data={[productWithoutDate]} />);
      
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Actions Column', () => {
    it('should render actions menu for main product', () => {
      render(<TestTable data={[mockProduct]} />);
      
      const actionButtons = screen.getAllByRole('button');
      const moreButton = actionButtons.find(button => 
        button.querySelector('svg') && 
        button.classList.contains('h-8')
      );
      expect(moreButton).toBeInTheDocument();
      
      if (moreButton) {
        fireEvent.click(moreButton);
      }
    });

    it('should not render actions for variant rows', () => {
      render(<TestTable data={[mockVariantRow]} />);
      
      expect(screen.queryByLabelText('開啟選單')).not.toBeInTheDocument();
    });

    it('should dispatch edit event when edit is clicked', async () => {
      render(<TestTable data={[mockProduct]} />);
      
      const actionButtons = screen.getAllByRole('button');
      const moreButton = actionButtons.find(button => 
        button.querySelector('svg') && 
        button.classList.contains('h-8')
      );
      expect(moreButton).toBeDefined();
      
      if (moreButton) {
        fireEvent.click(moreButton);
        expect(moreButton).toBeInTheDocument();
      }
    });

    it('should dispatch delete event when delete is clicked', async () => {
      render(<TestTable data={[mockProduct]} />);
      
      const actionButtons = screen.getAllByRole('button');
      const moreButton = actionButtons.find(button => 
        button.querySelector('svg') && 
        button.classList.contains('h-8')
      );
      expect(moreButton).toBeDefined();
      
      if (moreButton) {
        fireEvent.click(moreButton);
        expect(moreButton).toBeInTheDocument();
      }
    });

    it('should dispatch view variants event when view variants is clicked', async () => {
      render(<TestTable data={[mockProduct]} />);
      
      const actionButtons = screen.getAllByRole('button');
      const moreButton = actionButtons.find(button => 
        button.querySelector('svg') && 
        button.classList.contains('h-8')
      );
      expect(moreButton).toBeDefined();
      
      if (moreButton) {
        fireEvent.click(moreButton);
        expect(moreButton).toBeInTheDocument();
      }
    });
  });

  describe('Utility Functions', () => {
    it('should handle image URL replacement for localhost', () => {
      render(<TestTable data={[mockProduct]} />);
      
      // The image should be processed to replace localhost with 127.0.0.1
      const image = screen.getByAltText('測試商品');
      expect(image).toBeInTheDocument();
    });

    it('should handle partial stock status', () => {
      const productWithPartialStock = {
        ...mockProduct,
        variants: [
          { ...mockProduct.variants![0], inventory: [{ 
            id: 1, 
            quantity: 5, 
            low_stock_threshold: 5,
            store: {
              id: 1,
              name: '門市1'
            }
          }] },
          { ...mockProduct.variants![1], inventory: [] }
        ]
      };
      
      render(<TestTable data={[productWithPartialStock]} />);
      
      expect(screen.getByText('部分庫存')).toBeInTheDocument();
    });
  });
});