"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Clock, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText,
  TrendingUp,
  Target,
  History,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Zap,
  Eye,
  Star,
  BarChart3
} from "lucide-react";

/**
 * 搜尋頁面（美化版）
 * 
 * 重新設計的搜尋頁面，具有以下特色：
 * 1. 採用 Dashboard 風格的卡片設計
 * 2. 100% 使用 shadcn/UI 組件
 * 3. 遵循官方顏色規範
 * 4. 現代化的視覺設計和互動體驗
 * 5. 響應式設計和微互動效果
 */
export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
        {/* 📱 頁面標題區域 - Dashboard 風格 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">全局搜尋</h1>
              <p className="text-muted-foreground">
                快速查找商品、訂單、客戶等資料
              </p>
            </div>
          </div>
        </div>

        {/* 🔍 搜尋區域 - Dashboard 風格卡片 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              智能搜尋引擎
            </CardTitle>
            <CardDescription>
              使用 AI 驅動的搜尋技術，快速找到您需要的任何資料
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="輸入關鍵字搜尋商品、訂單、客戶..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-lg h-12 bg-background/60 border-border/60 focus:border-primary/60 transition-all duration-200"
                />
              </div>
              <Button size="lg" className="sm:w-auto bg-primary hover:bg-primary/90 shadow-sm px-8">
                <Search className="h-5 w-5 mr-2" />
                搜尋
              </Button>
              <Button variant="outline" size="lg" className="sm:w-auto">
                <Filter className="h-5 w-5 mr-2" />
                進階篩選
              </Button>
            </div>
            
            {/* 快速搜尋建議 */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                熱門搜尋：
              </span>
              {[
                { label: "iPhone", trend: "hot" },
                { label: "待處理訂單", trend: "new" },
                { label: "低庫存商品", trend: "urgent" },
                { label: "VIP客戶", trend: "star" },
                { label: "本月銷售", trend: "trend" }
              ].map((tag) => (
                <Badge 
                  key={tag.label} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1"
                  onClick={() => setSearchQuery(tag.label)}
                >
                  {tag.trend === "hot" && <Zap className="h-3 w-3" />}
                  {tag.trend === "new" && <Sparkles className="h-3 w-3" />}
                  {tag.trend === "urgent" && <Target className="h-3 w-3" />}
                  {tag.trend === "star" && <Star className="h-3 w-3" />}
                  {tag.trend === "trend" && <TrendingUp className="h-3 w-3" />}
                  {tag.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 📊 快速統計 - Dashboard 統計卡片風格 */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>商品搜尋</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                45 個結果
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Package className="size-3" />
                  商品
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                包含庫存和變體 <Package className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                涵蓋所有商品分類
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>訂單搜尋</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                12 個結果
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <ShoppingCart className="size-3" />
                  訂單
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                包含歷史訂單 <ShoppingCart className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                各種訂單狀態
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>客戶搜尋</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                8 個結果
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Users className="size-3" />
                  客戶
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                活躍客戶資料 <Users className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                包含聯絡資訊
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>文件搜尋</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                3 個結果
              </CardTitle>
              <CardAction>
                <Badge variant="destructive">
                  <FileText className="size-3" />
                  文件
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                相關文件檔案 <FileText className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                報表和記錄
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* 🔍 搜尋結果 - 美化版 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              搜尋結果
            </CardTitle>
            <CardDescription>
              依照相關性和重要程度排序的搜尋結果
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-muted/50">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="products">商品</TabsTrigger>
                <TabsTrigger value="orders">訂單</TabsTrigger>
                <TabsTrigger value="customers">客戶</TabsTrigger>
                <TabsTrigger value="inventory">庫存</TabsTrigger>
                <TabsTrigger value="documents">文件</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {/* 熱門搜尋結果 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* 商品結果 - 美化版 */}
                  <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        商品結果
                      </CardTitle>
                      <CardDescription>最相關的商品搜尋結果</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { name: "iPhone 15 Pro", sku: "IP15P-001", stock: 25, price: "NT$ 35,900", trend: "hot" },
                        { name: "iPhone 15", sku: "IP15-001", stock: 42, price: "NT$ 29,900", trend: "new" },
                        { name: "iPhone 14", sku: "IP14-001", stock: 15, price: "NT$ 24,900", trend: "low" },
                      ].map((product, i) => (
                        <div key={i} className="group flex items-center justify-between p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                              <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{product.name}</h4>
                                {product.trend === "hot" && <Badge variant="destructive" className="text-xs"><Zap className="h-3 w-3 mr-1" />熱門</Badge>}
                                {product.trend === "new" && <Badge variant="secondary" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />新品</Badge>}
                                {product.trend === "low" && <Badge variant="outline" className="text-xs"><Target className="h-3 w-3 mr-1" />低庫存</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{product.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{product.price}</p>
                            <p className="text-sm text-muted-foreground">庫存: {product.stock}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                      <Button variant="outline" className="w-full hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 mr-2" />
                        查看全部商品結果
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* 訂單結果 - 美化版 */}
                  <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        訂單結果
                      </CardTitle>
                      <CardDescription>最近的訂單搜尋結果</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { id: "ORD-2025-001", customer: "王小明", amount: "NT$ 45,900", status: "已完成", statusColor: "green" },
                        { id: "ORD-2025-002", customer: "李小華", amount: "NT$ 29,900", status: "處理中", statusColor: "blue" },
                        { id: "ORD-2025-003", customer: "陳小美", amount: "NT$ 67,800", status: "待出貨", statusColor: "orange" },
                      ].map((order, i) => (
                        <div key={i} className="group flex items-center justify-between p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                              <ShoppingCart className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{order.id}</h4>
                              <p className="text-sm text-muted-foreground">{order.customer}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-primary">{order.amount}</p>
                              <Badge 
                                variant={order.statusColor === "green" ? "secondary" : "outline"} 
                                className="text-xs"
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 mr-2" />
                        查看全部訂單結果
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="products">
                <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      商品搜尋結果
                    </CardTitle>
                    <CardDescription>
                      找到 45 個相關商品
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <Package className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">商品詳細搜尋結果將在此顯示...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      訂單搜尋結果
                    </CardTitle>
                    <CardDescription>
                      找到 12 個相關訂單
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">訂單詳細搜尋結果將在此顯示...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers">
                <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      客戶搜尋結果
                    </CardTitle>
                    <CardDescription>
                      找到 8 個相關客戶
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <Users className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">客戶詳細搜尋結果將在此顯示...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inventory">
                <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      庫存搜尋結果
                    </CardTitle>
                    <CardDescription>
                      找到 23 個相關庫存記錄
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <Package className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">庫存詳細搜尋結果將在此顯示...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      文件搜尋結果
                    </CardTitle>
                    <CardDescription>
                      找到 3 個相關文件
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
                      <FileText className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">文件詳細搜尋結果將在此顯示...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 📚 最近搜尋 - 美化版 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              搜尋歷史
            </CardTitle>
            <CardDescription>
              您最近的搜尋記錄，點擊可快速重新搜尋
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[
                { term: "iPhone 15", type: "product" },
                { term: "待處理訂單", type: "order" },
                { term: "VIP客戶", type: "customer" },
                { term: "庫存不足", type: "inventory" },
                { term: "本月銷售報表", type: "document" }
              ].map((item) => (
                <div
                  key={item.term}
                  className="group flex items-center gap-2 p-3 bg-primary/5 border border-border rounded-lg hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-primary/10"
                  onClick={() => setSearchQuery(item.term)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    {item.type === "product" && <Package className="h-4 w-4 text-primary" />}
                    {item.type === "order" && <ShoppingCart className="h-4 w-4 text-primary" />}
                    {item.type === "customer" && <Users className="h-4 w-4 text-primary" />}
                    {item.type === "inventory" && <Target className="h-4 w-4 text-primary" />}
                    {item.type === "document" && <FileText className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {item.term}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">搜尋提示</p>
                  <p className="text-xs text-muted-foreground">
                    使用引號進行精確搜尋，或使用 * 作為萬用字元
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 