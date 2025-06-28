'use client';

import { useStoresPlatform } from '@/hooks/queries/useStoresPlatform';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * API Platform 整合測試頁面
 */
export default function ApiPlatformTestPage() {
  const { data, isLoading, error } = useStoresPlatform({
    page: 1,
    per_page: 10
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">API Platform 整合測試</h1>
        <p className="text-muted-foreground mt-2">測試 Store 模型的 API Platform 端點</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>錯誤</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '獲取數據失敗'}
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API 響應摘要</CardTitle>
              <CardDescription>
                共 {data.meta.total} 筆記錄，第 {data.meta.page} 頁
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Badge variant="outline">總記錄數: {data.meta.total}</Badge>
                </div>
                <div>
                  <Badge variant="outline">當前頁: {data.meta.page}</Badge>
                </div>
                <div>
                  <Badge variant="outline">每頁數量: {data.meta.perPage}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分店列表</CardTitle>
              <CardDescription>從 API Platform 獲取的數據</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.stores.map((store) => (
                  <div key={store.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{store.name}</h3>
                        {store.address && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {store.address}
                          </p>
                        )}
                      </div>
                      <Badge variant={store.is_active === '1' ? 'default' : 'secondary'}>
                        {store.is_active === '1' ? '啟用' : '停用'}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      ID: {store.id}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>原始 API 響應</CardTitle>
              <CardDescription>用於調試的完整響應數據</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 