'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Package, Calendar, TrendingUp } from 'lucide-react';

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

interface LowStockTableProps {
  data: {
    data: LowStockItem[];
    links: any;
    meta: any;
  };
}

export function LowStockTable({ data }: LowStockTableProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'low':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '缺貨';
      case 'low':
        return '低庫存';
      default:
        return '正常';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '無銷售記錄';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  if (!data.data || data.data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">暫無預警商品</h3>
        <p className="text-muted-foreground">所有商品庫存充足</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 批量操作 */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm">已選擇 {selectedItems.length} 個商品</span>
          <Button size="sm" variant="outline">
            批量建立進貨單
          </Button>
          <Button size="sm" variant="outline">
            調整預警閾值
          </Button>
        </div>
      )}

      {/* 統計摘要 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">缺貨商品</p>
              <p className="text-2xl font-bold text-red-600">
                {data.data.filter(item => item.severity === 'critical').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">低庫存商品</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.data.filter(item => item.severity === 'low').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">總預警項目</p>
              <p className="text-2xl font-bold text-blue-600">{data.data.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 預警清單表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(data.data.map(item => item.id));
                    } else {
                      setSelectedItems([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>嚴重程度</TableHead>
              <TableHead>商品資訊</TableHead>
              <TableHead>門市</TableHead>
              <TableHead>庫存狀況</TableHead>
              <TableHead>銷售統計</TableHead>
              <TableHead>預估缺貨</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((item) => (
              <TableRow key={item.id} className={item.severity === 'critical' ? 'bg-red-50' : ''}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, item.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== item.id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(item.severity)} className="flex items-center gap-1 w-fit">
                    {getSeverityIcon(item.severity)}
                    {getSeverityText(item.severity)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.store_name}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">現有:</span>
                      <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'}>
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">閾值:</span>
                      <span className="text-sm text-muted-foreground">{item.low_stock_threshold}</span>
                    </div>
                    {item.shortage > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">缺口:</span>
                        <span className="text-sm text-red-600">-{item.shortage}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">最後銷售</span>
                    </div>
                    <p className="text-sm">{formatDate(item.last_sale_date)}</p>
                    <p className="text-xs text-muted-foreground">
                      日均: {item.average_daily_sales.toFixed(1)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {item.estimated_days_until_stockout !== null ? (
                    <div className="text-center">
                      <Badge variant={item.estimated_days_until_stockout <= 3 ? 'destructive' : 'secondary'}>
                        {item.estimated_days_until_stockout} 天
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">無法預估</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      進貨
                    </Button>
                    <Button size="sm" variant="ghost">
                      調整
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {data.meta && data.meta.last_page > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.meta.current_page <= 1}>
              上一頁
            </Button>
            <span className="px-3 py-2 text-sm">
              第 {data.meta.current_page} 頁，共 {data.meta.last_page} 頁
            </span>
            <Button variant="outline" size="sm" disabled={data.meta.current_page >= data.meta.last_page}>
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}