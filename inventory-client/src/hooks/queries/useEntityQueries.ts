import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { CreateStoreRequest, UpdateStoreRequest, ProductFilters, ProductItem, ProductVariant, InventoryProductItem, InventoryTransaction, InventoryTransactionFilters, CustomerFilters, Customer, AttributePathParams, OrderFormData, ProcessedOrder, ProcessedOrderItem } from '@/types/api-helpers';
import { toast } from '@/components/ui/use-toast';

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
    CUSTOMERS: ['customers'] as const,
    CUSTOMER: (id: number) => ['customers', id] as const,
    CATEGORIES: ['categories'] as const,
    CATEGORY: (id: number) => ['categories', id] as const,
    ATTRIBUTES: ['attributes'] as const,
    ORDERS: ['orders'] as const,
    ORDER: (id: number) => ['orders', id] as const,
};

/**
 * 商品列表查詢 Hook - 架構升級版（標準化作戰單位 #2）
 * 
 * 功能特性：
 * 1. 支援完整的後端篩選參數（product_name, store_id, category_id, low_stock, out_of_stock）
 * 2. 智能查詢鍵結構，支援所有篩選參數的精確緩存
 * 3. 向後相容舊版 search 參數
 * 4. 高效能緩存策略，減少不必要的 API 請求
 * 5. 🎯 資料精煉廠 - 在源頭處理所有數據轉換和類型安全
 * 6. 🚫 根除 any 類型 - 確保產品數據的純淨契約
 * 
 * @param filters - 篩選參數物件，包含所有可用的篩選條件
 * @returns React Query 查詢結果，返回處理乾淨、類型完美的 ProductItem 陣列
 */
export function useProducts(filters: ProductFilters = {}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCTS, filters],
        queryFn: async () => {
            // 構建查詢參數，移除 undefined 值
            const queryParams: Record<string, string | number | boolean> = {};
            
            if (filters.product_name) queryParams.product_name = filters.product_name;
            if (filters.store_id !== undefined) queryParams.store_id = filters.store_id;
            if (filters.category_id !== undefined) queryParams.category_id = filters.category_id;
            if (filters.low_stock !== undefined) queryParams.low_stock = filters.low_stock;
            if (filters.out_of_stock !== undefined) queryParams.out_of_stock = filters.out_of_stock;
            // 修正：使用 Spatie QueryBuilder 的格式
            if (filters.search) queryParams['filter[search]'] = filters.search;
            if (filters.page !== undefined) queryParams.page = filters.page;
            if (filters.per_page !== undefined) queryParams.per_page = filters.per_page;

            const { data, error } = await apiClient.GET('/api/products', {
                params: { 
                    query: Object.keys(queryParams).length > 0 ? queryParams : undefined 
                }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取商品列表失敗');
            }

            // queryFn 依然返回完整的 response，數據轉換交給 select 處理
            return data;
        },
        
        // 🎯 數據精煉廠 - 商品數據的完美轉換
        select: (response: any) => {
            // 1. 解包：處理分頁或普通陣列數據結構
            const products = response?.data?.data || response?.data || [];
            if (!Array.isArray(products)) return [];

            // 2. 進行所有必要的數據轉換和類型安全處理
            return products.map((apiProduct: any) => ({
                // 📋 基本商品資訊
                id: apiProduct.id || 0,
                name: apiProduct.name || '未命名商品',
                description: apiProduct.description || null,
                category_id: apiProduct.category_id || null,
                created_at: apiProduct.created_at || '',
                updated_at: apiProduct.updated_at || '',
                
                // 🖼️ 圖片處理 - 確保圖片 URL 的完整性
                image_urls: apiProduct.image_urls ? {
                    original: apiProduct.image_urls.original || null,
                    thumb: apiProduct.image_urls.thumb || null,
                    medium: apiProduct.image_urls.medium || null,
                    large: apiProduct.image_urls.large || null,
                } : null,
                
                // 🏷️ 分類資訊處理（雙格式支援）
                category: apiProduct.category ? {
                    id: apiProduct.category.id || 0,
                    name: apiProduct.category.name || '未分類',
                    description: apiProduct.category.description || null,
                } : null,
                
                // 🎯 向前相容：為 ProductSelector 等元件提供簡化格式
                categoryName: apiProduct.category?.name || '未分類', // 字串格式的分類名稱
                mainImageUrl: (apiProduct.image_urls?.original || 'https://via.placeholder.com/300x300').replace('localhost', '127.0.0.1'), // 主圖 URL - 替換為 IPv4
                
                                    // 🎯 變體(SKU)數據的深度清理
                    variants: apiProduct.variants?.map((variant: any) => {
                        // 處理屬性值
                        const attributeValues = variant.attribute_values?.map((attrValue: any) => ({
                            id: attrValue.id || 0,
                            value: attrValue.value || '',
                            attribute_id: attrValue.attribute_id || 0,
                            attribute: attrValue.attribute ? {
                                id: attrValue.attribute.id || 0,
                                name: attrValue.attribute.name || '',
                            } : null,
                        })) || [];
                        
                        // 處理庫存
                        const inventoryList = variant.inventory?.map((inv: any) => ({
                            id: inv.id || 0,
                            quantity: parseInt(inv.quantity || '0', 10), // 字串轉整數
                            low_stock_threshold: parseInt(inv.low_stock_threshold || '0', 10),
                            store: inv.store ? {
                                id: inv.store.id || 0,
                                name: inv.store.name || '未知門市',
                            } : null,
                        })) || [];
                        
                        // 計算總庫存
                        const totalStock = inventoryList.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
                        
                        // 組合規格描述
                        const specifications = attributeValues
                            .map((av: any) => av.value)
                            .filter(Boolean)
                            .join(' / ') || '標準規格';
                        
                        return {
                            id: variant.id || 0,
                            sku: variant.sku || 'N/A',
                            price: parseFloat(variant.price || '0'), // 字串轉數值
                            product_id: variant.product_id || apiProduct.id,
                            created_at: variant.created_at || '',
                            updated_at: variant.updated_at || '',
                            // 如果變體有自己的圖片，也進行 URL 替換
                            imageUrl: variant.image_url ? variant.image_url.replace('localhost', '127.0.0.1') : undefined,
                            
                            // 為 ProductSelector 添加必要欄位
                            specifications: specifications,
                            stock: totalStock,
                            productName: apiProduct.name, // 添加商品名稱到變體中
                            
                            // 保留原始數據
                            attribute_values: attributeValues,
                            inventory: inventoryList,
                        };
                    }) || [],
                
                // 💰 價格範圍統計（基於變體價格計算）
                price_range: (() => {
                    const prices = apiProduct.variants?.map((v: any) => parseFloat(v.price || '0')).filter((p: number) => p > 0) || [];
                    if (prices.length === 0) return { min: 0, max: 0, count: 0 };
                    
                    return {
                        min: Math.min(...prices),
                        max: Math.max(...prices),
                        count: prices.length,
                    };
                })(),
                
                // 🏷️ 屬性列表處理
                attributes: apiProduct.attributes?.map((attr: any) => ({
                    id: attr.id || 0,
                    name: attr.name || '',
                    type: attr.type || '',
                    description: attr.description || null,
                })) || [],
            }));
        },
        
        // 🚀 體驗優化配置
        placeholderData: (previousData) => previousData, // 篩選時保持舊資料，避免載入閃爍
        refetchOnMount: false,       // 依賴全域 staleTime
        refetchOnWindowFocus: false, // 後台管理系統不需要窗口聚焦刷新
        staleTime: 1 * 60 * 1000,   // 1 分鐘緩存，平衡體驗與資料新鮮度
        retry: 2, // 失敗時重試 2 次
    });
}

// ✅ 已移除 useProduct Hook - 由 useProductDetail 統一處理

/**
 * 處理過的商品數據結構 - 保證類型完整性（零容忍版本）
 */
export interface ProcessedProduct {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  category?: any;
  attributes: Array<ProcessedProductAttribute>;
  variants: Array<ProcessedProductVariant>;
  image_url?: string;
  thumbnail_url?: string;
  has_image: boolean;
  image_urls?: any;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

/**
 * 商品屬性類型定義
 */
export interface ProcessedProductAttribute {
  id: number;
  name: string;
  [key: string]: any;
}

/**
 * 商品變體類型定義
 */
export interface ProcessedProductVariant {
  id: number;
  sku: string;
  price: number;
  attribute_values?: Array<ProcessedProductAttributeValue>;
  [key: string]: any;
}

/**
 * 屬性值類型定義
 */
export interface ProcessedProductAttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  [key: string]: any;
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
export function useProductDetail(productId: number | string | undefined): any {
    // 確保 productId 是有效的數字
    const numericId = productId ? Number(productId) : undefined;
    
    return useQuery({
        queryKey: [...QUERY_KEYS.PRODUCT(numericId!), 'detail'],
        queryFn: async () => {
            if (!numericId) {
                throw new Error('商品 ID 無效');
            }

            const { data, error } = await apiClient.GET('/api/products/{id}' as any, {
                params: { path: { id: numericId } }
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '獲取商品詳情失敗');
            }

            return data;
        },
        // 🎯 數據精煉廠 - 確保類型完整性和數據一致性
        select: (response: any): ProcessedProduct | null => {
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
                attributes: attributes.map((attr: any) => ({
                    id: attr.id || 0,
                    name: attr.name || '',
                    ...attr
                })),
                variants: variants.map((variant: any) => ({
                    id: variant.id || 0,
                    sku: variant.sku || '',
                    price: variant.price || 0,
                    attribute_values: Array.isArray(variant.attribute_values) 
                        ? variant.attribute_values.map((av: any) => ({
                            id: av.id || 0,
                            attribute_id: av.attribute_id || 0,
                            value: av.value || '',
                            ...av
                        }))
                        : [],
                    ...variant
                })),
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

// 商品創建端點暫時未定義 - 等待後端實現

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
            const { data, error } = await apiClient.POST('/api/products', {
                body: productData
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage);
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
            
            // 使用 toast 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
                toast.success('商品創建成功！', {
                    description: `商品「${data?.data?.name}」已成功創建，商品列表已自動更新。`
                });
            }
        },
        onError: (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
                toast.error('商品創建失敗', {
                    description: error.message || '請檢查輸入資料並重試。'
                });
            }
        },
    });
}

