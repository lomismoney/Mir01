"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap, 
  Activity,
  Database,
  Monitor,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { VirtualizationToggle } from '@/components/ui/VirtualizationToggle';

/**
 * 開發者性能儀表板
 * 
 * 集成所有性能監控工具的控制面板
 * 僅在開發環境或管理員模式下顯示
 */
export function PerformanceDashboard() {
  const [isDashboardEnabled, setIsDashboardEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showVirtualizationControls, setShowVirtualizationControls] = useState(true);
  
  const {
    isTracking,
    setIsTracking,
    entries,
    activeCount,
    getStatistics,
    getRecentEntries,
    getSlowOperations,
    clearData,
  } = usePerformanceTracking();

  // 統計數據
  const statistics = useMemo(() => getStatistics(), [getStatistics]);
  const recentEntries = useMemo(() => getRecentEntries(5), [getRecentEntries]);
  const slowOperations = useMemo(() => getSlowOperations(500), [getSlowOperations]);

  // 導出性能數據
  const exportPerformanceData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      statistics,
      recentEntries,
      slowOperations,
      allEntries: entries,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 如果未啟用，顯示啟用按鈕
  if (!isDashboardEnabled) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDashboardEnabled(true)}
          className="bg-black/80 text-white border-gray-600 hover:bg-black"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          性能面板
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-2xl">
      <div className="flex flex-col h-full">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <h2 className="text-lg font-semibold">性能監控儀表板</h2>
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "監控中" : "已暫停"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="tracking-switch" className="text-sm">
                性能追蹤
              </Label>
              <Switch
                id="tracking-switch"
                checked={isTracking}
                onCheckedChange={setIsTracking}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDashboardEnabled(false)}
            >
              關閉
            </Button>
          </div>
        </div>

        {/* 主要內容 */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="overview">概覽</TabsTrigger>
              <TabsTrigger value="tracking">性能追蹤</TabsTrigger>
              <TabsTrigger value="virtualization">虛擬化</TabsTrigger>
              <TabsTrigger value="settings">設定</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto p-4">
              {/* 概覽頁面 */}
              <TabsContent value="overview" className="space-y-4 m-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 實時性能監控 */}
                  <PerformanceMonitor 
                    title="實時性能監控"
                    autoStart={true}
                    showControls={true}
                  />
                  
                  {/* 快速統計 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        快速統計
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {statistics.totalEntries}
                          </div>
                          <div className="text-sm text-muted-foreground">追蹤記錄</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {statistics.averageDuration?.toFixed(1) || 0}ms
                          </div>
                          <div className="text-sm text-muted-foreground">平均執行時間</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {activeCount}
                          </div>
                          <div className="text-sm text-muted-foreground">進行中追蹤</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {slowOperations.length}
                          </div>
                          <div className="text-sm text-muted-foreground">慢操作</div>
                        </div>
                      </div>

                      {/* 按類別統計 */}
                      {Object.keys(statistics.byCategory || {}).length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">按類別統計</h4>
                          <div className="space-y-2">
                            {Object.entries(statistics.byCategory || {}).map(([category, stats]: [string, any]) => (
                              <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="capitalize">{category}</span>
                                <div className="text-sm">
                                  <Badge variant="secondary" className="mr-2">
                                    {stats.count} 次
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    平均 {stats.averageDuration?.toFixed(1)}ms
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 最近操作 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      最近操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentEntries.length > 0 ? (
                      <div className="space-y-2">
                        {recentEntries.map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <span className="font-medium">{entry.name}</span>
                              {entry.metadata?.success === false && (
                                <Badge variant="destructive" className="ml-2">錯誤</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.duration?.toFixed(1)}ms
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        暫無追蹤記錄
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 性能追蹤頁面 */}
              <TabsContent value="tracking" className="space-y-4 m-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">性能追蹤記錄</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      清除數據
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPerformanceData}>
                      <Download className="h-4 w-4 mr-2" />
                      導出報告
                    </Button>
                  </div>
                </div>

                {/* 慢操作警告 */}
                {slowOperations.length > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        性能警告
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-yellow-700 mb-3">
                        檢測到 {slowOperations.length} 個執行時間超過 500ms 的操作
                      </p>
                      <div className="space-y-2">
                        {slowOperations.slice(0, 3).map((operation) => (
                          <div key={operation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="font-medium">{operation.name}</span>
                            <Badge variant="destructive">
                              {operation.duration?.toFixed(1)}ms
                            </Badge>
                          </div>
                        ))}
                        {slowOperations.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            還有 {slowOperations.length - 3} 個慢操作...
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 所有追蹤記錄 */}
                <Card>
                  <CardHeader>
                    <CardTitle>所有追蹤記錄</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {entries.length > 0 ? (
                      <div className="space-y-1 max-h-96 overflow-auto">
                        {entries.slice(-20).reverse().map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-2 text-sm hover:bg-muted rounded">
                            <div className="flex items-center gap-2">
                              {entry.metadata?.success === false ? (
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              ) : (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                              <span>{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {entry.duration && (
                                <Badge 
                                  variant={entry.duration > 500 ? "destructive" : 
                                          entry.duration > 200 ? "secondary" : "outline"}
                                >
                                  {entry.duration.toFixed(1)}ms
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.startTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        暫無追蹤記錄
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 虛擬化控制頁面 */}
              <TabsContent value="virtualization" className="space-y-4 m-0">
                <h3 className="text-lg font-medium">虛擬化性能控制</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 產品列表虛擬化 */}
                  <VirtualizationToggle
                    isEnabled={false}
                    onToggle={(enabled) => {
                      console.log('Product virtualization:', enabled);
                    }}
                    dataCount={1250}
                    dataType="產品"
                    showMetrics={showVirtualizationControls}
                    onMetricsToggle={setShowVirtualizationControls}
                  />
                  
                  {/* 訂單列表虛擬化 */}
                  <VirtualizationToggle
                    isEnabled={true}
                    onToggle={(enabled) => {
                      console.log('Order virtualization:', enabled);
                    }}
                    dataCount={850}
                    dataType="訂單"
                    showMetrics={showVirtualizationControls}
                    onMetricsToggle={setShowVirtualizationControls}
                  />
                </div>

                {/* 虛擬化統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      虛擬化效果統計
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">75%</div>
                        <div className="text-sm text-muted-foreground">記憶體節省</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">90%</div>
                        <div className="text-sm text-muted-foreground">渲染優化</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">2.1s</div>
                        <div className="text-sm text-muted-foreground">載入加速</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 設定頁面 */}
              <TabsContent value="settings" className="space-y-4 m-0">
                <h3 className="text-lg font-medium">監控設定</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      追蹤配置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <Label>自動追蹤 API 調用</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>追蹤組件渲染</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>記錄慢查詢</Label>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>性能警告</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">閾值設定</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>慢操作閾值</Label>
                          <p className="text-muted-foreground">500ms</p>
                        </div>
                        <div>
                          <Label>記憶體警告</Label>
                          <p className="text-muted-foreground">100MB</p>
                        </div>
                        <div>
                          <Label>最大記錄數</Label>
                          <p className="text-muted-foreground">100 項</p>
                        </div>
                        <div>
                          <Label>監控間隔</Label>
                          <p className="text-muted-foreground">2 秒</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}