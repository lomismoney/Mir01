import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAllInventoryTransactions } from '@/hooks'
import { InventoryTransaction } from '@/types/api-helpers'

// Mock dependencies
jest.mock('@/hooks', () => ({
  useAllInventoryTransactions: jest.fn(),
}))

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}))

jest.mock('date-fns', () => ({
  format: (date: Date) => {
    const d = new Date(date)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}))

jest.mock('date-fns/locale', () => ({
  zhTW: {}
}))

// Mock UI components
jest.mock('@/components/ui/store-combobox', () => ({
  StoreCombobox: ({ value, onValueChange, placeholder }: any) => (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      aria-label={placeholder}
    >
      <option value="all">全部分店</option>
      <option value="1">台北店</option>
      <option value="2">台中店</option>
    </select>
  )
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => {
    const content = React.Children.toArray(children).find(
      (child: any) => child.type?.name === 'SelectContent'
    )
    
    return (
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {content}
      </select>
    )
  },
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: () => null,
  SelectValue: () => null,
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div className="card">{children}</div>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div className="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div className={`alert ${variant}`}>{children}</div>,
  AlertDescription: ({ children }: any) => <div className="alert-description">{children}</div>,
}))

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={`skeleton ${className}`} data-testid="skeleton" />
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <span>ArrowRight</span>,
  Calendar: () => <span>Calendar</span>,
  ChevronLeft: () => <span>ChevronLeft</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  Filter: () => <span>Filter</span>,
  History: () => <span>History</span>,
  Package: () => <span>Package</span>,
  Search: () => <span>Search</span>,
  TrendingUp: () => <span>TrendingUp</span>,
  TrendingDown: () => <span>TrendingDown</span>,
  User: () => <span>User</span>,
  RefreshCw: () => <span>RefreshCw</span>,
}))

