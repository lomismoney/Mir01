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
      <div className="container mx-auto p-4 md:p-8" data-oid="0rgmml8">
        <div className="space-y-6" data-oid="lh7d-qk">
          <div className="animate-pulse" data-oid="ee8us.4">
            <div
              className="h-8 bg-muted rounded w-1/3 mb-4"
              data-oid="8ct-es4"
            ></div>
            <div
              className="h-4 bg-muted rounded w-1/2 mb-8"
              data-oid="zxva6y7"
            ></div>
            <div className="space-y-4" data-oid="zv71_5i">
              <div className="h-32 bg-muted rounded" data-oid="amz:.lh"></div>
              <div className="h-48 bg-muted rounded" data-oid="o1qk36t"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8" data-oid="ech-oq3">
        <div className="text-center py-12" data-oid="z_o55xz">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="ovh0nx0"
          >
            找不到進貨單
          </h1>
          <p className="text-muted-foreground mb-6" data-oid="ivh1e07">
            進貨單不存在或已被刪除
          </p>
          <Button onClick={() => router.back()} data-oid="lckaazf">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="v-rxdz." />
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
      <div className="container mx-auto p-4 md:p-8" data-oid="nnn0hva">
        <div className="text-center py-12" data-oid="d4tupn1">
          <h1
            className="text-2xl font-bold text-destructive mb-4"
            data-oid="h7uh9kx"
          >
            無法編輯
          </h1>
          <p className="text-muted-foreground mb-6" data-oid="i36nkzu">
            進貨單狀態為「
            {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
            」，無法編輯
          </p>
          <Button onClick={() => router.back()} data-oid="blulwld">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="q3mocxe" />
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
    <div className="container mx-auto p-4 md:p-8" data-oid="7nivnpr">
      <div className="space-y-6" data-oid="5k35ltl">
        {/* 頁面標題區 */}
        <div className="flex items-center gap-4" data-oid="meu99ma">
          <Button
            variant="outline"
            onClick={() => router.back()}
            data-oid=".rghu5j"
          >
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="ektlcme" />
            返回
          </Button>
          <div data-oid="ykb3ncz">
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              data-oid="i5z7xnl"
            >
              <Package className="h-7 w-7 text-blue-600" data-oid="_nwtkjk" />
              編輯進貨單
            </h1>
            <div className="flex items-center gap-2 mt-1" data-oid=".765-l7">
              <p className="text-muted-foreground" data-oid="7:jjcmy">
                {purchaseData.order_number}
              </p>
              <Badge
                className={
                  PURCHASE_STATUS_COLORS[purchaseData.status as PurchaseStatus]
                }
                data-oid="kbzwp9:"
              >
                {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
              </Badge>
            </div>
          </div>
        </div>

        <Form {...form} data-oid="z3waq.g">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            data-oid="08vy7l-"
          >
            {/* 基本資訊 */}
            <Card data-oid="hqj5fz7">
              <CardHeader data-oid="y1zc-28">
                <CardTitle data-oid="3pf9ooz">基本資訊</CardTitle>
                <CardDescription data-oid="t2d0mty">
                  修改進貨單的基本資訊和狀態
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="h823fas">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-oid="ndv55nj"
                >
                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem data-oid="8yjn6fi">
                        <FormLabel data-oid="m4fs8gs">門市 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          data-oid="ix6jxik"
                        >
                          <FormControl data-oid="n7pwknw">
                            <SelectTrigger data-oid=":npge38">
                              <SelectValue
                                placeholder="選擇門市"
                                data-oid="g__.o0e"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent data-oid="9541okv">
                            {(storesData as any)?.data?.map((store: any) => (
                              <SelectItem
                                key={store.id}
                                value={store.id?.toString() || ""}
                                data-oid="0gqpj4s"
                              >
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage data-oid="i3_8_38" />
                      </FormItem>
                    )}
                    data-oid="f0-dvfa"
                  />

                  <FormField
                    control={form.control}
                    name="order_number"
                    render={({ field }) => (
                      <FormItem data-oid=".h5x91x">
                        <FormLabel data-oid="d.-971d">進貨單號 *</FormLabel>
                        <FormControl data-oid="t879f6s">
                          <Input
                            {...field}
                            placeholder="例：PO-20240101-001"
                            data-oid=".26bgzw"
                          />
                        </FormControl>
                        <FormMessage data-oid="j9feppy" />
                      </FormItem>
                    )}
                    data-oid="037ebao"
                  />

                  <FormField
                    control={form.control}
                    name="purchased_at"
                    render={({ field }) => (
                      <FormItem data-oid="d96f09.">
                        <FormLabel data-oid="yejx1ao">進貨日期</FormLabel>
                        <FormControl data-oid="yz.25cm">
                          <Input {...field} type="date" data-oid="-9dbdh_" />
                        </FormControl>
                        <FormMessage data-oid="r8oshmk" />
                      </FormItem>
                    )}
                    data-oid="6xsth9x"
                  />

                  <FormField
                    control={form.control}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem data-oid="r1mk6wn">
                        <FormLabel data-oid="jttdmrr">運費</FormLabel>
                        <FormControl data-oid="4gn01l4">
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            data-oid="p5w_6m9"
                          />
                        </FormControl>
                        <FormMessage data-oid="wi-0rrd" />
                      </FormItem>
                    )}
                    data-oid="u:dc4wg"
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem data-oid="zocu_48">
                        <FormLabel data-oid="7lf.aww">狀態</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          data-oid="-:.1hjt"
                        >
                          <FormControl data-oid="cguzi1y">
                            <SelectTrigger data-oid="mct88nx">
                              <SelectValue
                                placeholder="選擇狀態"
                                data-oid="z1fgvpj"
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent data-oid="voz8_11">
                            {/* 顯示當前狀態 */}
                            <SelectItem
                              value={purchaseData.status}
                              data-oid="nykt0lm"
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
                                data-oid="1uj1fqh"
                              >
                                {PURCHASE_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage data-oid="8.4d6gk" />
                      </FormItem>
                    )}
                    data-oid="s_5xqr_"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 商品項目 */}
            <Card data-oid="7tiw32l">
              <CardHeader data-oid="yedt-8b">
                <div
                  className="flex items-center justify-between"
                  data-oid="r38:b3."
                >
                  <CardTitle data-oid="hca3:mb">商品項目</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    data-oid="qa9jr-e"
                  >
                    <Plus className="h-4 w-4 mr-2" data-oid=":jcjybr" />
                    新增商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="j9l:qb7">
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    className="border rounded-lg p-4 space-y-4"
                    data-oid="1v.am2i"
                  >
                    <div
                      className="flex items-center justify-between"
                      data-oid="2bmfoxv"
                    >
                      <h4 className="font-medium" data-oid="y4hbrla">
                        商品 {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          data-oid="4sd4a2c"
                        >
                          <Trash2 className="h-4 w-4" data-oid="_9u876b" />
                        </Button>
                      )}
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                      data-oid="o_t-r66"
                    >
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_variant_id`}
                        render={({ field }) => (
                          <FormItem data-oid="5o.k92k">
                            <FormLabel data-oid="a__4z8l">商品 *</FormLabel>
                            <FormControl data-oid="b_9uaz6">
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
                                data-oid="c4r6pkd"
                              />
                            </FormControl>
                            <FormMessage data-oid="vxwv5pv" />
                          </FormItem>
                        )}
                        data-oid="pd3o153"
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem data-oid="56en97s">
                            <FormLabel data-oid="z.k8m07">數量 *</FormLabel>
                            <FormControl data-oid="vs89:gt">
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="0"
                                data-oid="hlvfbja"
                              />
                            </FormControl>
                            <FormMessage data-oid="-ol0us8" />
                          </FormItem>
                        )}
                        data-oid="kpe-575"
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.cost_price`}
                        render={({ field }) => (
                          <FormItem data-oid="523vzuz">
                            <FormLabel data-oid="oht8e1p">進貨價 *</FormLabel>
                            <FormControl data-oid="q3xu8hn">
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                data-oid="1o0gv5."
                              />
                            </FormControl>
                            <FormMessage data-oid="l2z3vsw" />
                          </FormItem>
                        )}
                        data-oid="yz6rsgf"
                      />
                    </div>
                  </div>
                ))}

                {/* 總計顯示 */}
                <div className="border-t pt-4" data-oid="av8dw1g">
                  <div className="flex justify-end" data-oid="wkextu6">
                    <div className="text-right" data-oid="zhv7byu">
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="a.zbnj4"
                      >
                        預估總金額
                      </div>
                      <div className="text-lg font-semibold" data-oid="ailg1w5">
                        NT${" "}
                        {calculateTotal().toLocaleString("zh-TW", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex justify-end space-x-2" data-oid="k75mjgw">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                data-oid="oxqf23_"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updatePurchaseMutation.isPending}
                data-oid="s94p4ht"
              >
                {updatePurchaseMutation.isPending && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="7pgccos"
                  />
                )}
                <Save className="h-4 w-4 mr-2" data-oid="e-r-x5d" />
                保存變更
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
