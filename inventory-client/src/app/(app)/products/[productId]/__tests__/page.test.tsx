import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import ProductDetailPage from '../page';
import { useProductDetail } from '@/hooks/queries/products/useProducts';
import { Product } from '@/types/products';

// Mock the hooks
jest.mock('@/hooks/queries/products/useProducts');
jest.mock('next/navigation');

// Mock the use() function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn(() => ({ productId: '123' })),
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} data-fill={fill} />
  ),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`card ${className}`}>{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`card-content ${className}`}>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div className="card-description">{children}</div>,
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`card-header ${className}`}>{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h3 className={`card-title ${className}`}>{children}</h3>,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr className="separator" />
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div className="avatar">{children}</div>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <div className="avatar-fallback">{children}</div>,
  // eslint-disable-next-line @next/next/no-img-element
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} className="avatar-image" />,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  Edit: () => <span>Edit</span>,
  Package: () => <span>Package</span>,
  DollarSign: () => <span>DollarSign</span>,
  Tag: () => <span>Tag</span>,
  Calendar: () => <span>Calendar</span>,
  Box: () => <span>Box</span>,
  ImageIcon: () => <span>ImageIcon</span>,
  Store: () => <span>Store</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  Info: () => <span>Info</span>,
  Grid3X3: () => <span>Grid3X3</span>,
  MapPin: () => <span>MapPin</span>,
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' '),
}))

