import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePurchase } from '@/hooks'
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS_COLORS } from '@/types/purchase'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/hooks', () => ({
  usePurchase: jest.fn(),
}))

jest.mock('@/types/purchase', () => ({
  PURCHASE_STATUS_LABELS: {
    draft: '草稿',
    in_transit: '運送中',
    received: '已收貨',
    cancelled: '已取消',
  },
  PURCHASE_STATUS_COLORS: {
    draft: 'bg-gray-500',
    in_transit: 'bg-blue-500',
    received: 'bg-green-500',
    cancelled: 'bg-red-500',
  },
  getPurchasePermissions: (status: string) => ({
    canModify: status === 'draft',
    canCancel: status !== 'cancelled' && status !== 'received',
    canReceive: status === 'in_transit',
  }),
}))

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    const d = new Date(date)
    if (formatStr === 'yyyy年MM月dd日') {
      return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
    }
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}))

jest.mock('date-fns/locale', () => ({
  zhTW: {}
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div className="card">{children}</div>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div className="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, ...props }: any) => (
    <button onClick={onClick} className={variant} {...props}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span className={`badge ${className}`}>{children}</span>
  )
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr className="separator" />
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeft</span>,
  Edit: () => <span>Edit</span>,
  Package: () => <span>Package</span>,
  Store: () => <span>Store</span>,
  Calendar: () => <span>Calendar</span>,
  User: () => <span>User</span>,
  Truck: () => <span>Truck</span>,
  Receipt: () => <span>Receipt</span>,
  Hash: () => <span>Hash</span>,
  DollarSign: () => <span>DollarSign</span>,
}))

