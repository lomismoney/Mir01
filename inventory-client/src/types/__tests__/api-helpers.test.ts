/**
 * api-helpers 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - transformCategoriesGroupedResponse 函數的完整功能測試
 * - 各種邊界條件和錯誤處理
 * - 類型轉換的正確性驗證
 * - 資料結構的完整性檢查
 */

import { transformCategoriesGroupedResponse } from '../api-helpers';
import type { Category } from '@/types/category';

describe('api-helpers', () => {
  describe('transformCategoriesGroupedResponse', () => {
    /**
     * 測試正常的分組分類資料轉換
     */
    it('應該正確轉換有效的分組分類資料', () => {
      const input = {
        'electronics': [
          {
            id: 1,
            name: '電子產品',
            description: '各種電子設備',
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          },
          {
            id: 2,
            name: '手機',
            description: '智慧型手機',
            parent_id: 1,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            children: []
          }
        ],
        'clothing': [
          {
            id: 3,
            name: '服飾',
            description: '各種服裝',
            parent_id: null,
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            children: []
          }
        ]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result).toEqual({
        'electronics': [
          {
            id: 1,
            name: '電子產品',
            description: '各種電子設備',
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          },
          {
            id: 2,
            name: '手機',
            description: '智慧型手機',
            parent_id: 1,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            children: []
          }
        ],
        'clothing': [
          {
            id: 3,
            name: '服飾',
            description: '各種服裝',
            parent_id: null,
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            children: []
          }
        ]
      });
    });

    /**
     * 測試 undefined 輸入的處理
     */
    it('應該在輸入為 undefined 時返回空物件', () => {
      const result = transformCategoriesGroupedResponse(undefined);
      expect(result).toEqual({});
    });

    /**
     * 測試 null 輸入的處理
     */
    it('應該在輸入為 null 時返回空物件', () => {
      const result = transformCategoriesGroupedResponse(null as any);
      expect(result).toEqual({});
    });

    /**
     * 測試空物件輸入的處理
     */
    it('應該在輸入為空物件時返回空物件', () => {
      const result = transformCategoriesGroupedResponse({});
      expect(result).toEqual({});
    });

    /**
     * 測試處理缺少必要欄位的分類物件
     */
    it('應該為缺少欄位的分類物件填入預設值', () => {
      const input = {
        'incomplete': [
          {
            id: 1,
            // 缺少 name, description 等欄位
          },
          {
            id: 2,
            name: '完整分類',
            // 缺少 description 等欄位
          }
        ]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['incomplete']).toHaveLength(2);
      expect(result['incomplete'][0]).toEqual({
        id: 1,
        name: '',
        description: null,
        parent_id: null,
        created_at: '',
        updated_at: '',
        children: []
      });
      expect(result['incomplete'][1]).toEqual({
        id: 2,
        name: '完整分類',
        description: null,
        parent_id: null,
        created_at: '',
        updated_at: '',
        children: []
      });
    });

    /**
     * 測試處理無效的分類物件（非物件類型）
     */
    it('應該為無效的分類物件創建預設分類', () => {
      const input = {
        'invalid': [
          'invalid_string',
          123,
          null,
          true,
          undefined
        ]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['invalid']).toHaveLength(5);
      result['invalid'].forEach(category => {
        expect(category).toEqual({
          id: 0,
          name: 'Unknown Category',
          description: null,
          parent_id: null,
          created_at: '',
          updated_at: '',
          children: []
        });
      });
    });

    /**
     * 測試處理非陣列的分類群組
     */
    it('應該將非陣列的分類群組轉換為空陣列', () => {
      const input = {
        'not_array_string': 'not an array' as any,
        'not_array_object': { id: 1, name: 'test' } as any,
        'not_array_number': 123 as any,
        'valid_array': [{ id: 1, name: 'valid' }]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['not_array_string']).toEqual([]);
      expect(result['not_array_object']).toEqual([]);
      expect(result['not_array_number']).toEqual([]);
      expect(result['valid_array']).toHaveLength(1);
      expect(result['valid_array'][0].name).toBe('valid');
    });

    /**
     * 測試混合有效和無效資料的情況
     */
    it('應該正確處理混合有效和無效資料的情況', () => {
      const input = {
        'mixed_valid': [
          {
            id: 1,
            name: '有效分類',
            description: '正常分類',
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          },
          'invalid_string',
          {
            id: 2,
            name: '另一個有效分類'
            // 缺少其他欄位
          }
        ],
        'empty_array': [],
        'non_array': 'not array' as any
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['mixed_valid']).toHaveLength(3);
      
      // 第一個項目：完全有效
      expect(result['mixed_valid'][0]).toEqual({
        id: 1,
        name: '有效分類',
        description: '正常分類',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        children: []
      });

      // 第二個項目：無效資料，應該變為預設分類
      expect(result['mixed_valid'][1]).toEqual({
        id: 0,
        name: 'Unknown Category',
        description: null,
        parent_id: null,
        created_at: '',
        updated_at: '',
        children: []
      });

      // 第三個項目：部分有效，缺少欄位應該填入預設值
      expect(result['mixed_valid'][2]).toEqual({
        id: 2,
        name: '另一個有效分類',
        description: null,
        parent_id: null,
        created_at: '',
        updated_at: '',
        children: []
      });

      expect(result['empty_array']).toEqual([]);
      expect(result['non_array']).toEqual([]);
    });

    /**
     * 測試處理具有特殊字符的分類名稱
     */
    it('應該正確處理具有特殊字符的分類名稱', () => {
      const input = {
        'special_chars': [
          {
            id: 1,
            name: '測試分類 & 特殊字符 < > " \' / \\',
            description: '包含特殊字符的描述 @ # $ % ^ & * ( ) [ ] { }',
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          }
        ]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['special_chars'][0].name).toBe('測試分類 & 特殊字符 < > " \' / \\');
      expect(result['special_chars'][0].description).toBe('包含特殊字符的描述 @ # $ % ^ & * ( ) [ ] { }');
    });

    /**
     * 測試處理大量資料的效能
     */
    it('應該能夠處理大量分類資料', () => {
      const largeInput: Record<string, unknown[]> = {};
      
      // 創建 100 個分組，每個分組 100 個分類
      for (let i = 0; i < 100; i++) {
        const groupKey = `group_${i}`;
        largeInput[groupKey] = [];
        
        for (let j = 0; j < 100; j++) {
          largeInput[groupKey].push({
            id: i * 100 + j,
            name: `分類_${i}_${j}`,
            description: `描述_${i}_${j}`,
            parent_id: i === 0 ? null : (i - 1) * 100 + j,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          });
        }
      }

      const startTime = Date.now();
      const result = transformCategoriesGroupedResponse(largeInput);
      const endTime = Date.now();

      // 驗證結果正確性
      expect(Object.keys(result)).toHaveLength(100);
      expect(result['group_0']).toHaveLength(100);
      expect(result['group_99']).toHaveLength(100);
      expect(result['group_0'][0].name).toBe('分類_0_0');
      expect(result['group_99'][99].name).toBe('分類_99_99');

      // 簡單的效能檢查（處理時間應該在合理範圍內）
      expect(endTime - startTime).toBeLessThan(1000); // 應該在 1 秒內完成
    });

    /**
     * 測試返回值的類型正確性
     */
    it('返回的每個分類都應該符合 Category 類型', () => {
      const input = {
        'test_group': [
          {
            id: 1,
            name: '測試分類',
            description: '測試描述',
            parent_id: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            children: []
          }
        ]
      };

      const result = transformCategoriesGroupedResponse(input);
      const category = result['test_group'][0];

      // 驗證所有必要的屬性都存在且類型正確
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(category.description === null || typeof category.description === 'string').toBe(true);
      expect(category.parent_id === null || typeof category.parent_id === 'number').toBe(true);
      expect(typeof category.created_at).toBe('string');
      expect(typeof category.updated_at).toBe('string');
      expect(Array.isArray(category.children)).toBe(true);
    });

    /**
     * 測試邊界值處理
     */
    it('應該正確處理邊界值', () => {
      const input = {
        'boundary_test': [
          {
            id: 0, // 最小 ID
            name: '', // 空字符串
            description: '', // 空字符串
            parent_id: 0, // 最小 parent_id
            created_at: '',
            updated_at: '',
            children: []
          },
          {
            id: Number.MAX_SAFE_INTEGER, // 最大安全整數
            name: 'A'.repeat(1000), // 長字符串
            description: 'B'.repeat(1000),
            parent_id: Number.MAX_SAFE_INTEGER,
            created_at: '9999-12-31T23:59:59Z',
            updated_at: '9999-12-31T23:59:59Z',
            children: new Array(100).fill({}) // 大量子項目
          }
        ]
      };

      const result = transformCategoriesGroupedResponse(input);

      expect(result['boundary_test']).toHaveLength(2);
      expect(result['boundary_test'][0].id).toBe(0);
      expect(result['boundary_test'][0].name).toBe('');
      expect(result['boundary_test'][1].id).toBe(Number.MAX_SAFE_INTEGER);
      expect(result['boundary_test'][1].name).toBe('A'.repeat(1000));
    });
  });
});