"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { InventoryTransfer, PaginatedResponse } from "@/types/inventory"
import { getInventoryTransfers } from "@/lib/api/inventory"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshIcon } from "@/components/ui/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export const InventoryTransferList = () => {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse<InventoryTransfer>, Error>({
    queryKey: ["inventory-transfers", page, perPage],
    queryFn: () => getInventoryTransfers({ page, per_page: perPage }),
  })

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data && data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 py-6">
                        <p className="text-lg font-medium text-muted-foreground">沒有庫存轉移記錄</p>
                        <p className="text-sm text-muted-foreground">點擊"新增轉移"標籤來創建庫存轉移</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.data.map((transfer: InventoryTransfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>{transfer.id}</TableCell>
                    <TableCell>{formatDate(transfer.created_at)}</TableCell>
                    <TableCell>{transfer.fromStore?.name || `門市 #${transfer.from_store_id}`}</TableCell>
                    <TableCell>{transfer.toStore?.name || `門市 #${transfer.to_store_id}`}</TableCell>
                    <TableCell>{transfer.productVariant?.product?.name || `產品 #${transfer.product_variant_id}`}</TableCell>
                    <TableCell>{transfer.quantity}</TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell>{transfer.notes || "-"}</TableCell>
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
                disabled={!data || data.data.length < perPage}
              >
                下一頁
              </Button>
            </div>
          </>
        )}
    </div>
  )
} 