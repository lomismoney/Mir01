import React from "react";
import { InstallationClientComponent } from "@/components/installations/InstallationClientComponent";

/**
 * 安裝管理主頁面
 * 
 * 提供安裝單的完整管理介面，包括：
 * - 安裝單列表檢視
 * - 篩選與搜尋功能
 * - 狀態管理操作
 * - 師傅分配功能
 * - 快速預覽與編輯
 */
export default function InstallationsPage() {
  return (
    <div className="space-y-6">
      {/* 頁面標題區 */}
      <div>
        <h2 className="text-2xl font-bold">
          安裝管理
        </h2>
        <p className="text-muted-foreground">
          管理您的所有安裝單、分配安裝師傅、追蹤安裝進度與狀態。
        </p>
      </div>

      {/* 主要內容區 - 安裝管理組件 */}
      <InstallationClientComponent />
    </div>
  );
} 