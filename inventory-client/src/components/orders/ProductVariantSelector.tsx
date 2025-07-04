"use client";

import React, { useState } from "react";
import { Check, Search, Package } from "lucide-react";
import { useProducts } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProductItem, ProductVariant } from "@/types/api-helpers";

interface ProductVariantSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedVariants: ProductVariant[]) => void;
}

export function ProductVariantSelector({
  open,
  onOpenChange,
  onSelect,
}: ProductVariantSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>(
    [],
  );
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: response, isLoading } = useProducts({
    product_name: debouncedSearch,
  });

  // 安全地處理 API 響應
  const products: ProductItem[] =
    response && "data" in response && Array.isArray(response.data)
      ? (response.data as ProductItem[])
      : [];

  // 將所有商品的變體扁平化為一個列表
  const allVariants = products.flatMap(
    (product) =>
      product.variants?.map((variant) => ({
        ...variant,
        product_name: product.name,
        product_category: product.category?.name,
        // 計算庫存總量
        total_inventory:
          variant.inventory?.reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0,
          ) || 0,
      })) || [],
  );

  const handleVariantToggle = (
    variant: ProductVariant & { product_name?: string },
  ) => {
    setSelectedVariants((prev) => {
      const isSelected = prev.some((v) => v.id === variant.id);
      if (isSelected) {
        return prev.filter((v) => v.id !== variant.id);
      } else {
        return [...prev, variant];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(selectedVariants);
    setSelectedVariants([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedVariants([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "缺貨", variant: "destructive" as const };
    if (quantity <= 10)
      return { label: "低庫存", variant: "secondary" as const };
    return { label: "有庫存", variant: "default" as const };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="1.uzhmd">
      <DialogContent
        className="w-[90vw] max-w-[1400px] max-h-[80vh] flex flex-col"
        data-oid="1:8zfs9"
      >
        <DialogHeader data-oid="lud12wk">
          <DialogTitle className="flex items-center gap-2" data-oid="lkr8b3m">
            <Package className="h-5 w-5" data-oid="t_6hvif" />
            選擇商品項目
          </DialogTitle>
        </DialogHeader>

        {/* 搜尋欄 */}
        <div className="flex items-center space-x-2" data-oid="xqdwq4j">
          <div className="relative flex-1" data-oid="b4uv3ll">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
              data-oid="7ac:o:y"
            />

            <Input
              placeholder="搜尋商品名稱或 SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-oid="evd55g6"
            />
          </div>
          <Badge variant="outline" data-oid="70bd5hb">
            已選擇 {selectedVariants.length} 項
          </Badge>
        </div>

        {/* 商品變體表格 */}
        <div
          className="flex-1 overflow-auto border rounded-md"
          data-oid="8pn_1.q"
        >
          <Table data-oid="xl5c5cm">
            <TableHeader data-oid="3.uybz_">
              <TableRow
                className="border-b hover:bg-transparent"
                data-oid="lab6bdf"
              >
                <TableHead
                  className="w-12 h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="_u3rmjn"
                >
                  選擇
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="6-z82vy"
                >
                  商品名稱
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="w69elp3"
                >
                  SKU
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="xe5ttg4"
                >
                  規格
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="3cf7ov5"
                >
                  分類
                </TableHead>
                <TableHead
                  className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="pq3yge2"
                >
                  單價
                </TableHead>
                <TableHead
                  className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="h65rp2_"
                >
                  庫存
                </TableHead>
                <TableHead
                  className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="t4anc.1"
                >
                  狀態
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="efbch:q">
              {isLoading ? (
                <TableRow data-oid=".xpk_9m">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8"
                    data-oid="8gjy-uz"
                  >
                    載入中...
                  </TableCell>
                </TableRow>
              ) : allVariants.length === 0 ? (
                <TableRow data-oid="zi1ireu">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-oid="um9ee46"
                  >
                    {searchQuery ? "找不到符合條件的商品" : "暫無商品資料"}
                  </TableCell>
                </TableRow>
              ) : (
                allVariants.map((variant) => {
                  const isSelected = selectedVariants.some(
                    (v) => v.id === variant.id,
                  );
                  const stockStatus = getStockStatus(variant.total_inventory);

                  return (
                    <TableRow
                      key={variant.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? "bg-muted" : ""}`}
                      onClick={() => handleVariantToggle(variant)}
                      data-oid="u6f5hl5"
                    >
                      <TableCell data-oid="0_:u8x2">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleVariantToggle(variant)}
                          data-oid="_mmoc6q"
                        />
                      </TableCell>
                      <TableCell className="font-medium" data-oid="q2m0zag">
                        {variant.product_name}
                      </TableCell>
                      <TableCell
                        className="font-mono text-sm"
                        data-oid="dyge0mq"
                      >
                        {variant.sku}
                      </TableCell>
                      <TableCell data-oid="jcj.jzy">
                        {variant.attribute_values
                          ?.map((av) => av.value)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell data-oid="ze8f7qz">
                        <Badge variant="outline" data-oid="060ay.g">
                          {variant.product_category || "未分類"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right font-medium"
                        data-oid="fyuiboh"
                      >
                        ${Math.round(parseFloat(variant.price || "0")).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center" data-oid="yqxzns:">
                        {variant.total_inventory}
                      </TableCell>
                      <TableCell className="text-center" data-oid="pf771e7">
                        <Badge variant={stockStatus.variant} data-oid="-g6rmgk">
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter data-oid="pgron84">
          <Button variant="outline" onClick={handleCancel} data-oid="5soj2tt">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedVariants.length === 0}
            data-oid="l4prm-a"
          >
            確認添加 ({selectedVariants.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
