import { useState, useCallback, useMemo } from 'react';
import { 
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  Table as TanStackTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  RowSelectionState,
  ExpandedState,
  OnChangeFn,
} from '@tanstack/react-table';
import { createVirtualizationConfig } from '@/components/ui/VirtualizedTable';

/**
 * 虛擬化表格配置選項
 */
export interface VirtualizedTableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableVirtualization?: boolean;
  rowHeight?: number;
  autoEnable?: boolean;
  threshold?: number;
  containerHeight?: number;
  estimateSize?: number;
  overscan?: number;
  
  // Table 配置選項
  enableRowSelection?: boolean | ((row: any) => boolean);
  enableMultiRowSelection?: boolean;
  enablePagination?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  enableSorting?: boolean;
  manualSorting?: boolean;
  enableFiltering?: boolean;
  manualFiltering?: boolean;
  enableExpanding?: boolean;
  getSubRows?: (row: TData) => TData[] | undefined;
  
  // 狀態管理
  onSortingChange?: OnChangeFn<SortingState>;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  
  // 初始狀態
  state?: {
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
    columnVisibility?: VisibilityState;
    pagination?: PaginationState;
    rowSelection?: RowSelectionState;
    expanded?: ExpandedState;
    globalFilter?: string;
  };
  
  // 其他選項
  autoResetPageIndex?: boolean;
}

/**
 * 虛擬化表格管理 Hook
 * 
 * 提供統一的虛擬化表格狀態管理和配置
 * 根據數據量自動推薦是否啟用虛擬化
 * 
 * @param options - 表格配置選項
 */
