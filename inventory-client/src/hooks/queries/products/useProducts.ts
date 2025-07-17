import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { ProductFilters, ProductItem, ProductVariant } from '@/types/api-helpers';
import { QUERY_KEYS } from '../shared/queryKeys';
import { createIntelligentQueryConfig } from '../shared/config';

/**
 * API Hooks - 商品管理 - 性能優化版
 * 使用生成的 API 類型定義進行類型安全的資料操作
 * 
 * 性能優化特性：
 * 1. 智能緩存配置，根據使用模式動態調整
 * 2. 優化的數據轉換邏輯，減少重複計算
 * 3. 記憶化查詢參數構建
 * 4. 數據預處理和規範化
 */

/**
 * 商品數據處理器 - 緩存和記憶化優化
 */
class ProductDataProcessor {
  private static cache = new Map<string, unknown>();
  
  /**
   * 處理原始 API 響應數據
   */
  static processApiResponse(response: unknown, storeId?: number): unknown[] {
    if (!response) return [];
    
    // 🎯 移除緩存機制 - 庫存數據應該總是即時的
    
    // 解包：處理 Laravel 分頁格式
    const products = response?.data?.data || response?.data || [];
    
    // 確保是陣列
    if (!Array.isArray(products)) {
      console.warn('useProducts - 期望陣列但收到:', products);
      return [];
    }

    // 如果沒有產品，直接返回空陣列
    if (products.length === 0) {
      return [];
    }
    
    // 數據規範化處理
    const processedProducts = products.map(product => ({
      ...product,
      // 確保必要欄位存在
      id: product.id || 0,
      name: product.name || '',
      description: product.description || null,
      category_id: product.category_id || null,
      // 預處理圖片 URL - 使用正確的 API 結構
      image_url: product.image_urls?.original || null,
      thumbnail_url: product.image_urls?.thumb || product.image_urls?.original || null,
      has_image: Boolean(product.image_urls?.original || product.image_urls?.thumb),
      // 預處理變體信息
      variants: Array.isArray(product.variants) ? product.variants : [],
      variants_count: Array.isArray(product.variants) ? product.variants.length : 0,
      // 預計算常用統計
      total_stock: Array.isArray(product.variants) 
        ? product.variants.reduce((sum: number, variant: Record<string, unknown>) => {
            // 優先使用 stock 欄位，如果沒有則從 inventory 陣列計算
            if (variant.stock !== undefined) {
              return sum + (Number(variant.stock) || 0);
            }
            // 如果有 inventory 陣列，計算總和
            if (Array.isArray(variant.inventory)) {
              const variantStock = variant.inventory.reduce((invSum: number, inv: any) => 
                invSum + (Number(inv.quantity) || 0), 0);
              return sum + variantStock;
            }
            return sum;
          }, 0)
        : 0,
    }));
    
    // 🎯 不再緩存處理結果 - 庫存數據應該總是即時的
    
    return processedProducts;
  }
  
  /**
   * 清理緩存
   */
  static clearCache() {
    this.cache.clear();
  }
}

/**
 * 查詢參數構建器 - 記憶化優化
 */
function useQueryParamsBuilder(filters: ProductFilters) {
  return useMemo(() => {
    const queryParams: Record<string, string | number | boolean> = {};
    
    if (filters.product_name) queryParams.product_name = filters.product_name;
    if (filters.store_id !== undefined) queryParams.store_id = filters.store_id;
    if (filters.category_id !== undefined) queryParams.category_id = filters.category_id;
    if (filters.low_stock !== undefined) queryParams.low_stock = filters.low_stock;
    if (filters.out_of_stock !== undefined) queryParams.out_of_stock = filters.out_of_stock;
    if (filters.search) queryParams['filter[search]'] = filters.search;
    if (filters.page !== undefined) queryParams.page = filters.page;
    if (filters.per_page !== undefined) queryParams.per_page = filters.per_page;

    return Object.keys(queryParams).length > 0 ? queryParams : undefined;
  }, [filters]);
}

/**
 * 商品列表查詢 Hook - 性能優化版
 * 
 * 新增優化特性：
 * 1. 智能查詢配置，根據使用模式動態調整緩存
 * 2. 記憶化查詢參數構建，避免重複計算
 * 3. 優化的數據處理器，減少 select 函數重複執行
 * 4. 減少開發環境日誌輸出的性能影響
 * 5. 更高效的數據規範化和預計算
 * 
 * @param filters - 篩選參數物件，包含所有可用的篩選條件
 * @returns React Query 查詢結果，返回處理乾淨、類型完美的 ProductItem 陣列
 */
