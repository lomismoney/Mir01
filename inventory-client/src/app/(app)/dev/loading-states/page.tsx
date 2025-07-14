"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TableSkeleton,
  CardSkeleton,
  StatsCardSkeleton,
  DetailCardSkeleton,
  FormSkeleton,
  SearchFormSkeleton,
  FilterFormSkeleton,
  LoadingSpinner,
  PageLoading,
  SectionLoading,
  LoadingBoundary,
} from "@/components/ui/skeleton";
import { useEnhancedLoadingState, useGlobalLoadingState } from "@/hooks";

/**
 * 載入狀態展示頁面
 * 開發工具，用於預覽所有載入狀態組件
 */
export default function LoadingStatesPage() {
  const [activeTab, setActiveTab] = useState("skeletons");
  const [showError, setShowError] = useState(false);

  // 測試載入狀態
  const loadingState = useEnhancedLoadingState("demo", {
    progressTracking: true,
    globalTracking: true,
  });

  const globalLoading = useGlobalLoadingState();

  // 模擬異步操作
  const simulateLoading = async () => {
    await loadingState.executeWithProgress(
      async (signal) => {
        for (let i = 0; i <= 100; i += 10) {
          if (signal.aborted) break;
          await new Promise(resolve => setTimeout(resolve, 200));
          loadingState.setProgress?.(i);
        }
        return "Success!";
      },
      {
        successMessage: "操作成功完成",
      }
    );
  };

  const simulateError = async () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">載入狀態組件展示</h1>
        <p className="text-muted-foreground">
          統一的載入狀態和骨架屏設計系統
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="skeletons">骨架屏</TabsTrigger>
          <TabsTrigger value="spinners">載入動畫</TabsTrigger>
          <TabsTrigger value="states">狀態管理</TabsTrigger>
          <TabsTrigger value="examples">使用範例</TabsTrigger>
        </TabsList>

        <TabsContent value="skeletons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>表格骨架屏</CardTitle>
              <CardDescription>用於表格載入時的佔位顯示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">完整表格骨架屏</p>
                <TableSkeleton rows={5} columns={5} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">簡潔表格骨架屏</p>
                <TableSkeleton rows={3} columns={4} compact />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>卡片骨架屏</CardTitle>
              <CardDescription>用於卡片載入時的佔位顯示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">標準卡片</p>
                <CardSkeleton count={3} columns={3} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">統計卡片</p>
                <StatsCardSkeleton count={4} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">詳情卡片</p>
                <DetailCardSkeleton />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>表單骨架屏</CardTitle>
              <CardDescription>用於表單載入時的佔位顯示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">標準表單</p>
                <FormSkeleton fields={4} />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">搜尋表單</p>
                <SearchFormSkeleton />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">篩選表單</p>
                <FilterFormSkeleton />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spinners" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>載入動畫</CardTitle>
              <CardDescription>統一的載入動畫組件</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">小尺寸</p>
                  <div className="flex justify-center p-4">
                    <LoadingSpinner size="sm" text="載入中..." />
                  </div>
                </div>
                
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">中尺寸</p>
                  <div className="flex justify-center p-4">
                    <LoadingSpinner size="md" text="載入中..." />
                  </div>
                </div>
                
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium">大尺寸</p>
                  <div className="flex justify-center p-4">
                    <LoadingSpinner size="lg" text="載入中..." />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>載入狀態</CardTitle>
              <CardDescription>不同場景的載入狀態</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">頁面載入</p>
                <div className="border rounded-lg h-64">
                  <PageLoading text="載入頁面..." />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">區塊載入</p>
                <SectionLoading text="載入內容..." />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">行內載入</p>
                <SectionLoading variant="inline" text="處理中..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="states" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>載入狀態管理</CardTitle>
              <CardDescription>增強版載入狀態管理示範</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={simulateLoading} disabled={loadingState.isLoading}>
                  模擬載入
                </Button>
                <Button onClick={simulateError} variant="destructive">
                  模擬錯誤
                </Button>
                <Button 
                  onClick={() => loadingState.cancel()} 
                  disabled={!loadingState.isAbortable}
                  variant="outline"
                >
                  取消操作
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">
                  當前狀態：<span className="font-medium">{loadingState.state}</span>
                </p>
                {loadingState.progress !== undefined && (
                  <p className="text-sm">
                    進度：<span className="font-medium">{loadingState.progress}%</span>
                  </p>
                )}
                <p className="text-sm">
                  重試次數：<span className="font-medium">{loadingState.retryCount}</span>
                </p>
              </div>
              
              <LoadingBoundary
                isLoading={loadingState.isLoading}
                error={showError ? new Error("模擬錯誤") : null}
                loadingText="自定義載入文字..."
                errorText="載入失敗了！"
                onRetry={() => setShowError(false)}
                type="section"
              >
                <Card>
                  <CardContent className="p-6">
                    <p>這是受保護的內容區域</p>
                  </CardContent>
                </Card>
              </LoadingBoundary>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>全局載入狀態</CardTitle>
              <CardDescription>追蹤所有進行中的載入操作</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  是否有載入中：<span className="font-medium">{globalLoading.isAnyLoading ? "是" : "否"}</span>
                </p>
                <p className="text-sm">
                  載入中的操作：<span className="font-medium">{globalLoading.loadingKeys.join(", ") || "無"}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>使用範例</CardTitle>
              <CardDescription>在實際場景中使用載入組件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Suspense Fallback</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`<Suspense fallback={<LoadingFallback type="page" text="載入中..." />}>
  <YourComponent />
</Suspense>`}</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">表格載入</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`{isLoading ? (
  <TableSkeleton rows={10} columns={5} />
) : (
  <DataTable data={data} columns={columns} />
)}`}</code>
                </pre>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">載入狀態管理</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{`const loadingState = useEnhancedLoadingState('myOperation');

await loadingState.executeWithProgress(
  async (signal) => {
    // 你的異步操作
    return await fetchData();
  },
  { successMessage: '載入成功' }
);`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}