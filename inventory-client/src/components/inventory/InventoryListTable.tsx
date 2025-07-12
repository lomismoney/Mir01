"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProductItem } from "@/types/api-helpers";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown } from "lucide-react";

// 扁平化的庫存項目類型
interface FlatInventoryItem {
  inventoryId: number;
  productVariantId: number;
  sku: string;
  productName: string;
  storeName: string;
  storeId: number;
  quantity: number;
  lowStockThreshold: number;
  price: number;
  averageCost?: number;
  profitMargin?: number;
}

interface InventoryListTableProps {
  data: ProductItem[];
  isLoading: boolean;
  onSelectInventory: (
    inventoryId: number,
    productVariantId: number,
    quantity: number,
  ) => void;
}

export function InventoryListTable({
  data,
  isLoading,
  onSelectInventory,
}: InventoryListTableProps) {
  // 將嵌套的商品數據扁平化為庫存項目列表
  const flattenInventoryData = (
    products: ProductItem[],
  ): FlatInventoryItem[] => {
    const flatItems: FlatInventoryItem[] = [];

    products.forEach((product) => {
      product.variants?.forEach((variant) => {
        variant.inventory?.forEach((inventory) => {
          // 驗證必要的 ID 欄位，如果任何一個無效就跳過這個項目
          if (!inventory.id || !variant.id || !inventory.store?.id) {
            console.warn("跳過無效的庫存項目：缺少必要的 ID", {
              inventoryId: inventory.id,
              variantId: variant.id,
              storeId: inventory.store?.id,
            });
            return;
          }

          const price =
            typeof variant.price === "string"
              ? parseFloat(variant.price)
              : variant.price || 0;
          const averageCost = (variant as any)?.average_cost || 0;
          const profitMargin =
            price > 0 && averageCost > 0
              ? ((price - averageCost) / price) * 100
              : 0;

          flatItems.push({
            inventoryId: inventory.id,
            productVariantId: variant.id,
            sku: variant.sku || `SKU-${variant.id}`,
            productName: product.name || `商品 ${product.id}`,
            storeName: inventory.store.name || `門市 ${inventory.store.id}`,
            storeId: inventory.store.id,
            quantity: inventory.quantity || 0,
            lowStockThreshold: inventory.low_stock_threshold || 0,
            price,
            averageCost,
            profitMargin,
          });
        });
      });
    });

    return flatItems;
  };

  // 根據庫存狀態返回適當的 Badge
  const getStockStatusBadge = (item: FlatInventoryItem) => {
    const { quantity, lowStockThreshold } = item;

    if (quantity <= 0) {
      return (
        <Badge variant="destructive">
          缺貨
        </Badge>
      );
    } else if (quantity <= lowStockThreshold) {
      return (
        <Badge variant="outline">
          低庫存
        </Badge>
      );
    } else {
      return (
        <Badge variant="default">
          正常
        </Badge>
      );
    }
  };

  const flatInventoryItems = flattenInventoryData(data);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            className="border-b hover:bg-transparent"
           
          >
            <TableHead
              className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
             
            >
              SKU
            </TableHead>
            <TableHead
              className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
             
            >
              產品名稱
            </TableHead>
            <TableHead
              className="w-[120px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
             
            >
              所在分店
            </TableHead>
            <TableHead
              className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              數量
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              售價
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              平均成本
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              利潤率
            </TableHead>
            <TableHead
              className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              狀態
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
             
            >
              操作
            </TableHead>
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
          ) : flatInventoryItems.length === 0 ? (
            // 無資料顯示
            <TableRow>
              <TableCell
                colSpan={9}
                className="h-24 text-center"
               
              >
                <div
                  className="flex flex-col items-center justify-center space-y-3 py-6"
                 
                >
                  <p
                    className="text-lg font-medium text-muted-foreground"
                   
                  >
                    沒有庫存資料
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                   
                  >
                    選擇一個門市並添加庫存
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // 庫存資料
            flatInventoryItems.map((item, index) => (
              <TableRow key={`${item.inventoryId}-${index}`}>
                <TableCell
                  className="font-medium font-mono text-sm"
                 
                >
                  {item.sku}
                </TableCell>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="font-medium">
                  {item.storeName}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {item.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.price > 0 ? `NT$ ${item.price.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.averageCost && item.averageCost > 0
                    ? `NT$ ${item.averageCost.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.profitMargin && item.profitMargin > 0
                    ? `${item.profitMargin.toFixed(1)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  {getStockStatusBadge(item)}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end space-x-2"
                   
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        onSelectInventory(
                          item.inventoryId,
                          item.productVariantId,
                          item.quantity,
                        )
                      }
                     
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="sr-only">
                        調整庫存
                      </span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
