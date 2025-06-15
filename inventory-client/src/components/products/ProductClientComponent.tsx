'use client';

import { useState, memo, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  RowSelectionState,
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
import { Loader2, Package, Search, Trash2, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProducts, useDeleteProduct, useDeleteMultipleProducts } from '@/hooks/queries/useEntityQueries';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { columns, type Product } from "./columns";
import VariantDetailsModal from "./VariantDetailsModal";
import { ProductItem } from "@/types/api-helpers";

import { toast } from "sonner";

/**
 * 商品管理客戶端頁面組件（利劍行動重構版本）
 * 
 * 架構升級：
 * 1. 完全基於 TanStack Table 的 DataTable 架構
 * 2. 統一的 columns 定義，關注點分離
 * 3. useDebounce 優化搜尋體驗，減少 API 請求
 * 4. 事件驅動的操作處理機制
 * 5. 與其他管理模組架構完全一致
 * 
 * 效能優化：
 * - TanStack Table 內建虛擬化和優化
 * - 防抖搜尋，避免過度 API 請求
 * - React.memo 防止不必要重渲染
 * - 職責分離的架構設計
 * 
 * 安全特性：
 * - 統一的權限驗證機制 (useAdminAuth)
 * - 類型安全的 API 呼叫
 * - 完整的錯誤處理
 */
const ProductClientComponent = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 延遲
  
  // TanStack Table 狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // 使用防抖後的搜索查詢
  const { data: productsResponse, isLoading: isProductsLoading, error } = useProducts(
    debouncedSearchQuery ? { search: debouncedSearchQuery } : {}
  );
  
  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleProductsMutation = useDeleteMultipleProducts();
  
  // 刪除確認對話框狀態
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  
  // 規格詳情模態框狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // 初始化表格
  const products = (productsResponse?.data || []) as Product[];
  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  /**
   * 處理搜尋輸入變化
   * 現在會觸發防抖機制，減少 API 請求頻率
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  /**
   * 處理單個商品刪除
   */
  const handleDeleteProduct = (product: { id: number; name: string }) => {
    setProductToDelete(product);
  };

  /**
   * 確認刪除單個商品
   */
  const confirmDeleteProduct = () => {
    if (!productToDelete?.id) {
      toast.error('無效的商品 ID');
      return;
    }

    deleteProductMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        toast.success('商品刪除成功！');
        setProductToDelete(null);
      },
      onError: (error) => {
        toast.error(`刪除失敗：${error.message}`);
      }
    });
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error('請選擇要刪除的商品');
      return;
    }
    setShowBatchDeleteDialog(true);
  };

  /**
   * 確認批量刪除
   */
  const confirmBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows
      .map(row => row.original.id)
      .filter((id): id is number => id !== undefined && id !== null);
    
    if (selectedIds.length === 0) {
      toast.error('沒有有效的商品 ID 可供刪除');
      return;
    }
    
    deleteMultipleProductsMutation.mutate({ ids: selectedIds }, {
      onSuccess: () => {
        toast.success(`成功刪除 ${selectedIds.length} 個商品！`);
        setShowBatchDeleteDialog(false);
        setRowSelection({}); // 清空選中狀態
      },
      onError: (error) => {
        toast.error(`批量刪除失敗：${error.message}`);
      }
    });
  };

  /**
   * 設置事件監聽器來處理來自 columns 的操作事件
   */
  useEffect(() => {
    const handleEditEvent = (event: CustomEvent) => {
      const product = event.detail as Product;
      // TODO: 實現編輯功能
      toast.info(`編輯商品功能即將推出：${product.name}`);
    };

    const handleDeleteEvent = (event: CustomEvent) => {
      const product = event.detail as Product;
      if (product.id && product.name) {
        handleDeleteProduct({ id: product.id, name: product.name });
      }
    };

    const handleViewVariantsEvent = (event: CustomEvent) => {
      const product = event.detail as Product;
      // 設置選中的商品並開啟模態框
      setSelectedProduct(product as ProductItem);
      setIsModalOpen(true);
    };

    // 使用新的事件名稱
    window.addEventListener('editProduct', handleEditEvent as EventListener);
    window.addEventListener('deleteProduct', handleDeleteEvent as EventListener);
    window.addEventListener('viewVariants', handleViewVariantsEvent as EventListener);

    return () => {
      window.removeEventListener('editProduct', handleEditEvent as EventListener);
      window.removeEventListener('deleteProduct', handleDeleteEvent as EventListener);
      window.removeEventListener('viewVariants', handleViewVariantsEvent as EventListener);
    };
  }, []);

  // 使用統一的權限守衛
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">正在驗證權限...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return null; // useAdminAuth 會處理重新導向
  }

  // 處理商品資料載入狀態
  if (isProductsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">載入商品資料中...</span>
        </CardContent>
      </Card>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
            <p className="text-gray-500">無法載入商品資料，請稍後再試。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-6">
      {/* 搜尋和操作區 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            商品列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* 搜尋框 - 現已支援防抖優化 */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜尋商品名稱..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* 欄位顯示控制 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    欄位 <ChevronDown className="ml-2 h-4 w-4" />
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
                          {column.id === "name" && "商品名稱"}
                          {column.id === "description" && "描述"}
                          {column.id === "category" && "分類"}
                          {column.id === "price_range" && "價格範圍"}
                          {column.id === "variant_count" && "規格數量"}
                          {column.id === "created_at" && "建立時間"}
                          {column.id === "actions" && "操作"}
                          {!["name", "description", "category", "price_range", "variant_count", "created_at", "actions"].includes(column.id) && column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 批量刪除按鈕 */}
              {selectedRowCount > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={deleteMultipleProductsMutation.isPending}
                >
                  {deleteMultipleProductsMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除選中 ({selectedRowCount})
                </Button>
              )}
            </div>
          </div>

          {/* TanStack Table - 完全取代手動表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">
                          {searchQuery ? '沒有找到符合條件的商品' : '尚無商品資料'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分頁控制 */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              已選擇 {selectedRowCount} 個項目
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                下一頁
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 單個商品刪除確認對話框 */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除商品</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除商品「{productToDelete?.name}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認對話框 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {selectedRowCount} 個商品嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBatchDeleteDialog(false)}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMultipleProductsMutation.isPending}
            >
              {deleteMultipleProductsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 規格詳情模態框 */}
      <VariantDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

/**
 * 使用 React.memo 優化的商品管理頁面元件
 * 
 * 效能優化：
 * - 防止父元件重渲染時的不必要重繪
 * - 僅當 props 發生變化時才重新渲染
 * - 配合 useAdminAuth 統一權限管理
 * - TanStack Table 內建虛擬化和效能優化
 */
export default memo(ProductClientComponent); 