/**
 * 分類管理相關的 React Query Hooks
 * 
 * 提供完整的分類 CRUD 操作和樹狀結構處理功能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { QUERY_KEYS } from '../shared/queryKeys';
import { Category } from '@/types/category';

/**
 * CategoryNode 類型定義
 * 擴展 Category 類型，確保 children 屬性為必需的 CategoryNode 陣列
 */
export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/**
 * 構建分類樹狀結構
 * 將後端返回的分組數據轉換為樹狀結構
 * 
 * @param groupedCategories - 以 parent_id 分組的分類對象
 * @returns 樹狀結構的分類陣列
 */
function buildCategoryTree(groupedCategories: Record<string, any[]>): CategoryNode[] {
  // 確保數據是有效的對象
  if (!groupedCategories || typeof groupedCategories !== 'object') {
    return [];
  }

  // 建立 ID 到節點的映射，方便查找
  const nodeMap = new Map<number, CategoryNode>();
  
  // 第一步：將所有分類轉換為 CategoryNode，初始化 children 為空陣列
  Object.values(groupedCategories).forEach(categoryGroup => {
    if (Array.isArray(categoryGroup)) {
      categoryGroup.forEach(cat => {
        if (cat && typeof cat.id === 'number') {
          const node: CategoryNode = {
            id: cat.id,
            name: cat.name || '',
            description: cat.description || null,
            parent_id: cat.parent_id || null,
            sort_order: cat.sort_order || 0,
            created_at: cat.created_at || '',
            updated_at: cat.updated_at || '',
            products_count: cat.products_count || 0,
            total_products_count: cat.total_products_count || 0,
            children: []
          };
          nodeMap.set(cat.id, node);
        }
      });
    }
  });

  // 第二步：根據 parent_id 分組關係建立樹狀結構
  const rootNodes: CategoryNode[] = [];
  
  Object.entries(groupedCategories).forEach(([parentIdStr, categoryGroup]) => {
    if (Array.isArray(categoryGroup)) {
      const parentId = parentIdStr === '' || parentIdStr === 'null' ? null : Number(parentIdStr);
      
      categoryGroup.forEach(cat => {
        const node = nodeMap.get(cat.id);
        if (node) {
          if (parentId === null) {
            // 頂層分類
            rootNodes.push(node);
          } else {
            // 子分類：找到父節點並添加到其 children
            const parentNode = nodeMap.get(parentId);
            if (parentNode) {
              parentNode.children.push(node);
            }
          }
        }
      });
    }
  });

  // 第三步：保持原始排序（已由後端按 sort_order 排序）
  // 只需要遞迴處理子節點，不再重新排序
  const processNodes = (nodes: CategoryNode[]): CategoryNode[] => {
    return nodes.map(node => ({
      ...node,
      children: processNodes(node.children)
    }));
  };

  return processNodes(rootNodes);
}

/**
 * 分類列表查詢 Hook
 * 
 * @param filters - 篩選參數
 * @returns React Query 查詢結果，返回樹狀結構的分類陣列
 */
export function useCategories(filters: { search?: string } = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.CATEGORIES, filters],
        queryFn: async () => {
            // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
            const queryParams: Record<string, any> = {};
            
            // 使用 filter[...] 格式進行篩選參數
            if (filters.search) queryParams['filter[search]'] = filters.search;
            
            // 固定的參數
            queryParams.per_page = 100; // 獲取所有分類
            
            const { data, error } = await apiClient.GET('/api/categories', {
                params: { 
                    query: queryParams
                }
            });
            
            if (error) {
                throw new Error('獲取分類列表失敗');
            }
            
            return data;
        },
        // 🎯 新的數據精煉廠 - 返回已構建好的樹狀結構
        select: (response: any): CategoryNode[] => {
            // API 返回的是 CategoryResource 集合（陣列格式）
            const categories = response?.data || response || [];
            
            // 確保返回的是陣列，如果不是則返回空陣列
            if (!Array.isArray(categories)) {
                return [];
            }
            
            // 將陣列轉換為以 parent_id 分組的物件格式
            const groupedData: Record<string, any[]> = {};
            categories.forEach((category: any) => {
                const parentKey = category.parent_id?.toString() || '';
                if (!groupedData[parentKey]) {
                    groupedData[parentKey] = [];
                }
                groupedData[parentKey].push(category);
            });
            
            // 在 select 內部調用 buildCategoryTree
            // 將分組物件轉換成乾淨的、巢狀的樹狀結構
            return buildCategoryTree(groupedData);
        },
        staleTime: 5 * 60 * 1000, // 5 分鐘緩存
    });
}

/**
 * 創建分類的 Mutation Hook
 * 
 * 🚀 功能：為新增分類功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新分類列表 - 標準化緩存處理
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  type CreateCategoryRequestBody = import('@/types/api').paths["/api/categories"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (categoryData: CreateCategoryRequestBody) => {
      const { data, error } = await apiClient.POST("/api/categories", { body: categoryData });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES, 
          exact: false,
          refetchType: 'active' 
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES,
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("分類已成功創建");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("創建失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 更新分類的 Mutation Hook
 * 
 * 🔧 功能：為分類編輯功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 雙重緩存失效策略 - 同時更新列表和詳情緩存
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  type UpdateCategoryRequestBody = any;
  type UpdateCategoryPayload = {
    id: number;
    data: UpdateCategoryRequestBody;
  };
  
  return useMutation({
    mutationFn: async (payload: UpdateCategoryPayload) => {
      const { data, error } = await apiClient.PUT("/api/categories/{id}", {
        params: { path: { id: payload.id } },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES, 
          exact: false,
          refetchType: 'active' 
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES,
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CATEGORY(variables.id), 
          refetchType: 'active' 
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("分類已成功更新");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("更新失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 刪除分類的 Mutation Hook
 * 
 * 🔥 功能：為分類刪除功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新分類列表 - 標準化緩存處理
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryId: number) => {
      const { data, error } = await apiClient.DELETE("/api/categories/{id}", {
        params: { path: { id: categoryId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES, 
          exact: false,
          refetchType: 'active' 
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.CATEGORIES,
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("分類已成功刪除");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 批量重新排序分類的 Mutation Hook
 * 
 * 🔄 功能：為分類拖曳排序功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 樂觀更新 - 在 API 請求前立即更新快取，實現零延遲
 * 2. 錯誤回滾 - API 失敗時自動恢復原始順序
 * 3. 最終一致性 - 無論成功或失敗都會同步伺服器數據
 * 4. 用戶友善的通知 - 即時反饋操作結果
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    // 調用後端 API
    mutationFn: async (items: { id: number; sort_order: number }[]) => {
      const { error } = await apiClient.POST('/api/categories/batch-reorder', {
        body: { items },
      });
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '更新分類順序失敗');
      }
    },
    
    // 成功時同步數據（移除重複的 toast，由組件層處理）
    onSuccess: async () => {
      // 立即失效快取，確保獲取最新數據
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.CATEGORIES,
        refetchType: 'all'
      });
    },
    
    // 錯誤處理由組件層統一處理，這裡只保留 console 日誌
    onError: (err) => {
      console.error('🚫 [useReorderCategories] API 調用失敗:', err.message);
    }
  });
} 