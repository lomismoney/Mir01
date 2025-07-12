import { useMemo } from "react";

/**
 * 入庫統計計算 Hook
 */
export function useIncomingStatistics(transactionsData: any) {
  const statistics = useMemo(() => {
    if (!transactionsData?.data) {
      return {
        todayCount: 0,
        weekCount: 0,
        totalCount: 0,
        pendingCount: 0,
      };
    }

    const transactions = transactionsData.data;
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 今日入庫次數
    const todayCount = transactions.filter((t: any) => {
      const transactionDate = new Date(t.created_at || "").toDateString();
      return transactionDate === today;
    }).length;

    // 本週入庫次數
    const weekCount = transactions.filter((t: any) => {
      const transactionDate = new Date(t.created_at || "");
      return transactionDate >= weekAgo;
    }).length;

    // 總入庫次數
    const totalCount = transactions.length;

    // 待處理入庫（如果有狀態字段的話）
    const pendingCount = transactions.filter((t: any) => 
      t.status === "pending" || t.status === "processing"
    ).length;

    return {
      todayCount,
      weekCount,
      totalCount,
      pendingCount,
    };
  }, [transactionsData]);

  return statistics;
}