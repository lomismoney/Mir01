/**
 * use-admin-auth 測試 - 修正版
 *
 * 手動 mock next/navigation，確保測試穩定性。
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminAuth } from '../use-admin-auth';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// Mock 依賴項
jest.mock('next-auth/react');
jest.mock('sonner');

const mockPush = jest.fn();
const mockReplace = jest.fn();

// 手動 mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

describe('useAdminAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該在載入中時返回 isLoading 為 true', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });
    const { result } = renderHook(() => useAdminAuth());
    expect(result.current.isLoading).toBe(true);
  });

  it('應該在用戶是管理員時返回 isAuthorized 為 true', () => {
    const mockUser = { isAdmin: true };
    (useSession as jest.Mock).mockReturnValue({ data: { user: mockUser }, status: 'authenticated' });
    const { result } = renderHook(() => useAdminAuth());
    expect(result.current.isAuthorized).toBe(true);
  });

  it('應該在用戶不是管理員時重新導向並顯示錯誤', async () => {
    const mockUser = { isAdmin: false };
    (useSession as jest.Mock).mockReturnValue({ data: { user: mockUser }, status: 'authenticated' });
    renderHook(() => useAdminAuth());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('權限不足', expect.any(Object));
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });
});