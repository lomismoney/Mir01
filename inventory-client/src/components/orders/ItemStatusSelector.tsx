'use client';

import React from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
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
 * - 下拉選單狀態選擇
 * - 載入狀態視覺反饋
 * - 當前狀態 Badge 顯示
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
   * 可用的訂單項目狀態選項
   * 對應後端 UpdateOrderItemStatusRequest 驗證規則
   */
  const statusOptions = [
    { value: '待處理', label: '待處理', variant: 'outline' as const },
    { value: '已叫貨', label: '已叫貨', variant: 'secondary' as const },
    { value: '已出貨', label: '已出貨', variant: 'default' as const },
    { value: '完成', label: '完成', variant: 'success' as const },
  ];

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

  /**
   * 根據狀態值獲取對應的 Badge variant
   * 
   * @param {string} status - 狀態值
   * @returns {string} Badge variant
   */
  const getStatusVariant = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.variant || 'outline';
  };

  // 如果正在載入，顯示載入狀態的 Badge
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant="secondary" 
          className="whitespace-nowrap animate-pulse"
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          更新中...
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* 當前狀態 Badge */}
      <Badge 
        variant={getStatusVariant(item.status)}
        className="whitespace-nowrap text-xs"
      >
        {item.status}
      </Badge>
      
      {/* 狀態選擇下拉選單 */}
      <Select
        value={item.status}
        onValueChange={handleStatusChange}
        disabled={isLoading}
      >
        <SelectTrigger 
          size="sm" 
          className="w-[100px] h-7 text-xs border-dashed border-muted-foreground/40 hover:border-muted-foreground/80 transition-colors"
        >
          <SelectValue placeholder="選擇狀態" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </SelectTrigger>
        
        <SelectContent align="center" className="min-w-[120px]">
          {statusOptions.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Badge 
                  variant={option.variant}
                  className="text-xs scale-90"
                >
                  {option.label}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 