"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useInventoryAdjustment,
  useStores,
} from "@/hooks/queries/useEntityQueries";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ProductSelector } from "./ProductSelector";

interface AdjustmentFormValues {
  storeId: string;
  productVariantId: number;
  action: "add" | "reduce" | "set";
  quantity: string;
  notes: string;
}

interface InventoryAdjustmentFormProps {
  productVariantId: number;
  storeId?: number;
  currentQuantity: number;
  onSuccess?: () => void;
  dialogOpen?: boolean;
}

export function InventoryAdjustmentForm({
  productVariantId,
  storeId,
  currentQuantity,
  onSuccess,
  dialogOpen = true,
}: InventoryAdjustmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductVariantId, setSelectedProductVariantId] =
    useState<number>(productVariantId);
  const isNewProduct = productVariantId === 0;

  // 獲取門市列表
  const {
    data: storesData,
    isLoading: isLoadingStores,
    error: storesError,
  } = useStores();

  // 處理門市獲取錯誤
  useEffect(() => {
    if (storesError) {
      console.error("Stores error:", storesError);
      toast({
        variant: "destructive",
        title: "載入門市失敗",
        description: "無法載入門市列表，請檢查網路連線或稍後再試",
      });
    }
  }, [storesError, toast]);

  const form = useForm<AdjustmentFormValues>({
    defaultValues: {
      storeId: storeId ? storeId.toString() : "",
      productVariantId: isNewProduct ? 0 : productVariantId,
      action: "add",
      quantity: "",
      notes: "",
    },
  });

  // 更新表單當產品ID變化時
  useEffect(() => {
    if (productVariantId > 0) {
      setSelectedProductVariantId(productVariantId);
    }
  }, [productVariantId]);

  const adjustmentMutation = useInventoryAdjustment();

  const onSubmit = (data: AdjustmentFormValues) => {
    setIsSubmitting(true);

    // 驗證門市 ID
    if (!data.storeId || parseInt(data.storeId) <= 0) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請選擇門市",
      });
      setIsSubmitting(false);
      return;
    }

    const finalProductVariantId = isNewProduct
      ? data.productVariantId
      : selectedProductVariantId;

    // 驗證產品 ID
    if (finalProductVariantId <= 0 || isNaN(finalProductVariantId)) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請選擇有效的產品",
      });
      setIsSubmitting(false);
      return;
    }

    // 轉換值為適當的類型
    adjustmentMutation.mutate(
      {
        product_variant_id: finalProductVariantId,
        store_id: parseInt(data.storeId),
        action: data.action,
        quantity: parseInt(data.quantity),
        notes: data.notes,
      },
      {
        onSuccess: () => {
          toast({
            title: "成功",
            description: "庫存修改已完成",
          });
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
          form.reset();
          setIsSubmitting(false);
          if (onSuccess) onSuccess();
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: `庫存修改失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
          });
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <Card data-oid="wzlgbq:">
      <CardHeader data-oid="us1sl8q">
        <CardTitle data-oid="1sr1k_u">修改庫存</CardTitle>
        <CardDescription data-oid="2.ygyzq">
          {currentQuantity > 0
            ? `當前庫存: ${currentQuantity} 件`
            : "設定庫存數量"}
        </CardDescription>
      </CardHeader>
      <CardContent data-oid=":jhv1:d">
        <Form {...form} data-oid="hvdbfga">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-oid="jwr6_mt"
          >
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem data-oid="tq9n3n5">
                  <FormLabel data-oid="5xco6_j">選擇門市</FormLabel>
                  <Select
                    disabled={isLoadingStores || isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                    data-oid="los_s:."
                  >
                    <FormControl data-oid="-kvw:5e">
                      <SelectTrigger data-oid="skw_kaq">
                        <SelectValue
                          placeholder="選擇入庫門市"
                          data-oid="y07vx10"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent data-oid="tr4bdd2">
                      {storesData?.data?.map((store) => (
                        <SelectItem
                          key={store.id}
                          value={store.id?.toString() || ""}
                          data-oid="s4.9g-d"
                        >
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage data-oid="ncj5svv" />
                </FormItem>
              )}
              data-oid="c5tpuy-"
            />

            {isNewProduct && (
              <FormField
                control={form.control}
                name="productVariantId"
                render={({ field }) => (
                  <FormItem data-oid="27e5uix">
                    <FormLabel data-oid="k5n_ydy">選擇商品</FormLabel>
                    <FormControl data-oid="o9kcmmt">
                      <ProductSelector
                        value={field.value}
                        onValueChange={(variantId, variant) => {
                          field.onChange(variantId);
                          setSelectedProductVariantId(variantId);
                        }}
                        placeholder="搜尋並選擇商品規格"
                        disabled={isSubmitting}
                        showCurrentStock={true}
                        storeId={parseInt(form.watch("storeId")) || undefined}
                        data-oid="0k967sv"
                      />
                    </FormControl>
                    <FormMessage data-oid="s4hn3al" />
                  </FormItem>
                )}
                data-oid="unqpyze"
              />
            )}

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3" data-oid="wyh:y8g">
                  <FormLabel data-oid="9-goq.q">調整方式</FormLabel>
                  <FormControl data-oid="zz-s86-">
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      data-oid="y0l6uw1"
                    >
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        data-oid="8hv1v.3"
                      >
                        <FormControl data-oid="3o4m2-9">
                          <RadioGroupItem value="add" data-oid="j:muyv9" />
                        </FormControl>
                        <FormLabel className="font-normal" data-oid="hyviqy.">
                          增加庫存
                        </FormLabel>
                      </FormItem>
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        data-oid="oa7fa1h"
                      >
                        <FormControl data-oid="ynyjy_m">
                          <RadioGroupItem value="reduce" data-oid="22xzd_n" />
                        </FormControl>
                        <FormLabel className="font-normal" data-oid="xujzkx:">
                          減少庫存
                        </FormLabel>
                      </FormItem>
                      <FormItem
                        className="flex items-center space-x-3 space-y-0"
                        data-oid="-hkucmr"
                      >
                        <FormControl data-oid="av:8s9-">
                          <RadioGroupItem value="set" data-oid="hdzapqe" />
                        </FormControl>
                        <FormLabel className="font-normal" data-oid="mam.0j.">
                          設定為特定數量
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage data-oid="w9whj_a" />
                </FormItem>
              )}
              data-oid="447193h"
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem data-oid=".ey5zww">
                  <FormLabel data-oid="8713sv0">數量</FormLabel>
                  <FormControl data-oid="pcaox61">
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      disabled={isSubmitting}
                      data-oid="8ca5mu."
                    />
                  </FormControl>
                  <FormDescription data-oid="ah4.x.4">
                    請輸入大於 0 的正整數
                  </FormDescription>
                  <FormMessage data-oid=".swbq6h" />
                </FormItem>
              )}
              data-oid="p4kevz5"
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem data-oid=".635gzv">
                  <FormLabel data-oid="m-d57xt">備註</FormLabel>
                  <FormControl data-oid="0gpgb:8">
                    <Textarea
                      {...field}
                      placeholder="輸入此次調整的原因或備註（選填）"
                      disabled={isSubmitting}
                      data-oid="8g1icyj"
                    />
                  </FormControl>
                  <FormMessage data-oid="joe.mpl" />
                </FormItem>
              )}
              data-oid="ufaazji"
            />

            <div className="flex justify-end" data-oid="t39l.y8">
              <Button type="submit" disabled={isSubmitting} data-oid="u-h.bp:">
                {isSubmitting && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="p99eul:"
                  />
                )}
                {isNewProduct ? "新增庫存" : "確認調整"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
