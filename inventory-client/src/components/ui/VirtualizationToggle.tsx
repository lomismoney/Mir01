import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Table, BarChart3, Settings, Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VirtualizationToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  dataCount: number;
  dataType?: string;
  showMetrics?: boolean;
  onMetricsToggle?: (show: boolean) => void;
  className?: string;
}

/**
 * 虛擬化切換控制組件
 * 
 * 提供統一的虛擬化開關和性能指標顯示
 * 可在產品、訂單等不同列表頁面復用
 */
export function VirtualizationToggle({
  isEnabled,
  onToggle,
  dataCount,
  dataType = '項目',
  showMetrics = true,
  onMetricsToggle,
  className = '',
}: VirtualizationToggleProps) {
  // 性能分析
  const performanceAnalysis = React.useMemo(() => {
    // 計算建議和效益
    const memoryEstimate = dataCount > 100 ? 
      Math.round((dataCount - 20) / dataCount * 100) : 0;
    
    const performanceGain = dataCount > 1000 ? 'high' : 
                           dataCount > 500 ? 'medium' : 
                           dataCount > 100 ? 'low' : 'none';
    
    const recommendation = dataCount > 1000 ? {
      level: 'critical',
      message: '強烈建議啟用',
      reason: '大數據集，虛擬化可大幅提升性能',
      color: 'destructive'
    } : dataCount > 500 ? {
      level: 'warning', 
      message: '建議啟用',
      reason: '中等數據量，虛擬化有明顯效果',
      color: 'default'
    } : dataCount > 100 ? {
      level: 'info',
      message: '可選擇啟用',
      reason: '小幅性能提升，取決於使用場景',
      color: 'secondary'
    } : {
      level: 'success',
      message: '無需虛擬化', 
      reason: '數據量小，標準表格已足夠',
      color: 'outline'
    };

    return {
      memoryEstimate,
      performanceGain,
      recommendation,
    };
  }, [dataCount]);

  return (
    <Card className={`border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Settings className="h-5 w-5" />
          虛擬化控制面板
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 性能建議警告 */}
        {performanceAnalysis.recommendation.level === 'critical' && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              檢測到大量數據（{dataCount.toLocaleString()} 個{dataType}），
              建議啟用虛擬化以獲得最佳性能。
            </AlertDescription>
          </Alert>
        )}

        {/* 性能指標面板 */}
        {showMetrics && (
          <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                性能分析
              </h4>
              <Badge variant={performanceAnalysis.recommendation.color as any}>
                {performanceAnalysis.recommendation.level.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {dataCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">總{dataType}數</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {performanceAnalysis.memoryEstimate}%
                </div>
                <div className="text-xs text-muted-foreground">預估記憶體節省</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {performanceAnalysis.performanceGain === 'high' ? '高' :
                   performanceAnalysis.performanceGain === 'medium' ? '中' :
                   performanceAnalysis.performanceGain === 'low' ? '低' : '無'}
                </div>
                <div className="text-xs text-muted-foreground">性能提升</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {isEnabled ? '已啟用' : '未啟用'}
                </div>
                <div className="text-xs text-muted-foreground">虛擬化狀態</div>
              </div>
            </div>
            
            <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {performanceAnalysis.recommendation.message}
              </p>
              <p className="text-muted-foreground mt-1">
                {performanceAnalysis.recommendation.reason}
              </p>
            </div>
          </div>
        )}

        {/* 控制開關區域 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <Label htmlFor="virtualization-switch" className="font-medium">
                  啟用虛擬化滾動
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                只渲染可見區域，大幅提升大數據集性能
              </p>
            </div>
            
            <Switch
              id="virtualization-switch"
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
          </div>

          {onMetricsToggle && (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <Label htmlFor="metrics-switch" className="font-medium">
                    顯示性能指標
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  展示虛擬化效果和性能數據
                </p>
              </div>
              
              <Switch
                id="metrics-switch"
                checked={showMetrics}
                onCheckedChange={onMetricsToggle}
              />
            </div>
          )}
        </div>

        {/* 快速切換按鈕 */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={!isEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggle(false)}
            className="flex-1"
          >
            <Table className="h-4 w-4 mr-2" />
            標準表格
          </Button>
          <Button
            variant={isEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggle(true)}
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            虛擬化表格
          </Button>
        </div>

        {/* 性能提示 */}
        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/50 p-3 rounded border border-blue-200 dark:border-blue-800">
          <div className="font-medium mb-1">💡 虛擬化優勢：</div>
          <ul className="space-y-1">
            <li>• 只渲染可見行，記憶體使用量恆定</li>
            <li>• 支援數萬條記錄的流暢滾動</li>
            <li>• 初始載入速度更快</li>
            <li>• 適合大數據集瀏覽和搜索</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}