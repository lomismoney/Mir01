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
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-purple-100 text-purple-800',
  received: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  partially_received: 'bg-indigo-100 text-indigo-800',
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
    received: ['completed', 'partially_received'],
    partially_received: ['completed', 'received'],
    completed: [],
    cancelled: [],
  }
  
  return transitions[currentStatus] || []
} 