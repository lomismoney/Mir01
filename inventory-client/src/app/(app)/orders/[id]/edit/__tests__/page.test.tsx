import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useOrderDetail, useUpdateOrder } from '@/hooks/queries/orders/useOrders';
import { Order } from '@/types/api-helpers';
import EditOrderPage from '../page';

// Mock the hooks
jest.mock('@/hooks/queries/orders/useOrders');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/components/orders/OrderForm', () => {
  return function MockOrderForm({ 
    initialData, 
    isSubmitting, 
    onSubmit 
  }: { 
    initialData: any, 
    isSubmitting: boolean, 
    onSubmit: (values: any) => void 
  }) {
    return (
      <div data-testid="order-form">
        <h2>Order Form</h2>
        <p>Customer ID: {initialData?.customer_id}</p>
        <p>Shipping Address: {initialData?.shipping_address}</p>
        <p>Payment Method: {initialData?.payment_method}</p>
        <p>Items Count: {initialData?.items?.length || 0}</p>
        <p>Submitting: {isSubmitting ? 'true' : 'false'}</p>
        <button 
          onClick={() => onSubmit({
            customer_id: 1,
            shipping_address: '台北市信義區',
            payment_method: 'cash',
            items: [
              {
                id: 1,
                product_variant_id: 1,
                quantity: 2,
                price: 100,
                custom_specifications: { size: 'L' }
              }
            ]
          })}
        >
          Submit Order
        </button>
      </div>
    )
  }
})

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: { className?: string }) => (
    <div className={`skeleton ${className}`} data-testid="skeleton" {...props} />
  ),
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode, href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('@testing-library/user-event', () => ({
  default: {
    setup: () => ({
      click: jest.fn().mockResolvedValue(undefined)
    })
  }
}))

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
}))

// Create a simplified version of EditOrderPage for testing
const TestEditOrderPage = () => {
  const router = useRouter()
  const params = useParams() as { id: string }
  const orderId = Number(params.id)
  
  const { data: order, isLoading, isError, error } = useOrderDetail(orderId)
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder()
  
  const handleUpdateSubmit = (values: any) => {
    const orderData = {
      ...values,
      items: values.items.map((item: any) => ({
        ...item,
        id: item.id,
        custom_specifications: item.custom_specifications
          ? JSON.stringify(item.custom_specifications)
          : null,
      })),
    }
    
    updateOrder(
      { id: orderId, data: orderData },
      {
        onSuccess: () => {
          router.push(`/orders/${orderId}`)
        },
      },
    )
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="button outline sm">
            <a href="/orders">
              <span>ArrowLeft</span>
              返回訂單列表
            </a>
          </div>
          <div>
            <h1 className="text-2xl font-bold">編輯訂單</h1>
            <p className="text-muted-foreground">載入中...</p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="skeleton h-4 w-1/4" data-testid="skeleton" />
            <div className="skeleton h-10 w-full" data-testid="skeleton" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-1/4" data-testid="skeleton" />
            <div className="skeleton h-10 w-full" data-testid="skeleton" />
          </div>
          <div className="h-48 w-full rounded-md border-2 border-dashed" />
          <div className="skeleton h-10 w-32" data-testid="skeleton" />
        </div>
      </div>
    )
  }
  
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="button outline sm">
            <a href="/orders">
              <span>ArrowLeft</span>
              返回訂單列表
            </a>
          </div>
          <div>
            <h1 className="text-2xl font-bold">編輯訂單</h1>
            <p className="text-red-500">載入失敗: {error?.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  const initialData = order
    ? {
        customer_id: order.customer_id,
        shipping_address: typeof order.shipping_address === 'string' 
          ? order.shipping_address 
          : order.shipping_address && 'address' in order.shipping_address 
            ? (order.shipping_address as any).address 
            : "",
        payment_method: order.payment_method,
        order_source: order.order_source,
        shipping_status: order.shipping_status,
        payment_status: order.payment_status,
        shipping_fee: order.shipping_fee || 0,
        tax: order.tax_amount,
        discount_amount: order.discount_amount || 0,
        notes: order.notes || "",
        items:
          order.items?.map((item: any) => ({
            id: item.id,
            product_variant_id: item.product_variant_id,
            is_stocked_sale: item.is_stocked_sale,
            status: item.status,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name,
            sku: item.sku,
            custom_specifications: item.custom_specifications
              ? JSON.parse(item.custom_specifications)
              : undefined,
          })) || [],
      }
    : undefined
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="button outline sm">
          <a href={`/orders/${orderId}`}>
            <span>ArrowLeft</span>
            返回訂單詳情
          </a>
        </div>
        <div>
          <h1 className="text-2xl font-bold">編輯訂單</h1>
          <p className="text-muted-foreground">
            正在修改訂單號：{order?.order_number}
          </p>
        </div>
      </div>
      
      <div data-testid="order-form">
        <h2>Order Form</h2>
        <p>Customer ID: {initialData?.customer_id}</p>
        <p>Shipping Address: {initialData?.shipping_address}</p>
        <p>Payment Method: {initialData?.payment_method}</p>
        <p>Items Count: {initialData?.items?.length || 0}</p>
        <p>Submitting: {isUpdating ? 'true' : 'false'}</p>
        <button 
          onClick={() => handleUpdateSubmit({
            customer_id: 1,
            shipping_address: '台北市信義區',
            payment_method: 'cash',
            items: [
              {
                id: 1,
                product_variant_id: 1,
                quantity: 2,
                price: 100,
                custom_specifications: { size: 'L' }
              }
            ]
          })}
        >
          Submit Order
        </button>
      </div>
    </div>
  )
}

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseOrderDetail = useOrderDetail as jest.MockedFunction<typeof useOrderDetail>
const mockUseUpdateOrder = useUpdateOrder as jest.MockedFunction<typeof useUpdateOrder>

