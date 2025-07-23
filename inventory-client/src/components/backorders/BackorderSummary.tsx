'use client';

import { useState } from 'react';
import { useBackorderSummary } from '@/hooks/queries/backorders/useBackorders';
import { useConvertBackorders } from '@/hooks/mutations/backorders/useConvertBackorders';
import { SimpleDataTable } from '@/components/simple-data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { MoneyHelper } from '@/lib/money-helper';
import { ArrowUpDown, Package2, Loader2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BackorderSummaryItem {
  product_variant_id: number;
  product_name: string;
  sku: string;
  total_quantity: number;
  order_count: number;
  earliest_date: string;
  latest_date: string;
  estimated_cost: number;
  item_ids: number[];
}

export function BackorderSummary() {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  
  const { data, isLoading } = useBackorderSummary();
  const convertMutation = useConvertBackorders();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set<number>(
        data?.data?.flatMap((item: any) => item.item_ids || []) || []
      );
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemIds: number[], checked: boolean) => {
    const newSelection = new Set(selectedItems);
    itemIds.forEach(id => {
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
    });
    setSelectedItems(newSelection);
  };

  const handleConvert = async () => {
    if (selectedItems.size === 0) return;

    await convertMutation.mutateAsync({
      item_ids: Array.from(selectedItems).map(String),
    });

    setSelectedItems(new Set());
    setShowConvertDialog(false);
  };

  const columns: ColumnDef<BackorderSummaryItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            (data?.data?.length || 0) > 0 &&
            (data?.data || []).every((item: any) => 
              (item.item_ids || []).every((id: number) => selectedItems.has(id))
            )
          }
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.original.item_ids.every(id => selectedItems.has(id))}
          onCheckedChange={(checked) => 
            handleSelectItem(row.original.item_ids, checked as boolean)
          }
          aria-label="Select row"
        />
      ),
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
      accessorKey: 'total_quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          總數量
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'order_count',
      header: '訂單數',
    },
    {
      accessorKey: 'estimated_cost',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          預估成本
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => MoneyHelper.format(row.original.estimated_cost),
    },
    {
      accessorKey: 'earliest_date',
      header: '最早訂單',
      cell: ({ row }) => formatDate(row.original.earliest_date),
    },
    {
      accessorKey: 'latest_date',
      header: '最新訂單',
      cell: ({ row }) => formatDate(row.original.latest_date),
    },
  ];

  const selectedCount = selectedItems.size;
  const selectedSummary = (data?.data || []).filter((item: any) =>
    (item.item_ids || []).some((id: number) => selectedItems.has(id))
  );

  const totalQuantity = selectedSummary.reduce(
    (sum: number, item: any) => sum + (item.total_quantity || 0), 
    0
  );
  const totalCost = selectedSummary.reduce(
    (sum: number, item: any) => sum + (item.estimated_cost || 0), 
    0
  );

  return (
    <div className="space-y-4">
      {selectedCount > 0 && (
        <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              已選擇 {selectedCount} 個項目
            </p>
            <p className="text-sm text-muted-foreground">
              總數量: {totalQuantity} | 預估成本: {MoneyHelper.format(totalCost)}
            </p>
          </div>
          <Button 
            onClick={() => setShowConvertDialog(true)}
            disabled={convertMutation.isPending}
          >
            {convertMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Package2 className="mr-2 h-4 w-4" />
            轉換為進貨單
          </Button>
        </div>
      )}

      <SimpleDataTable
        columns={columns as any}
        data={data?.data || []}
      />

      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認轉換為進貨單</AlertDialogTitle>
            <AlertDialogDescription>
              您選擇了 {selectedCount} 個預訂商品項目，將會建立相應的進貨單。
              此操作將會：
              <ul className="list-disc list-inside mt-2">
                <li>按門市分組建立進貨單</li>
                <li>將預訂商品與進貨單項目關聯</li>
                <li>更新預訂商品的採購狀態</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvert}
              disabled={convertMutation.isPending}
            >
              {convertMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  處理中...
                </>
              ) : (
                '確認轉換'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}