"use client";

import { useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { BackorderAlert } from "@/components/backorders/BackorderAlert";
import { InventoryAlert } from "@/components/inventory/InventoryAlert";
import { SearchableProductSelect } from "@/components/dashboard/SearchableProductSelect";
import { useProductVariants } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardProductVariant } from "@/types/dashboard";

/**
 * 儀表板內容組件
 * 
 * 將主要的儀表板邏輯分離到獨立組件
 * 方便使用 Suspense 進行異步載入
 */
export function DashboardContent() {
  // 商品選擇狀態
  const [selectedProductVariantId, setSelectedProductVariantId] = useState<
    number | null
  >(null);

  // 獲取商品變體列表 - 優化性能：減少初始載入量
  const { data: productVariants, isLoading: isLoadingVariants } =
    useProductVariants({
      per_page: 30, // 減少初始載入量以提升性能
    });

  // 使用 useProductVariants 返回的處理過的變體陣列
  const variants: DashboardProductVariant[] = productVariants || [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">控制台</h1>
        </div>

        {/* 統計卡片 - 展示關鍵業務指標 */}
        <SectionCards />

        {/* 訂單和庫存警報 */}
        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <BackorderAlert />
          <InventoryAlert />
        </div>

        {/* 互動式圖表分析 */}
        <Card>
          <CardHeader>
            <CardTitle>銷售趨勢分析</CardTitle>
            <SearchableProductSelect
              value={selectedProductVariantId}
              onChange={setSelectedProductVariantId}
              variants={variants}
              isLoading={isLoadingVariants}
              placeholder="選擇商品查看趨勢"
            />
          </CardHeader>
          <CardContent>
            <ChartAreaInteractive
              selectedProductVariantId={selectedProductVariantId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}