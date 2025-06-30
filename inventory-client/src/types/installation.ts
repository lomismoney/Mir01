/**
 * 安裝管理相關型別定義
 * 
 * 此文件定義了安裝管理功能所需的所有型別
 * 包含：安裝單、安裝項目、安裝師傅分配等相關資料結構
 */

/**
 * 安裝單狀態枚舉
 */
export type InstallationStatus = 
  | 'pending'     // 待排程
  | 'scheduled'   // 已排程
  | 'in_progress' // 進行中
  | 'completed'   // 已完成
  | 'cancelled';  // 已取消

/**
 * 安裝項目狀態枚舉
 */
export type InstallationItemStatus = 
  | 'pending'   // 待安裝
  | 'completed' // 已完成
  | 'skipped';  // 跳過

/**
 * 狀態標籤映射
 */
export const INSTALLATION_STATUS_LABELS: Record<InstallationStatus, string> = {
  pending: '待排程',
  scheduled: '已排程',
  in_progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 狀態變體映射
 */
export const INSTALLATION_STATUS_VARIANTS: Record<InstallationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  scheduled: 'secondary',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
};

/**
 * 安裝項目狀態標籤映射
 */
export const INSTALLATION_ITEM_STATUS_LABELS: Record<InstallationItemStatus, string> = {
  pending: '待安裝',
  completed: '已完成',
  skipped: '跳過',
};

/**
 * 用戶資訊（用於安裝師傅和建立者）
 */
export interface InstallationUser {
  /** 用戶 ID */
  id: number;
  /** 用戶姓名 */
  name: string;
  /** 用戶名稱 */
  username: string;
}

/**
 * 關聯訂單資訊
 */
export interface InstallationOrder {
  /** 訂單 ID */
  id: number;
  /** 訂單編號 */
  order_number: string;
  /** 客戶姓名 */
  customer_name: string;
}

/**
 * 安裝項目介面
 */
export interface InstallationItem {
  /** 項目 ID */
  id: number;
  /** 商品變體 ID */
  product_variant_id?: number;
  /** 商品名稱 */
  product_name: string;
  /** 商品 SKU */
  sku: string;
  /** 安裝數量 */
  quantity: number;
  /** 安裝規格說明 */
  specifications?: string | null;
  /** 項目備註 */
  notes?: string | null;
  /** 項目狀態 */
  status: InstallationItemStatus;
  /** 創建時間 */
  created_at: string;
  /** 更新時間 */
  updated_at: string;
}

/**
 * 安裝單基礎資訊
 */
export interface Installation {
  /** 安裝單 ID */
  id: number;
  /** 安裝單編號 */
  installation_number: string;
  /** 關聯訂單 ID */
  order_id?: number | null;
  /** 客戶姓名 */
  customer_name: string;
  /** 客戶電話 */
  customer_phone?: string | null;
  /** 安裝地址 */
  installation_address: string;
  /** 安裝師傅用戶 ID */
  installer_user_id?: number | null;
  /** 安裝狀態 */
  status: InstallationStatus;
  /** 預計安裝日期 */
  scheduled_date?: string | null;
  /** 實際開始時間 */
  actual_start_time?: string | null;
  /** 實際結束時間 */
  actual_end_time?: string | null;
  /** 備註 */
  notes?: string | null;
  /** 建立者用戶 ID */
  created_by: number;
  /** 創建時間 */
  created_at: string;
  /** 更新時間 */
  updated_at: string;
  
  // 關聯資料
  /** 安裝師傅資訊 */
  installer?: InstallationUser | null;
  /** 建立者資訊 */
  creator?: InstallationUser | null;
  /** 關聯的訂單資訊 */
  order?: InstallationOrder | null;
  /** 安裝項目 */
  items?: InstallationItem[];
}

/**
 * 創建安裝項目請求
 */
export interface CreateInstallationItemRequest {
  /** 商品變體 ID */
  product_variant_id?: number | null;
  /** 商品名稱 */
  product_name: string;
  /** 商品 SKU */
  sku: string;
  /** 安裝數量 */
  quantity: number;
  /** 安裝規格說明 */
  specifications?: string | null;
  /** 項目備註 */
  notes?: string | null;
}