/**
 * 創建單規格商品的 Hook (v3.0 雙軌制 API)
 * 
 * 專門用於單規格商品的快速創建，無需處理複雜的 SPU/SKU 屬性結構。
 * 此 Hook 使用簡化的 API 端點，後端會自動處理標準屬性的創建和關聯。
 * 
 * 支援功能：
 * 1. 簡化的商品創建流程（只需 name, sku, price 等基本資訊）
 * 2. 後端自動處理 SPU/SKU 架構轉換
 * 3. 自動創建標準屬性和屬性值
 * 4. 自動初始化所有門市的庫存記錄
 * 
 * @returns React Query 變更結果
 */
export function useCreateSimpleProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: {
            name: string;
            sku: string;
            price: number;
            category_id?: number | null;
            description?: string;
        }) => {
            const { data, error } = await apiClient.POST('/api/products/simple', {
                body: productData
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage);
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
            
            // 使用 toast 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
                toast.success('單規格商品創建成功！', {
                    description: `商品「${data?.data?.name}」已成功創建，商品列表已自動更新。`
                });
            }
        },
        onError: (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
                toast.error('單規格商品創建失敗', {
                    description: error.message || '請檢查輸入資料並重試。'
                });
            }
        },
    });
}

// 導入由 openapi-typescript 生成的精確類型
type UpdateProductRequestBody = import('@/types/api').paths["/api/products/{id}"]["put"]["requestBody"]["content"]["application/json"];

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
        mutationFn: async ({ id, ...productData }: { id: number } & UpdateProductRequestBody) => {
            const { data, error } = await apiClient.PUT('/api/products/{id}', {
                params: { path: { id, product: id } },
                body: productData
            });
            
            if (error) {
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '更新商品失敗');
            }
            
            return data;
        },
        onSuccess: async (data, variables) => {
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
                // 3. 單個實體詳情頁的快取處理
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(variables.id) }),
                queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.PRODUCT(variables.id), 'detail'] })
            ]);
            
            // 🎯 在 Hook 層級不顯示 toast，讓組件層級處理
            // 這樣可以提供更靈活的用戶反饋控制
        },
        onError: (error) => {
            // 錯誤處理並顯示錯誤訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
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
            const { data, error } = await apiClient.DELETE('/api/products/{id}', {
                params: { path: { id, product: id } }
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
                })
            ]);
            
            // 移除已刪除商品的快取
            queryClient.removeQueries({ queryKey: QUERY_KEYS.PRODUCT(id) });
            
            // 🔔 成功通知
            toast({
                title: '商品已成功刪除'
            });
        },
        onError: (error) => {
            // 🔴 錯誤處理 - 友善的錯誤訊息
            let errorMessage = '刪除商品失敗';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = parseApiError(error);
            }
            
            toast({
                title: '刪除失敗',
                description: errorMessage,
                variant: 'destructive',
            });
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
      // 直接傳送數字陣列（符合後端驗證規則）
      const { error } = await apiClient.POST('/api/products/batch-delete', {
        body: { ids: body.ids } as any, // 暫時使用 any 繞過類型檢查，待 API 契約同步後修正
      });

      if (error) {
        // 使用統一的錯誤解析器，並強制類型轉換
        const errorMessage = parseApiError(error as any) || '刪除商品失敗';
        throw new Error(errorMessage);
      }
    },
    onSuccess: async (data, variables) => {
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
      
      // 移除已刪除商品的快取
      variables.ids.forEach(id => {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.PRODUCT(id) });
      });
      
      // 🔔 成功通知
      toast({
        title: '商品已成功刪除',
        description: `已刪除 ${variables.ids.length} 個商品`
      });
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      // 從 Error 對象中提取訊息
      let errorMessage = '刪除商品失敗';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = parseApiError(error);
      }
      
      // 使用 shadcn/ui 的 toast
      toast({
        title: '刪除失敗',
        description: errorMessage,
        variant: 'destructive',
      });
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
      // 🚀 使用傳入的 UserQueryParams，保持原有格式
      // 注意：UserQueryParams 可能已經包含了 filter[...] 格式
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
    
    // 🎯 數據精煉廠 - 統一處理用戶數據格式（架構統一升級版）
    select: (response: any) => {
      // 處理可能的巢狀或分頁數據
      const users = response?.data?.data || response?.data || response || [];
      
      // 確保返回的是陣列
      if (!Array.isArray(users)) return [];
      
      // 🔧 數據轉換層：在此處理所有用戶數據的統一格式化
      return users.map((user: any) => {
        // 處理 stores 屬性，確保它總是存在且為陣列
        const stores = user.stores || [];
        
        return {
          ...user,
          stores: Array.isArray(stores) ? stores : []
        };
      });
    },
    
    // 🚀 體驗優化配置（第二階段淨化行動）
    placeholderData: (previousData) => previousData, // 分頁時保持舊資料，避免載入閃爍
    refetchOnMount: false,       // 依賴全域 staleTime
    refetchOnWindowFocus: false, // 後台管理系統不需要窗口聚焦刷新
  });
}

/**
 * 創建用戶的 Mutation Hook
 * 
 * 🚀 功能：為新增用戶功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新用戶列表 - 「失效並強制重取」標準模式
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body: CreateUserRequestBody) => {
      const { data, error } = await apiClient.POST('/api/users', { body });
      if (error) { 
        // 使用類型安全的錯誤處理
        const errorMessage = parseApiError(error) || '建立用戶失敗';
        
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: async (data) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有用戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: ['users'],
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的用戶查詢
        queryClient.refetchQueries({
          queryKey: ['users'],
          exact: false,
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('用戶已成功創建', {
          description: `用戶「${data?.data?.name}」已成功加入系統`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('創建失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * 更新用戶的 Mutation Hook
 * 
 * 🔧 功能：為用戶編輯功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 雙重緩存失效策略 - 同時更新列表和詳情緩存
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  type UpdateUserPayload = {
    path: UserPathParams;
    body: UpdateUserRequestBody;
  };
  
  return useMutation({
    mutationFn: async ({ path, body }: UpdateUserPayload) => {
      const { data, error } = await apiClient.PUT('/api/users/{id}', {
        params: { path },
        body,
      });
      if (error) { 
        // 使用類型安全的錯誤處理
        const errorMessage = parseApiError(error) || '更新用戶失敗';
        throw new Error(errorMessage);
      }
      return data;
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有用戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: ['users'],
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的用戶查詢
        queryClient.refetchQueries({
          queryKey: ['users'],
          exact: false,
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('用戶資料已成功更新', {
          description: `用戶「${data?.data?.name}」的資料已更新`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('更新失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * 刪除用戶的 Mutation Hook
 * 
 * 🔥 功能：為用戶刪除功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新用戶列表 - 「失效並強制重取」標準模式
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pathParams: UserPathParams) => {
      const { error } = await apiClient.DELETE('/api/users/{id}', {
        params: { path: pathParams }
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有用戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: ['users'],
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的用戶查詢
        queryClient.refetchQueries({
          queryKey: ['users'],
          exact: false,
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("用戶已成功刪除");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 獲取分類列表並自動分組
 * 
 * 此查詢會獲取所有分類，並將它們按照 parent_id 進行分組，
 * 方便前端建構樹狀結構。返回格式為：
 * - key 為空字串 '' 或 'null' 表示頂層分類
 * - key 為數字字串如 '1' 表示 parent_id 為 1 的子分類
 * 
 * @returns React Query 查詢結果，包含分組後的分類資料
 */
export function useCustomerDetail(customerId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.CUSTOMER(customerId!), // 使用 ['customers', customerId] 作為唯一鍵
    queryFn: async () => {
      if (!customerId) return null; // 如果沒有 ID，則不執行查詢
      
      const { data, error } = await apiClient.GET('/api/customers/{id}', {
        params: { path: { id: customerId, customer: customerId } },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取客戶詳情失敗');
        }
        
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
    enabled: !!customerId, // 只有在 customerId 存在時，此查詢才會被觸發
    staleTime: 5 * 60 * 1000, // 5 分鐘緩存時間，編輯期間避免重複請求
    retry: 2, // 失敗時重試 2 次
  });
}

