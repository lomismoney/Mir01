'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { MoneyHelper } from '@/lib/money-helper';
import { zhTW } from 'date-fns/locale';
import { Calendar, Package } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';
import { BatchSelectableItem } from '@/hooks/useBatchSelection';

const createPurchaseSchema = z.object({
  purchased_at: z.date({
    required_error: '請選擇進貨日期',
  }),
  shipping_cost: z.number().min(0, '運費不能為負數'),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_variant_id: z.number(),
    quantity: z.number().min(1),
    cost_price: z.number().min(0, '成本價不能為負數'),
  })),
});

type CreatePurchaseForm = z.infer<typeof createPurchaseSchema>;

interface CreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: BatchSelectableItem[];
  onSuccess?: () => void;
}

export function CreatePurchaseDialog({
  open,
  onOpenChange,
  selectedItems,
  onSuccess,
}: CreatePurchaseDialogProps) {
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<CreatePurchaseForm>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      purchased_at: new Date(),
      shipping_cost: 0,
      notes: '',
      items: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 當選擇的項目改變時，更新表單
  useEffect(() => {
    if (selectedItems.length > 0) {
      const items = selectedItems.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        cost_price: 0,
      }));
      replace(items);
    }
  }, [selectedItems, replace]);

  // 重置表單當對話框關閉時
  useEffect(() => {
    if (!open) {
      form.reset({
        purchased_at: new Date(),
        shipping_cost: 0,
        notes: '',
        items: [],
      });
    }
  }, [open, form]);

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: CreatePurchaseForm) => {
      const store_id = selectedItems[0]?.store_id || 1; // 使用第一個項目的門市ID，或預設為1
      
      const payload = {
        store_id,
        purchased_at: data.purchased_at.toISOString(),
        shipping_cost: data.shipping_cost,
        notes: data.notes,
        order_items: selectedItems.map(item => ({
          order_item_id: item.id,
          purchase_quantity: item.quantity,
        })),
        items: data.items,
      };

      const response = await apiClient.POST('/api/purchases', {
        body: payload,
      });

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: '建立成功',
        description: '進貨單已成功建立',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: '建立失敗',
        description: '進貨單建立失敗，請稍後再試',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreatePurchaseForm) => {
    createPurchaseMutation.mutate(data);
  };

  // 監聽表單值變化以計算總成本
  const watchedItems = form.watch('items');
  const watchedShippingCost = form.watch('shipping_cost');
  
  // 計算總成本
  const totalCost = useMemo(() => {
    if (!watchedItems || !selectedItems.length) return 0;
    
    const itemsTotal = watchedItems.reduce((total, item, index) => {
      const selectedItem = selectedItems[index];
      if (!selectedItem) return total;
      const cost = item?.cost_price || 0;
      const quantity = selectedItem.quantity;
      return total + (cost * quantity);
    }, 0);

    return itemsTotal + (watchedShippingCost || 0);
  }, [watchedItems, watchedShippingCost, selectedItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            建立進貨單
          </DialogTitle>
          <DialogDescription>
            基於選擇的待進貨項目建立新的進貨單
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 選擇項目摘要 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">選擇項目摘要</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>選擇項目：{selectedItems.length} 個商品</span>
                  <span>
                    總數量：{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedItems.map(item => (
                  <Badge key={item.id} variant="secondary" className="text-sm">
                    {item.product_name} ({item.sku})
                  </Badge>
                ))}
              </div>
            </div>

            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchased_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>進貨日期</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: zhTW })
                            ) : (
                              <span>請選擇日期</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipping_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>運費成本</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="輸入進貨備註..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 項目詳細資訊 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">項目詳細資訊</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名稱</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">數量</TableHead>
                    <TableHead className="text-right">成本價格</TableHead>
                    <TableHead className="text-right">小計</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const selectedItem = selectedItems[index];
                    if (!selectedItem) return null;

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {selectedItem.product_name}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{selectedItem.sku}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          {selectedItem.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <FormField
                            control={form.control}
                            name={`items.${index}.cost_price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24 text-right"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {MoneyHelper.format((watchedItems?.[index]?.cost_price || 0) * selectedItem.quantity)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* 總成本 */}
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                總成本：{MoneyHelper.format(totalCost)}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={selectedItems.length === 0 || createPurchaseMutation.isPending}
              >
                {createPurchaseMutation.isPending ? '建立中...' : '建立進貨單'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}