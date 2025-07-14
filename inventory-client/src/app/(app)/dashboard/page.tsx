import { DashboardContent } from "@/components/dashboard/DashboardContent";

/**
 * 儀表板頁面（簡化版）
 *
 * 安全特性：
 * - 由 Auth.js 中間件統一保護
 * - 依賴 layout.tsx 的認證檢查
 * 
 * 簡化策略：
 * - 移除 Suspense，讓組件內部處理載入狀態
 * - 避免多層載入狀態導致的問題
 */
export default function DashboardPage() {
  return <DashboardContent />;
}