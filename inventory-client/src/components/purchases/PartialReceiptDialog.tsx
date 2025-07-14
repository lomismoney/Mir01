"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePartialReceipt } from "@/hooks/queries/purchases/usePurchases";
import { useErrorHandler } from "@/hooks";
import { 
  Package, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Plus,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

// 定義表單驗證 schema
const partialReceiptSchema = z.object({
  items: z.array(z.object({
    purchase_item_id: z.number(),
    received_quantity: z.number().min(0, "收貨數量不能為負數"),
    max_quantity: z.number(),
    product_info: z.object({
      name: z.string(),
      sku: z.string(),
    }),
  })).min(1, "至少需要一個收貨項目"),
  notes: z.string().max(1000, "備註不能超過1000個字符").optional(),
});

type PartialReceiptFormData = z.infer<typeof partialReceiptSchema>;

interface PurchaseItemWithDetails {
  id: number;
  quantity: number;
  received_quantity?: number;
  receipt_status?: string;
  cost_price: number;
  // 回退字段（扁平結構）
  product_name?: string;
  sku?: string;
  // 嵌套結構（優先使用）
  product_variant?: {
    id: number;
    sku: string;
    product?: {
      id: number;
      name: string;
    };
  };
}

interface PartialReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: {
    id: number;
    order_number: string;
    status: string;
    items: PurchaseItemWithDetails[];
  } | null;
  onSuccess?: () => void;
}

/**
 * 部分收貨對話框組件
 * 
 * 允許用戶為進貨單的每個項目指定實際收到的數量
 */
