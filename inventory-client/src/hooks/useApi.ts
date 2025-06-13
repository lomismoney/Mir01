import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

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
 * 商品列表查詢 Hook
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
        staleTime: 1000 * 60 * 5, // 5 分鐘內不重新請求
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
      // 呼叫新的 POST 端點
      const { error } = await apiClient.POST('/api/products/batch-delete', {
        body,
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

/**
 * API 登入認證類型定義
 * 從 OpenAPI 規格中提取的登入請求資料結構
 */
type LoginCredentials = NonNullable<
  import('@/types/api').paths['/api/login']['post']['requestBody']
>['content']['application/json'];

// 這些類型現在將由 api.ts 精確提供
type UserQueryParams = import('@/types/api').paths["/api/users"]["get"]["parameters"]["query"];
type CreateUserRequestBody = import('@/types/api').paths["/api/users"]["post"]["requestBody"]["content"]["application/json"];
type UpdateUserRequestBody = import('@/types/api').paths["/api/users/{id}"]["put"]["requestBody"]["content"]["application/json"];
type UserPathParams = import('@/types/api').paths["/api/users/{id}"]["get"]["parameters"]["path"];

/**
 * 使用者登入的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 接收使用者名稱和密碼憑證
 * 2. 發送登入請求到後端 API
 * 3. 處理登入錯誤並提供友善的錯誤訊息
 * 4. 成功時回傳使用者資訊和 API Token
 */
export function useLogin() {
    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            const { data, error } = await apiClient.POST('/api/login', {
                body: credentials,
            });

            if (error) {
                // 嘗試解析後端更詳細的錯誤訊息
                const errorMessage = (error as { username?: string[] }).username?.[0] || '登入失敗';
                throw new Error(errorMessage);
            }
            
            return data; // 回傳 { user, token }
        },
    });
}

/**
 * 使用者登出的 Mutation
 * 
 * @returns React Query 變更結果
 * 
 * 功能說明：
 * 1. 調用後端 /api/logout 端點
 * 2. 在伺服器端銷毀使用者的 API Token
 * 3. 確保完整的登出流程，防止 'zombie token' 安全漏洞
 */
export function useLogout() {
    return useMutation({
        mutationFn: async () => {
            const { error } = await apiClient.POST('/api/logout');

            if (error) {
                // 登出錯誤通常不是致命的，記錄但不阻止流程
                console.warn('後端登出請求失敗:', error);
            }
            
            // 無論後端請求是否成功，都繼續前端登出流程
            return null;
        },
    });
}

/**
 * 獲取用戶列表 (最終版 - 標準化查詢鍵)
 */
export function useUsers(filters?: UserQueryParams) {
  return useQuery({
    // 正確的結構：['users', { filter... }]
    // 這是一個扁平陣列，第一項是資源名稱，第二項是參數物件
    queryKey: ['users', filters], 
    
    queryFn: async ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      // 添加 include=stores 參數，確保獲取用戶的分店關係
      const queryParams: UserQueryParams & { include?: string } = {
        ...(queryFilters as UserQueryParams),
        include: 'stores',
      };
      
      // …rest of the function
    }
      const { data, error } = await apiClient.GET('/api/users', {
        params: { query: queryParams },
      });
      if (error) { throw new Error('獲取用戶列表失敗'); }
      
      // 確保返回資料結構統一，處理 Laravel 分頁結構
      // 分頁響應結構: { data: [...用戶列表], meta: {...分頁資訊} }
      return data;
    },
  });
}

/**
 * 建立新用戶的 Mutation (最終版 - 標準化無效化)
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateUserRequestBody) => {
      const { data, error } = await apiClient.POST('/api/users', { body });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '建立用戶失敗'); }
      return data;
    },
    onSuccess: () => {
      // 這個指令會將所有以 ['users'] 為開頭的查詢鍵都標記為"過時"
      // 這將成功匹配到 ['users', filters] 並觸發資料重新整理
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * 更新用戶的 Mutation (最終版 - 標準化無效化)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { path: UserPathParams; body: UpdateUserRequestBody }) => {
      const { data, error } = await apiClient.PUT('/api/users/{id}', {
        params: { path: variables.path },
        body: variables.body,
      });
      if (error) { throw new Error(Object.values(error).flat().join('\n') || '更新用戶失敗');}
      return data;
    },
    onSuccess: (_, variables) => {
      // 這個指令會將所有以 ['users'] 為開頭的查詢鍵都標記為"過時"
      // 這將成功匹配到 ['users', filters] 並觸發資料重新整理
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.path.user] }); 
    },
  });
}

/**
 * 刪除單一用戶的 Mutation (最終版 - 標準化無效化)
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
    onSuccess: (_, pathParams) => {
      // 這個指令會將所有以 ['users'] 為開頭的查詢鍵都標記為"過時"
      // 這將成功匹配到 ['users', filters] 並觸發資料重新整理
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.removeQueries({ queryKey: ['user', pathParams.user] });
    },
  });
}

/**
 * 獲取所有商品分類
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
      const { data, error } = await (apiClient as any).GET('/api/categories');
      if (error) {
        throw new Error('獲取分類列表失敗');
      }
      // 後端回傳的已是按 parent_id 分組的結構
      return data?.data || data || []; 
    },
    staleTime: 1000 * 60 * 5, // 5 分鐘內不重新請求
  });
}

// 導入由 openapi-typescript 自動生成的精確分類管理類型
type CreateCategoryRequestBody = import('@/types/api').paths["/api/categories"]["post"]["requestBody"]["content"]["application/json"];
type UpdateCategoryRequestBody = import('@/types/api').paths["/api/categories/{id}"]["put"]["requestBody"]["content"]["application/json"];
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
      // 暫時使用 fetch 直接調用，直到 API 文檔修復
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/attributes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('獲取屬性列表失敗');
      }
      
      const result = await response.json();
      return result.data || result; // 適應不同的響應格式
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
      const { data, error } = await apiClient.POST('/api/attributes', { body });
      if (error) { 
        throw new Error(Object.values(error).flat().join('\n') || '建立屬性失敗'); 
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

/**
 * 為指定屬性建立新屬性值的 Mutation (標準版)
 */
export function useCreateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { 
      attributeId: number; 
      body: { value: string; } 
    }) => {
      const { data, error } = await apiClient.POST('/api/attributes/{attribute_id}/values', {
        params: {
          path: {
            attribute_id: variables.attributeId,
            attribute: variables.attributeId
          }
        },
        body: variables.body,
      });

      if (error) {
        throw new Error(Object.values(error).flat().join('\n') || '新增選項失敗');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}

/**
 * 更新屬性值的 Mutation (標準版)
 */
export function useUpdateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { 
      valueId: number; 
      body: { value: string; } 
    }) => {
      const { data, error } = await apiClient.PUT('/api/values/{id}', {
        params: {
          path: {
            id: variables.valueId,
            value: variables.valueId
          }
        },
        body: variables.body,
      });

      if (error) {
        throw new Error(Object.values(error).flat().join('\n') || '更新選項失敗');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}

/**
 * 刪除屬性值的 Mutation (標準版)
 */
export function useDeleteAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valueId: number) => {
                    const { error } = await apiClient.DELETE('/api/values/{id}', {
         params: {
           path: {
             id: valueId,
             value: valueId
           }
         },
      });

      if (error) {
        throw new Error('刪除選項失敗');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ATTRIBUTES });
    },
  });
}