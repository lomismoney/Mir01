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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="ba1hqz0">
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        data-oid="fxq2dtd"
      >
        <DialogHeader data-oid="73:.-qr">
          <DialogTitle data-oid="0hkbuxf">新增進貨單</DialogTitle>
          <DialogDescription data-oid="5rld5:s">
            建立進貨單並設定進貨價格，系統將根據狀態自動同步庫存並計算運費攤銷
          </DialogDescription>
        </DialogHeader>

        {/* 身份驗證狀態提示 */}
        {status === "unauthenticated" && (
          <Alert variant="destructive" data-oid="ubjgk-i">
            <AlertCircle className="h-4 w-4" data-oid="o:2l9to" />
            <AlertDescription data-oid="e:fsr6s">
              您的登入已過期，請重新登入後再試。
            </AlertDescription>
          </Alert>
        )}

        {/* 檢查 session 狀態 */}
        {status === "loading" ? (
          <div
            className="flex items-center justify-center py-8"
            data-oid="pzpfg_e"
          >
            <Loader2 className="h-8 w-8 animate-spin" data-oid="sbepcab" />
            <span className="ml-2" data-oid="4ojp91g">
              載入中...
            </span>
          </div>
        ) : status === "authenticated" ? (
          <Form {...form} data-oid="a4o5907">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              data-oid="ivb2-tn"
            >
              {/* 基本資訊 */}
              <Card data-oid="5wshoui">
                <CardHeader data-oid="_n6k4li">
                  <CardTitle data-oid="ng0ua_f">基本資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="ln.0pp9">
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    data-oid="-2gshx:"
                  >
                    <FormField
                      control={form.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem data-oid="5l5fk.5">
                          <FormLabel data-oid="y4widi.">門市 *</FormLabel>
                          <Select
                            disabled={isLoadingStores}
                            onValueChange={field.onChange}
                            value={field.value}
                            data-oid="bzxhfko"
                          >
                            <FormControl data-oid="p61ceuh">
                              <SelectTrigger data-oid=":f:gr8k">
                                <SelectValue
                                  placeholder="選擇入庫門市"
                                  data-oid="8lo9mg1"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent data-oid="48p0t0v">
                              {storesData?.data?.map((store) => (
                                <SelectItem
                                  key={store.id}
                                  value={store.id?.toString() || ""}
                                  data-oid="hsbxw_a"
                                >
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-oid="_bztzj2" />
                        </FormItem>
                      )}
                      data-oid="2m082cl"
                    />

                    <FormField
                      control={form.control}
                      name="purchased_at"
                      render={({ field }) => (
                        <FormItem data-oid="0e2judp">
                          <FormLabel data-oid="ce-fg:b">進貨日期</FormLabel>
                          <FormControl data-oid="6pp1lrz">
                            <Input {...field} type="date" data-oid="pesiwb8" />
                          </FormControl>
                          <FormMessage data-oid="xhqo0q9" />
                        </FormItem>
                      )}
                      data-oid="rj2e46h"
                    />

                    <FormField
                      control={form.control}
                      name="shipping_cost"
                      render={({ field }) => (
                        <FormItem data-oid="k1o6lvp">
                          <FormLabel data-oid="pg-wv0o">運費</FormLabel>
                          <FormControl data-oid="ihak0:u">
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              data-oid="apzhj.6"
                            />
                          </FormControl>
                          <FormMessage data-oid="c3vu51c" />
                        </FormItem>
                      )}
                      data-oid=":s--0eo"
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem data-oid="51yk04-">
                          <FormLabel data-oid="sw.kz-a">狀態</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            data-oid="4mxz_ij"
                          >
                            <FormControl data-oid="flrl_64">
                              <SelectTrigger data-oid="dr67evq">
                                <SelectValue
                                  placeholder="選擇狀態"
                                  data-oid="zvrnq1v"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent data-oid=".oc4bqu">
                              {Object.entries(PURCHASE_STATUS_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                    data-oid="bsfc.nq"
                                  >
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage data-oid="z62t8bs" />
                        </FormItem>
                      )}
                      data-oid="8f.z5::"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 商品項目 */}
              <Card data-oid="dp5io13">
                <CardHeader data-oid="reyp08z">
                  <div
                    className="flex items-center justify-between"
                    data-oid="w0-rl26"
                  >
                    <CardTitle data-oid=".ez6raf">商品項目</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      data-oid="775vbm:"
                    >
                      <Plus className="h-4 w-4 mr-2" data-oid=":ormfs_" />
                      新增商品
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="0kl:t43">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4"
                      data-oid="0sc4h:o"
                    >
                      <div
                        className="flex items-center justify-between"
                        data-oid="bz3:ot3"
                      >
                        <h4 className="font-medium" data-oid="4se6af1">
                          商品 {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                            data-oid="1yx6ouf"
                          >
                            <Trash2 className="h-4 w-4" data-oid="dofhakn" />
                          </Button>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        data-oid="wh8w-zv"
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.product_variant_id`}
                          render={({ field }) => (
                            <FormItem data-oid="yre1la7">
                              <FormLabel data-oid="3mwwzp:">商品 *</FormLabel>
                              <FormControl data-oid="oskt-fp">
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
                                  data-oid="l1hu7hj"
                                />
                              </FormControl>
                              <FormMessage data-oid="64i77qp" />
                            </FormItem>
                          )}
                          data-oid="_rc-cgp"
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem data-oid="mohfj.n">
                              <FormLabel data-oid="c7fcofr">數量 *</FormLabel>
                              <FormControl data-oid="7rsuuaa">
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                  data-oid="e168.8e"
                                />
                              </FormControl>
                              <FormMessage data-oid="4de9vjd" />
                            </FormItem>
                          )}
                          data-oid="lj9f1tx"
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.cost_price`}
                          render={({ field }) => (
                            <FormItem data-oid="ug.djuq">
                              <FormLabel data-oid="am00n84">進貨價 *</FormLabel>
                              <FormControl data-oid="3vicsau">
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  data-oid="_ni_bth"
                                />
                              </FormControl>
                              <FormMessage data-oid="-ikt1nv" />
                            </FormItem>
                          )}
                          data-oid="f9.6t_p"
                        />
                      </div>
                    </div>
                  ))}

                  {/* 總計顯示 */}
                  <div className="border-t pt-4" data-oid="iwgmr.j">
                    <div className="flex justify-end" data-oid="kh63a1m">
                      <div className="text-right" data-oid="f9rcog.">
                        <div
                          className="text-sm text-muted-foreground"
                          data-oid="6g3iss_"
                        >
                          預估總金額
                        </div>
                        <div
                          className="text-lg font-semibold"
                          data-oid="8:qa7xk"
                        >
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
              <div className="flex justify-end space-x-2" data-oid="ciucegd">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-oid="h_bgk_z"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                  data-oid="sygs7eu"
                >
                  {createPurchaseMutation.isPending && (
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      data-oid="0e2na1-"
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
