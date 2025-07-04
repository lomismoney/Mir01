/**
 * 安裝管理相關的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';

// 查詢鍵定義
const INSTALLATION_QUERY_KEYS = {
  INSTALLATIONS: ['installations'] as const,
  INSTALLATION: (id: number) => ['installation', id] as const,
  SCHEDULE: ['installation-schedule'] as const,
} as const;

const QUERY_KEYS = {
  ORDER: (id: number) => ['order', id] as const,
} as const;

// 安裝管理相關類型定義
type InstallationFilters = {
  search?: string;
  installation_number?: string;
  status?: string;
  installer_user_id?: number;
  scheduled_date?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
};

type Installation = {
  id: number;
  installation_number: string;
  order_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  installation_address: string;
  installer_user_id?: number | null;
  status: string;
  scheduled_date?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  notes?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  installer?: any;
  creator?: any;
  order?: any;
  items?: any[];
};

// 安裝管理請求類型定義
type CreateInstallationRequest = any;
type CreateInstallationFromOrderRequest = any;
type UpdateInstallationRequest = any;
type AssignInstallerRequest = any;
type UpdateInstallationStatusRequest = { status: string; reason?: string };
type InstallationSchedule = any;

/**
 * 獲取安裝單列表的 Hook
 */
export function useInstallations(filters: InstallationFilters = {}) {
  return useQuery({
    queryKey: [...INSTALLATION_QUERY_KEYS.INSTALLATIONS, filters],
    queryFn: async () => {
      const queryParams: Record<string, string | number | boolean> = {};
      
      if (filters.search) queryParams['filter[search]'] = filters.search;
      if (filters.status) queryParams['filter[status]'] = filters.status;
      if (filters.installer_user_id !== undefined) queryParams['filter[installer_user_id]'] = filters.installer_user_id;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      if (filters.page !== undefined) queryParams.page = filters.page;
      if (filters.per_page !== undefined) queryParams.per_page = filters.per_page;

      queryParams.include = 'items,installer,creator,order';

      const { data, error } = await apiClient.GET('/api/installations' as any, {
        params: { 
          query: queryParams
        }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取安裝單列表失敗');
      }

      return data;
    },
    select: (response: any) => {
      const installations = response?.data?.data || response?.data || [];
      const meta = response?.data?.meta || null;
      const links = response?.data?.links || null;
      
      if (!Array.isArray(installations)) return { data: [], meta, links };

      const transformedData = installations.map((installation: any) => ({
        id: installation.id || 0,
        installation_number: installation.installation_number || '',
        order_id: installation.order_id || null,
        customer_name: installation.customer_name || '',
        customer_phone: installation.customer_phone || null,
        installation_address: installation.installation_address || '',
        installer_user_id: installation.installer_user_id || null,
        status: installation.status || 'pending',
        scheduled_date: installation.scheduled_date || null,
        actual_start_time: installation.actual_start_time || null,
        actual_end_time: installation.actual_end_time || null,
        notes: installation.notes || null,
        created_by: installation.created_by || 0,
        created_at: installation.created_at || '',
        updated_at: installation.updated_at || '',
        installer: installation.installer ? {
          id: installation.installer.id || 0,
          name: installation.installer.name || '',
          username: installation.installer.username || '',
        } : null,
        creator: installation.creator ? {
          id: installation.creator.id || 0,
          name: installation.creator.name || '',
          username: installation.creator.username || '',
        } : null,
        order: installation.order ? {
          id: installation.order.id || 0,
          order_number: installation.order.order_number || '',
          customer_name: installation.order.customer_name || '',
        } : null,
        items: installation.items?.map((item: any) => ({
          id: item.id || 0,
          installation_id: item.installation_id || 0,
          order_item_id: item.order_item_id || null,
          product_name: item.product_name || '',
          sku: item.sku || '',
          quantity: item.quantity || 0,
          specifications: item.specifications || null,
          status: item.status || 'pending',
          notes: item.notes || null,
        })) || [],
      })) as Installation[];

      return { data: transformedData, meta, links };
    },
    placeholderData: keepPreviousData,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000,
    retry: 2,
  });
}

/**
 * 獲取單個安裝單詳情的 Hook
 */
export function useInstallation(id: number) {
  return useQuery({
    queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/installations/{id}', {
        params: { 
          path: { id: id },
          query: {
            include: 'items,installer,creator,order'
          }
        }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取安裝單詳情失敗');
      }
      
      return data;
    },
    select: (response: any) => response?.data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * 創建安裝單的 Hook
 */
export function useCreateInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInstallationRequest) => {
      const { data: response, error } = await apiClient.POST('/api/installations', {
        body: data as any
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '創建安裝單失敗');
      }
      
      return response;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單創建成功！', {
          description: `安裝單號：${data?.data?.installation_number}`
        });
      }
    },
  });
}

