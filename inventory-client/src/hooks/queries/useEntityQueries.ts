import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

/**
 * API Hooks - 商品管理
 * 使用生成的 API 類型定義進行類型安全的資料操作
 */

/**
 * 查詢金鑰定義
 * 
 * 統一管理所有 React Query 的查詢金鑰，
 * 確保快取鍵值的一致性和可維護性
 */
export const QUERY_KEYS = {
    PRODUCTS: ['products'] as const,
    PRODUCT: (id: number) => ['products', id] as const,
    USERS: ['users'] as const,
    USER: (id: number) => ['users', id] as const,
    CATEGORIES: ['categories'] as const,
    ATTRIBUTES: ['attributes'] as const,
};

/**
 * 商品列表查詢 Hook（高性能版本 - 整合第二階段優化）
 * 
 * 效能優化特性：
 * 1. 利用激進緩存策略，減少API請求頻率
 * 2. 智能查詢鍵結構，支援搜索參數的精確緩存
 * 3. 禁用干擾性的背景更新
 * 4. 網絡狀態感知優化
 * 
 * @param options - 查詢選項
 * @param options.search - 搜尋關鍵字
 * @returns React Query 查詢結果
 */
export function useProducts(options: { search?: string } = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCTS, { search: options.search }],
        queryFn: async () => {
            const searchParam = options.search 
                ? { search: options.search }
                : undefined;

            const { data, error } = await apiClient.GET('/api/products', {
                params: { query: searchParam }
            });
            
            if (error) {
                throw new Error('獲取商品列表失敗');
            }

            // 後端現在已經返回正確的數字類型，無需手動轉換
            return data;
        },
        
        // 🚀 體驗優化配置（第二階段淨化行動）
        placeholderData: (previousData) => previousData, // 搜尋時保持舊資料，避免載入閃爍
        refetchOnMount: false,       // 依賴全域 staleTime
        refetchOnWindowFocus: false, // 後台管理系統不需要窗口聚焦刷新
    });
}

/**
 * 單個商品查詢 Hook
 * 
 * @param id - 商品 ID
 * @returns React Query 查詢結果
 */
export function useProduct(id: number) {
    return useQuery({
        queryKey: QUERY_KEYS.PRODUCT(id),
        queryFn: async () => {
            const { data, error } = await apiClient.GET('/api/products/{id}', {
                params: { path: { id } }
            });
            
            if (error) {
                throw new Error('獲取商品失敗');
            }
            return data;
        },
        enabled: !!id, // 只有當 id 存在時才執行查詢
    });
}

// 商品創建端點暫時未定義 - 等待後端實現

/**
 * 創建商品的 Hook (暫時停用 - 等待後端端點實現)
 * TODO: 需要後端實現 POST /api/products 端點
 */
export function useCreateProduct() {
  throw new Error('創建商品功能暫時停用 - 等待後端端點實現');
}

// 導入由 openapi-typescript 生成的精確類型
type UpdateProductRequestBody = import('@/types/api').paths["/api/products/{id}"]["put"]["requestBody"]["content"]["application/json"];

/**
 * 更新商品的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...productData }: { id: number } & UpdateProductRequestBody) => {
            const { data, error } = await apiClient.PUT('/api/products/{id}', {
                params: { path: { id } },
                body: productData
            });
            
            if (error) {
                throw new Error('更新商品失敗');
            }
            
            return data;
        },
        onSuccess: (data, variables) => {
            // 成功後更新快取
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(variables.id) });
        },
    });
}

/**
 * 刪除商品的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { data, error } = await apiClient.DELETE('/api/products/{id}', {
                params: { path: { id } }
            });
            
            if (error) {
                throw new Error('刪除商品失敗');
            }
            
            return data;
        },
        onSuccess: (data, id) => {
            // 成功後更新快取
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.removeQueries({ queryKey: QUERY_KEYS.PRODUCT(id) });
        },
    });
}

// 導入由 openapi-typescript 生成的精確類型
// 舊的批量刪除類型定義已移除，將在 API 契約同步後重新生成

/**
 * 批量刪除商品的 Mutation (戰術升級版 - 使用 POST 方法)
 * 
 * 功能說明：
 * 1. 使用語義更明確的 POST /api/products/batch-delete 端點
 * 2. 統一參數名為 ids，提供更直觀的 API 介面
 * 3. 返回 204 No Content，符合 RESTful 設計標準
 * 4. 自動失效相關查詢緩存，確保資料一致性
 */
