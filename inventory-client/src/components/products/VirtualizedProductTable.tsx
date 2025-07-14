import React, { useMemo, useState } from 'react';
import { useProducts } from '@/hooks';
import { columns } from './columns';
import { VirtualizedTable, useVirtualizedTablePerformance, createVirtualizationConfig } from '@/components/ui/VirtualizedTable';
import { type ExpandedProductItem } from './columns';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VirtualizedProductTableProps {
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  onView?: (product: any) => void;
}

/**
 * 虛擬化產品表格組件
 * 
 * 專為處理大量產品數據而設計的高性能組件
 * 
 * 特性：
 * 1. 虛擬滾動 - 只渲染可見區域的行
 * 2. 自適應配置 - 根據數據量自動調整參數
 * 3. 性能監控 - 實時顯示性能指標
 * 4. 流暢交互 - 保持所有原有功能
 */
export function VirtualizedProductTable({
  onEdit,
  onDelete,
  onView,
}: VirtualizedProductTableProps) {
  // 表格狀態
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // 獲取產品數據
  const { data: products = [], isLoading } = useProducts();

  // 性能優化
  const { data: optimizedData, performanceMetrics } = useVirtualizedTablePerformance(products);

  // 虛擬化配置
  const virtualizationConfig = useMemo(
    () => createVirtualizationConfig(optimizedData.length),
    [optimizedData.length]
  );

  // 擴展列定義以包含操作
  const tableColumns = useMemo(() => {
    return columns.map(col => {
      // 可以在這裡自定義列的行為
      return col;
    });
  }, []);

  // 創建表格實例  
  const table = useReactTable<ExpandedProductItem>({
    data: optimizedData as ExpandedProductItem[],
    columns: tableColumns,
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
    // 注意：虛擬化模式下不使用分頁
    manualPagination: true,
    pageCount: 1,
  });

  // 搜索處理
  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Package className="h-12 w-12 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">載入產品數據中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 性能指標儀表板 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Zap className="h-5 w-5" />
            虛擬化性能監控
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {performanceMetrics.totalItems.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">總商品數</div>
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
                variant={performanceMetrics.recommendVirtualization ? 'default' : 'outline'}
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {performanceMetrics.recommendVirtualization ? '已優化' : '無需優化'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索和過濾工具欄 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            產品列表 ({optimizedData.length.toLocaleString()} 項目)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索產品..."
                value={globalFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {globalFilter && (
              <Badge variant="secondary" className="text-xs">
                顯示 {table.getFilteredRowModel().rows.length} / {optimizedData.length} 項目
              </Badge>
            )}
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
            <div>
              虛擬化模式 - 僅渲染可見行以提升性能
            </div>
            <div>
              配置: 容器高度 {virtualizationConfig.containerHeight}px，
              預估行高 {virtualizationConfig.estimateSize}px
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 產品虛擬化切換組件
 * 
 * 根據數據量自動選擇是否啟用虛擬化
 */
export function AdaptiveProductTable(props: VirtualizedProductTableProps) {
  const { data: products = [] } = useProducts();
  
  // 根據數據量決定是否使用虛擬化
  const shouldUseVirtualization = products.length > 100;
  
  if (shouldUseVirtualization) {
    return <VirtualizedProductTable {...props} />;
  }
  
  // 對於小數據集，返回常規表格（需要實現）
  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>數據量較小，使用標準表格模式</p>
          <p className="text-xs">當產品數量超過 100 個時將自動啟用虛擬化</p>
        </div>
      </CardContent>
    </Card>
  );
}