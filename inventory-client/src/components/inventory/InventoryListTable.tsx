'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Inventory } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown } from "lucide-react";

interface InventoryListTableProps {
  data: Inventory[];
  isLoading: boolean;
  onSelectInventory: (inventoryId: number, productVariantId: number, quantity: number) => void;
}

export function InventoryListTable({
  data,
  isLoading,
  onSelectInventory,
}: InventoryListTableProps) {
  // 根據庫存狀態返回適當的 Badge
  const getStockStatusBadge = (inventory: Inventory) => {
    if (inventory.quantity <= 0) {
      return <Badge variant="destructive">缺貨</Badge>
    } else if (inventory.quantity <= inventory.low_stock_threshold) {
      return <Badge variant="outline">低庫存</Badge>
    } else {
      return <Badge variant="default">正常</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">SKU</TableHead>
            <TableHead>產品名稱</TableHead>
            <TableHead className="text-center">數量</TableHead>
            <TableHead className="text-center">低庫存閾值</TableHead>
            <TableHead className="text-center">狀態</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // 載入中顯示骨架屏
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-12 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            // 無資料顯示
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <p className="text-lg font-medium text-muted-foreground">沒有庫存資料</p>
                  <p className="text-sm text-muted-foreground">選擇一個門市並添加庫存</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // 庫存資料
            data.map((inventory) => (
              <TableRow key={inventory.id}>
                <TableCell className="font-medium">
                  {inventory.productVariant?.sku || "N/A"}
                </TableCell>
                <TableCell>
                  {inventory.productVariant?.product?.name || "未知產品"}
                </TableCell>
                <TableCell className="text-center">{inventory.quantity}</TableCell>
                <TableCell className="text-center">
                  {inventory.low_stock_threshold}
                </TableCell>
                <TableCell className="text-center">
                  {getStockStatusBadge(inventory)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onSelectInventory(
                        inventory.id, 
                        inventory.product_variant_id,
                        inventory.quantity
                      )}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="sr-only">調整庫存</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 