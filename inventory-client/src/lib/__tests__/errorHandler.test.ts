import { parseApiError, handleApiError, createApiError, withRetry } from '../errorHandler';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('errorHandler', () => {
  // 清理所有 mock
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock 開發環境
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });
  });

  afterEach(() => {
    // 恢復原始環境變數
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: undefined,
      configurable: true,
    });
  });

  describe('parseApiError', () => {
    it('應該處理非對象類型的錯誤', () => {
      expect(parseApiError(null)).toBe('發生未知錯誤，請聯繫系統管理員');
      expect(parseApiError(undefined)).toBe('發生未知錯誤，請聯繫系統管理員');
      expect(parseApiError('字串錯誤')).toBe('發生未知錯誤，請聯繫系統管理員');
      expect(parseApiError(123)).toBe('發生未知錯誤，請聯繫系統管理員');
    });

    it('應該檢測並處理 HTML 響應', () => {
      const htmlError = {
        message: '<!DOCTYPE html><html><head><title>Error</title></head><body>Server Error</body></html>'
      };
      expect(parseApiError(htmlError)).toBe('系統返回了非預期的響應格式，請確認 API 設定是否正確');

      const html5Error = {
        message: '<html><body>Error</body></html>'
      };
      expect(parseApiError(html5Error)).toBe('系統返回了非預期的響應格式，請確認 API 設定是否正確');
    });

    it('應該處理網絡錯誤', () => {
      const networkError = {
        name: 'TypeError',
        message: 'Failed to fetch'
      };
      expect(parseApiError(networkError)).toBe('網絡連接失敗，請檢查網絡設置');
    });

    it('應該處理超時錯誤', () => {
      const timeoutError = {
        name: 'AbortError'
      };
      expect(parseApiError(timeoutError)).toBe('請求超時，請重試');
    });

    it('應該處理 Laravel 表單驗證錯誤', () => {
      const validationError = {
        errors: {
          name: ['名稱為必填項目', '名稱長度不能超過50個字符'],
          email: ['請輸入有效的電子郵件地址']
        }
      };
      const result = parseApiError(validationError);
      expect(result).toContain('名稱為必填項目');
      expect(result).toContain('名稱長度不能超過50個字符');
      expect(result).toContain('請輸入有效的電子郵件地址');
    });

    it('應該處理單一 Laravel 驗證錯誤', () => {
      const singleValidationError = {
        errors: {
          name: ['名稱為必填項目']
        }
      };
      expect(parseApiError(singleValidationError)).toBe('名稱為必填項目');
    });

    it('應該處理字串格式的錯誤', () => {
      const stringValidationError = {
        errors: {
          name: '名稱為必填項目'
        }
      };
      expect(parseApiError(stringValidationError)).toBe('名稱為必填項目');
    });

    it('應該處理直接的錯誤訊息', () => {
      const directError = {
        message: '自定義錯誤訊息'
      };
      expect(parseApiError(directError)).toBe('自定義錯誤訊息');
    });

    it('應該處理 openapi-fetch 錯誤格式', () => {
      const openapiError = {
        detail: 'OpenAPI 錯誤詳情'
      };
      expect(parseApiError(openapiError)).toBe('OpenAPI 錯誤詳情');

      const openapiArrayError = {
        detail: [['第一個錯誤', '第二個錯誤']]
      };
      expect(parseApiError(openapiArrayError)).toBe('第一個錯誤\n第二個錯誤');

      const openapiStringArrayError = {
        detail: ['單一錯誤訊息']
      };
      expect(parseApiError(openapiStringArrayError)).toBe('單一錯誤訊息');
    });

    it('應該處理 HTTP 狀態碼錯誤', () => {
      expect(parseApiError({ status: 401 })).toBe('登入已過期，請重新登入');
      expect(parseApiError({ status: 403 })).toBe('您沒有權限執行此操作');
      expect(parseApiError({ status: 400 })).toBe('請求參數有誤');
      expect(parseApiError({ status: 404 })).toBe('找不到請求的資源');
      expect(parseApiError({ status: 422 })).toBe('資料驗證失敗');
      expect(parseApiError({ status: 500 })).toBe('服務器發生錯誤，請稍後再試');
      expect(parseApiError({ status: 502 })).toBe('服務暫時無法使用');
      expect(parseApiError({ status: 503 })).toBe('服務維護中，請稍後再試');
    });

    it('應該回退到預設錯誤訊息', () => {
      const unknownError = {
        someUnknownProperty: 'value'
      };
      expect(parseApiError(unknownError)).toBe('發生未知錯誤，請聯繫系統管理員');
    });
  });

  describe('handleApiError', () => {
    it('應該解析錯誤並顯示 toast', () => {
      const error = { message: '測試錯誤' };
      const result = handleApiError(error);
      
      expect(result).toBe('測試錯誤');
      expect(toast.error).toHaveBeenCalledWith('測試錯誤');
    });

    it('應該使用備用錯誤訊息', () => {
      const error = { message: '原始錯誤' };
      const fallbackMessage = '備用錯誤訊息';
      const result = handleApiError(error, fallbackMessage);
      
      expect(result).toBe('備用錯誤訊息');
      expect(toast.error).toHaveBeenCalledWith('備用錯誤訊息');
    });

    it('應該處理解析錯誤時的情況', () => {
      // 創建一個會導致解析失敗的錯誤對象
      const errorObject = {};
      Object.defineProperty(errorObject, 'message', {
        get() {
          throw new Error('解析失敗');
        }
      });

      const result = handleApiError(errorObject);
      
      expect(result).toBe('發生未知錯誤，請聯繫系統管理員');
      expect(toast.error).toHaveBeenCalledWith('發生未知錯誤，請聯繫系統管理員');
    });

    it('應該在開發環境下記錄錯誤', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = { 
        message: '測試錯誤',
        status: 400,
        code: 'TEST_ERROR'
      };
      
      handleApiError(error);
      
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', {
        message: '測試錯誤',
        status: 400,
        code: 'TEST_ERROR'
      });
      
      consoleSpy.mockRestore();
    });

    it('應該在開發環境下處理 HTML 錯誤', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const htmlError = { 
        message: '<html><body>Error</body></html>',
        status: 500
      };
      
      handleApiError(htmlError);
      
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', {
        message: 'HTML Response (content omitted)',
        status: 500
      });
      
      consoleSpy.mockRestore();
    });

    it('應該處理非對象錯誤的記錄', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleApiError('字串錯誤');
      
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', '字串錯誤');
      
      consoleSpy.mockRestore();
    });

    it('應該處理錯誤對象無法安全處理的情況', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 創建一個會導致處理失敗的錯誤對象
      const problematicError = {};
      Object.defineProperty(problematicError, 'message', {
        get() {
          throw new Error('無法讀取');
        }
      });
      
      handleApiError(problematicError);
      
      expect(consoleSpy).toHaveBeenCalledWith('API Error:', {
        error: 'Error object could not be safely processed'
      });
      
      consoleSpy.mockRestore();
    });

    it('應該在生產環境下不記錄詳細錯誤', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = { message: '測試錯誤' };
      
      handleApiError(error);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('createApiError', () => {
    it('應該創建完整的 API 錯誤對象', () => {
      const error = createApiError(
        '測試錯誤訊息',
        400,
        'TEST_ERROR',
        { field: 'value' }
      );
      
      expect(error).toEqual({
        message: '測試錯誤訊息',
        status: 400,
        code: 'TEST_ERROR',
        details: { field: 'value' }
      });
    });

    it('應該創建只有訊息的 API 錯誤對象', () => {
      const error = createApiError('簡單錯誤訊息');
      
      expect(error).toEqual({
        message: '簡單錯誤訊息',
        status: undefined,
        code: undefined,
        details: undefined
      });
    });
  });

  describe('withRetry', () => {
    it('應該在成功時返回結果', async () => {
      const successFn = jest.fn().mockResolvedValue('成功結果');
      
      const result = await withRetry(successFn);
      
      expect(result).toBe('成功結果');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('應該在失敗後重試', async () => {
      const failOnceFn = jest.fn()
        .mockRejectedValueOnce(new Error('第一次失敗'))
        .mockResolvedValue('成功結果');
      
      const result = await withRetry(failOnceFn, 2, 10); // 2次重試，10ms延遲
      
      expect(result).toBe('成功結果');
      expect(failOnceFn).toHaveBeenCalledTimes(2);
    });

    it('應該在達到最大重試次數後拋出錯誤', async () => {
      const alwaysFailFn = jest.fn().mockRejectedValue(new Error('持續失敗'));
      
      await expect(withRetry(alwaysFailFn, 2, 10)).rejects.toThrow('持續失敗');
      expect(alwaysFailFn).toHaveBeenCalledTimes(3); // 初始調用 + 2次重試
    });

    it('應該使用指數退避延遲', async () => {
      jest.useFakeTimers();
      const alwaysFailFn = jest.fn().mockRejectedValue(new Error('失敗'));
      
      const retryPromise = withRetry(alwaysFailFn, 2, 100);
      
      // 快進時間來模擬延遲
      jest.advanceTimersByTime(100); // 第一次重試延遲
      await Promise.resolve(); // 讓微任務執行
      
      jest.advanceTimersByTime(200); // 第二次重試延遲（指數退避）
      await Promise.resolve();
      
      jest.useRealTimers();
      
      await expect(retryPromise).rejects.toThrow('失敗');
      expect(alwaysFailFn).toHaveBeenCalledTimes(3);
    });

    it('應該使用預設重試參數', async () => {
      const alwaysFailFn = jest.fn().mockRejectedValue(new Error('失敗'));
      
      await expect(withRetry(alwaysFailFn)).rejects.toThrow('失敗');
      expect(alwaysFailFn).toHaveBeenCalledTimes(4); // 初始調用 + 3次重試（預設）
    }, 10000); // 增加超時時間到 10 秒
  });
}); 