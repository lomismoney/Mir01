"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Clock, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText,
} from "lucide-react";

/**
 * 搜尋頁面
 * 
 * 提供全局搜尋功能
 */
export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">全局搜尋</h1>
          <p className="text-muted-foreground">
            快速查找商品、訂單、客戶等資料
          </p>
        </div>
      </div>

      <Separator />

      {/* 搜尋欄 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="輸入關鍵字搜尋商品、訂單、客戶..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg h-12"
              />
            </div>
            <Button size="lg" className="px-8">
              <Search className="h-5 w-5 mr-2" />
              搜尋
            </Button>
            <Button variant="outline" size="lg">
              <Filter className="h-5 w-5" />
              篩選
            </Button>
          </div>
          
          {/* 快速搜尋建議 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">快速搜尋：</span>
            {["iPhone", "待處理訂單", "低庫存商品", "VIP客戶", "本月銷售"].map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => setSearchQuery(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 搜尋結果 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="products">商品</TabsTrigger>
          <TabsTrigger value="orders">訂單</TabsTrigger>
          <TabsTrigger value="customers">客戶</TabsTrigger>
          <TabsTrigger value="inventory">庫存</TabsTrigger>
          <TabsTrigger value="documents">文件</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* 搜尋統計 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">商品</p>
                    <p className="text-2xl font-bold">45</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">訂單</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">客戶</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">文件</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 熱門搜尋結果 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">商品結果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "iPhone 15 Pro", sku: "IP15P-001", stock: 25, price: "NT$ 35,900" },
                  { name: "iPhone 15", sku: "IP15-001", stock: 42, price: "NT$ 29,900" },
                  { name: "iPhone 14", sku: "IP14-001", stock: 15, price: "NT$ 24,900" },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.price}</p>
                      <p className="text-sm text-muted-foreground">庫存: {product.stock}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  查看全部商品結果
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">訂單結果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { id: "ORD-2025-001", customer: "王小明", amount: "NT$ 45,900", status: "已完成" },
                  { id: "ORD-2025-002", customer: "李小華", amount: "NT$ 29,900", status: "處理中" },
                  { id: "ORD-2025-003", customer: "陳小美", amount: "NT$ 67,800", status: "待出貨" },
                ].map((order, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium">{order.id}</h4>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.amount}</p>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  查看全部訂單結果
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>商品搜尋結果</CardTitle>
              <CardDescription>
                找到 45 個相關商品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">商品詳細搜尋結果將在此顯示...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>訂單搜尋結果</CardTitle>
              <CardDescription>
                找到 12 個相關訂單
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">訂單詳細搜尋結果將在此顯示...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>客戶搜尋結果</CardTitle>
              <CardDescription>
                找到 8 個相關客戶
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">客戶詳細搜尋結果將在此顯示...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>庫存搜尋結果</CardTitle>
              <CardDescription>
                找到 23 個相關庫存記錄
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">庫存詳細搜尋結果將在此顯示...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>文件搜尋結果</CardTitle>
              <CardDescription>
                找到 3 個相關文件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">文件詳細搜尋結果將在此顯示...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 最近搜尋 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近搜尋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["iPhone 15", "待處理訂單", "VIP客戶", "庫存不足", "本月銷售報表"].map((term) => (
              <Badge 
                key={term} 
                variant="outline" 
                className="cursor-pointer hover:bg-secondary"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 