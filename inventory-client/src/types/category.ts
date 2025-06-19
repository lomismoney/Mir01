/**
 * Category 類型助手檔案
 * 
 * 定義權威的 Category 類型，確保前端使用的類型與後端 API 契約完全同步。
 * 
 * 這個方法的優勢：
 * 1. 統一類型定義：所有元件都使用相同的 Category 類型
 * 2. 類型安全：避免手動重複定義造成的不一致問題
 * 3. 易於維護：單一位置管理 Category 類型定義
 * 4. 開發效率：提供完整的 TypeScript 類型檢查支援
 */

/**
 * 分類資料結構
 * 
 * 對應後端 Category 模型和 CategoryResource 的結構，
 * 包含前端樹狀結構所需的所有欄位。
 */
export interface Category {
  /** 分類 ID */
  id: number;
  /** 分類名稱 */
  name: string;
  /** 分類描述 */
  description?: string | null;
  /** 父分類 ID，null 表示頂層分類 */
  parent_id?: number | null;
  /** 該分類的商品數量（當有載入統計時） */
  products_count?: number;
  /** 包含所有子分類的商品總數 */
  total_products_count?: number;
  /** 建立時間 */
  created_at?: string;
  /** 更新時間 */
  updated_at?: string;
  /** 子分類陣列（用於前端樹狀結構渲染） */
  children?: Category[];
} 