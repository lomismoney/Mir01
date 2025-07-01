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
      <div className="container mx-auto p-4 md:p-8" data-oid="q:f8zl:">
        <div className="space-y-6" data-oid="n::oau-">
          <div className="animate-pulse" data-oid="umo8f6o">
            <div
              className="h-8 bg-muted rounded w-1/3 mb-4"
              data-oid="2vjjflz"
            ></div>
            <div
              className="h-4 bg-muted rounded w-1/2 mb-8"
              data-oid="niyyyh5"
            ></div>
            <div className="space-y-4" data-oid="sva0l:w">
              <div className="h-32 bg-muted rounded" data-oid="2a1b9s:"></div>
              <div className="h-48 bg-muted rounded" data-oid="x1o9y1w"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="lr9.4e.">
        <div className="text-center py-12" data-oid="-mveyl6">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="wali41y"
          >
            找不到進貨單
          </h1>
          <p className="text-muted-foreground mb-6" data-oid=".by354y">
            進貨單不存在或已被刪除
          </p>
          <Button onClick={() => router.back()} data-oid="uypzk4y">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="e9b1ra-" />
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
    <div className="container mx-auto p-4 md:p-8" data-oid="46o9f-w">
      <div className="space-y-6" data-oid="c4bqy:l">
        {/* 頁面標題區 */}
        <div className="flex items-center justify-between" data-oid="1g1evug">
          <div className="flex items-center gap-4" data-oid="tj23wd8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              data-oid="qvk1ylg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="g3rjuc0" />
              返回
            </Button>
            <div data-oid="k9or6od">
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                data-oid="5m57naw"
              >
                <Package className="h-7 w-7 text-blue-600" data-oid="q6h3kq6" />
                進貨單詳情
              </h1>
              <p className="text-muted-foreground" data-oid=":os8gq5">
                查看進貨單的完整資訊和商品項目
              </p>
            </div>
          </div>

          {permissions.canModify && (
            <Button
              onClick={() => router.push(`/purchases/${purchaseId}/edit`)}
              data-oid="qod.bvt"
            >
              <Edit className="h-4 w-4 mr-2" data-oid="v18:0ab" />
              編輯
            </Button>
          )}
        </div>

        {/* 基本資訊卡片 */}
        <Card data-oid="xsek8iq">
          <CardHeader data-oid="3ziltg9">
            <div
              className="flex items-center justify-between"
              data-oid="p.mfk5n"
            >
              <div data-oid="wtw_ub:">
                <CardTitle
                  className="flex items-center gap-2"
                  data-oid="bgigtbt"
                >
                  <Hash className="h-5 w-5" data-oid="jq.o9o4" />
                  {purchaseData.order_number}
                </CardTitle>
                <CardDescription data-oid="cm2eimj">
                  進貨單編號和基本資訊
                </CardDescription>
              </div>
              <Badge
                className={
                  PURCHASE_STATUS_COLORS[purchaseData.status as PurchaseStatus]
                }
                data-oid="ty6yuat"
              >
                {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent data-oid="fj0ru9m">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              data-oid="nfg_hc1"
            >
              <div className="space-y-2" data-oid="hay8do_">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="it7ct9m"
                >
                  <Store className="h-4 w-4" data-oid=":nq-v2u" />
                  <span data-oid="oj0w6wi">門市</span>
                </div>
                <p className="font-medium" data-oid="f.745d2">
                  {purchaseData.store?.name || "未知門市"}
                </p>
              </div>

              <div className="space-y-2" data-oid=":cuee0m">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="w-a.guq"
                >
                  <Calendar className="h-4 w-4" data-oid="jdpmwcv" />
                  <span data-oid="datt748">進貨日期</span>
                </div>
                <p className="font-medium" data-oid="7yzqn8m">
                  {purchaseData.purchased_at
                    ? format(
                        new Date(purchaseData.purchased_at),
                        "yyyy年MM月dd日",
                        { locale: zhTW },
                      )
                    : "未設定"}
                </p>
              </div>

              <div className="space-y-2" data-oid="7sxz.94">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="5jic2gq"
                >
                  <Truck className="h-4 w-4" data-oid="gd.fhp0" />
                  <span data-oid="vc_dqk9">運費</span>
                </div>
                <p className="font-medium" data-oid="ibuku02">
                  NT$ {Number(purchaseData.shipping_cost || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2" data-oid="bioma3z">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="jsc3-a4"
                >
                  <DollarSign className="h-4 w-4" data-oid="meyd7z7" />
                  <span data-oid="t-bi:x_">總金額</span>
                </div>
                <p className="font-medium text-lg" data-oid="knlfs87">
                  NT$ {Number(purchaseData.total_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <Separator className="my-6" data-oid="2:n3ltw" />

            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              data-oid="l_ox6cr"
            >
              <div className="space-y-2" data-oid="34_r3bm">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="ekaios3"
                >
                  <Calendar className="h-4 w-4" data-oid="gt:u_q6" />
                  <span data-oid="fuanm:y">建立時間</span>
                </div>
                <p className="text-sm" data-oid="4rsx7ki">
                  {purchaseData.created_at
                    ? format(
                        new Date(purchaseData.created_at),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: zhTW },
                      )
                    : "未知"}
                </p>
              </div>

              <div className="space-y-2" data-oid="xo98ee2">
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  data-oid="k:g1kk8"
                >
                  <Calendar className="h-4 w-4" data-oid="rb9xs5c" />
                  <span data-oid="f3q1r6l">最後更新</span>
                </div>
                <p className="text-sm" data-oid="m2a7y.8">
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
        <Card data-oid="w73v64y">
          <CardHeader data-oid="a290y_z">
            <CardTitle className="flex items-center gap-2" data-oid="kt7r3mm">
              <Receipt className="h-5 w-5" data-oid="l.v5cyh" />
              商品項目
            </CardTitle>
            <CardDescription data-oid="qy0k73p">
              共 {purchaseData.items?.length || 0} 項商品
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="_nj-zpc">
            {purchaseData.items && purchaseData.items.length > 0 ? (
              <div className="space-y-4" data-oid=".sg3cj3">
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
                      data-oid="xav.sij"
                    >
                      <div
                        className="grid grid-cols-1 md:grid-cols-4 gap-4"
                        data-oid="k01z4_9"
                      >
                        <div className="md:col-span-2" data-oid="cj8:ms4">
                          <h4 className="font-medium" data-oid=".f5mhqm">
                            {item.product_name || "未知商品"}
                          </h4>
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="k1y.yj1"
                          >
                            SKU: {item.sku || "未知"}
                          </p>
                        </div>

                        <div data-oid="uw_::kc">
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="lx88-.."
                          >
                            數量
                          </p>
                          <p className="font-medium" data-oid="6u8qon8">
                            {quantity}
                          </p>
                        </div>

                        <div data-oid="cmpf5xj">
                          <p
                            className="text-sm text-muted-foreground"
                            data-oid="ztn_jn5"
                          >
                            進貨價
                          </p>
                          <p className="font-medium" data-oid="kzatmah">
                            NT$ {costPrice.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" data-oid="vb48hp8" />

                      <div
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm"
                        data-oid="bkozm5b"
                      >
                        <div data-oid="72hml-s">
                          <span
                            className="text-muted-foreground"
                            data-oid="wbzacjv"
                          >
                            商品小計：
                          </span>
                          <span className="font-medium ml-2" data-oid="cki6w6n">
                            NT$ {subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="0zk8:ao">
                          <span
                            className="text-muted-foreground"
                            data-oid="s5fdh_u"
                          >
                            攤銷運費：
                          </span>
                          <span className="font-medium ml-2" data-oid="av_n575">
                            NT$ {allocatedShippingCost.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="q6zp4vd">
                          <span
                            className="text-muted-foreground"
                            data-oid="cxf49jx"
                          >
                            總成本：
                          </span>
                          <span className="font-medium ml-2" data-oid="oc2zx35">
                            NT$ {totalCost.toLocaleString()}
                          </span>
                        </div>
                        <div data-oid="01md4kk">
                          <span
                            className="text-muted-foreground"
                            data-oid="85kg_f2"
                          >
                            單件平均成本：
                          </span>
                          <span
                            className="font-medium ml-2 text-blue-600"
                            data-oid="wgvy0q7"
                          >
                            NT${" "}
                            {averageCostPerUnit.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 總計 */}
                <div className="border-t pt-4" data-oid="2qg:q94">
                  <div className="flex justify-end" data-oid="wqzmmo8">
                    <div className="text-right space-y-2" data-oid="visujcv">
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="mc1t9_r"
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
                        data-oid="6_6kdgn"
                      >
                        運費: NT${" "}
                        {Number(
                          purchaseData.shipping_cost || 0,
                        ).toLocaleString()}
                      </div>
                      <div className="text-lg font-semibold" data-oid="yh8g-2t">
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
                data-oid="hhjkyxy"
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
