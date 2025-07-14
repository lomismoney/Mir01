'use client';

import { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBackorderStats } from '@/hooks/queries/backorders/useBackorders';
import { Loader2 } from 'lucide-react';
import { SectionLoading } from '@/components/ui/skeleton';

// 動態導入 backorder 組件
const BackorderList = lazy(() => import('@/components/backorders/BackorderList').then(module => ({ default: module.BackorderList })));
const BackorderSummary = lazy(() => import('@/components/backorders/BackorderSummary').then(module => ({ default: module.BackorderSummary })));
const BackorderStats = lazy(() => import('@/components/backorders/BackorderStats').then(module => ({ default: module.BackorderStats })));

export default function BackordersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { data: stats, isLoading: statsLoading } = useBackorderStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">待進貨商品管理</h1>
          <p className="text-muted-foreground">
            追蹤待處理的預訂商品與訂製商品，避免遺忘向供應商下單
          </p>
        </div>
      </div>

      {/* 統計卡片 */}
      {statsLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : stats && (
        <Suspense
          fallback={
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          }
        >
          <BackorderStats stats={{
            total_items: stats?.total_items || 0,
            unique_products: stats?.unique_products || 0,
            affected_orders: stats?.affected_orders || 0,
            total_quantity: stats?.total_quantity || 0,
            oldest_backorder_date: stats?.oldest_backorder_date || null,
            days_pending: stats?.days_pending || 0
          }} />
        </Suspense>
      )}

      {/* 標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">詳細清單</TabsTrigger>
          <TabsTrigger value="summary">商品彙總</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>待進貨商品明細</CardTitle>
              <CardDescription>
                顯示所有尚未建立進貨單的預訂商品與訂製商品，包含訂單資訊
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SectionLoading variant="inline" text="載入清單..." />}>
                <BackorderList />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>商品彙總</CardTitle>
              <CardDescription>
                按商品變體分組顯示，方便批量轉換為進貨單
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<SectionLoading variant="inline" text="載入彙總..." />}>
                <BackorderSummary />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}