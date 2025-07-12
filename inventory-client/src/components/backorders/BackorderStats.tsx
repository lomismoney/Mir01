import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

interface BackorderStatsProps {
  stats: {
    total_items: number;
    unique_products: number;
    affected_orders: number;
    total_quantity: number;
    oldest_backorder_date: string | null;
    days_pending: number;
  };
}

export function BackorderStats({ stats }: BackorderStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            待處理項目
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_items}</div>
          <p className="text-xs text-muted-foreground">
            個預訂商品項目
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            商品種類
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unique_products}</div>
          <p className="text-xs text-muted-foreground">
            種不同商品
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            影響訂單
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.affected_orders}</div>
          <p className="text-xs text-muted-foreground">
            張訂單包含預訂商品
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            最長等待
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.days_pending > 0 ? `${stats.days_pending} 天` : '無'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.oldest_backorder_date ? '自' + new Date(stats.oldest_backorder_date).toLocaleDateString() : ''}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}