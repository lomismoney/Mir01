'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

/**
 * 建立 QueryClient 實例
 * 配置 React Query 的全域設定
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 設定查詢的預設選項
            staleTime: 5 * 60 * 1000, // 5 分鐘
            gcTime: 10 * 60 * 1000, // 10 分鐘 (之前叫 cacheTime)
            retry: 3, // 失敗時重試 3 次
            refetchOnWindowFocus: false, // 視窗聚焦時不自動重新獲取
        },
        mutations: {
            // 設定變更操作的預設選項
            retry: 1, // 失敗時重試 1 次
        },
    },
});

/**
 * React Query 提供者組件
 * 為整個應用程式提供資料獲取和快取功能
 * 
 * @param children - 子組件
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
} 