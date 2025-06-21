"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/queries/useEntityQueries";
import apiClient from "@/lib/apiClient";

/**
 * API 診斷組件
 * 用於測試和診斷商品 API 相關問題
 */
export function ApiDiagnostic() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const { data: session, status } = useSession();
  const { data: productsData, isLoading, error } = useProducts({});

  /**
   * 添加測試結果
   */
  const addTestResult = (testName: string, success: boolean, data: any) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  /**
   * 執行完整的診斷測試
   */
  const runDiagnostic = async () => {
    setIsTestRunning(true);
    setTestResults([]);

    try {
      // 測試 1: 檢查環境變數
      addTestResult("環境變數檢查", true, {
        API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      });

      // 測試 2: Session 狀態
      addTestResult("Session 狀態", !!session, {
        status,
        hasSession: !!session,
        hasAccessToken: !!session?.accessToken,
        user: session?.user?.email || "未登入"
      });

      // 測試 3: 直接 API 調用
      try {
        const response = await apiClient.GET('/api/products');
        addTestResult("直接 API 調用", !response.error, {
          success: !response.error,
          status: response.response?.status,
          data: response.data,
          error: response.error
        });
      } catch (apiError) {
        addTestResult("直接 API 調用", false, {
          error: apiError
        });
      }

      // 測試 4: useProducts Hook 結果
      addTestResult("useProducts Hook", !error, {
        isLoading,
        hasError: !!error,
        error: error?.message,
        dataCount: Array.isArray(productsData) ? productsData.length : (productsData?.data?.length || 0),
        rawData: productsData
      });

    } catch (generalError) {
      addTestResult("診斷過程", false, {
        error: generalError
      });
    }

    setIsTestRunning(false);
  };

  /**
   * 清除測試結果
   */
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API 診斷工具</CardTitle>
        <div className="flex gap-2">
          <Button onClick={runDiagnostic} disabled={isTestRunning}>
            {isTestRunning ? "診斷中..." : "執行診斷"}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            清除結果
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session 狀態 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">登入狀態</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={status === "authenticated" ? "default" : "destructive"}>
                {status}
              </Badge>
              {session?.user?.email && (
                <p className="text-sm mt-2">用戶: {session.user.email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">useProducts Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant={isLoading ? "secondary" : "default"}>
                  {isLoading ? "載入中" : "已載入"}
                </Badge>
                {error && (
                  <Badge variant="destructive">錯誤</Badge>
                )}
                <p className="text-sm">
                  商品數量: {Array.isArray(productsData) ? productsData.length : (productsData as any)?.data?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 測試結果 */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">診斷結果</h3>
            {testResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{result.testName}</CardTitle>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "通過" : "失敗"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 商品列表預覽 */}
        {productsData && Array.isArray(productsData) && productsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">商品列表預覽</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {productsData.slice(0, 3).map((product: any) => (
                  <div key={product.id} className="p-2 border rounded">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {product.id} | 變體數: {product.variants?.length || 0}
                    </p>
                  </div>
                ))}
                {productsData.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    還有 {productsData.length - 3} 個商品...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
} 