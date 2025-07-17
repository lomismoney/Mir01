import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface CheckStockRequest {
  store_id: number;
  items: Array<{
    product_variant_id: number;
    quantity: number;
  }>;
}

export interface StockSuggestion {
  product_variant_id: number;
  product_name: string;
  sku: string;
  requested_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  type: 'sufficient' | 'transfer' | 'purchase' | 'mixed';
  current_store_stock: number;
  shortage: number;
  transfers?: Array<{
    from_store_id: number;
    from_store_name: string;
    available_quantity: number;
    suggested_quantity: number;
  }>;
  purchase_quantity?: number;
  transfer_options?: Array<{
    store_id: number;
    store_name: string;
    available_quantity: number;
    can_fulfill: boolean;
  }>;
  purchase_suggestion?: {
    suggested_quantity: number;
    reason: string;
  };
  mixed_solution?: {
    transfer_quantity: number;
    purchase_quantity: number;
    transfer_from: Array<{
      store_id: number;
      store_name: string;
      quantity: number;
    }>;
  };
}

interface CheckStockResponse {
  has_shortage: boolean;
  suggestions: StockSuggestion[];
  cross_store_availability: Record<string, Record<string, {
    store_name: string;
    quantity: number;
    product_name: string;
    sku: string;
  }>>;
}

/**
 * Hook for checking stock availability and getting smart suggestions
 */
export function useCheckStockAvailability() {
  return useMutation<CheckStockResponse, Error, CheckStockRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.POST("/api/orders/check-stock-availability", {
        body: data,
      });

      if (!response.data) {
        throw new Error("Failed to check stock availability");
      }

      console.log('useCheckStockAvailability - API 原始回應:', response);
      
      // API 回傳的是 { data: { data: {...} } } 結構
      // 需要檢查實際的資料結構
      const actualData = response.data as any;
      console.log('useCheckStockAvailability - response.data:', actualData);
      
      // 如果資料在 data.data 中
      if (actualData.data && typeof actualData.data === 'object') {
        console.log('useCheckStockAvailability - 使用 response.data.data:', actualData.data);
        return actualData.data as CheckStockResponse;
      }
      
      // 否則直接使用 response.data
      return actualData as CheckStockResponse;
    },
    onError: (error) => {
      console.error("❌ Stock check failed:", error);
      toast.error("無法檢查庫存", {
        description: error.message || "請稍後再試",
      });
    },
  });
}

export type { StockSuggestion, CheckStockResponse };