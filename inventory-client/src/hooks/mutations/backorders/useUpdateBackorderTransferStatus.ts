import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

interface UpdateBackorderTransferStatusParams {
  item_id: number;
  status: string;
  notes?: string;
}

interface UpdateBackorderTransferStatusResponse {
  message: string;
  data: {
    item_id: number;
    transfer_id: number | null;
    new_status: string;
    integrated_status: string;
    integrated_status_text: string;
  };
}

export function useUpdateBackorderTransferStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateBackorderTransferStatusResponse,
    Error,
    UpdateBackorderTransferStatusParams
  >({
    mutationFn: async (params) => {
      const response = await apiClient.POST('/api/backorders/update-transfer-status', {
        body: params,
      });

      if (response.error) {
        throw new Error(
          response.error.message || '更新轉移狀態失敗'
        );
      }

      return response.data as UpdateBackorderTransferStatusResponse;
    },
    onSuccess: (data) => {
      // 無效化相關查詢
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error('Failed to update transfer status:', error);
    },
  });
}