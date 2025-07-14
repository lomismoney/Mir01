import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 認證檢查 Hook
 * 
 * 提供簡單的認證狀態檢查和自動重定向功能
 * 避免在每個受保護的頁面重複相同的邏輯
 */
export function useAuthCheck(redirectTo: string = "/login") {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 如果明確未登入，重定向到指定頁面
    if (status === "unauthenticated") {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}