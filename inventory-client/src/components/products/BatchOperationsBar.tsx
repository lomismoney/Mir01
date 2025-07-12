import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Trash2, 
  MoreHorizontal, 
  Package, 
  PackageX,
  Edit,
  Download,
  Upload,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  useBatchDeleteProducts, 
  useBatchUpdateProductStatus 
} from '@/hooks/mutations/useBatchMutations';

interface BatchOperationsBarProps {
  selectedCount: number;
  selectedIds: number[];
  onClearSelection: () => void;
}

/**
 * 批量操作工具欄
 * 
 * 提供產品列表的批量操作功能
 */
export function BatchOperationsBar({
  selectedCount,
  selectedIds,
  onClearSelection,
}: BatchOperationsBarProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'delete' | 'activate' | 'deactivate' | null;
  }>({ open: false, action: null });
  
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const batchDelete = useBatchDeleteProducts();
  const batchUpdateStatus = useBatchUpdateProductStatus();

  // 處理批量刪除
  const handleBatchDelete = async () => {
    setProgress({ current: 0, total: selectedIds.length });
    
    try {
      await batchDelete.mutateAsync(selectedIds);
      onClearSelection();
    } finally {
      setProgress({ current: 0, total: 0 });
      setConfirmDialog({ open: false, action: null });
    }
  };

  // 處理批量狀態更新
  const handleBatchStatusUpdate = async (status: 'active' | 'inactive') => {
    setProgress({ current: 0, total: selectedIds.length });
    
    try {
      await batchUpdateStatus.mutateAsync({
        productIds: selectedIds,
        status,
      });
      onClearSelection();
    } finally {
      setProgress({ current: 0, total: 0 });
      setConfirmDialog({ open: false, action: null });
    }
  };

  // 確認對話框內容
  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case 'delete':
        return {
          title: '確認批量刪除',
          description: `您確定要刪除選中的 ${selectedCount} 個產品嗎？此操作無法撤銷。`,
          action: handleBatchDelete,
          variant: 'destructive' as const,
        };
      case 'activate':
        return {
          title: '確認批量啟用',
          description: `您確定要啟用選中的 ${selectedCount} 個產品嗎？`,
          action: () => handleBatchStatusUpdate('active'),
          variant: 'default' as const,
        };
      case 'deactivate':
        return {
          title: '確認批量停用',
          description: `您確定要停用選中的 ${selectedCount} 個產品嗎？`,
          action: () => handleBatchStatusUpdate('inactive'),
          variant: 'default' as const,
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();
  const isProcessing = batchDelete.isPending || batchUpdateStatus.isPending;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            已選擇 {selectedCount} 個項目
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            清除選擇
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* 批量刪除 */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDialog({ open: true, action: 'delete' })}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            批量刪除
          </Button>

          {/* 更多操作 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <MoreHorizontal className="h-4 w-4 mr-2" />
                更多操作
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>批量操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'activate' })}
              >
                <Package className="h-4 w-4 mr-2" />
                批量啟用
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'deactivate' })}
              >
                <PackageX className="h-4 w-4 mr-2" />
                批量停用
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem disabled>
                <Edit className="h-4 w-4 mr-2" />
                批量編輯（即將推出）
              </DropdownMenuItem>
              
              <DropdownMenuItem disabled>
                <Download className="h-4 w-4 mr-2" />
                導出選中項目（即將推出）
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 進度條 */}
      {progress.total > 0 && (
        <div className="mt-2 p-4 bg-background rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">處理進度</span>
            <span className="text-sm text-muted-foreground">
              {progress.current} / {progress.total}
            </span>
          </div>
          <Progress 
            value={(progress.current / progress.total) * 100} 
            className="h-2"
          />
        </div>
      )}

      {/* 確認對話框 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => 
          !isProcessing && setConfirmDialog({ open, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={dialogContent?.action}
              disabled={isProcessing}
              className={
                dialogContent?.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isProcessing ? '處理中...' : '確認'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * 批量操作結果顯示組件
 */
export function BatchOperationResult({
  succeeded,
  failed,
  onClose,
}: {
  succeeded: number;
  failed: Array<{ id: string; error: string }>;
  onClose: () => void;
}) {
  const total = succeeded + failed.length;
  const successRate = (succeeded / total) * 100;

  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">批量操作結果</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          關閉
        </Button>
      </div>

      {/* 統計信息 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-muted-foreground">總計</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{succeeded}</div>
          <div className="text-sm text-muted-foreground">成功</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{failed.length}</div>
          <div className="text-sm text-muted-foreground">失敗</div>
        </div>
      </div>

      {/* 成功率 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm">成功率</span>
          <span className="text-sm font-medium">
            {successRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={successRate} className="h-2" />
      </div>

      {/* 失敗詳情 */}
      {failed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">失敗詳情</h4>
          <div className="space-y-2 max-h-40 overflow-auto">
            {failed.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm"
              >
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium">ID: {item.id}</div>
                  <div className="text-red-600">{item.error}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}