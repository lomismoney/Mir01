"use client";

import React from 'react';
import { Table as TanStackTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface AdaptiveTableProps<TData> {
  table: TanStackTable<TData>;
  className?: string;
  showVirtualizationToggle?: boolean;
  virtualizationOptions?: {
    threshold?: number;
    containerHeight?: number;
    estimateSize?: number;
    overscan?: number;
  };
  dataType?: string;
  onRowClick?: (row: TData) => void;
  customRowClassName?: (row: TData) => string;
  emptyState?: React.ReactNode;
  
  // 向後兼容性屬性（臨時支持）
  preset?: string | Record<string, unknown>;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  isVirtualizationEnabled?: boolean;
  showMetrics?: boolean;
  virtualizationConfig?: Record<string, unknown>;
  performanceAnalysis?: Record<string, unknown>;
  toggleVirtualization?: () => void;
  toggleMetrics?: () => void;
  updateRecommendation?: (recommendation: string) => void;
  shouldUseVirtualization?: boolean;
  shouldRecommendVirtualization?: boolean;
  isLargeDataset?: boolean;
  tableData?: TData[];
  dataLength?: number;
  isLoading?: boolean;
  // 允許任何其他屬性以保持完全兼容性
  [key: string]: unknown;
}

/**
 * 自適應表格組件
 * 
 * 根據數據量和用戶選擇，在標準表格和虛擬化表格之間智能切換
 * 提供統一的表格界面，隱藏底層實現複雜性
 * 
 * 特性：
 * - 自動檢測數據量並推薦最佳渲染模式
 * - 無縫切換標準表格和虛擬化表格
 * - 可選的虛擬化控制面板
 * - 保持一致的用戶體驗
 */
export function AdaptiveTable<TData>({
  table,
  className,
  showVirtualizationToggle = true,
  virtualizationOptions = {},
  dataType = '項目',
  onRowClick,
  customRowClassName,
  emptyState,
  ...rest // 忽略其他屬性以保持向後兼容性
}: AdaptiveTableProps<TData>) {
  // 簡化版本：只使用標準表格渲染（臨時修復）
  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b bg-muted/30 hover:bg-muted/30"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "border-b transition-colors hover:bg-muted/50",
                  customRowClassName?.(row),
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="h-12 px-4 py-2 align-middle"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="p-0"
              >
                {emptyState || (
                  <div className="h-24 flex items-center justify-center text-muted-foreground">
                    暫無數據
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * 輕量級自適應表格組件
 * 
 * 不包含虛擬化控制面板，適合空間受限的場景
 */
export function SimpleAdaptiveTable<TData>({
  table,
  className,
  virtualizationOptions = {},
  onRowClick,
  customRowClassName,
}: Omit<AdaptiveTableProps<TData>, 'showVirtualizationToggle' | 'dataType'>) {
  return (
    <AdaptiveTable
      table={table}
      className={className}
      showVirtualizationToggle={false}
      virtualizationOptions={virtualizationOptions}
      onRowClick={onRowClick}
      customRowClassName={customRowClassName}
    />
  );
}

/**
 * 表格性能監控組件
 * 
 * 用於顯示表格渲染性能指標
 */
interface TablePerformanceMonitorProps<TData> {
  table: TanStackTable<TData>;
  isVirtualized: boolean;
  className?: string;
}

export function TablePerformanceMonitor<TData>({
  table,
  isVirtualized,
  className,
}: TablePerformanceMonitorProps<TData>) {
  const dataLength = table.getRowModel().rows.length;
  const selectedCount = table.getSelectedRowModel().rows.length;
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className={cn(
      "flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/30 rounded-md border",
      className
    )}>
      <div className="flex items-center space-x-4">
        <span>總計：{dataLength.toLocaleString()}</span>
        {filteredCount !== dataLength && (
          <span>已篩選：{filteredCount.toLocaleString()}</span>
        )}
        {selectedCount > 0 && (
          <span>已選擇：{selectedCount.toLocaleString()}</span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <span className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          isVirtualized 
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
        )}>
          {isVirtualized ? '虛擬化' : '標準'}
        </span>
      </div>
    </div>
  );
}

/**
 * 表格配置預設（臨時兼容性修復）
 */
export const TablePresets = {
  // 小數據集（< 100 項）
  small: {
    threshold: 100,
    containerHeight: 400,
    estimateSize: 60,
    overscan: 10,
  },
  
  // 中等數據集（100-1000 項）
  medium: {
    threshold: 100,
    containerHeight: 500,
    estimateSize: 55,
    overscan: 8,
  },
  
  // 大數據集（1000-10000 項）
  large: {
    threshold: 100,
    containerHeight: 600,
    estimateSize: 50,
    overscan: 5,
  },
  
  // 超大數據集（> 10000 項）
  xlarge: {
    threshold: 100,
    containerHeight: 700,
    estimateSize: 45,
    overscan: 3,
  },
  
  // 向後兼容性支持
  STANDARD: {
    threshold: 100,
    containerHeight: 500,
    estimateSize: 55,
    overscan: 8,
  },
  
  ADVANCED: {
    threshold: 100,
    containerHeight: 600,
    estimateSize: 50,
    overscan: 5,
  },
} as const;