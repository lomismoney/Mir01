'use client';

import React from 'react';
import { Loader2, Clock, Package, Truck, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProcessedOrderItem } from '@/types/api-helpers';

/**
 * 訂單項目狀態選擇器接口定義
 * 
 * @interface ItemStatusSelectorProps
 */
interface ItemStatusSelectorProps {
  /** 訂單項目資料 */
  item: ProcessedOrderItem;
  /** 載入狀態指示 */
  isLoading: boolean;
  /** 狀態變更回調函數 */
  onStatusChange: (itemId: number, newStatus: string) => void;
}

/**
 * 訂單項目狀態選擇器組件
 * 
 * 提供訂單項目狀態的選擇和更新功能，支援：
 * - 一體化徽章設計
 * - 載入狀態視覺反饋
 * - 樂觀更新支援
 * 
 * @component
 * @param {ItemStatusSelectorProps} props - 組件參數
 * @returns {React.ReactElement} 狀態選擇器組件
 */
export function ItemStatusSelector({ 
  item, 
  isLoading, 
  onStatusChange 
}: ItemStatusSelectorProps): React.ReactElement {
  
  /**
   * 可用的訂單項目狀態選項配置
   * 對應後端 UpdateOrderItemStatusRequest 驗證規則
   */
  const statusOptions = [
    { 
      value: '待處理', 
      label: '待處理', 
      variant: 'outline' as const,
      icon: Clock
    },
    { 
      value: '已叫貨', 
      label: '已叫貨', 
      variant: 'secondary' as const,
      icon: Package
    },
    { 
      value: '已出貨', 
      label: '已出貨', 
      variant: 'default' as const,
      icon: Truck
    },
    { 
      value: '完成', 
      label: '完成', 
      variant: 'success' as const,
      icon: CheckCircle
    },
  ];

  /**
   * 獲取當前狀態的徽章配置
   * 
   * @param {string} status - 狀態值
   * @returns {object} 狀態配置對象
   */
  const getCurrentStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  /**
   * 處理狀態變更事件
   * 
   * @param {string} newStatus - 新選擇的狀態值
   */
  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== item.status && !isLoading) {
      onStatusChange(item.id, newStatus);
    }
  };

  const currentConfig = getCurrentStatusConfig(item.status);

  return (
    <div className="flex items-center justify-center">
      {/* 一體化狀態選擇器 */}
      <Select
        value={item.status}
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-fit h-auto border-none shadow-none p-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          {isLoading ? (
            <Badge variant="outline" className="gap-1.5 pointer-events-none text-xs">
              <Loader2 className="h-3 w-3 animate-spin text-current" />
              更新中
            </Badge>
          ) : (
            <Badge 
              variant={currentConfig.variant}
              className="cursor-pointer hover:opacity-80 transition-opacity gap-1.5 text-xs"
            >
              <currentConfig.icon className="h-3 w-3 shrink-0 text-current" />
              {currentConfig.label}
            </Badge>
          )}
        </SelectTrigger>
        
        <SelectContent 
          align="center" 
          className="min-w-fit"
        >
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === item.status;
            
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer py-1.5 pl-2 pr-12 focus:bg-accent/50"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Badge 
                    variant={option.variant}
                    className="pointer-events-none text-xs"
                  >
                    {option.label}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
} 