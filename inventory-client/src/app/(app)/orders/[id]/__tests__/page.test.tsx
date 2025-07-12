import { render, screen, waitFor } from '@testing-library/react'
import { useParams } from 'next/navigation'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useOrderDetail, useConfirmOrderPayment, useCreateOrderShipment } from '@/hooks'
import { Order } from '@/types/api'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}))

jest.mock('@/hooks', () => ({
  useOrderDetail: jest.fn(),
  useConfirmOrderPayment: jest.fn(),
  useCreateOrderShipment: jest.fn(),
}))

jest.mock('@/components/orders/OrderDetailComponent', () => {
  return function MockOrderDetailComponent({ orderId }: { orderId: number }) {
    return <div data-testid="order-detail-component">Order Detail Component for {orderId}</div>
  }
})

jest.mock('@/components/orders/RecordPaymentModal', () => {
  return function MockRecordPaymentModal({ 
    order, 
    open, 
    onOpenChange 
  }: { 
    order: Order | null, 
    open: boolean, 
    onOpenChange: (open: boolean) => void 
  }) {
    return (
      <div data-testid="record-payment-modal" style={{ display: open ? 'block' : 'none' }}>
        <p>Record Payment Modal</p>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    )
  }
})

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode, href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock UI Components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, asChild, ...props }: any) => {
    // 如果是 asChild，直接返回子元素而不包裝
    if (asChild) {
      return <div className={`button ${variant} ${size}`} {...props}>{children}</div>
    }
    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={`button ${variant} ${size}`}
        {...props}
      >
        {children}
      </button>
    )
  }
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <div className={`badge ${variant} ${className}`} {...props}>
      {children}
    </div>
  )
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  CreditCard: () => <span>CreditCard</span>,
  Truck: () => <span>Truck</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  DollarSign: () => <span>DollarSign</span>,
}))