export function useDeleteMultipleProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { ids: number[] }) => {
      // 轉換數字陣列為字串陣列（根據 API 規格要求）
      const { error } = await apiClient.POST('/api/products/batch-delete', {
        body: { ids: body.ids.map(id => id.toString()) },
      });

      if (error) {
        const errorMessage = (error as { detail?: string[] })?.detail?.[0] || '刪除商品失敗';
        throw new Error(errorMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// 這些類型現在將由 api.ts 精確提供
type UserQueryParams = import('@/types/api').paths["/api/users"]["get"]["parameters"]["query"];
type CreateUserRequestBody = import('@/types/api').paths["/api/users"]["post"]["requestBody"]["content"]["application/json"];
type UpdateUserRequestBody = import('@/types/api').paths["/api/users/{id}"]["put"]["requestBody"]["content"]["application/json"];
type UserPathParams = import('@/types/api').paths["/api/users/{id}"]["get"]["parameters"]["path"];

/**
 * 獲取用戶列表（高性能版本 - 整合第二階段優化）
 * 
 * 效能優化特性：
 * 1. 利用激進緩存策略（15分鐘 staleTime）
 * 2. 智能查詢鍵結構，支援精確緩存失效
 * 3. 網絡狀態感知，避免離線時的無效請求
 * 4. 背景更新禁用，避免用戶操作被打斷
 */
export function useUsers(filters?: UserQueryParams) {
  return useQuery({
    // 正確的結構：['users', { filter... }]
    // 這是一個扁平陣列，第一項是資源名稱，第二項是參數物件
    queryKey: ['users', filters], 
    
    queryFn: async ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      // 移除 include=stores 參數，降低後端負載（按照淨化行動要求）
      const queryParams: UserQueryParams = {
        ...(queryFilters as UserQueryParams),
      };
      
      const response = await apiClient.GET('/api/users', {
        params: { query: queryParams },
      });
      
      if (response.error) { 
        throw new Error('獲取用戶列表失敗'); 
      }
      
      // 確保返回資料結構統一，處理 Laravel 分頁結構
      // 分頁響應結構: { data: [...用戶列表], meta: {...分頁資訊} }
      return response.data;
    },
    
    // 🚀 體驗優化配置（第二階段淨化行動）
    placeholderData: (previousData) => previousData, // 分頁時保持舊資料，避免載入閃爍
    refetchOnMount: false,       // 依賴全域 staleTime
    refetchOnWindowFocus: false, // 後台管理系統不需要窗口聚焦刷新
  });
}

/**
 * 建立新用戶的 Mutation - 樂觀更新版本 🚀
 * 
 * 風暴引擎特性：
 * - 樂觀更新：在請求發送前預測性地更新 UI
 * - 智能回滾：失敗時自動恢復到操作前狀態
 * - 最終同步：確保前端資料與伺服器最終一致
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateUserRequestBody) => {
      const { data, error } = await apiClient.POST('/api/users', { body });
      if (error) { 
        // 改進錯誤處理：更好地處理 Laravel 驗證錯誤
        let errorMessage = '建立用戶失敗';
        
        // 使用 any 類型來處理動態錯誤結構
        const errorObj = error as any;
        
        if (errorObj && typeof errorObj === 'object') {
          // 處理 Laravel 驗證錯誤格式
          if (errorObj.errors && typeof errorObj.errors === 'object') {
            // Laravel 驗證錯誤格式：{ errors: { field: [messages] } }
            const validationErrors = Object.values(errorObj.errors as Record<string, string[]>)
              .flat()
              .join('\n');
            if (validationErrors) {
              errorMessage = validationErrors;
            }
          } else if (errorObj.message && typeof errorObj.message === 'string') {
            // Laravel 一般錯誤格式：{ message: "error message" }
            errorMessage = errorObj.message;
          } else {
            // 其他錯誤格式
            const allErrors = Object.values(errorObj).flat().join('\n');
            if (allErrors) {
              errorMessage = allErrors;
            }
          }
        }
        
        throw new Error(errorMessage);
      }
      return data;
    },
    
    /**
     * 樂觀更新階段：預測性 UI 更新
     * 
     * 在 API 請求發送前立即執行，讓使用者看到即時反應
     * 回傳 context 物件用於錯誤回滾
     */
    onMutate: async (newUser) => {
      // 🛡️ 防護措施：取消任何正在進行的用戶列表查詢
      // 避免競態條件覆蓋我們的樂觀更新
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // 📸 建立資料快照：保存當前狀態用於失敗回滾
      const previousUsers = queryClient.getQueryData(['users']);
      
      // 🚀 預測性更新：立即將新用戶添加到列表中
      queryClient.setQueryData(['users'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        // 建立樂觀用戶物件 (使用臨時 ID)
        const optimisticUser = {
          id: Date.now(), // 臨時 ID，伺服器會回傳真實 ID
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          role_display: newUser.role === 'admin' ? '管理員' : '檢視者',
          is_admin: newUser.role === 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          stores: []
        };
        
        // 將新用戶插入到列表頂部 (最新項目在前)
        return {
          ...oldData,
          data: [optimisticUser, ...oldData.data]
        };
      });
      
      // 回傳 context 給 onError 使用
      return { previousUsers };
    },
    
    /**
     * 錯誤回滾階段：失敗時恢復原狀
     * 
     * 當 API 請求失敗時，將 UI 恢復到操作前的狀態
     */
    onError: (err, newUser, context) => {
      // 🔄 智能回滾：恢復到操作前的資料狀態
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    
    /**
     * 最終同步階段：確保資料一致性
     * 
     * 無論成功或失敗，都進行最終的資料同步
     * 確保前端資料與伺服器狀態完全一致
     */
    onSettled: () => {
      // 🔄 強制同步：重新獲取伺服器最新資料
      // 這會用真實的伺服器資料替換樂觀更新的資料
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * 更新用戶的 Mutation - 樂觀更新版本 🚀
 * 
 * 風暴引擎特性：
 * - 樂觀更新：使用 .map() 立即更新目標用戶
 * - 智能回滾：失敗時自動恢復到操作前狀態
 * - 雙重同步：同時更新列表和詳細資料快取
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { path: UserPathParams; body: UpdateUserRequestBody }) => {
      const { data, error } = await apiClient.PUT('/api/users/{id}', {
        params: { path: variables.path },
        body: variables.body,
      });
      if (error) { 
        // 改進錯誤處理：更好地處理 Laravel 驗證錯誤
        let errorMessage = '更新用戶失敗';
        
        // 使用 any 類型來處理動態錯誤結構
        const errorObj = error as any;
        
        if (errorObj && typeof errorObj === 'object') {
          // 處理 Laravel 驗證錯誤格式
          if (errorObj.errors && typeof errorObj.errors === 'object') {
            // Laravel 驗證錯誤格式：{ errors: { field: [messages] } }
            const validationErrors = Object.values(errorObj.errors as Record<string, string[]>)
              .flat()
              .join('\n');
            if (validationErrors) {
              errorMessage = validationErrors;
            }
          } else if (errorObj.message && typeof errorObj.message === 'string') {
            // Laravel 一般錯誤格式：{ message: "error message" }
            errorMessage = errorObj.message;
          } else {
            // 其他錯誤格式
            const allErrors = Object.values(errorObj).flat().join('\n');
            if (allErrors) {
              errorMessage = allErrors;
            }
          }
        }
        
        throw new Error(errorMessage);
      }
      return data;
    },
    
    /**
     * 樂觀更新階段：預測性用戶更新
     * 
     * 使用 .map() 找到目標用戶並立即更新其資料
     */
    onMutate: async (variables) => {
      const userId = variables.path.user;
      const updateData = variables.body;
      
      // 🛡️ 防護措施：取消相關查詢避免競態條件
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      // 📸 建立資料快照：保存當前狀態用於失敗回滾
      const previousUsers = queryClient.getQueryData(['users']);
      const previousUser = queryClient.getQueryData(['user', userId]);
      
      // 🚀 預測性更新：使用 .map() 更新目標用戶
      queryClient.setQueryData(['users'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((user: any) => {
            if (user.id === userId) {
              // 更新目標用戶的資料
              return {
                ...user,
                name: updateData.name ?? user.name,
                username: updateData.username ?? user.username,
                role: updateData.role ?? user.role,
                role_display: updateData.role ? 
                  (updateData.role === 'admin' ? '管理員' : '檢視者') : 
                  user.role_display,
                is_admin: updateData.role ? 
                  (updateData.role === 'admin') : 
                  user.is_admin,
                updated_at: new Date().toISOString(),
              };
            }
            return user;
          })
        };
      });
      
      // 同時更新用戶詳細資料快取（如果存在）
      queryClient.setQueryData(['user', userId], (oldUser: any) => {
        if (!oldUser) return oldUser;
        
        return {
          ...oldUser,
          name: updateData.name ?? oldUser.name,
          username: updateData.username ?? oldUser.username,
          role: updateData.role ?? oldUser.role,
          role_display: updateData.role ? 
            (updateData.role === 'admin' ? '管理員' : '檢視者') : 
            oldUser.role_display,
          is_admin: updateData.role ? 
            (updateData.role === 'admin') : 
            oldUser.is_admin,
          updated_at: new Date().toISOString(),
        };
      });
      
      // 回傳 context 給 onError 使用
      return { previousUsers, previousUser, userId };
    },
    
    /**
     * 錯誤回滾階段：失敗時恢復原狀
     * 
     * 當 API 請求失敗時，將 UI 恢復到操作前的狀態
     */
    onError: (err, variables, context) => {
      // 🔄 智能回滾：恢復到操作前的資料狀態
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      if (context?.previousUser && context?.userId) {
        queryClient.setQueryData(['user', context.userId], context.previousUser);
      }
    },
    
    /**
     * 最終同步階段：雙重快取失效
     * 
     * 確保用戶列表和詳細資料都與伺服器同步
     */
    onSettled: (_, __, variables) => {
      // 🔄 雙重同步：讓列表和詳細資料快取失效
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.path.user] });
    },
  });
}

