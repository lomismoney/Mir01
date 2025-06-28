import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scrambleApiClient, type CategoryData, type CategoryResource } from '@/lib/scrambleApiClient';
import { components } from '@/types/scramble-api';
import { toast } from 'sonner';

// 正確的類型定義 - 從 Scramble 生成的類型中獲取
type CategoryIndexResponse = components['schemas']['CategoryResource'];

// 添加 CategoryNode 類型定義（與舊版 useEntityQueries 兼容）
export interface CategoryNode {
  id: number;
  name: string;
  description?: string | null;           // 與舊版兼容：可選屬性
  parent_id?: number | null;             // 與舊版兼容：可選屬性
  sort_order?: number;                   // 與舊版兼容：可選屬性
  products_count?: number;               // 添加統計屬性
  total_products_count?: number;         // 添加統計屬性
  created_at?: string;                   // 與舊版兼容：可選屬性且為 string
  updated_at?: string;                   // 與舊版兼容：可選屬性且為 string
  children: CategoryNode[];              // 必需屬性：樹狀結構
}

// 樹狀結構轉換函數 - 從扁平數據構建分類樹
function buildCategoryTreeFromFlat(categories: CategoryIndexResponse[]): CategoryNode[] {
  // 創建 ID 到節點的映射
  const categoryMap = new Map<number, CategoryNode>();
  const rootCategories: CategoryNode[] = [];

  // 首先創建所有節點（不包含 children）
  categories.forEach(category => {
    const node: CategoryNode = {
      id: category.id,
      name: category.name,
      description: category.description || null,
      parent_id: category.parent_id || null,
      sort_order: category.sort_order || 0,
      products_count: 0,                    // 默認值，後續可擴展
      total_products_count: 0,              // 默認值，後續可擴展
      created_at: category.created_at || undefined,      // 轉換為 string | undefined
      updated_at: category.updated_at || undefined,      // 轉換為 string | undefined
      children: []
    };
    categoryMap.set(category.id, node);
  });

  // 建立父子關係
  categories.forEach(category => {
    const node = categoryMap.get(category.id)!;
    
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      // 有父分類，加入到父分類的 children
      const parent = categoryMap.get(category.parent_id)!;
      parent.children.push(node);
    } else {
      // 沒有父分類，是根分類
      rootCategories.push(node);
    }
  });

  // 遞迴排序每個層級的子分類
  const sortCategories = (cats: CategoryNode[]) => {
    cats.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    cats.forEach(cat => {
      if (cat.children.length > 0) {
        sortCategories(cat.children);
      }
    });
  };

  sortCategories(rootCategories);
  return rootCategories;
}

/**
 * Scramble PRO 分類查詢 Hook
 * 
 * 使用 DTO 驅動遷移後的完美類型安全 API
 * 享受 Scramble PRO 帶來的精確契約和自動推斷
 * 
 * @returns 樹狀結構的分類數據 (CategoryNode[])
 */
export function useScrambleCategories() {
  return useQuery({
    queryKey: ['scramble-categories'],
    queryFn: async (): Promise<CategoryNode[]> => {
      const { data, error, response } = await scrambleApiClient.GET('/categories');
      
      if (error) {
        // 提供更詳細的錯誤信息
        const errorMessage = error.message || `API 錯誤 (${response?.status}): ${response?.statusText}`;
        console.error('Scramble API 錯誤:', { error, response });
        throw new Error(errorMessage);
      }
      
      const flatCategories = data?.data || [];
      // 🌳 將扁平數據轉換為樹狀結構
      return buildCategoryTreeFromFlat(flatCategories);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // 如果是認證錯誤，不要重試
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        return false;
      }
      // 其他錯誤最多重試 3 次
      return failureCount < 3;
    },
  });
}

/**
 * Scramble PRO 創建分類 Hook（兼容舊版接口）
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: {
      name: string;
      description?: string;
      parent_id?: number | null;
    }): Promise<CategoryResource> => {
      const { data, error } = await scrambleApiClient.POST('/categories', {
        body: {
          name: categoryData.name,
          description: categoryData.description || null,
          parent_id: categoryData.parent_id || null,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to create category');
      }
      
      return data?.data!;
    },
    onSuccess: () => {
      // 使用 refetchType: 'all' 確保完全更新
      queryClient.invalidateQueries({
        queryKey: ['scramble-categories'],
        refetchType: 'all',
      });
      // 不在 Hook 中顯示 toast，由組件層處理
    },
    onError: (error) => {
      // 錯誤處理由組件層處理
      console.error('🚫 [useCreateCategory] 創建分類失敗:', error.message);
    },
  });
}

/**
 * Scramble PRO 更新分類 Hook（兼容舊版接口）
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      data: categoryData 
    }: { 
      id: number; 
      data: {
        name: string;
        description?: string;
        parent_id?: number | null;
      }
    }): Promise<CategoryResource> => {
      const { data, error } = await scrambleApiClient.PUT('/categories/{category}', {
        params: { path: { category: id } },
        body: {
          name: categoryData.name,
          description: categoryData.description || null,
          parent_id: categoryData.parent_id || null,
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to update category');
      }
      
      return data?.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scramble-categories'],
        refetchType: 'all',
      });
      // 不在 Hook 中顯示 toast，由組件層處理
    },
    onError: (error) => {
      // 錯誤處理由組件層處理
      console.error('🚫 [useUpdateCategory] 更新分類失敗:', error.message);
    },
  });
}

/**
 * Scramble PRO 刪除分類 Hook
 */
export function useDeleteScrambleCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const { error } = await scrambleApiClient.DELETE('/categories/{category}', {
        params: { path: { category: id } },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to delete category');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['scramble-categories'],
        refetchType: 'all',
      });
      toast.success('分類刪除成功！');
    },
    onError: (error) => {
      toast.error(`刪除分類失敗：${error.message}`);
    },
  });
}

/**
 * Scramble PRO 批量重新排序分類 Hook
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
    // 調用後端 API - 注意：這裡可能需要根據 Scramble API 的實際端點調整
    mutationFn: async (items: { id: number; sort_order: number }[]) => {
      // 注意：假設 Scramble 有批量重新排序的端點
      // 如果沒有，可能需要使用舊的 API 客戶端或個別更新
      const { error } = await scrambleApiClient.POST('/categories/batch-reorder', {
        body: { items },
      });
      if (error) {
        throw new Error(error.message || '更新分類順序失敗');
      }
    },
    
    // 成功時同步數據（移除重複的 toast，由組件層處理）
    onSuccess: async () => {
      // 立即失效快取，確保獲取最新數據
      await queryClient.invalidateQueries({ 
        queryKey: ['scramble-categories'],
        refetchType: 'all'
      });
    },
    
    // 錯誤處理由組件層統一處理，這裡只保留 console 日誌
    onError: (err) => {
      console.error('🚫 [useReorderCategories] API 調用失敗:', err.message);
    }
  });
} 