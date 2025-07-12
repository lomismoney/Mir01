'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Settings } from 'lucide-react';

export function ThresholdSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          門檻設定
        </CardTitle>
        <CardDescription>
          庫存預警門檻設定功能
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">功能開發中</h3>
            <p className="text-muted-foreground max-w-md">
              門檻設定功能正在開發中，敬請期待。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}