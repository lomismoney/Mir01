"use client";

import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks";
import { lazy, Suspense } from "react";
import { useSession } from "next-auth/react";

// 動態導入產品組件
const ProductClientComponent = lazy(() => import("@/components/products/ProductClientComponent"));

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
  const { data: session, status } = useSession();
  const { data: products, isLoading, error, isError } = useProducts();

  // 開發環境調試資訊
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductsPage - Query Status:', {
      sessionStatus: status,
      hasAccessToken: !!session?.accessToken,
      isLoading,
      isError,
      error: error?.message,
      productsCount: Array.isArray(products) ? products.length : 'Not an array',
      productsType: typeof products,
      productsIsObject: products && typeof products === 'object' && !Array.isArray(products),
      products: Array.isArray(products) ? products.slice(0, 3) : null // 只顯示前3個商品
    });
  }

  // 計算統計數據
  const productsArray = Array.isArray(products) ? products : [];
  const stats = {
    total: productsArray.length,
    active:
      productsArray.filter((p: any) => {
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
      productsArray.filter((p: any) => {
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
      productsArray.filter((p: any) => {
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
    <div className="container space-y-8 py-8">
      {/* 頁面頭部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            商品管理
          </h1>
          <p className="text-muted-foreground">
            管理您的商品庫存、價格和規格資訊
          </p>
        </div>
        <Button
          onClick={() => router.push("/products/new")}
          size="lg"
          className="gap-2"
         
        >
          <Plus className="h-5 w-5" />
          新增商品
        </Button>
      </div>

      {/* 統計卡片 - 使用與儀表板相同的樣式 */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4"
       
      >
        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              商品總數
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
             
            >
              {stats.total}
            </CardTitle>
            <div
              className="flex items-center justify-between"
             
            >
              <p className="text-xs text-muted-foreground">
                所有已建立的商品
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
               
              >
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              有庫存商品
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
             
            >
              {stats.active}
            </CardTitle>
            <div
              className="flex items-center justify-between"
             
            >
              <p className="text-xs text-muted-foreground">
                至少有一個門市有庫存
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
               
              >
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.active}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              低庫存預警
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
             
            >
              {stats.lowStock}
            </CardTitle>
            <div
              className="flex items-center justify-between"
             
            >
              <p className="text-xs text-muted-foreground">
                庫存量低於 10 件
              </p>
              <Badge
                variant="outline"
                className="text-xs h-5"
               
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                {percentageChanges.lowStock}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              缺貨商品
            </CardDescription>
            <CardTitle
              className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl"
             
            >
              {stats.outOfStock}
            </CardTitle>
            <div
              className="flex items-center justify-between"
             
            >
              <p className="text-xs text-muted-foreground">
                所有門市皆無庫存
              </p>
              <Badge
                variant="destructive"
                className="text-xs h-5"
               
              >
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.outOfStock}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 商品列表 - 使用 Suspense 包裝動態導入組件 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 rounded-lg border bg-card">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">載入商品列表...</p>
            </div>
          </div>
        }
      >
        <ProductClientComponent />
      </Suspense>
    </div>
  );
}
