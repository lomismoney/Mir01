"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useCreatePurchase, useStores } from "@/hooks/queries/useEntityQueries";
import { useToast } from "@/components/ui/use-toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { ProductSelector } from "@/components/inventory/ProductSelector";

interface PurchaseFormData {
  store_id: string;
  order_number: string;
  purchased_at: string;
  shipping_cost: string;
  items: {
    product_variant_id: number;
    quantity: string;
    unit_price: string;
    cost_price: string;
  }[];
}

interface CreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePurchaseDialog({ open, onOpenChange }: CreatePurchaseDialogProps) {
  const { toast } = useToast();
  const createPurchaseMutation = useCreatePurchase();
  const { data: storesData, isLoading: isLoadingStores } = useStores();

  const form = useForm<PurchaseFormData>({
    defaultValues: {
      store_id: "",
      order_number: "",
      purchased_at: new Date().toISOString().split('T')[0],
      shipping_cost: "0",
      items: [
        {
          product_variant_id: 0,
          quantity: "",
          unit_price: "",
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

    if (data.items.some(item => !item.product_variant_id)) {
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
      order_number: data.order_number,
      purchased_at: data.purchased_at ? `${data.purchased_at}T10:00:00+08:00` : undefined,
      shipping_cost: parseFloat(data.shipping_cost) || 0,
      items: data.items.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
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
      unit_price: "",
      cost_price: "",
    });
  };

  const calculateTotal = () => {
    const shippingCost = parseFloat(form.watch("shipping_cost")) || 0;
    const itemsTotal = form.watch("items").reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return total + (quantity * unitPrice);
    }, 0);
    return itemsTotal + shippingCost;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增進貨單</DialogTitle>
          <DialogDescription>
            建立多項商品進貨單，系統將自動計算運費攤銷和平均成本
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle>基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>門市 *</FormLabel>
                        <Select disabled={isLoadingStores} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇入庫門市" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {storesData?.data?.map((store) => (
                              <SelectItem key={store.id} value={store.id?.toString() || ''}>
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
                    name="order_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>進貨單號 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例：PO-20240101-001" />
                        </FormControl>
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
                          <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
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
                <div className="flex items-center justify-between">
                  <CardTitle>商品項目</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">商品 {index + 1}</h4>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_variant_id`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>商品 *</FormLabel>
                            <FormControl>
                              <ProductSelector
                                value={field.value}
                                onValueChange={(variantId, variant) => {
                                  field.onChange(variantId);
                                  // 自動填入單價
                                  if (variant?.price) {
                                    form.setValue(`items.${index}.unit_price`, variant.price.toString());
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
                              <Input {...field} type="number" min="1" placeholder="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>單價 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
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
                            <FormLabel>成本價 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
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
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">預估總金額</div>
                      <div className="text-lg font-semibold">
                        NT$ {calculateTotal().toLocaleString('zh-TW', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createPurchaseMutation.isPending}>
                {createPurchaseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                建立進貨單
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
