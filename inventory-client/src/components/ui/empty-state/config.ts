import { Package, ShoppingCart, Users, FolderTree, Warehouse, Wrench } from 'lucide-react';
import { EmptyStateConfig } from './types';

/**
 * 各模塊的空狀態配置
 * 統一管理所有模塊的空狀態文案和路由
 */
export const emptyStateConfig: EmptyStateConfig = {
  products: {
    title: '尚無商品',
    description: '開始新增您的第一個商品，建立您的商品目錄',
    actionLabel: '新增商品',
    actionRoute: '/products/new',
  },
  orders: {
    title: '尚無訂單',
    description: '等待您的第一筆訂單，或手動建立新訂單',
    actionLabel: '建立訂單',
    actionRoute: '/orders/new',
  },
  customers: {
    title: '尚無客戶',
    description: '新增您的第一位客戶，開始建立客戶關係',
    actionLabel: '新增客戶',
    actionRoute: '/customers/new',
  },
  categories: {
    title: '尚無分類',
    description: '建立商品分類，更好地組織您的商品',
    actionLabel: '新增分類',
    actionRoute: '/categories/new',
  },
  inventory: {
    title: '尚無庫存記錄',
    description: '開始管理您的庫存，追蹤商品數量',
    actionLabel: '查看商品',
    actionRoute: '/products',
  },
  installations: {
    title: '尚無安裝記錄',
    description: '記錄您的第一筆安裝服務',
    actionLabel: '新增安裝',
    actionRoute: '/installations/new',
  },
};

/**
 * 各模塊的圖標映射
 */
export const moduleIcons = {
  products: Package,
  orders: ShoppingCart,
  customers: Users,
  categories: FolderTree,
  inventory: Warehouse,
  installations: Wrench,
};

/**
 * 搜索建議配置
 */
export const searchSuggestions = {
  products: [
    '嘗試搜尋商品名稱',
    '使用 SKU 編號搜尋',
    '檢查拼寫是否正確',
  ],
  orders: [
    '嘗試搜尋訂單編號',
    '使用客戶名稱搜尋',
    '調整日期範圍篩選',
  ],
  customers: [
    '嘗試搜尋客戶姓名',
    '使用電話號碼搜尋',
    '使用電子郵件搜尋',
  ],
  categories: [
    '嘗試搜尋分類名稱',
    '檢查分類層級',
    '確認分類狀態',
  ],
  inventory: [
    '嘗試搜尋商品名稱',
    '使用 SKU 編號搜尋',
    '檢查庫存狀態',
  ],
  installations: [
    '嘗試搜尋安裝編號',
    '使用客戶名稱搜尋',
    '調整日期範圍篩選',
  ],
  default: [
    '使用更簡短的關鍵字',
    '檢查拼寫是否正確',
    '移除篩選條件重試',
  ],
};