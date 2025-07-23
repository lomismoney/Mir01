"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

/**
 * 分析報表頁面
 * 
 * 提供商業智能和數據分析功能
 */
export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">分析報表</h1>
            <p className="text-muted-foreground">
              商業智能分析和數據洞察
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue="30days">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">最近 7 天</SelectItem>
              <SelectItem value="30days">最近 30 天</SelectItem>
              <SelectItem value="90days">最近 3 個月</SelectItem>
              <SelectItem value="1year">最近 1 年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            篩選
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            匯出報表
          </Button>
        </div>
      </div>

      <Separator />

      {/* KPI 指標 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">總營收</p>
                <p className="text-2xl font-bold">{formatPrice(2345678)}</p>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground">vs 上月</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">訂單數量</p>
                <p className="text-2xl font-bold">1,456</p>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+8.3%</span>
                  <span className="text-muted-foreground">vs 上月</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">商品銷量</p>
                <p className="text-2xl font-bold">8,932</p>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">+15.7%</span>
                  <span className="text-muted-foreground">vs 上月</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">新客戶</p>
                <p className="text-2xl font-bold">234</p>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">-2.1%</span>
                  <span className="text-muted-foreground">vs 上月</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 分析內容 */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sales">銷售分析</TabsTrigger>
          <TabsTrigger value="products">商品分析</TabsTrigger>
          <TabsTrigger value="customers">客戶分析</TabsTrigger>
          <TabsTrigger value="inventory">庫存分析</TabsTrigger>
          <TabsTrigger value="financial">財務分析</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 銷售趨勢 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  銷售趨勢
                </CardTitle>
                <CardDescription>
                  最近 30 天銷售額變化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">銷售趨勢圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 銷售通道分析 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  銷售通道分析
                </CardTitle>
                <CardDescription>
                  各銷售通道佔比
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { channel: "線上商城", amount: 1234567, percentage: 52.6, color: "bg-blue-500" },
                    { channel: "實體門市", amount: 789012, percentage: 33.7, color: "bg-green-500" },
                    { channel: "電話訂購", amount: 234567, percentage: 10.0, color: "bg-orange-500" },
                    { channel: "其他", amount: 87532, percentage: 3.7, color: "bg-gray-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm">{item.channel}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.amount)}</p>
                        <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 熱銷時段 */}
            <Card>
              <CardHeader>
                <CardTitle>熱銷時段分析</CardTitle>
                <CardDescription>
                  24 小時銷售分佈
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">時段分析圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 銷售排行榜 */}
            <Card>
              <CardHeader>
                <CardTitle>銷售排行榜</CardTitle>
                <CardDescription>
                  本月銷售冠軍商品
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { rank: 1, product: "iPhone 15 Pro", sales: 234567, count: "45 件" },
                  { rank: 2, product: "MacBook Air M3", sales: 189012, count: "23 件" },
                  { rank: 3, product: "iPad Pro", sales: 156789, count: "34 件" },
                  { rank: 4, product: "AirPods Pro", sales: 98765, count: "67 件" },
                  { rank: 5, product: "Apple Watch", sales: 87432, count: "29 件" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                        {item.rank}
                      </Badge>
                      <span className="font-medium">{item.product}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.sales)}</p>
                      <p className="text-sm text-muted-foreground">{item.count}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 商品類別分析 */}
            <Card>
              <CardHeader>
                <CardTitle>商品類別銷售分析</CardTitle>
                <CardDescription>
                  各商品類別銷售表現
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">類別分析圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 庫存週轉率 */}
            <Card>
              <CardHeader>
                <CardTitle>庫存週轉率</CardTitle>
                <CardDescription>
                  商品週轉效率分析
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { category: "手機配件", turnover: "8.5", status: "excellent" },
                  { category: "筆記型電腦", turnover: "6.2", status: "good" },
                  { category: "平板電腦", turnover: "4.8", status: "good" },
                  { category: "智慧手錶", turnover: "3.1", status: "normal" },
                  { category: "音響設備", turnover: "2.3", status: "poor" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.turnover} 次/月</span>
                      <Badge 
                        variant={
                          item.status === 'excellent' ? 'default' :
                          item.status === 'good' ? 'secondary' : 
                          item.status === 'normal' ? 'outline' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {item.status === 'excellent' ? '優秀' :
                         item.status === 'good' ? '良好' :
                         item.status === 'normal' ? '正常' : '待改善'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 客戶分佈 */}
            <Card>
              <CardHeader>
                <CardTitle>客戶地區分佈</CardTitle>
                <CardDescription>
                  客戶地理位置分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">地區分佈圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 客戶價值分析 */}
            <Card>
              <CardHeader>
                <CardTitle>客戶價值分析</CardTitle>
                <CardDescription>
                  RFM 客戶分群
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { segment: "VIP 客戶", count: 156, percentage: 12.5, value: 50000 },
                  { segment: "重要客戶", count: 234, percentage: 18.7, value: 20000 },
                  { segment: "一般客戶", count: 567, percentage: 45.3, value: 5000 },
                  { segment: "新客戶", count: 289, percentage: 23.5, value: 1000 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.segment}</p>
                      <p className="text-sm text-muted-foreground">平均消費: {formatPrice(item.value)}+</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.count} 人</p>
                      <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 庫存狀態分析 */}
            <Card>
              <CardHeader>
                <CardTitle>庫存狀態分析</CardTitle>
                <CardDescription>
                  庫存健康度評估
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">庫存狀態圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 滯銷商品分析 */}
            <Card>
              <CardHeader>
                <CardTitle>滯銷商品預警</CardTitle>
                <CardDescription>
                  超過 90 天未銷售商品
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { product: "舊款耳機", days: 125, stock: 45, value: 67500 },
                  { product: "過季配件", days: 98, stock: 23, value: 34500 },
                  { product: "停產商品", days: 156, stock: 12, value: 18000 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.product}</p>
                      <p className="text-sm text-muted-foreground">{item.days} 天未銷售</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.stock} 件</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(item.value)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 損益分析 */}
            <Card>
              <CardHeader>
                <CardTitle>損益分析</CardTitle>
                <CardDescription>
                  營收與成本分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/10">
                  <p className="text-muted-foreground">損益分析圖表 (圖表元件)</p>
                </div>
              </CardContent>
            </Card>

            {/* 現金流分析 */}
            <Card>
              <CardHeader>
                <CardTitle>現金流分析</CardTitle>
                <CardDescription>
                  月度現金流變化
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { month: "12月", inflow: 2345678, outflow: 1876543, net: 469135 },
                  { month: "11月", inflow: 2123456, outflow: 1789012, net: 334444 },
                  { month: "10月", inflow: 1987654, outflow: 1654321, net: 333333 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.month}</span>
                      <span className="text-sm font-medium text-green-600">{formatPrice(item.net)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">流入:</span>
                        <span>{formatPrice(item.inflow)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">流出:</span>
                        <span>{formatPrice(item.outflow)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 