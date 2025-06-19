"use client"

import { useState } from "react"
import { InventoryTransferItem } from "@/types/api-helpers"
import { useInventoryTransfers } from "@/hooks/queries/useEntityQueries"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshIcon } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, History } from "lucide-react"
import { TransferStatusEditDialog } from "./TransferStatusEditDialog"
import { TransferHistoryDialog } from "./TransferHistoryDialog"

export const InventoryTransferList = () => {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [editingTransfer, setEditingTransfer] = useState<InventoryTransferItem | null>(null)
  const [viewingHistoryTransfer, setViewingHistoryTransfer] = useState<InventoryTransferItem | null>(null)

  const { data, isLoading, error, refetch } = useInventoryTransfers({ page, per_page: perPage })

  if (error) {
    toast({
      variant: "destructive",
      title: "錯誤",
      description: "讀取庫存轉移記錄失敗",
    })
  }

  const handleRefresh = () => {
    refetch()
    toast({
      title: "重新整理",
      description: "已重新載入庫存轉移記錄",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">待處理</Badge>
      case "in_transit":
        return <Badge variant="secondary">運送中</Badge>
      case "completed":
        return <Badge variant="default">已完成</Badge>
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const canEditStatus = (status: string) => {
    // 已完成和已取消的記錄不能編輯
    return status !== 'completed' && status !== 'cancelled'
  }

  const handleEditSuccess = () => {
    setEditingTransfer(null)
    refetch()
  }

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>單號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>來源門市</TableHead>
                  <TableHead>目標門市</TableHead>
                  <TableHead>產品</TableHead>
                  <TableHead>數量</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-6">
                        <p className="text-lg font-medium text-muted-foreground">沒有庫存轉移記錄</p>
                        <p className="text-sm text-muted-foreground">點擊"新增轉移"標籤來創建庫存轉移</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.data?.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{formatDate(transfer.created_at)}</TableCell>
                    <TableCell>{transfer.from_store?.name || `門市 #${transfer.from_store_id}`}</TableCell>
                    <TableCell>{transfer.to_store?.name || `門市 #${transfer.to_store_id}`}</TableCell>
                    <TableCell>{transfer.product_variant?.product?.name || `產品 #${transfer.product_variant_id}`}</TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status || 'unknown')}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={transfer.notes || ""}>
                        {transfer.notes || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => setViewingHistoryTransfer(transfer)}
                          >
                            <History className="mr-2 h-4 w-4" />
                            查看歷史
                          </DropdownMenuItem>
                          {canEditStatus(transfer.status || '') && (
                            <DropdownMenuItem 
                              onClick={() => setEditingTransfer(transfer)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              編輯狀態
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-center mt-4 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!data || !data.data || data.data.length < perPage}
              >
                下一頁
              </Button>
            </div>

            {/* 編輯狀態對話框 */}
            {editingTransfer && (
              <TransferStatusEditDialog
                transfer={editingTransfer}
                open={!!editingTransfer}
                onOpenChange={(open: boolean) => !open && setEditingTransfer(null)}
                onSuccess={handleEditSuccess}
              />
            )}

            {/* 查看歷史對話框 */}
            {viewingHistoryTransfer && (
              <TransferHistoryDialog
                transfer={viewingHistoryTransfer}
                open={!!viewingHistoryTransfer}
                onOpenChange={(open: boolean) => !open && setViewingHistoryTransfer(null)}
              />
            )}
          </>
        )}
    </div>
  )
} 