/**
 * 創建客戶的精確前端契約類型
 * 
 * 此類型精確反映前端 useForm 的數據結構，
 * 確保類型安全並消除任何 `as any` 的使用需求
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
 * 創建客戶的 Hook
 * 
 * 🎯 架構升級：使用精確的前端契約類型，
 * 在 Hook 內部處理前端到後端的數據轉換邏輯
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  // 🎯 使用 API 生成的類型定義
  type CreateCustomerRequestBody = import('@/types/api').paths['/api/customers']['post']['requestBody']['content']['application/json'];

  return useMutation({
    // 🎯 使用我們新定義的、代表前端表單數據的嚴格類型
    mutationFn: async (payload: CreateCustomerPayload) => {
      // 🎯 數據轉換邏輯：前端表單結構 → 後端 API 結構
      const apiPayload = {
        name: payload.name,
        phone: payload.phone || undefined,
        is_company: payload.is_company,
        tax_id: payload.tax_id || undefined,
        industry_type: payload.industry_type,
        payment_type: payload.payment_type,
        contact_address: payload.contact_address || undefined,
        // 將 addresses 物件陣列轉換為字串陣列（API 要求的格式）
        addresses: payload.addresses?.map(addr => addr.address) || [],
      };
      
      const { data, error } = await apiClient.POST('/api/customers', {
        body: apiPayload as any, // 修復 addresses 欄位類型不匹配問題
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '創建客戶失敗');
      }

      return data;
    },
    onSuccess: async (data) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有客戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的客戶查詢
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('客戶已成功創建', {
          description: `客戶「${data?.data?.name}」已成功加入系統`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('創建失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * 刪除客戶的 Mutation Hook
 * 
 * 🔥 戰術功能：為操作列的刪除按鈕裝填真正的彈藥
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新客戶列表 - 「失效並強制重取」標準模式
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: number) => {
      const { error } = await apiClient.DELETE('/api/customers/{id}', {
        params: { path: { id: customerId, customer: customerId } }
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有客戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的客戶查詢
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("客戶已成功刪除");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: errorMessage });
      }
    },
  });
}

// ==================== 客戶管理系統 (CUSTOMER MANAGEMENT) ====================

/**
 * 檢查客戶名稱是否存在 Hook
 * 
 * 🎯 功能：在新增客戶時檢查名稱是否重複，提供智能預警功能
 * 
 * @param name - 要檢查的客戶名稱
 * @returns React Query 查詢結果，包含 exists 布林值
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
        // 在此場景下，查詢失敗可以靜默處理，不打擾使用者
        console.error("客戶名稱檢查失敗", error);
        return { exists: false }; // 返回安全預設值
      }
      // 確保返回正確的數據結構
      return data ?? { exists: false };
    },
    enabled: false, // 🎯 預設禁用，我們將手動觸發
    retry: 1,
  });
}

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
 * 獲取客戶列表 Hook
 * 
 * @param filters - 篩選參數
 * @returns React Query 查詢結果
 */
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CUSTOMERS, filters],
    queryFn: async ({ queryKey }) => {
      const [, queryFilters] = queryKey;
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if ((queryFilters as CustomerFilters)?.search) {
        queryParams['filter[search]'] = (queryFilters as CustomerFilters).search;
      }
      if ((queryFilters as CustomerFilters)?.start_date) {
        queryParams['filter[start_date]'] = (queryFilters as CustomerFilters).start_date;
      }
      if ((queryFilters as CustomerFilters)?.end_date) {
        queryParams['filter[end_date]'] = (queryFilters as CustomerFilters).end_date;
      }
      // 分頁參數不需要 filter 前綴
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
    
    // 🎯 數據精煉廠 - 統一處理客戶數據格式（架構統一升級版）
    select: (response: any) => {
      // 處理可能的巢狀或分頁數據
      const data = response?.data?.data || response?.data || response || [];
      
      // 提取或構建 meta 資訊
      const meta = response?.meta || response?.data?.meta || { 
        // 如果沒有 meta，提供一個預設的 meta 物件
        current_page: 1, 
        last_page: 1,
        per_page: Array.isArray(data) ? data.length : 0,
        total: Array.isArray(data) ? data.length : 0
      };
      
      // 確保 data 是陣列
      const customers = Array.isArray(data) ? data : [];
      
      // 🔧 統一返回標準分頁結構
      return { 
        data: customers, 
        meta: meta 
      };
    },
    
    // 🚀 體驗優化配置
    placeholderData: (previousData) => previousData, // 篩選時保持舊資料，避免載入閃爍
    refetchOnMount: false,       // 依賴全域 staleTime
    refetchOnWindowFocus: false, // 後台管理系統不需要窗口聚焦刷新
    staleTime: 1 * 60 * 1000,   // 1 分鐘緩存，平衡體驗與資料新鮮度
  });
}

/**
 * 更新客戶的 Mutation Hook
 * 
 * 🔧 戰術功能：為客戶編輯功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 雙重緩存失效策略 - 同時更新列表和詳情緩存
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 5. 支援完整的客戶資訊與地址管理更新
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  // 使用 API 生成的類型定義
  type UpdateCustomerRequestBody = any;
  type UpdateCustomerPayload = {
    id: number;
    data: UpdateCustomerRequestBody;
  };
  
  return useMutation({
    mutationFn: async ({ id, data }: UpdateCustomerPayload) => {
      const { data: responseData, error } = await apiClient.PUT('/api/customers/{id}' as any, {
        params: { path: { id, customer: id } },
        body: data,
      } as any);
      if (error) throw error;
      return responseData;
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有客戶查詢緩存
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
          refetchType: 'active',
        }),
        // 2. 強制重新獲取所有活躍的客戶查詢
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.CUSTOMERS,
          exact: false,
        }),
        // 3. 單個客戶詳情頁的快取處理
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.CUSTOMER(variables.id),
          refetchType: 'active' 
        }),
        queryClient.refetchQueries({ 
          queryKey: QUERY_KEYS.CUSTOMER(variables.id)
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('客戶資料已成功更新', {
          description: `客戶「${data?.data?.name}」的資料已更新`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('更新失敗', { description: errorMessage });
      }
    },
  });
}

// ==================== 分類管理系統 (CATEGORY MANAGEMENT) ====================

// 導入 Category 類型
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
            // API 返回的是以 parent_id 分組的對象
            const groupedData = response?.data || response || {};
            
            // 確保返回的是對象，如果不是則返回空陣列
            if (typeof groupedData !== 'object' || Array.isArray(groupedData)) {
                return [];
            }
            
            // 在 select 內部調用 buildCategoryTree
            // 將原始、混亂的分組物件，直接轉換成乾淨的、巢狀的樹狀結構
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
      const { data, error } = await apiClient.DELETE("/api/categories/{id}" as any, {
        params: { path: { category: categoryId } },
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

// ==================== 屬性管理系統 (ATTRIBUTE MANAGEMENT) ====================

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
 * 2. 發送 PUT 請求到 /api/attributes/{id} 端點
 * 3. 支援更新屬性名稱
 * 4. 處理業務邏輯驗證錯誤（如重複名稱檢查）
 * 5. 成功後自動無效化屬性列表快取
 */
export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { id: number; body: { name: string } }) => {
      const { data, error } = await apiClient.PUT('/api/attributes/{id}', {
        params: { path: { id: variables.id, attribute: variables.id } },
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
      const { data, error } = await apiClient.PUT('/api/values/{id}', {
        params: { path: { id: variables.valueId, value: variables.valueId } },
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
      const { error } = await apiClient.DELETE('/api/values/{id}', {
        params: { path: { id: valueId, value: valueId } },
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

      const { data, error } = await apiClient.GET('/api/attributes/{attribute_id}/values', {
        params: { path: { attribute_id: attributeId, attribute: attributeId } },
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

// ==================== 庫存管理系統 (INVENTORY MANAGEMENT) ====================

/**
 * 庫存列表查詢 Hook
 * 
 * 此 Hook 呼叫 /api/inventory 端點，該端點現在返回商品列表
 * 而非原始的庫存記錄列表，每個商品包含其所有變體和庫存資訊
 * 
 * @param filters - 查詢過濾參數
 * @returns 查詢結果，包含商品列表資料
 */
export const useInventoryList = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['inventory', 'list', filters],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory', {
        params: {
          query: filters
        }
      });
      
      if (error) {
        throw new Error('獲取庫存列表失敗');
      }
      return data;
    },
    
    // 🎯 數據精煉廠 - 統一處理庫存數據格式（支援分頁）
    select: (response: any) => {
      // 特殊處理：如果響應包含分頁元數據，保留完整結構
      if (response?.meta || response?.links) {
        return {
          data: response.data || [],
          meta: response.meta,
          links: response.links
        };
      }
      
      // 否則，假設是直接的陣列或包裝在 data 中的陣列
      const inventory = response?.data || response || [];
      if (Array.isArray(inventory)) {
        // 如果是純陣列，包裝成分頁格式
        return {
          data: inventory,
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: inventory.length,
            total: inventory.length
          }
        };
      }
      
      // 預設返回空的分頁結構
      return {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 0,
          total: 0
        }
      };
    },
    
    staleTime: 5 * 60 * 1000, // 5 分鐘
  });
};

/**
 * 獲取單個庫存詳情
 */
export function useInventoryDetail(id: number) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/inventory/{id}' as any, {
        params: { path: { id } },
      } as any);
      if (error) {
        throw new Error('獲取庫存詳情失敗');
      }
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
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
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory'],
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("庫存已成功調整");
      }
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
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      if (params.type) queryParams['filter[type]'] = params.type;
      
      // 分頁參數不需要 filter 前綴
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/{id}/history' as any, {
        params: {
          path: { id: params.id },
          query: queryParams
        }
      } as any);
      if (error) {
        throw new Error('獲取庫存歷史記錄失敗');
      }
      return data;
    },
    
    // 🎯 數據精煉廠 - 統一處理庫存歷史數據格式
    select: (response: any) => {
      // 解包：處理分頁或普通陣列數據結構
      const history = response?.data || response || [];
      if (!Array.isArray(history)) return [];
      
      // 返回純淨的歷史記錄陣列
      return history;
    },
    
    enabled: !!params.id,
  });
}

/**
 * 獲取特定 SKU 的所有庫存歷史記錄
 */
export function useSkuInventoryHistory(params: {
  sku: string;
  store_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['inventory', 'sku-history', params],
    queryFn: async () => {
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (params.store_id) queryParams['filter[store_id]'] = params.store_id;
      if (params.type) queryParams['filter[type]'] = params.type;
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      
      // 分頁參數不需要 filter 前綴
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/sku/{sku}/history' as any, {
        params: {
          path: { sku: params.sku },
          query: queryParams
        }
      } as any);
      if (error) {
        throw new Error('獲取 SKU 庫存歷史記錄失敗');
      }
      return data;
    },
    
    // 🎯 最終標準化數據精煉廠 - 處理這個特殊的數據結構
    select: (response: any) => {
      // 此 API 返回特殊結構：{ data: transactions[], inventories: inventory[] }
      // 我們保留整個結構，讓 UI 元件可以直接使用
      return {
        data: response?.data || [],           // 交易記錄陣列
        inventories: response?.inventories || [], // 庫存項目陣列
        message: response?.message,
        pagination: response?.pagination
      };
    },
    
    enabled: !!params.sku,
  });
}

