'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, TrendingDown, TrendingUp, Settings, Filter, RefreshCw } from 'lucide-react';
import { useLowStockItems, useInventoryAlertSummary } from '@/hooks/queries/inventory/useInventoryAlerts';
import { SimpleDataTable } from '@/components/simple-data-table';
import { ColumnDef } from '@tanstack/react-table';

interface LowStockItem {
  id: number;
  product_variant_id: number;
  store_id: number;
  store_name: string;
  product_name: string;
  sku: string;
  quantity: number;
  low_stock_threshold: number;
  shortage: number;
  severity: 'critical' | 'low' | 'normal';
  last_sale_date: string | null;
  average_daily_sales: number;
  estimated_days_until_stockout: number | null;
}

const columns: ColumnDef<LowStockItem>[] = [
  {
    accessorKey: 'product_name',
    header: '商品名稱',
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
  },
  {
    accessorKey: 'store_name',
    header: '門市',
  },
  {
    accessorKey: 'quantity',
    header: '目前庫存',
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      const severity = row.original.severity;
      return (
        <div className="flex items-center gap-2">
          <span>{quantity}</span>
          <Badge 
            variant={severity === 'critical' ? 'destructive' : severity === 'low' ? 'secondary' : 'default'}
          >
            {severity === 'critical' ? '嚴重不足' : severity === 'low' ? '庫存偏低' : '正常'}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'low_stock_threshold',
    header: '警戒線',
  },
  {
    accessorKey: 'shortage',
    header: '不足數量',
    cell: ({ row }) => {
      const shortage = row.getValue('shortage') as number;
      return <span className="text-red-600 font-medium">{shortage}</span>;
    },
  },
  {
    accessorKey: 'estimated_days_until_stockout',
    header: '預估耗盡天數',
    cell: ({ row }) => {
      const days = row.getValue('estimated_days_until_stockout') as number | null;
      if (!days) return <span className="text-muted-foreground">--</span>;
      return (
        <span className={days <= 7 ? 'text-red-600 font-medium' : days <= 14 ? 'text-orange-600' : ''}>
          {days} 天
        </span>
      );
    },
  },
];

export default function InventoryAlertsPage() {
  const [filters, setFilters] = useState<{
    severity?: 'critical' | 'low' | 'all';
    store_id?: number;
  }>({});

  const { data: lowStockData, isLoading: isLoadingLowStock, refetch: refetchLowStock } = useLowStockItems(filters);
  const { data: summary, isLoading: isLoadingSummary } = useInventoryAlertSummary();

  const handleRefresh = () => {
    refetchLowStock();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">庫存預警</h1>
          <p className="text-muted-foreground">
            監控庫存水位，及時補貨避免缺貨
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            篩選
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            設定門檻
          </Button>
        </div>
      </div>

      {/* 概覽卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總商品數</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingSummary ? '--' : summary?.total_products || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">嚴重不足</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoadingSummary ? '--' : summary?.critical_stock_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {!isLoadingSummary && summary?.alerts?.critical_percentage !== undefined ? 
                `佔總數 ${summary.alerts.critical_percentage.toFixed(1)}%` : 
                ''
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">庫存偏低</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoadingSummary ? '--' : summary?.low_stock_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {!isLoadingSummary && summary?.alerts?.low_percentage !== undefined ? 
                `佔總數 ${summary.alerts.low_percentage.toFixed(1)}%` : 
                ''
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">庫存健康度</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingSummary ? '--' : summary?.alerts?.health_score ? `${summary.alerts.health_score}%` : '100%'}
            </div>
            <p className="text-xs text-muted-foreground">
              整體庫存狀況良好
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 低庫存清單 */}
      <Card>
        <CardHeader>
          <CardTitle>低庫存商品清單</CardTitle>
          <CardDescription>
            需要關注的商品，建議及時補貨
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLowStock ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">載入中...</div>
            </div>
          ) : (
            <SimpleDataTable
              columns={columns}
              data={(lowStockData as any)?.data || []}
              searchKey="product_name"
              searchPlaceholder="搜尋商品名稱..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}