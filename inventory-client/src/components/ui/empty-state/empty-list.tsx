"use client";

import React from 'react';
import { List } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

interface EmptyListProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * 列表空狀態組件
 * 用於卡片列表或其他非表格列表的空狀態展示
 */
export const EmptyList: React.FC<EmptyListProps> = ({
  title = '列表為空',
  description = '開始新增項目來填充此列表',
  actionLabel = '新增項目',
  onAction,
  className,
}) => {
  return (
    <div className={cn("py-12", className)}>
      <EmptyState
        icon={List}
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