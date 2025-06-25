"use client";

import { useParams, useRouter } from "next/navigation";
import { usePurchase } from "@/hooks/queries/useEntityQueries";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  type PurchaseStatus,
} from "@/types/purchase";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Package,
  Store,
  Calendar,
  User,
  Truck,
  Receipt,
  Hash,
  DollarSign,
} from "lucide-react";

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;

  const { data: purchase, isLoading, error } = usePurchase(purchaseId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="8f-qkkq">
        <div className="space-y-6" data-oid="eo1scpu">
          <div className="animate-pulse" data-oid="br-qlvn">
            <div
              className="h-8 bg-muted rounded w-1/3 mb-4"
              data-oid="f3qv25u"
            ></div>
            <div
              className="h-4 bg-muted rounded w-1/2 mb-8"
              data-oid="gma79yj"
            ></div>
            <div className="space-y-4" data-oid="9ffjc_5">
              <div className="h-32 bg-muted rounded" data-oid="wn:25hh"></div>
              <div className="h-48 bg-muted rounded" data-oid="qk-l8e6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="cqq1o5j">
        <div className="text-center py-12" data-oid="hx1k_hi">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="a36961x"
          >
            找不到進貨單
          </h1>
          <p className="text-muted-foreground mb-6" data-oid="7:lf:3.">
            進貨單不存在或已被刪除
          </p>
          <Button onClick={() => router.back()} data-oid="w_-s7gr">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="t00f547" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  const purchaseData = purchase as any;
  const permissions = getPurchasePermissions(
    purchaseData.status as PurchaseStatus,
  );

  return (
    <div className="container mx-auto p-4 md:p-8" data-oid="54x1j3f">
      <div className="space-y-6" data-oid="a.e6muf">
        {/* 頁面標題區 */}
        <div className="flex items-center justify-between" data-oid="5la4hse">
          <div className="flex items-center gap-4" data-oid="0nal5r_">
            <Button
              variant="outline"
              onClick={() => router.back()}
              data-oid="xt_1pvm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="_ip5j2r" />
              返回
            </Button>
            <div data-oid="y_jyin8">
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                data-oid="7xv4yl7"
              >
                <Package className="h-7 w-7 text-blue-600" data-oid="r.v00zp" />
                進貨單詳情
              </h1>
              <p className="text-muted-foreground" data-oid="qjmgwmw">
                查看進貨單的完整資訊和商品項目
              </p>
            </div>
          </div>

          {permissions.canModify && (
            <Button
              onClick={() => router.push(`/purchases/${purchaseId}/edit`)}
              data-oid="7909p::"
            >
              <Edit className="h-4 w-4 mr-2" data-oid="sk-pe68" />
              編輯
            </Button>
          )}
        </div>

        {/* 基本資訊卡片 */}
        <Card data-oid="62pa:w-">
          <CardHeader data-oid="8:l9at:">
            <div
              className="flex items-center justify-between"
              data-oid="xhz-5z."
            >
              <div data-oid="cej6w8h">
                <CardTitle
                  className="flex items-center gap-2"
                  data-oid="a7.jumm"
                >
                  <Hash className="h-5 w-5" data-oid="rrknml8" />
                  {purchaseData.order_number}
                </CardTitle>
                <CardDescription data-oid="60c4h2j">
                  進貨單編號和基本資訊
                </CardDescription>
              </div>
              <Badge
                className={
                  PURCHASE_STATUS_COLORS[purchaseData.status as PurchaseStatus]
                }
                data-oid="j9_zd_z"
              >
                {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent data-oid="_vntr-r">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              data-oid="g.1kkla"
            >
              <div className="space-y-2" data-oid="w2hseco">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="hewzo:x"
                >
                  <Store className="h-4 w-4" data-oid="td5nrzh" />
                  <span data-oid="0fly5xr">門市</span>
                </div>
                <p className="font-medium" data-oid="ai1l1:h">
                  {purchaseData.store?.name || "未知門市"}
                </p>
              </div>

              <div className="space-y-2" data-oid="81cyj97">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="ld9daoj"
                >
                  <Calendar className="h-4 w-4" data-oid="mbub:3d" />
                  <span data-oid=":iuj8j1">進貨日期</span>
                </div>
                <p className="font-medium" data-oid="3fkur5p">
                  {purchaseData.purchased_at
                    ? format(
                        new Date(purchaseData.purchased_at),
                        "yyyy年MM月dd日",
                        { locale: zhTW },
                      )
                    : "未設定"}
                </p>
              </div>

              <div className="space-y-2" data-oid="fnvldhk">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="6ejp73."
                >
                  <Truck className="h-4 w-4" data-oid="wn:hwrt" />
                  <span data-oid="246ixi4">運費</span>
                </div>
                <p className="font-medium" data-oid="-1psa2t">
                  NT$ {Number(purchaseData.shipping_cost || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2" data-oid="k0cl9zt">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="x7e-1nk"
                >
                  <DollarSign className="h-4 w-4" data-oid="a:tb.c6" />
                  <span data-oid="fccvj41">總金額</span>
                </div>
                <p className="font-medium text-lg" data-oid="d3.ns8n">
                  NT$ {Number(purchaseData.total_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <Separator className="my-6" data-oid="suih4x6" />

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              data-oid="a_0cldy"
            >
              <div className="space-y-2" data-oid="c.oicdk">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="3rk:ckv"
                >
                  <Calendar className="h-4 w-4" data-oid="-y28y85" />
                  <span data-oid="97z5e4w">建立時間</span>
                </div>
                <p className="text-sm" data-oid="l0wfid8">
                  {purchaseData.created_at
                    ? format(
                        new Date(purchaseData.created_at),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: zhTW },
                      )
                    : "未知"}
                </p>
              </div>

              <div className="space-y-2" data-oid="t2rrjjo">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="bv.gjhj"
                >
                  <Calendar className="h-4 w-4" data-oid="k7qk4mh" />
                  <span data-oid="aeg5n4t">最後更新</span>
                </div>
                <p className="text-sm" data-oid="rm1cdhw">
                  {purchaseData.updated_at
                    ? format(
                        new Date(purchaseData.updated_at),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: zhTW },
                      )
                    : "未知"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品項目列表 */}
        <Card data-oid="p8pq9pz">
          <CardHeader data-oid="f3mmgp3">
            <CardTitle className="flex items-center gap-2" data-oid="mhtnab-">
              <Receipt className="h-5 w-5" data-oid="xatkkup" />
              商品項目
            </CardTitle>
            <CardDescription data-oid="t0.o-53">
              共 {purchaseData.items?.length || 0} 項商品
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="2ocgpdq">
            {purchaseData.items && purchaseData.items.length > 0 ? (
              <div className="space-y-4" data-oid="70dok-b">
                {purchaseData.items.map((item: any, index: number) => {
                  const quantity = item.quantity || 0;
                  const costPrice = Number(item.cost_price || 0);
                  const allocatedShippingCost = Number(
                    item.allocated_shipping_cost || 0,
                  );
                  const subtotal = quantity * costPrice;
                  const totalCost = subtotal + allocatedShippingCost;
                  const averageCostPerUnit =
                    quantity > 0 ? totalCost / quantity : 0;

                  return (
                    <div
                      key={item.id || index}
                      className="border rounded-lg p-4"
                      data-oid="u-h1ljd"
                    >
                      <div
                        className="grid grid-cols-1 md:grid-cols-4 gap-4"
                        data-oid="-4e-2a4"
                      >
                        <div className="md:col-span-2" data-oid="wy94a5.">
                          <h4 className="font-medium" data-oid="f7dq0zp">
                            {item.product_name || "未知商品"}
                          </h4>
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="uozmu5i"
                          >
                            SKU: {item.sku || "未知"}
                          </p>
                        </div>

                        <div data-oid="quzia9m">
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="6so.uj5"
                          >
                            數量
                          </p>
                          <p className="font-medium" data-oid="qzk5onk">
                            {quantity}
                          </p>
                        </div>

                        <div data-oid="xpw5t8t">
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="mu24ya7"
                          >
                            進貨價
                          </p>
                          <p className="font-medium" data-oid="kc0qm.:">
                            NT$ {costPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" data-oid="yx-6n4f" />

                      <div
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
                        data-oid="snzg2n:"
                      >
                        <div data-oid="5onb2v.">
                          <span
                            className="text-muted-foreground"
                            data-oid="qhry2xk"
                          >
                            商品小計：
                          </span>
                          <span className="font-medium ml-2" data-oid="rz7sili">
                            NT$ {subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="qnuatst">
                          <span
                            className="text-muted-foreground"
                            data-oid="5::z8u_"
                          >
                            攤銷運費：
                          </span>
                          <span className="font-medium ml-2" data-oid="1n81f7i">
                            NT$ {allocatedShippingCost.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="pl64rlr">
                          <span
                            className="text-muted-foreground"
                            data-oid="qqkf1e5"
                          >
                            總成本：
                          </span>
                          <span className="font-medium ml-2" data-oid="mfs33en">
                            NT$ {totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="f:jxper">
                          <span
                            className="text-muted-foreground"
                            data-oid="a0kq94:"
                          >
                            單件平均成本：
                          </span>
                          <span
                            className="font-medium ml-2 text-blue-600"
                            data-oid="0rzvomv"
                          >
                            NT${" "}
                            {averageCostPerUnit.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 總計 */}
                <div className="border-t pt-4" data-oid="e_m592_">
                  <div className="flex justify-end" data-oid="bdx_r-p">
                    <div className="text-right space-y-2" data-oid="9grjuof">
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="s:4ku66"
                      >
                        商品總計: NT${" "}
                        {purchaseData.items
                          .reduce(
                            (sum: number, item: any) =>
                              sum +
                              (item.quantity || 0) * (item.cost_price || 0),
                            0,
                          )
                          .toLocaleString()}
                      </div>
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="aw9mbki"
                      >
                        運費: NT${" "}
                        {Number(
                          purchaseData.shipping_cost || 0,
                        ).toLocaleString()}
                      </div>
                      <div className="text-lg font-semibold" data-oid="kw9u7ld">
                        總金額: NT${" "}
                        {Number(
                          purchaseData.total_amount || 0,
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="text-center py-8 text-muted-foreground"
                data-oid="m5f2fk9"
              >
                此進貨單沒有商品項目
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
