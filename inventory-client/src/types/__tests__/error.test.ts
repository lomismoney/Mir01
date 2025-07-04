/**
 * error.ts 測試套件
 * 
 * 這個測試套件涵蓋了：
 * - LaravelValidationError 和 LaravelGeneralError 類型檢查
 * - isLaravelValidationError 類型守衛函數
 * - isLaravelGeneralError 類型守衛函數
 * - parseApiErrorMessage 錯誤訊息解析函數
 * - 各種邊界條件和錯誤處理場景
 */

import {
  LaravelValidationError,
  LaravelGeneralError,
  ApiError,
  isLaravelValidationError,
  isLaravelGeneralError,
  parseApiErrorMessage,
} from '../error';

describe('error.ts', () => {
  describe('isLaravelValidationError', () => {
    /**
     * 測試有效的 Laravel 驗證錯誤識別
     */
    it('應該正確識別有效的 Laravel 驗證錯誤', () => {
      const validationError: LaravelValidationError = {
        message: '驗證失敗',
        errors: {
          email: ['電子郵件格式不正確'],
          password: ['密碼長度不足', '密碼必須包含數字']
        }
      };

      expect(isLaravelValidationError(validationError)).toBe(true);
    });

    /**
     * 測試空的 errors 物件
     */
    it('應該接受空的 errors 物件', () => {
      const emptyErrorsValidation = {
        message: '驗證失敗',
        errors: {}
      };

      expect(isLaravelValidationError(emptyErrorsValidation)).toBe(true);
    });

    /**
     * 測試缺少 message 欄位的情況
     */
    it('應該拒絕缺少 message 欄位的物件', () => {
      const noMessage = {
        errors: {
          field: ['error message']
        }
      };

      expect(isLaravelValidationError(noMessage)).toBe(false);
    });

    /**
     * 測試缺少 errors 欄位的情況
     */
    it('應該拒絕缺少 errors 欄位的物件', () => {
      const noErrors = {
        message: '錯誤訊息'
      };

      expect(isLaravelValidationError(noErrors)).toBe(false);
    });

    /**
     * 測試 errors 不是物件的情況
     */
    it('應該拒絕 errors 不是物件的情況', () => {
      const invalidErrors = {
        message: '錯誤訊息',
        errors: 'not an object'
      };

      expect(isLaravelValidationError(invalidErrors)).toBe(false);
    });

    /**
     * 測試 null 和 undefined 輸入
     */
    it('應該拒絕 null 和 undefined', () => {
      expect(isLaravelValidationError(null)).toBe(false);
      expect(isLaravelValidationError(undefined)).toBe(false);
    });

    /**
     * 測試基本類型輸入
     */
    it('應該拒絕基本類型', () => {
      expect(isLaravelValidationError('string')).toBe(false);
      expect(isLaravelValidationError(123)).toBe(false);
      expect(isLaravelValidationError(true)).toBe(false);
      expect(isLaravelValidationError([])).toBe(false);
    });

    /**
     * 測試 errors 為 null 的情況
     */
    it('應該接受 errors 為 null 的物件', () => {
      // 根據實際實現，errors 為 null 時函數會接受它，因為 typeof null === 'object'
      const nullErrors = {
        message: '錯誤訊息',
        errors: null
      };

      expect(isLaravelValidationError(nullErrors)).toBe(true);
    });
  });

  describe('isLaravelGeneralError', () => {
    /**
     * 測試有效的 Laravel 一般錯誤識別
     */
    it('應該正確識別有效的 Laravel 一般錯誤', () => {
      const generalError: LaravelGeneralError = {
        message: '伺服器錯誤',
        status: 500,
        code: 'INTERNAL_ERROR'
      };

      expect(isLaravelGeneralError(generalError)).toBe(true);
    });

    /**
     * 測試只有 message 欄位的情況
     */
    it('應該接受只有 message 欄位的物件', () => {
      const minimalError = {
        message: '簡單錯誤'
      };

      expect(isLaravelGeneralError(minimalError)).toBe(true);
    });

    /**
     * 測試缺少 message 欄位的情況
     */
    it('應該拒絕缺少 message 欄位的物件', () => {
      const noMessage = {
        status: 400,
        code: 'BAD_REQUEST'
      };

      expect(isLaravelGeneralError(noMessage)).toBe(false);
    });

    /**
     * 測試 message 不是字串的情況
     */
    it('應該拒絕 message 不是字串的物件', () => {
      const nonStringMessage = {
        message: 123
      };

      expect(isLaravelGeneralError(nonStringMessage)).toBe(false);
    });

    /**
     * 測試 null 和 undefined 輸入
     */
    it('應該拒絕 null 和 undefined', () => {
      expect(isLaravelGeneralError(null)).toBe(false);
      expect(isLaravelGeneralError(undefined)).toBe(false);
    });

    /**
     * 測試基本類型輸入
     */
    it('應該拒絕基本類型', () => {
      expect(isLaravelGeneralError('string')).toBe(false);
      expect(isLaravelGeneralError(123)).toBe(false);
      expect(isLaravelGeneralError(true)).toBe(false);
      expect(isLaravelGeneralError([])).toBe(false);
    });

    /**
     * 測試具有額外屬性的物件
     */
    it('應該接受具有額外屬性的物件', () => {
      const extendedError = {
        message: '錯誤訊息',
        status: 400,
        code: 'VALIDATION_ERROR',
        extraField: 'extra value',
        timestamp: Date.now()
      };

      expect(isLaravelGeneralError(extendedError)).toBe(true);
    });
  });

  describe('parseApiErrorMessage', () => {
    /**
     * 測試解析 Laravel 驗證錯誤
     */
    it('應該正確解析 Laravel 驗證錯誤', () => {
      const validationError: LaravelValidationError = {
        message: '驗證失敗',
        errors: {
          email: ['電子郵件格式不正確'],
          password: ['密碼長度不足', '密碼必須包含數字']
        }
      };

      const result = parseApiErrorMessage(validationError);
      expect(result).toBe('電子郵件格式不正確\n密碼長度不足\n密碼必須包含數字');
    });

    /**
     * 測試解析空的驗證錯誤
     */
    it('應該處理空的驗證錯誤', () => {
      const emptyValidationError = {
        message: '驗證失敗',
        errors: {}
      };

      const result = parseApiErrorMessage(emptyValidationError);
      expect(result).toBe('驗證失敗');
    });

    /**
     * 測試解析驗證錯誤但沒有 message
     */
    it('應該在驗證錯誤沒有訊息時使用預設訊息', () => {
      const noMessageValidationError = {
        message: '',
        errors: {}
      };

      const result = parseApiErrorMessage(noMessageValidationError);
      expect(result).toBe('驗證錯誤');
    });

    /**
     * 測試解析 Laravel 一般錯誤
     */
    it('應該正確解析 Laravel 一般錯誤', () => {
      const generalError: LaravelGeneralError = {
        message: '伺服器內部錯誤',
        status: 500
      };

      const result = parseApiErrorMessage(generalError);
      expect(result).toBe('伺服器內部錯誤');
    });

    /**
     * 測試解析 JavaScript Error 物件
     */
    it('應該正確解析 JavaScript Error 物件', () => {
      const jsError = new Error('JavaScript 錯誤');
      
      const result = parseApiErrorMessage(jsError);
      expect(result).toBe('JavaScript 錯誤');
    });

    /**
     * 測試解析自定義 Error 子類
     */
    it('應該正確解析自定義 Error 子類', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const customError = new CustomError('自定義錯誤');
      
      const result = parseApiErrorMessage(customError);
      expect(result).toBe('自定義錯誤');
    });

    /**
     * 測試解析字串錯誤
     */
    it('應該正確解析字串錯誤', () => {
      const stringError = '這是一個字串錯誤';
      
      const result = parseApiErrorMessage(stringError);
      expect(result).toBe('這是一個字串錯誤');
    });

    /**
     * 測試解析未知類型錯誤
     */
    it('應該為未知類型錯誤返回預設訊息', () => {
      const unknownError = 123;
      
      const result = parseApiErrorMessage(unknownError);
      expect(result).toBe('未知錯誤');
    });

    /**
     * 測試解析 null 和 undefined
     */
    it('應該處理 null 和 undefined', () => {
      expect(parseApiErrorMessage(null)).toBe('未知錯誤');
      expect(parseApiErrorMessage(undefined)).toBe('未知錯誤');
    });

    /**
     * 測試解析複雜的驗證錯誤結構
     */
    it('應該正確處理複雜的驗證錯誤結構', () => {
      const complexValidationError = {
        message: '表單驗證失敗',
        errors: {
          'user.name': ['姓名不能為空'],
          'user.email': ['電子郵件格式不正確', '電子郵件已被使用'],
          'user.profile.age': ['年齡必須大於 18'],
          'products.0.name': ['第一個產品名稱不能為空'],
          'products.1.price': ['第二個產品價格必須大於 0']
        }
      };

      const result = parseApiErrorMessage(complexValidationError);
      const expectedMessages = [
        '姓名不能為空',
        '電子郵件格式不正確',
        '電子郵件已被使用',
        '年齡必須大於 18',
        '第一個產品名稱不能為空',
        '第二個產品價格必須大於 0'
      ];
      
      expect(result).toBe(expectedMessages.join('\n'));
    });

    /**
     * 測試解析包含特殊字符的錯誤訊息
     */
    it('應該正確處理包含特殊字符的錯誤訊息', () => {
      const specialCharError = {
        message: '錯誤：包含 <script> 標籤 & 特殊字符 "test" \'quote\'',
        errors: {
          field: ['錯誤訊息包含 HTML <b>粗體</b> 和 JavaScript alert("test")']
        }
      };

      const result = parseApiErrorMessage(specialCharError);
      expect(result).toBe('錯誤訊息包含 HTML <b>粗體</b> 和 JavaScript alert("test")');
    });

    /**
     * 測試邊界條件：空字串和空陣列
     */
    it('應該處理邊界條件', () => {
      const edgeCases = [
        { input: '', expected: '' }, // 空字串會被當作字串處理，所以返回空字串
        { input: [], expected: '未知錯誤' },
        { input: {}, expected: '未知錯誤' },
        { input: false, expected: '未知錯誤' },
        { input: 0, expected: '未知錯誤' }
      ];

      edgeCases.forEach(({ input, expected }) => {
        expect(parseApiErrorMessage(input)).toBe(expected);
      });
    });

    /**
     * 測試驗證錯誤優先於一般錯誤
     */
    it('驗證錯誤應該優先於一般錯誤處理', () => {
      const hybridError = {
        message: '這是一般錯誤訊息',
        errors: {
          field1: ['這是驗證錯誤訊息']
        },
        status: 422
      };

      const result = parseApiErrorMessage(hybridError);
      expect(result).toBe('這是驗證錯誤訊息');
    });
  });

  describe('類型定義測試', () => {
    /**
     * 測試 ApiError 聯合類型
     */
    it('ApiError 類型應該包含所有錯誤類型', () => {
      const validationError: ApiError = {
        message: '驗證錯誤',
        errors: { field: ['error'] }
      };

      const generalError: ApiError = {
        message: '一般錯誤',
        status: 400
      };

      const jsError: ApiError = new Error('JavaScript 錯誤');

      // 這些賦值應該都能通過 TypeScript 檢查
      expect(validationError).toBeDefined();
      expect(generalError).toBeDefined();
      expect(jsError).toBeDefined();
    });
  });

  describe('整合測試', () => {
    /**
     * 測試完整的錯誤處理流程
     */
    it('應該正確處理完整的錯誤處理流程', () => {
      const errors = [
        {
          input: { message: '驗證失敗', errors: { email: ['格式錯誤'] } },
          expected: '格式錯誤'
        },
        {
          input: { message: '伺服器錯誤', status: 500 },
          expected: '伺服器錯誤'
        },
        {
          input: new Error('網路錯誤'),
          expected: '網路錯誤'
        },
        {
          input: '字串錯誤',
          expected: '字串錯誤'
        },
        {
          input: 42,
          expected: '未知錯誤'
        }
      ];

      errors.forEach(({ input, expected }) => {
        const result = parseApiErrorMessage(input);
        expect(result).toBe(expected);
      });
    });
  });
});