'use client';

import { useState, useMemo } from 'react';
import { useBackorders } from '@/hooks/queries/backorders/useBackorders';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Package, ShoppingCart } from 'lucide-react';
import { BackorderStatusDialog } from './BackorderStatusDialog';
import { BackorderGroupedList } from './BackorderGroupedList';
import { CreatePurchaseDialog } from './CreatePurchaseDialog';
import { useBatchSelection } from '@/hooks/useBatchSelection';

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
  integrated_status?: string;
  integrated_status_text?: string;
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
  transfer?: {
    id: number;
    from_store_id: number;
    to_store_id: number;
    quantity: number;
    status: string;
    notes: string;
    created_at: string;
  };
}

export function BackorderList() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<BackorderItem | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [createPurchaseOpen, setCreatePurchaseOpen] = useState(false);
  // 固定為按訂單分組模式
  
  const filters = {
    ...(dateRange?.from && { date_from: dateRange.from.toISOString().split('T')[0] }),
    ...(dateRange?.to && { date_to: dateRange.to.toISOString().split('T')[0] }),
    group_by_order: 1, // 固定為按訂單分組
  };

  const { data, isLoading, error, refetch } = useBackorders(filters);

  // 移除清單模式相關代碼

  // 對分組資料進行過濾
  const filteredGroupedData = data?.data ? 
    (data.data as any[]).filter(order => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term) ||
        order.items?.some((item: any) => 
          item.product_name?.toLowerCase().includes(term) ||
          item.sku?.toLowerCase().includes(term)
        )
      );
    }) : [];

  // 將分組資料轉換為可選擇的項目
  const allSelectableItems = useMemo(() => {
    return filteredGroupedData.flatMap(order => 
      order.items?.map((item: any) => ({
        id: item.id,
        order_id: order.order_id,
        order_number: order.order_number,
        product_variant_id: item.product_variant_id || 0,
        quantity: item.quantity,
        sku: item.sku,
        product_name: item.product_name,
        store_id: 1, // 假設都是門市 1，可以根據實際需求調整
      })) || []
    );
  }, [filteredGroupedData]);

  // 初始化批量選擇 Hook
  const batchSelection = useBatchSelection(allSelectableItems);

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

      {/* 批量選擇操作欄 */}
      {batchSelection.selectedCount > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              已選擇 {batchSelection.selectedCount} 個項目
            </span>
            <span className="text-sm text-muted-foreground">
              總數量：{batchSelection.getTotalSelectedQuantity()}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={batchSelection.clearSelection}
            >
              清空選擇
            </Button>
            <Button
              size="sm"
              onClick={() => setCreatePurchaseOpen(true)}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              建立進貨單
            </Button>
          </div>
        </div>
      )}

      <BackorderGroupedList
        data={filteredGroupedData}
        onRefetch={refetch}
        batchSelection={batchSelection}
      />

      <BackorderStatusDialog
        item={selectedItem}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onSuccess={() => {
          refetch();
          setSelectedItem(null);
        }}
      />

      <CreatePurchaseDialog
        open={createPurchaseOpen}
        onOpenChange={setCreatePurchaseOpen}
        selectedItems={batchSelection.selectedItems}
        onSuccess={() => {
          refetch();
          batchSelection.clearSelection();
        }}
      />
    </div>
  );
}