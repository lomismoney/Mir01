"use client";

import { useState, memo, useEffect, useCallback } from "react";
import {
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Package,
  Search,
  Trash2,
  Info,
  ListFilter,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  useProducts,
  useDeleteProduct,
  useDeleteMultipleProducts,
  useModalManager,
  useErrorHandler,
} from "@/hooks";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useProductDataTransformation } from "@/hooks/useDataTransformation";
import { useEmptyState } from "@/hooks/use-empty-state";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";
import { columns, type ExpandedProductItem } from "./columns";
import VariantDetailsModal from "./VariantDetailsModal";
import { ProductItem } from "@/types/api-helpers";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PRODUCT_MODAL_TYPES } from "@/hooks/useModalManager";
import { useReactTable, getCoreRowModel, getExpandedRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";

// 導入新的虛擬化組件
import { VirtualTable, useVirtualizedTablePerformance, createVirtualizationConfig } from "@/components/ui/virtual-table";
import { getVirtualScrollConfig, performanceMonitor } from "@/lib/performance-config";
import { cn } from "@/lib/utils";

/**
 * 增強版商品管理客戶端組件
 * 
 * 新增特性：
 * 1. 虛擬滾動 - 支援大量商品數據的高性能渲染
 * 2. 性能監控 - 實時顯示虛擬化性能指標
 * 3. 自適應配置 - 根據數據量自動調整虛擬化參數
 * 4. 平滑體驗 - 保持所有原有功能的同時提升性能
 */
const ProductClientComponentEnhanced = () => {
  const router = useRouter();
  const { user, isLoading, isAuthorized } = useAdminAuth();
  const { data: session, status } = useSession();

  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // TanStack Table 狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // 性能監控狀態
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  // 獲取所有商品數據（不分頁）
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error,
  } = useProducts({
    ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
    per_page: 10000, // 獲取所有商品以支援虛擬滾動
  });

  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleProductsMutation = useDeleteMultipleProducts();

  // 統一的 Modal 管理器
  const modalManager = useModalManager<any>();
  const { handleError, handleSuccess } = useErrorHandler();

  // 欄位名稱映射
  const columnNameMap: Record<string, string> = {
    select: "選擇",
    expander: "展開",
    product: "商品",
    specs: "規格/分類",
    price: "價格",
    status: "狀態",
    inventory: "庫存",
    created_at: "建立時間",
    actions: "操作",
  };

  // 使用數據轉換 Hook
  const rawProducts = (productsResponse || []) as ProductItem[];
  const { 
    transformedProducts,
    getSubRows,
    hasVariants,
    isMainProduct,
    isVariant 
  } = useProductDataTransformation(rawProducts);

  // 使用虛擬化性能優化
  const { data: optimizedData, performanceMetrics } = useVirtualizedTablePerformance(
    transformedProducts,
    {
      enableMetrics: true,
      onMetricsUpdate: (metrics) => {
        // 性能監控
        if (metrics.renderTime && metrics.renderTime > 100) {
          console.warn(`產品表格渲染時間過長: ${metrics.renderTime}ms`);
        }
      },
    }
  );

  // 獲取虛擬化配置
  const virtualizationConfig = getVirtualScrollConfig(
    optimizedData.length,
    'products'
  );

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('products');

  // 優化 enableRowSelection 函數
  const enableRowSelection = useCallback((row: any) => isMainProduct(row.original), [isMainProduct]);

  // 創建表格實例
  const table = useReactTable({
    data: optimizedData,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSubRows,
    enableExpanding: true,
    state: {
      expanded,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableRowSelection,
    // 虛擬滾動模式下不使用分頁
    manualPagination: true,
    pageCount: 1,
  });

  // 處理搜尋輸入變化
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // 處理單個商品刪除
  const handleDeleteProduct = useCallback((product: { id: number; name: string }) => {
    modalManager.openModal('delete', product);
  }, [modalManager]);

  // 確認刪除單個商品
  const confirmDeleteProduct = useCallback(() => {
    const productToDelete = modalManager.currentData as { id: number; name: string } | null;
    if (!productToDelete?.id) {
      handleError(new Error("無效的商品 ID"));
      return;
    }

    deleteProductMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        modalManager.handleSuccess();
        handleSuccess("商品已成功刪除");
      },
      onError: (error) => handleError(error),
    });
  }, [modalManager, deleteProductMutation, handleSuccess, handleError]);

  // 處理批量刪除
  const handleBatchDelete = useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      handleError(new Error("請選擇要刪除的商品"));
      return;
    }
    modalManager.openModal('batchDelete', selectedRows);
  }, [table, modalManager, handleError]);

  // 確認批量刪除
  const confirmBatchDelete = useCallback(() => {
    const selectedRows = modalManager.currentData as any[] || [];
    const selectedIds = selectedRows
      .map((row) => {
        if (!row.original.isVariantRow && row.original.originalId) {
          return row.original.originalId;
        }
        return null;
      })
      .filter((id): id is number => id !== null);

    if (selectedIds.length === 0) {
      handleError(new Error("沒有有效的商品 ID 可供刪除"));
      return;
    }

    deleteMultipleProductsMutation.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          modalManager.handleSuccess();
          handleSuccess(`成功刪除 ${selectedIds.length} 個商品`);
          setRowSelection({});
        },
        onError: (error) => handleError(error),
      },
    );
  }, [modalManager, deleteMultipleProductsMutation, setRowSelection, handleSuccess, handleError]);

  // 設置事件監聽器
  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const productId = event.detail.id;
      router.push(`/products/${productId}/edit`);
    };

    const handleDeleteEvent = (event: CustomEvent) => {
      const { id, name } = event.detail;
      handleDeleteProduct({ id, name });
    };

    const handleViewVariantsEvent = (event: CustomEvent) => {
      const product = event.detail;
      modalManager.openModal(PRODUCT_MODAL_TYPES.VARIANT_DETAIL, product);
    };

    window.addEventListener("editProduct", handleEditEvent as EventListener);
    window.addEventListener("deleteProduct", handleDeleteEvent as EventListener);
    window.addEventListener("viewVariants", handleViewVariantsEvent as EventListener);

    return () => {
      window.removeEventListener("editProduct", handleEditEvent as EventListener);
      window.removeEventListener("deleteProduct", handleDeleteEvent as EventListener);
      window.removeEventListener("viewVariants", handleViewVariantsEvent as EventListener);
    };
  }, [router, handleDeleteProduct, modalManager]);

  // 性能監控
  useEffect(() => {
    performanceMonitor.startMeasure('product-table-render');
    return () => {
      performanceMonitor.endMeasure('product-table-render');
    };
  }, [optimizedData]);

  // 權限檢查
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">載入中...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          您沒有權限訪問此頁面。請聯繫管理員。
        </AlertDescription>
      </Alert>
    );
  }

  const shouldUseVirtualization = virtualizationConfig !== null;

  return (
    <div className="space-y-6">
      {/* 性能指標儀表板 */}
      {showPerformanceMetrics && shouldUseVirtualization && (
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
      )}

      {/* 主要內容卡片 */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* 搜尋與過濾控制區 */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋商品名稱、SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-10 bg-background"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 性能監控開關 */}
              {shouldUseVirtualization && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  性能監控
                </Button>
              )}

              {/* 批量刪除按鈕 */}
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={handleBatchDelete}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除選中 ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              )}

              {/* 欄位顯示控制 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ListFilter className="h-4 w-4" />
                    欄位顯示
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {columnNameMap[column.id] || column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* 表格內容 */}
        {isProductsLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">載入商品資料中...</span>
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyError
              title="載入商品資料失敗"
              description="無法載入商品列表，請稍後再試"
              onRetry={() => window.location.reload()}
              showDetails={true}
              error={error}
            />
          </div>
        ) : shouldUseVirtualization ? (
          // 使用虛擬化表格
          <div className="p-6">
            <VirtualTable
              table={table}
              containerHeight={virtualizationConfig.containerHeight}
              estimateSize={virtualizationConfig.estimateSize}
              overscan={virtualizationConfig.overscan}
              className="w-full"
              enableStickyHeader={true}
              emptyMessage={searchQuery ? "找不到符合的商品" : "暫無商品數據"}
              isLoading={isProductsLoading}
            />
            
            {/* 虛擬化模式信息 */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                虛擬化模式已啟用 - 僅渲染可見行以提升性能
              </div>
              <div>
                共 {table.getFilteredRowModel().rows.length} 個商品
              </div>
            </div>
          </div>
        ) : (
          // 標準表格模式（數據量小時）
          <div className="p-6">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                目前商品數量較少（{optimizedData.length} 個），使用標準表格模式。
                當商品數量超過 100 個時將自動啟用虛擬滾動以提升性能。
              </AlertDescription>
            </Alert>
            
            {/* 這裡可以使用原始的表格實現 */}
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>請使用標準表格組件顯示商品列表</p>
            </div>
          </div>
        )}
      </div>

      {/* 刪除對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen('delete')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除商品</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除商品「{(modalManager.currentData as any)?.name}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen('batchDelete')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {(modalManager.currentData as any[])?.length || 0} 個商品嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMultipleProductsMutation.isPending}
            >
              {deleteMultipleProductsMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 規格詳情模態框 */}
      <VariantDetailsModal
        isOpen={modalManager.isModalOpen(PRODUCT_MODAL_TYPES.VARIANT_DETAIL)}
        onClose={() => modalManager.closeModal()}
        product={modalManager.currentData as ProductItem | null}
      />
    </div>
  );
};

export default memo(ProductClientComponentEnhanced);