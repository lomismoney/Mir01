"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhTW } from "date-fns/locale"
import { 
  usePurchases, 
  useUpdatePurchaseStatus, 
  useCancelPurchase, 
  useDeletePurchase,
  useStores 
} from "@/hooks/queries/useEntityQueries"
import { 
  PURCHASE_STATUS_LABELS, 
  PURCHASE_STATUS_COLORS, 
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus
} from "@/types/purchase"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import { PurchasesResponse } from "@/types/api-helpers"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Package, 
  Plus,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  Archive,
  AlertCircle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Store,
  Filter
} from "lucide-react"

import { CreatePurchaseDialog } from "./CreatePurchaseDialog"

interface PurchaseFilters {
  store_id?: number
  status?: string
  order_number?: string
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}

export function PurchaseManagement() {
  const router = useRouter()

  // 狀態管理
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [filters, setFilters] = useState<PurchaseFilters>({
    page: 1,
    per_page: 20,
    status: '',
  })
  const [orderNumberInput, setOrderNumberInput] = useState("")

  // Debounce 搜尋
  const debouncedOrderNumber = useDebounce(orderNumberInput, 300)

  // API 查詢
  const { data: storesData } = useStores()
  const { 
    data: purchasesResponse, 
    isLoading, 
    error,
    refetch 
  } = usePurchases({
    ...filters,
    order_number: debouncedOrderNumber || undefined
  }) as { data: PurchasesResponse | undefined, isLoading: boolean, error: any, refetch: () => void }

  // Mutations
  const updateStatusMutation = useUpdatePurchaseStatus()
  const cancelMutation = useCancelPurchase()
  const deleteMutation = useDeletePurchase()

  /**
   * 處理篩選變更
   */
  const handleFilterChange = (key: keyof PurchaseFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1
    }))
  }

  /**
   * 重置篩選器
   */
  const handleResetFilters = () => {
    setFilters({ page: 1, per_page: 20 })
    setOrderNumberInput("")
  }

  /**
   * 更新進貨單狀態
   */
  const handleUpdateStatus = async (purchaseId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id: purchaseId, status: newStatus })
      toast.success("進貨單狀態已更新")
    } catch (error) {
      toast.error("更新狀態失敗")
    }
  }

  /**
   * 取消進貨單
   */
  const handleCancel = async (purchaseId: number) => {
    try {
      await cancelMutation.mutateAsync(purchaseId)
      toast.success("進貨單已取消")
    } catch (error) {
      toast.error("取消進貨單失敗")
    }
  }

  /**
   * 刪除進貨單
   */
  const handleDelete = async (purchaseId: number) => {
    try {
      await deleteMutation.mutateAsync(purchaseId)
      toast.success("進貨單已刪除")
    } catch (error) {
      toast.error("刪除進貨單失敗")
    }
  }

  /**
   * 計算統計數據
   */
  const getStatistics = () => {
    const purchases = purchasesResponse?.data || []
    const today = new Date().toDateString()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    return {
      todayCount: purchases.filter((p: any) => 
        new Date(p.created_at || '').toDateString() === today
      ).length,
      weeklyCount: purchases.filter((p: any) => 
        new Date(p.created_at || '') >= weekAgo
      ).length,
      total: purchasesResponse?.meta?.total || 0,
      pendingCount: purchases.filter((p: any) => p.status === 'pending').length,
    }
  }

  const stats = getStatistics()

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">進貨單管理</h1>
          <p className="text-muted-foreground">
            管理進貨單狀態、追蹤採購進度和庫存入庫
          </p>
        </div>
        
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>載入進貨單數據失敗</span>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            重試
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題區 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            進貨單管理
          </h1>
          <p className="text-muted-foreground mt-1">
            管理進貨單狀態、追蹤採購進度和庫存入庫流程
          </p>
        </div>
        
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新增進貨單
        </Button>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">今日新增</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayCount}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">本週進貨</p>
                <p className="text-2xl font-bold text-green-600">{stats.weeklyCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">待處理</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">總計</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <Archive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選器區域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選進貨單
          </CardTitle>
          <CardDescription>
            使用以下篩選器來查找特定的進貨單
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 進貨單號搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">進貨單號</label>
              <Input
                placeholder="搜尋進貨單號..."
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">門市</label>
              <Select
                value={filters.store_id?.toString() || "all"}
                onValueChange={(value) => handleFilterChange('store_id', value === "all" ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有門市</SelectItem>
                  {(storesData as any)?.data?.map((store: any) => (
                    <SelectItem key={store.id} value={store.id?.toString() || ""}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 狀態篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">狀態</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  {Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">操作</label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  重置
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 進貨單列表 */}
      <Card>
        <CardHeader>
          <CardTitle>進貨單列表</CardTitle>
          <CardDescription>
            共 {stats.total} 筆進貨單
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-muted rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : purchasesResponse?.data && purchasesResponse.data.length > 0 ? (
            <div className="space-y-4">
              {purchasesResponse.data.map((purchase: any) => {
                const permissions = getPurchasePermissions(purchase.status as PurchaseStatus)
                const statusTransitions = getValidStatusTransitions(purchase.status as PurchaseStatus)
                
                return (
                  <div key={purchase.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{purchase.order_number}</h3>
                          <Badge className={PURCHASE_STATUS_COLORS[purchase.status as PurchaseStatus]}>
                            {PURCHASE_STATUS_LABELS[purchase.status as PurchaseStatus]}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Store className="h-4 w-4" />
                            <span>{purchase.store?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {purchase.purchased_at 
                                ? format(new Date(purchase.purchased_at), 'yyyy/MM/dd', { locale: zhTW })
                                : '未設定'
                              }
                            </span>
                          </div>
                          <div>
                            總金額: NT$ {Number(purchase.total_amount || 0).toLocaleString()}
                          </div>
                        </div>

                        {purchase.items && purchase.items.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            共 {purchase.items.length} 項商品，
                            總數量: {purchase.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)}
                          </div>
                        )}
                      </div>

                      {/* 操作選單 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/purchases/${purchase.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看詳情
                          </DropdownMenuItem>
                          
                          {permissions.canModify && (
                            <DropdownMenuItem onClick={() => router.push(`/purchases/${purchase.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              編輯
                            </DropdownMenuItem>
                          )}

                          {statusTransitions.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              {statusTransitions.map((status) => (
                                <DropdownMenuItem 
                                  key={status}
                                  onClick={() => handleUpdateStatus(purchase.id, status)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  更新為 {PURCHASE_STATUS_LABELS[status]}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}

                          {permissions.canCancel && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <X className="h-4 w-4 mr-2" />
                                    取消進貨單
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>確認取消進貨單</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      確定要取消進貨單 "{purchase.order_number}" 嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancel(purchase.id)}>
                                      確認取消
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          {permissions.canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    刪除
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>確認刪除進貨單</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      確定要刪除進貨單 "{purchase.order_number}" 嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(purchase.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      確認刪除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}

              {/* 分頁控制 */}
              {purchasesResponse?.meta && purchasesResponse.meta.last_page && purchasesResponse.meta.last_page > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    第 {purchasesResponse.meta.current_page} 頁，共 {purchasesResponse.meta.last_page} 頁
                    （總計 {purchasesResponse.meta.total} 筆記錄）
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(purchasesResponse.meta.current_page || 1) <= 1}
                      onClick={() => handleFilterChange('page', (purchasesResponse.meta?.current_page || 1) - 1)}
                    >
                      上一頁
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(purchasesResponse.meta.current_page || 1) >= (purchasesResponse.meta.last_page || 1)}
                      onClick={() => handleFilterChange('page', (purchasesResponse.meta?.current_page || 1) + 1)}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">沒有進貨單</h3>
              <p className="text-muted-foreground mb-4">
                還沒有任何進貨單，點擊上方按鈕創建第一個進貨單。
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增進貨單
              </Button>
          </div>
          )}
        </CardContent>
      </Card>

      {/* 創建進貨單對話框 */}
      <CreatePurchaseDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}