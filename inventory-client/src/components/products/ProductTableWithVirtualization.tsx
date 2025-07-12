import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VirtualizedProductTable } from './VirtualizedProductTable';
import ProductClientComponent from './ProductClientComponent';
import { useProducts } from '@/hooks';
import { Zap, Table, BarChart3, Settings } from 'lucide-react';

/**
 * 產品表格虛擬化控制組件
 * 
 * 提供虛擬化和標準表格之間的切換功能
 * 包含性能比較和配置選項
 */
export function ProductTableWithVirtualization() {
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);
  
  const { data: products = [] } = useProducts();

  // 性能建議
  const performanceRecommendation = React.useMemo(() => {
    if (products.length > 1000) {
      return {
        level: 'critical',
        message: '強烈建議啟用虛擬化',
        reason: '數據量大，虛擬化可顯著提升性能',
        color: 'destructive'
      };
    } else if (products.length > 500) {
      return {
        level: 'warning',
        message: '建議啟用虛擬化',
        reason: '中等數據量，虛擬化有明顯效果',
        color: 'default'
      };
    } else if (products.length > 100) {
      return {
        level: 'info',
        message: '可選擇啟用虛擬化',
        reason: '小幅性能提升，取決於使用場景',
        color: 'secondary'
      };
    } else {
      return {
        level: 'success',
        message: '無需虛擬化',
        reason: '數據量小，標準表格已足夠',
        color: 'outline'
      };
    }
  }, [products.length]);

  // 切換處理
  const handleVirtualizationToggle = (enabled: boolean) => {
    setUseVirtualization(enabled);
  };

  return (
    <div className="space-y-6">
      {/* 虛擬化控制面板 */}
      <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Settings className="h-5 w-5" />
            虛擬化控制面板
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 性能建議 */}
          {showPerformanceMetrics && (
            <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  性能分析
                </h4>
                <Badge variant={performanceRecommendation.color as any}>
                  {performanceRecommendation.level.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {products.length.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">總商品數</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {products.length > 100 ? 
                      `${Math.round((products.length - 20) / products.length * 100)}%` 
                      : '0%'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">預估記憶體節省</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {useVirtualization ? '已啟用' : '未啟用'}
                  </div>
                  <div className="text-xs text-muted-foreground">虛擬化狀態</div>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="font-medium">{performanceRecommendation.message}</p>
                <p className="text-muted-foreground">{performanceRecommendation.reason}</p>
              </div>
            </div>
          )}

          {/* 控制開關 */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <Label htmlFor="virtualization-switch" className="font-medium">
                  啟用虛擬化滾動
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                只渲染可見區域，適用於大量數據
              </p>
            </div>
            
            <Switch
              id="virtualization-switch"
              checked={useVirtualization}
              onCheckedChange={handleVirtualizationToggle}
            />
          </div>

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
              checked={showPerformanceMetrics}
              onCheckedChange={setShowPerformanceMetrics}
            />
          </div>

          {/* 快速切換按鈕 */}
          <div className="flex gap-2 pt-2">
            <Button
              variant={!useVirtualization ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVirtualization(false)}
              className="flex-1"
            >
              <Table className="h-4 w-4 mr-2" />
              標準表格
            </Button>
            <Button
              variant={useVirtualization ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVirtualization(true)}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              虛擬化表格
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 渲染選擇的表格組件 */}
      {useVirtualization ? (
        <VirtualizedProductTable />
      ) : (
        <ProductClientComponent />
      )}
    </div>
  );
}