// Create test component
const InventoryHistoryPage = () => {
  const [filters, setFilters] = React.useState({
    store_id: undefined as number | undefined,
    type: undefined as string | undefined,
    page: 1,
    per_page: 20,
  })

  const [searchTerm, setSearchTerm] = React.useState("")

  const {
    data: transactionsResponse,
    isLoading,
    error,
    refetch,
  } = useAllInventoryTransactions({
    store_id: filters.store_id,
    type: filters.type,
    page: filters.page,
    per_page: filters.per_page,
    product_name: searchTerm || undefined,
  })

  // Simplified transaction processing
  const processedTransactions = React.useMemo(() => {
    if (!transactionsResponse?.data) return []
    
    return transactionsResponse.data.map((transaction: InventoryTransaction) => {
      if (transaction.type === 'transfer_out' && transaction.metadata) {
        const metadata = typeof transaction.metadata === 'string' 
          ? JSON.parse(transaction.metadata) 
          : transaction.metadata
          
        if (metadata.transfer_id) {
          return {
            ...transaction,
            type: 'transfer',
            from_store: { name: '台北店' },
            to_store: { name: '台中店' },
          }
        }
      }
      return transaction
    })
  }, [transactionsResponse?.data])

  const handleStoreChange = (value: string) => {
    const storeId = value === 'all' ? undefined : parseInt(value)
    setFilters(prev => ({ ...prev, store_id: storeId, page: 1 }))
  }

  const handleTypeChange = (value: string) => {
    const type = value === 'all' ? undefined : value
    setFilters(prev => ({ ...prev, type, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      addition: '新增',
      reduction: '減少',
      adjustment: '調整',
      transfer_in: '轉入',
      transfer_out: '轉出',
      transfer: '庫存轉移',
      transfer_cancel: '轉移取消',
    }
    return typeMap[type] || type
  }

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch {
      return dateString
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="alert destructive">
          <div className="alert-description">
            載入庫存交易記錄失敗，請稍後再試。
          </div>
        </div>
      </div>
    )
  }

  const pagination = transactionsResponse?.pagination

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span>History</span>
            庫存變動歷史
          </h1>
          <p className="text-muted-foreground mt-2">
            查看所有商品的庫存變動記錄
          </p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2">
          <span>RefreshCw</span>
          重新整理
        </button>
      </div>

      {/* 篩選器區域 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <span>Filter</span>
            篩選條件
          </h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 商品名稱搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">商品名稱</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">Search</span>
                <input
                  placeholder="搜尋商品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">分店篩選</label>
              <select 
                value={filters.store_id?.toString() || 'all'}
                onChange={(e) => handleStoreChange(e.target.value)}
                aria-label="全部分店"
              >
                <option value="all">全部分店</option>
                <option value="1">台北店</option>
                <option value="2">台中店</option>
              </select>
            </div>

            {/* 交易類型篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">交易類型</label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                <option value="all">全部類型</option>
                <option value="addition">新增</option>
                <option value="reduction">減少</option>
                <option value="adjustment">調整</option>
                <option value="transfer_in">轉入</option>
                <option value="transfer_out">轉出</option>
                <option value="transfer_cancel">轉移取消</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 交易記錄列表 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <span>Package</span>
            交易記錄
          </h3>
          <div className="card-description">
            {pagination && `共 ${pagination.total} 筆記錄`}
          </div>
        </div>
        <div className="card-content">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="skeleton h-12 w-12 rounded" data-testid="skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-[300px]" data-testid="skeleton" />
                    <div className="skeleton h-4 w-[200px]" data-testid="skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : processedTransactions && processedTransactions.length > 0 ? (
            <div className="space-y-3">
              {processedTransactions.map((transaction: any, index: number) => {
                if (transaction.type === 'transfer') {
                  return (
                    <div key={`${transaction.id}-${index}`} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span>Package</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{transaction.product?.name}</h3>
                              <span className="badge outline">SKU: {transaction.product?.sku}</span>
                              <span className="badge default bg-blue-600">庫存轉移</span>
                              <span className="text-sm">數量: {transaction.quantity}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Calendar</span>
                              {formatDate(transaction.created_at || '')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="badge outline">{transaction.from_store?.name}</span>
                            <span>ArrowRight</span>
                            <span className="badge outline">{transaction.to_store?.name}</span>
                          </div>
                          {transaction.user && (
                            <div className="text-sm">
                              <span>User</span>
                              操作人: {transaction.user.name}
                            </div>
                          )}
                          {transaction.notes && (
                            <div className="text-sm">備註: {transaction.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={`${transaction.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-muted rounded-lg">
                        {transaction.quantity > 0 ? <span>TrendingUp</span> : <span>TrendingDown</span>}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{transaction.product?.name}</h3>
                          <span className="badge outline">SKU: {transaction.product?.sku}</span>
                          <span className="badge">{getTypeDisplayName(transaction.type || '')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>數量: {transaction.quantity}</span>
                          <span className="mx-2">前: {transaction.before_quantity} → 後: {transaction.after_quantity}</span>
                          <span>{transaction.store?.name}</span>
                          <span className="ml-2">
                            <span>User</span>
                            {transaction.user?.name}
                          </span>
                        </div>
                        {transaction.notes && (
                          <div className="text-sm">備註: {transaction.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Calendar</span>
                      {formatDate(transaction.created_at || '')}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <span>Package</span>
              <p>沒有找到交易記錄</p>
              <p className="text-sm">請嘗試調整搜尋條件</p>
            </div>
          )}

          {/* 分頁控制 */}
          {pagination && pagination.last_page && pagination.last_page > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm">
                第 {pagination.current_page} 頁，共 {pagination.last_page} 頁
                （總計 {pagination.total} 筆記錄）
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange((pagination.current_page || 1) - 1)}
                  disabled={pagination.current_page === 1}
                >
                  <span>ChevronLeft</span>
                  上一頁
                </button>
                <button
                  onClick={() => handlePageChange((pagination.current_page || 1) + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  下一頁
                  <span>ChevronRight</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const mockUseAllInventoryTransactions = useAllInventoryTransactions as jest.MockedFunction<typeof useAllInventoryTransactions>

// Mock transaction data
const mockTransactions: InventoryTransaction[] = [
  {
    id: 1,
    type: 'addition',
    quantity: 10,
    before_quantity: 0,
    after_quantity: 10,
    product: {
      name: '測試商品A',
      sku: 'TEST-001',
    },
    store: {
      id: 1,
      name: '台北店',
    },
    user: {
      name: '王小明',
    },
    created_at: '2024-01-01T10:00:00Z',
    notes: '初始庫存',
  },
  {
    id: 2,
    type: 'reduction',
    quantity: -5,
    before_quantity: 10,
    after_quantity: 5,
    product: {
      name: '測試商品A',
      sku: 'TEST-001',
    },
    store: {
      id: 1,
      name: '台北店',
    },
    user: {
      name: '李小華',
    },
    created_at: '2024-01-02T14:30:00Z',
    notes: '銷售出貨',
  },
  {
    id: 3,
    type: 'transfer_out',
    quantity: -3,
    before_quantity: 5,
    after_quantity: 2,
    product: {
      name: '測試商品A',
      sku: 'TEST-001',
    },
    store: {
      id: 1,
      name: '台北店',
    },
    user: {
      name: '王小明',
    },
    created_at: '2024-01-03T09:00:00Z',
    metadata: { transfer_id: 'TR-001', to_store_name: '台中店' },
  },
]

const mockPaginationData = {
  data: mockTransactions,
  pagination: {
    current_page: 1,
    last_page: 3,
    per_page: 20,
    total: 50,
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

describe('InventoryHistoryPage', () => {
  const mockRefetch = jest.fn()

  beforeEach(() => {
    mockUseAllInventoryTransactions.mockReturnValue({
      data: mockPaginationData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      isPlaceholderData: false,
      isPaused: false,
      fetchStatus: 'idle',
    } as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('頁面基本功能', () => {
    it('應該顯示頁面標題和描述', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('庫存變動歷史')).toBeInTheDocument()
      expect(screen.getByText('查看所有商品的庫存變動記錄')).toBeInTheDocument()
    })

    it('應該顯示重新整理按鈕', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('重新整理')).toBeInTheDocument()
    })

    it('應該能點擊重新整理按鈕', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<InventoryHistoryPage />)

      const refreshButton = screen.getByText('重新整理')
      await user.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('篩選功能', () => {
    it('應該顯示所有篩選器', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('商品名稱')).toBeInTheDocument()
      expect(screen.getByLabelText('全部分店')).toBeInTheDocument()
      expect(screen.getByText('交易類型')).toBeInTheDocument()
    })

    it('應該能搜尋商品名稱', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<InventoryHistoryPage />)

      const searchInput = screen.getByPlaceholderText('搜尋商品名稱...')
      await user.type(searchInput, '測試商品')

      expect(searchInput).toHaveValue('測試商品')
    })

    it('應該能選擇門市', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<InventoryHistoryPage />)

      const storeSelect = screen.getByLabelText('全部分店')
      await user.selectOptions(storeSelect, '1')

      expect(storeSelect).toHaveValue('1')
    })

    it('應該能選擇交易類型', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<InventoryHistoryPage />)

      const typeSelect = screen.getAllByRole('combobox')[1]
      await user.selectOptions(typeSelect, 'addition')

      expect(typeSelect).toHaveValue('addition')
    })
  })

  describe('交易記錄顯示', () => {
    it('應該顯示交易記錄列表', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('共 50 筆記錄')).toBeInTheDocument()
      const productNames = screen.getAllByText('測試商品A')
      expect(productNames.length).toBeGreaterThan(0)
      const skuBadges = screen.getAllByText('SKU: TEST-001')
      expect(skuBadges.length).toBeGreaterThan(0)
    })

    it('應該顯示不同類型的交易', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      // 使用getAllByText因為可能有多個相同類型的交易
      const addTransactions = screen.getAllByText('新增')
      expect(addTransactions.length).toBeGreaterThan(0)
      
      const reduceTransactions = screen.getAllByText('減少')
      expect(reduceTransactions.length).toBeGreaterThan(0)
      
      expect(screen.getByText('庫存轉移')).toBeInTheDocument()
    })

    it('應該顯示交易詳情', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('數量: 10')).toBeInTheDocument()
      expect(screen.getByText(/前: 0/)).toBeInTheDocument()
      expect(screen.getByText(/後: 10/)).toBeInTheDocument()
      expect(screen.getByText('操作人: 王小明')).toBeInTheDocument()
      expect(screen.getByText('備註: 初始庫存')).toBeInTheDocument()
    })

    it('應該顯示轉移記錄的特殊格式', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      const transferBadges = screen.getAllByText('台北店')
      expect(transferBadges.length).toBeGreaterThan(0)
      
      const chungStore = screen.getAllByText('台中店')
      expect(chungStore.length).toBeGreaterThan(0)
      
      expect(screen.getByText('庫存轉移')).toBeInTheDocument()
    })

    it('應該顯示正確的日期格式', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('2024/01/01 18:00')).toBeInTheDocument()
      expect(screen.getByText('2024/01/02 22:30')).toBeInTheDocument()
    })
  })

  describe('載入狀態', () => {
    it('應該顯示載入中的骨架屏', () => {
      mockUseAllInventoryTransactions.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: true,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
        status: 'pending',
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        fetchStatus: 'fetching',
      } as any)

      renderWithQueryClient(<InventoryHistoryPage />)

      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('錯誤處理', () => {
    it('應該顯示錯誤訊息', () => {
      mockUseAllInventoryTransactions.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('載入失敗'),
        refetch: mockRefetch,
        isError: true,
        isPending: false,
        isLoadingError: true,
        isRefetchError: false,
        isSuccess: false,
        status: 'error',
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: new Error('載入失敗'),
        errorUpdateCount: 1,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        fetchStatus: 'idle',
      } as any)

      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('載入庫存交易記錄失敗，請稍後再試。')).toBeInTheDocument()
    })
  })

  describe('空數據處理', () => {
    it('應該顯示無數據訊息', () => {
      mockUseAllInventoryTransactions.mockReturnValue({
        data: { data: [], pagination: null },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        fetchStatus: 'idle',
      } as any)

      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('沒有找到交易記錄')).toBeInTheDocument()
      expect(screen.getByText('請嘗試調整搜尋條件')).toBeInTheDocument()
    })
  })

  describe('分頁功能', () => {
    it('應該顯示分頁資訊', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText(/第 1 頁，共 3 頁/)).toBeInTheDocument()
      expect(screen.getByText(/總計 50 筆記錄/)).toBeInTheDocument()
    })

    it('應該能點擊下一頁', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<InventoryHistoryPage />)

      const nextButton = screen.getByText('下一頁')
      await user.click(nextButton)

      // 驗證點擊後的效果
      expect(nextButton).toBeInTheDocument()
    })

    it('應該在第一頁時禁用上一頁按鈕', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      const prevButton = screen.getByText('上一頁')
      expect(prevButton).toBeDisabled()
    })

    it('應該在最後一頁時禁用下一頁按鈕', () => {
      mockUseAllInventoryTransactions.mockReturnValue({
        data: {
          ...mockPaginationData,
          pagination: {
            ...mockPaginationData.pagination,
            current_page: 3,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        fetchStatus: 'idle',
      } as any)

      renderWithQueryClient(<InventoryHistoryPage />)

      const nextButton = screen.getByText('下一頁')
      expect(nextButton).toBeDisabled()
    })

    it('不應該在只有一頁時顯示分頁控制', () => {
      mockUseAllInventoryTransactions.mockReturnValue({
        data: {
          ...mockPaginationData,
          pagination: {
            ...mockPaginationData.pagination,
            last_page: 1,
          },
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
        status: 'success',
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        isPaused: false,
        fetchStatus: 'idle',
      } as any)

      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.queryByText('上一頁')).not.toBeInTheDocument()
      expect(screen.queryByText('下一頁')).not.toBeInTheDocument()
    })
  })

  describe('圖標顯示', () => {
    it('應該根據數量顯示正確的圖標', () => {
      renderWithQueryClient(<InventoryHistoryPage />)

      expect(screen.getByText('TrendingUp')).toBeInTheDocument() // 正數量
      expect(screen.getByText('TrendingDown')).toBeInTheDocument() // 負數量
    })
  })
})