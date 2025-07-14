"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDate } from "@/lib/dateHelpers";
import { cn } from "@/lib/utils";
import { PurchaseStatus, PURCHASE_STATUS_LABELS } from "@/types/purchase";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  Package, 
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

interface PurchaseWithRelations {
  id: number;
  order_number: string;
  status: PurchaseStatus;
  created_at: string;
  purchased_at?: string | null;
  confirmed_at?: string | null;
  shipped_at?: string | null;
  received_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  store?: {
    id: number;
    name: string;
  };
  supplier?: {
    id: number;
    name: string;
  };
  items?: {
    id: number;
    quantity: number;
    received_quantity?: number;
    receipt_status?: string;
    // 回退字段（扁平結構）
    product_name?: string;
    sku?: string;
    // 嵌套結構（優先使用）
    product_variant?: {
      id: number;
      sku: string;
      product?: {
        id: number;
        name: string;
      };
    };
  }[];
}

interface PurchaseProgressTrackerProps {
  purchase: PurchaseWithRelations;
  variant?: "compact" | "full";
}

/**
 * 進貨進度追蹤組件
 * 
 * 類似電商平台的物流追蹤，顯示進貨流程的各個階段
 * 包含：已下單 -> 已確認 -> 運輸中 -> 已收貨 -> 已完成
 */
