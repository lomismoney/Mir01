'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck } from 'lucide-react';
import { useUpdateBackorderTransferStatus } from '@/hooks/mutations/backorders/useUpdateBackorderTransferStatus';

interface BackorderItem {
  id: number;
  product_name: string;
  sku: string;
  quantity: number;
  integrated_status?: string;
  integrated_status_text?: string;
  transfer?: {
    id: number;
    status: string;
  };
}

interface BackorderStatusDialogProps {
  item: BackorderItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface StatusUpdateFormValues {
  status: string;
  notes: string;
}

export function BackorderStatusDialog({
  item,
  open,
  onOpenChange,
  onSuccess,
}: BackorderStatusDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateStatusMutation = useUpdateBackorderTransferStatus();

  const form = useForm<StatusUpdateFormValues>({
    defaultValues: {
      status: '',
      notes: '',
    },
  });

  // 重置表單當 item 改變
  useEffect(() => {
    if (item && item.transfer) {
      form.setValue('status', item.transfer.status || 'pending');
    }
  }, [item, form]);

  const getAvailableStatuses = () => {
    const currentStatus = item?.transfer?.status || 'pending';
    
    const allStatuses = [
      { value: 'pending', label: '待處理', icon: Package },
      { value: 'in_transit', label: '運送中', icon: Truck },
      { value: 'completed', label: '已完成', icon: Package },
      { value: 'cancelled', label: '已取消', icon: Package },
    ];

    // 根據當前狀態限制可選的狀態
    switch (currentStatus) {
      case 'pending':
        return allStatuses.filter((s) =>
          ['pending', 'in_transit', 'completed', 'cancelled'].includes(s.value)
        );
      case 'in_transit':
        return allStatuses.filter((s) =>
          ['in_transit', 'completed', 'cancelled'].includes(s.value)
        );
      case 'completed':
        return allStatuses.filter((s) => s.value === 'completed');
      case 'cancelled':
        return allStatuses.filter((s) => s.value === 'cancelled');
      default:
        return allStatuses;
    }
  };

  const onSubmit = async (data: StatusUpdateFormValues) => {
    if (!item || !item.transfer) {
      toast({
        variant: 'destructive',
        title: '錯誤',
        description: '此項目沒有相關的庫存轉移記錄',
      });
      return;
    }

    setIsSubmitting(true);

    updateStatusMutation.mutate(
      {
        item_id: item.id,
        status: data.status,
        notes: data.notes || undefined,
      },
      {
        onSuccess: (response) => {
          toast({
            title: '成功',
            description: '轉移狀態已更新',
          });
          form.reset();
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            variant: 'destructive',
            title: '錯誤',
            description: error instanceof Error ? error.message : '更新失敗',
          });
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>更新轉移狀態</DialogTitle>
          <DialogDescription>
            更新此商品的庫存轉移狀態
          </DialogDescription>
        </DialogHeader>
        
        {item && (
          <div className="mb-4 space-y-1">
            <div className="font-medium">{item.product_name} - {item.sku}</div>
            <div className="text-sm text-muted-foreground">數量: {item.quantity}</div>
            {item.integrated_status_text && (
              <Badge variant="outline" className="mt-1">
                {item.integrated_status_text}
              </Badge>
            )}
          </div>
        )}

        {item?.transfer ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新狀態</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStatuses.map((status) => {
                          const Icon = status.icon;
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {status.label}
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備註</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="輸入狀態變更的備註..."
                        disabled={isSubmitting}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  更新狀態
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            此項目沒有相關的庫存轉移記錄
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}