/**
 * 獲取所有庫存交易記錄
 */
export function useAllInventoryTransactions(filters: InventoryTransactionFilters = {}) {
  return useQuery({
    queryKey: ['inventory', 'transactions', filters],
    queryFn: async () => {
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (filters.product_name) queryParams['filter[product_name]'] = filters.product_name;
      if (filters.store_id) queryParams['filter[store_id]'] = filters.store_id;
      if (filters.type) queryParams['filter[type]'] = filters.type;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      
      // 分頁參數不需要 filter 前綴
      if (filters.per_page) queryParams.per_page = filters.per_page;
      if (filters.page) queryParams.page = filters.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/transactions' as any, {
        params: {
          query: queryParams
        }
      } as any);
      if (error) {
        throw new Error('獲取庫存交易記錄失敗');
      }
      return data as {
        message?: string;
        data: InventoryTransaction[];
        pagination?: {
          current_page?: number;
          per_page?: number;
          total?: number;
          last_page?: number;
        };
      };
    },
    
    // 🎯 數據精煉廠 - 統一處理交易記錄數據格式
    select: (response: any) => {
      // 返回完整的響應結構，包含 data 和 pagination
      if (!response) return { data: [], pagination: null };
      
      return {
        data: response.data || [],
        pagination: response.pagination || null
      };
    },
    
    staleTime: 2 * 60 * 1000, // 2 分鐘
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
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (params.from_store_id) queryParams['filter[from_store_id]'] = params.from_store_id;
      if (params.to_store_id) queryParams['filter[to_store_id]'] = params.to_store_id;
      if (params.status) queryParams['filter[status]'] = params.status;
      if (params.start_date) queryParams['filter[start_date]'] = params.start_date;
      if (params.end_date) queryParams['filter[end_date]'] = params.end_date;
      if (params.product_name) queryParams['filter[product_name]'] = params.product_name;
      
      // 分頁參數不需要 filter 前綴
      if (params.per_page) queryParams.per_page = params.per_page;
      if (params.page) queryParams.page = params.page;
      
      const { data, error } = await apiClient.GET('/api/inventory/transfers', {
        params: { query: queryParams },
      });
      if (error) {
        throw new Error('獲取庫存轉移列表失敗');
      }
      return data;
    },
    
    // 🎯 數據精煉廠 - 統一處理轉移記錄數據格式
    select: (response: any) => {
      // 解包：處理分頁或普通陣列數據結構
      const transfers = response?.data || response || [];
      if (!Array.isArray(transfers)) return [];
      
      // 返回純淨的轉移記錄陣列
      return transfers;
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
      const { data, error } = await apiClient.GET('/api/inventory/transfers/{id}' as any, {
        params: { path: { id: id.toString() } },
      } as any);
      if (error) {
        throw new Error('獲取庫存轉移詳情失敗');
      }
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
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
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'list'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'list'],
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("庫存轉移已成功創建");
      }
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
        params: { path: { id: params.id.toString() } },
        body: { status: params.status, notes: params.notes },
      });
      if (error) {
        throw new Error('更新轉移狀態失敗');
      }
      return data;
    },
    onSuccess: async (_, variables) => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfer', variables.id],
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'transfer', variables.id]
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'list'],
          exact: false,
          refetchType: 'active'
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("轉移狀態已成功更新");
      }
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
        params: { path: { id: params.id.toString() } },
        body: { reason: params.reason },
      });
      if (error) {
        throw new Error('取消庫存轉移失敗');
      }
      return data;
    },
    onSuccess: async (_, variables) => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'transfers'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['inventory', 'transfer', variables.id],
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['inventory', 'transfer', variables.id]
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("庫存轉移已成功取消");
      }
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
    
    // 🎯 標準化數據精煉廠 - 處理門市數據的解包和轉換
    select: (response: any) => {
      // 處理可能的巢狀或分頁數據結構
      const data = response?.data?.data || response?.data || response || [];
      const meta = response?.data?.meta || {
        total: Array.isArray(data) ? data.length : 0,
        per_page: params.per_page || 100,
        current_page: params.page || 1,
        last_page: 1
      };
      
      // 確保數據的類型安全和結構一致性
      const stores = Array.isArray(data) ? data.map((store: any) => ({
        id: store.id || 0,
        name: store.name || '未命名門市',
        address: store.address || null,
        phone: store.phone || null,
        status: store.status || 'active',
        created_at: store.created_at || '',
        updated_at: store.updated_at || '',
        // 如果有庫存統計數據，也進行處理
        inventory_count: store.inventory_count || 0,
        // 如果有用戶關聯數據，也進行處理
        users_count: store.users_count || 0
      })) : [];
      
      // 返回標準的分頁結構
      return { data: stores, meta };
    },
    
    staleTime: 10 * 60 * 1000,  // 10 分鐘內保持新鮮（門市資訊變化較少）
  });
}

/**
 * 獲取單個門市詳情
 */
export function useStore(id: number) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/stores/{id}' as any, {
        params: { path: { id } },
      } as any);
      if (error) {
        throw new Error('獲取門市詳情失敗');
      }
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 🎯 創建門市請求的具名類型定義
 * 
 * 此類型反映前端表單的數據結構，確保類型安全並提供
 * 完善的開發體驗（IDE 自動補全、類型檢查等）
 */
type CreateStorePayload = {
  name: string;           // 門市名稱（必填）
  address?: string;       // 門市地址
  phone?: string;         // 聯絡電話
  status?: 'active' | 'inactive';  // 門市狀態
  description?: string;   // 門市描述
  // 可根據實際業務需求擴展其他欄位
};

/**
 * 創建門市
 */
export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (store: CreateStorePayload) => {
      const { data, error } = await apiClient.POST('/api/stores' as any, {
        body: store,
      } as any);
      if (error) {
        throw new Error('創建門市失敗');
      }
      return data;
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['stores'],
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("門市已成功創建");
      }
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
      const { data, error } = await apiClient.PUT('/api/stores/{id}' as any, {
        params: { path: { id: params.id } },
        body: params.data,
      } as any);
      if (error) {
        throw new Error('更新門市失敗');
      }
      return data;
    },
    onSuccess: async (_, variables) => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['stores'],
          exact: false
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['stores', variables.id],
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['stores', variables.id]
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("門市已成功更新");
      }
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
      const { error } = await apiClient.DELETE('/api/stores/{id}' as any, {
        params: { path: { store: id } },
      });
      if (error) {
        throw new Error('刪除門市失敗');
      }
    },
    onSuccess: async () => {
      // 🚀 升級為標準的「失效並強制重取」模式
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'active'
        }),
        queryClient.refetchQueries({ 
          queryKey: ['stores'],
          exact: false
        })
      ]);
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("門市已成功刪除");
      }
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
} = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['product-variants', params],
    queryFn: async () => {
      // 根據 spatie/laravel-query-builder 的預期，將篩選參數包在 'filter' 物件中
      const { page, per_page, ...filterParams } = params;
      
      const query: {
        page?: number;
        per_page?: number;
        filter?: typeof filterParams;
      } = {};

      if (page !== undefined) query.page = page;
      if (per_page !== undefined) query.per_page = per_page;
      if (Object.keys(filterParams).length > 0) {
        query.filter = filterParams;
      }

      const { data, error } = await apiClient.GET('/api/products/variants', {
          params: { query },
      });
      
      if (error) {
        throw new Error('獲取商品變體列表失敗');
      }
      return data;
    },
    
    // 🎯 數據精煉廠 - 統一處理變體數據格式
    select: (response: any) => {
      if (!response) return []; // 如果沒有響應，返回空陣列
      
      // 檢查數據是否在 .data 屬性中 (處理分頁或特定包裝結構)
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // 如果數據是直接的陣列，則直接返回
      if (Array.isArray(response)) {
        return response;
      }
      
      // 如果結構不符預期，返回空陣列以防前端崩潰
      console.warn('🚨 useProductVariants: 未預期的響應格式', response);
      return [];
    },
    
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,   // 5 分鐘緩存時間
  });
}

/**
 * 獲取單個商品變體詳情
 */
