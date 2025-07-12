import React, { useMemo, useState } from 'react';
import { useOrders } from '@/hooks';
import { createColumns } from './columns';
import { VirtualizedTable, useVirtualizedTablePerformance, createVirtualizationConfig } from '@/components/ui/VirtualizedTable';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, TrendingUp, Zap, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/api-helpers';

interface VirtualizedOrderTableProps {
  onView?: (order: any) => void;
  onEdit?: (order: any) => void;
  onCancel?: (order: any) => void;
  onRefund?: (order: any) => void;
}

/**
 * 虛擬化訂單表格組件
 * 
 * 為大量訂單數據提供高性能渲染解決方案
 * 
 * 特性：
 * 1. 虛擬滾動技術 - 處理數萬條訂單記錄
 * 2. 智能過濾 - 按狀態、日期範圍快速篩選
 * 3. 實時搜索 - 支援訂單號、客戶名稱搜索
 * 4. 性能監控 - 顯示記憶體使用和渲染效率
 */
export function VirtualizedOrderTable({
  onView,
  onEdit,
  onCancel,
  onRefund,
}: VirtualizedOrderTableProps) {
  // 表格狀態
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  
  // 過濾狀態
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // 獲取訂單數據 - 使用分頁參數獲取大量數據
  const { data: orders = [], isLoading } = useOrders({
    page: 1,
    per_page: 10000, // 獲取大量數據以測試虛擬化
  });

  // 性能優化
  const orderData = Array.isArray(orders) ? orders : (orders?.data || []);
  const { data: optimizedData, performanceMetrics } = useVirtualizedTablePerformance(orderData);

  // 應用過濾器
  const filteredData = useMemo((): Order[] => {
    return (optimizedData as Order[]).filter((order: Order) => {
      // 狀態過濾
      if (statusFilter !== 'all' && order.shipping_status !== statusFilter) {
        return false;
      }
      
      // 付款狀態過濾
      if (paymentStatusFilter !== 'all' && order.payment_status !== paymentStatusFilter) {
        return false;
      }
      
      // 全文搜索
      if (globalFilter) {
        const searchTerm = globalFilter.toLowerCase();
        return (
          order.order_number?.toLowerCase().includes(searchTerm) ||
          order.customer?.name?.toLowerCase().includes(searchTerm) ||
          order.customer?.phone?.toLowerCase().includes(searchTerm)
        );
      }
      
      return true;
    });
  }, [optimizedData, statusFilter, paymentStatusFilter, globalFilter]);

  // 虛擬化配置
  const virtualizationConfig = useMemo(
    () => createVirtualizationConfig(filteredData.length),
    [filteredData.length]
  );

  // 創建列定義
  const columns = useMemo(() => {
    return createColumns({
      onPreview: onView || (() => {}),
      onShip: onEdit || (() => {}),
      onRecordPayment: onRefund || (() => {}),
      onRefund: onRefund || (() => {}),
      onCancel: onCancel || (() => {}),
      onDelete: () => {}, // 提供空實現
    });
  }, [onView, onEdit, onCancel, onRefund]);

  // 創建表格實例
  const table = useReactTable<Order>({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <ShoppingCart className="h-12 w-12 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">載入訂單數據中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 虛擬化性能儀表板 */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Zap className="h-5 w-5" />
            訂單虛擬化性能監控
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {performanceMetrics.totalItems.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">總訂單數</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredData.length.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">過濾後數量</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {performanceMetrics.estimatedMemorySaving}
              </div>
              <div className="text-xs text-muted-foreground">記憶體節省</div>
            </div>
            
            <div className="text-center">
              <Badge 
                variant={performanceMetrics.isLargeDataset ? 'default' : 'secondary'}
                className="text-xs"
              >
                {performanceMetrics.isLargeDataset ? '大數據集' : '標準數據集'}
              </Badge>
            </div>
            
            <div className="text-center">
              <Badge 
                variant="default"
                className="text-xs bg-emerald-600"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                虛擬化已啟用
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 過濾和搜索工具欄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            訂單管理 ({filteredData.length.toLocaleString()} / {optimizedData.length.toLocaleString()} 項目)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索訂單號、客戶..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 訂單狀態過濾 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="訂單狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待處理</SelectItem>
                <SelectItem value="processing">處理中</SelectItem>
                <SelectItem value="shipped">已出貨</SelectItem>
                <SelectItem value="delivered">已送達</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>

            {/* 付款狀態過濾 */}
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="付款狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部付款狀態</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="partial">部分付款</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>

            {/* 清除過濾器 */}
            <Button
              variant="outline"
              onClick={() => {
                setGlobalFilter('');
                setStatusFilter('all');
                setPaymentStatusFilter('all');
              }}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              清除過濾
            </Button>
          </div>

          {/* 虛擬化表格 */}
          <VirtualizedTable
            table={table}
            containerHeight={virtualizationConfig.containerHeight}
            estimateSize={virtualizationConfig.estimateSize}
            overscan={virtualizationConfig.overscan}
            className="w-full"
          />

          {/* 表格信息 */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>虛擬化模式 - 高性能訂單列表</span>
              {(statusFilter !== 'all' || paymentStatusFilter !== 'all' || globalFilter) && (
                <Badge variant="secondary" className="text-xs">
                  過濾器已啟用
                </Badge>
              )}
            </div>
            <div>
              容器: {virtualizationConfig.containerHeight}px，
              行高: {virtualizationConfig.estimateSize}px
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 訂單自適應虛擬化組件
 * 
 * 根據數據量自動決定虛擬化策略
 */
export function AdaptiveOrderTable(props: VirtualizedOrderTableProps) {
  const { data: orders = [] } = useOrders();
  
  // 安全地獲取數據陣列長度
  const orderArray = Array.isArray(orders) ? orders : (orders?.data || []);
  const shouldUseVirtualization = orderArray.length > 50;
  
  if (shouldUseVirtualization) {
    return <VirtualizedOrderTable {...props} />;
  }
  
  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>訂單數量較少，使用標準表格模式</p>
          <p className="text-xs">當訂單數量超過 50 個時將自動啟用虛擬化</p>
        </div>
      </CardContent>
    </Card>
  );
}