export function useProducts(filters: ProductFilters = {}) {
    // 記憶化查詢參數構建
    const queryParams = useQueryParamsBuilder(filters);
    
    // 記憶化查詢鍵 - 使用具體的值而不是整個 filters 對象，避免引用問題
    const queryKey = useMemo(() => [
        ...QUERY_KEYS.PRODUCTS, 
        {
            product_name: filters.product_name,
            store_id: filters.store_id,
            category_id: filters.category_id,
            low_stock: filters.low_stock,
            out_of_stock: filters.out_of_stock,
            search: filters.search,
            page: filters.page,
            per_page: filters.per_page
        }
    ], [
        filters.product_name,
        filters.store_id,
        filters.category_id,
        filters.low_stock,
        filters.out_of_stock,
        filters.search,
        filters.page,
        filters.per_page
    ]);
    
    // 🎯 調試：只在首次查詢時記錄
    // 移除過度日誌以避免控制台混亂
    
    // 🎯 如果有 store_id，使用較短的緩存時間，平衡即時性和性能
    const baseConfig = filters.store_id 
        ? { staleTime: 10 * 1000, gcTime: 30 * 1000 } // 10秒緩存，30秒垃圾回收
        : createIntelligentQueryConfig(queryKey, 'STABLE', true);
    
    return useQuery({
        ...baseConfig,
        queryKey,
        queryFn: async () => {
            const { data, error } = await apiClient.GET('/api/products', {
                params: { 
                    query: queryParams
                }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取商品列表失敗');
            }

            // 日誌已移除以減少控制台噪音

            return data;
        },
        
        // 🎯 使用優化的數據處理器，傳遞 store_id 以便正確緩存
        select: (response: unknown) => ProductDataProcessor.processApiResponse(response, filters.store_id),
        
        // 🎯 恢復 placeholderData 以提升用戶體驗
        placeholderData: (previousData) => previousData,
        refetchOnMount: filters.store_id ? true : false, // 有 store_id 時總是重新獲取
        refetchOnWindowFocus: false,
        retry: 2,
    });
}

/**
 * 處理過的商品數據結構 - 保證類型完整性（零容忍版本）
 */
export interface ProcessedProduct {
    id: number;
    name: string;
    description: string | null;
    category_id: number | null;
    category?: {
        id: number;
        name: string;
        parent_id?: number;
    };
    attributes: Array<ProcessedProductAttribute>;
    variants: Array<ProcessedProductVariant>;
    image_url?: string;
    thumbnail_url?: string;
    has_image: boolean;
    image_urls?: string[];
    created_at: string;
    updated_at: string;
}

/**
 * 商品屬性類型定義
 */
export interface ProcessedProductAttribute {
    id: number;
    name: string;
    type: string;
}

/**
 * 商品變體類型定義
 */
export interface ProcessedProductVariant {
    id: number;
    sku: string;
    price: number;
    cost_price?: number;
    stock_quantity: number;
    attribute_values?: Array<ProcessedProductAttributeValue>;
    inventory?: Array<{
        id: number;
        store_id: number;
        quantity: number;
        reserved_quantity: number;
        available_quantity: number;
        store?: {
            id: number;
            name: string;
        };
    }>;
}

/**
 * 屬性值類型定義
 */
export interface ProcessedProductAttributeValue {
    id: number;
    attribute_id: number;
    value: string;
    attribute?: {
        id: number;
        name: string;
        type: string;
    };
}

/**
 * 商品詳情查詢 Hook - 權威數據源（已統一）
 * 
 * 🚀 此 Hook 是獲取商品詳情的唯一權威來源，提供完整且類型安全的商品資訊：
 * 1. SPU 基本資訊 (name, description, category)
 * 2. 商品屬性列表 (attributes) - 總是包含
 * 3. 所有 SKU 變體詳情 (variants with attribute values) - 總是包含
 * 4. 圖片資訊 (image_urls, has_image)
 * 5. 完整的類型安全保證
 * 
 * @param productId - 商品 ID
 * @returns React Query 查詢結果，返回 ProcessedProduct 類型
 */
export function useProductDetail(productId: number | string | undefined) {
    // 確保 productId 是有效的數字
    const numericId = productId ? Number(productId) : undefined;
    
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCT(numericId!), 'detail'],
        queryFn: async () => {
            if (!numericId) {
                throw new Error('商品 ID 無效');
            }

            const { data, error } = await apiClient.GET('/api/products/{product}', {
                params: { path: { product: numericId } }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取商品詳情失敗');
            }

            return data;
        },
        // 🎯 數據精煉廠 - 確保類型完整性和數據一致性
        select: (response: unknown): ProcessedProduct | null => {
            const rawProduct = response?.data;
            
            if (!rawProduct) {
                return null; // 返回 null 而不是拋出錯誤，讓組件層處理
            }
            
            // 確保 attributes 總是存在且為陣列
            const attributes = Array.isArray(rawProduct.attributes) 
                ? rawProduct.attributes 
                : [];
            
            // 確保 variants 總是存在且為陣列
            const variants = Array.isArray(rawProduct.variants) 
                ? rawProduct.variants 
                : [];
            
            // 返回完整且類型安全的商品數據
            return {
                id: rawProduct.id || 0,
                name: rawProduct.name || '',
                description: rawProduct.description || null,
                category_id: rawProduct.category_id || null,
                category: rawProduct.category,
                attributes: attributes.map((attr: unknown): ProcessedProductAttribute => {
                    const a = attr as Record<string, unknown>;
                    return {
                        id: a?.id || 0,
                        name: a?.name || '',
                        type: a?.type || 'text',
                    };
                }),
                variants: variants.map((variant: unknown): ProcessedProductVariant => {
                    const v = variant as Record<string, unknown>;
                    return {
                        id: v?.id || 0,
                        sku: v?.sku || '',
                        price: v?.price || 0,
                        stock_quantity: v?.stock_quantity || 0,
                        attribute_values: Array.isArray(v?.attribute_values) 
                            ? v.attribute_values.map((av: unknown): ProcessedProductAttributeValue => {
                                const a = av as Record<string, unknown>;
                                return {
                                    id: a?.id || 0,
                                    attribute_id: a?.attribute_id || 0,
                                    value: a?.value || '',
                                    attribute: a?.attribute ? {
                                        id: a.attribute.id || 0,
                                        name: a.attribute.name || '',
                                        type: a.attribute.type || 'text',
                                    } : undefined,
                                };
                            })
                            : [],
                        inventory: Array.isArray(v?.inventory) ? v.inventory : [],
                        cost_price: v?.cost_price,
                    };
                }),
                image_url: rawProduct.image_url,
                thumbnail_url: rawProduct.thumbnail_url,
                has_image: rawProduct.has_image || false,
                image_urls: rawProduct.image_urls,
                created_at: rawProduct.created_at || '',
                updated_at: rawProduct.updated_at || '',
                ...rawProduct
            };
        },
        enabled: !!numericId, // 只有當有效的 ID 存在時才執行查詢
        staleTime: 5 * 60 * 1000, // 5 分鐘緩存時間，編輯期間避免重複請求
        retry: 2, // 失敗時重試 2 次
    });
}