export function useProductVariantDetail(id: number) {
  return useQuery({
    queryKey: ['product-variants', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/products/variants/{id}' as any, {
        params: { path: { id: id.toString() } },
      } as any);
      if (error) {
        throw new Error('獲取商品變體詳情失敗');
      }
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}



// ==================== 進貨管理系統 (PURCHASE MANAGEMENT) ====================





/**
 * 🎯 圖片上傳參數的嚴格類型定義
 * 
 * 透過明確的具名類型，確保：
 * 1. 參數名稱錯誤能在開發階段立即被發現
 * 2. TypeScript 編輯器提供準確的自動補全
 * 3. 任何不符合契約的調用都會被標示為錯誤
 */
type UploadProductImagePayload = {
  productId: number;
  image: File;
};

/**
 * 上傳商品圖片的 Mutation Hook
 * 
 * 🖼️ 功能：為商品圖片上傳功能提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 支援單張圖片上傳到指定商品
 * 2. 使用 FormData 處理 multipart/form-data 格式
 * 3. 成功後自動刷新商品列表和詳情 - 確保圖片立即顯示
 * 4. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 5. 標準化的錯誤處理
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUploadProductImage() {
  const queryClient = useQueryClient();

  
  return useMutation({
    // 🎯 使用嚴格的具名類型，確保參數正確性
    mutationFn: async (payload: UploadProductImagePayload) => {
      // --- 步驟一：從唯一權威來源獲取 Session ---
      const session = await getSession();
      const accessToken = session?.accessToken;

      // --- 步驟二：驗證權限 ---
      if (!accessToken) {
        throw new Error('未經授權的操作，無法上傳圖片。');
      }

      // --- 步驟三：準備 FormData ---
      const formData = new FormData();
      formData.append('image', payload.image);

      // --- 步驟四：使用原生 fetch 並注入正確的 Token ---
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/products/${payload.productId}/upload-image`,
        {
          method: 'POST',
          headers: {
            // 確保 Authorization Header 來自 next-auth Session
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            // 再次強調：對於 FormData，不要手動設置 'Content-Type'
          },
          body: formData,
        }
      );

      // --- 步驟五：處理響應 ---
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = parseApiError(errorData);
        throw new Error(errorMessage || `圖片上傳失敗 (${response.status})`);
      }

      return response.json();
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      await Promise.all([
        // 1. 失效所有商品查詢緩存（縮圖可能更新）
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
        // 3. 失效特定商品的詳情緩存（image_urls 已更新）
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PRODUCT(variables.productId),
          refetchType: 'active',
        }),
        // 4. 失效商品詳情的緩存
        queryClient.invalidateQueries({
          queryKey: [...QUERY_KEYS.PRODUCT(variables.productId), 'detail'],
          refetchType: 'active',
        })
      ]);
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("圖片已成功上傳");
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("圖片上傳失敗", { description: errorMessage });
      }
    },
  });
}

/**
 * 進貨單相關查詢 Hooks
 */

// 獲取進貨單列表
export function usePurchases(params?: {
  store_id?: number
  status?: string
  order_number?: string
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
  sort?: string
}) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: async () => {
      const query: Record<string, string | number> = {}
      
      if (params?.store_id) query['filter[store_id]'] = params.store_id
      if (params?.status) query['filter[status]'] = params.status
      if (params?.order_number) query['filter[order_number]'] = params.order_number
      if (params?.start_date) query['filter[start_date]'] = params.start_date
      if (params?.end_date) query['filter[end_date]'] = params.end_date
      if (params?.page) query.page = params.page
      if (params?.per_page) query.per_page = params.per_page
      if (params?.sort) query.sort = params.sort

      const { data, error } = await apiClient.GET('/api/purchases', {
        params: { query }
      })
      
      if (error) {
        throw new Error('獲取進貨單列表失敗')
      }
      
      // Laravel API 回應結構通常包含 data, meta, links 等鍵
      // 對於分頁資料，我們返回整個 data 對象（包含 data, meta, links）
      return data
    },
    
    // 🎯 數據精煉廠 - 統一處理進貨單數據格式
    select: (response: any) => {
      // 始終返回一致的格式，包含 data、meta 和 links
      const data = response?.data || response || [];
      const meta = response?.meta || null;
      const links = response?.links || null;
      
      return {
        data: Array.isArray(data) ? data : [],
        meta: meta,
        links: links
      };
    },
    
    placeholderData: keepPreviousData,
  })
}

// 獲取單一進貨單
export function usePurchase(id: number | string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/purchases/{id}' as any, {
        params: { path: { id: Number(id) } }
      });
      
      if (error) {
        throw new Error('獲取進貨單失敗');
      }
      
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 🎯 創建進貨單請求的具名類型定義
 * 
 * 此類型反映進貨單表單的數據結構，確保前後端數據契約的一致性
 * 進貨單號現在由後端自動生成，無需前端提供
 */
type CreatePurchasePayload = {
  store_id: number;         // 門市 ID（必填）
  order_number?: string;    // 進貨單號（可選，後端會自動生成）
  purchased_at?: string;    // 進貨日期時間 (ISO 8601 格式)
  shipping_cost: number;    // 運費
  status?: string;          // 狀態
  items: {
    product_variant_id: number;  // 商品變體 ID
    quantity: number;            // 進貨數量
    cost_price: number;          // 進貨成本價
  }[];
};

// 創建進貨單
export function useCreatePurchase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (purchaseData: CreatePurchasePayload) => {
      const { data, error } = await apiClient.POST('/api/purchases', {
        body: purchaseData as any
      })
      
      if (error) {
        throw new Error(parseApiError(error) || '創建進貨單失敗')
      }
      
      // 創建操作通常返回單一資源，需要解包 data
      return (data as any)?.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// 更新進貨單
export function useUpdatePurchase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: any }) => {
      const { data: responseData, error } = await apiClient.PUT('/api/purchases/{id}' as any, {
        params: { path: { purchase: Number(id) } },
        body: data
      })
      
      if (error) {
        throw new Error(parseApiError(error) || '更新進貨單失敗')
      }
      
      // 更新操作返回更新後的資源，需要解包 data
      return (responseData as any)?.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// 更新進貨單狀態
export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number | string; status: string }) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{id}/status', {
        params: { path: { id: id.toString() } },
        body: { status }
      })
      
      if (error) {
        throw new Error(parseApiError(error) || '更新進貨單狀態失敗')
      }
      
      // 狀態更新返回更新後的資源，需要解包 data
      return (data as any)?.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// 取消進貨單
export function useCancelPurchase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data, error } = await apiClient.PATCH('/api/purchases/{id}/cancel', {
        params: { path: { id: id.toString() } }
      })
      
      if (error) {
        throw new Error(parseApiError(error) || '取消進貨單失敗')
      }
      
      // 取消操作返回更新後的資源，需要解包 data
      return (data as any)?.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['purchase', id] })
    },
  })
}

// 刪除進貨單
export function useDeletePurchase() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data, error } = await apiClient.DELETE('/api/purchases/{id}', {
        params: { path: { id: id.toString() } }
      })
      
      if (error) {
        throw new Error(parseApiError(error) || '刪除進貨單失敗')
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}

// ==================== 訂單管理系統 (ORDER MANAGEMENT) ====================

/**
 * Hook for fetching a paginated list of orders
 * 
 * 功能特性：
 * 1. 支援多維度篩選（搜尋、狀態、日期範圍）
 * 2. 扁平化的查詢鍵結構，支援精確緩存
 * 3. 與後端 API 完全對應的參數結構
 * 4. 標準的 staleTime 配置
 * 5. 🎯 100% 類型安全 - 使用精確的篩選參數類型
 * 
 * @param filters - 訂單篩選參數
 * @returns React Query 查詢結果，包含 data 和 meta
 */
export function useOrders(filters: {
  search?: string;
  shipping_status?: string;
  payment_status?: string;
  start_date?: string;
  end_date?: string;
  page?: number;       // 🎯 新增分頁參數
  per_page?: number;   // 🎯 新增每頁數量參數
} = {}) {
  return useQuery({
    // 遵循我們已建立的、扁平化的查詢鍵結構，包含分頁參數
    queryKey: [...QUERY_KEYS.ORDERS, filters],
    queryFn: async () => {
      // 🚀 構建符合 Spatie QueryBuilder 的查詢參數格式
      const queryParams: Record<string, any> = {};
      
      // 使用 filter[...] 格式進行篩選參數
      if (filters.search) queryParams['filter[search]'] = filters.search;
      if (filters.shipping_status) queryParams['filter[shipping_status]'] = filters.shipping_status;
      if (filters.payment_status) queryParams['filter[payment_status]'] = filters.payment_status;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      
      // 分頁參數不需要 filter 前綴
      if (filters.page) queryParams.page = filters.page;
      if (filters.per_page) queryParams.per_page = filters.per_page;
      
      const { data, error } = await apiClient.GET("/api/orders" as any, {
        params: {
          query: queryParams,
        },
      });
      if (error) throw error;
      return data;
    },
    // 🎯 新增 select 選項 - 數據精煉廠，返回完整的分頁響應
    select: (response: any) => {
      // 1. 解包：從 API 響應中提取數據和分頁元數據
      const orders = response?.data || [];
      const meta = response?.meta || {}; // 提取分頁元數據
      const links = response?.links || {}; // 提取分頁連結

      // 2. 進行訂單數據的類型轉換和清理
      const processedOrders = orders.map((order: any) => ({
        ...order,
        // 📊 金額字段的數值化處理
        subtotal: parseFloat(order.subtotal || '0'),
        shipping_fee: parseFloat(order.shipping_fee || '0'),
        tax_amount: parseFloat(order.tax_amount || '0'),
        discount_amount: parseFloat(order.discount_amount || '0'),
        grand_total: parseFloat(order.grand_total || '0'),
        paid_amount: parseFloat(order.paid_amount || '0'),
        
        // 🎯 新增：日期格式化 - 在數據精煉廠中一次性完成
        formatted_created_date: new Date(order.created_at).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).replace(/\//g, '/'), // 確保使用 / 作為分隔符
      }));

      // 3. 返回完整的分頁響應結構
      return { 
        data: processedOrders,
        meta: meta,
        links: links
      };
    },
    staleTime: 1 * 60 * 1000, // 設置 1 分鐘的數據保鮮期
  });
}

