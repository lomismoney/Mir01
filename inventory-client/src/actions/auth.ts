'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';

/**
 * 登入 Server Action（Auth.js 原生重定向版本）
 * 
 * 此函式在伺服器端執行，負責處理登入表單提交
 * 使用 Auth.js 的 signIn 方法進行認證和重定向
 * 
 * 🔧 重定向修復策略：
 * 1. 使用 signIn 的 redirectTo 參數（讓 Auth.js 處理重定向）
 * 2. 移除手動 redirect 調用（避免重定向衝突）
 * 3. 確保認證流程的完整性和一致性
 * 
 * 功能特色：
 * 1. 伺服器端執行，安全性高
 * 2. 自動處理表單資料
 * 3. 友善的錯誤訊息處理
 * 4. 詳細的錯誤分類和提示
 * 5. 與 Auth.js 完美整合
 * 6. Auth.js 原生重定向 - 避免重定向衝突
 * 
 * @param prevState - 前一個狀態 (useFormState 需要)
 * @param formData - 表單資料 (包含 username 和 password)
 * @returns Promise<{error?: string}> - 錯誤訊息（如果有的話）
 */
export async function loginAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  try {
    // 獲取表單資料
    const username = formData.get('username')?.toString()?.trim();
    const password = formData.get('password')?.toString();
    
    // 基本驗證
    if (!username || !password) {
      return { error: '請輸入帳號和密碼。' };
    }
    
    if (username.length < 2) {
      return { error: '帳號長度至少需要 2 個字符。' };
    }
    
    if (password.length < 3) {
      return { error: '密碼長度至少需要 3 個字符。' };
    }
    
    // 將資料轉換為 signIn 需要的格式
    const credentials = { username, password };
    
    // 呼叫 Auth.js 的 signIn 方法
    // 🔧 關鍵修復：使用 redirectTo 參數，讓 Auth.js 處理重定向
    // 移除手動 redirect 調用，避免重定向衝突
    await signIn('credentials', { 
      ...credentials,
      redirectTo: '/dashboard'
    });
    
  } catch (error) {
    // 🔧 處理 Next.js Server Actions 的重定向機制
    // 在 Server Actions 中，redirect() 函數通過拋出特殊錯誤來實現
    // 這是 Next.js 的設計模式，不是真正的錯誤
    if (error instanceof Error) {
      // 檢查是否為 Next.js 的重定向錯誤
      // NEXT_REDIRECT 是 Next.js 內部使用的標記
      const isNextRedirect = error.message?.includes('NEXT_REDIRECT') || 
                            (error as any).digest?.includes('NEXT_REDIRECT');
      
      if (isNextRedirect) {
        // 重要：這不是錯誤，而是成功登入後的正常重定向
        // 必須重新拋出以讓 Next.js 框架完成重定向
        throw error;
      }
    }
    
    // 處理 Auth.js 特定的錯誤
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { 
            error: '帳號或密碼不正確，請檢查後重新輸入。如果忘記密碼，請聯繫系統管理員。' 
          };
        case 'CallbackRouteError':
          return { 
            error: '認證過程發生錯誤，請稍後再試。如果問題持續，請聯繫技術支援。' 
          };
        case 'AccessDenied':
          return { 
            error: '您的帳號沒有權限訪問此系統。請聯繫系統管理員開通權限。' 
          };
        case 'Verification':
          return { 
            error: '帳號驗證失敗，請確認您的帳號狀態。' 
          };
        default:
          console.error('未知的 Auth 錯誤:', error.type, error.message);
          return { 
            error: `登入失敗：${error.message || '發生未知錯誤'}。請稍後再試或聯繫系統管理員。` 
          };
      }
    }
    
    // 處理網路或系統級錯誤
    if (error instanceof Error) {
      // 檢查是否為連線錯誤
      if (error.message.includes('fetch')) {
        return { 
          error: '無法連接到伺服器，請檢查網路連線後重試。' 
        };
      }
      
      // 記錄其他錯誤供調試
      console.error('登入過程發生系統錯誤:', error.message);
      return { 
        error: '系統暫時無法處理登入請求，請稍後再試。' 
      };
    }
    
    // 對於非 AuthError 的錯誤，記錄並返回通用錯誤訊息
    // 避免拋出錯誤導致未處理的例外
    console.error('登入過程發生未預期錯誤:', error);
    return { 
      error: '登入過程發生未預期錯誤，請稍後再試或聯繫系統管理員。' 
    };
  }
} 