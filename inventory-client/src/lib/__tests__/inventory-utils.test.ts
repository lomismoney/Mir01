/**
 * inventory-utils 測試
 * 
 * 測試庫存工具函數
 */
import { 
  TRANSACTION_TYPES,
  getTransactionIcon,
  getTransactionTypeName,
  getTransactionTypeVariant,
  getTransactionIconColor
} from '../inventory-utils'
import { TrendingUp, TrendingDown, Settings, Package } from 'lucide-react'

describe('inventory-utils', () => {
  describe('TRANSACTION_TYPES 常數', () => {
    it('應該包含所有交易類型', () => {
      expect(TRANSACTION_TYPES.ADDITION).toBe('addition')
      expect(TRANSACTION_TYPES.REDUCTION).toBe('reduction')
      expect(TRANSACTION_TYPES.ADJUSTMENT).toBe('adjustment')
      expect(TRANSACTION_TYPES.TRANSFER_OUT).toBe('transfer_out')
      expect(TRANSACTION_TYPES.TRANSFER_IN).toBe('transfer_in')
      expect(TRANSACTION_TYPES.TRANSFER_CANCEL).toBe('transfer_cancel')
    })
  })

  describe('getTransactionIcon', () => {
    it('應該返回正確的入庫圖示', () => {
      expect(getTransactionIcon(TRANSACTION_TYPES.ADDITION)).toBe(TrendingUp)
      expect(getTransactionIcon(TRANSACTION_TYPES.TRANSFER_IN)).toBe(TrendingUp)
    })

    it('應該返回正確的出庫圖示', () => {
      expect(getTransactionIcon(TRANSACTION_TYPES.REDUCTION)).toBe(TrendingDown)
      expect(getTransactionIcon(TRANSACTION_TYPES.TRANSFER_OUT)).toBe(TrendingDown)
    })

    it('應該返回調整圖示', () => {
      expect(getTransactionIcon(TRANSACTION_TYPES.ADJUSTMENT)).toBe(Settings)
    })

    it('應該返回預設圖示', () => {
      expect(getTransactionIcon()).toBe(Package)
      expect(getTransactionIcon('unknown')).toBe(Package)
      expect(getTransactionIcon(TRANSACTION_TYPES.TRANSFER_CANCEL)).toBe(Package)
    })
  })

  describe('getTransactionTypeName', () => {
    it('應該返回正確的中文名稱', () => {
      expect(getTransactionTypeName(TRANSACTION_TYPES.ADDITION)).toBe('入庫')
      expect(getTransactionTypeName(TRANSACTION_TYPES.REDUCTION)).toBe('出庫')
      expect(getTransactionTypeName(TRANSACTION_TYPES.ADJUSTMENT)).toBe('調整')
      expect(getTransactionTypeName(TRANSACTION_TYPES.TRANSFER_OUT)).toBe('轉出')
      expect(getTransactionTypeName(TRANSACTION_TYPES.TRANSFER_IN)).toBe('轉入')
      expect(getTransactionTypeName(TRANSACTION_TYPES.TRANSFER_CANCEL)).toBe('取消轉移')
    })

    it('應該處理未知類型', () => {
      expect(getTransactionTypeName()).toBe('未知')
      expect(getTransactionTypeName('custom')).toBe('custom')
      expect(getTransactionTypeName('')).toBe('未知')
    })
  })

  describe('getTransactionTypeVariant', () => {
    it('應該返回 default 變體', () => {
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.ADDITION)).toBe('default')
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.TRANSFER_IN)).toBe('default')
    })

    it('應該返回 destructive 變體', () => {
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.REDUCTION)).toBe('destructive')
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.TRANSFER_OUT)).toBe('destructive')
    })

    it('應該返回 secondary 變體', () => {
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.ADJUSTMENT)).toBe('secondary')
    })

    it('應該返回 outline 變體', () => {
      expect(getTransactionTypeVariant()).toBe('outline')
      expect(getTransactionTypeVariant('unknown')).toBe('outline')
      expect(getTransactionTypeVariant(TRANSACTION_TYPES.TRANSFER_CANCEL)).toBe('outline')
    })
  })

  describe('getTransactionIconColor', () => {
    it('應該返回綠色樣式', () => {
      expect(getTransactionIconColor(TRANSACTION_TYPES.ADDITION)).toBe('text-green-600')
      expect(getTransactionIconColor(TRANSACTION_TYPES.TRANSFER_IN)).toBe('text-green-600')
    })

    it('應該返回紅色樣式', () => {
      expect(getTransactionIconColor(TRANSACTION_TYPES.REDUCTION)).toBe('text-red-600')
      expect(getTransactionIconColor(TRANSACTION_TYPES.TRANSFER_OUT)).toBe('text-red-600')
    })

    it('應該返回藍色樣式', () => {
      expect(getTransactionIconColor(TRANSACTION_TYPES.ADJUSTMENT)).toBe('text-blue-600')
    })

    it('應該返回灰色樣式', () => {
      expect(getTransactionIconColor()).toBe('text-gray-600')
      expect(getTransactionIconColor('unknown')).toBe('text-gray-600')
      expect(getTransactionIconColor(TRANSACTION_TYPES.TRANSFER_CANCEL)).toBe('text-gray-600')
    })
  })
}) 