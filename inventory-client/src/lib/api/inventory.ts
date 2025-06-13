import { Inventory, InventoryTransaction, InventoryTransfer, PaginatedResponse } from '@/types/inventory';
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
 * 獲取庫存列表
 */
export async function getInventoryList({
  store_id,
  low_stock,
  out_of_stock,
  product_name,
  page = 1,
  per_page = 15,
}: {
  store_id?: number;
  low_stock?: boolean;
  out_of_stock?: boolean;
  product_name?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResponse<Inventory>> {
  const queryString = createQueryString({
    store_id,
    low_stock,
    out_of_stock,
    product_name,
    page,
    per_page,
  });

  return fetchApi<PaginatedResponse<Inventory>>(`/api/inventory${queryString}`);
}

/**
 * 獲取單個庫存詳情
 */
export async function getInventoryDetail(id: number): Promise<Inventory> {
  return fetchApi<Inventory>(`/api/inventory/${id}`);
}

/**
 * 調整庫存
 */
export async function adjustInventory({
  product_variant_id,
  store_id,
  action,
  quantity,
  notes,
  metadata,
}: {
  product_variant_id: number;
  store_id: number;
  action: 'add' | 'reduce' | 'set';
  quantity: number;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<{ message: string; inventory: Inventory }> {
  return fetchApi<{ message: string; inventory: Inventory }>('/api/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify({
      product_variant_id,
      store_id,
      action,
      quantity,
      notes,
      metadata,
    }),
  });
}

/**
 * 獲取庫存交易歷史
 */
export async function getInventoryHistory({
  id,
  start_date,
  end_date,
  type,
  per_page = 15,
  page = 1,
}: {
  id: number;
  start_date?: string;
  end_date?: string;
  type?: string;
  per_page?: number;
  page?: number;
}): Promise<PaginatedResponse<InventoryTransaction>> {
  const queryString = createQueryString({
    start_date,
    end_date,
    type,
    per_page,
    page,
  });

  return fetchApi<PaginatedResponse<InventoryTransaction>>(`/api/inventory/${id}/history${queryString}`);
}

/**
 * 獲取庫存轉移列表
 */
export async function getInventoryTransfers({
  from_store_id,
  to_store_id,
  status,
  start_date,
  end_date,
  product_name,
  per_page = 15,
  page = 1,
}: {
  from_store_id?: number;
  to_store_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  per_page?: number;
  page?: number;
}): Promise<PaginatedResponse<InventoryTransfer>> {
  const queryString = createQueryString({
    from_store_id,
    to_store_id,
    status,
    start_date,
    end_date,
    product_name,
    per_page,
    page,
  });

  return fetchApi<PaginatedResponse<InventoryTransfer>>(`/api/inventory/transfers${queryString}`);
}

/**
 * 獲取單個庫存轉移詳情
 */
export async function getInventoryTransferDetail(id: number): Promise<InventoryTransfer> {
  return fetchApi<InventoryTransfer>(`/api/inventory/transfers/${id}`);
}

/**
 * 創建庫存轉移
 */
export async function createInventoryTransfer({
  from_store_id,
  to_store_id,
  product_variant_id,
  quantity,
  notes,
  status,
}: {
  from_store_id: number;
  to_store_id: number;
  product_variant_id: number;
  quantity: number;
  notes?: string;
  status?: string;
}): Promise<{ message: string; transfer: InventoryTransfer }> {
  return fetchApi<{ message: string; transfer: InventoryTransfer }>('/api/inventory/transfers', {
    method: 'POST',
    body: JSON.stringify({
      from_store_id,
      to_store_id,
      product_variant_id,
      quantity,
      notes,
      status,
    }),
  });
}

/**
 * 更新庫存轉移狀態
 */
export async function updateInventoryTransferStatus({
  id,
  status,
  notes,
}: {
  id: number;
  status: string;
  notes?: string;
}): Promise<{ message: string; transfer: InventoryTransfer }> {
  return fetchApi<{ message: string; transfer: InventoryTransfer }>(`/api/inventory/transfers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      notes,
    }),
  });
}

/**
 * 取消庫存轉移
 */
export async function cancelInventoryTransfer({
  id,
  reason,
}: {
  id: number;
  reason: string;
}): Promise<{ message: string; transfer: InventoryTransfer }> {
  return fetchApi<{ message: string; transfer: InventoryTransfer }>(`/api/inventory/transfers/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({
      reason,
    }),
  });
} 