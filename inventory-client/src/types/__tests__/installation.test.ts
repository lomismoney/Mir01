/**
 * installation.ts 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - INSTALLATION_STATUS_LABELS 狀態標籤對照表
 * - INSTALLATION_STATUS_VARIANTS 狀態變體對照表
 * - INSTALLATION_ITEM_STATUS_LABELS 項目狀態標籤對照表
 * - 類型定義的結構驗證
 * - 常數的完整性檢查
 */

import {
  InstallationStatus,
  InstallationItemStatus,
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_STATUS_VARIANTS,
  INSTALLATION_ITEM_STATUS_LABELS,
  Installation,
  InstallationItem,
  CreateInstallationRequest,
  UpdateInstallationRequest,
  InstallationFilters,
} from '../installation';

describe('installation.ts', () => {
  describe('InstallationStatus 類型', () => {
    /**
     * 測試所有狀態值
     */
    it('應該包含所有預期的安裝狀態', () => {
      const expectedStatuses: InstallationStatus[] = [
        'pending',
        'scheduled', 
        'in_progress',
        'completed',
        'cancelled'
      ];

      // 確保類型定義包含所有預期狀態
      expectedStatuses.forEach(status => {
        const testStatus: InstallationStatus = status;
        expect(typeof testStatus).toBe('string');
      });
    });
  });

  describe('InstallationItemStatus 類型', () => {
    /**
     * 測試所有項目狀態值
     */
    it('應該包含所有預期的項目狀態', () => {
      const expectedStatuses: InstallationItemStatus[] = [
        'pending',
        'completed',
        'skipped'
      ];

      expectedStatuses.forEach(status => {
        const testStatus: InstallationItemStatus = status;
        expect(typeof testStatus).toBe('string');
      });
    });
  });

  describe('INSTALLATION_STATUS_LABELS 對照表', () => {
    /**
     * 測試標籤對照表完整性
     */
    it('應該為所有安裝狀態提供中文標籤', () => {
      const expectedLabels = {
        pending: '待排程',
        scheduled: '已排程',
        in_progress: '進行中',
        completed: '已完成',
        cancelled: '已取消',
      };

      expect(INSTALLATION_STATUS_LABELS).toEqual(expectedLabels);
    });

    /**
     * 測試所有標籤都是非空字串
     */
    it('所有標籤都應該是非空字串', () => {
      Object.values(INSTALLATION_STATUS_LABELS).forEach(label => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    /**
     * 測試標籤的語義正確性
     */
    it('標籤應該符合語義', () => {
      expect(INSTALLATION_STATUS_LABELS.pending).toContain('待');
      expect(INSTALLATION_STATUS_LABELS.scheduled).toContain('已');
      expect(INSTALLATION_STATUS_LABELS.in_progress).toContain('進行');
      expect(INSTALLATION_STATUS_LABELS.completed).toContain('完成');
      expect(INSTALLATION_STATUS_LABELS.cancelled).toContain('取消');
    });
  });

  describe('INSTALLATION_STATUS_VARIANTS 對照表', () => {
    /**
     * 測試變體對照表完整性
     */
    it('應該為所有狀態提供變體配置', () => {
      const expectedVariants = {
        pending: 'outline',
        scheduled: 'secondary',
        in_progress: 'default',
        completed: 'default',
        cancelled: 'destructive',
      };

      expect(INSTALLATION_STATUS_VARIANTS).toEqual(expectedVariants);
    });

    /**
     * 測試變體值的有效性
     */
    it('所有變體值都應該是有效的', () => {
      const validVariants = ['default', 'secondary', 'destructive', 'outline'];
      
      Object.values(INSTALLATION_STATUS_VARIANTS).forEach(variant => {
        expect(validVariants).toContain(variant);
      });
    });

    /**
     * 測試變體的語義正確性
     */
    it('變體應該符合狀態語義', () => {
      // 待排程應該是 outline（輪廓）
      expect(INSTALLATION_STATUS_VARIANTS.pending).toBe('outline');
      // 已取消應該是 destructive（破壞性/危險）
      expect(INSTALLATION_STATUS_VARIANTS.cancelled).toBe('destructive');
      // 進行中和已完成應該是 default（預設）
      expect(INSTALLATION_STATUS_VARIANTS.in_progress).toBe('default');
      expect(INSTALLATION_STATUS_VARIANTS.completed).toBe('default');
      // 已排程應該是 secondary（次要）
      expect(INSTALLATION_STATUS_VARIANTS.scheduled).toBe('secondary');
    });
  });

  describe('INSTALLATION_ITEM_STATUS_LABELS 對照表', () => {
    /**
     * 測試項目狀態標籤完整性
     */
    it('應該為所有項目狀態提供中文標籤', () => {
      const expectedLabels = {
        pending: '待安裝',
        completed: '已完成',
        skipped: '跳過',
      };

      expect(INSTALLATION_ITEM_STATUS_LABELS).toEqual(expectedLabels);
    });

    /**
     * 測試所有項目標籤都是非空字串
     */
    it('所有項目標籤都應該是非空字串', () => {
      Object.values(INSTALLATION_ITEM_STATUS_LABELS).forEach(label => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('類型定義測試', () => {
    /**
     * 測試 Installation 介面結構
     */
    it('Installation 介面應該有正確的結構', () => {
      const mockInstallation: Installation = {
        id: 1,
        installation_number: 'INST-001',
        order_id: 1,
        customer_name: '測試客戶',
        customer_phone: '0912345678',
        installation_address: '台北市信義區測試路123號',
        installer_user_id: 2,
        status: 'pending',
        scheduled_date: '2024-01-15',
        actual_start_time: null,
        actual_end_time: null,
        notes: '測試安裝單',
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockInstallation.id).toBe(1);
      expect(mockInstallation.installation_number).toBe('INST-001');
      expect(mockInstallation.customer_name).toBe('測試客戶');
      expect(mockInstallation.status).toBe('pending');
    });

    /**
     * 測試 InstallationItem 介面結構
     */
    it('InstallationItem 介面應該有正確的結構', () => {
      const mockItem: InstallationItem = {
        id: 1,
        product_variant_id: 1,
        product_name: '測試產品',
        sku: 'TEST-001',
        quantity: 2,
        specifications: '規格說明',
        notes: '項目備註',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(mockItem.id).toBe(1);
      expect(mockItem.product_name).toBe('測試產品');
      expect(mockItem.quantity).toBe(2);
      expect(mockItem.status).toBe('pending');
    });

    /**
     * 測試 CreateInstallationRequest 介面結構
     */
    it('CreateInstallationRequest 介面應該有正確的結構', () => {
      const mockRequest: CreateInstallationRequest = {
        customer_name: '新客戶',
        customer_phone: '0987654321',
        installation_address: '新地址',
        installer_user_id: 3,
        scheduled_date: '2024-02-01',
        notes: '新安裝單',
        items: [
          {
            product_variant_id: 1,
            product_name: '新產品',
            sku: 'NEW-001',
            quantity: 1,
            specifications: '新規格',
            notes: '新項目',
          }
        ],
      };

      expect(mockRequest.customer_name).toBe('新客戶');
      expect(mockRequest.items).toHaveLength(1);
      expect(mockRequest.items[0].product_name).toBe('新產品');
    });

    /**
     * 測試 UpdateInstallationRequest 介面結構
     */
    it('UpdateInstallationRequest 介面應該有正確的結構', () => {
      const mockRequest: UpdateInstallationRequest = {
        customer_name: '更新客戶',
        installation_address: '更新地址',
        items: [
          {
            id: 1,
            product_name: '更新產品',
            sku: 'UPDATE-001',
            quantity: 3,
            status: 'completed',
          }
        ],
      };

      expect(mockRequest.customer_name).toBe('更新客戶');
      expect(mockRequest.items?.[0]?.status).toBe('completed');
    });

    /**
     * 測試 InstallationFilters 介面結構
     */
    it('InstallationFilters 介面應該有正確的結構', () => {
      const mockFilters: InstallationFilters = {
        search: '搜尋關鍵字',
        status: 'in_progress',
        installer_user_id: 2,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        page: 1,
        per_page: 20,
      };

      expect(mockFilters.search).toBe('搜尋關鍵字');
      expect(mockFilters.status).toBe('in_progress');
      expect(mockFilters.page).toBe(1);
    });
  });

  describe('可選欄位測試', () => {
    /**
     * 測試 Installation 的可選欄位
     */
    it('Installation 應該支援可選欄位', () => {
      const minimalInstallation: Installation = {
        id: 1,
        installation_number: 'INST-002',
        customer_name: '最小客戶',
        installation_address: '最小地址',
        status: 'pending',
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // 可選欄位設為 null 或 undefined
        order_id: null,
        customer_phone: null,
        installer_user_id: null,
        scheduled_date: null,
        actual_start_time: null,
        actual_end_time: null,
        notes: null,
      };

      expect(minimalInstallation.id).toBe(1);
      expect(minimalInstallation.order_id).toBeNull();
    });

    /**
     * 測試 CreateInstallationRequest 的可選欄位
     */
    it('CreateInstallationRequest 應該支援可選欄位', () => {
      const minimalRequest: CreateInstallationRequest = {
        customer_name: '最小新客戶',
        installation_address: '最小新地址',
        items: [],
        // 可選欄位不提供
      };

      expect(minimalRequest.customer_name).toBe('最小新客戶');
      expect(minimalRequest.items).toEqual([]);
      expect(minimalRequest.customer_phone).toBeUndefined();
    });
  });

  describe('常數一致性測試', () => {
    /**
     * 測試標籤對照表的鍵與狀態類型一致
     */
    it('INSTALLATION_STATUS_LABELS 的鍵應該與 InstallationStatus 類型一致', () => {
      const labelKeys = Object.keys(INSTALLATION_STATUS_LABELS);
      const expectedKeys = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
      
      expect(labelKeys.sort()).toEqual(expectedKeys.sort());
    });

    /**
     * 測試變體對照表的鍵與狀態類型一致
     */
    it('INSTALLATION_STATUS_VARIANTS 的鍵應該與 InstallationStatus 類型一致', () => {
      const variantKeys = Object.keys(INSTALLATION_STATUS_VARIANTS);
      const labelKeys = Object.keys(INSTALLATION_STATUS_LABELS);
      
      expect(variantKeys.sort()).toEqual(labelKeys.sort());
    });

    /**
     * 測試項目狀態標籤的鍵與項目狀態類型一致
     */
    it('INSTALLATION_ITEM_STATUS_LABELS 的鍵應該與 InstallationItemStatus 類型一致', () => {
      const labelKeys = Object.keys(INSTALLATION_ITEM_STATUS_LABELS);
      const expectedKeys = ['pending', 'completed', 'skipped'];
      
      expect(labelKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('邊界條件測試', () => {
    /**
     * 測試空字串和特殊字符處理
     */
    it('應該正確處理包含特殊字符的字串', () => {
      const specialCharInstallation: Installation = {
        id: 1,
        installation_number: 'INST-特殊-001',
        customer_name: '客戶 & 特殊字符 < > " \'',
        installation_address: '地址包含 HTML <script> 標籤',
        status: 'pending',
        notes: 'SQL\'; DROP TABLE installations; --',
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(specialCharInstallation.customer_name).toContain('&');
      expect(specialCharInstallation.installation_address).toContain('<script>');
      expect(specialCharInstallation.notes).toContain('DROP TABLE');
    });

    /**
     * 測試數字邊界值
     */
    it('應該處理數字邊界值', () => {
      const boundaryInstallation: Installation = {
        id: Number.MAX_SAFE_INTEGER,
        installation_number: 'INST-MAX',
        customer_name: '邊界客戶',
        installation_address: '邊界地址',
        status: 'pending',
        created_by: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(boundaryInstallation.id).toBe(Number.MAX_SAFE_INTEGER);
      expect(boundaryInstallation.created_by).toBe(0);
    });
  });

  describe('類型安全性測試', () => {
    /**
     * 測試狀態類型的類型安全
     */
    it('狀態類型應該是類型安全的', () => {
      // 有效的狀態值
      const validStatuses: InstallationStatus[] = [
        'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
      ];

      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(INSTALLATION_STATUS_LABELS[status]).toBeDefined();
        expect(INSTALLATION_STATUS_VARIANTS[status]).toBeDefined();
      });
    });

    /**
     * 測試項目狀態類型的類型安全
     */
    it('項目狀態類型應該是類型安全的', () => {
      const validItemStatuses: InstallationItemStatus[] = [
        'pending', 'completed', 'skipped'
      ];

      validItemStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(INSTALLATION_ITEM_STATUS_LABELS[status]).toBeDefined();
      });
    });
  });
});