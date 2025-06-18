'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiTestPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testNativeFetch = async () => {
    setLoading(true);
    try {
      console.log('測試原生 fetch...');
      console.log('Session:', session);
      console.log('API Token:', session?.user?.apiToken);

      // 先獲取最新的 token
      const { getTokenSmart } = await import('@/lib/apiClient');
      const token = await getTokenSmart();
      
      if (!token) {
        throw new Error('No API token found');
      }

      console.log('Using token from getTokenSmart:', token.substring(0, 20) + '...');

      const response = await fetch('http://localhost/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      setResult({ success: true, data });
    } catch (error) {
      console.error('測試失敗:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testOpenApiFetch = async () => {
    setLoading(true);
    try {
      console.log('測試 openapi-fetch...');
      
      // 動態導入以避免服務端渲染問題
      const { apiClient } = await import('@/lib/apiClient');
      
      const response = await apiClient.GET('/api/users');
      console.log('OpenAPI fetch response:', response);
      
      if (response.error) {
        setResult({ success: false, error: 'OpenAPI fetch error', details: 'API returned error' });
      } else {
        setResult({ success: true, data: response.data });
      }
    } catch (error) {
      console.error('OpenAPI fetch 測試失敗:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testGetTokenSmart = async () => {
    setLoading(true);
    try {
      console.log('🔍 測試 getTokenSmart 函數...');
      
      // 動態導入 getTokenSmart 函數
      const { getTokenSmart } = await import('@/lib/apiClient');
      
      console.log('呼叫 getTokenSmart...');
      const token = await getTokenSmart();
      console.log('getTokenSmart 結果:', {
        hasToken: !!token,
        tokenValue: token,
        tokenLength: token?.length
      });
      
      setResult({
        success: !!token,
        tokenFromGetTokenSmart: token,
        tokenFromSession: session?.user?.apiToken,
        comparison: {
          bothExist: !!(token && session?.user?.apiToken),
          areEqual: token === session?.user?.apiToken
        }
      });
      
    } catch (error) {
      console.error('getTokenSmart 測試失敗:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testInterceptor = async () => {
    setLoading(true);
    try {
      console.log('🔍 測試 API 客戶端攔截器...');
      
      // 動態導入 API 客戶端
      const { apiClient } = await import('@/lib/apiClient');
      
      console.log('API 客戶端已導入:', !!apiClient);
      
      // 測試一個會失敗的請求來檢查攔截器
      console.log('發送測試請求到 /api/users...');
      const response = await apiClient.GET('/api/users');
      
      console.log('測試請求響應:', response);
      
      setResult({
        success: true,
        message: '攔截器測試完成，請檢查控制台日誌',
        response: response
      });
      
    } catch (error) {
      console.error('攔截器測試失敗:', error);
      setResult({ success: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">API 測試頁面</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>認證狀態</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>有 Session:</strong> {session ? '是' : '否'}</p>
          <p><strong>用戶名:</strong> {session?.user?.name || '無'}</p>
          <p><strong>有 API Token:</strong> {session?.user?.apiToken ? '是' : '否'}</p>
          <p><strong>Token:</strong> {session?.user?.apiToken || '無'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API 測試</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testNativeFetch} disabled={loading}>
              測試原生 Fetch
            </Button>
            <Button onClick={testOpenApiFetch} disabled={loading}>
              測試 OpenAPI Fetch
            </Button>
            <Button onClick={testGetTokenSmart} disabled={loading}>
              測試 getTokenSmart
            </Button>
            <Button onClick={testInterceptor} disabled={loading}>
              測試攔截器
            </Button>
          </div>
          
          {loading && <p>測試中...</p>}
          
          {result && (
            <div className="mt-4">
              <h3 className="font-bold">測試結果:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
