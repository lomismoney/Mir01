
import { loginAction } from '../auth';
import { signIn } from '../../../auth';
import { AuthError } from 'next-auth';

// Mock the auth module that uses next-auth
jest.mock('../../../auth', () => ({
  signIn: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

const mockedSignIn = signIn as jest.Mock;

// Mock console.error 以避免測試輸出
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('loginAction', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('表單驗證', () => {
    it('應該在沒有提供帳號時返回錯誤', async () => {
      const formData = new FormData();
      formData.append('password', 'password123');

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '請輸入帳號和密碼。' });
      expect(mockedSignIn).not.toHaveBeenCalled();
    });

    it('應該在沒有提供密碼時返回錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '請輸入帳號和密碼。' });
      expect(mockedSignIn).not.toHaveBeenCalled();
    });

    it('應該在帳號為空字串時返回錯誤', async () => {
      const formData = new FormData();
      formData.append('username', '   ');
      formData.append('password', 'password123');

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '請輸入帳號和密碼。' });
      expect(mockedSignIn).not.toHaveBeenCalled();
    });

    it('應該在帳號長度少於2個字符時返回錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'a');
      formData.append('password', 'password123');

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '帳號長度至少需要 2 個字符。' });
      expect(mockedSignIn).not.toHaveBeenCalled();
    });

    it('應該在密碼長度少於3個字符時返回錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'ab');

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '密碼長度至少需要 3 個字符。' });
      expect(mockedSignIn).not.toHaveBeenCalled();
    });

    it('應該正確處理包含空格的帳號', async () => {
      const formData = new FormData();
      formData.append('username', '  testuser  ');
      formData.append('password', 'password123');

      await loginAction(undefined, formData);

      expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
        username: 'testuser',
        password: 'password123'
      });
    });
  });

  describe('成功登入', () => {
    it('should call signIn with credentials and redirect to /dashboard on success', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      await loginAction(undefined, formData);

      expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('應該正確處理 Next.js 重定向錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const redirectError = new Error('NEXT_REDIRECT');
      mockedSignIn.mockRejectedValue(redirectError);

      await expect(loginAction(undefined, formData)).rejects.toThrow('NEXT_REDIRECT');
    });

    it('應該正確處理包含 NEXT_REDIRECT 的錯誤訊息', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const redirectError = new Error('Some error message with NEXT_REDIRECT inside');
      mockedSignIn.mockRejectedValue(redirectError);

      await expect(loginAction(undefined, formData)).rejects.toThrow('Some error message with NEXT_REDIRECT inside');
    });

    it('應該正確處理 digest 中包含 NEXT_REDIRECT 的錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const redirectError = new Error('Some error') as any;
      redirectError.digest = 'NEXT_REDIRECT';
      mockedSignIn.mockRejectedValue(redirectError);

      await expect(loginAction(undefined, formData)).rejects.toThrow('Some error');
    });
  });

  describe('AuthError 處理', () => {
    it('should return "帳號或密碼不正確。" on CredentialsSignin error', async () => {
      const formData = new FormData();
      formData.append('username', 'wronguser');
      formData.append('password', 'wrongpassword');

      const error = new AuthError('CredentialsSignin');
      error.type = 'CredentialsSignin';
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '帳號或密碼不正確，請檢查後重新輸入。如果忘記密碼，請聯繫系統管理員。' });
    });

    it('should return "認證過程發生錯誤，請稍後再試。" on CallbackRouteError', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const error = new AuthError('CallbackRouteError');
      error.type = 'CallbackRouteError';
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '認證過程發生錯誤，請稍後再試。如果問題持續，請聯繫技術支援。' });
    });

    it('應該處理 AccessDenied 錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const error = new AuthError('AccessDenied');
      error.type = 'AccessDenied';
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({
        error: '您的帳號沒有權限訪問此系統。請聯繫系統管理員開通權限。'
      });
    });

    it('應該處理 Verification 錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const error = new AuthError('Verification');
      error.type = 'Verification';
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({
        error: '帳號驗證失敗，請確認您的帳號狀態。'
      });
    });

    it('should return "發生未知的登入錯誤。" on other AuthError', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const error = new AuthError('UnknownError');
      error.type = 'UnknownError' as any;
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({ error: '登入失敗：UnknownError。請稍後再試或聯繫系統管理員。' });
    });

    it('應該處理沒有訊息的未知 AuthError', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const error = new AuthError('');
      error.type = 'UnknownError' as any;
      error.message = '';
      mockedSignIn.mockRejectedValue(error);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({
        error: '登入失敗：發生未知錯誤。請稍後再試或聯繫系統管理員。'
      });
    });
  });

  describe('網路錯誤處理', () => {
    it('應該處理 fetch 錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const fetchError = new Error('fetch failed');
      mockedSignIn.mockRejectedValue(fetchError);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({
        error: '無法連接到伺服器，請檢查網路連線後重試。'
      });
    });

    it('should re-throw non-AuthError errors', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const unexpectedError = new Error('Something went wrong');
      mockedSignIn.mockRejectedValue(unexpectedError);

      const result = await loginAction(undefined, formData);
      expect(result).toEqual({ error: '系統暫時無法處理登入請求，請稍後再試。' });
    });
  });

  describe('非 Error 類型錯誤處理', () => {
    it('應該處理非 Error 類型的錯誤', async () => {
      const formData = new FormData();
      formData.append('username', 'testuser');
      formData.append('password', 'password123');

      const nonErrorType = 'Some string error';
      mockedSignIn.mockRejectedValue(nonErrorType);

      const result = await loginAction(undefined, formData);

      expect(result).toEqual({
        error: '登入過程發生未預期錯誤，請稍後再試或聯繫系統管理員。'
      });
    });
  });
});
