"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flexRender } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { VirtualTableProps } from './types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * 增強版虛擬化表格組件
 * 
 * 特性：
 * 1. 支援大量數據的高性能渲染（10000+ 行）
 * 2. 只渲染可見區域的行，大幅提升性能
 * 3. 平滑滾動體驗與動態行高支援
 * 4. 與 @tanstack/react-table 完美整合
 * 5. 響應式設計支援
 * 6. 可選的固定表頭
 * 7. 滾動位置回調
 * 8. 載入和空狀態處理
 */
export function VirtualTable<TData>({
  table,
  containerHeight = 600,
  estimateSize = 50,
  overscan = 5,
  className = '',
  enableStickyHeader = true,
  onScroll,
  emptyMessage = '暫無數據',
  loadingMessage = '載入中...',
  isLoading = false,
}: VirtualTableProps<TData>) {
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ top: 0, left: 0 });

  // 創建虛擬化器
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    measureElement: (element) => {
      // 支援動態行高
      if (element?.getBoundingClientRect) {
        return element.getBoundingClientRect().height;
      }
      return estimateSize;
    },
  });

  // 處理滾動事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollLeft = target.scrollLeft;
    
    scrollPositionRef.current = { top: scrollTop, left: scrollLeft };
    
    if (onScroll) {
      onScroll(scrollTop, scrollLeft);
    }
  }, [onScroll]);

  // 保存和恢復滾動位置
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.scrollTop = scrollPositionRef.current.top;
      scrollElement.scrollLeft = scrollPositionRef.current.left;
    }
  }, [rows]);

  // 計算虛擬項目
  const virtualItems = virtualizer.getVirtualItems();
  
  // 計算總高度和填充
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? totalSize - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  // 載入狀態
  if (isLoading) {
    return (
      <div className={cn("rounded-md border", className)}>
        <div 
          className="flex items-center justify-center"
          style={{ height: `${containerHeight}px` }}
        >
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // 空狀態
  if (rows.length === 0) {
    return (
      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader className={cn(enableStickyHeader && "sticky top-0 bg-background z-10")}>
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
        <div 
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: `${Math.min(containerHeight, 200)}px` }}
        >
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      {/* 固定表頭 */}
      {enableStickyHeader && (
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
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
      )}

      {/* 虛擬化滾動容器 */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          height: `${containerHeight}px`,
        }}
        onScroll={handleScroll}
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
            {!enableStickyHeader && (
              <TableHeader>
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
            )}
            <TableBody>
              {virtualItems.map((virtualItem) => {
                const row = rows[virtualItem.index];
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    className={cn(
                      row.getIsSelected() && 'bg-muted/50',
                      'hover:bg-muted/50 transition-colors'
                    )}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start - paddingTop}px)`,
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