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
import { InventoryItem } from '@/types/api-helpers';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpDown } from "lucide-react";

interface InventoryListTableProps {
  data: InventoryItem[];
  isLoading: boolean;
  onSelectInventory: (inventoryId: number, productVariantId: number, quantity: number) => void;
}

export function InventoryListTable({
  data,
  isLoading,
  onSelectInventory,
}: InventoryListTableProps) {
  // 根據庫存狀態返回適當的 Badge
  const getStockStatusBadge = (inventory: InventoryItem) => {
    const quantity = inventory.quantity || 0;
    const threshold = inventory.low_stock_threshold || 0;
    
    if (quantity <= 0) {
      return <Badge variant="destructive">缺貨</Badge>
    } else if (quantity <= threshold) {
      return <Badge variant="outline">低庫存</Badge>
    } else {
      return <Badge variant="default">正常</Badge>
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">SKU</TableHead>
            <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">產品名稱</TableHead>
            <TableHead className="w-[120px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">所在分店</TableHead>
            <TableHead className="text-center h-12 px-4 align-middle font-medium text-muted-foreground">數量</TableHead>
            <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">售價</TableHead>
            <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">平均成本</TableHead>
            <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">利潤率</TableHead>
            <TableHead className="text-center h-12 px-4 align-middle font-medium text-muted-foreground">狀態</TableHead>
            <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // 載入中顯示骨架屏
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={9}>
                  <Skeleton className="h-12 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : data.length === 0 ? (
            // 無資料顯示
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
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
                  {inventory.product_variant?.sku || "N/A"}
                </TableCell>
                <TableCell>
                  {inventory.product_variant?.product?.name || "未知產品"}
                </TableCell>
                <TableCell className="font-medium">
                  {inventory.store?.name || "未知分店"}
                </TableCell>
                <TableCell className="text-center">{inventory.quantity || 0}</TableCell>
                <TableCell className="text-right">
                  NT$ {typeof inventory.product_variant?.price === 'string' 
                    ? parseFloat(inventory.product_variant.price).toLocaleString() 
                    : (inventory.product_variant?.price || 0).toLocaleString()
                  }
                </TableCell>
                <TableCell className="text-right">
                  NT$ {(inventory.product_variant as any)?.average_cost 
                    ? (inventory.product_variant as any).average_cost.toLocaleString()
                    : "0.00"
                  }
                </TableCell>
                <TableCell className="text-right">
                  {(inventory.product_variant as any)?.profit_margin 
                    ? `${(inventory.product_variant as any).profit_margin.toFixed(2)}%`
                    : "0.00%"
                  }
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
                        inventory.id || 0, 
                        inventory.product_variant_id || 0,
                        inventory.quantity || 0
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