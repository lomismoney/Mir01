"use client";

import React from "react";
import { useParams } from "next/navigation";
import { InstallationDetailComponent } from "@/components/installations";

/**
 * 安裝單詳情頁面
 * 
 * 顯示特定安裝單的完整資訊，包括：
 * - 安裝單基本資訊
 * - 客戶資訊
 * - 安裝項目清單
 * - 安裝進度追蹤
 * - 操作記錄
 */
export default function InstallationDetailPage() {
  const params = useParams();
  const installationId = parseInt(params.id as string, 10);

  if (!installationId || isNaN(installationId)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">錯誤</h2>
        <p className="text-muted-foreground mt-2">無效的安裝單 ID</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題區 */}
      <div>
        <h2 className="text-2xl font-bold">
          安裝單詳情
        </h2>
        <p className="text-muted-foreground">
          查看安裝單的詳細資訊與進度狀態。
        </p>
      </div>

      {/* 安裝單詳情組件 */}
      <InstallationDetailComponent installationId={installationId} />
    </div>
  );
} 