
import { loginAction } from '../auth';
import { signIn } from '../../../auth';

// Mock the entire next-auth module
jest.mock('next-auth', () => ({
  AuthError: class extends Error {
    type: string;
    constructor(type: string) {
      super(type);
      this.type = type;
    }
  },
}));

// Mock the auth module that uses next-auth
jest.mock('../../../auth', () => ({
  signIn: jest.fn(),
}));

const mockedSignIn = signIn as jest.Mock;

describe('loginAction', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call signIn with credentials and redirect to /dashboard on success', async () => {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'password123');

    await loginAction(undefined, formData);

    expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
      username: 'testuser',
      password: 'password123',
      redirectTo: '/dashboard',
    });
  });

  it('should return "帳號或密碼不正確。" on CredentialsSignin error', async () => {
    const formData = new FormData();
    formData.append('username', 'wronguser');
    formData.append('password', 'wrongpassword');

    const { AuthError } = await import('next-auth');
    const error = new AuthError('CredentialsSignin');
    mockedSignIn.mockRejectedValue(error);

    const result = await loginAction(undefined, formData);

    expect(result).toEqual({ error: '帳號或密碼不正確。' });
  });

  it('should return "認證過程發生錯誤，請稍後再試。" on CallbackRouteError', async () => {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'password123');

    const { AuthError } = await import('next-auth');
    const error = new AuthError('CallbackRouteError');
    mockedSignIn.mockRejectedValue(error);

    const result = await loginAction(undefined, formData);

    expect(result).toEqual({ error: '認證過程發生錯誤，請稍後再試。' });
  });

  it('should return "發生未知的登入錯誤。" on other AuthError', async () => {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'password123');

    const { AuthError } = await import('next-auth');
    const error = new AuthError('UnknownError');
    mockedSignIn.mockRejectedValue(error);

    const result = await loginAction(undefined, formData);

    expect(result).toEqual({ error: '發生未知的登入錯誤。' });
  });

  it('should re-throw non-AuthError errors', async () => {
    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'password123');

    const unexpectedError = new Error('Something went wrong');
    mockedSignIn.mockRejectedValue(unexpectedError);

    await expect(loginAction(undefined, formData)).rejects.toThrow('Something went wrong');
  });
});
