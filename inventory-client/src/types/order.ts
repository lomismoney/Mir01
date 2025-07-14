// 訂單項目類型枚舉（對應後端 OrderItemType）
export enum OrderItemType {
  STOCK = 'stock',       // 現貨商品
  BACKORDER = 'backorder', // 預訂商品  
  CUSTOM = 'custom'      // 訂製商品
}

// 訂單項目類型選項
export const ORDER_ITEM_TYPE_OPTIONS = {
  [OrderItemType.STOCK]: '現貨商品',
  [OrderItemType.BACKORDER]: '預訂商品',
  [OrderItemType.CUSTOM]: '訂製商品',
} as const;

// 履行狀態
export interface FulfillmentStatus {
  is_fulfilled: boolean;
  fulfilled_quantity: number;
  fulfilled_at: string | null;
  remaining_fulfillment_quantity: number;
  is_partially_fulfilled: boolean;
  is_fully_fulfilled: boolean;
}

// 訂單項目基本信息
export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id: number | null;
  product_name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  fulfilled_quantity: number;
  tax_rate: number;
  discount_amount: number;
  
  // 統一商品類型欄位（新增）
  item_type: OrderItemType;
  
  // 商品類型標記（向後兼容）
  is_stocked_sale: boolean;
  is_backorder: boolean;
  
  // 履行狀態
  is_fulfilled: boolean;
  fulfilled_at: string | null;
  
  // 採購追蹤
  purchase_item_id: number | null;
  
  // 訂製商品相關
  custom_product_name?: string;
  custom_specifications?: Record<string, unknown>;
  custom_product_specs?: string;
  custom_product_image?: string;
  custom_product_category?: string;
  custom_product_brand?: string;
  
  // 關聯數據
  product_variant?: {
    id: number;
    sku: string;
    product: {
      id: number;
      name: string;
    };
  };
  
  // 計算屬性
  purchase_status: string;
  purchase_status_text: string;
}

// 訂單項目創建/更新數據
export interface OrderItemFormData {
  id?: number;
  product_variant_id?: number | null;
  product_name: string;
  sku: string;
  price: number;
  cost?: number;
  quantity: number;
  tax_rate?: number;
  discount_amount?: number;
  
  // 商品類型（前端使用）
  item_type?: OrderItemType;
  
  // 或使用後端格式的標記
  is_stocked_sale?: boolean;
  is_backorder?: boolean;
  
  // 訂製商品相關
  custom_product_name?: string;
  custom_specifications?: Record<string, unknown>;
}

// 工具函數：判斷商品類型
export function determineOrderItemType(item: {
  item_type?: OrderItemType;
  is_stocked_sale?: boolean;
  is_backorder?: boolean;
  product_variant_id?: number | null;
}): OrderItemType {
  // 優先使用新的統一 item_type 欄位
  if (item.item_type) {
    return item.item_type;
  }
  
  // 向後兼容：使用舊的布爾標記
  if (item.is_stocked_sale) {
    return OrderItemType.STOCK;
  }
  
  if (item.is_backorder) {
    return OrderItemType.BACKORDER;
  }
  
  // 有變體ID但不是現貨也不是預訂，則為訂製商品
  if (item.product_variant_id) {
    return OrderItemType.CUSTOM;
  }
  
  // 預設為預訂商品
  return OrderItemType.BACKORDER;
}

// 工具函數：獲取類型標記
export function getOrderItemTypeFlags(type: OrderItemType): {
  is_stocked_sale: boolean;
  is_backorder: boolean;
} {
  switch (type) {
    case OrderItemType.STOCK:
      return { is_stocked_sale: true, is_backorder: false };
    case OrderItemType.BACKORDER:
      return { is_stocked_sale: false, is_backorder: true };
    case OrderItemType.CUSTOM:
      return { is_stocked_sale: false, is_backorder: false };
    default:
      return { is_stocked_sale: false, is_backorder: true };
  }
}

// 工具函數：判斷是否需要扣減庫存
export function shouldDeductInventory(type: OrderItemType): boolean {
  return type === OrderItemType.STOCK;
}

// 工具函數：判斷創建時是否立即標記為已履行
export function shouldMarkFulfilledOnCreate(type: OrderItemType): boolean {
  return type === OrderItemType.STOCK;
}

// 履行狀態徽章樣式
export function getFulfillmentBadgeVariant(item: OrderItem): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (item.is_fulfilled) {
    return 'default';
  }
  
  if (item.fulfilled_quantity > 0) {
    return 'secondary'; // 部分履行
  }
  
  return 'outline'; // 未履行
}

// 履行狀態文字
export function getFulfillmentStatusText(item: OrderItem): string {
  if (item.is_fulfilled) {
    return '已履行';
  }
  
  if (item.fulfilled_quantity > 0) {
    return `部分履行 (${item.fulfilled_quantity}/${item.quantity})`;
  }
  
  return '未履行';
}

// 商品類型徽章樣式
export function getItemTypeBadgeVariant(type: OrderItemType): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case OrderItemType.STOCK:
      return 'default';
    case OrderItemType.BACKORDER:
      return 'secondary';
    case OrderItemType.CUSTOM:
      return 'outline';
    default:
      return 'outline';
  }
}