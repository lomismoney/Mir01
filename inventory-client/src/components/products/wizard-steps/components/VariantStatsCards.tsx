import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shapes,
  Barcode,
  CircleDollarSign,
  Wallet,
} from "lucide-react";

interface VariantStatsCardsProps {
  variantsCount: number;
  skuProgress: {
    percentage: number;
    completedCount: number;
    totalCount: number;
    isComplete: boolean;
  };
  priceProgress: {
    percentage: number;
    completedCount: number;
    totalCount: number;
    isComplete: boolean;
  };
  totalValue: number;
}

export function VariantStatsCards({
  variantsCount,
  skuProgress,
  priceProgress,
  totalValue,
}: VariantStatsCardsProps) {
  if (variantsCount === 0) return null;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
      {/* 變體數量卡片 */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            總變體數量
          </CardTitle>
          <Shapes className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tighter">
              {variantsCount}
            </span>
            <Badge
              variant="secondary"
              className="text-xs"
            >
              已生成
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            所有變體已準備就緒
          </p>
        </CardContent>
      </Card>

      {/* SKU 設定卡片 */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            SKU 配置進度
          </CardTitle>
          <Barcode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tighter">
            {skuProgress.percentage}%
          </div>
          <Progress
            value={skuProgress.percentage}
            className="h-2 mt-3"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {skuProgress.completedCount} 已完成
            </span>
            <span className="text-xs text-muted-foreground">
              {skuProgress.totalCount} 總數
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {skuProgress.isComplete
              ? "所有 SKU 已設定完成"
              : `還有 ${skuProgress.totalCount - skuProgress.completedCount} 個待設定`}
          </p>
        </CardContent>
      </Card>

      {/* 價格設定卡片 */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            價格配置進度
          </CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tighter">
            {priceProgress.percentage}%
          </div>
          <Progress
            value={priceProgress.percentage}
            className="h-2 mt-3"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {priceProgress.completedCount} 已完成
            </span>
            <span className="text-xs text-muted-foreground">
              {priceProgress.totalCount} 總數
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {priceProgress.isComplete
              ? "所有價格已設定完成"
              : `還有 ${priceProgress.totalCount - priceProgress.completedCount} 個待設定`}
          </p>
        </CardContent>
      </Card>

      {/* 總價值卡片 */}
      <Card data-slot="card" className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            商品總價值
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tighter">
            $
            {totalValue.toLocaleString("zh-TW", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            預估庫存價值
          </p>
          <p className="text-xs text-muted-foreground">
            基於當前定價計算
          </p>
        </CardContent>
      </Card>
    </div>
  );
}