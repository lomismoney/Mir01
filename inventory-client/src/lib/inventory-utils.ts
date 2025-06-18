import { TrendingUp, TrendingDown, Settings, Package } from "lucide-react"

/**
 * 庫存交易類型常數
 */
export const TRANSACTION_TYPES = {
  ADDITION: 'addition',
  REDUCTION: 'reduction', 
  ADJUSTMENT: 'adjustment',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_CANCEL: 'transfer_cancel',
} as const

/**
 * 根據交易類型返回對應的圖示組件
 */
export function getTransactionIcon(type?: string) {
  switch (type) {
    case TRANSACTION_TYPES.ADDITION:
    case TRANSACTION_TYPES.TRANSFER_IN:
      return TrendingUp
    case TRANSACTION_TYPES.REDUCTION:
    case TRANSACTION_TYPES.TRANSFER_OUT:
      return TrendingDown
    case TRANSACTION_TYPES.ADJUSTMENT:
      return Settings
    default:
      return Package
  }
}

/**
 * 根據交易類型返回中文名稱
 */
export function getTransactionTypeName(type?: string): string {
  switch (type) {
    case TRANSACTION_TYPES.ADDITION:
      return '入庫'
    case TRANSACTION_TYPES.REDUCTION:
      return '出庫'
    case TRANSACTION_TYPES.ADJUSTMENT:
      return '調整'
    case TRANSACTION_TYPES.TRANSFER_OUT:
      return '轉出'
    case TRANSACTION_TYPES.TRANSFER_IN:
      return '轉入'
    case TRANSACTION_TYPES.TRANSFER_CANCEL:
      return '取消轉移'
    default:
      return type || '未知'
  }
}

/**
 * 根據交易類型返回 Badge 的樣式變體
 */
export function getTransactionTypeVariant(type?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case TRANSACTION_TYPES.ADDITION:
    case TRANSACTION_TYPES.TRANSFER_IN:
      return 'default'
    case TRANSACTION_TYPES.REDUCTION:
    case TRANSACTION_TYPES.TRANSFER_OUT:
      return 'destructive'
    case TRANSACTION_TYPES.ADJUSTMENT:
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * 根據交易類型返回圖示的顏色樣式類別
 */
export function getTransactionIconColor(type?: string): string {
  switch (type) {
    case TRANSACTION_TYPES.ADDITION:
    case TRANSACTION_TYPES.TRANSFER_IN:
      return 'text-green-600'
    case TRANSACTION_TYPES.REDUCTION:
    case TRANSACTION_TYPES.TRANSFER_OUT:
      return 'text-red-600'
    case TRANSACTION_TYPES.ADJUSTMENT:
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}