export function PurchaseProgressTracker({ 
  purchase, 
  variant = "compact" 
}: PurchaseProgressTrackerProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // 定義進貨流程階段
  const stages = [
    {
      key: 'pending',
      label: '已下單',
      icon: '📋',
      time: purchase.created_at,
      description: '進貨單已建立'
    },
    {
      key: 'confirmed',
      label: '已確認',
      icon: '✅',
      time: purchase.confirmed_at || purchase.purchased_at,
      description: purchase.supplier ? `供應商：${purchase.supplier.name}` : '等待供應商確認'
    },
    {
      key: 'in_transit',
      label: '運輸中',
      icon: '🚚',
      time: purchase.shipped_at,
      description: '商品運送中'
    },
    {
      key: 'received',
      label: '已收貨',
      icon: '📦',
      time: purchase.received_at,
      description: '商品已送達倉庫'
    },
    {
      key: 'completed',
      label: '已完成',
      icon: '🎉',
      time: purchase.completed_at,
      description: '進貨流程完成'
    }
  ];

  // 取消狀態特殊處理
  if (purchase.status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
        <span className="text-lg">❌</span>
        <div className="flex-1">
          <div className="font-medium text-destructive text-sm">已取消</div>
          <div className="text-xs text-muted-foreground">
            {purchase.cancelled_at && formatDate.shortDateTime(purchase.cancelled_at)}
          </div>
        </div>
      </div>
    );
  }

  // 部分收貨狀態處理
  const isPartiallyReceived = purchase.status === 'partially_received';
  
  // 計算部分收貨統計信息
  const getReceiptStatistics = () => {
    if (!purchase.items || purchase.items.length === 0) {
      return null;
    }

    const totalItems = purchase.items.length;
    const fullyReceivedItems = purchase.items.filter(item => 
      (item.received_quantity || 0) >= item.quantity
    ).length;
    const partiallyReceivedItems = purchase.items.filter(item => 
      (item.received_quantity || 0) > 0 && (item.received_quantity || 0) < item.quantity
    ).length;
    const pendingItems = purchase.items.filter(item => 
      (item.received_quantity || 0) === 0
    ).length;

    const totalOrdered = purchase.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = purchase.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
    const receiptProgress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;

    return {
      totalItems,
      fullyReceivedItems,
      partiallyReceivedItems,
      pendingItems,
      totalOrdered,
      totalReceived,
      receiptProgress,
    };
  };

  const receiptStats = getReceiptStatistics();
  
  // 確定當前階段索引
  let currentStageIndex = 0;
  switch (purchase.status) {
    case 'pending':
      currentStageIndex = 0;
      break;
    case 'confirmed':
      currentStageIndex = 1;
      break;
    case 'in_transit':
      currentStageIndex = 2;
      break;
    case 'received':
    case 'partially_received':
      currentStageIndex = 3;
      break;
    case 'completed':
      currentStageIndex = 4;
      break;
    default:
      currentStageIndex = 0;
  }

  if (variant === "compact") {
    return (
      <div className="w-full space-y-3">
        {/* 第一行：主要進度條 */}
        <div className="flex items-center">
          {stages.map((stage, index) => {
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isPartialStatus = isPartiallyReceived && index === 3; // 部分收貨狀態
            
            return (
              <React.Fragment key={stage.key}>
                {/* 階段圓點 */}
                <div className={cn(
                  "relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs transition-all duration-300 z-10",
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white shadow-md"
                    : isPartialStatus
                    ? "bg-orange-500 border-orange-500 text-white shadow-md"
                    : isActive 
                    ? "bg-primary border-primary text-primary-foreground shadow-md" 
                    : "bg-background border-muted-foreground/30 text-muted-foreground",
                  isCurrent && "ring-2 ring-primary/30 ring-offset-1",
                  isPartialStatus && "ring-2 ring-orange-500/30 ring-offset-1"
                )}>
                  <span className="text-xs">
                    {isCompleted || isPartialStatus ? '✓' : stage.icon}
                  </span>
                  
                  {/* 脈動效果 - 當前階段 */}
                  {(isCurrent || isPartialStatus) && (
                    <div className={cn(
                      "absolute inset-0 rounded-full animate-ping",
                      isPartialStatus ? "bg-orange-500/20" : "bg-primary/20"
                    )} />
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
            const isPartialStatus = isPartiallyReceived && index === 3;
            
            return (
              <React.Fragment key={`label-${stage.key}`}>
                <div className="flex flex-col items-center space-y-0.5 w-10">
                  <div className={cn(
                    "font-medium transition-colors duration-300 text-xs text-center",
                    isCompleted
                      ? "text-green-600"
                      : isPartialStatus
                      ? "text-orange-600"
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
        
        {/* 部分收貨狀態提示 */}
        {isPartiallyReceived && receiptStats && (
          <div className="space-y-3">
            {/* 統計信息 */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">部分收貨狀態</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200 h-auto p-1"
                >
                  {showDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              {/* 整體進度 */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-orange-700 dark:text-orange-300">收貨進度</span>
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    {receiptStats.totalReceived}/{receiptStats.totalOrdered} 件
                  </span>
                </div>
                <Progress value={receiptStats.receiptProgress} className="h-2 bg-orange-100 dark:bg-orange-900/50" />
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">完成: {receiptStats.fullyReceivedItems}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-700 dark:text-orange-300">部分: {receiptStats.partiallyReceivedItems}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">待收: {receiptStats.pendingItems}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 項目詳情（可折疊） */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleContent className="space-y-2">
                {purchase.items?.map((item) => {
                  const itemProgress = item.quantity > 0 ? 
                    ((item.received_quantity || 0) / item.quantity) * 100 : 0;
                  
                  // 安全地獲取商品信息（後端現在應該提供正確的嵌套結構）
                  const productName = item.product_variant?.product?.name || item.product_name || '未知商品';
                  const productSku = item.product_variant?.sku || item.sku || '未知SKU';
                  
                  return (
                    <div key={item.id} className="bg-background dark:bg-card/50 border border-border dark:border-border/50 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="text-xs font-medium text-foreground">
                            {productName}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            SKU: {productSku}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            itemProgress === 100 ? "default" :
                            itemProgress > 0 ? "secondary" : "outline"
                          }
                          className={cn(
                            "text-xs",
                            itemProgress === 100 && "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600",
                            itemProgress > 0 && itemProgress < 100 && "bg-orange-500 dark:bg-orange-600 text-white hover:bg-orange-600 dark:hover:bg-orange-700"
                          )}
                        >
                          {itemProgress === 100 ? "已收貨" :
                           itemProgress > 0 ? "部分收貨" : "待收貨"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>收貨進度</span>
                          <span className="font-medium text-foreground">{item.received_quantity || 0}/{item.quantity}</span>
                        </div>
                        <Progress 
                          value={itemProgress} 
                          className="h-1.5 bg-muted dark:bg-muted/50" 
                        />
                      </div>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
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
          const isPartialStatus = isPartiallyReceived && index === 3;
          
          return (
            <div key={stage.key} className="flex items-start gap-3">
              {/* 時間軸線條 */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm transition-all duration-300",
                  isCompleted 
                    ? "bg-green-500 border-green-500 text-white shadow-md" 
                    : isPartialStatus
                    ? "bg-orange-500 border-orange-500 text-white shadow-md"
                    : isActive 
                    ? "bg-primary border-primary text-primary-foreground shadow-md" 
                    : "bg-background border-muted-foreground/30 text-muted-foreground",
                  (isCurrent || isPartialStatus) && "ring-2 ring-primary/30 ring-offset-2"
                )}>
                  {isCompleted || isPartialStatus ? '✓' : stage.icon}
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
                    {isPartialStatus && (
                      <span className="ml-2 text-xs text-orange-600">(部分收貨)</span>
                    )}
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
      
      {/* 部分收貨狀態詳細說明 */}
      {isPartiallyReceived && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <span className="text-sm font-medium">⚠️ 部分收貨狀態</span>
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
            部分商品已成功收貨並入庫，仍有商品待供應商發貨或運輸中。
          </p>
        </div>
      )}
    </div>
  );
} 