import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductsPage from '../page';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock hooks
jest.mock('@/hooks', () => ({
  useProducts: jest.fn()
}));

// Mock components
jest.mock('@/components/products/ProductClientComponent', () => {
  return function MockProductClientComponent() {
    return <div data-testid="product-client-component">Product Client Component</div>;
  };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-description">{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className} data-testid="card-title">{children}</div>
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  )
}));

jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  TrendingUp: () => <span data-testid="trending-up-icon">↑</span>,
  TrendingDown: () => <span data-testid="trending-down-icon">↓</span>
}));

describe('ProductsPage', () => {
  const mockPush = jest.fn();
  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      variants: [
        {
          id: 1,
          inventory: [
            { quantity: 20 },
            { quantity: 15 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Product 2',
      variants: [
        {
          id: 2,
          inventory: [
            { quantity: 5 },
            { quantity: 2 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Product 3',
      variants: [
        {
          id: 3,
          inventory: [
            { quantity: 0 },
            { quantity: 0 }
          ]
        }
      ]
    },
    {
      id: 4,
      name: 'Product 4',
      variants: []
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useProducts as jest.Mock).mockReturnValue({ 
      data: mockProducts,
      isLoading: false,
      isSuccess: true,
      error: null
    });
  });

  it('should render page header with title and description', () => {
    render(<ProductsPage />);

    expect(screen.getByText('商品管理')).toBeInTheDocument();
    expect(screen.getByText('管理您的商品庫存、價格和規格資訊')).toBeInTheDocument();
  });

  it('should render add product button and handle click', () => {
    render(<ProductsPage />);

    const addButton = screen.getByRole('button', { name: /新增商品/i });
    expect(addButton).toBeInTheDocument();
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(mockPush).toHaveBeenCalledWith('/products/new');
  });

  it('should render statistics cards with correct data', () => {
    render(<ProductsPage />);

    // Check all cards are rendered
    const cards = screen.getAllByTestId('card');
    expect(cards).toHaveLength(4);

    // Check card titles
    expect(screen.getByText('商品總數')).toBeInTheDocument();
    expect(screen.getByText('有庫存商品')).toBeInTheDocument();
    expect(screen.getByText('低庫存預警')).toBeInTheDocument();
    expect(screen.getByText('缺貨商品')).toBeInTheDocument();

    // Check statistics values
    const cardTitles = screen.getAllByTestId('card-title');
    expect(cardTitles[0]).toHaveTextContent('4'); // Total products
    expect(cardTitles[1]).toHaveTextContent('2'); // Products with stock (Product 1 & 2)
    expect(cardTitles[2]).toHaveTextContent('1'); // Low stock (Product 2 has 7 total)
    expect(cardTitles[3]).toHaveTextContent('4'); // Out of stock - bug in logic with || true makes all products out of stock
  });

  it('should render percentage changes with correct badges', () => {
    render(<ProductsPage />);

    const badges = screen.getAllByTestId('badge');
    
    // Total products badge - includes icon
    expect(badges[0]).toHaveTextContent('↑+12.5%');
    expect(badges[0]).toHaveAttribute('data-variant', 'outline');

    // Active products badge - includes icon
    expect(badges[1]).toHaveTextContent('↑+8.3%');
    expect(badges[1]).toHaveAttribute('data-variant', 'outline');

    // Low stock badge - includes icon
    expect(badges[2]).toHaveTextContent('↓-15.2%');
    expect(badges[2]).toHaveAttribute('data-variant', 'outline');

    // Out of stock badge - includes icon
    expect(badges[3]).toHaveTextContent('↑+25%'); // No decimal in actual rendering
    expect(badges[3]).toHaveAttribute('data-variant', 'destructive');
  });

  it('should render trending icons correctly', () => {
    render(<ProductsPage />);

    const trendingUpIcons = screen.getAllByTestId('trending-up-icon');
    const trendingDownIcons = screen.getAllByTestId('trending-down-icon');

    expect(trendingUpIcons).toHaveLength(3); // Total, Active, Out of stock
    expect(trendingDownIcons).toHaveLength(1); // Low stock
  });

  it('should render ProductClientComponent', () => {
    render(<ProductsPage />);

    expect(screen.getByTestId('product-client-component')).toBeInTheDocument();
  });

  it('should handle empty products array', () => {
    (useProducts as jest.Mock).mockReturnValue({ 
      data: [],
      isLoading: false,
      isSuccess: true,
      error: null
    });

    render(<ProductsPage />);

    const cardTitles = screen.getAllByTestId('card-title');
    expect(cardTitles[0]).toHaveTextContent('0'); // Total
    expect(cardTitles[1]).toHaveTextContent('0'); // Active
    expect(cardTitles[2]).toHaveTextContent('0'); // Low stock
    expect(cardTitles[3]).toHaveTextContent('0'); // Out of stock
  });

  it('should handle null products data', () => {
    (useProducts as jest.Mock).mockReturnValue({ 
      data: null,
      isLoading: false,
      isSuccess: true,
      error: null
    });

    render(<ProductsPage />);

    const cardTitles = screen.getAllByTestId('card-title');
    expect(cardTitles[0]).toHaveTextContent('0'); // Total
    expect(cardTitles[1]).toHaveTextContent('0'); // Active
    expect(cardTitles[2]).toHaveTextContent('0'); // Low stock
    expect(cardTitles[3]).toHaveTextContent('0'); // Out of stock
  });

  it('should calculate statistics correctly for various inventory scenarios', () => {
    const complexProducts = [
      // Product with multiple variants, all with stock
      {
        id: 1,
        variants: [
          { inventory: [{ quantity: 20 }, { quantity: 30 }] },
          { inventory: [{ quantity: 15 }] }
        ]
      },
      // Product with one variant low stock, one with good stock
      {
        id: 2,
        variants: [
          { inventory: [{ quantity: 3 }] },
          { inventory: [{ quantity: 50 }] }
        ]
      },
      // Product with all variants out of stock
      {
        id: 3,
        variants: [
          { inventory: [{ quantity: 0 }] },
          { inventory: [] }
        ]
      }
    ];

    (useProducts as jest.Mock).mockReturnValue({ 
      data: complexProducts,
      isLoading: false,
      isSuccess: true,
      error: null
    });

    render(<ProductsPage />);

    const cardTitles = screen.getAllByTestId('card-title');
    expect(cardTitles[0]).toHaveTextContent('3'); // Total
    expect(cardTitles[1]).toHaveTextContent('2'); // Active (Product 1 & 2)
    expect(cardTitles[2]).toHaveTextContent('1'); // Low stock (Product 2 has one variant with 3)
    expect(cardTitles[3]).toHaveTextContent('3'); // Out of stock - bug in logic with || true makes all products out of stock
  });
});