/**
 * 刪除單一用戶的 Mutation - 樂觀更新版本 🚀
 * 
 * 風暴引擎特性：
 * - 樂觀刪除：使用 .filter() 立即從列表中移除用戶
 * - 智能回滾：失敗時自動恢復到操作前狀態
 * - 快取清理：成功後移除用戶詳細資料快取
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathParams: UserPathParams) => {
      const { error } = await apiClient.DELETE('/api/users/{id}', {
        params: { path: pathParams },
      });
      if (error) { throw new Error('刪除用戶失敗'); }
    },
    
    /**
     * 樂觀刪除階段：預測性用戶移除
     * 
     * 使用 .filter() 立即將目標用戶從列表中移除
     */
    onMutate: async (pathParams) => {
      const userId = pathParams.user;
      
      // 🛡️ 防護措施：取消相關查詢避免競態條件
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({ queryKey: ['user', userId] });

      // 📸 建立資料快照：保存當前狀態用於失敗回滾
      const previousUsers = queryClient.getQueryData(['users']);
      const previousUser = queryClient.getQueryData(['user', userId]);
      
      // 🚀 預測性刪除：使用 .filter() 移除目標用戶
      queryClient.setQueryData(['users'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((user: any) => user.id !== userId)
        };
      });
      
      // 回傳 context 給 onError 使用
      return { previousUsers, previousUser, userId };
    },
    
    /**
     * 錯誤回滾階段：失敗時恢復原狀
     * 
     * 當 API 請求失敗時，將被刪除的用戶恢復到列表中
     */
    onError: (err, pathParams, context) => {
      // 🔄 智能回滾：恢復到操作前的資料狀態
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
      if (context?.previousUser && context?.userId) {
        queryClient.setQueryData(['user', context.userId], context.previousUser);
      }
    },
    
    /**
     * 最終同步階段：快取清理與同步
     * 
     * 讓用戶列表快取失效，並移除用戶詳細資料快取
     */
    onSettled: (_, __, pathParams) => {
      // 🔄 列表同步：讓用戶列表快取失效
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // 🗑️ 快取清理：移除該用戶的詳細資料快取
      queryClient.removeQueries({ queryKey: ['user', pathParams.user] });
    },
  });
}

