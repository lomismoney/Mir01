"use client";

import { useState } from "react";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { useProductVariants } from "@/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 商品變體類型定義（適用於 Dashboard 頁面）
 */
interface DashboardProductVariant {
  id: number;
  sku: string;
  price: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  attribute_values?: Array<{
    id: number;
    value: string;
    attribute_id: number;
    attribute?: {
      id: number;
      name: string;
    } | null;
  }>;
  [key: string]: any;
}

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
  const [selectedProductVariantId, setSelectedProductVariantId] = useState<
    number | null
  >(null);

  // 獲取商品變體列表
  const { data: productVariants, isLoading: isLoadingVariants } =
    useProductVariants({
      per_page: 100, // 獲取較多商品供選擇
    });

  // 使用 useProductVariants 返回的處理過的變體陣列
  const variants: DashboardProductVariant[] = productVariants || [];

  return (
    <div className="flex flex-1 flex-col" data-oid="durq1z4">
      <div
        className="@container/main flex flex-1 flex-col gap-2"
        data-oid="t5een4g"
      >
        <div
          className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
          data-oid="z754o0l"
        >
          <SectionCards data-oid="e_fwggf" />

          {/* 商品選擇器 */}
          <div className="px-4 lg:px-6" data-oid="a1:4kl9">
            <Card data-oid="53eg68w">
              <CardHeader data-oid="3_vkt21">
                <CardTitle className="text-lg" data-oid="4g11-6p">
                  庫存趨勢分析
                </CardTitle>
              </CardHeader>
              <CardContent data-oid="7wsqteg">
                <div className="space-y-2" data-oid="3gee0mm">
                  <label className="text-sm font-medium" data-oid="vz-2kn6">
                    選擇商品查看庫存趨勢
                  </label>
                  <Select
                    value={selectedProductVariantId?.toString() || ""}
                    onValueChange={(value) =>
                      setSelectedProductVariantId(
                        value ? parseInt(value) : null,
                      )
                    }
                    data-oid="blfvvmk"
                  >
                    <SelectTrigger className="w-full" data-oid="pn7sd7n">
                      <SelectValue
                        placeholder={
                          isLoadingVariants ? "載入商品中..." : "請選擇商品"
                        }
                        data-oid="sc_5ddw"
                      />
                    </SelectTrigger>
                    <SelectContent data-oid="bfoo:8_">
                      {variants?.map((variant: DashboardProductVariant) => (
                        <SelectItem
                          key={variant.id}
                          value={variant.id?.toString() || ""}
                          data-oid="6y:ztz0"
                        >
                          {variant.product?.name} - {variant.sku}
                          {variant.attribute_values &&
                            variant.attribute_values.length > 0 && (
                              <span
                                className="text-muted-foreground ml-1"
                                data-oid="t6vodk3"
                              >
                                (
                                {variant.attribute_values
                                  .map((av) => av.value)
                                  .join(", ")}
                                )
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
          <div className="px-4 lg:px-6" data-oid="3.4_-ms">
            <ChartAreaInteractive
              productVariantId={selectedProductVariantId}
              data-oid="03pufnu"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
