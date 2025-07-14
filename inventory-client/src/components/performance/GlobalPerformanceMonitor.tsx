"use client";

import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Database, 
  Image as ImageIcon, 
  Clock, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Wifi,
  HardDrive
} from 'lucide-react';

/**
 * 性能監控數據接口
 */
interface PerformanceMetrics {
  // 渲染性能
  renderTime: number;
  componentCount: number;
  rerenderCount: number;
  
  // 內存使用
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // 網絡性能
  networkRequests: {
    total: number;
    pending: number;
    failed: number;
    avgResponseTime: number;
  };
  
  // React Query 緩存
  queryCache: {
    size: number;
    hitRate: number;
    missRate: number;
    staleQueries: number;
  };
  
  // 圖片加載
  imageCache: {
    total: number;
    loaded: number;
    loading: number;
    errors: number;
    hitRate: string;
  };
  
  // 頁面性能
  pageMetrics: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
}

/**
 * 性能數據收集器
 */
class PerformanceCollector {
  private static instance: PerformanceCollector;
  private metrics: PerformanceMetrics;
  private observers: Set<() => void> = new Set();
  private collectionInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = this.getInitialMetrics();
    this.startCollection();
  }

  static getInstance(): PerformanceCollector {
    if (!this.instance) {
      this.instance = new PerformanceCollector();
    }
    return this.instance;
  }

  private getInitialMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      componentCount: 0,
      rerenderCount: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      networkRequests: {
        total: 0,
        pending: 0,
        failed: 0,
        avgResponseTime: 0,
      },
      queryCache: {
        size: 0,
        hitRate: 0,
        missRate: 0,
        staleQueries: 0,
      },
      imageCache: {
        total: 0,
        loaded: 0,
        loading: 0,
        errors: 0,
        hitRate: '0%',
      },
      pageMetrics: {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
      },
    };
  }

  private startCollection() {
    this.collectPageMetrics();
    
    this.collectionInterval = setInterval(() => {
      this.collectRuntimeMetrics();
      this.notifyObservers();
    }, 1000);
  }

  private collectPageMetrics() {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.pageMetrics = {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: navigation.responseEnd - navigation.fetchStart,
        firstContentfulPaint: navigation.responseEnd - navigation.fetchStart,
      };
    }

    // 收集 Paint 時機
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        this.metrics.pageMetrics.firstPaint = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        this.metrics.pageMetrics.firstContentfulPaint = entry.startTime;
      }
    });
  }

  private collectRuntimeMetrics() {
    // 收集內存使用
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
      };
    }

    // 收集網絡請求統計
    const resourceEntries = performance.getEntriesByType('resource');
    const networkRequests = resourceEntries.filter(entry => 
      entry.name.includes('/api/') || entry.name.includes('fetch')
    );
    
    this.metrics.networkRequests = {
      total: networkRequests.length,
      pending: 0, // 需要從其他地方獲取
      failed: networkRequests.filter(entry => entry.duration === 0).length,
      avgResponseTime: networkRequests.length > 0 
        ? networkRequests.reduce((sum, entry) => sum + entry.duration, 0) / networkRequests.length
        : 0,
    };

    // 收集 React Query 緩存統計
    this.collectQueryCacheMetrics();

    // 收集圖片緩存統計
    this.collectImageCacheMetrics();
  }

  private collectQueryCacheMetrics() {
    // 嘗試從全局變量獲取 React Query 統計
    const queryClient = (window as any).__queryClient;
    if (queryClient) {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      this.metrics.queryCache = {
        size: queries.length,
        hitRate: 0, // 需要計算
        missRate: 0, // 需要計算
        staleQueries: queries.filter((query: any) => query.isStale()).length,
      };
    }
  }

  private collectImageCacheMetrics() {
    // 從 ImagePreloadManager 獲取統計
    const ImagePreloadManager = (window as any).__ImagePreloadManager;
    if (ImagePreloadManager) {
      const stats = ImagePreloadManager.getStats();
      this.metrics.imageCache = stats;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  subscribe(callback: () => void): () => void {
    this.observers.add(callback);
    return () => {
      this.observers.delete(callback);
    };
  }

  private notifyObservers() {
    this.observers.forEach(callback => callback());
  }

  destroy() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    this.observers.clear();
  }
}

