/**
 * 客戶批量操作工具欄組件
 * 
 * 提供客戶批量操作功能，包括：
 * 1. 批量刪除客戶
 * 2. 選擇狀態顯示
 * 3. 操作確認對話框
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";
import { Customer } from "@/types/api-helpers";

interface CustomerBatchOperationsBarProps {
  /** 選中的客戶 */
  selectedCustomers: Customer[];
  /** 批量刪除處理函數 */
  onBatchDelete: (customerIds: number[]) => void;
  /** 清除選擇處理函數 */
  onClearSelection: () => void;
  /** 是否正在執行批量操作 */
  isBatchOperating?: boolean;
}

/**
 * 客戶批量操作工具欄組件
 */
export function CustomerBatchOperationsBar({
  selectedCustomers,
  onBatchDelete,
  onClearSelection,
  isBatchOperating = false,
}: CustomerBatchOperationsBarProps) {
  const selectedCount = selectedCustomers.length;
  const hasSelection = selectedCount > 0;

  const selectedIds = selectedCustomers.map(customer => customer.id!).filter(Boolean);

  /**
   * 處理批量刪除確認
   */
  const handleBatchDelete = () => {
    onBatchDelete(selectedIds);
  };

  /**
   * 獲取選中客戶的描述
   */
  const getSelectionDescription = () => {
    if (selectedCount <= 3) {
      return selectedCustomers.map(customer => customer.name).join('、');
    }
    return `${selectedCustomers.slice(0, 2).map(customer => customer.name).join('、')} 等 ${selectedCount} 個客戶`;
  };

  // 如果沒有選擇客戶，直接返回 null 不渲染任何內容
  if (!hasSelection) {
    return null;
  }

  return (
    <div className="bg-muted/50 border-b transition-all duration-200">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-sm">
            已選擇 {selectedCount} 個客戶
          </Badge>
          <span className="text-sm text-muted-foreground">
            {getSelectionDescription()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 批量刪除按鈕 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isBatchOperating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                批量刪除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認批量刪除客戶？</AlertDialogTitle>
                <AlertDialogDescription>
                  您即將刪除 <strong>{selectedCount}</strong> 個客戶：
                  <br />
                  <span className="font-medium">{getSelectionDescription()}</span>
                  <br />
                  <br />
                  此操作將會永久移除這些客戶的資料，且無法復原。
                  如果客戶有相關的訂單記錄，將無法刪除。
                  <br />
                  <br />
                  請確認是否要繼續？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBatchDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  確認刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* 清除選擇按鈕 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isBatchOperating}
          >
            <X className="h-4 w-4 mr-2" />
            清除選擇
          </Button>
        </div>
      </div>
    </div>
  );
}