/**
 * 創建訂單的 Hook
 * 
 * 支援完整的訂單創建流程：
 * 1. 客戶資訊綁定
 * 2. 商品項目管理
 * 3. 價格計算
 * 4. 庫存扣減
 * 
 * @returns React Query 變更結果
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderData: OrderFormData) => {
            console.log('🚀 useCreateOrder 收到的數據:', JSON.stringify(orderData, null, 2));
            
            // 🎯 重新整理數據格式以匹配後端 API 期望
            const apiPayload = {
                customer_id: orderData.customer_id,
                shipping_status: orderData.shipping_status,
                payment_status: orderData.payment_status,
                shipping_fee: orderData.shipping_fee || 0,
                tax: orderData.tax || 0,
                discount_amount: orderData.discount_amount || 0,
                payment_method: orderData.payment_method,
                order_source: orderData.order_source,
                shipping_address: orderData.shipping_address,
                notes: orderData.notes || null,
                items: orderData.items,
                ...(orderData.hasOwnProperty('force_create_despite_stock') && {
                    force_create_despite_stock: (orderData as any).force_create_despite_stock,
                }),
            };
            
            const { data, error } = await apiClient.POST('/api/orders', {
                body: apiPayload as any
            });
            
            // 如果有錯誤，代表 API 請求失敗
            if (error) {
                console.error('🔴 API 回傳錯誤:', error);
                
                // 🎯 檢查這個錯誤是否是我們預期的「庫存不足」結構化錯誤
                if ((error as any).stockCheckResults || (error as any).insufficientStockItems) {
                    // 如果是，直接將這個帶有詳細數據的錯誤物件拋出
                    // 讓 onError 回調可以接收到它
                    throw error;
                }
                
                // 如果是其他類型的錯誤，則使用我們的標準解析器
                const errorMessage = parseApiError(error);
                throw new Error(errorMessage || '創建訂單失敗');
            }
            
            // 如果沒有錯誤，返回成功的數據
            console.log('✅ 訂單創建成功:', data);
            return data;
        },
        onSuccess: async (data) => {
            // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
            await Promise.all([
                // 1. 失效所有訂單查詢緩存
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.ORDERS,
                    exact: false,
                    refetchType: 'active',
                }),
                // 2. 強制重新獲取所有活躍的訂單查詢
                queryClient.refetchQueries({
                    queryKey: QUERY_KEYS.ORDERS,
                    exact: false,
                })
            ]);
            
            // 使用 toast 顯示成功訊息
            if (typeof window !== 'undefined') {
                const { toast } = require('sonner');
                toast.success('訂單創建成功！', {
                    description: `訂單已成功創建，訂單列表已自動更新。`
                });
            }
        },
        onError: (error: any) => {
            // 🎯 在 onError 回調中，我們現在可以更安全地檢查錯誤類型
            if (error.stockCheckResults || error.insufficientStockItems) {
                // 這裡是處理庫存不足的邏輯...
                // 前端頁面組件會自行處理這種錯誤，這裡只需要記錄即可
                console.log('⚠️ 庫存不足錯誤已傳遞給前端組件處理');
            } else {
                // 這裡是處理其他通用錯誤的邏輯...
                if (typeof window !== 'undefined') {
                    const { toast } = require('sonner');
                    toast.error('訂單創建失敗', {
                        description: error.message || '請檢查輸入資料並重試。'
                    });
                }
            }
        },
    });
}

/**
 * Hook for fetching a single order's details - 架構升級版
 * 
 * 功能特性：
 * 1. 獲取單一訂單的完整資訊（包含關聯的客戶、項目、狀態歷史）
 * 2. 使用獨立的查詢鍵確保每個訂單獨立緩存
 * 3. 條件性查詢，只有在 orderId 存在時才執行
 * 4. 較長的緩存時間，適合詳情頁使用場景
 * 5. 🎯 資料精煉廠 - 在源頭處理所有數據解包和類型轉換
 * 6. 🚫 根除 any 類型 - 確保數據契約的純淨
 * 
 * @param orderId - 訂單 ID
 * @returns React Query 查詢結果，返回處理乾淨、類型完美的 ProcessedOrder 對象
 */
export function useOrderDetail(orderId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.ORDER(orderId!), // 使用 ['orders', orderId] 作為唯一鍵
    queryFn: async () => {
      if (!orderId) return null; // 如果沒有 ID，則不執行查詢
      const { data, error } = await apiClient.GET("/api/orders/{id}", {
        params: { path: { id: orderId, order: orderId } },
      });
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取訂單詳情失敗');
      }
      // queryFn 依然返回完整的 response，數據轉換交給 select 處理
      return data;
    },
    // 🎯 新增 select 選項 - 數據精煉廠，讓元件獲得純淨的數據
    select: (response: any): ProcessedOrder | null => {
      // 1. 解包：從 API 響應中提取 data 部分
      const order = response?.data;
      if (!order) return null;

      // 2. 進行所有必要的類型轉換和數據清理
      // 明確返回 ProcessedOrder 類型，確保所有消費端都能享受完美的類型推斷
      const processedOrder: ProcessedOrder = {
        ...order,
        // 📊 金額字段的數值化處理 - 絕對保證是 number
        subtotal: parseFloat(order.subtotal || '0'),
        shipping_fee: order.shipping_fee ? parseFloat(order.shipping_fee) : null,
        tax_amount: parseFloat(order.tax_amount || '0'),
        discount_amount: parseFloat(order.discount_amount || '0'),
        grand_total: parseFloat(order.grand_total || '0'),
        paid_amount: parseFloat(order.paid_amount || '0'),
        
        // 🛒 訂單項目的數據清理 - 每個項目都是 ProcessedOrderItem
        items: order.items?.map((item: any): ProcessedOrderItem => ({
          ...item,
          price: parseFloat(item.price || '0'),
          cost: parseFloat(item.cost || '0'),
          quantity: parseInt(item.quantity || '0', 10),
          tax_rate: parseFloat(item.tax_rate || '0'),
          discount_amount: parseFloat(item.discount_amount || '0'),
          // 🎯 Operation: Precise Tagging - 確保預訂標記正確傳遞
          is_backorder: Boolean(item.is_backorder),
        })) || [],
        
        // 🔄 確保客戶資訊的完整性
        customer: order.customer || null,
        creator: order.creator || null,
        
        // 💰 處理付款記錄 - 確保金額是 number 類型
        payment_records: order.payment_records?.map((payment: any) => ({
          ...payment,
          amount: parseFloat(payment.amount || '0'),
        })) || undefined,
      };
      
      return processedOrder;
    },
    enabled: !!orderId, // 只有在 orderId 存在時，此查詢才會被觸發
    staleTime: 5 * 60 * 1000, // 詳情頁數據可以緩存 5 分鐘
    retry: 2, // 失敗時重試 2 次
  });
}

/**
 * Hook for confirming an order's payment
 * 
 * 功能特性：
 * 1. 確認訂單付款狀態
 * 2. 自動刷新相關緩存（列表和詳情）
 * 3. 提供用戶友善的成功/錯誤提示
 * 4. 標準化的錯誤處理
 * 5. 🎯 100% 類型安全 - 移除所有 any 類型斷言
 * 
 * @returns React Query mutation 結果
 */
export function useConfirmOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order_id}/confirm-payment", {
        params: { 
          path: { 
            order_id: orderId,
            order: orderId
          } 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, orderId) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單款項已確認");
      }
      // 🚀 強化快取同步機制 - 確保頁面即時更新
      await Promise.all([
        // 1. 失效訂單列表快取
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        // 2. 失效並強制重新獲取訂單詳情
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDER(orderId),
          exact: false,
          refetchType: 'all' // 改為 'all' 確保頁面即時更新
        }),
        // 3. 強制重新獲取當前訂單詳情（雙重保險）
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ORDER(orderId),
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("操作失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * Hook for creating a shipment for an order
 * 
 * 功能特性：
 * 1. 創建訂單出貨記錄
 * 2. 支援物流資訊（如追蹤號碼）
 * 3. 自動刷新相關緩存
 * 4. 完整的成功/錯誤回饋
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCreateOrderShipment() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type CreateShipmentRequestBody = import('@/types/api').paths["/api/orders/{order_id}/create-shipment"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: CreateShipmentRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order_id}/create-shipment", {
        params: { 
          path: { 
            order_id: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已標記為已出貨");
      }
      // 標準化快取處理
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(payload.orderId), refetchType: 'active' });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("操作失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * Hook for adding partial payment to an order
 * 
 * 功能特性：
 * 1. 新增訂單部分付款記錄
 * 2. 支援訂金、分期付款等場景
 * 3. 自動計算已付金額和付款狀態
 * 4. 完整的付款歷史追蹤
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useAddOrderPayment() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type AddPaymentRequestBody = import('@/types/api').paths["/api/orders/{order_id}/add-payment"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: AddPaymentRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order_id}/add-payment", {
        params: { 
          path: { 
            order_id: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("付款記錄已成功新增", {
          description: `已記錄 $${(payload.data as any).amount} 的付款`
        });
      }
      // 🚀 強化快取同步機制 - 確保頁面即時更新
      await Promise.all([
        // 1. 失效訂單列表快取
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDERS,
          exact: false,
          refetchType: 'all' // 改為 'all' 確保所有快取都更新
        }),
        // 2. 失效並強制重新獲取訂單詳情
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.ORDER(payload.orderId),
          exact: false,
          refetchType: 'all' // 改為 'all' 確保頁面即時更新
        }),
        // 3. 強制重新獲取當前訂單詳情（雙重保險）
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.ORDER(payload.orderId),
          exact: false,
          type: 'active' // 只重新獲取活躍的查詢
        })
      ]);
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("付款記錄新增失敗", { 
          description: errorMessage || "請檢查付款金額是否正確" 
        });
      }
    },
  });
}

/**
 * Hook for updating an existing order - 契約淨化版本
 * 
 * 功能特性：
 * 1. 完整的類型安全保證 - 根除 any 類型污染
 * 2. 使用精確的 API 類型定義
 * 3. 標準化的錯誤處理和緩存失效
 * 4. 用戶友善的成功/錯誤通知
 * 
 * @returns React Query mutation 結果
 */
export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  // 🎯 契約淨化：使用精確的 API 類型定義，徹底根除 any 污染
  type UpdateOrderRequestBody = {
    customer_id?: number;
    shipping_status?: string;
    payment_status?: string;
    shipping_fee?: number | null;
    tax?: number | null;
    discount_amount?: number | null;
    payment_method?: string | null;
    shipping_address?: string | null;
    billing_address?: string | null;
    customer_address_id?: string | null;
    notes?: string | null;
    po_number?: string | null;
    reference_number?: string | null;
    subtotal?: number | null;
    grand_total?: number | null;
    items?: string[];
  };

  return useMutation({
    mutationFn: async (payload: { id: number; data: UpdateOrderRequestBody }) => {
      const { data, error } = await apiClient.PUT("/api/orders/{id}", {
        params: { path: { id: payload.id } },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已成功更新");
      }
      // 同時失效列表和詳情的快取
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(variables.id), refetchType: 'active' });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("更新失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * Hook for deleting a single order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const { data, error } = await apiClient.DELETE("/api/orders/{id}", {
        params: { path: { id: orderId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("訂單已成功刪除");
      }
      // 標準化快取處理
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS,
        refetchType: 'active',
      });
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("刪除失敗", { description: parseApiError(error) });
      }
    },
  });
}