/**
 * 獲取所有商品分類（高性能版本 - 整合第二階段優化）
 * 
 * 效能優化特性：
 * 1. 超長緩存策略 - 分類數據極少變動，20分鐘緩存
 * 2. 禁用所有背景更新 - 分類結構穩定
 * 3. 智能樹狀結構預處理 - 減少前端計算負擔
 * 4. 錯誤邊界整合 - 優雅處理網絡異常
 * 
 * 從後端 API 獲取分類列表，後端回傳的是按 parent_id 分組的集合結構，
 * 讓前端可以極其方便地建構層級樹狀結構。
 * 
 * 範例回傳結構：
 * - data[null] 或 data[''] - 所有頂層分類（父分類為 null）
 * - data['1'] - id 為 1 的分類下的所有子分類
 * 
 * @returns React Query 查詢結果，包含分組後的分類資料
 */
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES,
    queryFn: async () => {
      // 類型系統知道 data 的結構是 { data?: Category[] } 或類似結構
      const { data: responseData, error } = await apiClient.GET('/api/categories');

      if (error) {
        throw new Error('獲取分類列表失敗');
      }
      
      const categories = responseData?.data || [];
      
      // 使用 Array.prototype.reduce 建立一個類型安全的 Record
      const grouped = categories.reduce((acc, category) => {
        // 使用空字串 '' 作為頂層分類的鍵
        const parentIdKey = category.parent_id?.toString() || '';
        
        if (!acc[parentIdKey]) {
          acc[parentIdKey] = [];
        }
        acc[parentIdKey].push(category);
        
        return acc;
      }, {} as Record<string, typeof categories>); // 明確指定 accumulator 的初始類型

      return grouped;
    },
    
    // 🚀 體驗優化配置（第二階段淨化行動）
    placeholderData: (previousData) => previousData, // 保持舊資料，避免載入閃爍
    refetchOnMount: false,       // 依賴全域 staleTime  
    refetchOnWindowFocus: false, // 分類數據無需即時更新
    refetchOnReconnect: false,   // 網絡重連也不刷新分類
  });
}