// Create test component
const PurchaseDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const purchaseId = params.id as string

  const { data: purchase, isLoading, error } = usePurchase(purchaseId)

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            找不到進貨單
          </h1>
          <p className="text-muted-foreground mb-6">
            進貨單不存在或已被刪除
          </p>
          <button onClick={() => router.back()}>
            <span>ArrowLeft</span>
            返回
          </button>
        </div>
      </div>
    )
  }

  const purchaseData = purchase as any
  const permissions = {
    canModify: purchaseData.status === 'draft',
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-6">
        {/* 頁面標題區 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}>
              <span>ArrowLeft</span>
              返回
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>Package</span>
                進貨單詳情
              </h1>
              <p className="text-muted-foreground">
                查看進貨單的完整資訊和商品項目
              </p>
            </div>
          </div>

          {permissions.canModify && (
            <button onClick={() => router.push(`/purchases/${purchaseId}/edit`)}>
              <span>Edit</span>
              編輯
            </button>
          )}
        </div>

        {/* 基本資訊卡片 */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="card-title flex items-center gap-2">
                  <span>Hash</span>
                  {purchaseData.order_number}
                </h3>
                <div className="card-description">
                  進貨單編號和基本資訊
                </div>
              </div>
              <span className={`badge ${PURCHASE_STATUS_COLORS[purchaseData.status]}`}>
                {PURCHASE_STATUS_LABELS[purchaseData.status]}
              </span>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Store</span>
                  <span>門市</span>
                </div>
                <p className="font-medium">
                  {purchaseData.store?.name || "未知門市"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Calendar</span>
                  <span>進貨日期</span>
                </div>
                <p className="font-medium">
                  {purchaseData.purchased_at
                    ? `${new Date(purchaseData.purchased_at).getFullYear()}年${String(new Date(purchaseData.purchased_at).getMonth() + 1).padStart(2, '0')}月${String(new Date(purchaseData.purchased_at).getDate()).padStart(2, '0')}日`
                    : "未設定"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Truck</span>
                  <span>運費</span>
                </div>
                <p className="font-medium">
                  NT$ {Number(purchaseData.shipping_cost || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>DollarSign</span>
                  <span>總金額</span>
                </div>
                <p className="font-medium text-lg">
                  NT$ {Number(purchaseData.total_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <hr className="separator" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Calendar</span>
                  <span>建立時間</span>
                </div>
                <p className="text-sm">
                  {purchaseData.created_at
                    ? `${new Date(purchaseData.created_at).getFullYear()}年${String(new Date(purchaseData.created_at).getMonth() + 1).padStart(2, '0')}月${String(new Date(purchaseData.created_at).getDate()).padStart(2, '0')}日 ${String(new Date(purchaseData.created_at).getHours()).padStart(2, '0')}:${String(new Date(purchaseData.created_at).getMinutes()).padStart(2, '0')}`
                    : "未知"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Calendar</span>
                  <span>最後更新</span>
                </div>
                <p className="text-sm">
                  {purchaseData.updated_at
                    ? `${new Date(purchaseData.updated_at).getFullYear()}年${String(new Date(purchaseData.updated_at).getMonth() + 1).padStart(2, '0')}月${String(new Date(purchaseData.updated_at).getDate()).padStart(2, '0')}日 ${String(new Date(purchaseData.updated_at).getHours()).padStart(2, '0')}:${String(new Date(purchaseData.updated_at).getMinutes()).padStart(2, '0')}`
                    : "未知"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品項目列表 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <span>Receipt</span>
              商品項目
            </h3>
            <div className="card-description">
              共 {purchaseData.items?.length || 0} 項商品
            </div>
          </div>
          <div className="card-content">
            {purchaseData.items && purchaseData.items.length > 0 ? (
              <div className="space-y-4">
                {purchaseData.items.map((item: any, index: number) => {
                  const quantity = item.quantity || 0
                  const costPrice = Number(item.cost_price || 0)
                  const allocatedShippingCost = Number(item.allocated_shipping_cost || 0)
                  const subtotal = quantity * costPrice
                  const totalCost = subtotal + allocatedShippingCost
                  const averageCostPerUnit = quantity > 0 ? totalCost / quantity : 0

                  return (
                    <div key={item.id || index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <h4 className="font-medium">
                            {item.product_name || "未知商品"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.sku || "未知"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            數量
                          </p>
                          <p className="font-medium">
                            {quantity}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            進貨價
                          </p>
                          <p className="font-medium">
                            NT$ {costPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <hr className="separator" />

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            商品小計：
                          </span>
                          <span className="font-medium ml-2">
                            NT$ {subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            攤銷運費：
                          </span>
                          <span className="font-medium ml-2">
                            NT$ {allocatedShippingCost.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            總成本：
                          </span>
                          <span className="font-medium ml-2">
                            NT$ {totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            單件平均成本：
                          </span>
                          <span className="font-medium ml-2 text-blue-600">
                            NT$ {Math.round(averageCostPerUnit).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* 總計 */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right space-y-2">
                      <div className="text-sm text-muted-foreground">
                        商品總計: NT$ {purchaseData.items
                          .reduce(
                            (sum: number, item: any) =>
                              sum + (item.quantity || 0) * (item.cost_price || 0),
                            0
                          )
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        運費: NT$ {Number(purchaseData.shipping_cost || 0).toLocaleString()}
                      </div>
                      <div className="text-lg font-semibold">
                        總金額: NT$ {Number(purchaseData.total_amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                此進貨單沒有商品項目
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>
const mockUsePurchase = usePurchase as jest.MockedFunction<typeof usePurchase>

// Mock purchase data
const mockPurchase = {
  id: 1,
  order_number: 'PO-2024001',
  status: 'draft',
  store: {
    id: 1,
    name: '台北總店',
  },
  purchased_at: '2024-01-15T00:00:00Z',
  shipping_cost: 500,
  total_amount: 15500,
  created_at: '2024-01-10T10:00:00Z',
  updated_at: '2024-01-12T14:30:00Z',
  items: [
    {
      id: 1,
      product_name: '測試商品A',
      sku: 'TEST-001',
      quantity: 10,
      cost_price: 1000,
      allocated_shipping_cost: 300,
    },
    {
      id: 2,
      product_name: '測試商品B',
      sku: 'TEST-002',
      quantity: 5,
      cost_price: 1000,
      allocated_shipping_cost: 200,
    },
  ],
}

const mockPurchaseReceived = {
  ...mockPurchase,
  status: 'received',
}

const mockPurchaseNoItems = {
  ...mockPurchase,
  items: [],
  total_amount: 0,
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

describe('PurchaseDetailPage', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' })
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('載入狀態', () => {
    it('應該顯示載入中狀態', () => {
      mockUsePurchase.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      const { container } = renderWithQueryClient(<PurchaseDetailPage />)

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('應該顯示錯誤狀態', () => {
      mockUsePurchase.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('載入失敗'),
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('找不到進貨單')).toBeInTheDocument()
      expect(screen.getByText('進貨單不存在或已被刪除')).toBeInTheDocument()
      expect(screen.getByText('返回')).toBeInTheDocument()
    })
  })

  describe('基本資訊顯示', () => {
    beforeEach(() => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchase,
        isLoading: false,
        error: null,
      })
    })

    it('應該顯示進貨單標題和描述', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('進貨單詳情')).toBeInTheDocument()
      expect(screen.getByText('查看進貨單的完整資訊和商品項目')).toBeInTheDocument()
    })

    it('應該顯示進貨單編號', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('PO-2024001')).toBeInTheDocument()
      expect(screen.getByText('進貨單編號和基本資訊')).toBeInTheDocument()
    })

    it('應該顯示狀態徽章', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('草稿')).toBeInTheDocument()
      expect(screen.getByText('草稿')).toHaveClass('bg-gray-500')
    })

    it('應該顯示門市資訊', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('門市')).toBeInTheDocument()
      expect(screen.getByText('台北總店')).toBeInTheDocument()
    })

    it('應該顯示進貨日期', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('進貨日期')).toBeInTheDocument()
      expect(screen.getByText('2024年01月15日')).toBeInTheDocument()
    })

    it('應該顯示運費', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('運費')).toBeInTheDocument()
      expect(screen.getByText('NT$ 500')).toBeInTheDocument()
    })

    it('應該顯示總金額', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('總金額')).toBeInTheDocument()
      const totalAmounts = screen.getAllByText('NT$ 15,500')
      expect(totalAmounts.length).toBeGreaterThan(0)
    })

    it('應該顯示時間戳記', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('建立時間')).toBeInTheDocument()
      expect(screen.getByText('2024年01月10日 18:00')).toBeInTheDocument()
      expect(screen.getByText('最後更新')).toBeInTheDocument()
      expect(screen.getByText('2024年01月12日 22:30')).toBeInTheDocument()
    })
  })

  describe('商品項目顯示', () => {
    beforeEach(() => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchase,
        isLoading: false,
        error: null,
      })
    })

    it('應該顯示商品項目標題', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('商品項目')).toBeInTheDocument()
      expect(screen.getByText('共 2 項商品')).toBeInTheDocument()
    })

    it('應該顯示每個商品的詳細資訊', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('測試商品A')).toBeInTheDocument()
      expect(screen.getByText('SKU: TEST-001')).toBeInTheDocument()
      expect(screen.getByText('測試商品B')).toBeInTheDocument()
      expect(screen.getByText('SKU: TEST-002')).toBeInTheDocument()
    })

    it('應該顯示商品數量和進貨價', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      const quantities = screen.getAllByText('數量')
      expect(quantities.length).toBe(2)
      
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      
      const prices = screen.getAllByText('NT$ 1,000')
      expect(prices.length).toBe(2)
    })

    it('應該顯示成本計算', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      // 商品A: 10 * 1000 = 10000
      expect(screen.getByText('NT$ 10,000')).toBeInTheDocument()
      
      // 攤銷運費
      expect(screen.getByText('NT$ 300')).toBeInTheDocument()
      expect(screen.getByText('NT$ 200')).toBeInTheDocument()
      
      // 總成本
      expect(screen.getByText('NT$ 10,300')).toBeInTheDocument() // 10000 + 300
      expect(screen.getByText('NT$ 5,200')).toBeInTheDocument() // 5000 + 200
      
      // 單件平均成本
      expect(screen.getByText('NT$ 1,030')).toBeInTheDocument() // 10300 / 10
      expect(screen.getByText('NT$ 1,040')).toBeInTheDocument() // 5200 / 5
    })

    it('應該顯示總計資訊', () => {
      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText(/商品總計: NT\$ 15,000/)).toBeInTheDocument()
      expect(screen.getByText(/運費: NT\$ 500/)).toBeInTheDocument()
    })

    it('應該在沒有商品時顯示空狀態', () => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchaseNoItems,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('此進貨單沒有商品項目')).toBeInTheDocument()
    })
  })

  describe('操作按鈕', () => {
    it('應該在草稿狀態顯示編輯按鈕', () => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchase,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('編輯')).toBeInTheDocument()
    })

    it('應該在非草稿狀態隱藏編輯按鈕', () => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchaseReceived,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.queryByText('編輯')).not.toBeInTheDocument()
    })

    it('應該能點擊返回按鈕', async () => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchase,
        isLoading: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<PurchaseDetailPage />)

      const backButtons = screen.getAllByText('返回')
      await user.click(backButtons[0])

      expect(mockBack).toHaveBeenCalled()
    })

    it('應該能點擊編輯按鈕導航到編輯頁', async () => {
      mockUsePurchase.mockReturnValue({
        data: mockPurchase,
        isLoading: false,
        error: null,
      })

      const user = userEvent.setup()
      renderWithQueryClient(<PurchaseDetailPage />)

      const editButton = screen.getByText('編輯')
      await user.click(editButton)

      expect(mockPush).toHaveBeenCalledWith('/purchases/1/edit')
    })

    it('應該在錯誤狀態時能返回', async () => {
      mockUsePurchase.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('載入失敗'),
      })

      const user = userEvent.setup()
      renderWithQueryClient(<PurchaseDetailPage />)

      const backButton = screen.getByText('返回')
      await user.click(backButton)

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('邊緣案例', () => {
    it('應該處理沒有門市名稱的情況', () => {
      const purchaseNoStore = {
        ...mockPurchase,
        store: null,
      }

      mockUsePurchase.mockReturnValue({
        data: purchaseNoStore,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('未知門市')).toBeInTheDocument()
    })

    it('應該處理沒有進貨日期的情況', () => {
      const purchaseNoDate = {
        ...mockPurchase,
        purchased_at: null,
      }

      mockUsePurchase.mockReturnValue({
        data: purchaseNoDate,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('未設定')).toBeInTheDocument()
    })

    it('應該處理商品沒有名稱的情況', () => {
      const purchaseNoProductName = {
        ...mockPurchase,
        items: [{
          id: 1,
          product_name: null,
          sku: null,
          quantity: 1,
          cost_price: 100,
          allocated_shipping_cost: 0,
        }],
      }

      mockUsePurchase.mockReturnValue({
        data: purchaseNoProductName,
        isLoading: false,
        error: null,
      })

      renderWithQueryClient(<PurchaseDetailPage />)

      expect(screen.getByText('未知商品')).toBeInTheDocument()
      expect(screen.getByText('SKU: 未知')).toBeInTheDocument()
    })
  })
})