// 導入由 openapi-typescript 生成的精確類型
type CreateProductRequestBody = import('@/types/api').paths["/api/products"]["post"]["requestBody"]["content"]["application/json"];

/**
 * 創建商品的 Hook (SPU/SKU 架構)
 * 
 * 支援完整的 SPU/SKU 商品創建流程：
 * 1. 創建 SPU (Standard Product Unit) - 標準商品單位
 * 2. 關聯商品屬性 (attributes)
 * 3. 創建 SKU 變體 (variants) - 庫存保管單位
 * 4. 自動初始化所有門市的庫存記錄
 * 
 * @returns React Query 變更結果
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: CreateProductRequestBody) => {
            // 調試：記錄請求資料
            if (process.env.NODE_ENV === 'development') {
                console.log('useCreateProduct - Request Data:', productData);
            }
            
            const { data, error } = await apiClient.POST('/api/products', {
                body: productData
            });
            
            // 調試：記錄響應
            if (process.env.NODE_ENV === 'development') {
                console.log('useCreateProduct - Response:', {
                    hasData: !!data,
                    hasError: !!error,
                    data,
                    error
                });
            }
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage);
            }
            
            return data;
        },
        onSuccess: async (data: { data?: { name?: string } }) => {
            // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
            await Promise.all([
                // 1. 失效所有商品相關查詢緩存 - 包括所有參數組合
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        return query.queryKey[0] === 'products';
                    },
                }),
                // 2. 強制重新獲取所有活躍的商品查詢
                queryClient.refetchQueries({
                    predicate: (query) => {
                        return query.queryKey[0] === 'products';
                    },
                })
            ]);
            
            // 使用 toast 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.success('商品創建成功！', {
                    description: `商品「${data?.data?.name}」已成功創建，商品列表已自動更新。`
                });
            }
        },
        onError: async (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('商品創建失敗', {
                    description: error.message || '請檢查輸入資料並重試。'
                });
            }
        },
    });
}

// 🎯 使用精確的 API 類型定義，從生成的類型文件中獲取確切的請求體結構
type UpdateProductRequestBody = import('@/types/api').paths["/api/products/{product}"]["put"]["requestBody"]["content"]["application/json"];

/**
 * 更新商品的 Hook (SPU/SKU 架構升級版)
 * 
 * 支援完整的 SPU/SKU 商品更新流程：
 * 1. 更新 SPU (Standard Product Unit) - 標準商品單位
 * 2. 重新關聯商品屬性 (attributes)
 * 3. 智能 SKU 變體管理 (variants) - 新增/修改/刪除
 * 4. 自動同步所有門市的庫存記錄
 * 
 * @returns React Query 變更結果
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateProductRequestBody }) => {
            const { data: result, error } = await apiClient.PUT('/api/products/{product}', {
                params: { path: { product: id } },
                body: data,
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '更新商品失敗');
            }
            
            return result;
        },
        onSuccess: async (data, variables) => {
            // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
            await Promise.all([
                // 1. 失效所有商品相關查詢緩存 - 包括所有參數組合
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        return query.queryKey[0] === 'products';
                    },
                }),
                // 2. 強制重新獲取所有活躍的商品查詢
                queryClient.refetchQueries({
                    predicate: (query) => {
                        return query.queryKey[0] === 'products';
                    },
                }),
                // 3. 單個實體詳情頁的快取處理
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(variables.id) }),
                queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PRODUCT(variables.id), 'detail'] })
            ]);
            
            // 🎯 在 Hook 層級不顯示 toast，讓組件層級處理
            // 這樣可以提供更靈活的用戶反饋控制
        },
        onError: async (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('商品更新失敗', {
                    description: error.message || '請檢查輸入資料並重試。'
                });
            }
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
            const { data, error } = await apiClient.DELETE('/api/products/{product}', {
                params: { path: { product: id } },
            });
            
            if (error) {
                // 使用統一的錯誤解析器
                const errorMessage = parseApiError(error) || '刪除商品失敗';
                throw new Error(errorMessage);
            }
            
            return data;
        },
        onSuccess: async (data, id) => {
            // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
            await Promise.all([
                // 1. 失效所有商品查詢緩存
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.PRODUCTS,
                    exact: false,
                    refetchType: 'active',
                }),
                // 2. 強制重新獲取所有活躍的商品查詢
                queryClient.refetchQueries({
                    queryKey: QUERY_KEYS.PRODUCTS,
                    exact: false,
                }),
                // 3. 移除特定商品的快取
                queryClient.removeQueries({ queryKey: QUERY_KEYS.PRODUCT(id) })
            ]);
            
            // 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.success('商品刪除成功！', {
                    description: '商品已成功刪除，商品列表已自動更新。'
                });
            }
        },
        onError: async (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('商品刪除失敗', {
                    description: error.message || '請檢查並重試。'
                });
            }
        },
    });
}

/**
 * 批量刪除商品的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useDeleteMultipleProducts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { ids: number[] }) => {
            const { data, error } = await apiClient.POST('/api/products/batch-delete', {
                body: { ids: payload.ids.map(String) }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '批量刪除商品失敗');
            }
            
            return data;
        },
        onSuccess: async (data) => {
            // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
            await Promise.all([
                // 1. 失效所有商品查詢緩存
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.PRODUCTS,
                    exact: false,
                    refetchType: 'active',
                }),
                // 2. 強制重新獲取所有活躍的商品查詢
                queryClient.refetchQueries({
                    queryKey: QUERY_KEYS.PRODUCTS,
                    exact: false,
                })
            ]);
            
            // 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.success('批量刪除成功！', {
                    description: `已成功刪除 ${(data as Record<string, unknown>)?.data ? ((data as Record<string, unknown>).data as Record<string, unknown>)?.deleted_count || 0 : 0} 個商品。`
                });
            }
        },
        onError: async (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('批量刪除失敗', {
                    description: error.message || '請檢查並重試。'
                });
            }
        },
    });
}

/**
 * 商品變體查詢 Hook
 * 
 * @param params - 查詢參數
 * @param options - 查詢選項
 * @returns React Query 查詢結果
 */
