"use client"

import { useState, useEffect } from "react"
import { InventoryTransferItem } from "@/types/api-helpers"
import { useAllInventoryTransactions } from "@/hooks/queries/useEntityQueries"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, TrendingUp, TrendingDown, Package, User, Calendar } from "lucide-react"
import { format } from "date-fns"

interface TransferHistoryDialogProps {
  transfer: InventoryTransferItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferHistoryDialog({
  transfer,
  open,
  onOpenChange
}: TransferHistoryDialogProps) {
  const [transferId, setTransferId] = useState<string>("")

  // 從轉移記錄推斷 transfer_id
  useEffect(() => {
    if (transfer.id) {
      // 嘗試多種可能的 transfer_id 格式
      setTransferId(`transfer_seed_${transfer.id}`)
    }
  }, [transfer.id])

  // 獲取所有交易記錄
  const { data: transactionsData, isLoading, error } = useAllInventoryTransactions({
    per_page: 100, // 獲取更多記錄以確保找到相關的交易
  })

  // 篩選出與此轉移相關的交易記錄
  const relatedTransactions = transactionsData?.data?.filter(transaction => {
    if (!transaction.metadata) return false
    
    let metadataObj = transaction.metadata
    if (typeof metadataObj === 'string') {
      try {
        metadataObj = JSON.parse(metadataObj)
      } catch {
        return false
      }
    }
    
    // 檢查是否包含相關的 transfer_id
    const txTransferId = metadataObj?.transfer_id
    return txTransferId === transferId || 
           txTransferId === `transfer_test_${transfer.id}` ||
           txTransferId === `transfer_${transfer.id}`
  }) || []

  const getTransactionIcon = (type: string, quantity: number) => {
    if (type.includes('transfer')) {
      return <Package className="h-4 w-4 text-blue-600" />
    }
    return quantity > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      transfer_out: { label: '轉出', variant: 'outline' },
      transfer_in: { label: '轉入', variant: 'default' },
      addition: { label: '新增', variant: 'default' },
      reduction: { label: '減少', variant: 'destructive' },
      adjustment: { label: '調整', variant: 'secondary' },
    }
    
    const config = typeMap[type] || { label: type, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MM/dd HH:mm')
    } catch {
      return dateString
    }
  }

  // 按照轉移邏輯對交易記錄進行分組和排序
  const processedTransactions = relatedTransactions.sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return dateA - dateB // 升序排列，顯示時間順序
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>轉移歷史記錄</DialogTitle>
          <DialogDescription>
            轉移單號 #{transfer.id} - 產品 #{transfer.product_variant_id}
          </DialogDescription>
        </DialogHeader>
        
        {/* 轉移基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">轉移資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">
                門市 #{transfer.from_store_id}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">
                門市 #{transfer.to_store_id}
              </Badge>
              <span className="ml-2">數量: {transfer.quantity}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>狀態:</span>
              <Badge variant={
                transfer.status === 'completed' ? 'default' :
                transfer.status === 'cancelled' ? 'destructive' :
                transfer.status === 'in_transit' ? 'secondary' : 'outline'
              }>
                {transfer.status === 'pending' ? '待處理' :
                 transfer.status === 'in_transit' ? '運送中' :
                 transfer.status === 'completed' ? '已完成' :
                 transfer.status === 'cancelled' ? '已取消' : transfer.status}
              </Badge>
              <span className="ml-4">創建時間: {formatDate(transfer.created_at || '')}</span>
            </div>
            {transfer.notes && (
              <div className="text-sm text-muted-foreground">
                備註: {transfer.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 相關交易記錄 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">相關庫存變動記錄</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  載入庫存變動記錄失敗
                </AlertDescription>
              </Alert>
            ) : processedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>暫無相關的庫存變動記錄</p>
                <p className="text-sm">可能是因為轉移尚未執行或記錄格式不同</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processedTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTransactionIcon(transaction.type || '', transaction.quantity || 0)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(transaction.type || '')}
                                                     <span className="text-sm font-medium">
                             數量: {(transaction.quantity || 0) > 0 ? '+' : ''}{transaction.quantity || 0}
                           </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.created_at || '')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">變動前:</span> {transaction.before_quantity ?? '未知'}
                        </div>
                        <div>
                          <span className="font-medium">變動後:</span> {transaction.after_quantity ?? '未知'}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{transaction.user?.name || '未知用戶'}</span>
                        </div>
                      </div>
                      
                      {transaction.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">備註:</span> {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 