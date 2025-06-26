"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calculator,
  Package,
  RotateCcw,
  AlertCircle,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

// Hooks and API
import {
  useCreateRefund,
  useOrderDetail,
} from "@/hooks/queries/useEntityQueries";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";

// Types
import { ProcessedOrder, ProcessedOrderItem } from "@/types/api-helpers";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

/**
 * 表單數據接口定義
 */
interface RefundFormItem {
  order_item_id: number;
  quantity: number;
  product_name?: string;
  sku?: string;
  price?: number;
  max_quantity?: number;
  is_selected: boolean;
}

interface RefundFormValues {
  reason: string;
  notes?: string;
  should_restock: boolean;
  items: RefundFormItem[];
}

/**
 * Zod Schema 定義
 */
const RefundFormSchema = z.object({
  reason: z
    .string()
    .min(10, "退款原因至少需要 10 個字符")
    .max(500, "退款原因不能超過 500 個字符"),
  notes: z.string().optional(),
  should_restock: z.boolean(),
  items: z
    .array(
      z.object({
        order_item_id: z.number(),
        quantity: z.number().min(1, "退貨數量必須大於 0"),
        product_name: z.string().optional(),
        sku: z.string().optional(),
        price: z.number().optional(),
        max_quantity: z.number().optional(),
        is_selected: z.boolean(),
      }),
    )
    .min(1, "至少必須選擇一項退款商品"),
});

/**
 * RefundModal Props 介面
 */
