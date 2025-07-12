import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Package, 
  Truck, 
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useEnhancedBatchUpdateOrderStatus } from '@/hooks/mutations/useBatchMutations';
import { useErrorHandler } from '@/hooks';

interface BatchOrderOperationsProps {
  selectedOrderIds: number[];
  onComplete?: () => void;
}

interface OperationResult {
  operation: string;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * 批量訂單操作面板
 * 
 * 提供訂單的批量處理功能，包括：
 * - 批量更新狀態
 * - 批量出貨
 * - 批量確認付款
 * - 批量導出
 */
export function BatchOrderOperations({
  selectedOrderIds,
  onComplete,
}: BatchOrderOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<OperationResult[]>([]);
  
  // 統一錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();

  const batchUpdateStatus = useEnhancedBatchUpdateOrderStatus();

  // 處理進度更新
  const handleProgress = (completed: number, total: number) => {
    setProgress({ current: completed, total });
  };

  // 批量標記為已出貨
  const handleBatchShip = async () => {
    setCurrentOperation('批量出貨');
    setProgress({ current: 0, total: selectedOrderIds.length });

    try {
      const result = await batchUpdateStatus.mutateAsync({
        orderIds: selectedOrderIds,
        updates: { shipping_status: 'shipped' },
        trackProgress: handleProgress,
      });

      setResults(prev => [...prev, {
        operation: '批量出貨',
        succeeded: result.succeeded.length,
        failed: result.failed.length,
        errors: result.failed.map(f => f.error),
      }]);

      if (result.failed.length === 0) {
        handleSuccess(`成功將 ${result.succeeded.length} 個訂單標記為已出貨`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setCurrentOperation(null);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 批量確認付款
  const handleBatchConfirmPayment = async () => {
    setCurrentOperation('批量確認付款');
    setProgress({ current: 0, total: selectedOrderIds.length });

    try {
      const result = await batchUpdateStatus.mutateAsync({
        orderIds: selectedOrderIds,
        updates: { payment_status: 'paid' },
        trackProgress: handleProgress,
      });

      setResults(prev => [...prev, {
        operation: '批量確認付款',
        succeeded: result.succeeded.length,
        failed: result.failed.length,
        errors: result.failed.map(f => f.error),
      }]);

      if (result.failed.length === 0) {
        handleSuccess(`成功確認 ${result.succeeded.length} 個訂單的付款`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setCurrentOperation(null);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 批量標記為已完成
  const handleBatchComplete = async () => {
    setCurrentOperation('批量完成');
    setProgress({ current: 0, total: selectedOrderIds.length });

    try {
      const result = await batchUpdateStatus.mutateAsync({
        orderIds: selectedOrderIds,
        updates: { 
          shipping_status: 'delivered',
          payment_status: 'paid',
        },
        trackProgress: handleProgress,
      });

      setResults(prev => [...prev, {
        operation: '批量完成',
        succeeded: result.succeeded.length,
        failed: result.failed.length,
        errors: result.failed.map(f => f.error),
      }]);

      if (result.failed.length === 0) {
        handleSuccess(`成功將 ${result.succeeded.length} 個訂單標記為已完成`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setCurrentOperation(null);
      setProgress({ current: 0, total: 0 });
      if (onComplete) onComplete();
    }
  };

  // 批量導出（示例）
  const handleBatchExport = async () => {
    setCurrentOperation('批量導出');
    
    // 模擬導出過程
    handleSuccess('批量導出功能即將推出');
    
    setCurrentOperation(null);
  };

  const isProcessing = !!currentOperation;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedOrderIds.length === 0}
        >
          <Package className="h-4 w-4 mr-2" />
          批量操作 ({selectedOrderIds.length})
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>批量訂單操作</SheetTitle>
          <SheetDescription>
            已選擇 {selectedOrderIds.length} 個訂單進行批量操作
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* 操作按鈕 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={handleBatchShip}
              disabled={isProcessing}
            >
              <Truck className="h-6 w-6 mb-2" />
              <span>批量出貨</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={handleBatchConfirmPayment}
              disabled={isProcessing}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              <span>確認付款</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={handleBatchComplete}
              disabled={isProcessing}
            >
              <CheckCircle2 className="h-6 w-6 mb-2" />
              <span>標記完成</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-24 flex-col"
              onClick={handleBatchExport}
              disabled={isProcessing}
            >
              <FileSpreadsheet className="h-6 w-6 mb-2" />
              <span>批量導出</span>
            </Button>
          </div>

          {/* 進度顯示 */}
          {isProcessing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {currentOperation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>進度</span>
                    <span>{progress.current} / {progress.total}</span>
                  </div>
                  <Progress 
                    value={(progress.current / progress.total) * 100} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作結果 */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">操作結果</h3>
              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {result.operation}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-600">
                          成功 {result.succeeded}
                        </Badge>
                        {result.failed > 0 && (
                          <Badge variant="destructive">
                            失敗 {result.failed}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {result.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {result.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm text-red-600"
                          >
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 提示信息 */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">批量操作說明</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 批量出貨：將選中訂單的物流狀態更新為「已出貨」</li>
              <li>• 確認付款：將選中訂單的付款狀態更新為「已付款」</li>
              <li>• 標記完成：將訂單標記為已送達且已付款</li>
              <li>• 批量導出：導出選中訂單的詳細信息（即將推出）</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}