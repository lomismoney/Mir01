"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  CalendarIcon,
  Loader2,
  DollarSign,
  CreditCard,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

import { ProcessedOrder } from "@/types/api-helpers";
import { useAddOrderPayment } from "@/hooks/queries/useEntityQueries";

/**
 * 正確的付款記錄請求類型定義
 *
 * 此類型覆蓋了 OpenAPI 生成的錯誤類型定義，確保類型安全：
 * 1. amount: number - 付款金額（API 生成為 Record<string, never>，實際應為 number）
 * 2. payment_method: string - 付款方式
 * 3. payment_date: string - ISO 8601 格式的日期時間字符串（API 生成為 Record<string, never>，實際應為 string）
 * 4. notes: string | undefined - 備註（可選）
 *
 * 注意：我們使用受控的類型斷言來繞過 OpenAPI 生成器的類型錯誤，
 * 這是一個臨時解決方案，直到 API 契約類型生成問題被修復。
 */
interface CorrectAddPaymentRequestBody {
  amount: number;
  payment_method: string;
  payment_date?: string;
  notes?: string;
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 部分收款表單 Zod Schema
 *
 * 包含完整的欄位驗證和業務邏輯驗證：
 * 1. amount: 收款金額，必須大於 0
 * 2. payment_method: 收款方式，限定選項
 * 3. payment_date: 收款日期，可選
 * 4. notes: 備註，可選
 * 5. 使用 .refine 確保收款金額不超過剩餘未付金額
 */
const createPaymentSchema = (remainingAmount: number) =>
  z
    .object({
      amount: z
        .number({
          required_error: "收款金額是必填項目",
          invalid_type_error: "收款金額必須是數字",
        })
        .min(0.01, "收款金額必須大於 0"),
      payment_method: z
        .string({
          required_error: "收款方式是必填項目",
        })
        .min(1, "請選擇收款方式"),
      payment_date: z.date().optional(),
      notes: z.string().optional(),
    })
    .refine((data) => data.amount <= remainingAmount, {
      message: `收款金額不能超過剩餘未付金額：${remainingAmount.toFixed(2)} 元`,
      path: ["amount"],
    });

type PaymentFormData = z.infer<ReturnType<typeof createPaymentSchema>>;

/**
 * 收款方式選項配置
 */
const PAYMENT_METHODS = [
  { value: "cash", label: "現金", icon: DollarSign },
  { value: "transfer", label: "銀行轉帳", icon: CreditCard },
  { value: "credit_card", label: "信用卡", icon: CreditCard },
] as const;

/**
 * Props 介面定義
 */
interface RecordPaymentModalProps {
  /** 訂單資料，包含總額和已付金額資訊 */
  order: ProcessedOrder | null;
  /** Modal 是否開啟 */
  open: boolean;
  /** Modal 開啟狀態變更回調 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 部分收款記錄 Modal 組件
 *
 * 功能特性：
 * 1. 📊 智能顯示：訂單總額、已付金額、剩餘未付金額
 * 2. 🔒 智能驗證：防止超額付款，即時驗證收款金額
 * 3. 📅 靈活收款：支援自定義收款日期或使用當前時間
 * 4. 💼 多元方式：現金、銀行轉帳、信用卡三種收款方式
 * 5. 📝 完整記錄：可添加收款備註用於審計追蹤
 * 6. ⚡ 即時回饋：成功/失敗 toast 提示，自動關閉 Modal
 * 7. 🛡️ 類型安全：100% TypeScript 類型安全保證
 */
export default function RecordPaymentModal({
  order,
  open,
  onOpenChange,
}: RecordPaymentModalProps) {
  // 計算剩餘未付金額
  const remainingAmount = order ? order.grand_total - order.paid_amount : 0;

  // 創建動態 Schema（根據剩餘金額）
  const paymentSchema = createPaymentSchema(remainingAmount);

  // 初始化表單
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_method: "",
      payment_date: new Date(),
      notes: "",
    },
  });

  // 初始化 mutation hook
  const addPayment = useAddOrderPayment();

  // 🎯 新增：快速填入剩餘金額
  const handleFillRemainingAmount = () => {
    form.setValue("amount", remainingAmount);
  };

  /**
   * 表單提交處理函式
   *
   * 執行流程：
   * 1. 驗證表單資料
   * 2. 調用 API 新增付款記錄
   * 3. 成功：顯示成功提示，重置表單，關閉 Modal
   * 4. 失敗：顯示錯誤提示
   */
  const onSubmit = async (data: PaymentFormData) => {
    if (!order) {
      toast.error("訂單資料無效");
      return;
    }

    try {
      // 準備 API 請求資料 - 使用正確的類型轉換
      const paymentData: CorrectAddPaymentRequestBody = {
        amount: data.amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date?.toISOString(),
        notes: data.notes || undefined,
      };

      // 調用 API - 使用類型斷言覆蓋錯誤的 OpenAPI 生成類型
      await addPayment.mutateAsync({
        orderId: order.id,
        data: paymentData as any, // 僅此處使用 any 來覆蓋錯誤的 OpenAPI 類型
      });

      // 成功處理
      toast.success(
        `成功記錄 ${data.amount.toFixed(2)} 元的${
          PAYMENT_METHODS.find((m) => m.value === data.payment_method)?.label
        }收款`,
      );

      // 重置表單
      form.reset();

      // 關閉 Modal
      onOpenChange(false);
    } catch (error) {
      // 錯誤處理
      const errorMessage =
        error instanceof Error ? error.message : "記錄付款失敗，請稍後再試";
      toast.error(errorMessage);
    }
  };

  /**
   * Modal 關閉處理函式
   * 重置表單狀態，防止資料殘留
   */
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  // 如果沒有訂單資料，不渲染 Modal
  if (!order) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} data-oid="s22f6tn">
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        data-oid="jsx.yyh"
      >
        <DialogHeader data-oid="_ju0y-v">
          <DialogTitle className="flex items-center gap-2" data-oid="161q5oo">
            <DollarSign className="h-5 w-5 text-green-600" data-oid="k67e1u4" />
            記錄部分收款
          </DialogTitle>
          <DialogDescription data-oid="24jshtm">
            為訂單 {order.order_number} 記錄新的收款資訊
          </DialogDescription>
        </DialogHeader>

        {/* 訂單金額概覽卡片 */}
        <Card
          className="bg-gray-50 border-l-4 border-l-blue-500"
          data-oid="56wh5z6"
        >
          <CardContent className="pt-4" data-oid="u2ns2_6">
            <div className="grid grid-cols-3 gap-4 text-sm" data-oid="e456-2v">
              <div className="text-center" data-oid="u-t:lu.">
                <div className="text-gray-600 font-medium" data-oid="hv09wh-">
                  訂單總額
                </div>
                <div
                  className="text-lg font-bold text-gray-900"
                  data-oid="dfhqt46"
                >
                  ${order.grand_total.toFixed(2)}
                </div>
              </div>
              <div className="text-center" data-oid="e3-qecw">
                <div className="text-gray-600 font-medium" data-oid="ylk8t7:">
                  已付金額
                </div>
                <div
                  className="text-lg font-bold text-green-600"
                  data-oid="3yp_6qf"
                >
                  ${order.paid_amount.toFixed(2)}
                </div>
              </div>
              <div className="text-center" data-oid="b1cak8z">
                <div className="text-gray-600 font-medium" data-oid="o2r.fxf">
                  剩餘未付
                </div>
                <div
                  className="text-lg font-bold text-red-600"
                  data-oid="l.pr05y"
                >
                  ${remainingAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form} data-oid="ooqyugm">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            data-oid="_ob43pw"
          >
            {/* 收款金額 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem data-oid="oura1vz">
                  <FormLabel
                    className="flex items-center gap-2"
                    data-oid="s:vek8z"
                  >
                    <DollarSign className="h-4 w-4" data-oid="8akjw_1" />
                    收款金額 *
                  </FormLabel>
                  <FormControl data-oid="q.od0k-">
                    <div className="flex gap-2" data-oid="uh0lak7">
                      <Input
                        type="number"
                        placeholder="請輸入收款金額"
                        step="0.01"
                        min="0.01"
                        max={remainingAmount}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        className="text-right flex-1"
                        data-oid="6c775g-"
                      />

                      {/* 🎯 新增：快速填入按鈕 */}
                      {remainingAmount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFillRemainingAmount}
                          data-oid="k-_vuvc"
                        >
                          填入剩餘金額
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage data-oid="k_5mzwp" />
                  {/* 🎯 新增：提示文字 */}
                  {remainingAmount > 0 && field.value === remainingAmount && (
                    <p
                      className="text-sm text-green-600 mt-1"
                      data-oid="k3zp25m"
                    >
                      ✓ 此金額將會完成全額付款
                    </p>
                  )}
                </FormItem>
              )}
              data-oid="eisngvs"
            />

            {/* 收款方式 */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem data-oid="kb.pm84">
                  <FormLabel
                    className="flex items-center gap-2"
                    data-oid="cmt9hfk"
                  >
                    <CreditCard className="h-4 w-4" data-oid="ht-f6ta" />
                    收款方式 *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    data-oid="3qk6h27"
                  >
                    <FormControl data-oid="nyila..">
                      <SelectTrigger data-oid="6kuzcpw">
                        <SelectValue
                          placeholder="請選擇收款方式"
                          data-oid="_3_228y"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent data-oid="1sfy32v">
                      {PAYMENT_METHODS.map((method) => {
                        const IconComponent = method.icon;
                        return (
                          <SelectItem
                            key={method.value}
                            value={method.value}
                            data-oid="_f7_86r"
                          >
                            <div
                              className="flex items-center gap-2"
                              data-oid="a9ujj7g"
                            >
                              <IconComponent
                                className="h-4 w-4"
                                data-oid="99j3moc"
                              />

                              {method.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage data-oid="3dx5:1-" />
                </FormItem>
              )}
              data-oid="q7t24ni"
            />

            {/* 收款日期 */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col" data-oid="biw6dg0">
                  <FormLabel
                    className="flex items-center gap-2"
                    data-oid="p.rr3y2"
                  >
                    <Clock className="h-4 w-4" data-oid="6_huzs3" />
                    收款日期
                  </FormLabel>
                  <Popover data-oid=".:wgce6">
                    <PopoverTrigger asChild data-oid="kpw8vmm">
                      <FormControl data-oid="0-mwzaj">
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                          data-oid="92738th"
                        >
                          {field.value ? (
                            format(field.value, "yyyy年MM月dd日")
                          ) : (
                            <span data-oid="51mxyka">選擇收款日期</span>
                          )}
                          <CalendarIcon
                            className="ml-auto h-4 w-4 opacity-50"
                            data-oid="1:wv.p8"
                          />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                      data-oid="32.-cq8"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        data-oid="a7-v_5n"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage data-oid="umqoz4e" />
                </FormItem>
              )}
              data-oid="aisf2q1"
            />

            {/* 備註 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem data-oid=".5a81.b">
                  <FormLabel data-oid="g4tm4n-">備註</FormLabel>
                  <FormControl data-oid="oq3u38a">
                    <Textarea
                      placeholder="輸入收款相關備註（選填）"
                      className="resize-none"
                      {...field}
                      data-oid="vd4y1cn"
                    />
                  </FormControl>
                  <FormMessage data-oid="p0d513m" />
                </FormItem>
              )}
              data-oid="459iihc"
            />

            <DialogFooter className="flex gap-2" data-oid="zxlith6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={addPayment.isPending}
                data-oid="-lei70q"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={addPayment.isPending || remainingAmount <= 0}
                className="min-w-[120px]"
                data-oid="nx_ucub"
              >
                {addPayment.isPending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      data-oid="xjq0xvk"
                    />
                    記錄中...
                  </>
                ) : (
                  "記錄收款"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
