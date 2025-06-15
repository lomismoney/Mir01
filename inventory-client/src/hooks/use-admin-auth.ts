import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * 管理員權限驗證自訂 Hook（優化版本）
 * 
 * 功能特性：
 * 1. 統一的權限檢查邏輯 - 單一真實來源 (Single Source of Truth)
 * 2. 自動處理未認證用戶的重新導向
 * 3. 非管理員用戶的權限阻擋與友善提示
 * 4. 優化的載入狀態管理
 * 5. 消除冗餘狀態，直接從 session 計算授權結果
 * 6. useEffect 專責處理副作用（導航和提示）
 * 
 * 使用方式：
 * ```tsx
 * const { user, isLoading, isAuthorized } = useAdminAuth();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAuthorized) return null;
 * 
 * // 已驗證的管理員內容
 * return <AdminContent />;
 * ```
 * 
 * 最佳實踐優勢：
 * - 消除冗餘的 useState，減少狀態管理複雜度
 * - 直接從 session 狀態計算授權結果，避免狀態同步問題
 * - useEffect 只負責副作用，職責單一且清晰
 * - 優化的依賴項管理，提升效能和可預測性
 */
export function useAdminAuth() {
  const { data: session, status } = useSession({
    required: true, // 保留此關鍵設定
  });
  const router = useRouter();

  const isLoading = status === "loading";
  const user = session?.user;

  // 直接從 session 狀態計算授權結果，而不是使用 useState
  const isAuthorized = user?.isAdmin === true;

  useEffect(() => {
    // useEffect 現在只負責處理「副作用」，即不滿足條件時的導航和提示
    // 當 session 加載完畢，且用戶已確認存在但不是管理員時，執行副作用
    if (!isLoading && session && !isAuthorized) {
      toast.error("權限不足", {
        description: "您沒有權限訪問此頁面，將您導回儀表板。",
      });
      router.replace("/dashboard");
    }
  }, [isLoading, session, isAuthorized, router]); // 依賴項更清晰

  // 注意：即使 isAuthorized 為 false，我們依然回傳 isLoading
  // 讓呼叫方可以優先處理加載狀態，避免在 session 解析完成前就判斷權限
  return {
    user,
    isLoading,
    // 只有在非加載狀態下，isAuthorized 的值才有最終意義
    isAuthorized: !isLoading && isAuthorized,
  };
} 