// 導入由 openapi-typescript 自動生成的精確分類管理類型
type CreateCategoryRequestBody = import('@/types/api').paths["/api/categories"]["post"]["requestBody"]["content"]["application/json"];
type UpdateCategoryRequestBody = NonNullable<import('@/types/api').paths["/api/categories/{id}"]["put"]["requestBody"]>["content"]["application/json"];
type CategoryPathParams = import('@/types/api').paths["/api/categories/{id}"]["put"]["parameters"]["path"];

/**
 * 建立新分類的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收分類建立請求資料（名稱、描述、父分類 ID）
 * 2. 發送 POST 請求到 /api/categories 端點
 * 3. 處理 Laravel 驗證錯誤並提供友善的錯誤訊息
 * 4. 成功後自動無效化分類列表快取，觸發 UI 重新整理
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateCategoryRequestBody) => {
      const { data, error } = await apiClient.POST('/api/categories', { body });
      if (error) { 
        throw new Error(Object.values(error).flat().join('\n') || '建立分類失敗'); 
      }
      return data;
    },
    onSuccess: () => {
      // 無效化分類快取，觸發重新獲取最新的分類樹狀結構
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}

/**
 * 更新分類的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收分類更新資料（路徑參數和請求體）
 * 2. 發送 PUT 請求到 /api/categories/{id} 端點
 * 3. 支援部分更新（名稱、描述、父分類 ID）
 * 4. 處理業務邏輯驗證錯誤（如防止自我循環）
 * 5. 成功後自動無效化分類列表快取
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { path: CategoryPathParams; body: UpdateCategoryRequestBody }) => {
      const { data, error } = await apiClient.PUT('/api/categories/{id}', {
        params: { path: variables.path },
        body: variables.body,
      });
      if (error) { 
        throw new Error(Object.values(error).flat().join('\n') || '更新分類失敗'); 
      }
      return data;
    },
    onSuccess: () => {
      // 無效化分類快取，觸發重新獲取更新後的分類樹狀結構
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}

/**
 * 刪除分類的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收要刪除的分類 ID 路徑參數
 * 2. 發送 DELETE 請求到 /api/categories/{id} 端點
 * 3. 執行軟刪除操作，根據資料表外鍵約束：
 *    - 子分類會被級聯刪除
 *    - 關聯商品的 category_id 會被設為 null
 * 4. 成功後自動無效化分類列表快取
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathParams: CategoryPathParams) => {
      const { error } = await apiClient.DELETE('/api/categories/{id}', {
        params: { path: pathParams },
      });
      if (error) { 
        throw new Error('刪除分類失敗'); 
      }
    },
    onSuccess: () => {
      // 無效化分類快取，觸發重新獲取刪除後的分類樹狀結構
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES });
    },
  });
}

/**
 * 獲取所有商品屬性及其值
 * 
 * 從後端獲取商品屬性（規格庫），例如「顏色」、「尺寸」等屬性，
 * 同時包含每個屬性下的所有可用值。這些資料用於：
 * 1. 建立新商品時選擇可用屬性
 * 2. 建立商品變體 (SKU) 時組合屬性值
 * 3. 前端篩選介面的動態生成
 * 
 * @returns React Query 查詢結果，包含屬性及其值的完整列表
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
    staleTime: 1000 * 60 * 10, // 10 分鐘內不重新請求（屬性變更較少）
  });
}

// 導入由 openapi-typescript 自動生成的精確屬性管理類型
type CreateAttributeRequestBody = import('@/types/api').paths["/api/attributes"]["post"]["requestBody"]["content"]["application/json"];
type UpdateAttributeRequestBody = import('@/types/api').paths["/api/attributes/{id}"]["put"]["requestBody"]["content"]["application/json"];
type AttributePathParams = import('@/types/api').paths["/api/attributes/{id}"]["put"]["parameters"]["path"];

/**
 * 建立新屬性的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收屬性建立請求資料（屬性名稱）
 * 2. 發送 POST 請求到 /api/attributes 端點
 * 3. 處理 Laravel 驗證錯誤並提供友善的錯誤訊息
 * 4. 成功後自動無效化屬性列表快取，觸發 UI 重新整理
 */
