"use client";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

/**
 * 高性能 QueryClient 配置（後台管理系統專用版本）
 *
 * 🎯 專為企業級後台管理系統設計的極致性能調優
 *
 * 核心策略：
 * 1. 激進緩存策略 - 減少不必要的 API 請求
 * 2. 智能重試機制 - 區分 4xx 和 5xx 錯誤
 * 3. 用戶體驗優化 - 消除干擾性的重新獲取
 * 4. 預加載策略 - 為懶加載和 Suspense 做準備
 * 5. 錯誤邊界整合 - 優雅的錯誤處理
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 🚀 平衡快取策略 - 後台管理系統的最佳實踐
        staleTime: 1000 * 60 * 3, // 3 分鐘數據保鮮（平衡新鮮度與性能）
        gcTime: 1000 * 60 * 30, // 30 分鐘垃圾回收（充分利用內存）

        // 🎯 智能重試策略 - 基於 HTTP 狀態碼的差異化處理
        retry: (failureCount, error) => {
          // 4xx 錯誤（客戶端錯誤）：權限、驗證問題，不應重試
          // 5xx 錯誤（服務端錯誤）：暫時性問題，允許重試
          if (error && "status" in error && typeof error.status === "number") {
            if (error.status >= 400 && error.status < 500) {
              return false; // 客戶端錯誤不重試
            }
            if (error.status >= 500) {
              return failureCount < 2; // 服務端錯誤最多重試 2 次
            }
          }
          // 網絡錯誤等其他情況，重試 3 次
          return failureCount < 3;
        },

        // 指數退避重試延遲，最大 30 秒
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // 🌟 用戶體驗優化 - 消除後台管理系統中的干擾性行為
        refetchOnWindowFocus: false, // 禁用窗口聚焦重獲（關鍵優化）
        refetchOnReconnect: "always", // 網絡重連時重獲（保證數據一致性）
        refetchOnMount: false, // 依賴 staleTime，避免不必要的重新獲取

        // ⚡ 性能優化設置
        throwOnError: true, // 啟用錯誤邊界，統一錯誤處理

        // 🔄 背景更新策略
        refetchInterval: false, // 禁用定時刷新（後台管理系統通常不需要）
        refetchIntervalInBackground: false, // 背景中不自動刷新

        // 📊 網絡狀態感知
        networkMode: "online", // 只在線上時執行查詢
      },
      mutations: {
        // 🎯 Mutation 優化配置
        retry: 1, // Mutation 只重試 1 次
        throwOnError: false, // Mutation 錯誤由組件直接處理
        networkMode: "online", // 只在線上時執行變更
      },
    },
  });
}

// 🔧 高性能客戶端管理策略
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * 智能 QueryClient 工廠函式
 *
 * 服務端渲染優化：
 * - 服務端：每次創建新實例，避免狀態污染
 * - 瀏覽器端：單例模式，最大化緩存效益
 */
function getQueryClient() {
  if (isServer) {
    // 服務端：每次創建新實例，確保 SSR 穩定性
    return makeQueryClient();
  } else {
    // 瀏覽器端：使用單例模式，保持緩存一致性
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

/**
 * React Query 提供者組件（企業級高性能版本）
 *
 * 特色功能：
 * 1. 智能客戶端管理（SSR/CSR 兼容）
 * 2. 開發工具整合（僅開發環境）
 * 3. 性能監控準備
 * 4. 錯誤邊界支援
 *
 * @param children - 子組件
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 🛠️ 開發工具（僅在開發環境顯示） */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
