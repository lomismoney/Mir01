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
import { useProducts } from "@/hooks/queries/useEntityQueries";

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
    <div className="container space-y-8 py-8" data-oid="49e0lnk">
      {/* 頁面頭部 */}
      <div className="flex items-center justify-between" data-oid="cg6u:y7">
        <div className="space-y-1" data-oid="m33acve">
          <h1 className="text-3xl font-bold tracking-tight" data-oid="tyy2-l8">
            商品管理
          </h1>
          <p className="text-muted-foreground" data-oid="uz2m634">
            管理您的商品庫存、價格和規格資訊
          </p>
        </div>
        <Button
          onClick={() => router.push("/products/new")}
          size="lg"
          className="gap-2"
          data-oid="4e0m1cy"
        >
          <Plus className="h-5 w-5" data-oid=":mdv:yu" />
          新增商品
        </Button>
      </div>

      {/* 統計卡片 - 使用與儀表板相同的樣式 */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4"
        data-oid="gxvd3eh"
      >
        <Card data-oid="w5q9cb6">
          <CardHeader className="pb-2" data-oid="kem9.6q">
            <CardDescription data-oid=".k7g5_1">商品總數</CardDescription>
            <div
              className="flex items-center justify-between"
              data-oid="mtwhhb:"
            >
              <CardTitle
                className="text-2xl font-semibold tabular-nums"
                data-oid="v.l2yrn"
              >
                {stats.total}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="xnkt7ru"
              >
                <TrendingUp className="h-3 w-3" data-oid="b64k6vr" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0" data-oid="4idozls">
            <p className="text-sm text-muted-foreground" data-oid="p88hh0u">
              所有已建立的商品
            </p>
          </CardContent>
        </Card>

        <Card data-oid="o_9rhvg">
          <CardHeader className="pb-2" data-oid="juy2zca">
            <CardDescription data-oid="quxz864">有庫存商品</CardDescription>
            <div
              className="flex items-center justify-between"
              data-oid="q5zum3i"
            >
              <CardTitle
                className="text-2xl font-semibold tabular-nums"
                data-oid="a4fn:ye"
              >
                {stats.active}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="efx0jab"
              >
                <TrendingUp className="h-3 w-3" data-oid="nx8zt5f" />+
                {percentageChanges.active}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0" data-oid="mrpe_.o">
            <p className="text-sm text-muted-foreground" data-oid="ns6.39q">
              至少有一個門市有庫存
            </p>
          </CardContent>
        </Card>

        <Card data-oid="5.:g1:y">
          <CardHeader className="pb-2" data-oid="3gcfqbm">
            <CardDescription data-oid="c.mjgz4">低庫存預警</CardDescription>
            <div
              className="flex items-center justify-between"
              data-oid="e7hobe6"
            >
              <CardTitle
                className="text-2xl font-semibold tabular-nums"
                data-oid="-d-sav-"
              >
                {stats.lowStock}
              </CardTitle>
              <Badge
                variant="outline"
                className="text-xs h-5"
                data-oid="5y6q87_"
              >
                <TrendingDown className="h-3 w-3" data-oid="v14q7ga" />
                {percentageChanges.lowStock}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0" data-oid="j116wq4">
            <p className="text-sm text-muted-foreground" data-oid="zuu8lem">
              庫存量低於 10 件
            </p>
          </CardContent>
        </Card>

        <Card data-oid="wndnntk">
          <CardHeader className="pb-2" data-oid="2zd5_e6">
            <CardDescription data-oid="xaa:s0b">缺貨商品</CardDescription>
            <div
              className="flex items-center justify-between"
              data-oid="nr9ya_8"
            >
              <CardTitle
                className="text-2xl font-semibold tabular-nums"
                data-oid="q20j__s"
              >
                {stats.outOfStock}
              </CardTitle>
              <Badge
                variant="destructive"
                className="text-xs h-5"
                data-oid="r8s:.85"
              >
                <TrendingUp className="h-3 w-3" data-oid="8ajuj_n" />+
                {percentageChanges.outOfStock}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0" data-oid="qex-pt.">
            <p className="text-sm text-muted-foreground" data-oid="q9bu77a">
              所有門市皆無庫存
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 商品列表 */}
      <ProductClientComponent data-oid="ag4u2x." />
    </div>
  );
}
