/**
 * 屬性管理相關的 React Query Hooks
 * 
 * 提供完整的屬性和屬性值 CRUD 操作功能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { QUERY_KEYS } from '../shared/queryKeys';
import { AttributePathParams } from '@/types/api-helpers';

/**
 * 屬性列表查詢 Hook
 * 
 * @returns React Query 查詢結果
 */
export function useAttributes() {
    return useQuery({
        queryKey: QUERY_KEYS.ATTRIBUTES,
        queryFn: async () => {
            const { data, error } = await apiClient.GET('/api/attributes');
            
            if (error) {
                throw new Error('獲取屬性列表失敗');
            }
            
            return data;
        },
        // 🎯 標準化數據精煉廠 - 處理屬性數據的解包和轉換
        select: (response: any) => {
            // 處理可能的巢狀或分頁數據結構
            const data = response?.data?.data || response?.data || response || [];
            const meta = response?.data?.meta || {
                total: Array.isArray(data) ? data.length : 0,
                per_page: 100,
                current_page: 1,
                last_page: 1
            };
            
            // 確保數據的類型安全和結構一致性
            const attributes = Array.isArray(data) ? data.map((attribute: any) => ({
                id: attribute.id || 0,
                name: attribute.name || '未命名屬性',
                type: attribute.type || 'text',
                description: attribute.description || null,
                created_at: attribute.created_at || '',
                updated_at: attribute.updated_at || '',
                // 如果有屬性值數據，也進行處理
                values: attribute.values ? attribute.values.map((value: any) => ({
                    id: value.id || 0,
                    value: value.value || '',
                    attribute_id: value.attribute_id || attribute.id,
                    created_at: value.created_at || '',
                    updated_at: value.updated_at || ''
                })) : [],
                // 維護向後兼容性
                attribute_values: attribute.attribute_values || attribute.values || [],
                // 添加關聯商品數量
                products_count: attribute.products_count ?? 0
            })) : [];
            
            // 返回標準的分頁結構
            return { data: attributes, meta };
        },
        staleTime: 5 * 60 * 1000, // 5 分鐘緩存
    });
}

/**
 * 創建屬性
 */
export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data, error } = await apiClient.POST('/api/attributes', {
        body,
      });
      if (error) {
        const errorMessage = parseApiError(error) || '建立屬性失敗';
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: async (data, variables) => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("屬性已成功創建");
      }
    },
  });
}

/**
 * 更新屬性的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收屬性更新資料（路徑參數和請求體）
 * 2. 發送 PUT 請求到 /api/attributes/{attribute} 端點
 * 3. 支援更新屬性名稱
 * 4. 處理業務邏輯驗證錯誤（如重複名稱檢查）
 * 5. 成功後自動無效化屬性列表快取
 */
export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: number; body: { name: string } }) => {
      const { data, error } = await apiClient.PUT('/api/attributes/{attribute}', {
        params: { path: { attribute: variables.id } },
        body: variables.body,
      });
      if (error) { 
        throw new Error(Object.values(error).flat().join('\n') || '更新屬性失敗'); 
      }
      return data;
    },
    onSuccess: () => {
      // 無效化屬性快取，觸發重新獲取更新後的屬性列表
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}

/**
 * 刪除屬性的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收要刪除的屬性 ID 路徑參數
 * 2. 發送 DELETE 請求到 /api/attributes/{attribute} 端點
 * 3. 執行刪除操作，會級聯刪除所有相關的屬性值
 * 4. 注意：如果有商品變體正在使用此屬性，刪除可能會失敗
 * 5. 成功後自動無效化屬性列表快取
 */
export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathParams: AttributePathParams) => {
      const { error } = await apiClient.DELETE('/api/attributes/{attribute}', {
        params: { path: { attribute: pathParams.id } },
      });
      if (error) { 
        throw new Error('刪除屬性失敗'); 
      }
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("屬性已成功刪除");
      }
    },
  });
}