// Mock product data
const mockProduct: Product = {
  id: 123,
  name: '測試商品',
  description: '這是一個測試商品的描述',
  image_urls: {
    original: 'http://localhost/test-image.jpg',
    thumbnail: 'http://localhost/test-thumb.jpg',
  },
  category: {
    id: 1,
    name: '電子產品',
    parent_id: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  price_range: {
    min: 1000,
    max: 2000,
  },
  variants: [
    {
      id: 1,
      sku: 'TEST-001-S',
      price: 1000,
      product_id: 123,
      attribute_values: [
        {
          id: 1,
          value: '小',
          attribute: {
            id: 1,
            name: '尺寸',
          },
        },
      ],
      inventory: [
        {
          id: 1,
          quantity: 10,
          store: {
            id: 1,
            name: '台北店',
          },
        },
        {
          id: 2,
          quantity: 5,
          store: {
            id: 2,
            name: '台中店',
          },
        },
      ],
    },
    {
      id: 2,
      sku: 'TEST-001-L',
      price: 2000,
      product_id: 123,
      attribute_values: [
        {
          id: 2,
          value: '大',
          attribute: {
            id: 1,
            name: '尺寸',
          },
        },
      ],
      inventory: [
        {
          id: 3,
          quantity: 8,
          store: {
            id: 1,
            name: '台北店',
          },
        },
        {
          id: 4,
          quantity: 0,
          store: {
            id: 2,
            name: '台中店',
          },
        },
      ],
    },
  ],
}

const mockProductNoImage = {
  ...mockProduct,
  image_urls: undefined,
}

const mockProductNoVariants = {
  ...mockProduct,
  variants: [],
}

const mockProductSinglePrice = {
  ...mockProduct,
  price_range: {
    min: 1500,
    max: 1500,
  },
}

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('ProductDetailPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    // Mock the useRouter hook to return a mock object with push, back, forward, refresh, and replace
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(), // Add prefetch to the mock
    });
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('載入狀態', () => {
    it('應該顯示載入中狀態', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('載入商品資訊中...')).toBeInTheDocument()
    })

    it('應該顯示找不到商品的狀態', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('找不到商品資訊')).toBeInTheDocument()
      expect(screen.getByText('返回商品列表')).toBeInTheDocument()
    })
  })

  describe('商品資訊顯示', () => {
    beforeEach(() => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該顯示商品基本資訊', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('測試商品')).toBeInTheDocument()
      expect(screen.getByText('這是一個測試商品的描述')).toBeInTheDocument()
      expect(screen.getByText('電子產品')).toBeInTheDocument()
    })

    it('應該顯示商品圖片', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      const image = screen.getByAltText('測試商品')
      expect(image).toHaveAttribute('src', 'http://127.0.0.1/test-image.jpg')
    })

    it('應該在沒有圖片時顯示圖標', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProductNoImage,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('ImageIcon')).toBeInTheDocument()
    })

    it('應該顯示價格範圍', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText(/NT\$1,000 - NT\$2,000/)).toBeInTheDocument()
      expect(screen.getByText('2 個規格')).toBeInTheDocument()
    })

    it('應該顯示單一價格當最低最高價相同時', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProductSinglePrice,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('NT$1,500')).toBeInTheDocument()
    })

    it('應該顯示總庫存', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('23 件')).toBeInTheDocument() // 10+5+8+0 = 23
      expect(screen.getByText('庫存充足')).toBeInTheDocument()
    })
  })

  describe('規格變體顯示', () => {
    beforeEach(() => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該顯示規格變體列表', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('TEST-001-S')).toBeInTheDocument()
      expect(screen.getByText('TEST-001-L')).toBeInTheDocument()
      const sizeLabels = screen.getAllByText('尺寸:')
      expect(sizeLabels).toHaveLength(2) // 一個給小尺寸，一個給大尺寸
      expect(screen.getByText('小')).toBeInTheDocument()
      expect(screen.getByText('大')).toBeInTheDocument()
    })

    it('應該顯示變體價格和庫存', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('NT$1,000')).toBeInTheDocument()
      expect(screen.getByText('NT$2,000')).toBeInTheDocument()
      expect(screen.getByText('15 件')).toBeInTheDocument() // 10+5
      expect(screen.getByText('8 件')).toBeInTheDocument() // 8+0
    })

    it('應該在沒有變體時顯示提示', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProductNoVariants,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('暫無規格變體')).toBeInTheDocument()
    })
  })

  describe('門市庫存顯示', () => {
    beforeEach(() => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該顯示各門市庫存分布', () => {
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('台北店')).toBeInTheDocument()
      expect(screen.getByText('台中店')).toBeInTheDocument()
      expect(screen.getByText('18 件')).toBeInTheDocument() // 台北店: 10+8
      expect(screen.getByText('5 件')).toBeInTheDocument() // 台中店: 5+0
      expect(screen.getByText('(78%)')).toBeInTheDocument() // 18/23
      expect(screen.getByText('(22%)')).toBeInTheDocument() // 5/23
    })

    it('應該在沒有庫存時顯示提示', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProductNoVariants,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('暫無庫存資訊')).toBeInTheDocument()
    })
  })

  describe('按鈕功能', () => {
    beforeEach(() => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該能夠返回商品列表', async () => {
      const user = { setup: () => ({ click: jest.fn() }) }; // Mock userEvent.setup()
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      const backButton = screen.getAllByText('ArrowLeft')[0].parentElement
      await user.setup().click(backButton!)

      expect(mockPush).toHaveBeenCalledWith('/products')
    })

    it('應該能夠編輯商品', async () => {
      const user = { setup: () => ({ click: jest.fn() }) }; // Mock userEvent.setup()
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      const editButton = screen.getByText('編輯商品')
      await user.setup().click(editButton)

      expect(mockPush).toHaveBeenCalledWith('/products/123/edit')
    })

    it('應該在找不到商品時能返回列表', async () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      })

      const user = { setup: () => ({ click: jest.fn() }) }; // Mock userEvent.setup()
      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      const backButton = screen.getByText('返回商品列表')
      await user.setup().click(backButton)

      expect(mockPush).toHaveBeenCalledWith('/products')
    })
  })

  describe('庫存狀態顯示', () => {
    it('應該顯示缺貨狀態', () => {
      const productOutOfStock = {
        ...mockProduct,
        variants: [
          {
            ...mockProduct.variants[0],
            inventory: [{ id: 1, quantity: 0, store: { id: 1, name: '台北店' } }],
          },
        ],
      }

      (useProductDetail as jest.Mock).mockReturnValue({
        data: productOutOfStock,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('缺貨')).toBeInTheDocument()
    })

    it('應該顯示低庫存狀態', () => {
      const productLowStock = {
        ...mockProduct,
        variants: [
          {
            ...mockProduct.variants[0],
            inventory: [{ id: 1, quantity: 5, store: { id: 1, name: '台北店' } }],
          },
        ],
      }

      (useProductDetail as jest.Mock).mockReturnValue({
        data: productLowStock,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('低庫存')).toBeInTheDocument()
    })
  })

  describe('時間格式化', () => {
    it('應該正確顯示建立時間', () => {
      (useProductDetail as jest.Mock).mockReturnValue({
        data: mockProduct,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<ProductDetailPage params={Promise.resolve({ productId: '123' })} />)

      expect(screen.getByText('建立時間')).toBeInTheDocument()
      expect(screen.getByText(/2024\/1\/1/)).toBeInTheDocument()
    })
  })
})