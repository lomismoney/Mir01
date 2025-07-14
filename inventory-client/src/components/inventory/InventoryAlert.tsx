'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useInventoryAlertSummary } from '@/hooks/queries/inventory/useInventoryAlerts';
import type { paths } from '@/types/api';

// 使用從 API 生成的類型
type InventoryAlertSummaryResponse = paths['/api/inventory/alerts/summary']['get']['responses'][200]['content']['application/json'];
type InventoryAlertSummary = NonNullable<InventoryAlertSummaryResponse['data']>;

export function InventoryAlert() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: summary, isLoading, refetch } = useInventoryAlertSummary();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading || !summary) {
    return null;
  }

  const { alerts, critical_stock_count, low_stock_count, top_urgent_items } = summary;
  const hasAlerts = (critical_stock_count || 0) > 0 || (low_stock_count || 0) > 0;

  if (!hasAlerts) {
    return null;
  }

  // 根據健康分數決定警示等級
  const getHealthStatus = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: '良好' };
    if (score >= 70) return { variant: 'default' as const, label: '正常' };
    if (score >= 50) return { variant: 'destructive' as const, label: '警告' };
    return { variant: 'destructive' as const, label: '危險' };
  };

  const healthStatus = getHealthStatus(alerts?.health_score || 0);

  return (
    <Alert variant={healthStatus.variant} className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>庫存預警通知</AlertTitle>
      <AlertDescription>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="space-y-1">
            <p className="text-sm">
              發現 <span className="font-semibold text-red-600">{critical_stock_count || 0}</span> 個商品缺貨，
              <span className="font-semibold text-orange-600">{low_stock_count || 0}</span> 個商品庫存偏低。
            </p>
            <div className="text-xs text-muted-foreground">
              庫存健康度：<Badge variant={healthStatus.variant} className="text-xs">
                {healthStatus.label} {alerts?.health_score || 0}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '刷新中...' : '刷新'}
            </Button>
            <Link href="/inventory/alerts">
              <Button size="sm">
                查看詳情
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 顯示最緊急的商品 */}
        {top_urgent_items && top_urgent_items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">最緊急商品：</p>
            <div className="space-y-1">
              {top_urgent_items.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  <span className="font-medium">{item.product_name}</span> 
                  <span className="mx-1">·</span>
                  <span>SKU: {item.sku}</span>
                  <span className="mx-1">·</span>
                  <span className="text-red-600">剩餘 {item.quantity} 件</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}