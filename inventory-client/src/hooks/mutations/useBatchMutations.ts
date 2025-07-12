import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { batchOperations } from '@/lib/batchApiClient';
import { queryKeys } from '@/hooks/queries/shared/queryKeys';

/**
 * 批量刪除產品 Hook
 */
export function useBatchDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: number[]) => {
      const result = await batchOperations.deleteMany(
        productIds,
        '/api/products/{id}'
      );
      
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} 個產品刪除失敗`);
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.ALL });
      toast.success(`成功刪除 ${data.succeeded.length} 個產品`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * 批量更新產品狀態 Hook
 */
export function useBatchUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productIds: number[];
      status: 'active' | 'inactive';
    }) => {
      const items = params.productIds.map(id => ({
        id,
        data: { is_active: params.status === 'active' },
      }));

      const result = await batchOperations.updateMany(
        items,
        '/api/products/{id}',
        { method: 'PATCH' }
      );
      
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} 個產品更新失敗`);
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.ALL });
      toast.success(`成功更新 ${data.succeeded.length} 個產品狀態`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * 批量更新庫存 Hook
 */
export function useBatchUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adjustments: Array<{
      variantId: number;
      storeId: number;
      adjustment: number;
      reason: string;
    }>) => {
      const items = adjustments.map((adj, index) => ({
        id: index,
        data: {
          variant_id: adj.variantId,
          store_id: adj.storeId,
          adjustment: adj.adjustment,
          reason: adj.reason,
        },
      }));

      const result = await batchOperations.createMany(
        items.map(item => item.data),
        '/api/inventory/adjustments'
      );
      
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} 個庫存調整失敗`);
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.ALL });
      toast.success(`成功調整 ${data.succeeded.length} 個庫存項目`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * 批量創建產品變體 Hook
 */
export function useBatchCreateVariants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: number;
      variants: Array<{
        sku: string;
        price: number;
        stock?: number;
        attributes: Record<string, string>;
      }>;
    }) => {
      const result = await batchOperations.createMany(
        params.variants,
        `/api/products/${params.productId}/variants`
      );
      
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} 個變體創建失敗`);
      }
      
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.DETAIL(variables.productId) 
      });
      toast.success(`成功創建 ${data.succeeded.length} 個產品變體`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * 批量更新訂單狀態 Hook（已存在於 useOrders，這裡提供增強版本）
 */
export function useEnhancedBatchUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      orderIds: number[];
      updates: {
        shipping_status?: string;
        payment_status?: string;
      };
      trackProgress?: (completed: number, total: number) => void;
    }) => {
      const items = params.orderIds.map(id => ({
        id,
        data: params.updates,
      }));

      const result = await batchOperations.updateMany(
        items,
        '/api/orders/{id}',
        { 
          method: 'PATCH',
          onProgress: params.trackProgress,
        }
      );
      
      return result;
    },
    onMutate: async (params) => {
      // 樂觀更新
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.ALL });
      
      const previousOrders = queryClient.getQueryData(queryKeys.orders.ALL);
      
      // 更新緩存中的訂單
      queryClient.setQueryData(queryKeys.orders.ALL, (old: any) => {
        if (!old?.data) return old;
        
        return {
          ...old,
          data: old.data.map((order: any) => 
            params.orderIds.includes(order.id)
              ? { ...order, ...params.updates }
              : order
          ),
        };
      });
      
      return { previousOrders };
    },
    onError: (err, params, context) => {
      // 回滾樂觀更新
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders.ALL, context.previousOrders);
      }
      toast.error('批量更新失敗');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.ALL });
    },
    onSuccess: (data) => {
      const message = data.failed.length > 0
        ? `更新完成：${data.succeeded.length} 成功，${data.failed.length} 失敗`
        : `成功更新 ${data.succeeded.length} 個訂單`;
      
      toast.success(message);
      
      // 如果有失敗項目，顯示詳細信息
      if (data.failed.length > 0) {
        console.error('批量更新失敗詳情:', data.failed);
      }
    },
  });
}

/**
 * 批量分配安裝人員 Hook
 */
export function useBatchAssignInstallers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      installationIds: number[];
      installerId: number;
    }) => {
      const items = params.installationIds.map(id => ({
        id,
        data: { installer_id: params.installerId },
      }));

      const result = await batchOperations.updateMany(
        items,
        '/api/installations/{id}/assign-installer',
        { method: 'PUT' }
      );
      
      if (result.failed.length > 0) {
        throw new Error(`${result.failed.length} 個安裝單分配失敗`);
      }
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.installations.ALL });
      toast.success(`成功分配 ${data.succeeded.length} 個安裝單`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * 批量導入客戶 Hook
 */
export function useBatchImportCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customers: Array<{
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    }>) => {
      const result = await batchOperations.createMany(
        customers,
        '/api/customers',
        {
          onProgress: (completed, total) => {
            // 可以在這裡更新進度條
            console.log(`導入進度: ${completed}/${total}`);
          },
        }
      );
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.ALL });
      
      const message = data.failed.length > 0
        ? `導入完成：${data.succeeded.length} 成功，${data.failed.length} 失敗`
        : `成功導入 ${data.succeeded.length} 個客戶`;
      
      toast.success(message);
      
      // 返回結果供組件使用
      return data;
    },
    onError: (error: Error) => {
      toast.error(`客戶導入失敗: ${error.message}`);
    },
  });
}