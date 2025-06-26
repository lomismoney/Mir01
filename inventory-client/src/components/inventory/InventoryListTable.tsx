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
        <Badge variant="destructive" data-oid="k9isybl">
          缺貨
        </Badge>
      );
    } else if (quantity <= lowStockThreshold) {
      return (
        <Badge variant="outline" data-oid="ivmasp5">
          低庫存
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" data-oid="sj620nc">
          正常
        </Badge>
      );
    }
  };

  const flatInventoryItems = flattenInventoryData(data);

  return (
    <div className="rounded-md border" data-oid="kv-uht3">
      <Table data-oid="c0tobc0">
        <TableHeader data-oid="oolkh13">
          <TableRow
            className="border-b hover:bg-transparent"
            data-oid="cvqkomq"
          >
            <TableHead
              className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              data-oid="w87krfw"
            >
              SKU
            </TableHead>
            <TableHead
              className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              data-oid="z66.sm."
            >
              產品名稱
            </TableHead>
            <TableHead
              className="w-[120px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              data-oid="wl_l16_"
            >
              所在分店
            </TableHead>
            <TableHead
              className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="8ekcm7r"
            >
              數量
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="4d2c-se"
            >
              售價
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="nyfwqd9"
            >
              平均成本
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="1jsbdo8"
            >
              利潤率
            </TableHead>
            <TableHead
              className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="er-4q53"
            >
              狀態
            </TableHead>
            <TableHead
              className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
              data-oid="4ryquqk"
            >
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-oid="q7sbuja">
          {isLoading ? (
            // 載入中顯示骨架屏
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} data-oid="urio_pp">
                <TableCell colSpan={9} data-oid="yyaj_i3">
                  <Skeleton className="h-12 w-full" data-oid="pulct47" />
                </TableCell>
              </TableRow>
            ))
          ) : flatInventoryItems.length === 0 ? (
            // 無資料顯示
            <TableRow data-oid="7mw77db">
              <TableCell
                colSpan={9}
                className="h-24 text-center"
                data-oid="vyf1_l1"
              >
                <div
                  className="flex flex-col items-center justify-center space-y-3 py-6"
                  data-oid="ug-2hh2"
                >
                  <p
                    className="text-lg font-medium text-muted-foreground"
                    data-oid="p93w2:9"
                  >
                    沒有庫存資料
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    data-oid="g:5.9a9"
                  >
                    選擇一個門市並添加庫存
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // 庫存資料
            flatInventoryItems.map((item, index) => (
              <TableRow key={`${item.inventoryId}-${index}`} data-oid="eku5bg0">
                <TableCell
                  className="font-medium font-mono text-sm"
                  data-oid="qwq9--2"
                >
                  {item.sku}
                </TableCell>
                <TableCell data-oid="gn584h_">{item.productName}</TableCell>
                <TableCell className="font-medium" data-oid="v:q0zig">
                  {item.storeName}
                </TableCell>
                <TableCell className="text-center font-mono" data-oid="6qqxj8t">
                  {item.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono" data-oid="lby7t8t">
                  {item.price > 0 ? `NT$ ${item.price.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell className="text-right font-mono" data-oid="2-yrosu">
                  {item.averageCost && item.averageCost > 0
                    ? `NT$ ${item.averageCost.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-mono" data-oid="5bmrdw8">
                  {item.profitMargin && item.profitMargin > 0
                    ? `${item.profitMargin.toFixed(1)}%`
                    : "—"}
                </TableCell>
                <TableCell className="text-center" data-oid="nmk67pp">
                  {getStockStatusBadge(item)}
                </TableCell>
                <TableCell className="text-right" data-oid=".b30llb">
                  <div
                    className="flex justify-end space-x-2"
                    data-oid="8mw69-s"
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
                      data-oid="z68.e27"
                    >
                      <ArrowUpDown className="h-4 w-4" data-oid="cazidwh" />
                      <span className="sr-only" data-oid="__ialje">
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