/**
 * 性能指標卡片組件
 */
const MetricCard = memo(({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}: {
  title: string;
  value: number | string;
  unit?: string;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : BarChart3;

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {trend && <TrendIcon className="h-4 w-4" />}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold">{value}</span>
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

/**
 * 全局性能監控組件
 */
export const GlobalPerformanceMonitor = memo(() => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const collector = useMemo(() => PerformanceCollector.getInstance(), []);

  useEffect(() => {
    const unsubscribe = collector.subscribe(() => {
      setMetrics(collector.getMetrics());
    });

    // 初始數據
    setMetrics(collector.getMetrics());

    return unsubscribe;
  }, [collector]);

  const handleToggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const getPerformanceLevel = useCallback((percentage: number) => {
    if (percentage < 50) return { level: '優秀', color: 'green' as const };
    if (percentage < 70) return { level: '良好', color: 'yellow' as const };
    if (percentage < 85) return { level: '一般', color: 'yellow' as const };
    return { level: '需要優化', color: 'red' as const };
  }, []);

  if (!metrics) return null;

  const memoryLevel = getPerformanceLevel(metrics.memoryUsage.percentage);
  const networkLevel = getPerformanceLevel(
    metrics.networkRequests.failed / Math.max(metrics.networkRequests.total, 1) * 100
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 切換按鈕 */}
      <Button
        onClick={handleToggleVisibility}
        className="mb-2 shadow-lg"
        variant={isVisible ? "default" : "outline"}
        size="sm"
      >
        <Activity className="h-4 w-4 mr-2" />
        性能監控
      </Button>

      {/* 監控面板 */}
      {isVisible && (
        <Card className="w-96 max-h-[600px] overflow-y-auto shadow-2xl border-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              實時性能監控
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="text-xs">總覽</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs">內存</TabsTrigger>
                <TabsTrigger value="network" className="text-xs">網路</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-3 mt-4">
                <MetricCard
                  title="頁面載入"
                  value={Math.round(metrics.pageMetrics.loadTime)}
                  unit="ms"
                  icon={Clock}
                  color={metrics.pageMetrics.loadTime < 2000 ? 'green' : 'yellow'}
                />
                
                <MetricCard
                  title="內存使用"
                  value={metrics.memoryUsage.percentage}
                  unit="%"
                  icon={HardDrive}
                  color={memoryLevel.color}
                />
                
                <MetricCard
                  title="查詢緩存"
                  value={metrics.queryCache.size}
                  unit="個"
                  icon={Database}
                  color="blue"
                />
                
                <MetricCard
                  title="圖片緩存"
                  value={metrics.imageCache.hitRate}
                  icon={ImageIcon}
                  color="green"
                />
              </TabsContent>
              
              <TabsContent value="memory" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>內存使用率</span>
                    <span>{metrics.memoryUsage.percentage}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage.percentage} className="h-2" />
                  <Badge variant={memoryLevel.color === 'green' ? 'default' : 'destructive'}>
                    {memoryLevel.level}
                  </Badge>
                </div>
                
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>已使用: {Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB</div>
                  <div>總計: {Math.round(metrics.memoryUsage.total / 1024 / 1024)}MB</div>
                </div>
              </TabsContent>
              
              <TabsContent value="network" className="space-y-3 mt-4">
                <MetricCard
                  title="總請求數"
                  value={metrics.networkRequests.total}
                  icon={Wifi}
                  color="blue"
                />
                
                <MetricCard
                  title="失敗請求"
                  value={metrics.networkRequests.failed}
                  icon={TrendingDown}
                  color={metrics.networkRequests.failed > 0 ? 'red' : 'green'}
                />
                
                <MetricCard
                  title="平均響應時間"
                  value={Math.round(metrics.networkRequests.avgResponseTime)}
                  unit="ms"
                  icon={Clock}
                  color={metrics.networkRequests.avgResponseTime < 500 ? 'green' : 'yellow'}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

GlobalPerformanceMonitor.displayName = 'GlobalPerformanceMonitor';

export default GlobalPerformanceMonitor;