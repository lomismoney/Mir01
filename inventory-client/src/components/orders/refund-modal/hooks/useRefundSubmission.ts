import { toast } from "sonner";
import { useCreateRefund } from "@/hooks";
import { ProcessedOrder } from "@/types/api-helpers";
import { RefundFormValues } from "./useRefundForm";
import { UseFormReturn } from "react-hook-form";

interface UseRefundSubmissionProps {
  fullOrder: ProcessedOrder | null;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RefundFormValues>;
}

export function useRefundSubmission({
  fullOrder,
  onOpenChange,
  form,
}: UseRefundSubmissionProps) {
  const createRefundMutation = useCreateRefund();

  // 簡化提交處理邏輯
  const handleSubmit = (data: RefundFormValues) => {
    if (!fullOrder) {
      toast.error("訂單資料不存在，無法處理退款");
      return;
    }

    // 簡化選中項目過濾
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

    // 簡化退款資料結構
    const refundData = {
      reason: data.reason,
      notes: data.notes || undefined,
      should_restock: data.should_restock,
      items: selectedItems,
    };

    // 執行退款API調用
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

  return {
    handleSubmit,
    isSubmitting: createRefundMutation.isPending,
  };
}