export function useProductVariants(params: {
    product_id?: number;
    product_name?: string;
    sku?: string;
    page?: number;
    per_page?: number;
} = {}, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCT_VARIANTS, params],
        queryFn: async () => {
            // 構建查詢參數
            const queryParams: Record<string, string | number> = {};
            
            if (params.product_id) queryParams.product_id = params.product_id;
            if (params.product_name) queryParams.product_name = params.product_name;
            if (params.sku) queryParams.sku = params.sku;
            if (params.page) queryParams.page = params.page;
            if (params.per_page) queryParams.per_page = params.per_page;

            const { data, error } = await apiClient.GET('/api/products/variants', {
                params: { 
                    query: Object.keys(queryParams).length > 0 ? queryParams : undefined 
                }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取商品變體失敗');
            }

            return data;
        },
        // 🎯 數據精煉廠 - 確保類型安全和數據一致性
        select: (response: unknown) => {
            // 解包 API 響應數據，確保返回陣列格式
            const variants = response?.data || [];
            if (!Array.isArray(variants)) return [];
            
            // 進行數據清理和類型轉換
            return variants.map((variant: unknown) => {
                const v = variant as Record<string, unknown>;
                return {
                id: v.id as number || 0,
                sku: v.sku as string || '',
                price: parseFloat((v.price as string) || '0'),
                product_id: v.product_id as number || 0,
                created_at: v.created_at as string || '',
                updated_at: v.updated_at as string || '',
                // 商品資訊
                product: v.product ? {
                    id: (v.product as Record<string, unknown>).id as number || 0,
                    name: (v.product as Record<string, unknown>).name as string || '未知商品',
                    description: (v.product as Record<string, unknown>).description as string || null,
                } : null,
                // 屬性值資訊
                attribute_values: Array.isArray(v.attribute_values) 
                    ? (v.attribute_values as unknown[]).map((av: unknown) => {
                        const avRecord = av as Record<string, unknown>;
                        return {
                            id: avRecord.id as number || 0,
                            value: avRecord.value as string || '',
                            attribute_id: avRecord.attribute_id as number || 0,
                            attribute: avRecord.attribute ? {
                                id: (avRecord.attribute as Record<string, unknown>).id as number || 0,
                                name: (avRecord.attribute as Record<string, unknown>).name as string || '',
                            } : null,
                        };
                    })
                    : [],
                // 庫存資訊
                inventory: Array.isArray(v.inventory) 
                    ? (v.inventory as unknown[]).map((inv: unknown) => {
                        const invRecord = inv as Record<string, unknown>;
                        return {
                            id: invRecord.id as number || 0,
                            quantity: parseInt((invRecord.quantity as string) || '0', 10),
                            low_stock_threshold: parseInt((invRecord.low_stock_threshold as string) || '0', 10),
                            store: invRecord.store ? {
                                id: (invRecord.store as Record<string, unknown>).id as number || 0,
                                name: (invRecord.store as Record<string, unknown>).name as string || '未知門市',
                            } : null,
                        };
                    })
                    : [],
                // 保留原始數據
                ...v
                };
            });
        },
        enabled: options?.enabled !== false,
        staleTime: 2 * 60 * 1000, // 2 分鐘緩存時間
        retry: 2,
    });
}

