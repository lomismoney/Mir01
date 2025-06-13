/**
 * API 類型轉換助手
 * 
 * 將 OpenAPI 生成的可選類型轉換為前端使用的精確類型
 * 遵循架構規範：「建議透過 src/types/ 下的助手檔案進行別名導出」
 */

import type { paths } from './api';

// 提取 API 回應的基礎類型
type CategoriesResponse = paths['/api/categories']['get']['responses'][200]['content']['application/json'];
type AttributesResponse = paths['/api/attributes']['get']['responses'][200]['content']['application/json'];
type ProductsResponse = paths['/api/products']['get']['responses'][200]['content']['application/json'];

/**
 * 將 API 回應轉換為前端使用的 Category 類型
 */
export function transformCategoriesResponse(response: CategoriesResponse): Array<{
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}> {
  if (!response?.data) return [];
  
  return response.data
    .filter((item): item is Required<typeof item> => 
      typeof item?.id === 'number' && typeof item?.name === 'string'
    )
    .map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || null,
      parent_id: item.parent_id ? Number(item.parent_id) : null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
}

/**
 * 將分組的分類 API 回應轉換為 Record 格式
 * 用於需要按 parent_id 分組顯示的頁面
 */
export function transformCategoriesGroupedResponse(response: unknown): Record<string, Array<{
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  created_at?: string;
  updated_at?: string;
}>> {
  // 如果回應已經是正確的格式，直接返回
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const result: Record<string, Array<{
      id: number;
      name: string;
      description?: string | null;
      parent_id?: number | null;
      created_at?: string;
      updated_at?: string;
    }>> = {};
    
    for (const [key, value] of Object.entries(response)) {
      if (Array.isArray(value)) {
        result[key] = value
          .filter((item): item is { id: number; name: string; [key: string]: unknown } => 
            typeof item?.id === 'number' && typeof item?.name === 'string'
          )
          .map(item => ({
            id: item.id,
            name: item.name,
            description: typeof item.description === 'string' ? item.description : null,
            parent_id: item.parent_id ? Number(item.parent_id) : null,
            created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
            updated_at: typeof item.updated_at === 'string' ? item.updated_at : undefined,
          }));
      }
    }
    
    return result;
  }
  
  return {};
}

/**
 * 將 API 回應轉換為前端使用的 Attribute 類型
 */
export function transformAttributesResponse(response: AttributesResponse): Array<{
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  values?: Array<{
    id: number;
    value: string;
    attribute_id: number;
    created_at?: string;
    updated_at?: string;
  }>;
}> {
  if (!response?.data) return [];
  
  return response.data
    .filter((item): item is Required<Pick<typeof item, 'id' | 'name'>> & typeof item => 
      typeof item?.id === 'number' && typeof item?.name === 'string'
    )
    .map(item => ({
      id: item.id,
      name: item.name,
      created_at: item.created_at,
      updated_at: item.updated_at,
      values: item.values
        ?.filter((value): value is Required<Pick<typeof value, 'id' | 'value' | 'attribute_id'>> & typeof value =>
          typeof value?.id === 'number' && 
          typeof value?.value === 'string' && 
          typeof value?.attribute_id === 'number'
        )
        .map(value => ({
          id: value.id,
          value: value.value,
          attribute_id: value.attribute_id,
          created_at: value.created_at,
          updated_at: value.updated_at,
        })) || [],
    }));
}

/**
 * 將產品 API 回應轉換為前端使用的格式
 * 包含分頁資訊和產品資料陣列
 */
export function transformProductsResponse(response: ProductsResponse): {
  data: Array<{
    id: number;
    name: string;
    sku: string;
    description?: string | null;
    selling_price: number;
    cost_price: number;
    category_id?: number | null;
    created_at?: string;
    updated_at?: string;
    category?: {
      id: number;
      name: string;
      description?: string | null;
    } | null;
  }>;
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
} {
  if (!response?.data) {
    return { data: [] };
  }
  
  const transformedData = response.data
    .filter((item): item is { id: number; name: string; sku: string; [key: string]: unknown } => 
      typeof item?.id === 'number' && 
      typeof item?.name === 'string' && 
      typeof item?.sku === 'string'
    )
    .map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      description: typeof item.description === 'string' ? item.description : null,
      selling_price: typeof item.selling_price === 'number' ? item.selling_price : Number(item.selling_price) || 0,
      cost_price: typeof item.cost_price === 'number' ? item.cost_price : Number(item.cost_price) || 0,
      category_id: item.category_id ? Number(item.category_id) : null,
      created_at: typeof item.created_at === 'string' ? item.created_at : undefined,
      updated_at: typeof item.updated_at === 'string' ? item.updated_at : undefined,
      category: item.category && typeof item.category === 'object' && 'id' in item.category ? {
        id: typeof (item.category as Record<string, unknown>).id === 'number' ? (item.category as Record<string, unknown>).id as number : Number((item.category as Record<string, unknown>).id),
        name: typeof (item.category as Record<string, unknown>).name === 'string' ? (item.category as Record<string, unknown>).name as string : String((item.category as Record<string, unknown>).name),
        description: typeof (item.category as Record<string, unknown>).description === 'string' ? (item.category as Record<string, unknown>).description as string : null,
      } : null,
    }));
  
  return {
    data: transformedData,
    current_page: response.meta?.current_page,
    last_page: response.meta?.last_page,
    per_page: response.meta?.per_page,
    total: response.meta?.total,
  };
}

/**
 * 將前端商品資料轉換為 API 請求格式
 */
export function transformProductDataForAPI(data: {
  name: string;
  description: string | null;
  category_id: number | null;
  attributes: number[];
  variants: Array<{
    sku: string;
    price: number;
    attribute_value_ids: (number | undefined)[];
  }>;
}): paths['/api/products']['post']['requestBody']['content']['application/json'] {
  return {
    name: data.name,
    description: data.description,
    category_id: data.category_id,
    attributes: data.attributes,
    variants: data.variants.map(variant => ({
      sku: variant.sku,
      price: variant.price,
      // 過濾掉 undefined 值，確保類型安全
      attribute_value_ids: variant.attribute_value_ids.filter((id): id is number => id !== undefined),
    })),
  };
} 