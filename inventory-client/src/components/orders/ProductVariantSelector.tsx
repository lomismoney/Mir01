"use client";

import React, { useState } from "react";
import { Check, Search, Package } from "lucide-react";
import { useProducts } from "@/hooks/queries/useEntityQueries";
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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="u06mjis">
      <DialogContent
        className="w-[90vw] max-w-[1400px] max-h-[80vh] flex flex-col"
        data-oid="khh2vkp"
      >
        <DialogHeader data-oid="2u9i589">
          <DialogTitle className="flex items-center gap-2" data-oid="1aokm3c">
            <Package className="h-5 w-5" data-oid="e8unz5u" />
            選擇商品項目
          </DialogTitle>
        </DialogHeader>

        {/* 搜尋欄 */}
        <div className="flex items-center space-x-2" data-oid="3.8m:qu">
          <div className="relative flex-1" data-oid="gbn10va">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
              data-oid="mjb.nej"
            />

            <Input
              placeholder="搜尋商品名稱或 SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-oid="seezuem"
            />
          </div>
          <Badge variant="outline" data-oid=".owh8m0">
            已選擇 {selectedVariants.length} 項
          </Badge>
        </div>

        {/* 商品變體表格 */}
        <div
          className="flex-1 overflow-auto border rounded-md"
          data-oid="y3fh-gr"
        >
          <Table data-oid="a4ebgdg">
            <TableHeader data-oid="7rrbooa">
              <TableRow
                className="border-b hover:bg-transparent"
                data-oid="1n8-3ed"
              >
                <TableHead
                  className="w-12 h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="5r-i9ic"
                >
                  選擇
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="8wb-y8a"
                >
                  商品名稱
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="o-bdmip"
                >
                  SKU
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="dztojnz"
                >
                  規格
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="7dni7ps"
                >
                  分類
                </TableHead>
                <TableHead
                  className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="w87bjma"
                >
                  單價
                </TableHead>
                <TableHead
                  className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="8ku1_9x"
                >
                  庫存
                </TableHead>
                <TableHead
                  className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                  data-oid="y3axs:h"
                >
                  狀態
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="cto-.5q">
              {isLoading ? (
                <TableRow data-oid=".-.5ws6">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8"
                    data-oid="7e:co64"
                  >
                    載入中...
                  </TableCell>
                </TableRow>
              ) : allVariants.length === 0 ? (
                <TableRow data-oid="mgm8_rw">
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-oid="b.s9loi"
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
                      data-oid="hzvfjaa"
                    >
                      <TableCell data-oid="m8hn3ox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleVariantToggle(variant)}
                          data-oid="csjygkp"
                        />
                      </TableCell>
                      <TableCell className="font-medium" data-oid="u4u--0u">
                        {variant.product_name}
                      </TableCell>
                      <TableCell
                        className="font-mono text-sm"
                        data-oid=".1xyodb"
                      >
                        {variant.sku}
                      </TableCell>
                      <TableCell data-oid="y:jey_a">
                        {variant.attribute_values
                          ?.map((av) => av.value)
                          .join(", ") || "-"}
                      </TableCell>
                      <TableCell data-oid="jcnhb.o">
                        <Badge variant="outline" data-oid="c9883:f">
                          {variant.product_category || "未分類"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right font-medium"
                        data-oid="w90c8fx"
                      >
                        ${parseFloat(variant.price || "0").toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center" data-oid="so2lzw6">
                        {variant.total_inventory}
                      </TableCell>
                      <TableCell className="text-center" data-oid="766wtdy">
                        <Badge variant={stockStatus.variant} data-oid="2wngb._">
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

        <DialogFooter data-oid="ywu4dyf">
          <Button variant="outline" onClick={handleCancel} data-oid="g_u:qeb">
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedVariants.length === 0}
            data-oid="avv097o"
          >
            確認添加 ({selectedVariants.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
