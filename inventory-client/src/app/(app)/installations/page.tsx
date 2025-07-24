"use client";

import React from "react";
import { InstallationClientComponent } from "@/components/installations/InstallationClientComponent";
import { 
  Card, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useInstallations } from "@/hooks/queries/installations/useInstallations";

/**
 * 安裝管理主頁面（美化版）
 * 
 * 重新設計的安裝管理頁面，具有以下特色：
 * 1. 現代化的頁面佈局和視覺設計
 * 2. 統計卡片展示安裝單數據概覽
 * 3. 優化的表格設計和互動體驗
 * 4. 美觀的對話框和表單設計
 * 5. 響應式設計和微互動效果
 * 
 * 提供安裝單的完整管理介面，包括：
 * - 安裝單列表檢視
 * - 篩選與搜尋功能
 * - 狀態管理操作
 * - 師傅分配功能
 * - 快速預覽與編輯
 * - 統計數據概覽
 */
export default function InstallationsPage() {
  // 取得所有安裝單數據用於統計計算
  const { data: installationsResponse, isLoading } = useInstallations();
  const allInstallationsData = installationsResponse?.data || [];

  /**
   * 計算安裝單統計數據
   * 
   * @returns 包含各種安裝單統計信息的物件
   */
  const getInstallationStats = () => {
    const totalInstallations = allInstallationsData.length;
    
    // 按狀態分組統計
    const statusStats = allInstallationsData.reduce((acc, installation) => {
      const status = installation.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 統計今日安裝數量
    const today = new Date().toISOString().split('T')[0];
    const todayInstallations = allInstallationsData.filter(installation => {
      const installDate = installation.scheduled_date || installation.created_at;
      return installDate && installDate.split('T')[0] === today;
    }).length;

    // 統計已分配師傅的安裝單
    const assignedInstallations = allInstallationsData.filter(installation => 
      installation.installer_id
    ).length;

    return {
      total: totalInstallations,
      pending: statusStats.pending || 0,
      in_progress: statusStats.in_progress || 0,
      completed: statusStats.completed || 0,
      cancelled: statusStats.cancelled || 0,
      today: todayInstallations,
      assigned: assignedInstallations,
    };
  };

  const stats = getInstallationStats();
  
  // 計算百分比變化（模擬數據，實際應用中可從API獲取）
  const percentageChanges = {
    total: 12.5,
    pending: -8.3,
    in_progress: 25.7,
    completed: 18.9,
  };

  return (
    <div className="space-y-6">
      {/* 📱 頁面標題區域 - 與用戶頁面一致的簡潔設計 */}
      <div>
        <h2 className="text-2xl font-bold">
          安裝管理
        </h2>
        <p className="text-muted-foreground">
          管理您的所有安裝單、分配安裝師傅、追蹤安裝進度與狀態。
        </p>
      </div>

      {/* 🎯 統計卡片區域 - 採用簡潔的現代化設計 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              總安裝單數
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.total}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                系統中所有安裝訂單
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              待處理
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.pending}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                等待安排的安裝單
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingDown className="h-3 w-3 mr-1" />
                {percentageChanges.pending}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              進行中
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.in_progress}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                正在安裝中的訂單
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.in_progress}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              已完成
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.completed}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                成功完成的安裝
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.completed}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 📊 安裝管理表格區域 */}
      <InstallationClientComponent />
    </div>
  );
} 