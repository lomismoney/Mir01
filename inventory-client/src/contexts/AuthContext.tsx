'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLogin, useLogout } from '@/hooks/useApi';
import { getToken, removeToken, saveToken } from '@/lib/tokenManager';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * 認證上下文 (AuthContext)
 * 
 * 提供全域的用戶認證狀態管理
 * 
 * 核心功能：
 * 1. 全域用戶狀態管理
 * 2. 持續登入狀態檢查
 * 3. 統一的登入登出介面
 * 4. Token 自動驗證與清理
 * 5. 友善的使用者回饋
 */

// 使用統一的類型定義
import { AuthUser as User, LoginRequest } from '@/types/user';

// 認證上下文介面定義
interface AuthContextType {
  user: User | null;                    // 當前登入用戶資訊
  isAuthenticated: boolean;             // 是否已認證
  isLoading: boolean;                   // 初始化載入狀態
  login: (credentials: LoginRequest) => Promise<void>;  // 登入方法
  logout: () => void;                   // 登出方法
}

// 建立認證上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認證提供者元件
 * 
 * @param children - 子元件
 * @returns AuthProvider 包裹的子元件
 * 
 * 職責：
 * 1. 管理全域認證狀態
 * 2. 提供認證相關方法
 * 3. 處理 Token 驗證邏輯
 * 4. 實現持續登入功能
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 狀態管理
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // API Hooks
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const router = useRouter();

  /**
   * 元件初始化時驗證現有 Token
   * 實現「持續登入」功能
   */
  useEffect(() => {
    const validateToken = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // 如果有 token，呼叫 /api/user 驗證並獲取用戶資訊
        const { data, error } = await (apiClient as any).GET('/api/user');
        
        if (data && !error) {
          // 根據 API 回應結構解析用戶數據
          const userData = data.data || data;
          setUser(userData as User);
        } else {
          // Token 無效，清除它並顯示提示
          removeToken();
          console.warn('無效的認證 token，已自動登出');
        }
      } catch (error) {
        // 發生錯誤，清除 Token
        removeToken();
        console.error('驗證 token 時發生錯誤', error);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  /**
   * 登入方法
   * 
   * @param credentials - 登入憑證 (username, password)
   * @returns Promise<void>
   * 
   * 功能流程：
   * 1. 呼叫登入 API
   * 2. 成功時儲存用戶資訊和 Token
   * 3. 顯示成功通知
   * 4. 處理錯誤情況
   */
  const login = async (credentials: LoginRequest) => {
    return new Promise<void>((resolve, reject) => {
      loginMutation.mutate(credentials, {
        onSuccess: (data) => {
          // 確保用戶和token都存在再設置狀態
          if (data.user && data.token) {
            // 確保 data.user 符合 User 類型
            if (typeof data.user.id === 'number') {
              setUser(data.user as User);
              saveToken(data.token);
              toast.success('登入成功！');
              resolve();
            } else {
              toast.error('無效的用戶數據');
              reject(new Error('無效的用戶數據'));
            }
          } else {
            toast.error('登入響應數據不完整');
            reject(new Error('登入響應數據不完整'));
          }
        },
        onError: (error) => {
          toast.error(`登入失敗：${error.message}`);
          reject(error);
        }
      });
    });
  };

  /**
   * 登出方法
   * 
   * 功能：
   * 1. 呼叫後端 /api/logout 端點銷毀 Token
   * 2. 清除前端用戶狀態
   * 3. 移除本地 Token
   * 4. 顯示登出通知
   * 5. 重導向至登入頁
   * 
   * 安全特性：
   * - 確保後端 Token 被正確銷毀，防止 'zombie token' 漏洞
   * - 使用 Next.js useRouter 進行 SPA 導航
   */
  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        // 無論後端請求成功或失敗，都執行前端登出流程
        setUser(null);
        removeToken();
        toast.info('您已成功登出。');
        
        // 使用 Next.js useRouter 進行平滑的 SPA 導航
        router.push('/login');
      },
      onError: (error) => {
        // 後端登出失敗時記錄錯誤，但不阻止前端登出流程
        console.warn('後端登出請求失敗:', error);
      }
    });
  };
  
  // 計算認證狀態 - 如果有使用者資料且不在載入中，則已認證
  const isAuthenticated = Boolean(user) && !isLoading;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * 
 * 提供便利的認證狀態存取方法
 * 
 * @returns AuthContextType - 認證上下文物件
 * @throws Error - 如果在 AuthProvider 外使用會拋出錯誤
 * 
 * 使用範例：
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 