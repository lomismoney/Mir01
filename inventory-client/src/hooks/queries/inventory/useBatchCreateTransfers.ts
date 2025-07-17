import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface TransferItem {
  from_store_id: number;
  to_store_id: number;
  product_variant_id: number;
  quantity: number;
  notes?: string;
  status?: 'pending' | 'completed';
}

interface BatchTransferRequest {
  transfers: TransferItem[];
  order_id?: number;
}

interface BatchTransferResponse {
  data: any[];
  message: string;
}

/**
 * Hook for creating multiple inventory transfers at once
 */
export function useBatchCreateTransfers() {
  const queryClient = useQueryClient();

  return useMutation<BatchTransferResponse, Error, BatchTransferRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.POST("/api/inventory/transfers/batch", {
        body: data,
      });

      if (!response.data) {
        throw new Error("Failed to create inventory transfers");
      }

      return response as unknown as BatchTransferResponse;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      toast.success(data.message || "庫存轉移單建立成功");
    },
    onError: (error) => {
      console.error("❌ Batch transfer creation failed:", error);
      toast.error("建立庫存轉移失敗", {
        description: error.message || "請稍後再試",
      });
    },
  });
}

export type { TransferItem, BatchTransferRequest };