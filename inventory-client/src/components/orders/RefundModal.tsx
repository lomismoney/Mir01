"use client";

import React, { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator, Package, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

// Hooks and API
import { useCreateRefund } from '@/hooks/queries/useEntityQueries';

// Types
import { ProcessedOrder, ProcessedOrderItem } from '@/types/api-helpers';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  reason: z.string().min(10, "退款原因至少需要 10 個字符").max(500, "退款原因不能超過 500 個字符"),
  notes: z.string().optional(),
  should_restock: z.boolean(),
  items: z.array(z.object({
    order_item_id: z.number(),
    quantity: z.number().min(1, "退貨數量必須大於 0"),
    product_name: z.string().optional(),
    sku: z.string().optional(),
    price: z.number().optional(),
    max_quantity: z.number().optional(),
    is_selected: z.boolean(),
  })).min(1, "至少必須選擇一項退款商品"),
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
 * RefundModal 組件 - 退款處理系統 (標準化重構版)
 * 
 * 🎯 功能特性：
 * 1. 使用 useFieldArray 管理動態品項列表
 * 2. 完全遵循 react-hook-form 最佳實踐
 * 3. 統一的表單狀態管理
 * 4. 類型安全保證，移除所有 any 類型
 * 5. 實時退款金額計算
 * 6. 智能數量驗證和限制
 */
export default function RefundModal({ order, open, onOpenChange }: RefundModalProps) {
  // 🎯 表單狀態管理 - 統一由 react-hook-form 管理
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(RefundFormSchema),
    defaultValues: {
      reason: '',
      notes: '',
      should_restock: false,
      items: [],
    },
  });

  // 🎯 動態品項陣列管理 - 使用官方標準 useFieldArray
  const { fields, replace, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 🎯 退款 Mutation Hook
  const createRefundMutation = useCreateRefund();

  // 🎯 監聽表單中的品項變化，計算總退款金額
  const watchedItems = form.watch("items");
  const calculateTotalRefund = (): number => {
    return watchedItems
      .filter(item => item.is_selected)
      .reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
  };

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
    if (!order) return;

    // 過濾出選中的品項並構建退款數據
    const selectedItems = data.items
      .filter(item => item.is_selected)
      .map(item => ({
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

    // 🎉 移除 as any - 現在類型完全安全
    createRefundMutation.mutate(
      { orderId: order.id, data: refundData },
      {
        onSuccess: () => {
          toast.success("退款已成功處理");
          onOpenChange(false);
          form.reset();
        },
        onError: (error) => {
          toast.error(`處理失敗: ${error.message}`);
        },
      }
    );
  };

  // 🎯 初始化品項列表 - 當訂單變更時
  useEffect(() => {
    if (open && order && order.items) {
      const formattedItems: RefundFormItem[] = order.items.map(item => ({
        order_item_id: item.id,
        quantity: 0,
        product_name: item.product_name,
        sku: item.sku,
        price: item.price,
        max_quantity: item.quantity,
        is_selected: false,
      }));
      
      replace(formattedItems);
      form.setValue("reason", "");
      form.setValue("notes", "");
      form.setValue("should_restock", false);
    }
  }, [open, order, replace, form]);

  // 🎯 重置表單狀態
  useEffect(() => {
    if (!open) {
      form.reset();
      replace([]);
    }
  }, [open, form, replace]);

  // 如果沒有訂單數據，不渲染 Modal
  if (!order) return null;

  const totalRefund = calculateTotalRefund();
  const selectedCount = watchedItems.filter(item => item.is_selected).length;
  const totalSelectedQuantity = watchedItems
    .filter(item => item.is_selected)
    .reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <RotateCcw className="h-5 w-5" />
            處理訂單退款
          </DialogTitle>
          <DialogDescription>
            訂單編號：{order.order_number} | 客戶：{order.customer?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 🎯 品項退款表格 - 使用 useFieldArray 管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                選擇退款品項
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">退款</TableHead>
                    <TableHead>品項資訊</TableHead>
                    <TableHead className="w-24">已購數量</TableHead>
                    <TableHead className="w-32">退貨數量</TableHead>
                    <TableHead className="w-24">單價</TableHead>
                    <TableHead className="w-24">退款小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const isSelected = item?.is_selected || false;
                    const quantity = item?.quantity || 0;
                    const subtotal = isSelected ? (item?.price || 0) * quantity : 0;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleItemSelect(index, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{field.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {field.sku}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {field.max_quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${index}.quantity`}
                            control={form.control}
                            render={({ field: quantityField }) => (
                              <Input
                                type="number"
                                min="1"
                                max={field.max_quantity}
                                value={isSelected ? quantityField.value : ''}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 1;
                                  quantityField.onChange(newQuantity);
                                  handleQuantityChange(index, newQuantity);
                                }}
                                disabled={!isSelected}
                                className="w-20 text-right"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-right font-medium">
                            ${(field.price || 0).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right font-medium text-red-600">
                            ${subtotal.toFixed(2)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 🎯 退款選項與總覽 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側：退款原因和庫存處理 */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  退款原因 <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="reason"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Textarea
                        {...field}
                        id="reason"
                        placeholder="請詳細說明退款原因..."
                        className="mt-1 min-h-[100px]"
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-500 mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
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
                      className="mt-1"
                    />
                  )}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="should_restock"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="restock"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="restock" className="text-sm">
                  📦 將退貨商品加回庫存
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                勾選此選項將自動將退貨商品數量加回相應的庫存
              </p>
            </div>

            {/* 右側：退款總額計算 */}
            <div>
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Calculator className="h-4 w-4" />
                    退款金額計算
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>選中品項：</span>
                    <span className="font-medium">{selectedCount} 項</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>退貨總數量：</span>
                    <span className="font-medium">{totalSelectedQuantity} 件</span>
                  </div>
                  <hr className="border-orange-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-orange-700">預計退款金額：</span>
                    <span className="text-xl font-bold text-red-600">
                      ${totalRefund.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 🎯 底部操作按鈕 */}
          <DialogFooter className="pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createRefundMutation.isPending}
            >
              取消
            </Button>
            <Button 
              type="submit"
              disabled={selectedCount === 0 || createRefundMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createRefundMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : (
                '確認退款'
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
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 2,
  }).format(amount);
} 