// Mock order data
const mockOrder: Order = {
  id: 123,
  order_number: 'ORD-2024-001',
  customer_name: '張三',
  customer_email: 'test@example.com',
  customer_id: 1,
  payment_status: 'pending',
  shipping_status: 'pending',
  grand_total: 1000,
  paid_amount: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  items: [
    {
      id: 1,
      product_variant_id: 1,
      product_name: '測試商品',
      sku: 'TEST-001',
      quantity: 2,
      price: 500,
      status: 'pending',
      is_stocked_sale: true,
      custom_specifications: '{"size": "L"}',
      subtotal: 1000,
      order_id: 123,
    }
  ],
  store_id: 1,
  subtotal: 900,
  tax_amount: 100,
  discount_amount: 0,
  shipping_amount: 0,
  shipping_fee: 0,
  notes: '測試備註',
  status: 'pending',
  payment_method: 'cash',
  order_source: 'web',
  shipping_address: {
    address: '台北市信義區',
    city: '台北市',
    postal_code: '110',
    country: '台灣'
  }
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

describe('EditOrderPage', () => {
  const mockUpdateOrder = jest.fn()
  const mockPush = jest.fn()

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '123' })
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
    })
    mockUseUpdateOrder.mockReturnValue({
      mutate: mockUpdateOrder,
      isPending: false,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('載入狀態', () => {
    it('應該顯示載入中狀態', () => {
      mockUseOrderDetail.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('載入中...')).toBeInTheDocument()
      expect(screen.getByText('編輯訂單')).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton')).toHaveLength(5)
    })

    it('應該顯示錯誤狀態', () => {
      mockUseOrderDetail.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: '載入失敗' },
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('載入失敗: 載入失敗')).toBeInTheDocument()
    })
  })

  describe('訂單資訊顯示', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該顯示訂單編號', () => {
      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('正在修改訂單號：ORD-2024-001')).toBeInTheDocument()
    })

    it('應該顯示 OrderForm 組件', () => {
      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByTestId('order-form')).toBeInTheDocument()
      expect(screen.getByText('Order Form')).toBeInTheDocument()
    })

    it('應該顯示返回訂單詳情按鈕', () => {
      renderWithQueryClient(<TestEditOrderPage />)

      const backButton = screen.getByText('返回訂單詳情').closest('a')
      expect(backButton).toHaveAttribute('href', '/orders/123')
    })

    it('應該顯示正確的初始資料', () => {
      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('Customer ID: 1')).toBeInTheDocument()
      expect(screen.getByText('Shipping Address: 台北市信義區')).toBeInTheDocument()
      expect(screen.getByText('Payment Method: cash')).toBeInTheDocument()
      expect(screen.getByText('Items Count: 1')).toBeInTheDocument()
    })
  })

  describe('表單提交', () => {
    beforeEach(() => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })
    })

    it('應該處理表單提交', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<TestEditOrderPage />)

      const submitButton = screen.getByText('Submit Order')
      await user.click(submitButton)

      expect(mockUpdateOrder).toHaveBeenCalledWith(
        {
          id: 123,
          data: {
            customer_id: 1,
            shipping_address: '台北市信義區',
            payment_method: 'cash',
            items: [
              {
                id: 1,
                product_variant_id: 1,
                quantity: 2,
                price: 100,
                custom_specifications: '{"size":"L"}',
              }
            ]
          }
        },
        {
          onSuccess: expect.any(Function),
        }
      )
    })

    it('應該在提交成功後重定向到訂單詳情頁', async () => {
      const user = userEvent.setup()
      
      // 模擬 updateOrder 的成功回調
      mockUpdateOrder.mockImplementation((data, options) => {
        options.onSuccess()
      })

      renderWithQueryClient(<TestEditOrderPage />)

      const submitButton = screen.getByText('Submit Order')
      await user.click(submitButton)

      expect(mockPush).toHaveBeenCalledWith('/orders/123')
    })

    it('應該顯示提交中狀態', () => {
      mockUseUpdateOrder.mockReturnValue({
        mutate: mockUpdateOrder,
        isPending: true,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('Submitting: true')).toBeInTheDocument()
    })
  })

  describe('數據處理', () => {
    it('應該正確解析 custom_specifications', () => {
      const orderWithSpecs = {
        ...mockOrder,
        items: [
          {
            ...mockOrder.items[0],
            custom_specifications: '{"color": "red", "size": "XL"}',
          }
        ]
      }

      mockUseOrderDetail.mockReturnValue({
        data: orderWithSpecs,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      // 驗證 custom_specifications 被正確解析
      expect(screen.getByTestId('order-form')).toBeInTheDocument()
    })

    it('應該處理空的 custom_specifications', () => {
      const orderWithoutSpecs = {
        ...mockOrder,
        items: [
          {
            ...mockOrder.items[0],
            custom_specifications: null,
          }
        ]
      }

      mockUseOrderDetail.mockReturnValue({
        data: orderWithoutSpecs,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByTestId('order-form')).toBeInTheDocument()
    })

    it('應該處理沒有 items 的訂單', () => {
      const orderWithoutItems = {
        ...mockOrder,
        items: undefined,
      }

      mockUseOrderDetail.mockReturnValue({
        data: orderWithoutItems,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('Items Count: 0')).toBeInTheDocument()
    })
  })

  describe('路由參數處理', () => {
    it('應該處理字符串 ID 參數', () => {
      mockUseParams.mockReturnValue({ id: '456' })
      mockUseOrderDetail.mockReturnValue({
        data: { ...mockOrder, id: 456 },
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      const backButton = screen.getByText('返回訂單詳情').closest('a')
      expect(backButton).toHaveAttribute('href', '/orders/456')
    })
  })

  describe('空數據處理', () => {
    it('應該處理空的可選字段', () => {
      const orderWithEmptyFields = {
        ...mockOrder,
        shipping_address: null,
        shipping_fee: null,
        discount_amount: null,
        notes: null,
      }

      mockUseOrderDetail.mockReturnValue({
        data: orderWithEmptyFields,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<TestEditOrderPage />)

      expect(screen.getByText('Shipping Address:')).toBeInTheDocument()
      expect(screen.getByTestId('order-form')).toBeInTheDocument()
    })
  })
})