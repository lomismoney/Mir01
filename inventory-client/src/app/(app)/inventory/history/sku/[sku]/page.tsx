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
  Building,
  ArrowRight,
  Package
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
// 定義 API 響應類型
interface SkuHistoryResponse {
  message: string
  data: InventoryTransaction[]
  inventories: InventoryItem[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

interface InventoryTransaction {
  id: number
  inventory_id: number
  user_id: number
  type: string
  quantity: number
  before_quantity: number
  after_quantity: number
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
  store?: {
    id: number
    name: string
  }
  user?: {
    name: string
  }
  product?: {
    name: string
    sku: string
  }
}

interface InventoryItem {
  id: number
  quantity: number
  low_stock_threshold: number
  store?: {
    id: number
    name: string
  }
  product_variant?: {
    sku: string
    product?: {
      name: string
    }
  }
}

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

  // 🎯 最終純化：直接使用標準化的 SKU 歷史查詢 API
  const { data: skuHistoryData, isLoading: isLoadingHistory, error: historyError } = useSkuInventoryHistory({
    sku: sku || "",
    ...filters
  })

  // 🎯 最終的純淨形態：直接從 Hook 返回的結構中解構，無需任何手動處理
  const matchingInventories = useMemo(() => {
    return skuHistoryData?.inventories ?? []
  }, [skuHistoryData])

  const allTransactions = useMemo(() => {
    return skuHistoryData?.data ?? []
  }, [skuHistoryData])

  // 處理並合併轉移記錄
  const processedTransactions = useMemo(() => {
    const processed: any[] = []
    const transferMap = new Map<string, any>()
    
    // 首先收集所有轉移記錄
    allTransactions.forEach((transaction: any) => {
      if (transaction.type === 'transfer_out' || transaction.type === 'transfer_in') {
        // 嘗試從 metadata 獲取 transfer_id
        let transferId = null;
        if (transaction.metadata) {
          // 處理可能的字符串形式的 metadata
          let metadataObj = transaction.metadata;
          if (typeof metadataObj === 'string') {
            try {
              metadataObj = JSON.parse(metadataObj);
            } catch (e) {
              // 解析失敗，保持原樣
            }
          }
          transferId = metadataObj?.transfer_id || metadataObj?.Transfer?.Id;
        }
        
        if (transferId) {
          if (!transferMap.has(transferId)) {
            transferMap.set(transferId, { out: null, in: null })
          }
          const transfer = transferMap.get(transferId)
          if (transaction.type === 'transfer_out') {
            transfer.out = transaction
          } else {
            transfer.in = transaction
          }
        } else {
          // 沒有 transfer_id 的轉移記錄，單獨顯示
          processed.push(transaction)
        }
      } else {
        // 非轉移記錄，直接加入
        processed.push(transaction)
      }
    })
    
    // 處理配對的轉移記錄
    transferMap.forEach((transfer, transferId) => {
      if (transfer.out && transfer.in) {
        // 找到配對的轉移記錄，創建合併記錄
        const fromInventory = matchingInventories.find((inv: any) => inv.id === transfer.out.inventory_id)
        const toInventory = matchingInventories.find((inv: any) => inv.id === transfer.in.inventory_id)
        
        processed.push({
          id: `transfer-${transferId}`,
          type: 'transfer',
          quantity: Math.abs(transfer.out.quantity),
          from_store: fromInventory?.store || { name: '未知門市' },
          to_store: toInventory?.store || { name: '未知門市' },
          created_at: transfer.out.created_at,
          user: transfer.out.user,
          notes: transfer.out.notes,
          metadata: transfer.out.metadata,
          // 保留原始記錄以備需要
          _original: { out: transfer.out, in: transfer.in }
        })
      } else {
        // 沒有配對的轉移記錄，單獨顯示
        if (transfer.out) processed.push(transfer.out)
        if (transfer.in) processed.push(transfer.in)
      }
    })
    
    // 按時間排序
    return processed.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA // 降序排列
    })
  }, [allTransactions, matchingInventories])

  // 根據篩選條件進行過濾
  const filteredTransactions = useMemo(() => {
    let filtered = processedTransactions
    
    // 類型篩選
    if (filters.type) {
      filtered = filtered.filter((transaction: any) => {
        // 處理合併的轉移記錄
        if (filters.type === 'transfer') {
          return transaction.type === 'transfer' || 
                 transaction.type === 'transfer_in' || 
                 transaction.type === 'transfer_out'
        }
        return transaction.type === filters.type
      })
    }
    
    // 分店篩選
    if (filters.store_id) {
      const storeIdToFilter = parseInt(filters.store_id)
      filtered = filtered.filter((transaction: any) => {
        if (transaction.type === 'transfer') {
          // 轉移記錄，檢查是否涉及篩選的門市
          return transaction.from_store?.id === storeIdToFilter || 
                 transaction.to_store?.id === storeIdToFilter
        } else {
          // 其他記錄，檢查庫存所屬門市
          const relatedInventory = matchingInventories.find((inv: any) => inv.id === transaction.inventory_id)
          return relatedInventory?.store?.id === storeIdToFilter
        }
      })
    }
    
    return filtered
  }, [processedTransactions, filters.type, filters.store_id, matchingInventories])

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
            {matchingInventories.map((inventory: InventoryItem) => (
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
                  <SelectItem value="transfer">轉移</SelectItem>
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
              {filteredTransactions.map((transaction: any, index: number) => {
                // 處理合併的轉移記錄
                if (transaction.type === 'transfer') {
                  return (
                    <div key={`${transaction.id}-${index}`} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="mt-1">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-600">
                              庫存轉移
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              數量: {transaction.quantity}
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
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">
                            {transaction.from_store.name}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline">
                            {transaction.to_store.name}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {transaction._original?.out && (
                            <div>
                              <span className="font-medium">{transaction.from_store.name} 轉出後:</span> {transaction._original.out.after_quantity ?? '未知'}
                            </div>
                          )}
                          {transaction._original?.in && (
                            <div>
                              <span className="font-medium">{transaction.to_store.name} 轉入後:</span> {transaction._original.in.after_quantity ?? '未知'}
                            </div>
                          )}
                          {transaction.user && (
                            <div className="flex items-center gap-1 md:col-span-2">
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
                        
                        {transaction.metadata && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">轉移編號:</span> 
                            {(() => {
                              let metadataObj = transaction.metadata;
                              if (typeof metadataObj === 'string') {
                                try {
                                  metadataObj = JSON.parse(metadataObj);
                                } catch (e) {
                                  return '未知';
                                }
                              }
                              return metadataObj?.transfer_id || metadataObj?.Transfer?.Id || '未知';
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                
                // 原始的單一記錄顯示邏輯
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
                      
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">額外資訊:</span> 
                        {(() => {
                          if (!transaction.metadata) return '無';
                          // 處理 metadata，可能是字符串或對象
                          let metadataObj = transaction.metadata;
                          
                          // 如果是字符串，嘗試解析為 JSON
                          if (typeof metadataObj === 'string') {
                            try {
                              metadataObj = JSON.parse(metadataObj);
                            } catch (e) {
                              // 如果解析失敗，直接返回原始字符串
                              return metadataObj;
                            }
                          }
                          
                          // 格式化顯示 metadata 對象
                          if (typeof metadataObj === 'object' && metadataObj !== null) {
                            const entries = Object.entries(metadataObj);
                            if (entries.length === 0) return '無';
                            
                            return entries.map(([key, value]) => {
                              // 轉換 key 為更友好的顯示名稱
                              const displayKey = key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, l => l.toUpperCase())
                                .replace('Order Id', '訂單編號')
                                .replace('Source', '來源')
                                .replace('Reason', '原因')
                                .replace('Purchase Order', '採購單號')
                                .replace('Transfer Id', '轉移編號');
                              
                              return `${displayKey}: ${value}`;
                            }).join(', ');
                          }
                          
                          return '無';
                        })()}
                      </div>
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