import type { components } from '@/lib/api'

// Purchase 相關類型別名
export type Purchase = components['schemas']['Purchase']
export type PurchaseItem = components['schemas']['PurchaseItem']
export type CreatePurchaseRequest = components['schemas']['PurchaseData']
export type UpdatePurchaseRequest = Partial<CreatePurchaseRequest>

// 進貨單狀態定義
export const PURCHASE_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  IN_TRANSIT: 'in_transit',
  RECEIVED: 'received',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PARTIALLY_RECEIVED: 'partially_received',
} as const

export type PurchaseStatus = typeof PURCHASE_STATUS[keyof typeof PURCHASE_STATUS]

// 狀態中文描述對照表
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  pending: '已下單',
  confirmed: '已確認',
  in_transit: '運輸中',
  received: '已收貨',
  completed: '已完成',
  cancelled: '已取消',
  partially_received: '部分收貨',
}

// 狀態顏色對照表
export const PURCHASE_STATUS_COLORS: Record<PurchaseStatus, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
  confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
  in_transit: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
  received: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
  partially_received: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700',
}

// 進貨單操作權限檢查
export const getPurchasePermissions = (status: PurchaseStatus) => {
  return {
    canModify: ['pending', 'confirmed', 'received', 'partially_received'].includes(status),
    canCancel: ['pending', 'confirmed', 'in_transit'].includes(status),
    canReceiveStock: ['received', 'partially_received'].includes(status),
    canDelete: status === 'pending',
  }
}

// 狀態轉換規則
export const getValidStatusTransitions = (currentStatus: PurchaseStatus): PurchaseStatus[] => {
  const transitions: Record<PurchaseStatus, PurchaseStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_transit', 'cancelled'],
    in_transit: ['received', 'partially_received'],
    received: ['completed', 'partially_received'], // ✅ received 可以轉到 partially_received（支援調整收貨數量）
    partially_received: ['completed', 'received', 'partially_received'], // 🎯 支援再次進行部分收貨調整
    completed: [],
    cancelled: [],
  }
  
  return transitions[currentStatus] || []
} 