/**
 * 從訂單創建安裝單的 Hook
 */
export function useCreateInstallationFromOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInstallationFromOrderRequest) => {
      const { data: response, error } = await apiClient.POST('/api/installations/create-from-order', {
        body: data as any
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '從訂單創建安裝單失敗');
      }
      
      return response;
    },
    onSuccess: async (data: { data?: { installation_number?: string } }, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDER(variables.order_id),
          exact: false,
          refetchType: 'active',
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單創建成功！', {
          description: `已從訂單創建安裝單：${data?.data?.installation_number}`
        });
      }
    },
  });
}

/**
 * 更新安裝單的 Hook
 */
export function useUpdateInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateInstallationRequest) => {
      const { data: response, error } = await apiClient.PUT('/api/installations/{id}', {
        params: { path: { id: id } },
        body: data as any
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '更新安裝單失敗');
      }
      
      return response;
    },
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.id),
          exact: false,
          refetchType: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.id),
          exact: false,
        })
      ]);
    },
  });
}

/**
 * 刪除安裝單的 Hook
 */
export function useDeleteInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await apiClient.DELETE('/api/installations/{id}', {
        params: { path: { id: id } }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '刪除安裝單失敗');
      }
      
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
        exact: false,
        refetchType: 'active',
      });
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單已刪除');
      }
    },
  });
}

/**
 * 分配安裝師傅的 Hook
 */
export function useAssignInstaller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ installationId, ...data }: { installationId: number } & AssignInstallerRequest) => {
      const { data: response, error } = await apiClient.POST('/api/installations/{installation_id}/assign', {
        params: { path: { installation_id: installationId } },
        body: data
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '分配安裝師傅失敗');
      }
      
      return response;
    },
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.installationId),
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.SCHEDULE,
          exact: false,
          refetchType: 'active',
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('已成功分配安裝師傅');
      }
    },
  });
}

/**
 * 更新安裝單狀態的 Hook
 */
export function useUpdateInstallationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ installationId, ...data }: { installationId: number } & UpdateInstallationStatusRequest) => {
      const { data: response, error } = await apiClient.PATCH('/api/installations/{installation_id}/status' as any, {
        params: { path: { installation_id: installationId } },
        body: data
      } as any);
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '更新安裝單狀態失敗');
      }
      
      return response;
    },
    onSuccess: async (data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.installationId),
          exact: false,
          refetchType: 'active',
        })
      ]);
      
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單狀態已更新');
      }
    },
  });
}

/**
 * 獲取安裝排程的 Hook
 */
export function useInstallationSchedule(params: {
  installer_user_id?: number;
  start_date?: string;
  end_date?: string;
} = {}) {
  return useQuery({
    queryKey: [...INSTALLATION_QUERY_KEYS.SCHEDULE, params],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {};
      
      if (params.installer_user_id !== undefined) queryParams['filter[installer_user_id]'] = params.installer_user_id;
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;

      const { data, error } = await apiClient.GET('/api/installations/schedule' as any, {
        params: { query: queryParams }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取安裝排程失敗');
      }
      
      return data;
    },
    select: (response: any) => response?.data || [],
    staleTime: 2 * 60 * 1000,
  });
} 