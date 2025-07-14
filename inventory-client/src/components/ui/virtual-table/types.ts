import { Table as TableType } from '@tanstack/react-table';

export interface VirtualTableProps<TData> {
  table: TableType<TData>;
  containerHeight?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  enableStickyHeader?: boolean;
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
}

export interface VirtualizationConfig {
  containerHeight: number;
  estimateSize: number;
  overscan: number;
  enableDebug?: boolean;
}

export interface PerformanceMetrics {
  totalItems: number;
  visibleItems: number;
  isLargeDataset: boolean;
  recommendVirtualization: boolean;
  estimatedMemorySaving: string;
  renderTime?: number;
}