"use client";

import React from 'react';
import { Table } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

interface EmptyTableProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * 表格空狀態組件
 * 專門用於數據表格的空狀態展示
 */
export const EmptyTable: React.FC<EmptyTableProps> = ({
  title = '尚無資料',
  description = '開始新增您的第一筆資料',
  actionLabel = '新增',
  onAction,
  className,
}) => {
  return (
    <div className={cn("py-12", className)}>
      <EmptyState
        icon={Table}
        title={title}
        description={description}
        action={
          onAction
            ? {
                label: actionLabel,
                onClick: onAction,
                variant: 'default',
              }
            : undefined
        }
      />
    </div>
  );
};