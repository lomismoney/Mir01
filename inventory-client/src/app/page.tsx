import { redirect } from "next/navigation";

/**
 * 根路徑頁面
 *
 * 這個頁面只是作為導航的橋樑，根據中間件的邏輯，
 * 用戶將被自動重定向到儀表板或登入頁面。
 * 但為了確保 Next.js 能正確處理路由，我們提供這個頁面作為後備。
 */
export default function RootPage() {
  // 如果中間件未能處理重定向，默認重定向到登入頁
  redirect("/login");

  // 以下代碼不會執行，但為了類型安全而保留
  return null;
}
