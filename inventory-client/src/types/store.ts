// 商店相關的類型定義

/**
 * 門市基本資訊
 */
export interface Store {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

/**
 * 門市創建表單資料
 */
export interface StoreFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email?: string | null;
  status: 'active' | 'inactive';
}

/**
 * 門市過濾條件
 */
export interface StoreFilters {
  name?: string;
  status?: string;
  page?: number;
  per_page?: number;
} 