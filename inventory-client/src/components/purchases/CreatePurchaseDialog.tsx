"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useCreatePurchase, useStores } from "@/hooks/queries/useEntityQueries";
import { useToast } from "@/components/ui/use-toast";
import { PURCHASE_STATUS_LABELS, PURCHASE_STATUS } from "@/types/purchase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Loader2, AlertCircle } from "lucide-react";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PurchaseFormData {
  store_id: string;
  purchased_at: string;
  shipping_cost: string;
  status: string;
  items: {
    product_variant_id: number;
    quantity: string;
    cost_price: string;
  }[];
}

interface CreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePurchaseDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePurchaseDialogProps) {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const createPurchaseMutation = useCreatePurchase();
  const { data: storesData, isLoading: isLoadingStores } = useStores();

  const form = useForm<PurchaseFormData>({
    defaultValues: {
      store_id: "",
      purchased_at: new Date().toISOString().split("T")[0],
      shipping_cost: "0",
      status: PURCHASE_STATUS.PENDING,
      items: [
        {
          product_variant_id: 0,
          quantity: "",
          cost_price: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = (data: PurchaseFormData) => {
    // 驗證必填欄位
    if (!data.store_id) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請選擇門市",
      });
      return;
    }

    if (data.items.some((item) => !item.product_variant_id)) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請為所有項目選擇商品",
      });
      return;
    }

