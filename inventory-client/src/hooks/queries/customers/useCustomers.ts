/**
 * 客戶管理相關的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { QUERY_KEYS } from '../shared/queryKeys';
import { CustomerFilters } from '@/types/api-helpers';

/**
 * 創建客戶的精確前端契約類型
 */
type CreateCustomerPayload = {
  name: string;
  phone?: string;
  is_company: boolean;
  tax_id?: string;
  industry_type: string;
  payment_type: string;
  contact_address?: string;
  addresses?: {
    id?: number;
    address: string;
    is_default: boolean;
  }[];
};

/**
 * 客戶查詢參數類型
 */
type CustomerQueryParams = {
  search?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
};

/**
 * 獲取客戶詳情
 */
export function useCustomerDetail(customerId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(customerId!),
    queryFn: async () => {
      if (!customerId) return null;
      
      const { data, error } = await apiClient.GET('/api/customers/{id}', {
        params: { path: { id: customerId } },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取客戶詳情失敗');
        }
        
      return data;
    },
    select: (response: any) => response?.data,
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * 創建客戶的 Hook
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  type CreateCustomerRequestBody = import('@/types/api').paths['/api/customers']['post']['requestBody']['content']['application/json'];

  return useMutation({
    mutationFn: async (payload: CreateCustomerPayload) => {
      const apiPayload = {
        name: payload.name,
        phone: payload.phone || undefined,
        is_company: payload.is_company,
        tax_id: payload.tax_id || undefined,
        industry_type: payload.industry_type,
        payment_type: payload.payment_type,
        contact_address: payload.contact_address || undefined,
        addresses: payload.addresses?.map(addr => addr.address) || [],
      };
      
      const { data, error } = await apiClient.POST('/api/customers', {
        body: apiPayload as any,
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '創建客戶失敗');
      }

      return data;
    },
    onSuccess: async (data: { data?: { name?: string } }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('客戶已成功創建', {
          description: `客戶「${data?.data?.name}」已成功加入系統`
        });
      }
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('創建失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * 刪除客戶的 Hook
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: number) => {
      const { error } = await apiClient.DELETE('/api/customers/{id}', {
        params: { path: { id: customerId } }
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("客戶已成功刪除");
      }
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 檢查客戶名稱是否存在 Hook
 */
export function useCheckCustomerExistence(name: string) {
  return useQuery({
    queryKey: ['customerExistence', name],
    queryFn: async () => {
      // @ts-expect-error 新端點尚未同步到類型定義
      const { data, error } = await apiClient.GET('/api/customers/check-existence', {
        params: { query: { name } },
      });
      if (error) {
        console.error("客戶名稱檢查失敗", error);
        return { exists: false };
      }
      return data ?? { exists: false };
    },
    enabled: false,
    retry: 1,
  });
}

/**
 * 獲取客戶列表 Hook
 */
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CUSTOMERS, filters],
    queryFn: async ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      const queryParams: Record<string, any> = {};
      
      if ((queryFilters as CustomerFilters)?.search) {
        queryParams['filter[search]'] = (queryFilters as CustomerFilters).search;
      }
      if ((queryFilters as CustomerFilters)?.start_date) {
        queryParams['filter[start_date]'] = (queryFilters as CustomerFilters).start_date;
      }
      if ((queryFilters as CustomerFilters)?.end_date) {
        queryParams['filter[end_date]'] = (queryFilters as CustomerFilters).end_date;
      }
      if ((queryFilters as CustomerFilters)?.page) {
        queryParams.page = (queryFilters as CustomerFilters).page;
      }
      if ((queryFilters as CustomerFilters)?.per_page) {
        queryParams.per_page = (queryFilters as CustomerFilters).per_page;
      }
      
      const { data, error } = await apiClient.GET('/api/customers', {
        params: { query: queryParams },
      });
      
      if (error) {
        console.error('客戶 API 錯誤:', error);
        const errorMessage = parseApiError(error) || '獲取客戶列表失敗';
        throw new Error(errorMessage);
      }
      
      return data;
    },
    select: (response: any) => {
      const data = response?.data?.data || response?.data || response || [];
      
      const meta = response?.meta || response?.data?.meta || { 
        current_page: 1, 
        last_page: 1,
        per_page: Array.isArray(data) ? data.length : 0,
        total: Array.isArray(data) ? data.length : 0
      };
      
      const customers = Array.isArray(data) ? data : [];
      
      return { 
        data: customers, 
        meta: meta 
      };
    },
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * 更新客戶的 Hook
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  type UpdateCustomerRequestBody = any;
  type UpdateCustomerPayload = {
    id: number;
    data: UpdateCustomerRequestBody;
  };
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateCustomerPayload) => {
      const { data: responseData, error } = await apiClient.PUT('/api/customers/{id}', {
        params: { path: { id } },
        body: data,
      });
      if (error) throw error;
      return responseData;
    },
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        }),
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CUSTOMER(variables.id),
          refetchType: 'active' 
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.CUSTOMER(variables.id)
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('客戶資料已成功更新', {
          description: `客戶「${data?.data?.name}」的資料已更新`
        });
      }
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('更新失敗', { description: errorMessage });
      }
    },
  });
}