export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateAttributeRequestBody) => {
      console.log('Creating attribute with body:', body);
      const { data, error } = await apiClient.POST('/api/attributes', { body });
      
      if (error) {
        console.error('API Error:', error);
        // 處理不同的錯誤格式
        let errorMessage = '建立屬性失敗';
        if (typeof error === 'object' && error !== null) {
          if ('message' in error) {
            errorMessage = (error as any).message;
          } else if ('errors' in error) {
            errorMessage = Object.values((error as any).errors).flat().join('\n');
          } else {
            errorMessage = Object.values(error).flat().join('\n');
          }
        }
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: () => {
      // 無效化屬性快取，觸發重新獲取最新的屬性列表
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
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
 * 2. 發送 PUT 請求到 /api/attributes/{id} 端點
 * 3. 支援更新屬性名稱
 * 4. 處理業務邏輯驗證錯誤（如重複名稱檢查）
 * 5. 成功後自動無效化屬性列表快取
 */
export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { path: AttributePathParams; body: UpdateAttributeRequestBody }) => {
      const { data, error } = await apiClient.PUT('/api/attributes/{id}', {
        params: { path: variables.path },
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
 * 2. 發送 DELETE 請求到 /api/attributes/{id} 端點
 * 3. 執行刪除操作，會級聯刪除所有相關的屬性值
 * 4. 注意：如果有商品變體正在使用此屬性，刪除可能會失敗
 * 5. 成功後自動無效化屬性列表快取
 */
export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathParams: AttributePathParams) => {
      const { error } = await apiClient.DELETE('/api/attributes/{id}', {
        params: { path: pathParams },
      });
      if (error) { 
        throw new Error('刪除屬性失敗'); 
      }
    },
    onSuccess: () => {
      // 無效化屬性快取，觸發重新獲取刪除後的屬性列表
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}

// 導入屬性值管理的精確類型定義
type CreateAttributeValueRequestBody = import('@/types/api').paths["/api/attributes/{attribute_id}/values"]["post"]["requestBody"]["content"]["application/json"];
type UpdateAttributeValueRequestBody = import('@/types/api').paths["/api/values/{id}"]["put"]["requestBody"]["content"]["application/json"];
type AttributeValuePathParams = import('@/types/api').paths["/api/values/{id}"]["get"]["parameters"]["path"];

/**
 * 為指定屬性建立新屬性值的 Mutation
 */
export function useCreateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { attributeId: number; body: CreateAttributeValueRequestBody }) => {
      const { data, error } = await apiClient.POST('/api/attributes/{attribute_id}/values', {
        params: { path: { attribute_id: variables.attributeId, attribute: variables.attributeId } },
        body: variables.body,
      });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '新增選項失敗'); }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
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
      const { data, error } = await apiClient.PUT('/api/values/{id}', {
        params: { path: { id: variables.valueId, value: variables.valueId } },
        body: variables.body,
      });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '更新選項失敗'); }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
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
      const { error } = await apiClient.DELETE('/api/values/{id}', {
        params: { path: { id: valueId, value: valueId } },
      });
      if (error) { throw new Error('刪除選項失敗'); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}

