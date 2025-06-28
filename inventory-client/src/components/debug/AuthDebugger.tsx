"use client";

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

/**
 * 認證狀態調試組件
 * 
 * 用於診斷 next-auth session 和 token 問題
 */
export function AuthDebugger() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState<string>('');

  /**
   * 測試 API Platform 認證請求
   */
  const testApiAuth = async () => {
    try {
      setTestResult('測試中...');
      
      // 測試 1: 檢查 Session
      console.log('🔍 Session 狀態:', { session, status });
      
      // 測試 2: 手動發送認證請求
      const response = await fetch('http://localhost:8000/api/stores', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 手動請求結果:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ 認證成功 (${response.status})\n資料: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        setTestResult(`❌ 認證失敗 (${response.status})\n錯誤: ${errorText}`);
      }
      
    } catch (error) {
      console.error('測試錯誤:', error);
      setTestResult(`💥 請求異常: ${error}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔐 認證狀態調試</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session 狀態 */}
          <div>
            <h3 className="font-semibold mb-2">📋 Session 狀態</h3>
            <div className="bg-muted p-3 rounded text-sm">
              <div><strong>Status:</strong> {status}</div>
              <div><strong>User ID:</strong> {session?.user?.id || 'N/A'}</div>
              <div><strong>Username:</strong> {session?.user?.username || 'N/A'}</div>
              <div><strong>Has Token:</strong> {session?.accessToken ? '✅ 是' : '❌ 否'}</div>
              {session?.accessToken && (
                <div><strong>Token 前綴:</strong> {session.accessToken.substring(0, 20)}...</div>
              )}
            </div>
          </div>

          {/* 測試按鈕 */}
          <div>
            <Button onClick={testApiAuth} className="w-full">
              🧪 測試 API 認證
            </Button>
          </div>

          {/* 測試結果 */}
          {testResult && (
            <div>
              <h3 className="font-semibold mb-2">📊 測試結果</h3>
              <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}

          {/* Session 完整資料 */}
          <details>
            <summary className="cursor-pointer font-semibold">🔍 Session 完整資料</summary>
            <pre className="bg-muted p-3 rounded text-xs mt-2 overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
} 