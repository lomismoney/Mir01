"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  usePurchase,
  useUpdatePurchase,
  useStores,
} from "@/hooks/queries/useEntityQueries";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus,
  PURCHASE_STATUS,
} from "@/types/purchase";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save, Package, Trash2, Plus, Loader2 } from "lucide-react";
import { ProductSelector } from "@/components/inventory/ProductSelector";

interface PurchaseEditFormData {
  store_id: string;
  order_number: string;
  purchased_at: string;
  shipping_cost: string;
  status: string;
  items: {
    id?: number;
    product_variant_id: number;
    quantity: string;
    cost_price: string;
  }[];
}

export default function PurchaseEditPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = params.id as string;

  const { data: purchase, isLoading, error } = usePurchase(purchaseId);
  const { data: storesData } = useStores();
  const updatePurchaseMutation = useUpdatePurchase();

  const form = useForm<PurchaseEditFormData>({
    defaultValues: {
      store_id: "",
      order_number: "",
      purchased_at: "",
      shipping_cost: "0",
      status: PURCHASE_STATUS.PENDING,
      items: [],
    },
  });

  const { fields, append, remove } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 當進貨單數據載入後，更新表單預設值
  useEffect(() => {
    if (purchase) {
      const purchaseData = purchase as any;
      form.reset({
        store_id: purchaseData.store_id?.toString() || "",
        order_number: purchaseData.order_number || "",
        purchased_at: purchaseData.purchased_at
          ? new Date(purchaseData.purchased_at).toISOString().split("T")[0]
          : "",
        shipping_cost: purchaseData.shipping_cost?.toString() || "0",
        status: purchaseData.status || PURCHASE_STATUS.PENDING,
        items:
          purchaseData.items?.map((item: any) => ({
            id: item.id,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity?.toString() || "0",
            cost_price: item.cost_price?.toString() || "0",
          })) || [],
      });
    }
  }, [purchase, form]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="8k-4qfc">
        <div className="space-y-6" data-oid="q_26ive">
          <div className="animate-pulse" data-oid="tgunsaa">
            <div
              className="h-8 bg-muted rounded w-1/3 mb-4"
              data-oid="zoie_0:"
            ></div>
            <div
              className="h-4 bg-muted rounded w-1/2 mb-8"
              data-oid="yr2l5j1"
            ></div>
            <div className="space-y-4" data-oid="kpv4npi">
              <div className="h-32 bg-muted rounded" data-oid="279jhbx"></div>
              <div className="h-48 bg-muted rounded" data-oid="mq.-hcl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="qm3mwc4">
        <div className="text-center py-12" data-oid="hk4lyxb">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="v6j_:n:"
          >
            找不到進貨單
          </h1>
          <p className="text-muted-foreground mb-6" data-oid="0285rvs">
            進貨單不存在或已被刪除
          </p>
          <Button onClick={() => router.back()} data-oid=":7uaqll">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="ojxbcmq" />
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
  const validStatusTransitions = getValidStatusTransitions(
    purchaseData.status as PurchaseStatus,
  );

  if (!permissions.canModify) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="7_1xcso">
        <div className="text-center py-12" data-oid="6ve2ra4">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="g-h95h-"
          >
            無法編輯
          </h1>
          <p className="text-muted-foreground mb-6" data-oid=".he34.c">
            進貨單狀態為「
            {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
            」，無法編輯
          </p>
          <Button onClick={() => router.back()} data-oid="uxluczx">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="zebamjc" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = (data: PurchaseEditFormData) => {
    // 驗證必填欄位
    if (!data.store_id) {
      toast.error("請選擇門市");
      return;
    }

    if (data.items.some((item) => !item.product_variant_id)) {
      toast.error("請為所有項目選擇商品");
      return;
    }

    // 轉換資料格式
    const updateData = {
      store_id: parseInt(data.store_id),
      order_number: data.order_number,
      purchased_at: data.purchased_at
        ? `${data.purchased_at}T10:00:00+08:00`
        : undefined,
      shipping_cost: parseFloat(data.shipping_cost) || 0,
      status: data.status,
      items: data.items.map((item) => ({
        product_variant_id: item.product_variant_id,
        quantity: parseInt(item.quantity),
        cost_price: parseFloat(item.cost_price),
      })),
    };

    updatePurchaseMutation.mutate(
      { id: purchaseId, data: updateData },
      {
        onSuccess: () => {
          toast.success("進貨單已更新");
          router.push(`/purchases/${purchaseId}`);
        },
        onError: (error) => {
          toast.error(`更新進貨單失敗: ${error.message}`);
        },
      },
    );
  };

  const addItem = () => {
    append({
      product_variant_id: 0,
      quantity: "",
      cost_price: "",
    });
  };

  const calculateTotal = () => {
    const shippingCost = parseFloat(form.watch("shipping_cost")) || 0;
    const itemsTotal = form.watch("items").reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const costPrice = parseFloat(item.cost_price) || 0;
      return total + quantity * costPrice;
    }, 0);
    return itemsTotal + shippingCost;
  };

  return (
    <div className="container mx-auto p-4 md:p-8" data-oid="r8::-r0">
      <div className="space-y-6" data-oid="a9ikujh">
        {/* 頁面標題區 */}
        <div className="flex items-center gap-4" data-oid="wsqh43h">
          <Button
            variant="outline"
            onClick={() => router.back()}
            data-oid="71ogeg4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="y772gee" />
            返回
          </Button>
          <div data-oid="h2v4um6">
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              data-oid="k.jr0b9"
            >
              <Package className="h-7 w-7 text-blue-600" data-oid="tk1_:am" />
              編輯進貨單
            </h1>
            <div className="flex items-center gap-2 mt-1" data-oid="xlvut5a">
              <p className="text-muted-foreground" data-oid="w8_kmer">
                {purchaseData.order_number}
              </p>
              <Badge
                className={
                  PURCHASE_STATUS_COLORS[purchaseData.status as PurchaseStatus]
                }
                data-oid="lyj5byv"
              >
                {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
              </Badge>
            </div>
          </div>
        </div>

        <Form {...form} data-oid="l05x9s5">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            data-oid="p6o0w_2"
          >
            {/* 基本資訊 */}
            <Card data-oid="ax:7hlw">
              <CardHeader data-oid="6cioomb">
                <CardTitle data-oid="65nyyp5">基本資訊</CardTitle>
                <CardDescription data-oid="ieir:s.">
                  修改進貨單的基本資訊和狀態
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="joq1fxe">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-oid="w6h.5pg"
                >
                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem data-oid="is0-:uu">
                        <FormLabel data-oid="moz-k9n">門市 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          data-oid="u8fut9b"
                        >
                          <FormControl data-oid="fqttc5k">
                            <SelectTrigger data-oid="ozsm-ci">
                              <SelectValue
                                placeholder="選擇門市"
                                data-oid=":wwlhlc"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent data-oid="s84ogjt">
                            {(storesData as any)?.data?.map((store: any) => (
                              <SelectItem
                                key={store.id}
                                value={store.id?.toString() || ""}
                                data-oid="m8r77e."
                              >
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage data-oid="l7y8ntz" />
                      </FormItem>
                    )}
                    data-oid="ygdqqcw"
                  />

                  <FormField
                    control={form.control}
                    name="order_number"
                    render={({ field }) => (
                      <FormItem data-oid="8sgrxxw">
                        <FormLabel data-oid="_76pb4_">進貨單號 *</FormLabel>
                        <FormControl data-oid="yq:pyba">
                          <Input
                            {...field}
                            placeholder="例：PO-20240101-001"
                            data-oid="54f93tv"
                          />
                        </FormControl>
                        <FormMessage data-oid="c9re205" />
                      </FormItem>
                    )}
                    data-oid="nv4li4-"
                  />

                  <FormField
                    control={form.control}
                    name="purchased_at"
                    render={({ field }) => (
                      <FormItem data-oid="t3j6_6s">
                        <FormLabel data-oid=":re_wbb">進貨日期</FormLabel>
                        <FormControl data-oid="dkx7ssn">
                          <Input {...field} type="date" data-oid="4mu_j02" />
                        </FormControl>
                        <FormMessage data-oid="ta_jhyj" />
                      </FormItem>
                    )}
                    data-oid="-k1-nw-"
                  />

                  <FormField
                    control={form.control}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem data-oid="9y1w6fd">
                        <FormLabel data-oid="pxlzrxo">運費</FormLabel>
                        <FormControl data-oid="pyt-h5f">
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            data-oid="flx1jic"
                          />
                        </FormControl>
                        <FormMessage data-oid="tkwyhg:" />
                      </FormItem>
                    )}
                    data-oid="q2:5z2h"
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem data-oid="w3:2zye">
                        <FormLabel data-oid="t8mwe81">狀態</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          data-oid="suf4mj0"
                        >
                          <FormControl data-oid="qc4g5tb">
                            <SelectTrigger data-oid="k75mwj.">
                              <SelectValue
                                placeholder="選擇狀態"
                                data-oid="8k05pbv"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent data-oid=".od4wwc">
                            {/* 顯示當前狀態 */}
                            <SelectItem
                              value={purchaseData.status}
                              data-oid="kswdbr6"
                            >
                              {
                                PURCHASE_STATUS_LABELS[
                                  purchaseData.status as PurchaseStatus
                                ]
                              }{" "}
                              (目前)
                            </SelectItem>
                            {/* 顯示可轉換的狀態 */}
                            {validStatusTransitions.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                data-oid="d5cp2ai"
                              >
                                {PURCHASE_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage data-oid="0zuiedu" />
                      </FormItem>
                    )}
                    data-oid="i4_umqo"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 商品項目 */}
            <Card data-oid="az_gc:.">
              <CardHeader data-oid="1bcmgt4">
                <div
                  className="flex items-center justify-between"
                  data-oid="oly0kd8"
                >
                  <CardTitle data-oid="mnlwjuz">商品項目</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    data-oid="expf.tu"
                  >
                    <Plus className="h-4 w-4 mr-2" data-oid="x0ep9cg" />
                    新增商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="fbtl993">
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="border rounded-lg p-4 space-y-4"
                    data-oid="flsnv0m"
                  >
                    <div
                      className="flex items-center justify-between"
                      data-oid="ht-ljza"
                    >
                      <h4 className="font-medium" data-oid="6f83e0b">
                        商品 {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          data-oid="kre1:08"
                        >
                          <Trash2 className="h-4 w-4" data-oid="akglvb8" />
                        </Button>
                      )}
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      data-oid="gdte9ay"
                    >
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_variant_id`}
                        render={({ field }) => (
                          <FormItem data-oid="3pext77">
                            <FormLabel data-oid="dixc_ij">商品 *</FormLabel>
                            <FormControl data-oid="khjnf9o">
                              <ProductSelector
                                value={field.value}
                                onValueChange={(variantId, variant) => {
                                  field.onChange(variantId);
                                  if (variant?.price) {
                                    form.setValue(
                                      `items.${index}.cost_price`,
                                      variant.price.toString(),
                                    );
                                  }
                                }}
                                placeholder="搜尋並選擇商品規格"
                                disabled={updatePurchaseMutation.isPending}
                                showCurrentStock={false}
                                data-oid="8r8zp.k"
                              />
                            </FormControl>
                            <FormMessage data-oid="fmw_4ke" />
                          </FormItem>
                        )}
                        data-oid="1:7ljs9"
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem data-oid="_5uy9mf">
                            <FormLabel data-oid="nj_fyhd">數量 *</FormLabel>
                            <FormControl data-oid=".-ds87b">
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="0"
                                data-oid="6va3.04"
                              />
                            </FormControl>
                            <FormMessage data-oid="q.ogj7d" />
                          </FormItem>
                        )}
                        data-oid="y_ucwi3"
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.cost_price`}
                        render={({ field }) => (
                          <FormItem data-oid="0ffu_x1">
                            <FormLabel data-oid=":xc-i4b">進貨價 *</FormLabel>
                            <FormControl data-oid="olzdcyp">
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                data-oid="bk416uk"
                              />
                            </FormControl>
                            <FormMessage data-oid="kl:g1ea" />
                          </FormItem>
                        )}
                        data-oid="bc9ec2e"
                      />
                    </div>
                  </div>
                ))}

                {/* 總計顯示 */}
                <div className="border-t pt-4" data-oid="pbj77w6">
                  <div className="flex justify-end" data-oid=":o_9ehi">
                    <div className="text-right" data-oid="fj8pti5">
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="g0w11rr"
                      >
                        預估總金額
                      </div>
                      <div className="text-lg font-semibold" data-oid="b_4nl1r">
                        NT${" "}
                        {calculateTotal().toLocaleString("zh-TW", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex justify-end space-x-2" data-oid="of61akf">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                data-oid=":5qgzz0"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updatePurchaseMutation.isPending}
                data-oid="hib7f-."
              >
                {updatePurchaseMutation.isPending && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="okw:22a"
                  />
                )}
                <Save className="h-4 w-4 mr-2" data-oid=".l:.00n" />
                保存變更
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
