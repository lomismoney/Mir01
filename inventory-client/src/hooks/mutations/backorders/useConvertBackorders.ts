import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface ConvertBackordersData {
  item_ids: string[];
  store_id?: number;
}

export function useConvertBackorders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConvertBackordersData) => {
      const response = await apiClient.POST('/api/backorders/convert', { body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('成功轉換為進貨單');
      
      // 清除相關快取
      queryClient.invalidateQueries({ queryKey: ['backorders'] });
      queryClient.invalidateQueries({ queryKey: ['backorder-stats'] });
      queryClient.invalidateQueries({ queryKey: ['backorder-summary'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    onError: (error: unknown) => {
      toast.error(error.response?.data?.message || '轉換失敗');
    },
  });
}