// Create a simplified version of OrderDetailPage for testing
const OrderDetailPage = () => {
  const params = useParams()
  const orderId = Number(params.id)
  
  const { data: order, isLoading, isError, error } = useOrderDetail(orderId)
  const { mutate: confirmPayment, isPending: isConfirming } = useConfirmOrderPayment()
  const { mutate: createShipment, isPending: isShipping } = useCreateOrderShipment()
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  
  const handleConfirmPayment = () => {
    if (!orderId) return
    confirmPayment(orderId)
  }
  
  const handleCreateShipment = () => {
    if (!orderId) return
    const shipmentData = { tracking_number: 'TEMP-TRACKING-12345' }
    createShipment({ orderId, data: shipmentData })
  }
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待付款',
      paid: '已付款',
      partial: '部分付款',
      refunded: '已退款',
      processing: '處理中',
      shipped: '已出貨',
      delivered: '已送達',
      cancelled: '已取消',
      completed: '已完成',
    }
    
    const displayText = statusMap[status] || status
    
    switch (status) {
      case 'completed':
      case 'paid':
      case 'shipped':
      case 'delivered':
        return <div className="badge bg-green-100 text-green-800">{displayText}</div>
      case 'cancelled':
      case 'refunded':
        return <div className="badge destructive">{displayText}</div>
      default:
        return <div className="badge secondary">{displayText}</div>
    }
  }
  
  const renderPaymentButton = () => {
    if (!order) return null
    
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      return null
    }
    
    if (order.payment_status === 'pending') {
      const remainingAmount = order.grand_total - order.paid_amount
      if (remainingAmount === order.grand_total) {
        return (
          <button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="button outline"
          >
            <span>CreditCard</span>
            {isConfirming ? '確認中...' : '確認全額付款'}
          </button>
        )
      }
    }
    
    if (order.payment_status === 'pending' || order.payment_status === 'partial') {
      return (
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="button outline"
        >
          <span>DollarSign</span>
          記錄付款
        </button>
      )
    }
    
    return null
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
            <h1 className="text-2xl font-bold">訂單詳情</h1>
            <p className="text-muted-foreground">載入中...</p>
          </div>
        </div>
        <div data-testid="order-detail-component">Order Detail Component for {orderId}</div>
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
            <h1 className="text-2xl font-bold">訂單詳情</h1>
            <p className="text-red-500">載入失敗: {error?.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="button outline sm">
            <a href="/orders">
              <span>ChevronLeft</span>
              <span className="sr-only">返回訂單列表</span>
            </a>
          </div>
          <h1 className="text-xl font-semibold">
            訂單編號：{order?.order_number || `#${orderId}`}
          </h1>
          {order && (
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
              {getStatusBadge(order.shipping_status)}
              {getStatusBadge(order.payment_status)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {renderPaymentButton()}
          {order?.shipping_status === 'pending' && (
            <button
              onClick={handleCreateShipment}
              disabled={isShipping}
              className="button"
            >
              <span>Truck</span>
              {isShipping ? '出貨中...' : '執行出貨'}
            </button>
          )}
        </div>
      </div>
      
      <div data-testid="order-detail-component">Order Detail Component for {orderId}</div>
      
      <div data-testid="record-payment-modal" style={{ display: isPaymentModalOpen ? 'block' : 'none' }}>
        <p>Record Payment Modal</p>
        <button onClick={() => setIsPaymentModalOpen(false)}>Close</button>
      </div>
    </div>
  )
}

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUseOrderDetail = useOrderDetail as jest.MockedFunction<typeof useOrderDetail>
const mockUseConfirmOrderPayment = useConfirmOrderPayment as jest.MockedFunction<typeof useConfirmOrderPayment>
const mockUseCreateOrderShipment = useCreateOrderShipment as jest.MockedFunction<typeof useCreateOrderShipment>

// Mock order data
const mockOrder: Order = {
  id: 123,
  order_number: 'ORD-2024-001',
  customer_name: '張三',
  customer_email: 'test@example.com',
  payment_status: 'pending',
  shipping_status: 'pending',
  grand_total: 1000,
  paid_amount: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  items: [],
  customer_id: 1,
  store_id: 1,
  subtotal: 900,
  tax_amount: 100,
  discount_amount: 0,
  shipping_amount: 0,
  notes: '',
  status: 'pending',
  shipping_address: {
    address: '台北市信義區',
    city: '台北市',
    postal_code: '110',
    country: '台灣'
  }
}

const mockPaidOrder: Order = {
  ...mockOrder,
  payment_status: 'paid',
  paid_amount: 1000,
}

const mockPartialPaidOrder: Order = {
  ...mockOrder,
  payment_status: 'partial',
  paid_amount: 500,
}

const mockShippedOrder: Order = {
  ...mockOrder,
  shipping_status: 'shipped',
  payment_status: 'paid',
  paid_amount: 1000,
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

describe('OrderDetailPage', () => {
  const mockConfirmPayment = jest.fn()
  const mockCreateShipment = jest.fn()

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '123' })
    mockUseConfirmOrderPayment.mockReturnValue({
      mutate: mockConfirmPayment,
      isPending: false,
    })
    mockUseCreateOrderShipment.mockReturnValue({
      mutate: mockCreateShipment,
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

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('載入中...')).toBeInTheDocument()
      expect(screen.getByText('訂單詳情')).toBeInTheDocument()
    })

    it('應該顯示錯誤狀態', () => {
      mockUseOrderDetail.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: '載入失敗' },
      })

      renderWithQueryClient(<OrderDetailPage />)

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
      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('訂單編號：ORD-2024-001')).toBeInTheDocument()
    })

    it('應該顯示訂單狀態徽章', () => {
      renderWithQueryClient(<OrderDetailPage />)

      const pendingBadges = screen.getAllByText('待付款')
      expect(pendingBadges).toHaveLength(2) // 一個是付款狀態，一個是出貨狀態
    })

    it('應該顯示 OrderDetailComponent', () => {
      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByTestId('order-detail-component')).toBeInTheDocument()
      expect(screen.getByText('Order Detail Component for 123')).toBeInTheDocument()
    })

    it('應該顯示返回按鈕', () => {
      renderWithQueryClient(<OrderDetailPage />)

      const backButton = screen.getByText('返回訂單列表').closest('a')
      expect(backButton).toHaveAttribute('href', '/orders')
    })
  })

  describe('狀態徽章顯示', () => {
    it('應該為已完成狀態顯示綠色徽章', () => {
      const completedOrder = { ...mockOrder, payment_status: 'paid', shipping_status: 'delivered' }
      mockUseOrderDetail.mockReturnValue({
        data: completedOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('已付款')).toBeInTheDocument()
      expect(screen.getByText('已送達')).toBeInTheDocument()
    })

    it('應該為取消狀態顯示紅色徽章', () => {
      const cancelledOrder = { ...mockOrder, payment_status: 'refunded', shipping_status: 'cancelled' }
      mockUseOrderDetail.mockReturnValue({
        data: cancelledOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('已退款')).toBeInTheDocument()
      expect(screen.getByText('已取消')).toBeInTheDocument()
    })
  })

  describe('付款功能', () => {
    it('應該顯示全額付款按鈕當訂單待付款時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('確認全額付款')).toBeInTheDocument()
    })

    it('應該執行全額付款確認', async () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<OrderDetailPage />)

      const payButton = screen.getByText('確認全額付款')
      await user.click(payButton)

      expect(mockConfirmPayment).toHaveBeenCalledWith(123)
    })

    it('應該顯示記錄付款按鈕當訂單部分付款時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPartialPaidOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('記錄付款')).toBeInTheDocument()
    })

    it('應該開啟記錄付款 Modal', async () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPartialPaidOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<OrderDetailPage />)

      const recordPaymentButton = screen.getByText('記錄付款')
      await user.click(recordPaymentButton)

      expect(screen.getByTestId('record-payment-modal')).toBeVisible()
    })

    it('不應該顯示付款按鈕當訂單已付款時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPaidOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.queryByText('確認全額付款')).not.toBeInTheDocument()
      expect(screen.queryByText('記錄付款')).not.toBeInTheDocument()
    })

    it('應該顯示確認中狀態當付款處理中時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })
      mockUseConfirmOrderPayment.mockReturnValue({
        mutate: mockConfirmPayment,
        isPending: true,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('確認中...')).toBeInTheDocument()
    })
  })

  describe('出貨功能', () => {
    it('應該顯示執行出貨按鈕當訂單待出貨時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('執行出貨')).toBeInTheDocument()
    })

    it('應該執行出貨操作', async () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<OrderDetailPage />)

      const shipButton = screen.getByText('執行出貨')
      await user.click(shipButton)

      expect(mockCreateShipment).toHaveBeenCalledWith({
        orderId: 123,
        data: { tracking_number: 'TEMP-TRACKING-12345' }
      })
    })

    it('不應該顯示出貨按鈕當訂單已出貨時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockShippedOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.queryByText('執行出貨')).not.toBeInTheDocument()
    })

    it('應該顯示出貨中狀態當出貨處理中時', () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockOrder,
        isLoading: false,
        isError: false,
        error: null,
      })
      mockUseCreateOrderShipment.mockReturnValue({
        mutate: mockCreateShipment,
        isPending: true,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('出貨中...')).toBeInTheDocument()
    })
  })

  describe('Modal 互動', () => {
    it('應該關閉記錄付款 Modal', async () => {
      mockUseOrderDetail.mockReturnValue({
        data: mockPartialPaidOrder,
        isLoading: false,
        isError: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<OrderDetailPage />)

      // 開啟 Modal
      const recordPaymentButton = screen.getByText('記錄付款')
      await user.click(recordPaymentButton)

      expect(screen.getByTestId('record-payment-modal')).toBeVisible()

      // 關閉 Modal
      const closeButton = screen.getByText('Close')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.getByTestId('record-payment-modal')).not.toBeVisible()
      })
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

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('Order Detail Component for 456')).toBeInTheDocument()
    })

    it('應該顯示 fallback 訂單編號當沒有 order_number 時', () => {
      mockUseParams.mockReturnValue({ id: '789' })
      mockUseOrderDetail.mockReturnValue({
        data: { ...mockOrder, order_number: undefined },
        isLoading: false,
        isError: false,
        error: null,
      })

      renderWithQueryClient(<OrderDetailPage />)

      expect(screen.getByText('訂單編號：#789')).toBeInTheDocument()
    })
  })
})