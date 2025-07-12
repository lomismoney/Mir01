import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table as TableType,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VirtualizedTableProps<TData> {
  table: TableType<TData>;
  containerHeight?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
}

/**
 * 虛擬化表格組件
 * 
 * 特性：
 * 1. 支援大量數據的高性能渲染
 * 2. 只渲染可見區域的行，大幅提升性能
 * 3. 平滑滾動體驗
 * 4. 與 @tanstack/react-table 完美整合
 * 5. 響應式設計支援
 */
export function VirtualizedTable<TData>({
  table,
  containerHeight = 600,
  estimateSize = 50,
  overscan = 5,
  className = '',
}: VirtualizedTableProps<TData>) {
  const { rows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  // 創建虛擬化器
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // 計算虛擬項目
  const virtualItems = virtualizer.getVirtualItems();
  
  // 計算總高度和填充
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-left"
                  style={{
                    width: header.getSize(),
                  }}
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
      </Table>

      {/* 虛擬化滾動容器 */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: `${containerHeight}px`,
        }}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* 頂部填充 */}
          {paddingTop > 0 && (
            <div style={{ height: paddingTop }} />
          )}

          {/* 渲染可見的行 */}
          <Table>
            <TableBody>
              {virtualItems.map((virtualItem) => {
                const row = rows[virtualItem.index];
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualItem.index}
                    className={`
                      ${row.getIsSelected() ? 'bg-muted/50' : ''}
                      hover:bg-muted/50 transition-colors
                    `}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* 底部填充 */}
          {paddingBottom > 0 && (
            <div style={{ height: paddingBottom }} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 虛擬化表格的性能優化 Hook
 */
export function useVirtualizedTablePerformance<TData>(data: TData[]) {
  // 數據記憶化
  const memoizedData = useMemo(() => data, [data]);
  
  // 計算性能指標
  const performanceMetrics = useMemo(() => ({
    totalItems: data.length,
    isLargeDataset: data.length > 1000,
    recommendVirtualization: data.length > 100,
    estimatedMemorySaving: data.length > 100 ? 
      `${Math.round((data.length - 20) / data.length * 100)}%` : '0%'
  }), [data.length]);

  return {
    data: memoizedData,
    performanceMetrics,
  };
}

/**
 * 虛擬化配置工廠函數
 */
export function createVirtualizationConfig(dataLength: number) {
  // 根據數據量自動調整配置
  if (dataLength > 10000) {
    return {
      containerHeight: 700,
      estimateSize: 45,
      overscan: 3,
    };
  } else if (dataLength > 1000) {
    return {
      containerHeight: 600,
      estimateSize: 50,
      overscan: 5,
    };
  } else if (dataLength > 100) {
    return {
      containerHeight: 500,
      estimateSize: 55,
      overscan: 8,
    };
  } else {
    return {
      containerHeight: 400,
      estimateSize: 60,
      overscan: 10,
    };
  }
}