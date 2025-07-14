"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Box, Palette, DollarSign, Archive } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { ExpandedProductItem } from "./columns";

interface AllVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ExpandedProductItem | null;
  variants: ExpandedProductItem[];
}

/**
 * 所有變體查看模態框
 * 
 * 當商品變體數量過多時，提供一個完整的變體列表查看界面
 */
export function AllVariantsModal({
  isOpen,
  onClose,
  product,
  variants,
}: AllVariantsModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!max-w-[85vw] !w-[85vw] max-h-[85vh] sm:!max-w-4xl md:!max-w-5xl lg:!max-w-6xl xl:!max-w-7xl"
        style={{ maxWidth: 'min(85vw, 1400px)', width: 'min(85vw, 1400px)' }}
      >
        {/* 🎨 優雅的標題區域 */}
        <DialogHeader className="border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2 text-base">
                <span className="text-muted-foreground">共</span>
                <Badge variant="secondary" className="px-2 py-0.5 text-sm font-medium">
                  {variants.length} 個變體
                </Badge>
                <span className="text-muted-foreground">規格</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 🎨 卡片式變體列表 */}
        <ScrollArea className="max-h-[55vh] px-2">
          <div className="space-y-2.5 py-1">
            {variants.map((variant, index) => {
              if (!variant.variantInfo) return null;

              const { variantInfo } = variant;
              const totalStock = variantInfo.inventory?.reduce(
                (sum, inv) => sum + (inv.quantity || 0),
                0
              ) || 0;

              const stockStatus = totalStock === 0 
                ? "缺貨" 
                : totalStock < 10 
                  ? "低庫存" 
                  : "庫存充足";

              const stockConfig = totalStock === 0 
                ? { variant: "destructive", icon: Archive }
                : totalStock < 10 
                  ? { variant: "secondary", icon: Box }
                  : { variant: "outline", icon: Box };

              return (
                <div
                  key={variant.id}
                  className="group relative rounded-lg border border-border/50 bg-card p-3 transition-all duration-200 hover:border-border hover:shadow-sm"
                >

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                    {/* SKU 區域 */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        SKU 代碼
                      </div>
                      <div className="font-mono text-sm font-medium truncate">
                        {variantInfo.sku}
                      </div>
                    </div>

                    {/* 規格區域 */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        產品規格
                      </div>
                      {variantInfo.attribute_values && 
                       variantInfo.attribute_values.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {variantInfo.attribute_values.map((attr, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs"
                            >
                              <Palette className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium truncate">
                                {attr.attribute?.name}
                              </span>
                              <span className="text-muted-foreground">:</span>
                              <span className="font-semibold text-foreground truncate">
                                {attr.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          無特殊規格
                        </div>
                      )}
                    </div>

                    {/* 價格與庫存區域 */}
                    <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                      {/* 價格 */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          銷售價格
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base font-semibold text-green-600 truncate">
                            {formatPrice(parseFloat(variantInfo.price))}
                          </span>
                        </div>
                      </div>

                      {/* 庫存狀態 */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          庫存狀態
                        </div>
                        <div className="flex items-center gap-1.5">
                          <stockConfig.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm">
                            {totalStock} 件
                          </span>
                        </div>
                        <Badge 
                          variant={stockConfig.variant as any}
                          className="w-fit text-xs px-1.5 py-0.5"
                        >
                          {stockStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 