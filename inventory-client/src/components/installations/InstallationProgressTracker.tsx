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
      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
        <span className="text-lg">❌</span>
        <div className="flex-1">
          <div className="font-medium text-destructive text-sm">已取消</div>
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
      <div className="w-full space-y-3">
        {/* 第一行：主要進度條 */}
        <div className="flex items-center">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <React.Fragment key={stage.key}>
                {/* 階段圓點 */}
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs transition-all duration-300 z-10",
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white shadow-md"
                    : isActive 
                    ? "bg-primary border-primary text-primary-foreground shadow-md" 
                    : "bg-background border-muted-foreground/30 text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/30 ring-offset-1"
                )}>
                  <span className="text-xs">
                    {isCompleted ? '✓' : stage.icon}
                  </span>
                  
                  {/* 脈動效果 - 當前階段 */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  )}
                </div>
                
                {/* 連接線 */}
                {index < stages.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 relative">
                    <div className={cn(
                      "absolute inset-0 transition-all duration-500",
                      isActive && index < currentStageIndex
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    )} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* 第二行：階段標籤 */}
        <div className="flex items-start">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <React.Fragment key={`label-${stage.key}`}>
                <div className="flex flex-col items-center space-y-0.5 w-10">
                  <div className={cn(
                    "font-medium transition-colors duration-300 text-xs text-center",
                    isCompleted
                      ? "text-green-600"
                      : isCurrent 
                      ? "text-primary" 
                      : isActive 
                      ? "text-foreground" 
                      : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </div>
                  {/* 顯示對應階段的時間 */}
                  <div className="text-xs text-muted-foreground/70 min-h-[14px] text-center">
                    {stage.time && isActive ? (
                      formatDate.monthDay(stage.time)
                    ) : (
                      "--/--"
                    )}
                  </div>
                </div>
                
                {/* 標籤間的空間佔位 */}
                {index < stages.length - 1 && (
                  <div className="flex-1" />
                )}
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
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm transition-all duration-300",
                  isCompleted 
                    ? "bg-green-500 border-green-500 text-white shadow-md" 
                    : isActive 
                    ? "bg-primary border-primary text-primary-foreground shadow-md" 
                    : "bg-background border-muted-foreground/30 text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/30 ring-offset-2"
                )}>
                  {isCompleted ? '✓' : stage.icon}
                </div>
                
                {/* 垂直連接線 */}
                {index < stages.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-8 mt-2 transition-all duration-500",
                    isActive ? "bg-primary" : "bg-muted-foreground/20"
                  )} />
                )}
              </div>
              
              {/* 階段內容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium text-sm transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground"
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