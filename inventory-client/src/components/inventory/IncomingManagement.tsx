"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStores, useAllInventoryTransactions } from "@/hooks/queries/useEntityQueries"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Package, 
  PackagePlus,
  History,
  User,
  Calendar,
  Store,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  Plus,
  FileText
} from "lucide-react"
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import { getTransactionIcon, getTransactionTypeName, getTransactionTypeVariant } from "@/lib/inventory-utils"

interface IncomingFilters {
  store_id?: number
  start_date?: string
  end_date?: string
  product_name?: string
  order_number?: string
  page?: number
  per_page?: number
}

export function IncomingManagement() {
  const { toast } = useToast()
  const router = useRouter()

  // 狀態管理
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [filters, setFilters] = useState<IncomingFilters>({
    page: 1,
    per_page: 20
  })
  const [productNameInput, setProductNameInput] = useState("")

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300)

  // 獲取門市列表
  const { data: storesData, isLoading: isLoadingStores } = useStores()

  // 獲取入庫歷史（只查詢 addition 類型的交易記錄）
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useAllInventoryTransactions({
    type: 'addition', // 只查詢入庫記錄
    store_id: filters.store_id,
    start_date: filters.start_date,
    end_date: filters.end_date,
    product_name: debouncedProductName || undefined,
    page: filters.page,
    per_page: filters.per_page,
  })

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value)
    setFilters(prev => ({
      ...prev,
      store_id: storeId,
      page: 1
    }))
  }

  /**
   * 處理日期篩選變更
   */
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined,
      page: 1
    }))
  }

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      per_page: 20
    })
    setProductNameInput("")
  }

  /**
   * 刷新數據
   */
  const handleRefresh = () => {
    refetchTransactions()
    toast({
      title: "重新整理",
      description: "已重新載入入庫數據",
    })
  }

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0
    if (debouncedProductName) count++
    if (filters.store_id) count++
    if (filters.start_date) count++
    if (filters.end_date) count++
    return count
  }

  /**
   * 分頁處理
   */
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }))
  }

  // 顯示錯誤狀態
  if (transactionsError) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">商品入庫管理</h1>
          <p className="text-muted-foreground">
            專注處理商品入庫操作和歷史記錄管理
          </p>
        </div>
        
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>載入失敗</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>無法載入入庫數據，請稍後再試</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題區 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackagePlus className="h-7 w-7 text-green-600" />
            商品入庫管理
          </h1>
          <p className="text-muted-foreground mt-1">
            專注處理商品入庫操作、查看入庫歷史記錄和追蹤入庫進度
          </p>
        </div>
        
        <Button
          onClick={() => setPurchaseDialogOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          新增進貨單
        </Button>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">今日入庫</p>
                <p className="text-2xl font-bold text-green-600">
                  {transactionsData?.data?.filter((t: any) => {
                    const today = new Date().toDateString()
                    const transactionDate = new Date(t.created_at || '').toDateString()
                    return transactionDate === today
                  }).length || 0}
                </p>
              </div>
              <ArrowUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">本週入庫</p>
                <p className="text-2xl font-bold text-blue-600">
                  {transactionsData?.data?.filter((t: any) => {
                    const now = new Date()
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    const transactionDate = new Date(t.created_at || '')
                    return transactionDate >= weekAgo
                  }).length || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">總入庫次數</p>
                <p className="text-2xl font-bold text-purple-600">
                  {transactionsData?.pagination?.total || 0}
                </p>
              </div>
              <History className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選器區域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            篩選入庫記錄
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} 項篩選
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            使用以下篩選器來精確查找入庫記錄和相關資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 商品名稱搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4" />
                商品名稱
              </label>
              <Input
                placeholder="搜尋商品名稱..."
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                門市
              </label>
              <Select
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有門市</SelectItem>
                  {storesData?.data?.map((store) => (
                    <SelectItem key={store.id} value={store.id?.toString() || ""}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 開始日期 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                開始日期
              </label>
              <Input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleDateChange('start_date', e.target.value)}
              />
            </div>

            {/* 結束日期 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                結束日期
              </label>
              <Input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleDateChange('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* 操作按鈕區域 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetFilters}>
                重置篩選
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新整理
              </Button>
            </div>
            {getActiveFiltersCount() > 0 && (
              <p className="text-sm text-muted-foreground">
                找到 {transactionsData?.data?.length || 0} 筆結果
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 入庫歷史記錄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            入庫歷史記錄
          </CardTitle>
          <CardDescription>
            顯示所有商品入庫記錄，包括操作者、時間和詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactionsData?.data && transactionsData.data.length > 0 ? (
            <div className="space-y-4">
              {transactionsData.data.map((transaction: any) => (
                <div key={transaction.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1">
                    {(() => {
                      const IconComponent = getTransactionIcon(transaction.type || 'addition')
                      return <IconComponent className="h-5 w-5 text-green-600" />
                    })()}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          商品入庫
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          數量: +{transaction.quantity || 0}
                        </span>
                        {transaction.product?.name && (
                          <span className="text-sm font-medium">
                            {transaction.product.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {transaction.created_at && formatDistanceToNow(new Date(transaction.created_at), { 
                          addSuffix: true, 
                          locale: zhTW 
                        })}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">變動前:</span> {transaction.before_quantity ?? '未知'}
                      </div>
                      <div>
                        <span className="font-medium">變動後:</span> {transaction.after_quantity ?? '未知'}
                      </div>
                      {transaction.user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium">操作人:</span> {transaction.user.name}
                        </div>
                      )}
                    </div>

                    {transaction.store && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Store className="h-3 w-3" />
                        <span className="font-medium">門市:</span> {transaction.store.name}
                      </div>
                    )}
                    
                    {transaction.notes && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">備註:</span> {transaction.notes}
                      </div>
                    )}

                    {transaction.metadata && (
                      <div className="text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 inline mr-1" />
                        <span className="font-medium">詳細資訊:</span> 
                        <span className="ml-1">
                          {(() => {
                            let metadataObj: any = transaction.metadata;
                            
                            if (typeof metadataObj === 'string') {
                              try {
                                metadataObj = JSON.parse(metadataObj);
                              } catch (e) {
                                return String(metadataObj);
                              }
                            }
                            
                            if (typeof metadataObj === 'object' && metadataObj !== null) {
                              const entries = Object.entries(metadataObj);
                              if (entries.length === 0) return '無';
                              
                              return entries.map(([key, value]) => {
                                const displayKey = key
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, l => l.toUpperCase())
                                  .replace('Order Id', '進貨單號')
                                  .replace('Purchase Order', '採購單號')
                                  .replace('Source', '來源');
                                
                                return `${displayKey}: ${String(value)}`;
                              }).join(', ');
                            }
                            
                            return '無';
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 分頁控制 */}
              {transactionsData.pagination && (transactionsData.pagination.last_page || 0) > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    頁面 {transactionsData.pagination.current_page || 1}，共 {transactionsData.pagination.total || 0} 筆記錄
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(transactionsData.pagination.current_page || 1) <= 1}
                      onClick={() => handlePageChange((transactionsData.pagination?.current_page || 1) - 1)}
                    >
                      上一頁
                    </Button>
                    <span className="text-sm">
                      第 {transactionsData.pagination.current_page || 1} / {transactionsData.pagination.last_page || 1} 頁
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(transactionsData.pagination.current_page || 1) >= (transactionsData.pagination.last_page || 1)}
                      onClick={() => handlePageChange((transactionsData.pagination?.current_page || 1) + 1)}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PackagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">尚無入庫記錄</p>
              <p className="text-sm">點擊上方「新增進貨單」開始管理商品入庫</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增進貨單對話框 */}
      <CreatePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSuccess={() => {
          refetchTransactions()
          toast({
            title: "進貨成功",
            description: "商品已成功入庫，庫存已更新",
          })
        }}
      />
    </div>
  )
} 