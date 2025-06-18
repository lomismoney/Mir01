"use client"

import { useState, useEffect, useMemo } from "react"
import { useSkuInventoryHistory } from "@/hooks/queries/useEntityQueries"
import { 
  getTransactionIcon, 
  getTransactionTypeName, 
  getTransactionTypeVariant,
  getTransactionIconColor 
} from "@/lib/inventory-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StoreCombobox } from "@/components/ui/store-combobox"
import { 
  Calendar, 
  Clock, 
  User, 
  RefreshCw,
  Search,
  Building
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { paths } from "@/types/api"

type SkuHistoryResponse = paths["/api/inventory/sku/{sku}/history"]["get"]["responses"]["200"]["content"]["application/json"]
type InventoryTransaction = NonNullable<SkuHistoryResponse["data"]>[0]

interface SkuHistoryPageProps {
  params: Promise<{
    sku: string
  }>
  searchParams: Promise<{
    productName?: string
  }>
}

export default function SkuHistoryPage({ 
  params, 
  searchParams 
}: SkuHistoryPageProps) {
  const [sku, setSku] = useState<string>("")
  const [productName, setProductName] = useState<string>("未知商品")
  const [mounted, setMounted] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    store_id: '',
    start_date: '',
    end_date: '',
    per_page: 20,
    page: 1
  })

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      setSku(decodeURIComponent(resolvedParams.sku))
      setProductName(resolvedSearchParams.productName || '未知商品')
      setMounted(true)
    }
    resolveParams()
  }, [params, searchParams])

  // 直接使用新的 SKU 歷史查詢 API
  const { data: skuHistoryData, isLoading: isLoadingHistory, error: historyError } = useSkuInventoryHistory({
    sku: sku || "",
    ...filters
  })

  // 從 API 回應中取得庫存項目和交易記錄
  const matchingInventories = useMemo(() => {
    return skuHistoryData?.inventories || []
  }, [skuHistoryData?.inventories])

  const allTransactions = useMemo(() => {
    return skuHistoryData?.data || []
  }, [skuHistoryData?.data])

  // 根據分店篩選進行過濾
  const filteredTransactions = useMemo(() => {
    if (!filters.store_id) {
      return allTransactions
    }
    
    const storeIdToFilter = parseInt(filters.store_id)
    return allTransactions.filter((transaction) => {
      const relatedInventory = matchingInventories.find((inv) => inv.id === transaction.inventory_id)
      return relatedInventory?.store?.id === storeIdToFilter
    })
  }, [allTransactions, filters.store_id, matchingInventories])

  // 條件性渲染移到最後
  if (!mounted || !sku) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingHistory) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (historyError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            載入庫存歷史記錄失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (matchingInventories.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>
            找不到 SKU 為 "{sku}" 的庫存項目。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SKU 庫存變動歷史</h2>
          <p className="text-muted-foreground">
            {productName} (SKU: {sku})
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            覆蓋 {matchingInventories.length} 個分店的庫存記錄
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新整理
        </Button>
      </div>

      {/* 分店概覽 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            分店庫存概覽
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchingInventories.map((inventory) => (
              <div key={inventory.id} className="p-3 border rounded-lg">
                <div className="font-medium">{inventory.store?.name || `分店 ${inventory.store?.id}`}</div>
                <div className="text-sm text-muted-foreground">
                  當前庫存: <span className="font-medium">{inventory.quantity || 0}</span>
                </div>
                {inventory.low_stock_threshold && (
                  <div className="text-xs text-muted-foreground">
                    低庫存門檻: {inventory.low_stock_threshold}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 篩選器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>交易類型</Label>
              <Select 
                value={filters.type || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === "all" ? "" : value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部類型</SelectItem>
                  <SelectItem value="addition">入庫</SelectItem>
                  <SelectItem value="reduction">出庫</SelectItem>
                  <SelectItem value="adjustment">調整</SelectItem>
                  <SelectItem value="transfer_in">轉入</SelectItem>
                  <SelectItem value="transfer_out">轉出</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>分店篩選</Label>
              <StoreCombobox
                value={filters.store_id}
                onValueChange={(value) => setFilters(prev => ({ ...prev, store_id: value, page: 1 }))}
                placeholder="全部分店"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>起始日期</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value, page: 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>結束日期</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value, page: 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>每頁顯示</Label>
              <Select 
                value={filters.per_page.toString()} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, per_page: parseInt(value), page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 筆</SelectItem>
                  <SelectItem value="20">20 筆</SelectItem>
                  <SelectItem value="50">50 筆</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            變動記錄
          </CardTitle>
          <CardDescription>
            共 {filteredTransactions.length} 筆記錄
            {filters.store_id && ` (已篩選分店)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: InventoryTransaction, index: number) => {
                const relatedInventory = matchingInventories.find((inv: any) => inv.id === transaction.inventory_id)
                
                return (
                  <div key={`${transaction.id}-${index}`} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-1">
                      {(() => {
                        const IconComponent = getTransactionIcon(transaction.type)
                        return <IconComponent className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`} />
                      })()}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTransactionTypeVariant(transaction.type)}>
                            {getTransactionTypeName(transaction.type)}
                          </Badge>
                          <Badge variant="outline">
                            {relatedInventory?.store?.name || `分店 ${relatedInventory?.store?.id}`}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            數量變動: {(transaction.quantity || 0) > 0 ? '+' : ''}{transaction.quantity || 0}
                          </span>
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
                      
                      {transaction.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">備註:</span> {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>暫無變動記錄</p>
              <p className="text-sm">該 SKU 尚無任何庫存變動記錄</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}