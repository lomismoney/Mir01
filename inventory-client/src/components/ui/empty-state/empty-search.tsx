"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

interface EmptySearchProps {
  searchTerm?: string;
  onClearSearch?: () => void;
  suggestions?: string[];
  className?: string;
}

/**
 * 搜索無結果空狀態組件
 * 提供搜索建議和清除搜索的選項
 */
export const EmptySearch: React.FC<EmptySearchProps> = ({
  searchTerm,
  onClearSearch,
  suggestions = [],
  className,
}) => {
  return (
    <div className={cn("py-12", className)}>
      <EmptyState
        icon={Search}
        title="找不到相符的結果"
        description={
          searchTerm
            ? `搜尋「${searchTerm}」沒有找到任何結果`
            : '請嘗試調整您的搜尋條件'
        }
        action={
          onClearSearch
            ? {
                label: '清除搜尋',
                onClick: onClearSearch,
                variant: 'outline',
              }
            : undefined
        }
      >
        {suggestions.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="mb-2">建議嘗試：</p>
            <ul className="list-disc list-inside space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </EmptyState>
    </div>
  );
};