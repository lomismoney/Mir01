'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Package, Link2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';

interface BindableOrder {
  id: number;
  order_number: string;
  customer_name: string;
  store_id: number;
  items: Array<{
    id: number;
    product_variant_id: number;
    pending_quantity: number;
    product_variant: {
      id: number;
      sku: string;
      name: string;
    };
  }>;
}

interface Purchase {
  id: number;
  order_number: string;
  store_id: number;
  status: string;
}

interface SelectedOrderItem {
  order_item_id: number;
  purchase_quantity: number;
}

const bindOrdersSchema = z.object({
  selectedItems: z.array(z.object({
    order_item_id: z.number(),
    purchase_quantity: z.number().min(1, '進貨數量必須大於 0'),
    max_quantity: z.number(),
  })).refine(
    (items) => items.length > 0,
    { message: '請至少選擇一個項目' }
  ).superRefine((items, ctx) => {
    items.forEach((item, index) => {
      if (item.purchase_quantity > item.max_quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `進貨數量不能超過待處理數量 ${item.max_quantity}`,
          path: [index, 'purchase_quantity'],
        });
      }
    });
  }),
});

type BindOrdersForm = z.infer<typeof bindOrdersSchema>;

interface BindOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase;
  onSuccess?: () => void;
}

export function BindOrdersDialog({
  open,
  onOpenChange,
  purchase,
  onSuccess,
}: BindOrdersDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [openOrders, setOpenOrders] = useState<number[]>([]);

  const form = useForm<BindOrdersForm>({
    resolver: zodResolver(bindOrdersSchema),
    defaultValues: {
      selectedItems: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'selectedItems',
  });

  // 獲取可綁定的訂單
  const { data: bindableOrdersData, isLoading } = useQuery({
    queryKey: ['bindable-orders', purchase.store_id],
    queryFn: async () => {
      const response = await apiClient.GET('/api/purchases/bindable-orders', {
        params: {
          query: {
            store_id: purchase.store_id,
          },
        },
      });
      return response;
    },
    enabled: open,
  });

  const bindableOrders = (bindableOrdersData?.data as BindableOrder[]) || [];

  // 過濾搜尋結果（性能優化）
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return bindableOrders;
    const term = searchTerm.toLowerCase();
    return bindableOrders.filter((order: BindableOrder) => {
      // 優先檢查訂單編號和客戶名稱（通常效率較高）
      if (order.order_number.toLowerCase().includes(term) ||
          order.customer_name.toLowerCase().includes(term)) {
        return true;
      }
      // 再檢查商品項目
      return order.items.some(item =>
        item.product_variant.name.toLowerCase().includes(term) ||
        item.product_variant.sku.toLowerCase().includes(term)
      );
    });
  }, [bindableOrders, searchTerm]);

  // 重置表單當對話框關閉時
  useEffect(() => {
    if (!open) {
      form.reset({
        selectedItems: [],
      });
      setSearchTerm('');
      setOpenOrders([]);
    }
  }, [open, form]);

  const bindOrdersMutation = useMutation({
    mutationFn: async (data: BindOrdersForm) => {
      const orderItems = data.selectedItems.map(item => ({
        order_item_id: item.order_item_id,
        purchase_quantity: item.purchase_quantity,
      }));

      const response = await apiClient.POST(`/api/purchases/${purchase.id}/bind-orders` as any, {
        body: {
          order_items: orderItems,
        },
      });

      return response;
    },
    onSuccess: () => {
      toast({
        title: '綁定成功',
        description: '訂單已成功綁定到進貨單',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: '綁定失敗',
        description: '訂單綁定失敗，請稍後再試',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BindOrdersForm) => {
    bindOrdersMutation.mutate(data);
  };

  const toggleOrder = (orderId: number) => {
    setOpenOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // 使用 Map 優化查找性能
  const selectedItemsMap = useMemo(() => {
    const map = new Map<number, number>();
    fields.forEach((field, index) => {
      map.set(field.order_item_id, index);
    });
    return map;
  }, [fields]);

  const handleItemSelection = (orderItem: BindableOrder['items'][0], checked: boolean) => {
    const currentIndex = selectedItemsMap.get(orderItem.id);

    if (checked && currentIndex === undefined) {
      // 添加項目
      append({
        order_item_id: orderItem.id,
        purchase_quantity: orderItem.pending_quantity,
        max_quantity: orderItem.pending_quantity,
      });
    } else if (!checked && currentIndex !== undefined) {
      // 移除項目
      remove(currentIndex);
    }
  };

  const isItemSelected = (orderItemId: number) => {
    return selectedItemsMap.has(orderItemId);
  };

  const getSelectedItemIndex = (orderItemId: number) => {
    return selectedItemsMap.get(orderItemId) ?? -1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            綁定訂單
          </DialogTitle>
          <DialogDescription>
            進貨單：{purchase.order_number} - 選擇要綁定的訂單項目
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 搜尋欄位 */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋訂單編號或客戶名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* 載入狀態 */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="text-muted-foreground">載入中...</div>
              </div>
            )}

            {/* 沒有可綁定訂單 */}
            {!isLoading && filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">
                  {searchTerm ? '沒有找到符合條件的訂單' : '沒有找到可綁定的訂單'}
                </div>
              </div>
            )}

            {/* 可綁定訂單列表 */}
            {!isLoading && filteredOrders.length > 0 && (
              <div className="space-y-2">
                {filteredOrders.map((order: BindableOrder) => {
                  const isOpen = openOrders.includes(order.id);
                  
                  return (
                    <Collapsible
                      key={order.id}
                      open={isOpen}
                      onOpenChange={() => toggleOrder(order.id)}
                    >
                      <div className="rounded-lg border bg-card">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              
                              <div>
                                <div className="font-medium">{order.order_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.customer_name}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                {order.items.length} 個項目
                              </Badge>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="border-t">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">選擇</TableHead>
                                  <TableHead>商品名稱</TableHead>
                                  <TableHead>SKU</TableHead>
                                  <TableHead className="text-right">待處理數量</TableHead>
                                  <TableHead className="text-right">進貨數量</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map((item) => {
                                  const selectedIndex = getSelectedItemIndex(item.id);
                                  const isSelected = selectedIndex !== -1;

                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => 
                                            handleItemSelection(item, checked as boolean)
                                          }
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {item.product_variant.name}
                                      </TableCell>
                                      <TableCell>
                                        <code className="text-sm">{item.product_variant.sku}</code>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {item.pending_quantity}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {isSelected && (
                                          <FormField
                                            control={form.control}
                                            name={`selectedItems.${selectedIndex}.purchase_quantity`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormControl>
                                                  <Input
                                                    type="number"
                                                    min="1"
                                                    max={item.pending_quantity}
                                                    className="w-20 text-right"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}

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
                disabled={fields.length === 0 || bindOrdersMutation.isPending}
              >
                {bindOrdersMutation.isPending ? '綁定中...' : '綁定選擇的項目'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}