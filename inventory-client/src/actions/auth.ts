'use server';

import { signIn } from '../../auth';
import { AuthError } from 'next-auth';

/**
 * 登入 Server Action（精準著陸版本）
 * 
 * 此函式在伺服器端執行，負責處理登入表單提交
 * 使用 Auth.js 的 signIn 方法進行認證，並明確指定登入成功後的重定向目標
 * 
 * 功能特色：
 * 1. 伺服器端執行，安全性高
 * 2. 自動處理表單資料
 * 3. 統一的錯誤處理
 * 4. 友善的錯誤訊息
 * 5. 與 Auth.js 完美整合
 * 6. 精準重定向 - 登入成功後直接導向儀表板
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
    // 將 FormData 轉換為物件，並加入 redirectTo 參數
    const credentials = Object.fromEntries(formData);
    
    // 呼叫 Auth.js 的 signIn 方法
    // 使用 'credentials' provider 進行認證
    // 明確指定登入成功後重定向到儀表板，避免重定向循環
    await signIn('credentials', { 
      ...credentials, 
      redirectTo: "/dashboard" 
    });
  } catch (error) {
    // 處理 Auth.js 特定的錯誤
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: '帳號或密碼不正確。' };
        case 'CallbackRouteError':
          return { error: '認證過程發生錯誤，請稍後再試。' };
        default:
          return { error: '發生未知的登入錯誤。' };
      }
    }
    
    // 對於非 AuthError 的錯誤，需要重新拋出
    // 這通常是系統級錯誤或重導向
    throw error;
  }
} 