/**
 * 創建安裝單請求
 */
export interface CreateInstallationRequest {
  /** 客戶姓名 */
  customer_name: string;
  /** 客戶電話 */
  customer_phone?: string | null;
  /** 安裝地址 */
  installation_address: string;
  /** 安裝師傅 ID */
  installer_user_id?: number | null;
  /** 預計安裝日期 */
  scheduled_date?: string | null;
  /** 備註 */
  notes?: string | null;
  /** 安裝項目列表 */
  items: CreateInstallationItemRequest[];
}

/**
 * 更新安裝項目請求
 */
export interface UpdateInstallationItemRequest {
  /** 項目 ID（編輯現有項目時提供） */
  id?: number;
  /** 商品變體 ID */
  product_variant_id?: number | null;
  /** 商品名稱 */
  product_name: string;
  /** 商品 SKU */
  sku: string;
  /** 安裝數量 */
  quantity: number;
  /** 安裝規格說明 */
  specifications?: string | null;
  /** 項目備註 */
  notes?: string | null;
  /** 項目狀態 */
  status?: InstallationItemStatus;
}

/**
 * 更新安裝單請求
 */
export interface UpdateInstallationRequest {
  /** 客戶姓名 */
  customer_name: string;
  /** 客戶電話 */
  customer_phone?: string | null;
  /** 安裝地址 */
  installation_address: string;
  /** 安裝師傅 ID */
  installer_user_id?: number | null;
  /** 預計安裝日期 */
  scheduled_date?: string | null;
  /** 備註 */
  notes?: string | null;
  /** 安裝項目列表 */
  items?: UpdateInstallationItemRequest[];
}

/**
 * 從訂單創建安裝單請求
 */
export interface CreateInstallationFromOrderRequest {
  /** 訂單 ID */
  order_id: number;
  /** 安裝地址 */
  installation_address: string;
  /** 安裝師傅 ID */
  installer_user_id?: number | null;
  /** 預計安裝日期 */
  scheduled_date?: string | null;
  /** 備註 */
  notes?: string | null;
}

/**
 * 安裝單篩選參數
 */
export interface InstallationFilters {
  /** 搜尋關鍵字 */
  search?: string;
  /** 狀態篩選 */
  status?: InstallationStatus;
  /** 安裝師傅 ID */
  installer_user_id?: number;
  /** 開始日期 */
  start_date?: string;
  /** 結束日期 */
  end_date?: string;
  /** 頁碼 */
  page?: number;
  /** 每頁數量 */
  per_page?: number;
}

/**
 * 安裝師傅分配請求
 */
export interface AssignInstallerRequest {
  /** 安裝師傅用戶 ID */
  installer_user_id: number;
  /** 預計安裝日期 */
  scheduled_date?: string | null;
}

/**
 * 安裝單狀態更新請求
 */
export interface UpdateInstallationStatusRequest {
  /** 新狀態 */
  status: InstallationStatus;
  /** 狀態備註 */
  notes?: string | null;
}

/**
 * 安裝排程參數
 */
export interface InstallationScheduleParams {
  /** 安裝師傅 ID */
  installer_user_id?: number;
  /** 開始日期 */
  start_date?: string;
  /** 結束日期 */
  end_date?: string;
}

/**
 * 完整的安裝單介面（包含關聯資料）
 */
export interface InstallationWithRelations extends Omit<Installation, 'installer' | 'creator' | 'order' | 'items'> {
  /** 安裝項目列表 */
  items?: InstallationItem[];
  /** 關聯的訂單資訊 */
  order?: InstallationOrder;
  /** 安裝師傅資訊 */
  installer?: InstallationUser;
  /** 建立者資訊 */
  creator?: InstallationUser;
  /** 待完成項目數量 */
  pending_items_count?: number;
}

/**
 * 安裝統計資料
 */
export interface InstallationStats {
  total_installations: number;
  pending_installations: number;
  in_progress_installations: number;
  completed_installations: number;
  cancelled_installations: number;
}
