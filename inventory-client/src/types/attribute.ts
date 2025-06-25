/**
 * 屬性介面定義
 */
export interface Attribute {
  /** 屬性 ID */
  id: number;
  /** 屬性名稱，如：顏色、尺寸、材質 */
  name: string;
  /** 創建時間 */
  created_at?: string;
  /** 更新時間 */
  updated_at?: string;
  /** 屬性值陣列 */
  values?: AttributeValue[];
  /** 關聯商品數量 */
  products_count?: number;
}

/**
 * 屬性值介面定義
 */
export interface AttributeValue {
  /** 屬性值 ID */
  id: number;
  /** 屬性值，如：紅色、藍色、S、M、L */
  value: string;
  /** 屬性 ID */
  attribute_id: number;
  /** 創建時間 */
  created_at?: string;
  /** 更新時間 */
  updated_at?: string;
  /** 關聯的屬性 */
  attribute?: Attribute;
} 