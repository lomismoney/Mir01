import { Store } from '@/types/store';
import { PaginatedResponse } from '@/types/inventory';
import { getToken } from '@/lib/tokenManager';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost';

// 封裝請求函數，統一處理 Authentication 和錯誤
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// 創建查詢字串
function createQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
}

/**
 * 獲取門市列表
 */
export async function getStores({
  name,
  status,
  page = 1,
  per_page = 15,
}: {
  name?: string;
  status?: string;
  page?: number;
  per_page?: number;
} = {}): Promise<PaginatedResponse<Store>> {
  const queryString = createQueryString({
    name,
    status,
    page,
    per_page,
  });

  return fetchApi<PaginatedResponse<Store>>(`/api/stores${queryString}`);
}

/**
 * 獲取單個門市詳情
 */
export async function getStoreDetail(id: number): Promise<Store> {
  return fetchApi<Store>(`/api/stores/${id}`);
} 