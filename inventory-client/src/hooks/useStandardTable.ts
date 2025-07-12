import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  RowSelectionState,
  ColumnDef,
} from '@tanstack/react-table';
import { useDebounce } from './use-debounce';
import { safeExtractData, safeExtractMeta } from '@/lib/apiResponseHelpers';
import type { PaginationMeta } from '@/types/api-responses';

/**
 * 標準表格配置選項
 */
export interface StandardTableConfig<T> {
  // 數據相關
  data: any; // API 響應數據
  columns: ColumnDef<T>[];
  
  // 分頁配置
  enablePagination?: boolean;
  enableServerSidePagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  
  // 排序配置
  enableSorting?: boolean;
  enableServerSideSorting?: boolean;
  
  // 篩選配置
  enableFiltering?: boolean;
  enableServerSideFiltering?: boolean;
  
  // 行選擇配置
  enableRowSelection?: boolean;
  enableMultiRowSelection?: boolean;
  
  // 搜尋配置
  enableGlobalSearch?: boolean;
  searchDebounceMs?: number;
  searchPlaceholder?: string;
  
  // 欄位可見性
  enableColumnVisibility?: boolean;
  
  // 載入狀態
  isLoading?: boolean;
  
  // 錯誤處理
  error?: Error | null;
}

/**
 * 表格篩選器類型
 */
export interface TableFilters {
  search?: string;
  [key: string]: any;
}

/**
 * 表格狀態
 */
export interface TableState<T> {
  // React Table 狀態
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  pagination: PaginationState;
  rowSelection: RowSelectionState;
  
  // 自定義狀態
  globalFilter: string;
  customFilters: TableFilters;
  
  // 計算屬性
  selectedRowCount: number;
  totalRowCount: number;
  isAllRowsSelected: boolean;
  hasSelectedRows: boolean;
}

/**
 * 通用表格管理 Hook
 * 
 * 提供標準化的表格功能，包括：
 * - 分頁管理（前端/後端）
 * - 排序功能
 * - 篩選和搜尋
 * - 行選擇
 * - 欄位可見性控制
 * 
 * @param config 表格配置選項
 * @returns 表格管理器對象
 */
