/**
 * 用戶類型定義
 * 
 * 統一的用戶類型系統，從 OpenAPI 契約中導出權威類型
 * 單一事實來源（Single Source of Truth）
 */

// Store 類型定義
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

/**
 * 用戶實體類型
 * 
 * 從 API 響應中提取的用戶資料結構
 * 確保前後端類型完全同步
 * 
 * 🔧 已修復：支援多角色系統，與後端 UserResource 完全匹配
 */
export interface User {
  id: number;
  name: string;
  username: string;
  roles: string[];              // 🔧 修復：用戶的所有角色（陣列）
  roles_display: string[];      // 🔧 修復：角色顯示名稱（陣列）
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  stores?: Store[];
}

/**
 * 登入響應中的用戶類型
 * 
 * 從登入 API 響應中提取的用戶類型
 * 用於認證上下文和登入流程
 */
export type AuthUser = User;

/**
 * 用戶操作處理器介面
 * 
 * 定義表格中各種操作的回調函數
 * 保持原有的操作介面但使用統一的User類型
 */
export interface UserActions {
  /** 查看用戶詳情 */
  onView?: (user: User) => void
  /** 編輯用戶 */
  onEdit?: (user: User) => void
  /** 刪除用戶 */
  onDelete?: (user: User) => void
  /** 分配分店 */
  onManageStores?: (user: User) => void
  /** 當前用戶（用於權限判斷） */
  currentUser?: {
    is_admin?: boolean
    id?: number
  }
}

/**
 * 登入請求類型
 * 
 * 用於登入表單和認證流程
 */
export type LoginRequest = {
  username: string;
  password: string;
}; 