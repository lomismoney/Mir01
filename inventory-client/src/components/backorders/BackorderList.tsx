'use client';

import { useState } from 'react';
import { useBackorders } from '@/hooks/queries/backorders/useBackorders';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { ArrowUpDown, Calendar, Package } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface BackorderItem {
  id: number;
  order_id: number;
  product_variant_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  is_backorder: boolean;
  purchase_item_id: number | null;
  purchase_status: string;
  purchase_status_text: string;
  created_at: string;
  order: {
    order_number: string;
    customer?: {
      name: string;
    };
  };
  productVariant?: {
    sku: string;
    cost: number;
    product?: {
      name: string;
    };
  };
}

export function BackorderList() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const filters = {
    date_from: dateRange?.from?.toISOString().split('T')[0],
    date_to: dateRange?.to?.toISOString().split('T')[0],
  };

  const { data, isLoading } = useBackorders(filters);

  const columns: ColumnDef<BackorderItem>[] = [
    {
      accessorKey: 'order.order_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          訂單編號
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'order.customer.name',
      header: '客戶',
      cell: ({ row }) => row.original.order.customer?.name || '-',
    },
    {
      accessorKey: 'product_name',
      header: '商品名稱',
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => (
        <code className="text-sm">{row.original.sku}</code>
      ),
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          數量
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'purchase_status_text',
      header: '採購狀態',
      cell: ({ row }) => {
        const status = row.original.purchase_status;
        const variant = status === 'pending_purchase' ? 'destructive' : 'secondary';
        
        return (
          <Badge variant={variant}>
            {row.original.purchase_status_text}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          下單日期
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'days_pending',
      header: '等待天數',
      cell: ({ row }) => {
        const days = Math.floor(
          (new Date().getTime() - new Date(row.original.created_at).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return (
          <span className={days > 7 ? 'text-destructive' : ''}>
            {days} 天
          </span>
        );
      },
    },
  ];

  const filteredData = data?.data?.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item as any).product_name?.toLowerCase().includes(term) ||
      (item as any).sku?.toLowerCase().includes(term) ||
      (item as any).order?.order_number?.toLowerCase().includes(term) ||
      (item as any).order?.customer?.name?.toLowerCase().includes(term) ||
      (item as any).productVariant?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">搜尋</Label>
          <Input
            id="search"
            placeholder="搜尋商品名稱、SKU、訂單編號..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label>日期範圍</Label>
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
        </div>
      </div>

      <SimpleDataTable
        columns={columns}
        data={filteredData as any || []}
      />
    </div>
  );
}