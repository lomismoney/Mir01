"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarIcon, Loader2, DollarSign, CreditCard, Clock } from 'lucide-react';
import { format } from 'date-fns';

import { ProcessedOrder } from '@/types/api-helpers';
import { useAddOrderPayment } from '@/hooks/queries/useEntityQueries';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
const createPaymentSchema = (remainingAmount: number) => z.object({
  amount: z
    .number({
      required_error: '收款金額是必填項目',
      invalid_type_error: '收款金額必須是數字',
    })
    .min(0.01, '收款金額必須大於 0'),
  payment_method: z
    .string({
      required_error: '收款方式是必填項目',
    })
    .min(1, '請選擇收款方式'),
  payment_date: z
    .date()
    .optional(),
  notes: z
    .string()
    .optional(),
}).refine(
  (data) => data.amount <= remainingAmount,
  {
    message: `收款金額不能超過剩餘未付金額：${remainingAmount.toFixed(2)} 元`,
    path: ['amount'],
  }
);

type PaymentFormData = z.infer<ReturnType<typeof createPaymentSchema>>;

/**
 * 收款方式選項配置
 */
const PAYMENT_METHODS = [
  { value: 'cash', label: '現金', icon: DollarSign },
  { value: 'transfer', label: '銀行轉帳', icon: CreditCard },
  { value: 'credit_card', label: '信用卡', icon: CreditCard },
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
      payment_method: '',
      payment_date: new Date(),
      notes: '',
    },
  });

  // 初始化 mutation hook
  const addPayment = useAddOrderPayment();

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
      toast.error('訂單資料無效');
      return;
    }

    try {
      // 準備 API 請求資料
      const paymentData = {
        amount: data.amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date,
        notes: data.notes || undefined,
      };

      // 調用 API
      await addPayment.mutateAsync({
        orderId: order.id,
        data: paymentData,
      });

      // 成功處理
      toast.success(
        `成功記錄 ${data.amount.toFixed(2)} 元的${
          PAYMENT_METHODS.find(m => m.value === data.payment_method)?.label
        }收款`
      );
      
      // 重置表單
      form.reset();
      
      // 關閉 Modal
      onOpenChange(false);
      
    } catch (error) {
      // 錯誤處理
      const errorMessage = error instanceof Error 
        ? error.message 
        : '記錄付款失敗，請稍後再試';
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            記錄部分收款
          </DialogTitle>
          <DialogDescription>
            為訂單 {order.order_number} 記錄新的收款資訊
          </DialogDescription>
        </DialogHeader>

        {/* 訂單金額概覽卡片 */}
        <Card className="bg-gray-50 border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600 font-medium">訂單總額</div>
                <div className="text-lg font-bold text-gray-900">
                  ${order.grand_total.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 font-medium">已付金額</div>
                <div className="text-lg font-bold text-green-600">
                  ${order.paid_amount.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 font-medium">剩餘未付</div>
                <div className="text-lg font-bold text-red-600">
                  ${remainingAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 收款金額 */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    收款金額 *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="請輸入收款金額"
                      step="0.01"
                      min="0.01"
                      max={remainingAmount}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="text-right"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 收款方式 */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    收款方式 *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇收款方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => {
                        const IconComponent = method.icon;
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {method.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 收款日期 */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    收款日期
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'yyyy年MM月dd日')
                          ) : (
                            <span>選擇收款日期</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 備註 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="輸入收款相關備註（選填）"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={addPayment.isPending}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={addPayment.isPending || remainingAmount <= 0}
                className="min-w-[120px]"
              >
                {addPayment.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    記錄中...
                  </>
                ) : (
                  '記錄收款'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 