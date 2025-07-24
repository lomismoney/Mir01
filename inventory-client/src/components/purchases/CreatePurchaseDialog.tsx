"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useCreatePurchase, useStores } from "@/hooks";
import { useToast } from "@/components/ui/use-toast";
import { MoneyHelper } from "@/lib/money-helper";
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
import { Switch } from "@/components/ui/switch";

interface PurchaseFormData {
  store_id: string;
  purchased_at: string;
  shipping_cost: string;
  status: string;
  is_tax_inclusive: boolean;
  tax_rate: string;
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
      is_tax_inclusive: false,
      tax_rate: "5",
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
      is_tax_inclusive: data.is_tax_inclusive,
      tax_rate: parseFloat(data.tax_rate) || 0,
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
    const subtotal = itemsTotal + shippingCost;
    
    // 稅務計算
    const isTaxInclusive = form.watch("is_tax_inclusive");
    const taxRate = parseFloat(form.watch("tax_rate")) || 0;
    
    if (isTaxInclusive) {
      // 含稅價：稅額 = 總額 × 稅率 / (100 + 稅率)
      const taxAmount = subtotal * taxRate / (100 + taxRate);
      return { subtotal, taxAmount, finalAmount: subtotal };
    } else {
      // 未含稅：稅額 = 總額 × 稅率 / 100，最終金額 = 總額 + 稅額
      const taxAmount = subtotal * taxRate / 100;
      const finalAmount = subtotal + taxAmount;
      return { subtotal, taxAmount, finalAmount };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
       
      >
        <DialogHeader>
          <DialogTitle>新增進貨單</DialogTitle>
          <DialogDescription>
            建立進貨單並設定進貨價格，系統將根據狀態自動同步庫存並計算運費攤銷
          </DialogDescription>
        </DialogHeader>

        {/* 身份驗證狀態提示 */}
        {status === "unauthenticated" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              您的登入已過期，請重新登入後再試。
            </AlertDescription>
          </Alert>
        )}

        {/* 檢查 session 狀態 */}
        {status === "loading" ? (
          <div
            className="flex items-center justify-center py-8"
           
          >
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">
              載入中...
            </span>
          </div>
        ) : status === "authenticated" ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
             
            >
              {/* 基本資訊 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                   
                  >
                    <FormField
                      control={form.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>門市 *</FormLabel>
                          <Select
                            disabled={isLoadingStores}
                            onValueChange={field.onChange}
                            value={field.value}
                           
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder="選擇入庫門市"
                                 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {storesData?.data?.map((store) => (
                                <SelectItem
                                  key={store.id}
                                  value={store.id?.toString() || ""}
                                 
                                >
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                     
                    />

                    <FormField
                      control={form.control}
                      name="purchased_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>進貨日期</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                     
                    />

                    <FormField
                      control={form.control}
                      name="shipping_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>運費</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                             
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                     
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>狀態</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                           
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder="選擇狀態"
                                 
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(PURCHASE_STATUS_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem
                                    key={value}
                                    value={value}
                                   
                                  >
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                     
                    />

                    <FormField
                      control={form.control}
                      name="is_tax_inclusive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>含稅價</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              商品價格是否包含稅額
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>稅率 (%)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="5.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 商品項目 */}
              <Card>
                <CardHeader>
                  <div
                    className="flex items-center justify-between"
                   
                  >
                    <CardTitle>商品項目</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                     
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新增商品
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-4"
                     
                    >
                      <div
                        className="flex items-center justify-between"
                       
                      >
                        <h4 className="font-medium">
                          商品 {index + 1}
                        </h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                           
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                       
                      >
                        <FormField
                          control={form.control}
                          name={`items.${index}.product_variant_id`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>商品 *</FormLabel>
                              <FormControl>
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
                                 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                         
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>數量 *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  placeholder="0"
                                 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                         
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.cost_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>進貨價 *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                         
                        />
                      </div>
                    </div>
                  ))}

                  {/* 總計顯示 */}
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="text-right space-y-1">
                        <div className="text-sm text-muted-foreground flex justify-between gap-4">
                          <span>商品小計：</span>
                          <span>{MoneyHelper.format(calculateTotal().subtotal)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between gap-4">
                          <span>稅額：</span>
                          <span>{MoneyHelper.format(calculateTotal().taxAmount)}</span>
                        </div>
                        <div className="text-lg font-semibold flex justify-between gap-4">
                          <span>總金額：</span>
                          <span>{MoneyHelper.format(calculateTotal().finalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 操作按鈕 */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                 
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                 
                >
                  {createPurchaseMutation.isPending && (
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                     
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
