"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { performanceMonitor, PERFORMANCE_CONFIG } from '@/lib/performance-config';
import { cn } from '@/lib/utils';

interface PerformanceMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  description?: string;
}

/**
 * 性能監控儀表板組件
 * 
 * 提供實時的系統性能監控和分析
 */
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 收集性能指標
  const collectMetrics = () => {
    const collectedMetrics: PerformanceMetric[] = [];

    // 收集各個測量點的指標
    const measurementNames = [
      'product-table-render',
      'order-table-render',
      'customer-table-render',
      'image-load',
      'api-request',
    ];

    measurementNames.forEach((name) => {
      const metric = performanceMonitor.getMetrics(name);
      if (metric) {
        const avgTime = metric.average;
        const status = 
          avgTime < 100 ? 'good' : 
          avgTime < 300 ? 'warning' : 
          'critical';

        collectedMetrics.push({
          name: name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: avgTime.toFixed(2),
          unit: 'ms',
          status,
          description: `平均渲染時間 (${metric.count} 次測量)`,
        });
      }
    });

    // 添加內存使用情況
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMemoryMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMemoryMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const usagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

      collectedMetrics.push({
        name: '記憶體使用',
        value: `${usedMemoryMB} / ${totalMemoryMB}`,
        unit: 'MB',
        status: usagePercent < 70 ? 'good' : usagePercent < 90 ? 'warning' : 'critical',
        description: `使用率 ${usagePercent.toFixed(1)}%`,
      });
    }

    // 添加 FPS 指標（模擬）
    const fps = 60; // 實際應用中應該通過 requestAnimationFrame 計算
    collectedMetrics.push({
      name: 'FPS',
      value: fps,
      status: fps >= 50 ? 'good' : fps >= 30 ? 'warning' : 'critical',
      description: '每秒幀數',
    });

    setMetrics(collectedMetrics);
    setLastUpdate(new Date());
  };

  // 定期更新指標
  useEffect(() => {
    if (!isMonitoring) return;

    collectMetrics();
    const interval = setInterval(collectMetrics, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // 清除所有指標
  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  };

  // 獲取狀態圖標
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // 計算整體健康度
  const overallHealth = () => {
    if (metrics.length === 0) return 100;
    
    const scores = metrics.map(m => 
      m.status === 'good' ? 100 : 
      m.status === 'warning' ? 60 : 
      20
    );
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const healthScore = overallHealth();
  const healthStatus = healthScore >= 80 ? 'good' : healthScore >= 50 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* 頂部控制欄 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-lg font-semibold">性能監控儀表板</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMetrics}
          >
            清除數據
          </Button>
          
          <Button
            variant={isMonitoring ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? '監控中' : '已暫停'}
          </Button>
        </div>
      </div>

      {/* 整體健康度 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              系統健康度
            </span>
            <Badge variant={healthStatus === 'good' ? 'default' : healthStatus === 'warning' ? 'secondary' : 'destructive'}>
              {healthScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={healthScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            基於 {metrics.length} 個性能指標計算
          </p>
        </CardContent>
      </Card>

      {/* 性能指標網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className={cn(
            "transition-all",
            metric.status === 'critical' && "border-destructive"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{metric.name}</span>
                {getStatusIcon(metric.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                )}
              </div>
              {metric.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 性能建議 */}
      {metrics.some(m => m.status !== 'good') && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              性能優化建議
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {metrics.filter(m => m.status !== 'good').map((metric, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>
                    {metric.name} 
                    {metric.status === 'warning' ? '需要關注' : '需要優化'}
                    {metric.name.includes('Table Render') && '：考慮啟用虛擬滾動'}
                    {metric.name.includes('記憶體') && '：清理未使用的數據和組件'}
                    {metric.name.includes('Image') && '：優化圖片大小和格式'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 更新時間 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          最後更新：{lastUpdate.toLocaleTimeString('zh-TW')}
        </span>
        <span className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          每 5 秒自動更新
        </span>
      </div>
    </div>
  );
}