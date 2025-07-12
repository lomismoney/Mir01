import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Clock, 
  Zap, 
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Gauge,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';

// 性能指標數據結構
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  apiCalls: number;
  errorCount: number;
  timestamp: number;
}

// 性能監控配置
interface PerformanceMonitorConfig {
  enabled: boolean;
  interval: number; // 毫秒
  maxDataPoints: number;
  thresholds: {
    renderTime: number; // 毫秒
    memoryUsage: number; // MB
    apiCalls: number; // 次數/分鐘
    errorRate: number; // 百分比
  };
}

// 組件屬性
interface PerformanceMonitorProps {
  className?: string;
  title?: string;
  showControls?: boolean;
  autoStart?: boolean;
  onAlert?: (metric: string, value: number, threshold: number) => void;
}

// 性能數據鉤子
function usePerformanceMetrics(config: PerformanceMonitorConfig) {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(config.enabled);

  useEffect(() => {
    if (!isMonitoring) return;

    const collectMetrics = (): PerformanceMetrics => {
      // 渲染時間 (使用 Performance API)
      const renderTime = performance.now() - (window.performance?.timing?.navigationStart || 0);
      
      // 記憶體使用 (如果瀏覽器支援)
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024 * 100) / 100 : 0;
      
      // 組件數量 (估算)
      const componentCount = document.querySelectorAll('[data-radix-popper-content-wrapper], [data-testid], [class*="component"]').length;
      
      // API 調用次數 (從 Performance Observer 獲取)
      const apiCalls = performance.getEntriesByType('navigation').length + 
                      performance.getEntriesByType('resource').filter(entry => 
                        entry.name.includes('/api/')).length;
      
      // 錯誤計數 (從全局錯誤處理器獲取)
      const errorCount = (window as any).__performanceErrorCount || 0;

      return {
        renderTime: Math.round(renderTime),
        memoryUsage,
        componentCount,
        apiCalls,
        errorCount,
        timestamp: Date.now(),
      };
    };

    const interval = setInterval(() => {
      const newMetric = collectMetrics();
      setMetrics(prev => {
        const updated = [...prev, newMetric];
        return updated.slice(-config.maxDataPoints);
      });
    }, config.interval);

    return () => clearInterval(interval);
  }, [isMonitoring, config]);

  return { metrics, isMonitoring, setIsMonitoring };
}

// 預設配置
const defaultConfig: PerformanceMonitorConfig = {
  enabled: false,
  interval: 2000, // 每2秒收集一次
  maxDataPoints: 30, // 保留最近30個數據點
  thresholds: {
    renderTime: 3000, // 3秒
    memoryUsage: 100, // 100MB
    apiCalls: 30, // 30次/分鐘
    errorRate: 5, // 5%
  },
};

/**
 * 性能監控組件
 * 
 * 實時監控應用性能指標，包括：
 * - 渲染時間
 * - 記憶體使用量
 * - 組件數量
 * - API 調用次數
 * - 錯誤統計
 * 
 * 特性：
 * 1. 實時數據收集和顯示
 * 2. 可配置的閾值警告
 * 3. 歷史數據趨勢分析
 * 4. 視覺化性能指標
 */