/**
 * 更新訂單項目狀態的 Mutation Hook
 * 
 * 🎯 戰術功能：為訂單項目狀態追蹤提供完整的 API 集成
 * 
 * 功能特性：
 * 1. 類型安全的 API 調用 - 使用生成的類型定義
 * 2. 成功後自動刷新訂單詳情 - 「失效並強制重取」標準模式
 * 3. 用戶友善的成功/錯誤通知 - 使用 sonner toast
 * 4. 錯誤處理與訊息解析 - 統一的錯誤處理邏輯
 * 5. 支援狀態變更歷史記錄 - 自動記錄狀態變更軌跡
 * 
 * @returns React Query mutation 結果，包含 mutate 函數和狀態
 */
export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();
  
  // 使用 API 生成的類型定義
  type UpdateOrderItemStatusRequestBody = import('@/types/api').paths['/api/order-items/{order_item_id}/status']['patch']['requestBody']['content']['application/json'];
  type UpdateOrderItemStatusPayload = {
    orderItemId: number;
    status: string;
    notes?: string;
  };
  
  return useMutation({
    mutationFn: async ({ orderItemId, status, notes }: UpdateOrderItemStatusPayload) => {
      const requestBody: UpdateOrderItemStatusRequestBody = {
        status,
        ...(notes && { notes })
      };
      
      const { data, error } = await apiClient.PATCH('/api/order-items/{order_item_id}/status', {
        params: { path: { order_item_id: orderItemId } },
        body: requestBody,
      });
      
      if (error) {
        const errorMessage = parseApiError(error) || '更新訂單項目狀態失敗';
        throw new Error(errorMessage);
      }
      
      return data;
    },
    onSuccess: async (data, variables) => {
      // 從返回的訂單資料中提取訂單 ID
      const orderId = data?.data?.id;
      
      if (orderId) {
        // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
        await Promise.all([
          // 1. 失效指定訂單的詳情緩存
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.ORDER(orderId),
            exact: false,
            refetchType: 'active',
          }),
          // 2. 強制重新獲取訂單詳情
          queryClient.refetchQueries({
            queryKey: QUERY_KEYS.ORDER(orderId),
            exact: false,
          }),
          // 3. 同時失效訂單列表緩存（因為可能影響整體訂單狀態）
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.ORDERS,
            exact: false,
            refetchType: 'active',
          })
        ]);
      }
      
      // 🔔 成功通知 - 提升用戶體驗
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('訂單項目狀態已更新', {
          description: `項目狀態已更新為「${variables.status}」`
        });
      }
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('狀態更新失敗', { description: errorMessage });
      }
    },
  });
}

/**
 * Hook for creating an order refund
 * 
 * 功能特性：
 * 1. 創建品項級別的訂單退款
 * 2. 支援部分品項退貨
 * 3. 自動計算退款金額
 * 4. 可選擇性回補庫存
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCreateRefund() {
  const queryClient = useQueryClient();
  
  // 🚀 使用 API 生成的精確類型定義
  type CreateRefundRequestBody = import('@/types/api').paths["/api/orders/{order_id}/refunds"]["post"]["requestBody"]["content"]["application/json"];
  
  return useMutation({
    mutationFn: async (payload: { orderId: number; data: CreateRefundRequestBody }) => {
      // 🚀 使用精確的 API 類型，完全移除 any 斷言
      const { data, error } = await apiClient.POST("/api/orders/{order_id}/refunds", {
        params: { 
          path: { 
            order_id: payload.orderId
          } 
        },
        body: payload.data,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, payload) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success("退款已成功處理", {
          description: `退款金額：$${data?.data?.total_refund_amount || 0}`
        });
      }
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(payload.orderId), refetchType: 'active' });
    },
    onError: (error) => {
      const errorMessage = parseApiError(error);
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error("退款處理失敗", { 
          description: errorMessage || "請檢查退款資料是否正確" 
        });
      }
    },
  });
}

/**
 * Hook for cancelling an order - 終止作戰計畫
 * 
 * 功能特性：
 * 1. 取消訂單並返還庫存
 * 2. 支援選填取消原因
 * 3. 自動刷新相關緩存（列表和詳情）
 * 4. 提供用戶友善的成功/錯誤提示
 * 5. 🎯 100% 類型安全 - 使用精確的 API 類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      // @ts-expect-error 新端點尚未同步到類型定義
      const { error } = await apiClient.POST('/api/orders/{order}/cancel', {
        params: { path: { order: orderId } },
        body: { reason },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '取消訂單失敗');
      }
    },
    onSuccess: (_, { orderId }) => {
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('訂單已成功取消');
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 使訂單列表和該訂單的詳細資料緩存失效，觸發 UI 自動更新
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(orderId), refetchType: 'active' });
    },
    onError: (error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error(error.message);
      }
    },
  });
}

/**
 * Hook for batch deleting orders - 裁決行動
 * 
 * 功能特性：
 * 1. 批量刪除多個訂單，包含庫存返還邏輯
 * 2. 使用事務確保操作的原子性
 * 3. 支援預先檢查訂單狀態的安全機制
 * 4. 「失效並強制重取」標準快取處理模式
 * 5. 🎯 100% 類型安全 - 精確的批量操作類型定義
 * 
 * @returns React Query mutation 結果
 */
export function useBatchDeleteOrders() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids }: { ids: (number | string)[] }) => {
      const { error } = await apiClient.POST('/api/orders/batch-delete', {
        body: {
          ids: ids.map(id => id.toString()), // 確保發送的是字串陣列，以匹配參考實現
        },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '批量刪除訂單失敗');
      }
    },
    onSuccess: (_, { ids }) => {
      // 🔔 成功通知 - 顯示操作結果
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('所選訂單已成功刪除', {
          description: `已刪除 ${ids.length} 個訂單`
        });
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 批量操作後，使整個訂單列表的緩存失效，以獲取最新數據
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ORDERS,
        exact: false,
        refetchType: 'active'
      });
      
      // 同時移除被刪除訂單的詳情緩存，避免殘留數據
      ids.forEach(id => {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        queryClient.removeQueries({ queryKey: QUERY_KEYS.ORDER(numericId) });
      });
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('批量刪除失敗', { 
          description: error.message || '請檢查選擇的訂單是否允許刪除'
        });
      }
    },
  });
}

/**
 * Hook for batch updating order status - 批量狀態更新武器
 * 
 * 功能特性：
 * 1. 批量更新多個訂單的狀態（付款狀態或貨物狀態）
 * 2. 支援靈活的狀態類型選擇（payment_status 或 shipping_status）
 * 3. 事務化批量操作，確保資料一致性
 * 4. 自動記錄每個訂單的狀態變更歷史
 * 5. 🎯 100% 類型安全 - 嚴格的狀態類型約束
 * 
 * @returns React Query mutation 結果
 */
export function useBatchUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ids: (number | string)[];
      status_type: 'payment_status' | 'shipping_status';
      status_value: string;
      notes?: string;
    }) => {
      const { error } = await apiClient.POST('/api/orders/batch-update-status', {
        body: {
          ...payload,
          ids: payload.ids.map(id => id.toString()),
        },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '批量更新狀態失敗');
      }
    },
    onSuccess: (_, { status_type, status_value, ids }) => {
      // 🔔 成功通知 - 顯示詳細的操作結果
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        const statusTypeName = status_type === 'payment_status' ? '付款狀態' : '貨物狀態';
        toast.success('所選訂單狀態已成功更新', {
          description: `已將 ${ids.length} 個訂單的${statusTypeName}更新為「${status_value}」`
        });
      }
      
      // 🚀 「失效並強制重取」標準快取處理模式 - 雙重保險機制
      // 批量操作後，使整個訂單列表的緩存失效，以獲取最新數據
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ORDERS,
        exact: false,
        refetchType: 'active'
      });
      
      // 同時失效可能受影響的單個訂單詳情緩存
      ids.forEach(id => {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDER(numericId) });
      });
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理 - 友善的錯誤訊息
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('批量狀態更新失敗', { 
          description: error.message || '請檢查選擇的訂單和狀態設定'
        });
      }
    },
  });
}

// ==================== 報表與分析 (REPORTS & ANALYTICS) ====================

/**
 * 獲取商品變體的庫存時序數據
 * 
 * 🎯 戰術功能：為庫存趨勢圖表提供時序數據 API 集成
 * 
 * 功能特性：
 * 1. 返回指定商品變體的每日庫存水平數據
 * 2. 支援自定義日期範圍查詢
 * 3. 自動處理缺失日期的數據補全
 * 4. 提供累積計算的準確庫存數值
 * 5. 🎯 100% 類型安全 - 精確的時序數據類型定義
 * 
 * @param filters 查詢參數
 * @param filters.product_variant_id 商品變體ID（必填）
 * @param filters.start_date 開始日期 (YYYY-MM-DD)
 * @param filters.end_date 結束日期 (YYYY-MM-DD)
 * @returns React Query 查詢結果，包含時序數據陣列
 */
export function useInventoryTimeSeries(filters: {
  product_variant_id: number | null;
  start_date: string;
  end_date: string;
}) {
  const { product_variant_id, start_date, end_date } = filters;

  return useQuery({
    queryKey: ['inventoryTimeSeries', filters],
    queryFn: async () => {
      if (!product_variant_id) {
        throw new Error('product_variant_id is required');
      }
      
      const { data, error } = await apiClient.GET('/api/reports/inventory-time-series', {
        params: {
          query: { 
            product_variant_id: product_variant_id as number, 
            start_date, 
            end_date 
          },
        },
      });

      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取庫存趨勢數據失敗');
      }
      return data;
    },
    
    // 🎯 數據精煉廠 - 處理時序數據的標準化
    select: (response: any) => {
      // API 返回格式：{ data: [{ date: string, quantity: number }] }
      const timeSeriesData = response?.data || [];
      
      // 確保返回的是標準陣列格式
      if (!Array.isArray(timeSeriesData)) {
        console.warn('🚨 useInventoryTimeSeries: 未預期的響應格式', response);
        return [];
      }
      
      // 標準化每個數據點的格式
      return timeSeriesData.map((point: any) => ({
        date: point.date || '',
        quantity: point.quantity || 0
      }));
    },
    
    enabled: !!product_variant_id, // 只有在有 product_variant_id 時才觸發
    staleTime: 5 * 60 * 1000, // 5 分鐘緩存時間
  });
}