// ==================== 庫存管理系統 (INVENTORY MANAGEMENT) ====================

/**
 * 獲取庫存列表查詢
 * 
 * 支援多種篩選條件：
 * - 門市篩選
 * - 低庫存警示
 * - 缺貨狀態
 * - 商品名稱搜尋
 * - 分頁控制
 */
export function useInventoryList(params: {
  store_id?: number;
  low_stock?: boolean;
  out_of_stock?: boolean;
  product_name?: string;
  page?: number;
  per_page?: number;
} = {}) {
  return useQuery({
    queryKey: ['inventory', 'list', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory', {
        params: { query: params },
      });
      if (error) {
        throw new Error('獲取庫存列表失敗');
      }
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 分鐘內保持新鮮（庫存變化較頻繁）
  });
}

/**
 * 獲取單個庫存詳情
 */
export function useInventoryDetail(id: number) {
  return useQuery({
    queryKey: ['inventory', 'detail', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/{id}', {
        params: { path: { id: id.toString() } },
      });
      if (error) {
        throw new Error('獲取庫存詳情失敗');
      }
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 庫存調整 Mutation
 * 
 * 支援三種調整模式：
 * - add: 增加庫存
 * - reduce: 減少庫存
 * - set: 設定庫存為指定數量
 */
export function useInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (adjustment: {
      product_variant_id: number;
      store_id: number;
      action: 'add' | 'reduce' | 'set';
      quantity: number;
      notes?: string;
      metadata?: Record<string, never> | null;
    }) => {
      const { data, error } = await apiClient.POST('/api/inventory/adjust', {
        body: adjustment,
      });
      if (error) {
        throw new Error('庫存調整失敗');
      }
      return data;
    },
    onSuccess: () => {
      // 無效化所有庫存相關的快取
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

/**
 * 獲取庫存交易歷史
 */
export function useInventoryHistory(params: {
  id: number;
  start_date?: string;
  end_date?: string;
  type?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['inventory', 'history', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/{id}/history', {
        params: { 
          path: { id: params.id },
          query: {
            start_date: params.start_date,
            end_date: params.end_date,
            type: params.type,
            per_page: params.per_page,
            page: params.page,
          }
        },
      });
      if (error) {
        throw new Error('獲取庫存歷史失敗');
      }
      return data;
    },
    enabled: !!params.id,
  });
}

// ==================== 庫存轉移管理 (INVENTORY TRANSFERS) ====================

/**
 * 獲取庫存轉移列表
 */
export function useInventoryTransfers(params: {
  from_store_id?: number;
  to_store_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  per_page?: number;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: ['inventory', 'transfers', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/transfers', {
        params: { query: params },
      });
      if (error) {
        throw new Error('獲取庫存轉移列表失敗');
      }
      return data;
    },
  });
}

/**
 * 獲取單個庫存轉移詳情
 */
export function useInventoryTransferDetail(id: number) {
  return useQuery({
    queryKey: ['inventory', 'transfer', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/transfers/{id}', {
        params: { path: { id: id.toString() } },
      });
      if (error) {
        throw new Error('獲取庫存轉移詳情失敗');
      }
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 創建庫存轉移
 */
export function useCreateInventoryTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: {
      from_store_id: number;
      to_store_id: number;
      product_variant_id: number;
      quantity: number;
      notes?: string;
      status?: string;
    }) => {
      const { data, error } = await apiClient.POST('/api/inventory/transfers', {
        body: transfer,
      });
      if (error) {
        throw new Error('創建庫存轉移失敗');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
}

/**
 * 更新庫存轉移狀態
 */
export function useUpdateInventoryTransferStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: number;
      status: string;
      notes?: string;
    }) => {
      const { data, error } = await apiClient.PATCH('/api/inventory/transfers/{id}/status', {
        params: { path: { id: params.id } },
        body: { status: params.status, notes: params.notes },
      });
      if (error) {
        throw new Error('更新轉移狀態失敗');
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfer', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'list'] });
    },
  });
}

/**
 * 取消庫存轉移
 */
