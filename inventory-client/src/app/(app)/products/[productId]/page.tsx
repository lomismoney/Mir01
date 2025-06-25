"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/queries/useEntityQueries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  TrendingUp,
  Info,
  Grid3X3,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
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
export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const router = useRouter();
  const { productId } = use(params);

  // 獲取商品詳情
  const { data: product, isLoading } = useProduct(Number(productId));

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-oid="e_sts0z"
      >
        <div className="text-center space-y-4" data-oid="g4.f77u">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            data-oid="3p.4ng5"
          ></div>
          <p className="text-muted-foreground" data-oid="zlwg0pc">
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
        data-oid="qrial2z"
      >
        <div className="text-center space-y-4" data-oid="0-d57u2">
          <p className="text-muted-foreground" data-oid="nn1_-_k">
            找不到商品資訊
          </p>
          <Button onClick={() => router.push("/products")} data-oid="k4asvun">
            返回商品列表
          </Button>
        </div>
      </div>
    );
  }

  // 計算總庫存
  const totalStock =
    product.variants?.reduce((sum: number, variant: any) => {
      const variantStock =
        variant.inventory?.reduce(
          (vSum: number, inv: any) => vSum + (inv.quantity || 0),
          0,
        ) || 0;
      return sum + variantStock;
    }, 0) || 0;

  // 計算價格範圍
  const priceRange = product.price_range;

  return (
    <div className="flex flex-col gap-4 p-6" data-oid="sq29asq">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between" data-oid="i8013q1">
        <div className="flex items-center gap-4" data-oid=".mz93m2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/products")}
            data-oid="vd8u41q"
          >
            <ArrowLeft className="h-4 w-4" data-oid="e3f:zvi" />
          </Button>
          <h1 className="text-2xl font-bold" data-oid="7afwix6">
            商品詳情
          </h1>
        </div>
        <Button
          onClick={() => router.push(`/products/${productId}/edit`)}
          data-oid="-ig1mao"
        >
          <Edit className="h-4 w-4 mr-2" data-oid="cz9-hp0" />
          編輯商品
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3" data-oid="je2j-c-">
        {/* 左側：商品圖片和基本資訊 */}
        <div className="md:col-span-1 space-y-4" data-oid=".62ey7g">
          {/* 商品圖片 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid="c9ea:k4"
          >
            <CardContent className="p-6" data-oid="u:2zrjb">
              <div
                className="aspect-square relative bg-muted rounded-lg overflow-hidden"
                data-oid="tz-0ycw"
              >
                {product.image_urls?.original ? (
                  <Image
                    src={product.image_urls.original.replace(
                      "localhost",
                      "127.0.0.1",
                    )}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    data-oid="udswa39"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    data-oid="50s.y8l"
                  >
                    <ImageIcon
                      className="h-16 w-16 text-muted-foreground"
                      data-oid="n7bhs.w"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 基本資訊 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid="u6vjr7f"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="dyg7959"
            >
              <div data-oid="lhbh6e:">
                <CardTitle className="text-lg font-semibold" data-oid="fwn:ht2">
                  基本資訊
                </CardTitle>
                <CardDescription data-oid="v.sfncj">
                  商品基本資料
                </CardDescription>
              </div>
              <Info
                className="h-4 w-4 text-muted-foreground"
                data-oid="wofn3hd"
              />
            </CardHeader>
            <CardContent className="space-y-4" data-oid="hj2h.d2">
              <div data-oid="4iw9w08">
                <p
                  className="text-sm text-muted-foreground mb-1"
                  data-oid="7n1kiq7"
                >
                  商品名稱
                </p>
                <p className="font-medium" data-oid="af0u5wq">
                  {product.name}
                </p>
              </div>

              {product.description && (
                <div data-oid="0if42yd">
                  <p
                    className="text-sm text-muted-foreground mb-1"
                    data-oid="ytm5kby"
                  >
                    商品描述
                  </p>
                  <p className="text-sm" data-oid="tetk5ja">
                    {product.description}
                  </p>
                </div>
              )}

              {product.category && (
                <div data-oid="3ly6o7t">
                  <p
                    className="text-sm text-muted-foreground mb-1"
                    data-oid="p15flm0"
                  >
                    分類
                  </p>
                  <Badge variant="outline" data-oid="2kjl_m3">
                    <Tag className="h-3 w-3 mr-1" data-oid="2r-f7pr" />
                    {product.category.name}
                  </Badge>
                </div>
              )}

              <div data-oid="9e8ql8h">
                <p
                  className="text-sm text-muted-foreground mb-1"
                  data-oid="3sda0o5"
                >
                  建立時間
                </p>
                <div
                  className="flex items-center gap-2 text-sm"
                  data-oid="ofzosie"
                >
                  <Calendar
                    className="h-3 w-3 text-muted-foreground"
                    data-oid="0025ad4"
                  />

                  {new Date(product.created_at).toLocaleString("zh-TW")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側：詳細資訊 */}
        <div className="md:col-span-2 space-y-4" data-oid="05o-jyf">
          {/* 價格和庫存資訊 */}
          <div className="grid gap-4 md:grid-cols-2" data-oid="lq3fabt">
            {/* 價格卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
              data-oid="38ec6rt"
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid=":owiszc"
              >
                <CardDescription data-oid="tl7x:y5">價格範圍</CardDescription>
                <DollarSign
                  className="h-4 w-4 text-muted-foreground"
                  data-oid="w3btf-f"
                />
              </CardHeader>
              <CardContent data-oid="g7kas65">
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="aew4n55"
                >
                  {priceRange && priceRange.min !== undefined ? (
                    priceRange.min === priceRange.max ? (
                      formatPrice(priceRange.min)
                    ) : (
                      <>
                        {formatPrice(priceRange.min)} -{" "}
                        {formatPrice(priceRange.max)}
                      </>
                    )
                  ) : (
                    "N/A"
                  )}
                </CardTitle>
                <div
                  className="flex items-center gap-2 mt-2"
                  data-oid="dmrhlgw"
                >
                  <Badge
                    variant="outline"
                    className="text-xs"
                    data-oid=":3283:b"
                  >
                    <Package className="h-3 w-3 mr-1" data-oid="ff0zm9." />
                    {product.variants?.length || 0} 個規格
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 庫存卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
              data-oid="3vyg9x-"
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="c47beas"
              >
                <CardDescription data-oid="ysgl988">總庫存</CardDescription>
                <Box
                  className="h-4 w-4 text-muted-foreground"
                  data-oid="8x_0xvz"
                />
              </CardHeader>
              <CardContent data-oid="0tp0cd6">
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="ryp7nmm"
                >
                  {totalStock} 件
                </CardTitle>
                <div
                  className="flex items-center gap-2 mt-2"
                  data-oid="qaf5yq2"
                >
                  <Badge
                    variant={
                      totalStock === 0
                        ? "destructive"
                        : totalStock < 10
                          ? "secondary"
                          : "outline"
                    }
                    data-oid="f4zjnbn"
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
                  data-oid="ew6387h"
                >
                  所有門市總計
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 規格變體列表 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid=":d.87t7"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="rult3sf"
            >
              <div data-oid="1pzqbf2">
                <CardTitle className="text-lg font-semibold" data-oid="1fw7gvy">
                  規格變體
                </CardTitle>
                <CardDescription data-oid="y8adsr0">
                  商品的所有規格變體及其庫存狀況
                </CardDescription>
              </div>
              <Grid3X3
                className="h-4 w-4 text-muted-foreground"
                data-oid="-9sss-m"
              />
            </CardHeader>
            <CardContent data-oid="h07v:r3">
              {product.variants && product.variants.length > 0 ? (
                <div className="rounded-md border" data-oid="qazipor">
                  <Table data-oid="sc82p7n">
                    <TableHeader data-oid="1u:2o:j">
                      <TableRow data-oid="h-wlx4f">
                        <TableHead data-oid="65__15n">SKU</TableHead>
                        <TableHead data-oid="_0yd3o_">規格</TableHead>
                        <TableHead data-oid="k1x8jv4">價格</TableHead>
                        <TableHead data-oid="09.o8g8">庫存</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="4y9s9_g">
                      {product.variants.map((variant: any) => {
                        const totalStock =
                          variant.inventory?.reduce(
                            (sum: number, inv: any) =>
                              sum + (inv.quantity || 0),
                            0,
                          ) || 0;

                        return (
                          <TableRow key={variant.id} data-oid="xf3tov7">
                            <TableCell data-oid="mq-9cl5">
                              <span
                                className="font-mono text-sm"
                                data-oid="6dj-eph"
                              >
                                {variant.sku}
                              </span>
                            </TableCell>
                            <TableCell data-oid="tu5by5l">
                              {variant.attribute_values &&
                              variant.attribute_values.length > 0 ? (
                                <div
                                  className="flex flex-wrap gap-1"
                                  data-oid="i4jdjfz"
                                >
                                  {variant.attribute_values.map(
                                    (attr: any, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                        data-oid="4ax3ktk"
                                      >
                                        <span
                                          className="text-muted-foreground"
                                          data-oid="ik7ls27"
                                        >
                                          {attr.attribute?.name}:
                                        </span>
                                        <span
                                          className="ml-1 font-medium"
                                          data-oid="6e5d68r"
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
                                  data-oid="q_gog87"
                                >
                                  無規格
                                </span>
                              )}
                            </TableCell>
                            <TableCell data-oid="uodv2dt">
                              {formatPrice(variant.price)}
                            </TableCell>
                            <TableCell data-oid="1572gae">
                              <div
                                className="flex items-center gap-2"
                                data-oid="fp:0do0"
                              >
                                <Box
                                  className="h-4 w-4 text-muted-foreground"
                                  data-oid="57_8syx"
                                />

                                <span
                                  className={
                                    totalStock === 0 ? "text-destructive" : ""
                                  }
                                  data-oid="ggt1fzq"
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
                <div className="text-center py-8" data-oid="2o6d7s9">
                  <Package
                    className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                    data-oid="kck421k"
                  />

                  <p
                    className="text-sm text-muted-foreground"
                    data-oid="ecfzgc4"
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
            data-oid="kwhx02-"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="i9128gs"
            >
              <div data-oid="m.n2c1s">
                <CardTitle className="text-lg font-semibold" data-oid="0qm_zyb">
                  門市庫存分布
                </CardTitle>
                <CardDescription data-oid="ezboabl">
                  各門市的庫存數量統計
                </CardDescription>
              </div>
              <MapPin
                className="h-4 w-4 text-muted-foreground"
                data-oid="ao:hkx1"
              />
            </CardHeader>
            <CardContent data-oid="catn50f">
              <div className="space-y-3" data-oid="2:vo:b8">
                {(() => {
                  // 統計各門市的庫存
                  const storeInventory = new Map<
                    string,
                    { name: string; quantity: number }
                  >();

                  product.variants?.forEach((variant: any) => {
                    variant.inventory?.forEach((inv: any) => {
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
                      <div className="text-center py-8" data-oid="d7b7c4t">
                        <Store
                          className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                          data-oid="fxjtajp"
                        />

                        <p
                          className="text-sm text-muted-foreground"
                          data-oid="t.ff6c3"
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
                      data-oid="88ed85r"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="4.hw43j"
                      >
                        <Store
                          className="h-4 w-4 text-muted-foreground"
                          data-oid="-:t77:3"
                        />

                        <span className="font-medium" data-oid="d36atw2">
                          {store.name}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        data-oid="o6hqxoi"
                      >
                        <Badge
                          variant={
                            store.quantity === 0 ? "destructive" : "secondary"
                          }
                          data-oid="9lbfg6l"
                        >
                          {store.quantity} 件
                        </Badge>
                        {store.quantity > 0 && (
                          <span
                            className="text-xs text-muted-foreground"
                            data-oid="yz.6hdk"
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
