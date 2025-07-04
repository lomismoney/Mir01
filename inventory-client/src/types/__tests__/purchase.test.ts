/**
 * purchase.ts 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - PURCHASE_STATUS 常數定義
 * - PURCHASE_STATUS_LABELS 狀態標籤對照表
 * - PURCHASE_STATUS_COLORS 狀態顏色對照表
 * - getPurchasePermissions 權限檢查函數
 * - getValidStatusTransitions 狀態轉換函數
 * - 業務邏輯的正確性驗證
 */

import {
  PURCHASE_STATUS,
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  getValidStatusTransitions,
  PurchaseStatus,
} from '../purchase';

describe('purchase.ts', () => {
  describe('PURCHASE_STATUS 常數', () => {
    /**
     * 測試所有狀態常數定義
     */
    it('應該定義所有進貨單狀態', () => {
      expect(PURCHASE_STATUS.PENDING).toBe('pending');
      expect(PURCHASE_STATUS.CONFIRMED).toBe('confirmed');
      expect(PURCHASE_STATUS.IN_TRANSIT).toBe('in_transit');
      expect(PURCHASE_STATUS.RECEIVED).toBe('received');
      expect(PURCHASE_STATUS.COMPLETED).toBe('completed');
      expect(PURCHASE_STATUS.CANCELLED).toBe('cancelled');
      expect(PURCHASE_STATUS.PARTIALLY_RECEIVED).toBe('partially_received');
    });

    /**
     * 測試狀態數量
     */
    it('應該包含所有預期的狀態', () => {
      const statusKeys = Object.keys(PURCHASE_STATUS);
      expect(statusKeys).toHaveLength(7);
      expect(statusKeys).toEqual([
        'PENDING',
        'CONFIRMED',
        'IN_TRANSIT',
        'RECEIVED',
        'COMPLETED',
        'CANCELLED',
        'PARTIALLY_RECEIVED'
      ]);
    });

    /**
     * 測試狀態值的唯一性
     */
    it('所有狀態值應該是唯一的', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      const uniqueValues = Array.from(new Set(statusValues));
      expect(statusValues).toHaveLength(uniqueValues.length);
    });
  });

  describe('PURCHASE_STATUS_LABELS 對照表', () => {
    /**
     * 測試標籤對照表完整性
     */
    it('應該為所有狀態提供中文標籤', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      statusValues.forEach(status => {
        expect(PURCHASE_STATUS_LABELS[status]).toBeDefined();
        expect(typeof PURCHASE_STATUS_LABELS[status]).toBe('string');
        expect(PURCHASE_STATUS_LABELS[status].length).toBeGreaterThan(0);
      });
    });

    /**
     * 測試具體標籤內容
     */
    it('應該有正確的中文標籤', () => {
      expect(PURCHASE_STATUS_LABELS.pending).toBe('已下單');
      expect(PURCHASE_STATUS_LABELS.confirmed).toBe('已確認');
      expect(PURCHASE_STATUS_LABELS.in_transit).toBe('運輸中');
      expect(PURCHASE_STATUS_LABELS.received).toBe('已收貨');
      expect(PURCHASE_STATUS_LABELS.completed).toBe('已完成');
      expect(PURCHASE_STATUS_LABELS.cancelled).toBe('已取消');
      expect(PURCHASE_STATUS_LABELS.partially_received).toBe('部分收貨');
    });

    /**
     * 測試標籤數量
     */
    it('標籤數量應該與狀態數量一致', () => {
      const statusCount = Object.keys(PURCHASE_STATUS).length;
      const labelCount = Object.keys(PURCHASE_STATUS_LABELS).length;
      expect(labelCount).toBe(statusCount);
    });
  });

  describe('PURCHASE_STATUS_COLORS 對照表', () => {
    /**
     * 測試顏色對照表完整性
     */
    it('應該為所有狀態提供CSS顏色類', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      statusValues.forEach(status => {
        expect(PURCHASE_STATUS_COLORS[status]).toBeDefined();
        expect(typeof PURCHASE_STATUS_COLORS[status]).toBe('string');
        expect(PURCHASE_STATUS_COLORS[status].length).toBeGreaterThan(0);
      });
    });

    /**
     * 測試顏色類格式
     */
    it('所有顏色類應該包含背景色和文字色', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      statusValues.forEach(status => {
        const colorClass = PURCHASE_STATUS_COLORS[status];
        expect(colorClass).toMatch(/bg-\w+-\d+/); // 背景色格式
        expect(colorClass).toMatch(/text-\w+-\d+/); // 文字色格式
      });
    });

    /**
     * 測試具體顏色配置
     */
    it('應該有正確的顏色配置', () => {
      expect(PURCHASE_STATUS_COLORS.pending).toBe('bg-yellow-100 text-yellow-800');
      expect(PURCHASE_STATUS_COLORS.confirmed).toBe('bg-blue-100 text-blue-800');
      expect(PURCHASE_STATUS_COLORS.in_transit).toBe('bg-purple-100 text-purple-800');
      expect(PURCHASE_STATUS_COLORS.received).toBe('bg-orange-100 text-orange-800');
      expect(PURCHASE_STATUS_COLORS.completed).toBe('bg-green-100 text-green-800');
      expect(PURCHASE_STATUS_COLORS.cancelled).toBe('bg-red-100 text-red-800');
      expect(PURCHASE_STATUS_COLORS.partially_received).toBe('bg-indigo-100 text-indigo-800');
    });

    /**
     * 測試顏色的語義正確性
     */
    it('顏色應該符合語義', () => {
      // 完成狀態應該是綠色
      expect(PURCHASE_STATUS_COLORS.completed).toContain('green');
      // 取消狀態應該是紅色
      expect(PURCHASE_STATUS_COLORS.cancelled).toContain('red');
      // 等待狀態應該是黃色
      expect(PURCHASE_STATUS_COLORS.pending).toContain('yellow');
    });
  });

  describe('getPurchasePermissions 權限檢查函數', () => {
    /**
     * 測試 pending 狀態權限
     */
    it('pending 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('pending');
      expect(permissions.canModify).toBe(true);
      expect(permissions.canCancel).toBe(true);
      expect(permissions.canReceiveStock).toBe(false);
      expect(permissions.canDelete).toBe(true);
    });

    /**
     * 測試 confirmed 狀態權限
     */
    it('confirmed 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('confirmed');
      expect(permissions.canModify).toBe(true);
      expect(permissions.canCancel).toBe(true);
      expect(permissions.canReceiveStock).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試 in_transit 狀態權限
     */
    it('in_transit 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('in_transit');
      expect(permissions.canModify).toBe(false);
      expect(permissions.canCancel).toBe(true);
      expect(permissions.canReceiveStock).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試 received 狀態權限
     */
    it('received 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('received');
      expect(permissions.canModify).toBe(true);
      expect(permissions.canCancel).toBe(false);
      expect(permissions.canReceiveStock).toBe(true);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試 partially_received 狀態權限
     */
    it('partially_received 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('partially_received');
      expect(permissions.canModify).toBe(true);
      expect(permissions.canCancel).toBe(false);
      expect(permissions.canReceiveStock).toBe(true);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試 completed 狀態權限
     */
    it('completed 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('completed');
      expect(permissions.canModify).toBe(false);
      expect(permissions.canCancel).toBe(false);
      expect(permissions.canReceiveStock).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試 cancelled 狀態權限
     */
    it('cancelled 狀態應該有正確的權限', () => {
      const permissions = getPurchasePermissions('cancelled');
      expect(permissions.canModify).toBe(false);
      expect(permissions.canCancel).toBe(false);
      expect(permissions.canReceiveStock).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });

    /**
     * 測試所有狀態的權限
     */
    it('應該為所有狀態返回完整的權限物件', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      statusValues.forEach(status => {
        const permissions = getPurchasePermissions(status);
        expect(permissions).toHaveProperty('canModify');
        expect(permissions).toHaveProperty('canCancel');
        expect(permissions).toHaveProperty('canReceiveStock');
        expect(permissions).toHaveProperty('canDelete');
        expect(typeof permissions.canModify).toBe('boolean');
        expect(typeof permissions.canCancel).toBe('boolean');
        expect(typeof permissions.canReceiveStock).toBe('boolean');
        expect(typeof permissions.canDelete).toBe('boolean');
      });
    });

    /**
     * 測試權限的業務邏輯合理性
     */
    it('權限設定應該符合業務邏輯', () => {
      // 只有 pending 狀態可以刪除
      const statusValues = Object.values(PURCHASE_STATUS);
      statusValues.forEach(status => {
        const permissions = getPurchasePermissions(status);
        if (status === 'pending') {
          expect(permissions.canDelete).toBe(true);
        } else {
          expect(permissions.canDelete).toBe(false);
        }
      });

      // 只有 received 和 partially_received 可以收貨
      statusValues.forEach(status => {
        const permissions = getPurchasePermissions(status);
        if (['received', 'partially_received'].includes(status)) {
          expect(permissions.canReceiveStock).toBe(true);
        } else {
          expect(permissions.canReceiveStock).toBe(false);
        }
      });
    });
  });

  describe('getValidStatusTransitions 狀態轉換函數', () => {
    /**
     * 測試 pending 狀態的轉換
     */
    it('pending 狀態應該可以轉換到 confirmed 或 cancelled', () => {
      const transitions = getValidStatusTransitions('pending');
      expect(transitions).toEqual(['confirmed', 'cancelled']);
    });

    /**
     * 測試 confirmed 狀態的轉換
     */
    it('confirmed 狀態應該可以轉換到 in_transit 或 cancelled', () => {
      const transitions = getValidStatusTransitions('confirmed');
      expect(transitions).toEqual(['in_transit', 'cancelled']);
    });

    /**
     * 測試 in_transit 狀態的轉換
     */
    it('in_transit 狀態應該可以轉換到 received 或 partially_received', () => {
      const transitions = getValidStatusTransitions('in_transit');
      expect(transitions).toEqual(['received', 'partially_received']);
    });

    /**
     * 測試 received 狀態的轉換
     */
    it('received 狀態應該可以轉換到 completed 或 partially_received', () => {
      const transitions = getValidStatusTransitions('received');
      expect(transitions).toEqual(['completed', 'partially_received']);
    });

    /**
     * 測試 partially_received 狀態的轉換
     */
    it('partially_received 狀態應該可以轉換到 completed 或 received', () => {
      const transitions = getValidStatusTransitions('partially_received');
      expect(transitions).toEqual(['completed', 'received']);
    });

    /**
     * 測試終結狀態的轉換
     */
    it('completed 和 cancelled 狀態不應該有任何轉換', () => {
      expect(getValidStatusTransitions('completed')).toEqual([]);
      expect(getValidStatusTransitions('cancelled')).toEqual([]);
    });

    /**
     * 測試無效狀態的處理
     */
    it('無效狀態應該返回空陣列', () => {
      expect(getValidStatusTransitions('invalid_status' as PurchaseStatus)).toEqual([]);
      expect(getValidStatusTransitions('' as PurchaseStatus)).toEqual([]);
      expect(getValidStatusTransitions(null as any)).toEqual([]);
      expect(getValidStatusTransitions(undefined as any)).toEqual([]);
    });

    /**
     * 測試狀態轉換的業務邏輯合理性
     */
    it('狀態轉換應該符合業務流程', () => {
      // 測試正常流程：pending -> confirmed -> in_transit -> received -> completed
      let currentStatus: PurchaseStatus = 'pending';
      let transitions = getValidStatusTransitions(currentStatus);
      expect(transitions).toContain('confirmed');

      currentStatus = 'confirmed';
      transitions = getValidStatusTransitions(currentStatus);
      expect(transitions).toContain('in_transit');

      currentStatus = 'in_transit';
      transitions = getValidStatusTransitions(currentStatus);
      expect(transitions).toContain('received');

      currentStatus = 'received';
      transitions = getValidStatusTransitions(currentStatus);
      expect(transitions).toContain('completed');

      currentStatus = 'completed';
      transitions = getValidStatusTransitions(currentStatus);
      expect(transitions).toHaveLength(0);
    });

    /**
     * 測試取消流程
     */
    it('取消操作應該在適當的階段可用', () => {
      // pending 和 confirmed 可以取消
      expect(getValidStatusTransitions('pending')).toContain('cancelled');
      expect(getValidStatusTransitions('confirmed')).toContain('cancelled');
      
      // 其他狀態不能取消
      expect(getValidStatusTransitions('in_transit')).not.toContain('cancelled');
      expect(getValidStatusTransitions('received')).not.toContain('cancelled');
      expect(getValidStatusTransitions('partially_received')).not.toContain('cancelled');
      expect(getValidStatusTransitions('completed')).not.toContain('cancelled');
    });

    /**
     * 測試部分收貨邏輯
     */
    it('應該支援部分收貨和完全收貨之間的轉換', () => {
      // received 可以變回 partially_received（修正錯誤）
      expect(getValidStatusTransitions('received')).toContain('partially_received');
      
      // partially_received 可以變成 received（完成收貨）
      expect(getValidStatusTransitions('partially_received')).toContain('received');
      
      // 兩者都可以變成 completed
      expect(getValidStatusTransitions('received')).toContain('completed');
      expect(getValidStatusTransitions('partially_received')).toContain('completed');
    });
  });

  describe('類型安全性測試', () => {
    /**
     * 測試 PurchaseStatus 類型
     */
    it('PurchaseStatus 類型應該包含所有狀態值', () => {
      const statusValues: PurchaseStatus[] = Object.values(PURCHASE_STATUS);
      
      // 確保每個狀態值都是有效的 PurchaseStatus
      statusValues.forEach(status => {
        expect(typeof status).toBe('string');
        expect(Object.values(PURCHASE_STATUS)).toContain(status);
      });
    });

    /**
     * 測試函數參數類型檢查
     */
    it('函數應該接受所有有效的狀態值', () => {
      const statusValues = Object.values(PURCHASE_STATUS);
      
      statusValues.forEach(status => {
        // 這些調用不應該拋出類型錯誤
        expect(() => getPurchasePermissions(status)).not.toThrow();
        expect(() => getValidStatusTransitions(status)).not.toThrow();
        expect(() => PURCHASE_STATUS_LABELS[status]).not.toThrow();
        expect(() => PURCHASE_STATUS_COLORS[status]).not.toThrow();
      });
    });
  });

  describe('邊界條件測試', () => {
    /**
     * 測試空值處理
     */
    it('應該妥善處理空值和邊界情況', () => {
      // getPurchasePermissions 對於無效輸入的處理
      const invalidInputs = [null, undefined, '', 'invalid'];
      
      invalidInputs.forEach(input => {
        const permissions = getPurchasePermissions(input as any);
        expect(typeof permissions.canModify).toBe('boolean');
        expect(typeof permissions.canCancel).toBe('boolean');
        expect(typeof permissions.canReceiveStock).toBe('boolean');
        expect(typeof permissions.canDelete).toBe('boolean');
      });
    });

    /**
     * 測試大小寫敏感性
     */
    it('狀態值應該是大小寫敏感的', () => {
      const upperCaseStatus = 'PENDING' as PurchaseStatus;
      const validTransitions = getValidStatusTransitions(upperCaseStatus);
      expect(validTransitions).toEqual([]); // 應該返回空陣列，因為大小寫不匹配
    });
  });

  describe('整合測試', () => {
    /**
     * 測試完整的業務流程
     */
    it('應該支援完整的進貨單生命週期', () => {
      // 模擬完整的業務流程
      const lifecycle = [
        {
          status: 'pending' as PurchaseStatus,
          expectedPermissions: { canModify: true, canCancel: true, canReceiveStock: false, canDelete: true },
          expectedTransitions: ['confirmed', 'cancelled']
        },
        {
          status: 'confirmed' as PurchaseStatus,
          expectedPermissions: { canModify: true, canCancel: true, canReceiveStock: false, canDelete: false },
          expectedTransitions: ['in_transit', 'cancelled']
        },
        {
          status: 'in_transit' as PurchaseStatus,
          expectedPermissions: { canModify: false, canCancel: true, canReceiveStock: false, canDelete: false },
          expectedTransitions: ['received', 'partially_received']
        },
        {
          status: 'received' as PurchaseStatus,
          expectedPermissions: { canModify: true, canCancel: false, canReceiveStock: true, canDelete: false },
          expectedTransitions: ['completed', 'partially_received']
        },
        {
          status: 'completed' as PurchaseStatus,
          expectedPermissions: { canModify: false, canCancel: false, canReceiveStock: false, canDelete: false },
          expectedTransitions: []
        }
      ];

      lifecycle.forEach(({ status, expectedPermissions, expectedTransitions }) => {
        const permissions = getPurchasePermissions(status);
        const transitions = getValidStatusTransitions(status);
        
        expect(permissions).toEqual(expectedPermissions);
        expect(transitions).toEqual(expectedTransitions);
      });
    });
  });
});