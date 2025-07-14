/**
 * products.ts 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - isValidProduct 類型守衛函數
 * - isValidAttribute 類型守衛函數
 * - 各種邊界條件和錯誤處理場景
 * - 類型安全性驗證
 */

import {
  isValidProduct,
  isValidAttribute,
  ProductFormData,
  ProductSubmissionData,
} from '../products';

describe('products.ts', () => {
  describe('isValidProduct', () => {
    /**
     * 測試有效的商品資料識別
     */
    it('應該正確識別有效的商品資料', () => {
      const validProduct = {
        id: 1,
        name: '測試商品',
        description: '這是一個測試商品',
        category_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(isValidProduct(validProduct)).toBe(true);
    });

    /**
     * 測試最小有效商品資料
     */
    it('應該接受只有 id 和 name 的最小商品資料', () => {
      const minimalProduct = {
        id: 1,
        name: '最小商品'
      };

      expect(isValidProduct(minimalProduct)).toBe(true);
    });

    /**
     * 測試包含額外屬性的商品資料
     */
    it('應該接受包含額外屬性的商品資料', () => {
      const extendedProduct = {
        id: 1,
        name: '擴展商品',
        description: '詳細描述',
        category_id: 2,
        variants: [],
        attributes: [],
        price_range: { min: 100, max: 200 },
        extraField: 'extra value'
      };

      expect(isValidProduct(extendedProduct)).toBe(true);
    });

    /**
     * 測試缺少 id 欄位的情況
     */
    it('應該拒絕缺少 id 欄位的資料', () => {
      const noIdProduct = {
        name: '無 ID 商品',
        description: '缺少 ID'
      };

      expect(isValidProduct(noIdProduct)).toBe(false);
    });

    /**
     * 測試缺少 name 欄位的情況
     */
    it('應該拒絕缺少 name 欄位的資料', () => {
      const noNameProduct = {
        id: 1,
        description: '缺少名稱'
      };

      expect(isValidProduct(noNameProduct)).toBe(false);
    });

    /**
     * 測試 id 不是數字的情況
     */
    it('應該拒絕 id 不是數字的資料', () => {
      const invalidIdProducts = [
        { id: '1', name: '字串 ID' },
        { id: null, name: 'null ID' },
        { id: undefined, name: 'undefined ID' },
        { id: [], name: '陣列 ID' },
        { id: {}, name: '物件 ID' }
      ];

      invalidIdProducts.forEach(product => {
        expect(isValidProduct(product)).toBe(false);
      });
    });

    /**
     * 測試 name 不是字串的情況
     */
    it('應該拒絕 name 不是字串的資料', () => {
      const invalidNameProducts = [
        { id: 1, name: 123 },
        { id: 1, name: null },
        { id: 1, name: undefined },
        { id: 1, name: [] },
        { id: 1, name: {} },
        { id: 1, name: true }
      ];

      invalidNameProducts.forEach(product => {
        expect(isValidProduct(product)).toBe(false);
      });
    });

    /**
     * 測試 null 和 undefined 輸入
     */
    it('應該拒絕 null 和 undefined', () => {
      expect(isValidProduct(null)).toBe(false);
      expect(isValidProduct(undefined)).toBe(false);
    });

    /**
     * 測試基本類型輸入
     */
    it('應該拒絕基本類型', () => {
      expect(isValidProduct('string')).toBe(false);
      expect(isValidProduct(123)).toBe(false);
      expect(isValidProduct(true)).toBe(false);
      expect(isValidProduct([])).toBe(false);
    });

    /**
     * 測試邊界值
     */
    it('應該正確處理邊界值', () => {
      const boundaryProducts = [
        { id: 0, name: '' }, // 最小值
        { id: Number.MAX_SAFE_INTEGER, name: 'A'.repeat(1000) }, // 最大值
        { id: -1, name: '負數 ID' }, // 負數 ID
        { id: 1.5, name: '浮點數 ID' } // 浮點數 ID
      ];

      boundaryProducts.forEach(product => {
        expect(isValidProduct(product)).toBe(true);
      });
    });
  });

  describe('isValidAttribute', () => {
    /**
     * 測試有效的屬性資料識別
     */
    it('應該正確識別有效的屬性資料', () => {
      const validAttribute = {
        id: 1,
        name: '顏色',
        values: [
          { id: 1, value: '紅色', attribute_id: 1 },
          { id: 2, value: '藍色', attribute_id: 1 }
        ]
      };

      expect(isValidAttribute(validAttribute)).toBe(true);
    });

    /**
     * 測試空 values 陣列的屬性
     */
    it('應該接受空 values 陣列的屬性', () => {
      const emptyValuesAttribute = {
        id: 1,
        name: '新屬性',
        values: []
      };

      expect(isValidAttribute(emptyValuesAttribute)).toBe(true);
    });

    /**
     * 測試包含額外屬性的屬性資料
     */
    it('應該接受包含額外屬性的屬性資料', () => {
      const extendedAttribute = {
        id: 1,
        name: '尺寸',
        values: [
          { id: 1, value: 'S', attribute_id: 1 },
          { id: 2, value: 'M', attribute_id: 1 }
        ],
        type: 'select',
        description: '商品尺寸選項',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isValidAttribute(extendedAttribute)).toBe(true);
    });

    /**
     * 測試缺少 id 欄位的情況
     */
    it('應該拒絕缺少 id 欄位的資料', () => {
      const noIdAttribute = {
        name: '材質',
        values: []
      };

      expect(isValidAttribute(noIdAttribute)).toBe(false);
    });

    /**
     * 測試缺少 name 欄位的情況
     */
    it('應該拒絕缺少 name 欄位的資料', () => {
      const noNameAttribute = {
        id: 1,
        values: []
      };

      expect(isValidAttribute(noNameAttribute)).toBe(false);
    });

    /**
     * 測試缺少 values 欄位的情況
     */
    it('應該拒絕缺少 values 欄位的資料', () => {
      const noValuesAttribute = {
        id: 1,
        name: '品牌'
      };

      expect(isValidAttribute(noValuesAttribute)).toBe(false);
    });

    /**
     * 測試 id 不是數字的情況
     */
    it('應該拒絕 id 不是數字的資料', () => {
      const invalidIdAttributes = [
        { id: '1', name: '顏色', values: [] },
        { id: null, name: '顏色', values: [] },
        { id: undefined, name: '顏色', values: [] }
      ];

      invalidIdAttributes.forEach(attribute => {
        expect(isValidAttribute(attribute)).toBe(false);
      });
    });

    /**
     * 測試 name 不是字串的情況
     */
    it('應該拒絕 name 不是字串的資料', () => {
      const invalidNameAttributes = [
        { id: 1, name: 123, values: [] },
        { id: 1, name: null, values: [] },
        { id: 1, name: undefined, values: [] }
      ];

      invalidNameAttributes.forEach(attribute => {
        expect(isValidAttribute(attribute)).toBe(false);
      });
    });

    /**
     * 測試 values 不是陣列的情況
     */
    it('應該拒絕 values 不是陣列的資料', () => {
      const invalidValuesAttributes = [
        { id: 1, name: '顏色', values: 'not array' },
        { id: 1, name: '顏色', values: 123 },
        { id: 1, name: '顏色', values: null },
        { id: 1, name: '顏色', values: {} }
      ];

      invalidValuesAttributes.forEach(attribute => {
        expect(isValidAttribute(attribute)).toBe(false);
      });
    });

    /**
     * 測試 null 和 undefined 輸入
     */
    it('應該拒絕 null 和 undefined', () => {
      expect(isValidAttribute(null)).toBe(false);
      expect(isValidAttribute(undefined)).toBe(false);
    });

    /**
     * 測試基本類型輸入
     */
    it('應該拒絕基本類型', () => {
      expect(isValidAttribute('string')).toBe(false);
      expect(isValidAttribute(123)).toBe(false);
      expect(isValidAttribute(true)).toBe(false);
      expect(isValidAttribute([])).toBe(false);
    });

    /**
     * 測試複雜的 values 陣列
     */
    it('應該正確處理複雜的 values 陣列', () => {
      const complexAttribute = {
        id: 1,
        name: '顏色',
        values: [
          { id: 1, value: '紅色', attribute_id: 1 },
          { id: 2, value: '藍色', attribute_id: 1 },
          { id: 3, value: '綠色', attribute_id: 1, extra_field: 'extra' },
          'invalid_value', // 無效的值
          { id: 4, value: '黃色' } // 缺少 attribute_id 但仍應接受
        ]
      };

      expect(isValidAttribute(complexAttribute)).toBe(true);
    });
  });

  describe('類型定義測試', () => {
    /**
     * 測試 ProductFormData 類型結構
     */
    it('ProductFormData 應該有正確的類型結構', () => {
      const formData: ProductFormData = {
        name: '測試商品',
        description: '商品描述',
        category_id: 1,
        is_variable: true,
        attributes: [
          {
            attribute_id: 1,
            attribute_name: '顏色',
            attribute_value_ids: [1, 2]
          }
        ],
        variants: [
          {
            key: '1-1',
            options: [
              {
                attribute_id: 1,
                attribute_name: '顏色',
                value: '紅色',
                value_id: 1
              }
            ],
            sku: 'TEST-001',
            price: 100,
            cost_price: 80,
            stock_quantity: 50
          }
        ]
      };

      expect(formData).toBeDefined();
      expect(formData.name).toBe('測試商品');
      expect(formData.attributes).toHaveLength(1);
      expect(formData.variants).toHaveLength(1);
    });

    /**
     * 測試 ProductSubmissionData 類型結構
     */
    it('ProductSubmissionData 應該有正確的類型結構', () => {
      const submissionData: ProductSubmissionData = {
        name: '提交商品',
        description: '提交描述',
        category_id: 2,
        attributes: [1, 2],
        variants: [
          {
            sku: 'SUBMIT-001',
            price: 200,
            cost_price: 150,
            stock_quantity: 100,
            attribute_value_ids: [1, 3]
          }
        ]
      };

      expect(submissionData).toBeDefined();
      expect(submissionData.name).toBe('提交商品');
      expect(submissionData.attributes).toEqual([1, 2]);
      expect(submissionData.variants).toHaveLength(1);
    });

    /**
     * 測試可選欄位
     */
    it('應該支援可選欄位', () => {
      const minimalFormData: ProductFormData = {
        name: '最小商品'
      };

      const minimalSubmissionData: ProductSubmissionData = {
        name: '最小提交商品',
        attributes: [],
        variants: []
      };

      expect(minimalFormData.name).toBe('最小商品');
      expect(minimalFormData.description).toBeUndefined();
      expect(minimalSubmissionData.attributes).toEqual([]);
      expect(minimalSubmissionData.variants).toEqual([]);
    });
  });

  describe('類型安全性測試', () => {
    /**
     * 測試類型守衛的類型縮窄功能
     */
    it('isValidProduct 應該正確縮窄類型', () => {
      const unknownData: unknown = {
        id: 1,
        name: '測試商品',
        description: '描述'
      };

      if (isValidProduct(unknownData)) {
        // 在這個區塊內，unknownData 應該被縮窄為 Product 類型
        expect(typeof unknownData.id).toBe('number');
        expect(typeof unknownData.name).toBe('string');
        // TypeScript 應該允許訪問 Product 的屬性
        expect(unknownData.id).toBe(1);
        expect(unknownData.name).toBe('測試商品');
      } else {
        fail('isValidProduct 應該返回 true');
      }
    });

    /**
     * 測試類型守衛的類型縮窄功能
     */
    it('isValidAttribute 應該正確縮窄類型', () => {
      const unknownData: unknown = {
        id: 1,
        name: '顏色',
        values: [
          { id: 1, value: '紅色', attribute_id: 1 }
        ]
      };

      if (isValidAttribute(unknownData)) {
        // 在這個區塊內，unknownData 應該被縮窄為 Attribute 類型
        expect(typeof unknownData.id).toBe('number');
        expect(typeof unknownData.name).toBe('string');
        expect(Array.isArray(unknownData.values)).toBe(true);
        expect(unknownData.values).toHaveLength(1);
      } else {
        fail('isValidAttribute 應該返回 true');
      }
    });
  });

  describe('邊界條件和效能測試', () => {
    /**
     * 測試大量資料的處理
     */
    it('應該能處理大量的屬性值', () => {
      const largeAttribute = {
        id: 1,
        name: '大型屬性',
        values: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          value: `值_${i + 1}`,
          attribute_id: 1
        }))
      };

      const startTime = Date.now();
      const result = isValidAttribute(largeAttribute);
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // 應該在 100ms 內完成
    });

    /**
     * 測試深層巢狀物件
     */
    it('應該處理深層巢狀的商品資料', () => {
      const deepProduct = {
        id: 1,
        name: '深層商品',
        nested: {
          level1: {
            level2: {
              level3: {
                data: '深層資料'
              }
            }
          }
        }
      };

      expect(isValidProduct(deepProduct)).toBe(true);
    });

    /**
     * 測試特殊字符處理
     */
    it('應該正確處理包含特殊字符的名稱', () => {
      const specialCharProducts = [
        { id: 1, name: '商品 & 特殊字符 < > " \' / \\' },
        { id: 2, name: '🚀 Emoji 商品 🎉' },
        { id: 3, name: '中文、日本語、한국어' },
        { id: 4, name: 'SQL\'; DROP TABLE products; --' }
      ];

      specialCharProducts.forEach(product => {
        expect(isValidProduct(product)).toBe(true);
      });
    });
  });

  describe('錯誤場景測試', () => {
    /**
     * 測試循環參考的物件
     */
    it('應該處理循環參考的物件', () => {
      const circularProduct: Record<string, unknown> = {
        id: 1,
        name: '循環商品'
      };
      circularProduct.self = circularProduct;

      expect(isValidProduct(circularProduct)).toBe(true);
    });

    /**
     * 測試原型鏈汙染攻擊
     */
    it('應該安全處理原型鏈汙染嘗試', () => {
      const maliciousData = JSON.parse('{"id": 1, "name": "test", "__proto__": {"polluted": true}}');
      
      expect(isValidProduct(maliciousData)).toBe(true);
      expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
    });
  });
});