export function useVirtualizedTable<TData>(options: VirtualizedTableOptions<TData>) {
  const {
    data = [],
    columns,
    enableVirtualization: explicitVirtualization,
    rowHeight = 50,
    autoEnable = true,
    threshold = 100,
    containerHeight,
    estimateSize,
    overscan,
    
    // Table 選項
    enableRowSelection = false,
    enableMultiRowSelection = true,
    enablePagination = false,
    manualPagination = false,
    pageCount = -1,
    enableSorting = true,
    manualSorting = false,
    enableFiltering = true,
    manualFiltering = false,
    enableExpanding = false,
    getSubRows,
    
    // 狀態回調
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    onPaginationChange,
    onRowSelectionChange,
    onExpandedChange,
    
    // 初始狀態
    state = {},
    
    // 其他
    autoResetPageIndex = true,
  } = options;

  const dataLength = data.length;

  // 虛擬化啟用狀態
  const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState<boolean>(() => {
    if (explicitVirtualization !== undefined) {
      return explicitVirtualization;
    }
    return autoEnable ? dataLength >= threshold : false;
  });

  // 性能指標顯示狀態
  const [showMetrics, setShowMetrics] = useState(false);

  // 創建 TanStack Table 實例
  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
    }),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
    }),
    ...(enableExpanding && {
      getExpandedRowModel: getExpandedRowModel(),
    }),
    
    // 配置選項
    enableRowSelection,
    enableMultiRowSelection,
    manualPagination,
    pageCount,
    manualSorting,
    manualFiltering,
    autoResetPageIndex,
    getSubRows,
    
    // 狀態管理
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
    onPaginationChange,
    onRowSelectionChange,
    onExpandedChange,
    
    // 狀態
    state: {
      sorting: state.sorting || [],
      columnFilters: state.columnFilters || [],
      columnVisibility: state.columnVisibility || {},
      pagination: state.pagination || { pageIndex: 0, pageSize: 10 },
      rowSelection: state.rowSelection || {},
      expanded: state.expanded || {},
      ...(state.globalFilter && { globalFilter: state.globalFilter }),
    },
  });

  // 自動生成虛擬化配置
  const virtualizationConfig = useMemo(() => {
    const autoConfig = createVirtualizationConfig(dataLength);
    
    return {
      containerHeight: containerHeight ?? autoConfig.containerHeight,
      estimateSize: estimateSize ?? rowHeight ?? autoConfig.estimateSize,
      overscan: overscan ?? autoConfig.overscan,
    };
  }, [dataLength, containerHeight, estimateSize, rowHeight, overscan]);

  // 性能分析
  const performanceAnalysis = useMemo(() => {
    const memoryEstimate = dataLength > 100 ? 
      Math.round((dataLength - 20) / dataLength * 100) : 0;
    
    const performanceGain = dataLength > 1000 ? 'high' : 
                           dataLength > 500 ? 'medium' : 
                           dataLength > 100 ? 'low' : 'none';
    
    const recommendation = dataLength > 1000 ? {
      level: 'critical' as const,
      message: '強烈建議啟用',
      reason: '大數據集，虛擬化可大幅提升性能',
      shouldEnable: true,
    } : dataLength > 500 ? {
      level: 'warning' as const, 
      message: '建議啟用',
      reason: '中等數據量，虛擬化有明顯效果',
      shouldEnable: true,
    } : dataLength > 100 ? {
      level: 'info' as const,
      message: '可選擇啟用',
      reason: '小幅性能提升，取決於使用場景',
      shouldEnable: false,
    } : {
      level: 'success' as const,
      message: '無需虛擬化', 
      reason: '數據量小，標準表格已足夠',
      shouldEnable: false,
    };

    return {
      memoryEstimate,
      performanceGain,
      recommendation,
      dataLength,
      threshold,
    };
  }, [dataLength, threshold]);

  // 切換虛擬化狀態
  const toggleVirtualization = useCallback((enabled?: boolean) => {
    setIsVirtualizationEnabled(prev => enabled !== undefined ? enabled : !prev);
  }, []);

  // 切換性能指標顯示
  const toggleMetrics = useCallback((show?: boolean) => {
    setShowMetrics(prev => show !== undefined ? show : !prev);
  }, []);

  // 自動更新建議 - 當數據量變化時
  const updateRecommendation = useCallback(() => {
    if (autoEnable && performanceAnalysis.recommendation.shouldEnable !== isVirtualizationEnabled) {
      if (performanceAnalysis.recommendation.level === 'critical') {
        // 大數據集自動啟用
        setIsVirtualizationEnabled(true);
      }
    }
  }, [autoEnable, performanceAnalysis.recommendation, isVirtualizationEnabled]);

  return {
    // Table 實例
    table,
    
    // 狀態
    isVirtualizationEnabled,
    showMetrics,
    
    // 配置
    virtualizationConfig,
    performanceAnalysis,
    
    // 操作方法
    toggleVirtualization,
    toggleMetrics,
    updateRecommendation,
    
    // 便捷屬性
    shouldUseVirtualization: isVirtualizationEnabled,
    shouldRecommendVirtualization: performanceAnalysis.recommendation.shouldEnable,
    isLargeDataset: dataLength > 1000,
    
    // 表格數據
    tableData: table.getRowModel().rows,
    dataLength,
  };
}

/**
 * 虛擬化表格配置類型
 */
export interface VirtualizationConfig {
  containerHeight: number;
  estimateSize: number;
  overscan: number;
}

/**
 * 性能分析結果類型
 */
export interface PerformanceAnalysis {
  memoryEstimate: number;
  performanceGain: 'high' | 'medium' | 'low' | 'none';
  recommendation: {
    level: 'critical' | 'warning' | 'info' | 'success';
    message: string;
    reason: string;
    shouldEnable: boolean;
  };
  dataLength: number;
  threshold: number;
}

/**
 * 虛擬化表格模式枚舉
 */
export const VirtualizationMode = {
  AUTO: 'auto',
  MANUAL: 'manual',
  DISABLED: 'disabled',
} as const;

export type VirtualizationModeType = typeof VirtualizationMode[keyof typeof VirtualizationMode];

/**
 * 高級虛擬化表格管理 Hook (遺留版本)
 * 
 * @deprecated 請使用新的 useVirtualizedTable API
 */
