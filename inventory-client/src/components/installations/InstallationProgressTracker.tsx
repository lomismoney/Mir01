"use client";

import React from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDate } from "@/lib/dateHelpers";
import { InstallationWithRelations, InstallationStatus } from "@/types/installation";
import { cn } from "@/lib/utils";

interface InstallationProgressTrackerProps {
  installation: InstallationWithRelations;
  variant?: "compact" | "full";
}

/**
 * 安裝進度追蹤組件
 * 
 * 類似電商平台的物流追蹤，顯示安裝流程的各個階段
 */
export function InstallationProgressTracker({ 
  installation, 
  variant = "compact" 
}: InstallationProgressTrackerProps) {
  
  // 定義安裝流程階段
  const stages = [
    {
      key: 'pending',
      label: '待排程',
      icon: '📋',
      time: installation.created_at,
      description: '安裝單已建立'
    },
    {
      key: 'scheduled',
      label: '已排程',
      icon: '📅',
      time: installation.scheduled_date,
      description: installation.installer ? `分配給 ${installation.installer.name}` : '等待分配師傅'
    },
    {
      key: 'in_progress',
      label: '進行中',
      icon: '🚧',
      time: installation.actual_start_time,
      description: '安裝作業執行中'
    },
    {
      key: 'completed',
      label: '已完成',
      icon: '✅',
      time: installation.actual_end_time,
      description: '安裝作業完成'
    }
  ];

  // 取消狀態特殊處理
  if (installation.status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/20">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs">
          ✕
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-destructive">已取消</div>
          <div className="text-xs text-muted-foreground">
            {formatDate.shortDateTime(installation.created_at)}
          </div>
        </div>
      </div>
    );
  }

  // 確定當前階段索引
  const currentStageIndex = stages.findIndex(stage => stage.key === installation.status);

  if (variant === "compact") {
    return (
      <div className="w-full space-y-2">
        {/* 進度條 */}
        <div className="flex items-center gap-2">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <React.Fragment key={stage.key}>
                {/* 階段圓點 */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full border text-xs transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent 
                    ? "bg-secondary border-primary text-secondary-foreground" 
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {isCompleted ? '✓' : stage.icon}
                </div>
                
                {/* 連接線 */}
                {index < stages.length - 1 && (
                  <div className={cn(
                    "flex-1 h-px transition-colors",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* 階段標籤 */}
        <div className="flex items-start">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <React.Fragment key={`label-${stage.key}`}>
                <div className="flex flex-col items-center space-y-1 min-w-0 flex-1">
                  <div className={cn(
                    "text-xs font-medium text-center",
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {stage.time && isActive ? (
                      formatDate.monthDay(stage.time)
                    ) : (
                      "--/--"
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // 完整版本 (full variant)
  return (
    <div className="w-full">
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isActive = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          
          return (
            <div key={stage.key} className="flex items-start gap-3">
              {/* 時間軸線條 */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border text-sm transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent 
                    ? "bg-secondary border-primary text-secondary-foreground" 
                    : "bg-muted border-border text-muted-foreground"
                )}>
                  {isCompleted ? '✓' : stage.icon}
                </div>
                
                {/* 垂直連接線 */}
                {index < stages.length - 1 && (
                  <div className={cn(
                    "w-px h-6 mt-2 transition-colors",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
              
              {/* 階段內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium text-sm transition-colors",
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </h4>
                  
                  {stage.time && (
                    <time className="text-xs text-muted-foreground">
                      {formatDate.fullDateTime(stage.time)}
                    </time>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 