// 導入屬性值管理的精確類型定義
type CreateAttributeValueRequestBody = import('@/types/api').paths["/api/attributes/{attribute}/values"]["post"]["requestBody"]["content"]["application/json"];
type UpdateAttributeValueRequestBody = import('@/types/api').paths["/api/values/{value}"]["put"]["requestBody"]["content"]["application/json"];
type AttributeValuePathParams = import('@/types/api').paths["/api/values/{value}"]["get"]["parameters"]["path"];

/**
 * 為指定屬性建立新屬性值的 Mutation
 */
export function useCreateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { attributeId: number; body: CreateAttributeValueRequestBody }) => {
      const { data, error } = await apiClient.POST('/api/attributes/{attribute}/values', {
        params: { path: { attribute: variables.attributeId } },
        body: variables.body,
      });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '新增選項失敗'); }
      return data;
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        }),
        // 同時失效屬性值的快取
        queryClient.invalidateQueries({ 
          queryKey: ['attributeValues'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("屬性值已成功創建");
      }
    },
  });
}

/**
 * 更新屬性值的 Mutation
 */
export function useUpdateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { valueId: number; body: UpdateAttributeValueRequestBody }) => {
      const { data, error } = await apiClient.PUT('/api/values/{value}', {
        params: { path: { value: variables.valueId } },
        body: variables.body,
      });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '更新選項失敗'); }
      return data;
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        }),
        // 同時失效屬性值的快取
        queryClient.invalidateQueries({ 
          queryKey: ['attributeValues'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("屬性值已成功更新");
      }
    },
  });
}

/**
 * 刪除屬性值的 Mutation
 */
export function useDeleteAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valueId: number) => {
      const { error } = await apiClient.DELETE('/api/values/{value}', {
        params: { path: { value: valueId } },
      });
      if (error) { throw new Error('刪除選項失敗'); }
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.ATTRIBUTES,
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        }),
        // 同時失效屬性值的快取
        queryClient.invalidateQueries({ 
          queryKey: ['attributeValues'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("屬性值已成功刪除");
      }
    },
  });
}

/**
 * 獲取指定屬性的所有屬性值
 * 
 * 🎯 功能：根據屬性 ID 獲取其下的所有屬性值
 * 
 * 功能特性：
 * 1. 只在 attributeId 有效時發起請求
 * 2. 使用標準化的數據精煉廠模式
 * 3. 返回統一的分頁結構
 * 4. 支援錯誤處理
 * 
 * @param attributeId - 屬性 ID，可為 null
 * @returns React Query 查詢結果，包含屬性值列表
 */
export function useAttributeValues(attributeId: number | null) {
  return useQuery({
    queryKey: ['attributeValues', attributeId],
    queryFn: async () => {
      // 只有在 attributeId 有效時才發起請求
      if (!attributeId) return null;

      const { data, error } = await apiClient.GET('/api/attributes/{attribute}/values', {
        params: { path: { attribute: attributeId } },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取屬性值失敗');
      }
      return data;
    },
    // 只有在 attributeId 為真值時，這個查詢才會被啟用
    enabled: !!attributeId,
    // 🎯 數據精煉廠：確保返回的是一個標準的分頁結構或空陣列
    select: (response: any) => {
      if (!response) return { data: [], meta: null };
      
      const data = response?.data?.data || response?.data || response || [];
      const meta = response?.meta || response?.data?.meta || {
        total: Array.isArray(data) ? data.length : 0,
        per_page: 100,
        current_page: 1,
        last_page: 1
      };
      
      // 確保數據的類型安全
      const values = Array.isArray(data) ? data.map((value: any) => ({
        id: value.id || 0,
        value: value.value || '',
        attribute_id: value.attribute_id || attributeId,
        created_at: value.created_at || '',
        updated_at: value.updated_at || ''
      })) : [];
      
      return { data: values, meta };
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘緩存
  });
} 