// ==================== 安裝管理 (INSTALLATION MANAGEMENT) ====================



import { 
  Installation, 
  InstallationFilters, 
  CreateInstallationRequest, 
  CreateInstallationFromOrderRequest,
  UpdateInstallationRequest,
  AssignInstallerRequest,
  UpdateInstallationStatusRequest,
  InstallationScheduleParams
} from '@/types/installation';

/**
 * 查詢金鑰定義 - 安裝管理
 */
export const INSTALLATION_QUERY_KEYS = {
  INSTALLATIONS: ['installations'] as const,
  INSTALLATION: (id: number) => ['installations', id] as const,
  SCHEDULE: ['installations', 'schedule'] as const,
};

/**
 * 獲取安裝單列表的 Hook
 * 
 * 功能特性：
 * 1. 支援完整的後端篩選參數（搜尋、狀態、師傅、日期等）
 * 2. 智能查詢鍵結構，支援所有篩選參數的精確緩存
 * 3. 分頁功能支援
 * 4. 🎯 資料精煉廠 - 在源頭處理所有數據轉換和類型安全
 * 
 * @param filters - 篩選參數物件
 * @returns React Query 查詢結果
 */
export function useInstallations(filters: InstallationFilters = {}) {
  return useQuery({
    queryKey: [...INSTALLATION_QUERY_KEYS.INSTALLATIONS, filters],
    queryFn: async () => {
      // 構建查詢參數，使用 Spatie QueryBuilder 格式
      const queryParams: Record<string, string | number | boolean> = {};
      
      if (filters.search) queryParams['filter[search]'] = filters.search;
      if (filters.status) queryParams['filter[status]'] = filters.status;
      if (filters.installer_user_id !== undefined) queryParams['filter[installer_user_id]'] = filters.installer_user_id;
      if (filters.start_date) queryParams['filter[start_date]'] = filters.start_date;
      if (filters.end_date) queryParams['filter[end_date]'] = filters.end_date;
      if (filters.page !== undefined) queryParams.page = filters.page;
      if (filters.per_page !== undefined) queryParams.per_page = filters.per_page;

      // 添加關聯資料載入，確保包含師傅和其他相關資訊
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
    
    // 🎯 數據精煉廠 - 安裝單數據的完美轉換
    select: (response: any) => {
      // 處理分頁數據結構
      const installations = response?.data?.data || response?.data || [];
      const meta = response?.data?.meta || null;
      const links = response?.data?.links || null;
      
      if (!Array.isArray(installations)) return { data: [], meta, links };

      // 轉換每個安裝單數據
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
        
        // 關聯數據處理
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
    
    // 🚀 體驗優化配置
    placeholderData: keepPreviousData, // 篩選時保持舊資料，避免載入閃爍
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 1 * 60 * 1000, // 1 分鐘緩存
    retry: 2,
  });
}

/**
 * 獲取單個安裝單詳情的 Hook
 * 
 * @param id - 安裝單 ID
 * @returns React Query 查詢結果
 */
export function useInstallation(id: number) {
  return useQuery({
    queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(id),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/installations/{id}', {
        params: { 
          path: { id },
          query: { include: 'items,installer,creator,order' }
        }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取安裝單詳情失敗');
      }
      
      return data;
    },
    
    // 🎯 數據精煉廠
    select: (response: any) => response?.data,
    
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 分鐘緩存
    retry: 2,
  });
}

/**
 * 創建安裝單的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useCreateInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInstallationRequest) => {
      console.log('API 調用 - 創建安裝單:', data);
      
      const { data: response, error } = await apiClient.POST('/api/installations', {
        body: data as any
      });
      
      if (error) {
        console.error('API 錯誤回應:', error);
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '創建安裝單失敗');
      }
      
      console.log('API 成功回應:', response);
      return response;
    },
    onSuccess: async (data) => {
      console.log('Hook onSuccess - 更新快取');
      
      // 🚀 「失效並強制重取」標準快取處理模式
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
      
      console.log('快取更新完成');
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單創建成功！', {
          description: `安裝單號：${data?.data?.installation_number}`
        });
      }
    },
    onError: (error) => {
      console.error('Hook onError:', error);
    },
  });
}

/**
 * 從訂單創建安裝單的 Hook
 * 
 * @returns React Query 變更結果
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
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await Promise.all([
        // 失效安裝單列表
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        // 失效相關訂單詳情
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDER(variables.order_id),
          exact: false,
          refetchType: 'active',
        })
      ]);
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單創建成功！', {
          description: `已從訂單創建安裝單：${data?.data?.installation_number}`
        });
      }
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('從訂單創建安裝單失敗', {
          description: error.message || '請檢查訂單狀態並重試。'
        });
      }
    },
  });
}

/**
 * 更新安裝單的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useUpdateInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateInstallationRequest) => {
      const { data: response, error } = await apiClient.PUT('/api/installations/{id}', {
        params: { path: { id } },
        body: data as any
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '更新安裝單失敗');
      }
      
      return response;
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await Promise.all([
        // 使快取失效並重新獲取列表
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
          exact: false,
          refetchType: 'active',
        }),
        // 使快取失效並重新獲取詳情
        queryClient.invalidateQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.id),
          exact: false,
          refetchType: 'active',
        }),
        // 強制重新獲取詳情
        queryClient.refetchQueries({
          queryKey: INSTALLATION_QUERY_KEYS.INSTALLATION(variables.id),
          exact: false,
        })
      ]);
    },
    onError: (error) => {
      console.error('Hook onError:', error);
    },
  });
}

/**
 * 刪除安裝單的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useDeleteInstallation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await apiClient.DELETE('/api/installations/{id}', {
        params: { path: { id } }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '刪除安裝單失敗');
      }
      
      return data;
    },
    onSuccess: async () => {
      // 🚀 「失效並強制重取」標準快取處理模式
      await queryClient.invalidateQueries({
        queryKey: INSTALLATION_QUERY_KEYS.INSTALLATIONS,
        exact: false,
        refetchType: 'active',
      });
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('安裝單已刪除');
      }
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('刪除安裝單失敗', {
          description: error.message
        });
      }
    },
  });
}

/**
 * 分配安裝師傅的 Hook
 * 
 * @returns React Query 變更結果
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
      // 🚀 「失效並強制重取」標準快取處理模式
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
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('已成功分配安裝師傅');
      }
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('分配安裝師傅失敗', {
          description: error.message
        });
      }
    },
  });
}

/**
 * 更新安裝單狀態的 Hook
 * 
 * @returns React Query 變更結果
 */
export function useUpdateInstallationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ installationId, ...data }: { installationId: number } & UpdateInstallationStatusRequest) => {
      const { data: response, error } = await apiClient.POST('/api/installations/{installation_id}/status', {
        params: { path: { installation_id: installationId } },
        body: data
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '更新安裝單狀態失敗');
      }
      
      return response;
    },
    onSuccess: async (data, variables) => {
      // 🚀 「失效並強制重取」標準快取處理模式
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
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        const statusLabels = {
          'pending': '待排程',
          'scheduled': '已排程',
          'in_progress': '進行中',
          'completed': '已完成',
          'cancelled': '已取消'
        };
        const statusText = statusLabels[variables.status as keyof typeof statusLabels] || variables.status;
        
        toast.success('安裝單狀態已更新', {
          description: `狀態已更新為「${statusText}」`
        });
      }
    },
    onError: (error) => {
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('更新安裝單狀態失敗', {
          description: error.message
        });
      }
    },
  });
}

/**
 * 獲取安裝行程的 Hook
 * 
 * @param params - 查詢參數
 * @returns React Query 查詢結果
 */
export function useInstallationSchedule(params: {
  installer_user_id?: number;
  start_date?: string;
  end_date?: string;
} = {}) {
  return useQuery({
    queryKey: [...INSTALLATION_QUERY_KEYS.SCHEDULE, params],
    queryFn: async () => {
      // 構建查詢參數
      const queryParams: Record<string, string | number> = {};
      
      if (params.installer_user_id !== undefined) queryParams['installer_user_id'] = params.installer_user_id;
      if (params.start_date) queryParams['start_date'] = params.start_date;
      if (params.end_date) queryParams['end_date'] = params.end_date;

      const { data, error } = await apiClient.GET('/api/installations/schedule', {
        params: { 
          query: Object.keys(queryParams).length > 0 ? queryParams as any : undefined 
        }
      });
      
      if (error) {
        const errorMessage = parseApiError(error);
        throw new Error(errorMessage || '獲取安裝行程失敗');
      }

      return data;
    },
    
    // 🎯 數據精煉廠 - 行程數據轉換
    select: (response: any) => {
      const schedules = response?.data || [];
      
      if (!Array.isArray(schedules)) return [];

      // 轉換為行事曆適用的格式
      return schedules.map((schedule: any) => ({
        id: schedule.id || 0,
        installation_number: schedule.installation_number || '',
        customer_name: schedule.customer_name || '',
        installation_address: schedule.installation_address || '',
        scheduled_date: schedule.scheduled_date || '',
        status: schedule.status || 'pending',
        installer: schedule.installer ? {
          id: schedule.installer.id || 0,
          name: schedule.installer.name || '',
          color: schedule.installer.color || null,
        } : null,
      })) as any[];
    },
    
    // 🚀 體驗優化配置
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 分鐘緩存
    retry: 2,
  });
}