    // 轉換資料格式
    const purchaseData = {
      store_id: parseInt(data.store_id),
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

    createPurchaseMutation.mutate(purchaseData, {
      onSuccess: () => {
        toast({
          title: "成功",
          description: "進貨單建立成功，庫存已更新",
        });
        form.reset();
        onOpenChange(false);
        onSuccess?.(); // 調用外部成功回調
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: `建立進貨單失敗: ${error.message}`,
        });
      },
    });
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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="od5wl62">
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        data-oid="79co.tz"
      >
        <DialogHeader data-oid="5p3qs67">
          <DialogTitle data-oid="spb_216">新增進貨單</DialogTitle>
          <DialogDescription data-oid="bra80yl">
            建立進貨單並設定進貨價格，系統將根據狀態自動同步庫存並計算運費攤銷
          </DialogDescription>
        </DialogHeader>

        {/* 身份驗證狀態提示 */}
        {status === "unauthenticated" && (
          <Alert variant="destructive" data-oid="tdgexoz">
            <AlertCircle className="h-4 w-4" data-oid="yxexwt1" />
            <AlertDescription data-oid="0-ejk3_">
              您的登入已過期，請重新登入後再試。
            </AlertDescription>
          </Alert>
        )}

        {/* 檢查 session 狀態 */}
        {status === "loading" ? (
          <div
            className="flex items-center justify-center py-8"
            data-oid="rcz:o28"
          >
            <Loader2 className="h-8 w-8 animate-spin" data-oid="srhnz--" />
            <span className="ml-2" data-oid="fcgd8db">
              載入中...
            </span>
          </div>
        ) : status === "authenticated" ? (
          <Form {...form} data-oid="do7.p7p">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              data-oid="im8aq-j"
            >
              {/* 基本資訊 */}
              <Card data-oid="2rsn65t">
                <CardHeader data-oid="2-cdh-l">
                  <CardTitle data-oid="48ghs1x">基本資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="2bqwbc5">
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    data-oid="s7vk_::"
                  >
                    <FormField
                      control={form.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem data-oid="yrneumn">
                          <FormLabel data-oid="nxo_rl4">門市 *</FormLabel>
                          <Select
                            disabled={isLoadingStores}
                            onValueChange={field.onChange}
                            value={field.value}
                            data-oid="q0jc8vh"
                          >
                            <FormControl data-oid=":.s37ul">
                              <SelectTrigger data-oid="0pjp0no">
                                <SelectValue
                                  placeholder="選擇入庫門市"
                                  data-oid="fe2rty3"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent data-oid="dgx5vis">
                              {storesData?.data?.map((store) => (
                                <SelectItem
                                  key={store.id}
                                  value={store.id?.toString() || ""}
                                  data-oid="fomndlb"
                                >
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-oid="mlphhry" />
                        </FormItem>
                      )}
                      data-oid="0rai3a:"
                    />

                    <FormField
                      control={form.control}
                      name="purchased_at"
                      render={({ field }) => (
                        <FormItem data-oid="mbfpj-r">
                          <FormLabel data-oid="95a7v01">進貨日期</FormLabel>
                          <FormControl data-oid="g7qg02g">
                            <Input {...field} type="date" data-oid="hs57_g-" />
                          </FormControl>
                          <FormMessage data-oid="2f95a6j" />
                        </FormItem>
                      )}
                      data-oid="4thyjz0"
                    />

                    <FormField
                      control={form.control}
                      name="shipping_cost"
                      render={({ field }) => (
                        <FormItem data-oid="ur2e0n-">
                          <FormLabel data-oid="2e_8mny">運費</FormLabel>
                          <FormControl data-oid="_3_waye">
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              data-oid="rg.-dkz"
                            />
                          </FormControl>
                          <FormMessage data-oid="ikbxd3g" />
                        </FormItem>
                      )}
                      data-oid="3e7rxr-"
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem data-oid="p-iavv7">
                          <FormLabel data-oid="v2vkng_">狀態</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            data-oid="dn1625t"
                          >
                            <FormControl data-oid="lm:4_:n">
                              <SelectTrigger data-oid="pk3u125">
                                <SelectValue
                                  placeholder="選擇狀態"
                                  data-oid="ytug0l:"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent data-oid="gofqrda">
                              {Object.entries(PURCHASE_STATUS_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                    data-oid="ckrz8eb"
                                  >
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage data-oid="0x7wmnz" />
                        </FormItem>
                      )}
                      data-oid="yv2sr-0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 商品項目 */}
              <Card data-oid="rme6n87">
                <CardHeader data-oid="2tk5p03">
                  <div
                    className="flex items-center justify-between"
                    data-oid="vracjqx"
                  >
                    <CardTitle data-oid="64td54f">商品項目</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      data-oid="dqetek3"
                    >
                      <Plus className="h-4 w-4 mr-2" data-oid="dlaix5n" />
                      新增商品
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="ptjq00h">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4"
                      data-oid="-u2j5.o"
                    >
                      <div
                        className="flex items-center justify-between"
                        data-oid="cdfp-zd"
                      >
                        <h4 className="font-medium" data-oid=":9p5se4">
                          商品 {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            data-oid="45wli92"
                          >
                            <Trash2 className="h-4 w-4" data-oid="w8rt65l" />
                          </Button>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        data-oid="9u.8rn."
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.product_variant_id`}
                          render={({ field }) => (
                            <FormItem data-oid="kraze35">
                              <FormLabel data-oid="ko054z.">商品 *</FormLabel>
                              <FormControl data-oid="4t:c1e1">
                                <ProductSelector
                                  value={field.value}
                                  onValueChange={(variantId, variant) => {
                                    field.onChange(variantId);
                                    // 可選：自動填入成本價（如果商品有預設成本價）
                                    if (variant?.price) {
                                      form.setValue(
                                        `items.${index}.cost_price`,
                                        variant.price.toString(),
                                      );
                                    }
                                  }}
                                  placeholder="搜尋並選擇商品規格"
                                  disabled={createPurchaseMutation.isPending}
                                  showCurrentStock={false}
                                  data-oid="atwebs."
                                />
                              </FormControl>
                              <FormMessage data-oid="emlbtbp" />
                            </FormItem>
                          )}
                          data-oid="klw2x4_"
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem data-oid="ipvl404">
                              <FormLabel data-oid="zt4_oi5">數量 *</FormLabel>
                              <FormControl data-oid="5b3s1wm">
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                  data-oid="0oy9o9u"
                                />
                              </FormControl>
                              <FormMessage data-oid="_wkzj48" />
                            </FormItem>
                          )}
                          data-oid="okcj2sl"
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.cost_price`}
                          render={({ field }) => (
                            <FormItem data-oid="shmh_cs">
                              <FormLabel data-oid="zxr.jii">進貨價 *</FormLabel>
                              <FormControl data-oid="a9a1f7.">
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  data-oid="h-w2mh8"
                                />
                              </FormControl>
                              <FormMessage data-oid="ficam90" />
                            </FormItem>
                          )}
                          data-oid="8osq4v1"
                        />
                      </div>
                    </div>
                  ))}

                  {/* 總計顯示 */}
                  <div className="border-t pt-4" data-oid="3-2ptn.">
                    <div className="flex justify-end" data-oid="vi:v8kj">
                      <div className="text-right" data-oid="im:h4rm">
                        <div
                          className="text-sm text-muted-foreground"
                          data-oid="3:2mh95"
                        >
                          預估總金額
                        </div>
                        <div
                          className="text-lg font-semibold"
                          data-oid="grnfveq"
                        >
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
              <div className="flex justify-end space-x-2" data-oid="r1tt294">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-oid="rt17kw:"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                  data-oid="s_s11v3"
                >
                  {createPurchaseMutation.isPending && (
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      data-oid="l_zgi7c"
                    />
                  )}
                  建立進貨單
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