/**
 * 商品變體詳情查詢 Hook
 * 
 * @param id - 變體 ID
 * @returns React Query 查詢結果
 */
export function useProductVariantDetail(id: number) {
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCT_VARIANT(id), 'detail'],
        queryFn: async () => {
            const { data, error } = await apiClient.GET('/api/products/variants/{variant}', {
                params: { path: { variant: id } }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取變體詳情失敗');
            }

            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 分鐘緩存時間
        retry: 2,
    });
}

/**
 * 商品圖片上傳 Hook
 * 
 * @returns React Query 變更結果
 */
type UploadProductImagePayload = {
    productId: number;
    image: File;
};

export function useUploadProductImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, image }: UploadProductImagePayload) => {
            const formData = new FormData();
            formData.append('image', image);

            // 使用原生 fetch 避免 openapi-fetch 對 FormData 的處理問題
            // 並正確處理身份驗證
            const session = await (await import('next-auth/react')).getSession();
            const accessToken = session?.accessToken;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}/upload-image`, {
                method: 'POST',
                body: formData,
                headers: {
                    // 不設置 Content-Type，讓瀏覽器自動設置正確的 multipart/form-data boundary
                    'Accept': 'application/json',
                    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // 如果是驗證錯誤，提取詳細錯誤信息
                if (response.status === 422 && errorData.errors) {
                    const errorMessages = Object.values(errorData.errors)
                        .flat()
                        .join('\n');
                    throw new Error(errorMessages || '圖片驗證失敗');
                }
                
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        },
        onSuccess: async (data, variables) => {
            // 失效相關的快取
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(variables.productId) }),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
            ]);
            
            // 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.success('圖片上傳成功！', {
                    description: '商品圖片已更新。'
                });
            }
        },
        onError: async (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = await import('sonner');
                toast.error('圖片上傳失敗', {
                    description: error.message || '請檢查圖片格式並重試。'
                });
            }
        },
    });
} 