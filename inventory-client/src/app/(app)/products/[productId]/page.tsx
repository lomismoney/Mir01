"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProductDetail } from "@/hooks";
import { Button } from "@/components/ui/button";
import { useDynamicBreadcrumb } from "@/components/breadcrumb-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// 移除未使用的組件
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  Tag,
  Calendar,
  Box,
  ImageIcon,
  Store,
  Info,
  Grid3X3,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { MoneyHelper } from "@/lib/money-helper";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

/**
 * 商品詳情頁面
 *
 * 顯示商品的完整資訊，包括：
 * - 基本資訊（名稱、描述、分類等）
 * - 價格資訊
 * - 規格變體列表
 * - 各門市庫存狀況
 */
interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const router = useRouter();
  const { productId } = use(params);
  const { setLabel } = useDynamicBreadcrumb();

  // 獲取商品詳情
  const { data: product, isLoading } = useProductDetail(Number(productId));
  
  // 動態設置麵包屑標籤
  useEffect(() => {
    if (product?.name) {
      setLabel(product.name);
    }
  }, [product?.name, setLabel]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
       
      >
        <div className="text-center space-y-4">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
           
          ></div>
          <p className="text-muted-foreground">
            載入商品資訊中...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
       
      >
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            找不到商品資訊
          </p>
          <Button onClick={() => router.push("/products")}>
            返回商品列表
          </Button>
        </div>
      </div>
    );
  }

  // 計算總庫存
  const totalStock =
    product.variants?.reduce((sum: number, variant: { inventory?: { quantity?: number }[] }) => {
      const variantStock =
        variant.inventory?.reduce(
          (vSum: number, inv: { quantity?: number }) => vSum + (inv.quantity || 0),
          0,
        ) || 0;
      return sum + variantStock;
    }, 0) || 0;

  // 計算價格範圍
  const prices = product.variants?.map((v: { price?: number }) => v.price).filter((p): p is number => p !== undefined && p > 0) || [];
  const priceRange = prices.length > 0 ? {
    min: Math.min(...prices),
    max: Math.max(...prices)
  } : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/products")}
           
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            商品詳情
          </h1>
        </div>
        <Button
          onClick={() => router.push(`/products/${productId}/edit`)}
         
        >
          <Edit className="h-4 w-4 mr-2" />
          編輯商品
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 左側：商品圖片和基本資訊 */}
        <div className="md:col-span-1 space-y-4">
          {/* 商品圖片 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
           
          >
            <CardContent className="p-6">
              <div
                className="aspect-square relative bg-muted rounded-lg overflow-hidden"
               
              >
                {product.image_urls && product.image_urls.length > 0 ? (
                  <Image
                    src={product.image_urls[0].replace(
                      "localhost",
                      "127.0.0.1",
                    )}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                   
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                   
                  >
                    <ImageIcon
                      className="h-16 w-16 text-muted-foreground"
                     
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 基本資訊 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
           
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
             
            >
              <div>
                <CardTitle className="text-lg font-semibold">
                  基本資訊
                </CardTitle>
                <CardDescription>
                  商品基本資料
                </CardDescription>
              </div>
              <Info
                className="h-4 w-4 text-muted-foreground"
               
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p
                  className="text-sm text-muted-foreground mb-1"
                 
                >
                  商品名稱
                </p>
                <p className="font-medium">
                  {product.name}
                </p>
              </div>

              {product.description && (
                <div>
                  <p
                    className="text-sm text-muted-foreground mb-1"
                   
                  >
                    商品描述
                  </p>
                  <p className="text-sm">
                    {product.description}
                  </p>
                </div>
              )}

              {product.category && (
                <div>
                  <p
                    className="text-sm text-muted-foreground mb-1"
                   
                  >
                    分類
                  </p>
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {product.category.name}
                  </Badge>
                </div>
              )}

              <div>
                <p
                  className="text-sm text-muted-foreground mb-1"
                 
                >
                  建立時間
                </p>
                <div
                  className="flex items-center gap-2 text-sm"
                 
                >
                  <Calendar
                    className="h-3 w-3 text-muted-foreground"
                   
                  />

                  {new Date(product.created_at).toLocaleString("zh-TW")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側：詳細資訊 */}
        <div className="md:col-span-2 space-y-4">
          {/* 價格和庫存資訊 */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 價格卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
             
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
               
              >
                <CardDescription>價格範圍</CardDescription>
                <DollarSign
                  className="h-4 w-4 text-muted-foreground"
                 
                />
              </CardHeader>
              <CardContent>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {priceRange && priceRange.min !== undefined ? (
                    priceRange.min === priceRange.max ? (
MoneyHelper.format(priceRange.min, 'NT$')
                    ) : (
                      <>
                        {MoneyHelper.format(priceRange.min, 'NT$')} -{" "}
                        {MoneyHelper.format(priceRange.max, 'NT$')}
                      </>
                    )
                  ) : (
                    "N/A"
                  )}
                </CardTitle>
                <div
                  className="flex items-center gap-2 mt-2"
                 
                >
                  <Badge
                    variant="outline"
                    className="text-xs"
                   
                  >
                    <Package className="h-3 w-3 mr-1" />
                    {product.variants?.length || 0} 個規格
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 庫存卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
             
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
               
              >
                <CardDescription>總庫存</CardDescription>
                <Box
                  className="h-4 w-4 text-muted-foreground"
                 
                />
              </CardHeader>
              <CardContent>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {totalStock} 件
                </CardTitle>
                <div
                  className="flex items-center gap-2 mt-2"
                 
                >
                  <Badge
                    variant={
                      totalStock === 0
                        ? "destructive"
                        : totalStock < 10
                          ? "secondary"
                          : "outline"
                    }
                   
                  >
                    {totalStock === 0
                      ? "缺貨"
                      : totalStock < 10
                        ? "低庫存"
                        : "庫存充足"}
                  </Badge>
                </div>
                <p
                  className="text-xs text-muted-foreground mt-1"
                 
                >
                  所有門市總計
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 規格變體列表 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
           
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
             
            >
              <div>
                <CardTitle className="text-lg font-semibold">
                  規格變體
                </CardTitle>
                <CardDescription>
                  商品的所有規格變體及其庫存狀況
                </CardDescription>
              </div>
              <Grid3X3
                className="h-4 w-4 text-muted-foreground"
               
              />
            </CardHeader>
            <CardContent>
              {product.variants && product.variants.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>規格</TableHead>
                        <TableHead>價格</TableHead>
                        <TableHead>庫存</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant: {
                        id: number;
                        sku?: string;
                        price?: number;
                        attribute_values?: { attribute?: { name?: string }; value?: string }[];
                        inventory?: { quantity?: number }[];
                      }) => {
                        const totalStock =
                          variant.inventory?.reduce(
                            (sum: number, inv: { quantity?: number }) =>
                              sum + (inv.quantity || 0),
                            0,
                          ) || 0;

                        return (
                          <TableRow key={variant.id}>
                            <TableCell>
                              <span
                                className="font-mono text-sm"
                               
                              >
                                {variant.sku}
                              </span>
                            </TableCell>
                            <TableCell>
                              {variant.attribute_values &&
                              variant.attribute_values.length > 0 ? (
                                <div
                                  className="flex flex-wrap gap-1"
                                 
                                >
                                  {variant.attribute_values.map(
                                    (attr: { attribute?: { name?: string }; value?: string }, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                       
                                      >
                                        <span
                                          className="text-muted-foreground"
                                         
                                        >
                                          {attr.attribute?.name}:
                                        </span>
                                        <span
                                          className="ml-1 font-medium"
                                         
                                        >
                                          {attr.value}
                                        </span>
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              ) : (
                                <span
                                  className="text-muted-foreground"
                                 
                                >
                                  無規格
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {variant.price !== undefined ? MoneyHelper.format(variant.price, 'NT$') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div
                                className="flex items-center gap-2"
                               
                              >
                                <Box
                                  className="h-4 w-4 text-muted-foreground"
                                 
                                />

                                <span
                                  className={
                                    totalStock === 0 ? "text-destructive" : ""
                                  }
                                 
                                >
                                  {totalStock} 件
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package
                    className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                   
                  />

                  <p
                    className="text-sm text-muted-foreground"
                   
                  >
                    暫無規格變體
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 各門市庫存 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
           
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
             
            >
              <div>
                <CardTitle className="text-lg font-semibold">
                  門市庫存分布
                </CardTitle>
                <CardDescription>
                  各門市的庫存數量統計
                </CardDescription>
              </div>
              <MapPin
                className="h-4 w-4 text-muted-foreground"
               
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  // 統計各門市的庫存
                  const storeInventory = new Map<
                    string,
                    { name: string; quantity: number }
                  >();

                  product.variants?.forEach((variant: {
                    inventory?: { store?: { name?: string }; quantity?: number }[];
                  }) => {
                    variant.inventory?.forEach((inv: { store?: { name?: string }; quantity?: number }) => {
                      const storeName = inv.store?.name || "未知門市";
                      const current = storeInventory.get(storeName) || {
                        name: storeName,
                        quantity: 0,
                      };
                      current.quantity += inv.quantity || 0;
                      storeInventory.set(storeName, current);
                    });
                  });

                  const stores = Array.from(storeInventory.values());

                  if (stores.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Store
                          className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                         
                        />

                        <p
                          className="text-sm text-muted-foreground"
                         
                        >
                          暫無庫存資訊
                        </p>
                      </div>
                    );
                  }

                  return stores.map((store) => (
                    <div
                      key={store.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                     
                    >
                      <div
                        className="flex items-center gap-2"
                       
                      >
                        <Store
                          className="h-4 w-4 text-muted-foreground"
                         
                        />

                        <span className="font-medium">
                          {store.name}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                       
                      >
                        <Badge
                          variant={
                            store.quantity === 0 ? "destructive" : "secondary"
                          }
                         
                        >
                          {store.quantity} 件
                        </Badge>
                        {store.quantity > 0 && (
                          <span
                            className="text-xs text-muted-foreground"
                           
                          >
                            ({Math.round((store.quantity / totalStock) * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
