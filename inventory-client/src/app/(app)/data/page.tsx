"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Server, 
  HardDrive, 
  Activity, 
  Download, 
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react";

/**
 * 數據中心頁面
 * 
 * 提供系統數據監控和管理功能
 */
export default function DataPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">數據中心</h1>
          <p className="text-muted-foreground">
            監控系統數據和服務器狀態
          </p>
        </div>
      </div>

      <Separator />

      {/* 系統狀態概覽 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">服務器狀態</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">正常運行</span>
                </div>
                <p className="text-xs text-muted-foreground">正常運行時間: 99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">資料庫狀態</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">連線正常</span>
                </div>
                <p className="text-xs text-muted-foreground">回應時間: 12ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">系統負載</p>
                <p className="text-2xl font-bold">23%</p>
                <Progress value={23} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">儲存空間</p>
                <p className="text-2xl font-bold">67%</p>
                <Progress value={67} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 數據統計 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概覽</TabsTrigger>
          <TabsTrigger value="performance">性能</TabsTrigger>
          <TabsTrigger value="storage">儲存</TabsTrigger>
          <TabsTrigger value="backup">備份</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 數據庫統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  資料庫統計
                </CardTitle>
                <CardDescription>
                  資料表記錄數量統計
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { table: "商品 (products)", count: "1,245", growth: "+5.2%" },
                  { table: "訂單 (orders)", count: "8,932", growth: "+12.8%" },
                  { table: "客戶 (customers)", count: "3,456", growth: "+8.1%" },
                  { table: "庫存 (inventories)", count: "2,789", growth: "+3.4%" },
                  { table: "交易記錄 (transactions)", count: "15,678", growth: "+18.9%" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.table}</p>
                      <p className="text-sm text-muted-foreground">記錄數: {item.count}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      {item.growth}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* API 使用統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  API 使用統計
                </CardTitle>
                <CardDescription>
                  最近 24 小時 API 調用統計
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { endpoint: "GET /api/products", calls: "2,456", status: "正常" },
                  { endpoint: "GET /api/orders", calls: "1,889", status: "正常" },
                  { endpoint: "POST /api/orders", calls: "567", status: "正常" },
                  { endpoint: "GET /api/inventory", calls: "1,234", status: "正常" },
                  { endpoint: "GET /api/dashboard/stats", calls: "3,456", status: "正常" },
                ].map((api, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium font-mono text-sm">{api.endpoint}</p>
                      <p className="text-sm text-muted-foreground">調用次數: {api.calls}</p>
                    </div>
                    <Badge variant="secondary">
                      {api.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 系統性能 */}
            <Card>
              <CardHeader>
                <CardTitle>系統性能指標</CardTitle>
                <CardDescription>
                  即時系統性能監控
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU 使用率</span>
                    <span className="text-sm font-medium">23%</span>
                  </div>
                  <Progress value={23} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">記憶體使用率</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">網路 I/O</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">磁碟 I/O</span>
                    <span className="text-sm font-medium">12%</span>
                  </div>
                  <Progress value={12} />
                </div>
              </CardContent>
            </Card>

            {/* 回應時間 */}
            <Card>
              <CardHeader>
                <CardTitle>回應時間統計</CardTitle>
                <CardDescription>
                  各服務平均回應時間
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { service: "資料庫查詢", time: "12ms", status: "excellent" },
                  { service: "API 回應", time: "45ms", status: "good" },
                  { service: "檔案上傳", time: "234ms", status: "good" },
                  { service: "報表生成", time: "1.2s", status: "normal" },
                  { service: "備份操作", time: "5.8s", status: "normal" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{item.service}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.time}</span>
                      <Badge 
                        variant={
                          item.status === 'excellent' ? 'default' :
                          item.status === 'good' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {item.status === 'excellent' ? '優秀' :
                         item.status === 'good' ? '良好' : '正常'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 儲存使用情況 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  儲存使用情況
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">總容量</span>
                    <span className="text-sm font-medium">500 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">已使用</span>
                    <span className="text-sm font-medium">335 GB (67%)</span>
                  </div>
                  <Progress value={67} />
                  <div className="flex justify-between">
                    <span className="text-sm">可用空間</span>
                    <span className="text-sm font-medium">165 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 資料夾大小 */}
            <Card>
              <CardHeader>
                <CardTitle>資料夾大小分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { folder: "商品圖片", size: "125 GB", percentage: 37 },
                  { folder: "資料庫檔案", size: "89 GB", percentage: 27 },
                  { folder: "系統日誌", size: "45 GB", percentage: 13 },
                  { folder: "備份檔案", size: "76 GB", percentage: 23 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">{item.folder}</span>
                      <span className="text-sm font-medium">{item.size}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 備份狀態 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  備份狀態
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: "完整備份", status: "已完成", time: "2 小時前", size: "2.3 GB" },
                  { type: "增量備份", status: "已完成", time: "30 分鐘前", size: "156 MB" },
                  { type: "日誌備份", status: "進行中", time: "正在進行", size: "45 MB" },
                ].map((backup, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{backup.type}</p>
                        <p className="text-sm text-muted-foreground">{backup.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={backup.status === '已完成' ? 'default' : 'secondary'}
                        className="mb-1"
                      >
                        {backup.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{backup.size}</p>
                    </div>
                  </div>
                ))}
                
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  立即備份
                </Button>
              </CardContent>
            </Card>

            {/* 備份設定 */}
            <Card>
              <CardHeader>
                <CardTitle>備份設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">自動備份</span>
                    <Badge variant="secondary">已啟用</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">備份頻率</span>
                    <span className="text-sm font-medium">每日 2:00 AM</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">保留天數</span>
                    <span className="text-sm font-medium">30 天</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">備份位置</span>
                    <span className="text-sm font-medium">雲端儲存</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  修改設定
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 