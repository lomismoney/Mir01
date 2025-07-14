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
  ChevronDown,
  Info,
  ListFilter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useProducts,
  useDeleteProduct,
  useDeleteMultipleProducts,
  useStandardTable,
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
import { AllVariantsModal } from "./AllVariantsModal";
import { ProductItem } from "@/types/api-helpers";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdaptiveTable } from "@/components/ui/AdaptiveTable";
import { PRODUCT_MODAL_TYPES } from "@/hooks/useModalManager";
import { flexRender } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, getExpandedRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";

import { cn } from "@/lib/utils";


/**
 * 商品管理客戶端頁面組件（巢狀顯示升級版）
 *
 * 架構升級：
 * 1. 完全基於 TanStack Table 的 DataTable 架構
 * 2. 支援 SPU+SKU 巢狀顯示，可展開查看變體詳情
 * 3. 統一的 columns 定義，關注點分離
 * 4. useDebounce 優化搜尋體驗，減少 API 請求
 * 5. 事件驅動的操作處理機制
 * 6. 與其他管理模組架構完全一致
 *
 * 巢狀顯示特性：
 * - SPU 主行顯示商品基本資訊和價格範圍
 * - 可展開查看該 SPU 下的所有 SKU 變體
 * - SKU 變體行顯示具體的規格、價格、庫存資訊
 * - 智能展開/收合控制，單規格商品無展開按鈕
 *
 * 效能優化：
 * - TanStack Table 內建虛擬化和優化
 * - 防抖搜尋，避免過度 API 請求
 * - React.memo 防止不必要重渲染
 * - 智能數據轉換，僅在必要時重新計算
 *
 * 安全特性：
 * - 統一的權限驗證機制 (useAdminAuth)
 * - 類型安全的 API 呼叫
 * - 完整的錯誤處理
 */