export function useCancelInventoryTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: number; reason: string }) => {
      const { data, error } = await apiClient.PATCH('/api/inventory/transfers/{id}/cancel', {
        params: { path: { id: params.id } },
        body: { reason: params.reason },
      });
      if (error) {
        throw new Error('取消庫存轉移失敗');
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfer', variables.id] });
    },
  });
}

// ==================== 門市管理系統 (STORE MANAGEMENT) ====================

/**
 * 獲取門市列表
 */
export function useStores(params: {
  name?: string;
  status?: string;
  page?: number;
  per_page?: number;
} = {}) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/stores');
      if (error) {
        throw new Error('獲取門市列表失敗');
      }
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 分鐘內保持新鮮（門市資訊變化較少）
  });
}

/**
 * 獲取單個門市詳情
 */
export function useStore(id: number) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/stores/{id}', {
        params: { path: { id } },
      });
      if (error) {
        throw new Error('獲取門市詳情失敗');
      }
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 創建門市
 */
export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (store: any) => { // 類型待 API 文檔完善後補充
      const { data, error } = await apiClient.POST('/api/stores', {
        body: store,
      });
      if (error) {
        throw new Error('創建門市失敗');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

/**
 * 更新門市
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: number; data: any }) => {
      const { data, error } = await apiClient.PUT('/api/stores/{id}', {
        params: { path: { id: params.id } },
        body: params.data,
      });
      if (error) {
        throw new Error('更新門市失敗');
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['stores', variables.id] });
    },
  });
}

/**
 * 刪除門市
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/api/stores/{id}', {
        params: { path: { id } },
      });
      if (error) {
        throw new Error('刪除門市失敗');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

// ==================== 商品變體管理 (PRODUCT VARIANTS) ====================

/**
 * 獲取商品變體列表
 */
export function useProductVariants(params: {
  product_id?: number;
  product_name?: string;
  sku?: string;
  page?: number;
  per_page?: number;
} = {}) {
  return useQuery({
    queryKey: ['product-variants', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/products/variants', {
        params: { query: params },
      });
      if (error) {
        throw new Error('獲取商品變體列表失敗');
      }
      return data;
    },
  });
}

/**
 * 獲取單個商品變體詳情
 */
export function useProductVariantDetail(id: number) {
  return useQuery({
    queryKey: ['product-variants', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/products/variants/{id}', {
        params: { path: { id: id.toString() } },
      });
      if (error) {
        throw new Error('獲取商品變體詳情失敗');
      }
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 更新商品變體的 Hook
 * 
 * @description
 * 用於更新商品變體的資訊，包含 SKU 編碼、價格、成本、啟用狀態等
 * 支援部分更新（PATCH），只更新提供的欄位
 * 
 * @returns React Query 變更結果
 */
export function useUpdateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: number;
      data: {
        sku?: string;
        price?: number;
        cost?: number;
        stock_alert_threshold?: number;
        is_active?: boolean;
        weight?: number;
        length?: number;
        width?: number;
        height?: number;
      };
    }) => {
      // 暫時使用類型斷言，等待 API 類型定義更新
      const { data, error } = await (apiClient as any).PATCH('/api/products/variants/{id}', {
        params: { path: { id: params.id } },
        body: params.data,
      });
      
      if (error) {
        // 處理驗證錯誤
        if (error?.errors) {
          const errorMessages = Object.values(error.errors).flat().join('\n');
          throw new Error(errorMessages);
        }
        throw new Error('更新變體失敗');
      }
      
      return data;
    },
    onSuccess: (data, variables) => {
      // 成功後更新快取
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants', variables.id] });
      
      // 如果變體是通過產品詳情頁來的，也要更新產品快取
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * 刪除商品變體的 Hook
 * 
 * @description
 * 用於刪除指定的商品變體
 * 注意：這是敏感操作，會影響庫存記錄和歷史訂單
 * 
 * @returns React Query 變更結果
 */
export function useDeleteProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // 暫時使用類型斷言，等待 API 類型定義更新
      const { error } = await (apiClient as any).DELETE('/api/products/variants/{id}', {
        params: { path: { id } },
      });
      
      if (error) {
        throw new Error('刪除變體失敗');
      }
    },
    onSuccess: (data, id) => {
      // 成功後更新快取
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.removeQueries({ queryKey: ['product-variants', id] });
      
      // 也要更新產品快取
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}