export function useAdvancedVirtualizedTable<TData>(
  table: TanStackTable<TData>,
  options: {
    mode?: VirtualizationModeType;
    threshold?: number;
    config?: Partial<VirtualizationConfig>;
    onModeChange?: (mode: VirtualizationModeType) => void;
  } = {}
) {
  const {
    mode = VirtualizationMode.AUTO,
    threshold = 100,
    config = {},
    onModeChange,
  } = options;

  const [currentMode, setCurrentMode] = useState<VirtualizationModeType>(mode);
  
  const dataLength = table.getRowModel().rows.length;

  // 虛擬化啟用狀態
  const [isVirtualizationEnabled, setIsVirtualizationEnabled] = useState<boolean>(() => {
    return mode === VirtualizationMode.AUTO ? dataLength >= threshold : false;
  });

  // 性能指標顯示狀態
  const [showMetrics, setShowMetrics] = useState(false);

  // 自動生成虛擬化配置
  const virtualizationConfig = useMemo(() => {
    const autoConfig = createVirtualizationConfig(dataLength);
    
    return {
      containerHeight: config.containerHeight ?? autoConfig.containerHeight,
      estimateSize: config.estimateSize ?? autoConfig.estimateSize,
      overscan: config.overscan ?? autoConfig.overscan,
    };
  }, [dataLength, config]);

  // 性能分析
  const performanceAnalysis = useMemo(() => {
    const memoryEstimate = dataLength > 100 ? 
      Math.round((dataLength - 20) / dataLength * 100) : 0;
    
    const performanceGain = dataLength > 1000 ? 'high' : 
                           dataLength > 500 ? 'medium' : 
                           dataLength > 100 ? 'low' : 'none';
    
    const recommendation = dataLength > 1000 ? {
      level: 'critical' as const,
      message: '強烈建議啟用',
      reason: '大數據集，虛擬化可大幅提升性能',
      shouldEnable: true,
    } : dataLength > 500 ? {
      level: 'warning' as const, 
      message: '建議啟用',
      reason: '中等數據量，虛擬化有明顯效果',
      shouldEnable: true,
    } : dataLength > 100 ? {
      level: 'info' as const,
      message: '可選擇啟用',
      reason: '小幅性能提升，取決於使用場景',
      shouldEnable: false,
    } : {
      level: 'success' as const,
      message: '無需虛擬化', 
      reason: '數據量小，標準表格已足夠',
      shouldEnable: false,
    };

    return {
      memoryEstimate,
      performanceGain,
      recommendation,
      dataLength,
      threshold,
    };
  }, [dataLength, threshold]);

  // 切換虛擬化狀態
  const toggleVirtualization = useCallback((enabled?: boolean) => {
    setIsVirtualizationEnabled(prev => enabled !== undefined ? enabled : !prev);
  }, []);

  // 切換性能指標顯示
  const toggleMetrics = useCallback((show?: boolean) => {
    setShowMetrics(prev => show !== undefined ? show : !prev);
  }, []);

  // 模式切換
  const changeMode = useCallback((newMode: VirtualizationModeType) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
    
    // 根據模式自動調整虛擬化狀態
    switch (newMode) {
      case VirtualizationMode.AUTO:
        toggleVirtualization(performanceAnalysis.recommendation.shouldEnable);
        break;
      case VirtualizationMode.DISABLED:
        toggleVirtualization(false);
        break;
      case VirtualizationMode.MANUAL:
        // 保持當前狀態
        break;
    }
  }, [toggleVirtualization, performanceAnalysis.recommendation.shouldEnable, onModeChange]);

  return {
    // 狀態
    isVirtualizationEnabled,
    showMetrics,
    
    // 配置
    virtualizationConfig,
    performanceAnalysis,
    
    // 操作方法
    toggleVirtualization,
    toggleMetrics,
    updateRecommendation: () => {},
    
    // 便捷屬性
    shouldUseVirtualization: isVirtualizationEnabled,
    shouldRecommendVirtualization: performanceAnalysis.recommendation.shouldEnable,
    isLargeDataset: dataLength > 1000,
    
    // 表格數據
    tableData: table.getRowModel().rows,
    dataLength,
    
    // 模式管理
    currentMode,
    changeMode,
    
    // 模式檢查
    isAutoMode: currentMode === VirtualizationMode.AUTO,
    isManualMode: currentMode === VirtualizationMode.MANUAL,
    isDisabled: currentMode === VirtualizationMode.DISABLED,
  };
}