"use client";

import { useState, memo, useEffect, useMemo } from "react";
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
  getExpandedRowModel,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useProducts,
  useDeleteProduct,
  useDeleteMultipleProducts,
} from "@/hooks/queries/useEntityQueries";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { columns, type ExpandedProductItem } from "./columns";
import VariantDetailsModal from "./VariantDetailsModal";
import { ProductItem } from "@/types/api-helpers";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * 將 SPU 商品數據轉換為支援巢狀顯示的擴展格式
 *
 * @param products - 原始商品數據陣列
 * @returns 轉換後的擴展商品數據陣列，只包含 SPU 主行，變體行通過 getSubRows 動態提供
 */
function transformProductsForNestedDisplay(
  products: ProductItem[],
): ExpandedProductItem[] {
  return products.map((product) => ({
    ...product,
    id: `product-${product.id}`, // 轉換為字符串 ID
    originalId: product.id, // 保存原始數字 ID
    isVariantRow: false,
    // 預處理變體資訊，供 getSubRows 使用
    processedVariants:
      product.variants && product.variants.length > 1
        ? product.variants.map((variant) => ({
            ...product, // 繼承 SPU 資訊
            id: `product-${product.id}-variant-${variant.id}`, // 創建唯一字符串 ID
            originalId: product.id, // 保存原始 SPU ID
            isVariantRow: true,
            parentId: product.id,
            variantInfo: {
              id: variant.id || 0,
              sku: variant.sku || "",
              price: parseFloat(variant.price || "0"), // 轉換字符串價格為數字
              attribute_values: (variant.attribute_values || []).map(
                (attr) => ({
                  id: attr.id || 0,
                  value: attr.value || "",
                  attribute: attr.attribute
                    ? {
                        id: attr.attribute.id || 0,
                        name: attr.attribute.name || "",
                      }
                    : undefined,
                }),
              ),
              inventory: Array.isArray(variant.inventory)
                ? variant.inventory.map((inv) => ({
                    store_id: inv.store?.id || inv.id || 0, // 優先使用 store.id，如果沒有則使用 inv.id
                    quantity: inv.quantity || 0,
                    store: inv.store
                      ? {
                          id: inv.store.id || 0,
                          name: inv.store.name || "",
                        }
                      : undefined,
                  }))
                : [],
            },
          }))
        : undefined,
  }));
}

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

  // 使用防抖後的搜索查詢
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    error,
  } = useProducts(debouncedSearchQuery ? { search: debouncedSearchQuery } : {});

  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleProductsMutation = useDeleteMultipleProducts();

  // 刪除確認對話框狀態
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  // 規格詳情模態框狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );

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

  // 轉換商品數據為巢狀顯示格式
  const expandedProducts = useMemo(() => {
    const rawProducts = (productsResponse || []) as ProductItem[];

    // 🔍 調試：查看搜尋結果
    if (debouncedSearchQuery) {
      console.log("搜尋關鍵字:", debouncedSearchQuery);
      console.log("API 返回的商品數量:", rawProducts.length);
      console.log(
        "API 返回的商品:",
        rawProducts.map((p) => ({ name: p.name, sku: p.variants?.[0]?.sku })),
      );
    }

    return transformProductsForNestedDisplay(rawProducts);
  }, [productsResponse, debouncedSearchQuery]);

  // 初始化表格
  const table = useReactTable({
    data: expandedProducts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
    // 🚀 巢狀顯示核心配置
    getSubRows: (row) => {
      // 如果是 SPU 主行且有預處理的變體，返回變體行
      if (!row.isVariantRow && row.processedVariants) {
        return row.processedVariants;
      }
      return undefined;
    },
    // 只允許 SPU 主行被選中
    enableRowSelection: (row) => !row.original.isVariantRow,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
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
      toast.error("無效的商品 ID");
      return;
    }

    deleteProductMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        // 成功的 toast 已經在 mutation 內部處理了
        setProductToDelete(null);
      },
      // 移除 onError，讓 mutation 內部的錯誤處理生效
    });
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error("請選擇要刪除的商品");
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
      .map((row) => {
        // 確保只獲取 SPU 主行的原始 ID
        if (!row.original.isVariantRow && row.original.originalId) {
          return row.original.originalId;
        }
        return null;
      })
      .filter((id): id is number => id !== null);

    if (selectedIds.length === 0) {
      toast.error("沒有有效的商品 ID 可供刪除");
      return;
    }

    deleteMultipleProductsMutation.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          // 成功的 toast 已經在 mutation 內部處理了
          setShowBatchDeleteDialog(false);
          setRowSelection({}); // 清空選中狀態
        },
        // 移除 onError，讓 mutation 內部的錯誤處理生效
      },
    );
  };

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
      setSelectedProduct(product);
      setIsModalOpen(true);
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
    };
  }, [router]);

  // 權限檢查
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32" data-oid="z.h0jik">
        <Loader2 className="h-6 w-6 animate-spin" data-oid="yxh__ab" />
        <span className="ml-2" data-oid="28e:tit">
          載入中...
        </span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Alert data-oid="3ccfywo">
        <Info className="h-4 w-4" data-oid="l5azkss" />
        <AlertDescription data-oid="5261a7m">
          您沒有權限訪問此頁面。請聯繫管理員。
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" data-oid="gdqq.dj">
      {/* 整合所有功能在單一卡片中 */}
      <div className="rounded-lg border bg-card shadow-sm" data-oid="mdg:npg">
        {/* --- 搜尋與過濾控制區 --- */}
        <div className="border-b p-6" data-oid="xcwvb95">
          <div
            className="flex items-center justify-between gap-4"
            data-oid="87kd.f."
          >
            <div className="flex-1" data-oid="io5rgq5">
              <div className="relative max-w-md" data-oid="sp4avpr">
                <Search
                  className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                  data-oid="sqswvo."
                />

                <Input
                  placeholder="搜尋商品名稱、SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-10 bg-background"
                  data-oid="s7xkeey"
                />
              </div>
            </div>
            <div className="flex items-center gap-2" data-oid="egi36_n">
              {/* 批量刪除按鈕 - 只在有選中項目時顯示 */}
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={handleBatchDelete}
                  className="gap-2"
                  data-oid="avr784a"
                >
                  <Trash2 className="h-4 w-4" data-oid="7:olzli" />
                  刪除選中 ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
              )}

              {/* 欄位顯示控制 */}
              <DropdownMenu data-oid="f1l4w5_">
                <DropdownMenuTrigger asChild data-oid="b-9yo9l">
                  <Button
                    variant="outline"
                    className="gap-2"
                    data-oid="wp82dbw"
                  >
                    <ListFilter className="h-4 w-4" data-oid="ea4ml5v" />
                    欄位顯示
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" data-oid="44myufu">
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
                          data-oid="ejlvr6a"
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

        {/* 巢狀商品表格 */}
        {isProductsLoading ? (
          <div
            className="flex items-center justify-center h-[400px]"
            data-oid="nbtgylw"
          >
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              data-oid="6dc29k_"
            />

            <span className="ml-3 text-lg" data-oid="h.qrxr9">
              載入商品資料中...
            </span>
          </div>
        ) : error ? (
          <div className="p-6" data-oid="4ubsvhq">
            <Alert data-oid="ol3v-c0">
              <Info className="h-4 w-4" data-oid="7cy6.8o" />
              <AlertDescription data-oid="cc97jax">
                載入商品資料時發生錯誤。請重新整理頁面。
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <Table data-oid="7vayt.7">
              <TableHeader data-oid="_w6ftuj">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b bg-muted/50 hover:bg-muted/50"
                    data-oid="396qebq"
                  >
                    {headerGroup.headers.map((header) => {
                      const isCompact = ["expander", "select"].includes(
                        header.column.id as string,
                      );
                      const baseClass = "h-14 align-middle font-medium";
                      const className = isCompact
                        ? `${baseClass} p-0 text-center w-[40px]`
                        : `${baseClass} px-4 text-left`;

                      return (
                        <TableHead
                          key={header.id}
                          className={className}
                          data-oid="vdm2y0g"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody data-oid="sge9j6m">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    // 檢查是否可以展開（不是變體行，且有多個變體）
                    const canExpand =
                      !row.original.isVariantRow &&
                      (row.original.variants?.length || 0) > 1;

                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          row.original.isVariantRow
                            ? "bg-muted/30 hover:bg-muted/40 transition-colors"
                            : "hover:bg-muted/10 border-b transition-all",
                          canExpand && "cursor-pointer",
                          // 為展開的行添加動畫效果
                          row.original.isVariantRow &&
                            "animate-in fade-in-50 slide-in-from-top-1 duration-200",
                        )}
                        onClick={(e) => {
                          // 如果可以展開，且點擊目標不是互動元素
                          if (canExpand) {
                            const target = e.target as HTMLElement;
                            const isInteractiveElement =
                              target.closest("button") ||
                              target.closest("input") ||
                              target.closest('[role="checkbox"]') ||
                              target.closest('[role="button"]') ||
                              target.closest("[data-radix-collection-item]");

                            if (!isInteractiveElement) {
                              row.toggleExpanded();
                            }
                          }
                        }}
                        data-oid="fk.to._"
                      >
                        {row.getVisibleCells().map((cell) => {
                          const isCompactCol = ["expander", "select"].includes(
                            cell.column.id as string,
                          );
                          const cellClass = isCompactCol
                            ? "p-0 text-center w-[40px]"
                            : "py-3";

                          return (
                            <TableCell
                              key={cell.id}
                              className={cellClass}
                              data-oid="gy3oe5."
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow data-oid="1uumt:z">
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center"
                      data-oid="yhn58kj"
                    >
                      <div
                        className="flex flex-col items-center gap-2"
                        data-oid="c2gujx_"
                      >
                        <Package
                          className="h-8 w-8 text-muted-foreground"
                          data-oid="rdsohbx"
                        />

                        <p
                          className="text-lg text-muted-foreground"
                          data-oid="f::ckas"
                        >
                          沒有找到商品資料
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* 分頁控制 */}
            <div className="border-t p-4" data-oid="j4tgnn7">
              <div
                className="flex items-center justify-between"
                data-oid="3j-md2g"
              >
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="nzr82by"
                >
                  已選擇{" "}
                  <span
                    className="font-medium text-foreground"
                    data-oid="ei_o26j"
                  >
                    {table.getFilteredSelectedRowModel().rows.length}
                  </span>{" "}
                  個商品， 共{" "}
                  <span
                    className="font-medium text-foreground"
                    data-oid="7ga7a2i"
                  >
                    {
                      table
                        .getFilteredRowModel()
                        .rows.filter((row) => !row.original.isVariantRow).length
                    }
                  </span>{" "}
                  個商品
                </div>
                <div className="flex items-center gap-2" data-oid=":jbshig">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    data-oid="s7tb917"
                  >
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    data-oid="fo0njh4"
                  >
                    下一頁
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
        data-oid="1y_1zxa"
      >
        <AlertDialogContent data-oid="91h_mfy">
          <AlertDialogHeader data-oid=":082zx7">
            <AlertDialogTitle data-oid="q9mbwfm">確認刪除商品</AlertDialogTitle>
            <AlertDialogDescription data-oid="nsrr:or">
              您確定要刪除商品「{productToDelete?.name}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="5-0ccw:">
            <AlertDialogCancel data-oid="c0k0rq9">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProductMutation.isPending}
              data-oid="f22gv0u"
            >
              {deleteProductMutation.isPending && (
                <Loader2
                  className="h-4 w-4 animate-spin mr-2"
                  data-oid="m_01um1"
                />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認對話框 */}
      <AlertDialog
        open={showBatchDeleteDialog}
        onOpenChange={setShowBatchDeleteDialog}
        data-oid="08bejks"
      >
        <AlertDialogContent data-oid="4y-l6bz">
          <AlertDialogHeader data-oid="6kuc11k">
            <AlertDialogTitle data-oid="6mwiz.c">確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription data-oid="79rssi9">
              您確定要刪除選中的{" "}
              {table.getFilteredSelectedRowModel().rows.length}{" "}
              個商品嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="m9oeof-">
            <AlertDialogCancel data-oid="nb7zu_n">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMultipleProductsMutation.isPending}
              data-oid="yq4djpv"
            >
              {deleteMultipleProductsMutation.isPending && (
                <Loader2
                  className="h-4 w-4 animate-spin mr-2"
                  data-oid="7i7goim"
                />
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
        data-oid="q.v14n:"
      />
    </div>
  );
};

export default memo(ProductClientComponent);
