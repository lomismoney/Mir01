import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * 管理員權限驗證自訂 Hook（安全強化版本）
 * 
 * 功能特性：
 * 1. 統一的權限檢查邏輯 - 單一真實來源 (Single Source of Truth)
 * 2. 自動處理未認證用戶的重新導向
 * 3. 非管理員用戶的權限阻擋與友善提示
 * 4. 優化的載入狀態管理
 * 5. 消除冗餘狀態，直接從 session 計算授權結果
 * 6. useEffect 專責處理副作用（導航和提示）
 * 7. 🔐 移除 required: true，防止客戶端錯誤 (NEW)
 * 8. 🛡️ 安全的未登入狀態處理，避免拋出異常 (NEW)
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
 * - 🔐 安全的錯誤處理，防止未登入用戶觸發客戶端異常
 */
export function useAdminAuth() {
  // 🔐 移除 required: true，讓 Hook 安全處理所有狀態
  // 這樣可以避免在未登入時拋出錯誤或重定向循環
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const user = session?.user;

  // 直接從 session 狀態計算授權結果，而不是使用 useState
  const isAuthenticated = status === "authenticated" && !!user;
  const isAuthorized = isAuthenticated && user?.isAdmin === true;

  useEffect(() => {
    // 🔐 安全的副作用處理：只在狀態確定時執行導航和提示
    if (!isLoading) {
      if (status === "unauthenticated") {
        // 未登入用戶：靜默重定向到登入頁，不顯示 toast
        // 因為 (app)/layout.tsx 已經會處理這個情況
        router.replace("/login");
      } else if (isAuthenticated && !isAuthorized) {
        // 已登入但非管理員：顯示權限不足提示並重定向
        toast.error("權限不足", {
          description: "您沒有權限訪問此頁面，將您導回儀表板。",
        });
        router.replace("/dashboard");
      }
    }
  }, [isLoading, status, isAuthenticated, isAuthorized, router]);

  // 🔐 返回安全的狀態，確保調用方可以正確處理各種情況
  return {
    user,
    isLoading,
    // 只有在非加載狀態下，且用戶已認證且是管理員時，isAuthorized 才為 true
    isAuthorized: !isLoading && isAuthorized,
    // 🔐 新增額外的狀態幫助調用方更好地處理邊界情況
    isAuthenticated: !isLoading && isAuthenticated,
    status, // 暴露原始狀態供高級用途使用
  };
} 