const ProductClientComponent = () => {
  const router = useRouter();
  const { user, isLoading, isAuthorized } = useAdminAuth();

  // 🔍 添加認證狀態調試
  const { data: session, status } = useSession();

  // 認證狀態同步
  useEffect(() => {
    // 認證狀態變更時的任何必要處理可以在這裡添加
  }, [session, status, isLoading, isAuthorized, user]); // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 延遲

  // TanStack Table 狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // 所有變體模態框狀態管理
  const [allVariantsModal, setAllVariantsModal] = useState({
    isOpen: false,
    product: null as ExpandedProductItem | null,
    variants: [] as ExpandedProductItem[],
  });

  // 使用防抖後的搜索查詢，並加入更大的每頁數量以顯示所有商品
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error,
  } = useProducts({
    ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
    per_page: 100, // 增加每頁顯示數量以確保顯示所有商品
  });

  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleProductsMutation = useDeleteMultipleProducts();

  // 🎯 統一的 Modal 管理器
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

  // 🎯 使用新的數據轉換 Hook，移除複雜的內聯邏輯
  const rawProducts = (productsResponse || []) as ProductItem[];
  const { 
    transformedProducts, // 使用這個而不是 expandedProducts
    getSubRows,
    hasVariants,
    isMainProduct,
    isVariant 
  } = useProductDataTransformation(rawProducts);

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('products');

  // 搜尋建議
  const suggestions = [
    "iPhone", "MacBook", "T恤", "牛仔褲", "辦公椅", "坐墊"
  ];

  // 優化 enableRowSelection 函數
  const enableRowSelection = useCallback((row: any) => isMainProduct(row.original), [isMainProduct]);

  // 🎯 直接使用 useReactTable 配置展開功能
  const table = useReactTable({
    data: transformedProducts,
    columns: columns as any, // 類型斷言解決 TanStack Table 的類型匹配問題
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  /**
   * 處理搜尋輸入變化
   * 現在會觸發防抖機制，減少 API 請求頻率
   */
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  /**
   * 處理單個商品刪除
   */
  const handleDeleteProduct = useCallback((product: { id: number; name: string }) => {
    modalManager.openModal('delete', product);
  }, [modalManager]);

  /**
   * 確認刪除單個商品
   */
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

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      handleError(new Error("請選擇要刪除的商品"));
      return;
    }
    modalManager.openModal('batchDelete', selectedRows);
  }, [table, modalManager, handleError]);

  /**
   * 確認批量刪除
   */
  const confirmBatchDelete = useCallback(() => {
    const selectedRows = modalManager.currentData as any[] || [];
    const selectedIds = selectedRows
      .map((row) => {
        // 確保只獲取 SPU 主行的原始 ID
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
          setRowSelection({}); // 清空選中狀態
        },
        onError: (error) => handleError(error),
      },
    );
  }, [modalManager, deleteMultipleProductsMutation, setRowSelection, handleSuccess, handleError]);

  /**
   * 設置事件監聽器來處理來自 columns 的操作事件
   */
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

    const handleViewAllVariantsEvent = (event: CustomEvent) => {
      const { product, allVariants } = event.detail;
      setAllVariantsModal({
        isOpen: true,
        product,
        variants: allVariants || [],
      });
    };

    // 添加事件監聽器
    window.addEventListener("editProduct", handleEditEvent as EventListener);
    window.addEventListener(
      "deleteProduct",
      handleDeleteEvent as EventListener,
    );
    window.addEventListener(
      "viewVariants",
      handleViewVariantsEvent as EventListener,
    );
    window.addEventListener(
      "viewAllVariants",
      handleViewAllVariantsEvent as EventListener,
    );

    // 清理事件監聽器
    return () => {
      window.removeEventListener(
        "editProduct",
        handleEditEvent as EventListener,
      );
      window.removeEventListener(
        "deleteProduct",
        handleDeleteEvent as EventListener,
      );
      window.removeEventListener(
        "viewVariants",
        handleViewVariantsEvent as EventListener,
      );
      window.removeEventListener(
        "viewAllVariants",
        handleViewAllVariantsEvent as EventListener,
      );
    };
  }, [router, handleDeleteProduct, modalManager]);

  // 權限檢查
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">
          載入中...
        </span>
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

  return (
    <div className="space-y-6">
      {/* 整合所有功能在單一卡片中 */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* --- 搜尋與過濾控制區 --- */}
        <div className="border-b p-6">
          <div
            className="flex items-center justify-between gap-4"
           
          >
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search
                  className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                 
                />

                <Input
                  placeholder="搜尋商品名稱、SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-10 bg-background"
                 
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 批量刪除按鈕 - 只在有選中項目時顯示 */}
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
                  <Button
                    variant="outline"
                    className="gap-2"
                   
                  >
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

        {/* 🎯 使用 AdaptiveTable 組件 - 商品列表虛擬化 */}
        {isProductsLoading ? (
          <div
            className="flex items-center justify-center h-[400px]"
           
          >
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
             
            />

            <span className="ml-3 text-lg">
              載入商品資料中...
            </span>
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
        ) : (
          <>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="p-0">
                          {searchQuery ? (
                            <EmptySearch
                              searchTerm={searchQuery}
                              onClearSearch={() => setSearchQuery('')}
                              suggestions={suggestions}
                            />
                          ) : (
                            <EmptyTable
                              title={emptyConfig.title}
                              description={emptyConfig.description}
                              actionLabel={emptyConfig.actionLabel}
                              onAction={handleAction}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 分頁控制 */}
            <div className="border-t p-4">
              <div
                className="flex items-center justify-between"
               
              >
                <div
                  className="text-sm text-muted-foreground"
                 
                >
                  已選擇{" "}
                  <span
                    className="font-medium text-foreground"
                   
                  >
                    {table.getFilteredSelectedRowModel().rows.length}
                  </span>{" "}
                  個商品， 共{" "}
                  <span
                    className="font-medium text-foreground"
                   
                  >
                    {table.getFilteredRowModel().rows.length}
                  </span>{" "}
                  個商品
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">每頁顯示</p>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={e => {
                        table.setPageSize(Number(e.target.value))
                      }}
                      className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                    >
                      {[10, 20, 30, 40, 50].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      首頁
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      上一頁
                    </Button>
                    <span className="flex items-center gap-1">
                      <div className="text-sm">第</div>
                      <strong className="text-sm">
                        {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                      </strong>
                      <div className="text-sm">頁</div>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      下一頁
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      末頁
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🎯 單一商品刪除對話框 */}
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

      {/* 🎯 批量刪除對話框 */}
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

      {/* 🎯 規格詳情模態框 */}
      <VariantDetailsModal
        isOpen={modalManager.isModalOpen(PRODUCT_MODAL_TYPES.VARIANT_DETAIL)}
        onClose={() => modalManager.closeModal()}
        product={modalManager.currentData as ProductItem | null}
      />

      {/* 🎯 所有變體查看模態框 */}
      <AllVariantsModal
        isOpen={allVariantsModal.isOpen}
        onClose={() => setAllVariantsModal(prev => ({ ...prev, isOpen: false }))}
        product={allVariantsModal.product}
        variants={allVariantsModal.variants}
      />
    </div>
  );
};

export default memo(ProductClientComponent);
