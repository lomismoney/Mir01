"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { InventoryTransferItem } from "@/types/api-helpers";
import { useUpdateInventoryTransferStatus } from "@/hooks/queries/useEntityQueries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface TransferStatusEditDialogProps {
  transfer: InventoryTransferItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface StatusEditFormValues {
  status: string;
  notes: string;
}

export function TransferStatusEditDialog({
  transfer,
  open,
  onOpenChange,
  onSuccess,
}: TransferStatusEditDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StatusEditFormValues>({
    defaultValues: {
      status: transfer.status || "",
      notes: transfer.notes || "",
    },
  });

  const updateStatusMutation = useUpdateInventoryTransferStatus();

  const getAvailableStatuses = (currentStatus: string) => {
    const allStatuses = [
      { value: "pending", label: "待處理" },
      { value: "in_transit", label: "運送中" },
      { value: "completed", label: "已完成" },
      { value: "cancelled", label: "已取消" },
    ];

    // 根據當前狀態限制可選的狀態
    switch (currentStatus) {
      case "pending":
        return allStatuses.filter((s) =>
          ["pending", "in_transit", "completed", "cancelled"].includes(s.value),
        );
      case "in_transit":
        return allStatuses.filter((s) =>
          ["in_transit", "completed", "cancelled"].includes(s.value),
        );
      case "completed":
        return allStatuses.filter((s) => s.value === "completed"); // 已完成不能更改
      case "cancelled":
        return allStatuses.filter((s) => s.value === "cancelled"); // 已取消不能更改
      default:
        return allStatuses;
    }
  };

  const onSubmit = (data: StatusEditFormValues) => {
    if (data.status === transfer.status && data.notes === transfer.notes) {
      toast({
        title: "沒有變更",
        description: "狀態和備註都沒有變更",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    updateStatusMutation.mutate(
      {
        id: transfer.id!,
        status: data.status,
        notes: data.notes,
      },
      {
        onSuccess: () => {
          toast({
            title: "成功",
            description: "轉移狀態已更新",
          });
          setIsSubmitting(false);
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: `更新轉移狀態失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
          });
          setIsSubmitting(false);
        },
      },
    );
  };

  const getStatusChangeDescription = (fromStatus: string, toStatus: string) => {
    if (fromStatus === toStatus) return "";

    const descriptions: Record<string, string> = {
      pending_to_in_transit: "貨物開始運送，將扣減來源門市庫存",
      pending_to_completed: "直接完成轉移，將執行完整的庫存轉移操作",
      pending_to_cancelled: "取消此次轉移",
      in_transit_to_completed: "貨物已到達，將增加目標門市庫存",
      in_transit_to_cancelled: "取消轉移並恢復來源門市庫存",
    };

    return descriptions[`${fromStatus}_to_${toStatus}`] || "";
  };

  const availableStatuses = getAvailableStatuses(transfer.status || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="oimh2ym">
      <DialogContent className="max-w-md" data-oid="vocpds7">
        <DialogHeader data-oid="wylpq0r">
          <DialogTitle data-oid="q8jg0a0">編輯轉移狀態</DialogTitle>
          <DialogDescription data-oid="ggv8w2b">
            轉移單號 #{transfer.id} - 產品 #{transfer.product_variant_id}
          </DialogDescription>
        </DialogHeader>

        <Form {...form} data-oid="154gi6k">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-oid="vuxd.pa"
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem data-oid="73ea6fm">
                  <FormLabel data-oid="u3s2fyl">狀態</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                    data-oid="-9p8t8."
                  >
                    <FormControl data-oid="qoe.5na">
                      <SelectTrigger data-oid="myam3fr">
                        <SelectValue data-oid="cr8g9c_" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent data-oid="stu_f30">
                      {availableStatuses.map((status) => (
                        <SelectItem
                          key={status.value}
                          value={status.value}
                          data-oid="w6t96f3"
                        >
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.watch("status") !== transfer.status && (
                    <p
                      className="text-sm text-muted-foreground"
                      data-oid="ph-v1l0"
                    >
                      {getStatusChangeDescription(
                        transfer.status || "",
                        form.watch("status"),
                      )}
                    </p>
                  )}
                  <FormMessage data-oid="8quywa6" />
                </FormItem>
              )}
              data-oid="_2pgij:"
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem data-oid="gp8kk.r">
                  <FormLabel data-oid="okumk.b">備註</FormLabel>
                  <FormControl data-oid="_j65y:l">
                    <Textarea
                      {...field}
                      placeholder="輸入狀態變更的備註資訊"
                      disabled={isSubmitting}
                      rows={3}
                      data-oid="g53_-ge"
                    />
                  </FormControl>
                  <FormMessage data-oid="mz21slb" />
                </FormItem>
              )}
              data-oid="dnq69fx"
            />

            <div className="flex justify-end gap-2" data-oid="d3xolk.">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-oid="zln0bfb"
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting} data-oid="wqr3e_v">
                {isSubmitting && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="howpdqu"
                  />
                )}
                更新狀態
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