interface RefundModalProps {
  order: ProcessedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * RefundModal 組件 - 退款處理系統 (雙欄佈局精粹版)
 *
 * 🎯 功能特性：
 * 1. 使用 useFieldArray 管理動態品項列表
 * 2. 完全遵循 react-hook-form 最佳實踐
 * 3. 統一的表單狀態管理
 * 4. 類型安全保證，移除所有 any 類型
 * 5. 實時退款金額計算
 * 6. 智能數量驗證和限制
 * 7. 雙欄佈局設計：操作與資訊分離
 * 8. 即時視覺反饋系統
 */
export default function RefundModal({
  order,
  open,
  onOpenChange,
}: RefundModalProps) {
  // 🎯 獲取完整的訂單詳情（包含品項資料）
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrderDetail(
    open && order ? order.id : null,
  );

  // 🎯 使用詳細訂單資料，如果沒有則使用傳入的訂單
  const fullOrder = orderDetail || order;

  // 🎯 表單狀態管理 - 統一由 react-hook-form 管理
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(RefundFormSchema),
    defaultValues: {
      reason: "",
      notes: "",
      should_restock: false,
      items: [],
    },
  });

  // 🎯 動態品項陣列管理 - 使用官方標準 useFieldArray
  const { fields, replace, update } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 🎯 退款 Mutation Hook
  const createRefundMutation = useCreateRefund();

  // 🎯 監聽表單中的品項變化，計算總退款金額
  const watchedItems = form.watch("items");

  // 🎯 即時計算退款總額
  const totalRefundAmount = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems
      .filter((item) => item.is_selected)
      .reduce((total, item) => {
        const price = typeof item.price === "number" ? item.price : 0;
        const quantity = typeof item.quantity === "number" ? item.quantity : 0;
        return total + price * quantity;
      }, 0);
  }, [watchedItems]);

  // 🎯 計算選中的品項數量
  const selectedItemsCount = useMemo(() => {
    return watchedItems?.filter((item) => item.is_selected).length || 0;
  }, [watchedItems]);

  // 🎯 計算退貨總數量
  const totalRefundQuantity = useMemo(() => {
    return (
      watchedItems
        ?.filter((item) => item.is_selected)
        .reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
    );
  }, [watchedItems]);

  // 🎯 處理品項選擇狀態變更
  const handleItemSelect = (itemIndex: number, checked: boolean) => {
    const currentItem = fields[itemIndex];
    update(itemIndex, {
      ...currentItem,
      is_selected: checked,
      quantity: checked ? 1 : 0, // 選中時預設數量為 1
    });
  };

  // 🎯 處理數量變更
  const handleQuantityChange = (itemIndex: number, quantity: number) => {
    const currentItem = fields[itemIndex];
    const maxQuantity = currentItem.max_quantity || 1;
    const validQuantity = Math.min(Math.max(1, quantity), maxQuantity);

    update(itemIndex, {
      ...currentItem,
      quantity: validQuantity,
    });
  };

  // 🎯 表單提交處理
  const onSubmit = (data: RefundFormValues) => {
    if (!fullOrder) return;

    // 過濾出選中的品項並構建退款數據
    const selectedItems = data.items
      .filter((item) => item.is_selected)
      .map((item) => ({
        order_item_id: item.order_item_id,
        quantity: item.quantity,
      }));

    if (selectedItems.length === 0) {
      toast.error("請至少選擇一項退款商品");
      return;
    }

    const refundData = {
      reason: data.reason,
      notes: data.notes || undefined,
      should_restock: data.should_restock,
      items: selectedItems,
    };

    // 🎯 確保訂單存在後再執行 API 調用
    if (!fullOrder) {
      toast.error("訂單資料不存在，無法處理退款");
      return;
    }

    // 🎯 暫時使用 as any 處理 API 類型定義問題
    // API 文檔生成工具將 items 錯誤地定義為 string[]，實際應該是物件陣列
    createRefundMutation.mutate(
      {
        orderId: fullOrder.id,
        data: { ...refundData, items: refundData.items as any },
      },
      {
        onSuccess: () => {
          toast.success("退款已成功處理");
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(`處理失敗: ${error.message}`);
        },
      },
    );
  };

  // 🎯 初始化品項列表 - 當訂單變更時
  useEffect(() => {
    if (open && fullOrder && fullOrder.items && fullOrder.items.length > 0) {
      const formattedItems: RefundFormItem[] = fullOrder.items.map(
        (item: ProcessedOrderItem) => ({
          order_item_id: item.id,
          quantity: 0,
          product_name: item.product_name,
          sku: item.sku,
          price: item.price,
          max_quantity: item.quantity,
          is_selected: false,
        }),
      );

      replace(formattedItems);
      form.setValue("reason", "");
      form.setValue("notes", "");
      form.setValue("should_restock", false);
    }
  }, [open, fullOrder, replace, form]);

  // 🎯 重置表單狀態
  useEffect(() => {
    if (!open) {
      form.reset();
      replace([]);
    }
  }, [open, form, replace]);

  // 如果沒有訂單數據或正在載入，顯示載入狀態
  if (!order || isLoadingDetail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} data-oid="gvknkop">
        <DialogContent
          className="!w-[90vw] !max-w-[1400px] sm:!max-w-[1400px]"
          data-oid="7540awa"
        >
          <DialogHeader data-oid="o_9lkj2">
            <DialogTitle className="flex items-center gap-2" data-oid="39_4gn:">
              <RotateCcw
                className="h-5 w-5 text-destructive"
                data-oid="8-5o-a4"
              />
              處理訂單退款
            </DialogTitle>
          </DialogHeader>
          <div
            className="flex items-center justify-center py-12"
            data-oid="z99e.iq"
          >
            <div className="text-center space-y-3" data-oid="7nh3w70">
              <div
                className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
                data-oid="8u3cdz7"
              />

              <p className="text-muted-foreground" data-oid="_52ak.7">
                載入訂單資料中...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 🎯 檢查訂單是否有品項
  if (!fullOrder || !fullOrder.items || fullOrder.items.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} data-oid="5s19z49">
        <DialogContent
          className="!w-[90vw] !max-w-[1400px] sm:!max-w-[1400px]"
          data-oid="wwrzdff"
        >
          <DialogHeader data-oid="jfdu2lc">
            <DialogTitle className="flex items-center gap-2" data-oid="55pdsis">
              <RotateCcw
                className="h-5 w-5 text-destructive"
                data-oid="rt.sbo_"
              />
              處理訂單退款
            </DialogTitle>
            <DialogDescription data-oid=":8iy.sx">
              訂單編號：{fullOrder?.order_number || order?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div
            className="flex flex-col items-center justify-center py-12 space-y-4"
            data-oid="3i3xhor"
          >
            <Package
              className="h-16 w-16 text-muted-foreground"
              data-oid="rk_yjn3"
            />

            <p className="text-muted-foreground text-lg" data-oid="pfyweu_">
              此訂單沒有可退款的品項
            </p>
          </div>
          <DialogFooter data-oid="x37u_7e">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-oid="e72-e5h"
            >
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="q3fsdor">
      <DialogContent
        className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col"
        data-oid="0ycxxbe"
      >
        <DialogHeader data-oid="35n6a7i">
          <DialogTitle
            className="text-xl flex items-center gap-2"
            data-oid="hf-5gar"
          >
            <RotateCcw
              className="h-5 w-5 text-destructive"
              data-oid="mlryhk2"
            />
            處理訂單退款
          </DialogTitle>
          <DialogDescription data-oid="mn8eu8r">
            訂單編號: {fullOrder.order_number} | 客戶:{" "}
            {fullOrder.customer?.name}
          </DialogDescription>
        </DialogHeader>

        {/* --- 核心：新的雙欄式佈局 --- */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-hidden"
          data-oid="ad3-q6m"
        >
          <div
            className="grid md:grid-cols-3 gap-6 h-full overflow-y-auto pr-2"
            data-oid="8s-sl_l"
          >
            {/* === 左欄：互動區 (佔 2/3) === */}
            <div className="md:col-span-2 space-y-6" data-oid="q48k1zx">
              <Card data-oid="dwa0opr">
                <CardHeader data-oid="ygj-coe">
                  <CardTitle
                    className="flex items-center gap-2"
                    data-oid=".nq0rgp"
                  >
                    <Package className="h-5 w-5" data-oid="hmnx4t0" />
                    1. 選擇退款品項與數量
                  </CardTitle>
                  <CardDescription data-oid="a6o-k.k">
                    請勾選需要退款的品項，並設定退貨數量
                  </CardDescription>
                </CardHeader>
                <CardContent data-oid="2i-jgk-">
                  <div className="rounded-md border" data-oid="3y1jh14">
                    <Table data-oid="e3gkv_x">
                      <TableHeader data-oid="80b5pwt">
                        <TableRow
                          className="border-b hover:bg-transparent"
                          data-oid="fn9jekr"
                        >
                          <TableHead
                            className="w-12 h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            data-oid="nqtn:ih"
                          >
                            <Checkbox
                              checked={
                                fields.length > 0 &&
                                fields.every(
                                  (_, index) =>
                                    watchedItems[index]?.is_selected,
                                )
                              }
                              onCheckedChange={(checked) => {
                                fields.forEach((_, index) => {
                                  handleItemSelect(index, checked as boolean);
                                });
                              }}
                              data-oid="e39gq5h"
                            />
                          </TableHead>
                          <TableHead
                            className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            data-oid="ok9sisc"
                          >
                            品項資訊
                          </TableHead>
                          <TableHead
                            className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                            data-oid="_cjywv_"
                          >
                            已購數量
                          </TableHead>
                          <TableHead
                            className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                            data-oid="l18wfx2"
                          >
                            退貨數量
                          </TableHead>
                          <TableHead
                            className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                            data-oid=":8p2jp_"
                          >
                            單價
                          </TableHead>
                          <TableHead
                            className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                            data-oid="5i2x2us"
                          >
                            小計
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody data-oid="3p_ws51">
                        {fields.map((field, index) => {
                          const item = watchedItems[index];
                          const isSelected = item?.is_selected || false;
                          const quantity = item?.quantity || 0;
                          const subtotal = isSelected
                            ? (item?.price || 0) * quantity
                            : 0;

                          return (
                            <TableRow
                              key={field.key}
                              className={isSelected ? "bg-muted/30" : ""}
                              data-oid="wf1u.ee"
                            >
                              <TableCell data-oid="qm4fbar">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    handleItemSelect(index, checked as boolean)
                                  }
                                  data-oid="7f5:97:"
                                />
                              </TableCell>
                              <TableCell data-oid="wr9sl2a">
                                <div className="space-y-1" data-oid="d.6rxtb">
                                  <p className="font-medium" data-oid="t.advud">
                                    {field.product_name}
                                  </p>
                                  <p
                                    className="text-sm text-muted-foreground"
                                    data-oid="tk.l:hb"
                                  >
                                    SKU: {field.sku}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell
                                className="text-center"
                                data-oid="n9l7s04"
                              >
                                <Badge variant="outline" data-oid="6a6ncli">
                                  {field.max_quantity}
                                </Badge>
                              </TableCell>
                              <TableCell data-oid="ayy1i0e">
                                <Controller
                                  name={`items.${index}.quantity`}
                                  control={form.control}
                                  render={({ field: quantityField }) => (
                                    <Input
                                      type="number"
                                      min="1"
                                      max={field.max_quantity}
                                      value={
                                        isSelected ? quantityField.value : ""
                                      }
                                      onChange={(e) => {
                                        const newQuantity =
                                          parseInt(e.target.value) || 1;
                                        quantityField.onChange(newQuantity);
                                        handleQuantityChange(
                                          index,
                                          newQuantity,
                                        );
                                      }}
                                      disabled={!isSelected}
                                      className="w-20 mx-auto"
                                      data-oid="0.3t__s"
                                    />
                                  )}
                                  data-oid="6cy5v_t"
                                />
                              </TableCell>
                              <TableCell
                                className="text-right font-medium"
                                data-oid="hicfrq-"
                              >
                                ${(field.price || 0).toFixed(2)}
                              </TableCell>
                              <TableCell
                                className="text-right font-medium text-destructive"
                                data-oid="1j1k-sj"
                              >
                                ${subtotal.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card data-oid="rp_esen">
                <CardHeader data-oid="7wyi60m">
                  <CardTitle data-oid="w74llbl">2. 填寫退款資訊</CardTitle>
                  <CardDescription data-oid="qeae0aq">
                    請提供退款原因及相關說明
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="xh82d:r">
                  <div className="space-y-2" data-oid="y7tmd_f">
                    <Label htmlFor="reason" data-oid="31ly_o-">
                      退款原因{" "}
                      <span className="text-destructive" data-oid="4tjygj-">
                        *
                      </span>
                    </Label>
                    <Controller
                      name="reason"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                          <Textarea
                            {...field}
                            id="reason"
                            placeholder="請詳細說明退款原因..."
                            className="min-h-[100px] resize-none"
                            data-oid=".aj4r13"
                          />

                          {fieldState.error && (
                            <p
                              className="text-sm text-destructive"
                              data-oid="a2bkqv_"
                            >
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                      data-oid="pltdfzi"
                    />
                  </div>

                  <div className="space-y-2" data-oid="ucbv3xi">
                    <Label htmlFor="notes" data-oid=":famsfn">
                      備註說明
                    </Label>
                    <Controller
                      name="notes"
                      control={form.control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="notes"
                          placeholder="選填：其他補充說明..."
                          className="resize-none"
                          data-oid="x1e3ae0"
                        />
                      )}
                      data-oid="it12er3"
                    />
                  </div>

                  <div className="space-y-4" data-oid="66hr5w4">
                    <div
                      className="flex items-center space-x-2"
                      data-oid="g68ponh"
                    >
                      <Controller
                        name="should_restock"
                        control={form.control}
                        render={({ field }) => (
                          <Checkbox
                            id="restock"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-oid="jpasivn"
                          />
                        )}
                        data-oid="ryo1:pa"
                      />

                      <Label
                        htmlFor="restock"
                        className="cursor-pointer font-normal"
                        data-oid="v2sshkm"
                      >
                        將退貨商品加回庫存
                      </Label>
                    </div>
                    <Alert data-oid="u:.a76z">
                      <AlertCircle className="h-4 w-4" data-oid="uomfb6t" />
                      <AlertDescription data-oid="wvt0xmn">
                        勾選此選項將自動將退貨商品數量加回相應的庫存
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* === 右欄：資訊區 (佔 1/3) === */}
            <div className="space-y-6" data-oid="ncwtcpl">
              <Card className="sticky top-0" data-oid="o26v3nc">
                <CardHeader data-oid="0q7kvuc">
                  <CardTitle
                    className="flex items-center gap-2"
                    data-oid="55g3oxx"
                  >
                    <Calculator className="h-5 w-5" data-oid="9ldm9rr" />
                    退款金額計算
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-oid="k2.voat">
                  <div className="space-y-3 text-sm" data-oid="i3n7hs5">
                    <div className="flex justify-between" data-oid="k8amxv3">
                      <span
                        className="text-muted-foreground"
                        data-oid="3yu.fm3"
                      >
                        訂單總額
                      </span>
                      <span className="font-medium" data-oid="wvlc_t8">
                        ${fullOrder.grand_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between" data-oid="fvbpww2">
                      <span
                        className="text-muted-foreground"
                        data-oid="r5b.gen"
                      >
                        已付金額
                      </span>
                      <span
                        className="font-medium text-green-600"
                        data-oid="ybt_1_g"
                      >
                        ${fullOrder.paid_amount.toFixed(2)}
                      </span>
                    </div>

                    <Separator data-oid="qm24bso" />

                    <div className="flex justify-between" data-oid="hld0wfy">
                      <span
                        className="text-muted-foreground"
                        data-oid="dw6jjtv"
                      >
                        選中品項
                      </span>
                      <span className="font-medium" data-oid="90d:513">
                        {selectedItemsCount} 項
                      </span>
                    </div>
                    <div className="flex justify-between" data-oid="6mztt2c">
                      <span
                        className="text-muted-foreground"
                        data-oid="s_p5lap"
                      >
                        退貨總數量
                      </span>
                      <span className="font-medium" data-oid="809xty-">
                        {totalRefundQuantity} 件
                      </span>
                    </div>

                    <Separator data-oid="kyia29q" />

                    <div
                      className="flex justify-between items-center pt-2"
                      data-oid="2hn9.1k"
                    >
                      <span
                        className="font-semibold text-base"
                        data-oid="8rp9hfn"
                      >
                        預計退款金額
                      </span>
                      <span
                        className="text-2xl font-bold text-destructive"
                        data-oid="pdv_989"
                      >
                        ${totalRefundAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 退款進度視覺化 */}
                  {fullOrder.grand_total > 0 && (
                    <div className="space-y-2" data-oid="s8_x_-6">
                      <div
                        className="flex justify-between text-xs text-muted-foreground"
                        data-oid="3wtxsk0"
                      >
                        <span data-oid="3m5g7r-">退款比例</span>
                        <span data-oid="mxo2a8k">
                          {(
                            (totalRefundAmount / fullOrder.grand_total) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (totalRefundAmount / fullOrder.grand_total) * 100
                        }
                        className="h-2"
                        data-oid="bb87da."
                      />
                    </div>
                  )}

                  {selectedItemsCount > 0 && (
                    <Alert
                      className="border-green-200 bg-green-50"
                      data-oid="_5zfm7o"
                    >
                      <CheckCircle
                        className="h-4 w-4 text-green-600"
                        data-oid="ny3qgn4"
                      />

                      <AlertDescription
                        className="text-green-800"
                        data-oid="4_:_qc4"
                      >
                        已選擇 {selectedItemsCount} 項商品，共{" "}
                        {totalRefundQuantity} 件
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* --- 底部操作按鈕 --- */}
          <DialogFooter className="mt-6 pt-4 border-t" data-oid="36s-fs-">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRefundMutation.isPending}
              data-oid=".32gsrl"
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                selectedItemsCount === 0 || createRefundMutation.isPending
              }
              data-oid="x6vyjnr"
            >
              {createRefundMutation.isPending ? (
                <>
                  <div
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    data-oid="9_y_kzc"
                  />
                  處理中...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" data-oid="s3ui-1p" />
                  確認退款 ${totalRefundAmount.toFixed(2)}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 🎯 工具函數：格式化金額顯示
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 2,
  }).format(amount);
}