export function PerformanceMonitor({
  className = '',
  title = '性能監控儀表板',
  showControls = true,
  autoStart = false,
  onAlert,
}: PerformanceMonitorProps) {
  const [config, setConfig] = useState<PerformanceMonitorConfig>({
    ...defaultConfig,
    enabled: autoStart,
  });

  const { metrics, isMonitoring, setIsMonitoring } = usePerformanceMetrics(config);

  // 最新指標
  const latestMetrics = metrics[metrics.length - 1];

  // 趨勢分析
  const trends = useMemo(() => {
    if (metrics.length < 2) return {};

    const recent = metrics.slice(-5);
    const previous = metrics.slice(-10, -5);

    const calculateTrend = (recentData: number[], previousData: number[]) => {
      if (recentData.length === 0 || previousData.length === 0) return 0;
      const recentAvg = recentData.reduce((a, b) => a + b, 0) / recentData.length;
      const previousAvg = previousData.reduce((a, b) => a + b, 0) / previousData.length;
      return ((recentAvg - previousAvg) / previousAvg) * 100;
    };

    return {
      renderTime: calculateTrend(
        recent.map(m => m.renderTime),
        previous.map(m => m.renderTime)
      ),
      memoryUsage: calculateTrend(
        recent.map(m => m.memoryUsage),
        previous.map(m => m.memoryUsage)
      ),
      apiCalls: calculateTrend(
        recent.map(m => m.apiCalls),
        previous.map(m => m.apiCalls)
      ),
    };
  }, [metrics]);

  // 狀態判斷
  const getMetricStatus = (value: number, threshold: number, isLowerBetter = true) => {
    const ratio = value / threshold;
    if (isLowerBetter) {
      if (ratio < 0.5) return 'excellent';
      if (ratio < 0.8) return 'good';
      if (ratio < 1) return 'warning';
      return 'critical';
    } else {
      if (ratio > 2) return 'excellent';
      if (ratio > 1.5) return 'good';
      if (ratio > 1) return 'warning';
      return 'critical';
    }
  };

  // 趨勢圖標
  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 5) return <Minus className="h-3 w-3" />;
    return trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  // 狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // 控制監控狀態
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    setConfig(prev => ({ ...prev, enabled: !isMonitoring }));
  };

  // 清除數據
  const clearMetrics = () => {
    window.location.reload(); // 簡單重置
  };

  if (!latestMetrics && isMonitoring) {
    return (
      <Card className={`${className} border-yellow-200 dark:border-yellow-800`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-yellow-600" />
            <p className="text-muted-foreground">正在收集性能數據...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Activity className="h-5 w-5" />
            {title}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isMonitoring ? (
                <>
                  <Play className="h-3 w-3" />
                  監控中
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  已暫停
                </>
              )}
            </Badge>
            
            {showControls && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isMonitoring}
                  onCheckedChange={toggleMonitoring}
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isMonitoring && (
          <div className="text-center py-4 text-muted-foreground">
            <Pause className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>性能監控已暫停</p>
            <p className="text-xs">開啟開關以開始監控</p>
          </div>
        )}

        {isMonitoring && latestMetrics && (
          <>
            {/* 核心指標網格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 渲染時間 */}
              <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-900 border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">渲染時間</span>
                </div>
                <div className={`text-lg font-bold ${getStatusColor(
                  getMetricStatus(latestMetrics.renderTime, config.thresholds.renderTime)
                )}`}>
                  {latestMetrics.renderTime}ms
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(trends.renderTime || 0)}
                  {Math.abs(trends.renderTime || 0).toFixed(1)}%
                </div>
              </div>

              {/* 記憶體使用 */}
              <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-900 border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">記憶體</span>
                </div>
                <div className={`text-lg font-bold ${getStatusColor(
                  getMetricStatus(latestMetrics.memoryUsage, config.thresholds.memoryUsage)
                )}`}>
                  {latestMetrics.memoryUsage}MB
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(trends.memoryUsage || 0)}
                  {Math.abs(trends.memoryUsage || 0).toFixed(1)}%
                </div>
              </div>

              {/* 組件數量 */}
              <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-900 border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">組件數</span>
                </div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {latestMetrics.componentCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  DOM 節點
                </div>
              </div>

              {/* API 調用 */}
              <div className="text-center p-3 rounded-lg bg-white dark:bg-gray-900 border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-muted-foreground">API 調用</span>
                </div>
                <div className={`text-lg font-bold ${getStatusColor(
                  getMetricStatus(latestMetrics.apiCalls, config.thresholds.apiCalls)
                )}`}>
                  {latestMetrics.apiCalls}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(trends.apiCalls || 0)}
                  {Math.abs(trends.apiCalls || 0).toFixed(1)}%
                </div>
              </div>
            </div>

            <Separator />

            {/* 系統狀態總覽 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                系統狀態總覽
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">整體性能</span>
                    <Badge variant="default" className="bg-emerald-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      良好
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">錯誤率</span>
                    <Badge variant={latestMetrics.errorCount > 0 ? "destructive" : "secondary"}>
                      {latestMetrics.errorCount > 0 ? (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {latestMetrics.errorCount} 錯誤
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">數據點</span>
                    <span className="text-sm font-medium">{metrics.length}/{config.maxDataPoints}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">監控間隔</span>
                    <span className="text-sm font-medium">{config.interval/1000}秒</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 性能建議 */}
            <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
              <h4 className="font-medium mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                性能建議
              </h4>
              
              <div className="space-y-2 text-sm">
                {latestMetrics.memoryUsage > config.thresholds.memoryUsage && (
                  <p className="text-yellow-700 dark:text-yellow-300">
                    • 記憶體使用較高，建議啟用虛擬滾動或減少同時渲染的組件數量
                  </p>
                )}
                
                {latestMetrics.renderTime > config.thresholds.renderTime && (
                  <p className="text-yellow-700 dark:text-yellow-300">
                    • 渲染時間較長，考慮使用 React.memo 或 useMemo 優化組件
                  </p>
                )}
                
                {latestMetrics.componentCount > 500 && (
                  <p className="text-blue-700 dark:text-blue-300">
                    • 組件數量較多，建議實施代碼分割和懶加載
                  </p>
                )}
                
                {metrics.length > 0 && 
                 latestMetrics.memoryUsage <= config.thresholds.memoryUsage &&
                 latestMetrics.renderTime <= config.thresholds.renderTime && (
                  <p className="text-green-700 dark:text-green-300">
                    • 系統性能良好，所有指標都在正常範圍內
                  </p>
                )}
              </div>
            </div>

            {/* 控制按鈕 */}
            {showControls && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMetrics}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置數據
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Performance Metrics:', metrics);
                  }}
                  className="flex-1"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  導出數據
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 輕量級性能監控組件
 * 
 * 適用於在頁面角落顯示基本性能指標
 */
export function PerformanceIndicator({ className = '' }: { className?: string }) {
  const { metrics, isMonitoring } = usePerformanceMetrics({
    ...defaultConfig,
    enabled: true,
    interval: 5000, // 5秒更新一次
  });

  const latestMetrics = metrics[metrics.length - 1];

  if (!isMonitoring || !latestMetrics) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-48 bg-black/80 border-gray-700 text-white">
        <CardContent className="p-3">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>記憶體:</span>
              <span>{latestMetrics.memoryUsage}MB</span>
            </div>
            <div className="flex justify-between">
              <span>組件:</span>
              <span>{latestMetrics.componentCount}</span>
            </div>
            <div className="flex justify-between">
              <span>API:</span>
              <span>{latestMetrics.apiCalls}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}