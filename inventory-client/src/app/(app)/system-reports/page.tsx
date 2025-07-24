"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  TrendingUp, 
  Database, 
  Activity, 
  Users, 
  Package, 
  ShoppingCart,
  DollarSign,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { MoneyHelper } from "@/lib/money-helper";

/**
 * 系統報表頁面
 * 
 * 提供系統運營數據分析和報表生成功能
 */
export default function SystemReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">系統報表中心</h1>
            <p className="text-muted-foreground">
              系統運營數據分析、性能監控與綜合報表
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新數據
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            導出報表
          </Button>
        </div>
      </div>

      <Separator />

      {/* 系統狀態概覽 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              系統健康度
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> 較上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              系統負載
            </CardTitle>
            <Cpu className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">23.4%</div>
            <p className="text-xs text-muted-foreground">
              CPU 平均使用率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              資料庫性能
            </CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">45ms</div>
            <p className="text-xs text-muted-foreground">
              平均查詢響應時間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              儲存使用量
            </CardTitle>
            <HardDrive className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">68.2%</div>
            <p className="text-xs text-muted-foreground">
              總容量 500GB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 報表分類標籤頁 */}
      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">營運報表</TabsTrigger>
          <TabsTrigger value="system">系統監控</TabsTrigger>
          <TabsTrigger value="performance">性能分析</TabsTrigger>
          <TabsTrigger value="audit">稽核日誌</TabsTrigger>
        </TabsList>

        {/* 營運報表 */}
        <TabsContent value="business">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  銷售績效報表
                </CardTitle>
                <CardDescription>
                  銷售趨勢、商品排行、客戶分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">本月營收</span>
                    <Badge variant="secondary">{MoneyHelper.format(2450000, 'NT$')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">訂單成長率</span>
                    <Badge className="bg-green-100 text-green-800">+15.3%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">客戶滿意度</span>
                    <Badge className="bg-blue-100 text-blue-800">94.2%</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    查看詳細報表
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  庫存分析報表
                </CardTitle>
                <CardDescription>
                  庫存週轉、預警分析、成本評估
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">庫存週轉率</span>
                    <Badge variant="secondary">8.2 次/年</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">庫存總值</span>
                    <Badge className="bg-purple-100 text-purple-800">{MoneyHelper.format(1850000, 'NT$')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">預警商品</span>
                    <Badge variant="destructive">23 項</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <PieChart className="h-4 w-4 mr-2" />
                    查看詳細報表
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  客戶分析報表
                </CardTitle>
                <CardDescription>
                  客戶行為、忠誠度、價值分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">活躍客戶</span>
                    <Badge variant="secondary">1,247 位</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">客戶留存率</span>
                    <Badge className="bg-green-100 text-green-800">87.5%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">平均客單價</span>
                    <Badge className="bg-blue-100 text-blue-800">{MoneyHelper.format(3420, 'NT$')}</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    查看詳細報表
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  財務分析報表
                </CardTitle>
                <CardDescription>
                  收支分析、成本管控、利潤評估
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">毛利率</span>
                    <Badge className="bg-green-100 text-green-800">42.8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">營運成本</span>
                    <Badge variant="secondary">{MoneyHelper.format(1400000, 'NT$')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">投資回報率</span>
                    <Badge className="bg-blue-100 text-blue-800">18.5%</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <LineChart className="h-4 w-4 mr-2" />
                    查看詳細報表
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 系統監控 */}
        <TabsContent value="system">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  伺服器狀態
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Web 伺服器</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">資料庫伺服器</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis 快取</span>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-600">警告</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">檔案儲存</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" />
                  資源使用率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">CPU</span>
                      <span className="text-sm">23.4%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: '23.4%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">記憶體</span>
                      <span className="text-sm">67.8%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: '67.8%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">儲存空間</span>
                      <span className="text-sm">68.2%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: '68.2%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">網路頻寬</span>
                      <span className="text-sm">34.5%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: '34.5%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  系統健康度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-muted-foreground">整體健康度</p>
                  <div className="w-24 h-24 mx-auto relative">
                    <div className="w-full h-full rounded-full border-4 border-green-200">
                      <div 
                        className="w-full h-full rounded-full border-4 border-green-600 border-t-transparent animate-pulse"
                        style={{ 
                          transform: 'rotate(354deg)', // 98.5% = 354 degrees
                          background: `conic-gradient(#22c55e 98.5%, transparent 98.5%)`
                        }}
                      ></div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    系統運行正常
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  API 端點監控
                </CardTitle>
                <CardDescription>
                  監控各 API 端點的響應時間和可用性
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">商品 API</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      平均響應: 45ms
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">訂單 API</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      平均響應: 52ms
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">庫存 API</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      平均響應: 89ms
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">客戶 API</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      平均響應: 38ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 性能分析 */}
        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  響應時間分析
                </CardTitle>
                <CardDescription>
                  系統各模組響應時間統計
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">52ms</div>
                    <p className="text-sm text-muted-foreground">平均響應時間</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">頁面載入</span>
                      <Badge variant="secondary">1.2s</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API 調用</span>
                      <Badge variant="secondary">52ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">資料庫查詢</span>
                      <Badge variant="secondary">28ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">檔案處理</span>
                      <Badge variant="secondary">156ms</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  流量分析
                </CardTitle>
                <CardDescription>
                  使用者訪問模式與流量統計
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">2,847</div>
                    <p className="text-sm text-muted-foreground">今日活躍用戶</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">頁面瀏覽量</span>
                      <Badge variant="secondary">15,432</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API 請求數</span>
                      <Badge variant="secondary">89,234</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">並發用戶</span>
                      <Badge variant="secondary">156</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">錯誤率</span>
                      <Badge className="bg-green-100 text-green-800">0.03%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 稽核日誌 */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                最近系統活動日誌
              </CardTitle>
              <CardDescription>
                系統操作記錄與稽核追蹤
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium">用戶登入</div>
                      <div className="text-xs text-muted-foreground">管理員 admin@example.com 成功登入</div>
                    </div>
                  </div>
                  <Badge variant="outline">2 分鐘前</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium">庫存調整</div>
                      <div className="text-xs text-muted-foreground">商品 #12345 庫存調整 +50 件</div>
                    </div>
                  </div>
                  <Badge variant="outline">5 分鐘前</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="text-sm font-medium">新訂單</div>
                      <div className="text-xs text-muted-foreground">訂單 #ORD-2025-001 已建立</div>
                    </div>
                  </div>
                  <Badge variant="outline">8 分鐘前</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="text-sm font-medium">系統警告</div>
                      <div className="text-xs text-muted-foreground">Redis 快取使用率達到 85%</div>
                    </div>
                  </div>
                  <Badge variant="outline">15 分鐘前</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-medium">用戶註冊</div>
                      <div className="text-xs text-muted-foreground">新客戶註冊：customer@example.com</div>
                    </div>
                  </div>
                  <Badge variant="outline">22 分鐘前</Badge>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline">
                  查看完整日誌
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 