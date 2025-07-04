"use client";

import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductClientComponent from "@/components/products/ProductClientComponent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks";

/**
 * 商品管理頁面
 *
 * @description
 * 提供商品管理的完整功能介面，包括：
 * - 頁面頭部（標題和新增按鈕）
 * - 統計卡片（顯示商品總數、庫存狀態等）
 * - 商品列表組件（支持搜尋、篩選、分頁、批量操作）
 *
 * 採用客戶端組件架構，確保互動性和即時性
 */
export default function ProductsPage() {
  const router = useRouter();
  const { data: products } = useProducts();

  // 計算統計數據
  const stats = {
    total: products?.length || 0,
    active:
      products?.filter((p: any) => {
        // 檢查是否有任何變體有庫存
        return p.variants?.some((v: any) => {
          // 檢查該變體的庫存總和是否大於 0
          const totalStock =
            v.inventory?.reduce(
              (sum: number, inv: any) => sum + (inv.quantity || 0),
              0,
            ) || 0;
          return totalStock > 0;
        });
      }).length || 0,
    lowStock:
      products?.filter((p: any) => {
        // 檢查是否有任何變體庫存低於 10 但大於 0
        return p.variants?.some((v: any) => {
          const totalStock =
            v.inventory?.reduce(
              (sum: number, inv: any) => sum + (inv.quantity || 0),
              0,
            ) || 0;
          return totalStock > 0 && totalStock < 10;
        });
      }).length || 0,
    outOfStock:
      products?.filter((p: any) => {
        // 檢查是否所有變體都沒有庫存
        return (
          p.variants?.every((v: any) => {
            const totalStock =
              v.inventory?.reduce(
                (sum: number, inv: any) => sum + (inv.quantity || 0),
                0,
              ) || 0;
            return totalStock === 0;
          }) || true
        );

        // 如果沒有變體，視為缺貨
      }).length || 0,
  };

  // 計算百分比變化（模擬數據）
  const percentageChanges = {
    total: 12.5,
    active: 8.3,
    lowStock: -15.2,
    outOfStock: 25.0,
  };

  return (
    <div className="container space-y-8 py-8" data-oid="veq1flm">
      {/* 頁面頭部 */}
      <div className="flex items-center justify-between" data-oid="7ktgey.">
        <div className="space-y-1" data-oid="n1g2jv8">
          <h1 className="text-3xl font-bold tracking-tight" data-oid="l6v_qkn">
            商品管理
          </h1>
          <p className="text-muted-foreground" data-oid="9swh3t0">
            管理您的商品庫存、價格和規格資訊
          </p>
        </div>
        <Button
          onClick={() => router.push("/products/new")}
          size="lg"
          className="gap-2"
          data-oid="12as8ep"
        >
          <Plus className="h-5 w-5" data-oid="5meengs" />
          新增商品
        </Button>
      </div>

      {/* 統計卡片 - 使用與儀表板相同的樣式 */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4"
        data-oid="cvwmwac"
      >
        <Card className="@container/card" data-oid="d-l2y1c">
          <CardHeader className="space-y-1" data-oid="a41m9hw">
            <CardDescription className="text-xs" data-oid="0e77icv">
              商品總數
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
              data-oid="ba0pwo3"
            >
              {stats.total}
            </CardTitle>
            <div
              className="flex items-center justify-between"
              data-oid="kbec17a"
            >
              <p className="text-xs text-muted-foreground" data-oid="tnklk6d">
                所有已建立的商品
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="nv483ke"
              >
                <TrendingUp className="h-3 w-3 mr-1" data-oid="g7dlqs_" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="4:ua060">
          <CardHeader className="space-y-1" data-oid="3vtnd7k">
            <CardDescription className="text-xs" data-oid="6.uqcob">
              有庫存商品
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
              data-oid="9py.y6z"
            >
              {stats.active}
            </CardTitle>
            <div
              className="flex items-center justify-between"
              data-oid="g7tpm3p"
            >
              <p className="text-xs text-muted-foreground" data-oid="8al-p.j">
                至少有一個門市有庫存
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="dlkjy5a"
              >
                <TrendingUp className="h-3 w-3 mr-1" data-oid="hc03qyd" />+
                {percentageChanges.active}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="qzw-av3">
          <CardHeader className="space-y-1" data-oid="xphlz:1">
            <CardDescription className="text-xs" data-oid="g3aflsh">
              低庫存預警
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
              data-oid="addqb_s"
            >
              {stats.lowStock}
            </CardTitle>
            <div
              className="flex items-center justify-between"
              data-oid=".7-_ixz"
            >
              <p className="text-xs text-muted-foreground" data-oid="ozkx9g8">
                庫存量低於 10 件
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="y9ndib1"
              >
                <TrendingDown className="h-3 w-3 mr-1" data-oid="fdg84ht" />
                {percentageChanges.lowStock}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card" data-oid="1h931d7">
          <CardHeader className="space-y-1" data-oid="m6zh2:g">
            <CardDescription className="text-xs" data-oid="i1e-wbl">
              缺貨商品
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
              data-oid="x64u9zj"
            >
              {stats.outOfStock}
            </CardTitle>
            <div
              className="flex items-center justify-between"
              data-oid="zg6917."
            >
              <p className="text-xs text-muted-foreground" data-oid="nu-wgt.">
                所有門市皆無庫存
              </p>
              <Badge
                variant="destructive"
                className="text-xs h-5"
                data-oid="de4kewr"
              >
                <TrendingUp className="h-3 w-3 mr-1" data-oid="889gz4v" />+
                {percentageChanges.outOfStock}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 商品列表 */}
      <ProductClientComponent data-oid="grqlkgu" />
    </div>
  );
}
