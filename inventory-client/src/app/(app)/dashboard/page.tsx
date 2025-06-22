'use client';

import { useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { useProductVariants } from "@/hooks/queries/useEntityQueries";
import { ProductVariant } from "@/types/api-helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 儀表板頁面（Auth.js 中間件保護版本）
 * 
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需 HOC 包裹
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 * 
 * 功能概述：
 * - 顯示系統統計卡片（SectionCards）
 * - 提供互動式圖表分析（ChartAreaInteractive）
 * - 展示重要的業務數據摘要
 * - 支持響應式佈局設計
 */
export default function DashboardPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
  
  // 商品選擇狀態
  const [selectedProductVariantId, setSelectedProductVariantId] = useState<number | null>(null);
  
  // 獲取商品變體列表
  const { data: productVariants, isLoading: isLoadingVariants } = useProductVariants({
    per_page: 100 // 獲取較多商品供選擇
  });
  
  // 使用類型斷言來處理數據類型
  const variants = productVariants as ProductVariant[] | undefined;
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          
          {/* 商品選擇器 */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">庫存趨勢分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">選擇商品查看庫存趨勢</label>
                  <Select 
                    value={selectedProductVariantId?.toString() || ""} 
                    onValueChange={(value) => setSelectedProductVariantId(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingVariants ? "載入商品中..." : "請選擇商品"} />
                    </SelectTrigger>
                    <SelectContent>
                      {variants?.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id?.toString() || ""}>
                          {variant.product?.name} - {variant.sku}
                          {variant.attribute_values && variant.attribute_values.length > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({variant.attribute_values.map((av) => av.value).join(', ')})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 庫存趨勢圖表 */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive productVariantId={selectedProductVariantId} />
          </div>
        </div>
      </div>
    </div>
  );
}