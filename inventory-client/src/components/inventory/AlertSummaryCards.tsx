'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Package, TrendingDown, DollarSign, Activity } from 'lucide-react';
import type { paths } from '@/types/api';

// 使用從 API 生成的類型
type InventoryAlertSummaryResponse = paths['/api/inventory/alerts/summary']['get']['responses'][200]['content']['application/json'];
type InventoryAlertSummary = NonNullable<InventoryAlertSummaryResponse['data']>;

interface AlertSummaryCardsProps {
  summary: InventoryAlertSummary;
}

export function AlertSummaryCards({ summary }: AlertSummaryCardsProps) {
  const {
    total_products = 0,
    critical_stock_count = 0,
    low_stock_count = 0,
    normal_stock_count = 0,
    total_inventory_value = 0,
    alerts
  } = summary;

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, text: '優秀' };
    if (score >= 70) return { variant: 'default' as const, text: '良好' };
    if (score >= 50) return { variant: 'secondary' as const, text: '警告' };
    return { variant: 'destructive' as const, text: '危險' };
  };

  const healthScore = alerts?.health_score || 0;
  const healthBadge = getHealthBadge(healthScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {/* 庫存健康度 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            庫存健康度
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore.toFixed(0)}%
            </p>
            <Badge variant={healthBadge.variant} className="text-xs">
              {healthBadge.text}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 缺貨警報 */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            缺貨警報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-red-600">{critical_stock_count}</p>
            <p className="text-xs text-muted-foreground">
              {total_products > 0 ? `佔總數 ${((critical_stock_count / total_products) * 100).toFixed(1)}%` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 庫存總值 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            庫存總值
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              ${total_inventory_value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {total_products} 個商品
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 正常庫存 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-green-600" />
            正常庫存
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{normal_stock_count}</p>
            <p className="text-xs text-muted-foreground">
              {total_products > 0 ? `${((normal_stock_count / total_products) * 100).toFixed(1)}% 商品` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 低庫存警告 */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-orange-600" />
            低庫存警告
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">{low_stock_count}</p>
            <p className="text-xs text-muted-foreground">
              需要關注的商品
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 庫存分佈圖 */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            庫存分佈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 缺貨 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm font-medium">缺貨商品</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {critical_stock_count} / {total_products}
                </span>
              </div>
              <Progress 
                value={total_products > 0 ? (critical_stock_count / total_products) * 100 : 0} 
                className="h-2"
                style={{ '--progress-background': 'rgb(239 68 68)' } as any}
              />
            </div>

            {/* 低庫存 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-sm font-medium">低庫存商品</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {low_stock_count} / {total_products}
                </span>
              </div>
              <Progress 
                value={total_products > 0 ? (low_stock_count / total_products) * 100 : 0} 
                className="h-2"
                style={{ '--progress-background': 'rgb(249 115 22)' } as any}
              />
            </div>

            {/* 正常庫存 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">正常庫存</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {normal_stock_count} / {total_products}
                </span>
              </div>
              <Progress 
                value={total_products > 0 ? (normal_stock_count / total_products) * 100 : 0} 
                className="h-2"
                style={{ '--progress-background': 'rgb(34 197 94)' } as any}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}