export function useStandardTable<T>(config: StandardTableConfig<T>) {
  const {
    data: rawData,
    columns,
    enablePagination = true,
    enableServerSidePagination = true,
    initialPageSize = 15,
    pageSizeOptions = [10, 15, 25, 50, 100],
    enableSorting = true,
    enableServerSideSorting = true,
    enableFiltering = true,
    enableServerSideFiltering = true,
    enableRowSelection = false,
    enableMultiRowSelection = true,
    enableGlobalSearch = true,
    searchDebounceMs = 300,
    searchPlaceholder = '搜尋...',
    enableColumnVisibility = true,
    isLoading = false,
    error = null,
  } = config;

  // 基礎狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // 搜尋和篩選狀態
  const [globalFilter, setGlobalFilter] = useState('');
  const [customFilters, setCustomFilters] = useState<TableFilters>({});
  const debouncedGlobalFilter = useDebounce(globalFilter, searchDebounceMs);

  // 數據處理
  const tableData = useMemo(() => safeExtractData<T>(rawData), [rawData]);
  const paginationMeta = useMemo(() => safeExtractMeta(rawData), [rawData]);

  // 構建查詢參數（用於服務端操作）
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    // 搜尋參數
    if (enableServerSideFiltering && debouncedGlobalFilter) {
      params.search = debouncedGlobalFilter;
    }

    // 分頁參數
    if (enableServerSidePagination) {
      params.page = pagination.pageIndex + 1;
      params.per_page = pagination.pageSize;
    }

    // 排序參數
    if (enableServerSideSorting && sorting.length > 0) {
      const sort = sorting[0];
      params.sort_by = sort.id;
      params.sort_direction = sort.desc ? 'desc' : 'asc';
    }

    // 自定義篩選參數
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }, [
    debouncedGlobalFilter,
    pagination,
    sorting,
    customFilters,
    enableServerSideFiltering,
    enableServerSidePagination,
    enableServerSideSorting,
  ]);

  // React Table 實例
  const table = useReactTable({
    data: tableData,
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

    // 狀態管理
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,

    // 服務端功能配置
    manualPagination: enableServerSidePagination,
    manualSorting: enableServerSideSorting,
    manualFiltering: enableServerSideFiltering,

    // 分頁配置
    pageCount: paginationMeta?.last_page ?? -1,

    // 行選擇配置
    enableRowSelection: enableRowSelection,
    enableMultiRowSelection: enableMultiRowSelection,

    // 狀態
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
      ...(enableGlobalSearch && { globalFilter }),
    },
  });

  // 計算屬性
  const selectedRowCount = table.getSelectedRowModel().rows.length;
  const totalRowCount = paginationMeta?.total ?? tableData.length;
  const isAllRowsSelected = selectedRowCount > 0 && selectedRowCount === tableData.length;
  const hasSelectedRows = selectedRowCount > 0;

  // 重置功能
  const resetTable = useCallback(() => {
    setSorting([]);
    setColumnFilters([]);
    setRowSelection({});
    setPagination({ pageIndex: 0, pageSize: initialPageSize });
    setGlobalFilter('');
    setCustomFilters({});
  }, [initialPageSize]);

  // 篩選管理
  const updateFilter = useCallback((key: string, value: any) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    // 重置到第一頁
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setCustomFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setCustomFilters({});
    setGlobalFilter('');
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // 行選擇管理
  const selectAllRows = useCallback(() => {
    table.toggleAllRowsSelected(true);
  }, [table]);

  const deselectAllRows = useCallback(() => {
    table.toggleAllRowsSelected(false);
  }, [table]);

  const getSelectedRowIds = useCallback(() => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  }, [table]);

  // 分頁控制
  const goToPage = useCallback((pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }));
  }, []);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination({ pageIndex: 0, pageSize });
  }, []);

  // 狀態對象
  const tableState: TableState<T> = {
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
    rowSelection,
    globalFilter,
    customFilters,
    selectedRowCount,
    totalRowCount,
    isAllRowsSelected,
    hasSelectedRows,
  };

  return {
    // React Table 實例
    table,
    
    // 狀態
    state: tableState,
    
    // 數據
    data: tableData,
    meta: paginationMeta,
    
    // 查詢參數
    queryParams,
    
    // 搜尋功能
    globalFilter,
    setGlobalFilter,
    debouncedGlobalFilter,
    
    // 篩選功能
    customFilters,
    updateFilter,
    removeFilter,
    clearFilters,
    
    // 行選擇功能
    selectedRowCount,
    hasSelectedRows,
    isAllRowsSelected,
    selectAllRows,
    deselectAllRows,
    getSelectedRowIds,
    
    // 分頁功能
    goToPage,
    changePageSize,
    
    // 重置功能
    resetTable,
    
    // 狀態標誌
    isLoading,
    error,
    isEmpty: tableData.length === 0,
    
    // 配置選項
    config: {
      searchPlaceholder,
      pageSizeOptions,
      enablePagination,
      enableSorting,
      enableFiltering,
      enableRowSelection,
      enableGlobalSearch,
      enableColumnVisibility,
    },
  };
}

/**
 * 表格工具函式
 */
export const TableUtils = {
  /**
   * 構建篩選查詢參數
   */
  buildFilterParams: (filters: TableFilters): Record<string, any> => {
    const params: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });
    return params;
  },

  /**
   * 格式化分頁資訊顯示文字
   */
  formatPaginationText: (
    currentPage: number,
    pageSize: number,
    total: number
  ): string => {
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, total);
    return `顯示第 ${start}-${end} 項，共 ${total} 項`;
  },

  /**
   * 計算頁面範圍
   */
  calculatePageRange: (
    currentPage: number,
    totalPages: number,
    maxVisible: number = 5
  ): number[] => {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - half);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  },
};