export function PartialReceiptDialog({
  isOpen,
  onClose,
  purchase,
  onSuccess,
}: PartialReceiptDialogProps) {
  const { handleError, handleSuccess } = useErrorHandler();
  const partialReceiptMutation = usePartialReceipt();

  // 初始化表單
  const form = useForm<PartialReceiptFormData>({
    resolver: zodResolver(partialReceiptSchema),
    defaultValues: {
      items: [],
      notes: "",
    },
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 🎯 監聽表單值變化，實時計算統計數據
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  // 計算統計資料（基於實時表單值）
  const stats = React.useMemo(() => {
    if (!watchedItems || !fields.length) {
      return {
        totalItems: 0,
        receivedItems: 0,
        fullyReceivedItems: 0,
        partiallyReceivedItems: 0,
        progressPercentage: 0,
      };
    }

    const totalItems = fields.length;
    const receivedItems = watchedItems.filter(item => (item?.received_quantity || 0) > 0).length;
    
    const fullyReceivedItems = watchedItems.filter((item, index) => 
      (item?.received_quantity || 0) === fields[index].max_quantity
    ).length;
    
    const partiallyReceivedItems = watchedItems.filter((item, index) => {
      const receivedQty = item?.received_quantity || 0;
      const maxQty = fields[index].max_quantity;
      return receivedQty > 0 && receivedQty < maxQty;
    }).length;

    return {
      totalItems,
      receivedItems,
      fullyReceivedItems,
      partiallyReceivedItems,
      progressPercentage: totalItems > 0 ? (receivedItems / totalItems) * 100 : 0,
    };
  }, [watchedItems, fields]);

  // 當進貨單資料變更時，更新表單
  useEffect(() => {
    if (purchase?.items) {
      const formItems = purchase.items.map(item => ({
        purchase_item_id: item.id,
        received_quantity: item.received_quantity || 0,
        max_quantity: item.quantity,
        product_info: {
          // 優先使用嵌套結構，回退到扁平結構
          name: item.product_variant?.product?.name || item.product_name || '未知商品',
          sku: item.product_variant?.sku || item.sku || '未知SKU',
        },
      }));
      
      form.setValue("items", formItems);
    }
  }, [purchase, form]);

  // 處理表單提交
  const onSubmit = async (data: PartialReceiptFormData) => {
    if (!purchase) return;

    const receiptData = {
      items: data.items.map(item => ({
        purchase_item_id: item.purchase_item_id,
        received_quantity: item.received_quantity,
      })),
      notes: data.notes || undefined,
    };

    try {
      await partialReceiptMutation.mutateAsync({
        id: purchase.id,
        receiptData,
      });
      
      handleSuccess("部分收貨處理成功");
      onSuccess?.();
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  // 更新單個項目的收貨數量
  const updateItemQuantity = (index: number, delta: number) => {
    const currentItem = fields[index];
    const newQuantity = Math.max(0, Math.min(
      currentItem.max_quantity,
      currentItem.received_quantity + delta
    ));
    
    // 🎯 同時更新 useFieldArray 和表單控制器
    update(index, {
      ...currentItem,
      received_quantity: newQuantity,
    });
    
    // 🔄 同步更新表單控制器的值，確保 UI 反映變化
    form.setValue(`items.${index}.received_quantity`, newQuantity);
  };

  // 快速設定選項
  const setAllQuantities = (type: 'all' | 'none') => {
    fields.forEach((field, index) => {
      const newQuantity = type === 'all' ? field.max_quantity : 0;
      
      // 🎯 同時更新 useFieldArray 和表單控制器
      update(index, {
        ...field,
        received_quantity: newQuantity,
      });
      
      // 🔄 同步更新表單控制器的值，確保 UI 反映變化
      form.setValue(`items.${index}.received_quantity`, newQuantity);
    });
  };

  if (!purchase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 標題區域 */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-200">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                部分收貨處理
              </DialogTitle>
              <DialogDescription className="mt-1">
                進貨單 #{purchase.order_number} - 請輸入每個項目實際收到的數量
              </DialogDescription>
            </div>
          </div>

          {/* 統計資訊 */}
          <div className="mt-4 p-3 bg-muted/30 dark:bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">整體收貨進度</span>
              <span className="text-sm text-muted-foreground">
                {stats.receivedItems}/{stats.totalItems} 項目
              </span>
            </div>
            <Progress value={stats.progressPercentage} className="h-2 bg-muted dark:bg-muted/50" />
            <div className="flex gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300">完全收貨: {stats.fullyReceivedItems}</span>
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-700 dark:text-orange-300">部分收貨: {stats.partiallyReceivedItems}</span>
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* 表單內容 */}
        <div className="flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 快速操作 */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllQuantities('all')}
                >
                  全部收貨
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllQuantities('none')}
                >
                  全部清零
                </Button>
              </div>

              <Separator />

              {/* 收貨項目列表 */}
              <div className="space-y-4">
                {fields.map((field, index) => {
                  return (
                    <div key={field.purchase_item_id} className="border border-border dark:border-border/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {field.product_info.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            SKU: {field.product_info.sku}
                          </p>
                        </div>
                      </div>

                      {/* 數量調整 */}
                      <FormField
                        control={form.control}
                        name={`items.${index}.received_quantity`}
                        render={({ field: formField }) => {
                          // 🎯 基於表單控制器的實時值計算進度
                          const currentQuantity = formField.value || 0;
                          const progress = field.max_quantity > 0 ? 
                            (currentQuantity / field.max_quantity) * 100 : 0;
                          
                          return (
                            <FormItem>
                              {/* 🔄 更新後的進度條和徽章 */}
                              <div className="flex items-center justify-between mb-3">
                                <FormLabel className="text-xs text-muted-foreground">收貨數量</FormLabel>
                                <Badge 
                                  variant={
                                    progress === 100 ? "default" :
                                    progress > 0 ? "secondary" : "outline"
                                  }
                                  className={cn(
                                    "text-xs",
                                    progress === 100 && "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600",
                                    progress > 0 && progress < 100 && "bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-700"
                                  )}
                                >
                                  {progress === 100 ? "完全收貨" :
                                   progress > 0 ? "部分收貨" : "未收貨"}
                                </Badge>
                              </div>

                              {/* 進度條 */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1 text-muted-foreground">
                                  <span>收貨進度</span>
                                  <span className="font-medium text-foreground">{currentQuantity}/{field.max_quantity}</span>
                                </div>
                                <Progress value={progress} className="h-1.5 bg-muted dark:bg-muted/50" />
                              </div>

                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, -1)}
                                    disabled={formField.value <= 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    {...formField}
                                    type="number"
                                    min={0}
                                    max={field.max_quantity}
                                    className="w-20 text-center"
                                    onChange={(e) => {
                                      const value = Math.max(0, Math.min(
                                        field.max_quantity,
                                        parseInt(e.target.value) || 0
                                      ));
                                      formField.onChange(value);
                                      update(index, { ...field, received_quantity: value });
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateItemQuantity(index, 1)}
                                    disabled={formField.value >= field.max_quantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    / {field.max_quantity}
                                  </span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 備註 */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>收貨備註</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="請輸入收貨備註（如：包裝破損、商品瑕疵等）"
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* 底部按鈕 */}
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={partialReceiptMutation.isPending}
          >
            {partialReceiptMutation.isPending ? (
              <>
                <Truck className="mr-2 h-4 w-4 animate-spin" />
                處理中...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                確認收貨
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 