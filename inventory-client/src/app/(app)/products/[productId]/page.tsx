"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useProductDetail } from "@/hooks/queries/useEntityQueries";
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
  const { data: product, isLoading } = useProductDetail(Number(productId));

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        data-oid="_vo_hba"
      >
        <div className="text-center space-y-4" data-oid="jmvi9e.">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
            data-oid="m4bt62r"
          ></div>
          <p className="text-muted-foreground" data-oid="i1j_q9-">
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
        data-oid="phqq_zl"
      >
        <div className="text-center space-y-4" data-oid="qhj:a29">
          <p className="text-muted-foreground" data-oid="wbmco8_">
            找不到商品資訊
          </p>
          <Button onClick={() => router.push("/products")} data-oid="314u0i8">
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
    <div className="flex flex-col gap-4 p-6" data-oid="h4udatg">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between" data-oid=".36atff">
        <div className="flex items-center gap-4" data-oid="qxh_nj9">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/products")}
            data-oid="v11-54:"
          >
            <ArrowLeft className="h-4 w-4" data-oid="i5iu:b4" />
          </Button>
          <h1 className="text-2xl font-bold" data-oid="hhj.60t">
            商品詳情
          </h1>
        </div>
        <Button
          onClick={() => router.push(`/products/${productId}/edit`)}
          data-oid="p.3vwz7"
        >
          <Edit className="h-4 w-4 mr-2" data-oid="3jh4o9m" />
          編輯商品
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3" data-oid="issmgs_">
        {/* 左側：商品圖片和基本資訊 */}
        <div className="md:col-span-1 space-y-4" data-oid="ny0t_pv">
          {/* 商品圖片 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid="vtjt0hr"
          >
            <CardContent className="p-6" data-oid="njj24z9">
              <div
                className="aspect-square relative bg-muted rounded-lg overflow-hidden"
                data-oid="xu0v_f2"
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
                    data-oid="isk653d"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    data-oid="0fcb.f4"
                  >
                    <ImageIcon
                      className="h-16 w-16 text-muted-foreground"
                      data-oid="x5qtohw"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 基本資訊 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid="egqh6c4"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="m6f17ov"
            >
              <div data-oid="0h2_gqo">
                <CardTitle className="text-lg font-semibold" data-oid="x1ljtrl">
                  基本資訊
                </CardTitle>
                <CardDescription data-oid="_cmtztn">
                  商品基本資料
                </CardDescription>
              </div>
              <Info
                className="h-4 w-4 text-muted-foreground"
                data-oid="0cgxcz."
              />
            </CardHeader>
            <CardContent className="space-y-4" data-oid="ogkhncm">
              <div data-oid="l49-.hi">
                <p
                  className="text-sm text-muted-foreground mb-1"
                  data-oid="trk-4or"
                >
                  商品名稱
                </p>
                <p className="font-medium" data-oid="b50gzct">
                  {product.name}
                </p>
              </div>

              {product.description && (
                <div data-oid="owpdlj_">
                  <p
                    className="text-sm text-muted-foreground mb-1"
                    data-oid="5k0-2u8"
                  >
                    商品描述
                  </p>
                  <p className="text-sm" data-oid="heig0hf">
                    {product.description}
                  </p>
                </div>
              )}

              {product.category && (
                <div data-oid="2y4kzlc">
                  <p
                    className="text-sm text-muted-foreground mb-1"
                    data-oid=".6gk_rt"
                  >
                    分類
                  </p>
                  <Badge variant="outline" data-oid="b:iduoj">
                    <Tag className="h-3 w-3 mr-1" data-oid="ybijbi." />
                    {product.category.name}
                  </Badge>
                </div>
              )}

              <div data-oid="cy61fi_">
                <p
                  className="text-sm text-muted-foreground mb-1"
                  data-oid="m92x8or"
                >
                  建立時間
                </p>
                <div
                  className="flex items-center gap-2 text-sm"
                  data-oid="hvie3e3"
                >
                  <Calendar
                    className="h-3 w-3 text-muted-foreground"
                    data-oid="arqciuk"
                  />

                  {new Date(product.created_at).toLocaleString("zh-TW")}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側：詳細資訊 */}
        <div className="md:col-span-2 space-y-4" data-oid="y:dbnxv">
          {/* 價格和庫存資訊 */}
          <div className="grid gap-4 md:grid-cols-2" data-oid="gkgnb5c">
            {/* 價格卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
              data-oid="lmzh411"
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="ko-o6w6"
              >
                <CardDescription data-oid="8sj7wm4">價格範圍</CardDescription>
                <DollarSign
                  className="h-4 w-4 text-muted-foreground"
                  data-oid="1l3wveh"
                />
              </CardHeader>
              <CardContent data-oid="nyrw4nk">
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="xpp2.fd"
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
                  data-oid="l2yxwoa"
                >
                  <Badge
                    variant="outline"
                    className="text-xs"
                    data-oid="l60sf8k"
                  >
                    <Package className="h-3 w-3 mr-1" data-oid="drrr8s." />
                    {product.variants?.length || 0} 個規格
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 庫存卡片 */}
            <Card
              className="bg-gradient-to-t from-primary/5 to-card shadow-xs @container/card"
              data-oid="y0y6uqi"
            >
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 pb-2"
                data-oid="_r4kbgu"
              >
                <CardDescription data-oid="yv5lee8">總庫存</CardDescription>
                <Box
                  className="h-4 w-4 text-muted-foreground"
                  data-oid="ty-al.:"
                />
              </CardHeader>
              <CardContent data-oid="l-3on.7">
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="u2z3kz-"
                >
                  {totalStock} 件
                </CardTitle>
                <div
                  className="flex items-center gap-2 mt-2"
                  data-oid="c_1tu1a"
                >
                  <Badge
                    variant={
                      totalStock === 0
                        ? "destructive"
                        : totalStock < 10
                          ? "secondary"
                          : "outline"
                    }
                    data-oid="9_h8e72"
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
                  data-oid="c2z8wrj"
                >
                  所有門市總計
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 規格變體列表 */}
          <Card
            className="bg-gradient-to-t from-primary/5 to-card shadow-xs"
            data-oid="v-u:v53"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="h:jwq7g"
            >
              <div data-oid="0dkgin4">
                <CardTitle className="text-lg font-semibold" data-oid="i5y_f20">
                  規格變體
                </CardTitle>
                <CardDescription data-oid="i2k1czo">
                  商品的所有規格變體及其庫存狀況
                </CardDescription>
              </div>
              <Grid3X3
                className="h-4 w-4 text-muted-foreground"
                data-oid="il6chji"
              />
            </CardHeader>
            <CardContent data-oid="nx3us-c">
              {product.variants && product.variants.length > 0 ? (
                <div className="rounded-md border" data-oid="wkc16rg">
                  <Table data-oid="av9mjai">
                    <TableHeader data-oid="cwtw3sv">
                      <TableRow data-oid="2ew_55l">
                        <TableHead data-oid="aea0jnd">SKU</TableHead>
                        <TableHead data-oid="gjiss_k">規格</TableHead>
                        <TableHead data-oid="pl5a96w">價格</TableHead>
                        <TableHead data-oid="net_qmc">庫存</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="xry6qn_">
                      {product.variants.map((variant: any) => {
                        const totalStock =
                          variant.inventory?.reduce(
                            (sum: number, inv: any) =>
                              sum + (inv.quantity || 0),
                            0,
                          ) || 0;

                        return (
                          <TableRow key={variant.id} data-oid="3rj9e1s">
                            <TableCell data-oid="d2dw3hc">
                              <span
                                className="font-mono text-sm"
                                data-oid="um1tiyn"
                              >
                                {variant.sku}
                              </span>
                            </TableCell>
                            <TableCell data-oid="d_p4jhq">
                              {variant.attribute_values &&
                              variant.attribute_values.length > 0 ? (
                                <div
                                  className="flex flex-wrap gap-1"
                                  data-oid="bhsk_2y"
                                >
                                  {variant.attribute_values.map(
                                    (attr: any, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                        data-oid="cw0i_nz"
                                      >
                                        <span
                                          className="text-muted-foreground"
                                          data-oid="uxhtt.v"
                                        >
                                          {attr.attribute?.name}:
                                        </span>
                                        <span
                                          className="ml-1 font-medium"
                                          data-oid="d:35k6o"
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
                                  data-oid="ov9agle"
                                >
                                  無規格
                                </span>
                              )}
                            </TableCell>
                            <TableCell data-oid="2_8o5_d">
                              {formatPrice(variant.price)}
                            </TableCell>
                            <TableCell data-oid="-jyghph">
                              <div
                                className="flex items-center gap-2"
                                data-oid="70v-2mj"
                              >
                                <Box
                                  className="h-4 w-4 text-muted-foreground"
                                  data-oid="7e95ali"
                                />

                                <span
                                  className={
                                    totalStock === 0 ? "text-destructive" : ""
                                  }
                                  data-oid="sbfh1ka"
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
                <div className="text-center py-8" data-oid="u73kt6w">
                  <Package
                    className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                    data-oid="ekyh7dr"
                  />

                  <p
                    className="text-sm text-muted-foreground"
                    data-oid="mg_rnx3"
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
            data-oid="8vm2u9u"
          >
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0"
              data-oid="7mkxlhj"
            >
              <div data-oid="h2m4:qs">
                <CardTitle className="text-lg font-semibold" data-oid="bakgmr5">
                  門市庫存分布
                </CardTitle>
                <CardDescription data-oid="0qwm7-h">
                  各門市的庫存數量統計
                </CardDescription>
              </div>
              <MapPin
                className="h-4 w-4 text-muted-foreground"
                data-oid="98.06qg"
              />
            </CardHeader>
            <CardContent data-oid="5ch5g2g">
              <div className="space-y-3" data-oid="8cczq-y">
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
                      <div className="text-center py-8" data-oid=":cefitl">
                        <Store
                          className="h-8 w-8 text-muted-foreground mx-auto mb-2"
                          data-oid="7dxt:h6"
                        />

                        <p
                          className="text-sm text-muted-foreground"
                          data-oid="pxc71kh"
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
                      data-oid="e7qjloq"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="h9e:khj"
                      >
                        <Store
                          className="h-4 w-4 text-muted-foreground"
                          data-oid="765:_ow"
                        />

                        <span className="font-medium" data-oid="e22f.:_">
                          {store.name}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        data-oid=".522i:l"
                      >
                        <Badge
                          variant={
                            store.quantity === 0 ? "destructive" : "secondary"
                          }
                          data-oid="u_5zgvd"
                        >
                          {store.quantity} 件
                        </Badge>
                        {store.quantity > 0 && (
                          <span
                            className="text-xs text-muted-foreground"
                            data-oid="h48g91r"
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
