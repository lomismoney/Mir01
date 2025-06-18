"use client"

import { useState } from "react"
import { useInventoryHistory } from "@/hooks/queries/useEntityQueries"
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
import { 
  Calendar, 
  Clock, 
  User, 
  Package,
  RefreshCw,
  Search
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { zhTW } from "date-fns/locale"
import type { paths } from "@/types/api"

// 使用正確的 API 型別定義
type InventoryHistoryResponse = paths["/api/inventory/{id}/history"]["get"]["responses"]["200"]["content"]["application/json"]
type InventoryTransaction = NonNullable<InventoryHistoryResponse["data"]>[0]

interface InventoryHistoryProps {
  inventoryId: number
  productName?: string
  sku?: string
}

export function InventoryHistory({ inventoryId, productName, sku }: InventoryHistoryProps) {
  const [filters, setFilters] = useState({
    type: '',
    start_date: '',
    end_date: '',
    per_page: 20,
    page: 1
  })

  const { data: historyData, isLoading, error, refetch } = useInventoryHistory({
    id: inventoryId,
    ...filters
  }) as { data: InventoryHistoryResponse, isLoading: boolean, error: any, refetch: () => void }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              載入庫存歷史記錄失敗，請稍後再試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">庫存變動歷史</h2>
          {productName && (
            <p className="text-muted-foreground">
              {productName} {sku && `(${sku})`}
            </p>
          )}
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新整理
        </Button>
      </div>

      {/* 篩選器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>交易類型</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部類型</SelectItem>
                  <SelectItem value="addition">入庫</SelectItem>
                  <SelectItem value="reduction">出庫</SelectItem>
                  <SelectItem value="adjustment">調整</SelectItem>
                  <SelectItem value="transfer_in">轉入</SelectItem>
                  <SelectItem value="transfer_out">轉出</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>開始日期</Label>
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
              <Label>每頁筆數</Label>
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
                  <SelectItem value="100">100 筆</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            變動記錄
          </CardTitle>
          <CardDescription>
            {historyData?.total && `共 ${historyData.total} 筆記錄`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="space-y-4">
              {historyData.data.map((transaction: InventoryTransaction) => (
                <div key={transaction.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                    
                    {transaction.metadata && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">額外資訊:</span> 
                        {typeof transaction.metadata === 'string' 
                          ? transaction.metadata 
                          : JSON.stringify(transaction.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 分頁控制 */}
              {(historyData.last_page || 0) > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    顯示第 {historyData.from || 0} - {historyData.to || 0} 筆，共 {historyData.total || 0} 筆
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(historyData.current_page || 1) <= 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      上一頁
                    </Button>
                    <span className="text-sm">
                      第 {historyData.current_page || 1} / {historyData.last_page || 1} 頁
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(historyData.current_page || 1) >= (historyData.last_page || 1)}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      下一頁
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>尚無庫存變動記錄</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
