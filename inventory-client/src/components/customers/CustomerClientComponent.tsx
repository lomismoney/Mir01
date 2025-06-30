"use client";

import React, { useState, useEffect } from "react";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerDetail,
} from "@/hooks/queries/useEntityQueries";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Customer } from "@/types/api-helpers";
import { columns } from "./columns";
import { CustomerForm } from "./CustomerForm";

export function CustomerClientComponent() {
  // 【升級】搜尋功能實現
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 【現有】新增客戶 Modal 狀態管理
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // 🎯 【Task 1.1】新增編輯 Modal 狀態管理
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // API 查詢 Hook - 現在支援搜尋參數
  const {
    data: customerResponse,
    isLoading,
    isError,
    error,
  } = useCustomers({
    search: debouncedSearchQuery || undefined, // 僅在有值時傳遞
  });

  // 【現有】創建客戶的 Mutation Hook
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();

  // 🎯 【Task 1.2】整合 useUpdateCustomer Hook
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  // 🎯 【Task 1.4 & 2.3】「預載 + 後台刷新」模式：獲取最新完整數據，包含錯誤處理
  const { 
    data: latestCustomerData, 
    refetch: refetchCustomerDetail,
    isLoading: isLoadingDetail,
    error: detailError
  } = useCustomerDetail(editingCustomer?.id!);

  // 狀態管理 Hooks
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // 🎯 【Task 2.3】後台同步狀態管理
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // 🎯 純淨消費：直接從 Hook 返回的物件中解構出 data 和 meta
  const customers = customerResponse?.data ?? [];
  const pageMeta = customerResponse?.meta;

  // 【現有】表單提交處理邏輯
  const handleCreateSubmit = (values: any) => {
    createCustomer(values, {
      onSuccess: () => {
        setCreateModalOpen(false); // 成功後關閉彈窗
      },
    });
  };

  // 🎯 【Task 1.3 & 2.3】實現「預載 + 後台刷新」編輯觸發函數，增強錯誤處理
  const handleEditCustomer = (customer: Customer) => {
    // 1. 立即預載：使用列表數據打開 Modal (零延遲體驗)
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
    setSyncError(null); // 清除之前的錯誤
    
    // 2. 後台刷新：靜默獲取最新完整數據
    setTimeout(() => {
      setIsBackgroundSyncing(true);
      refetchCustomerDetail()
        .catch((error) => {
          setSyncError("獲取最新客戶資料失敗，正在使用列表中的資料");
          console.warn("後台同步失敗:", error);
        })
        .finally(() => {
          setIsBackgroundSyncing(false);
        });
    }, 100); // 確保 Modal 已渲染
  };

  // 🎯 【Task 1.5 & 2.3】實現無感數據同步機制，包含錯誤處理
  useEffect(() => {
    if (latestCustomerData && isEditModalOpen && editingCustomer) {
      // 只有在數據真的不同時才更新（避免不必要的表單重置）
      if (JSON.stringify(latestCustomerData) !== JSON.stringify(editingCustomer)) {
        setEditingCustomer(latestCustomerData);
        setSyncError(null); // 成功同步，清除錯誤
        // 可選：提示用戶數據已更新
        console.log('📊 客戶數據已後台同步更新');
      }
    }
  }, [latestCustomerData, isEditModalOpen, editingCustomer]);

  // 🎯 【Task 1.6 & 2.3】實現編輯提交處理邏輯，增強錯誤處理
  const handleEditSubmit = (values: any) => {
    updateCustomer(
      { id: editingCustomer!.id!, data: values },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
          setSyncError(null);
          setIsBackgroundSyncing(false);
          // React Query 會自動重新獲取列表數據
        },
        onError: (error) => {
          console.error("更新客戶失敗:", error);
          // 錯誤處理由 CustomerForm 內部的 react-hook-form 和 API 錯誤處理
        },
      }
    );
  };

  // 🎯 【Task 2.3】手動重試獲取客戶詳情
  const handleRetrySync = () => {
    if (editingCustomer?.id) {
      setIsBackgroundSyncing(true);
      setSyncError(null);
      refetchCustomerDetail()
        .catch((error) => {
          setSyncError("重試失敗，請稍後再試");
          console.warn("重試同步失敗:", error);
        })
        .finally(() => {
          setIsBackgroundSyncing(false);
        });
    }
  };

  // 配置表格（每次渲染都配置，確保 Hooks 順序一致）
  const table = useReactTable({
    data: customers,
    columns: columns({ onEditCustomer: handleEditCustomer }), // 🎯 傳遞編輯回調
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // 【修復】現在才進行條件性渲染，所有 Hooks 都已調用完畢
  if (isLoading) {
    // 顯示骨架屏，提升加載體驗。6 列包含：名稱、電話、行業、付款、時間、操作
    return (
      <DataTableSkeleton
        columns={6}
        rows={5}
        showHeader={false}
        data-oid="q1cih:k"
      />
    );
  }

  if (isError) {
    return (
      <div className="text-red-500" data-oid="krj1zia">
        無法加載客戶資料: {error?.message || "未知錯誤"}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-oid="dfmx2hw">
      {/* 【升級】工具列 - 搜尋與操作按鈕 */}
      <div className="flex items-center justify-between" data-oid="yyerznt">
        <Input
          placeholder="搜尋客戶名稱、電話或統編..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-oid="fptju4r"
        />

        {/* 【現有】新增客戶按鈕與對話框 */}
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={setCreateModalOpen}
          data-oid="cfplh_s"
        >
          <DialogTrigger asChild data-oid=".ai_p__">
            <Button data-oid="6exc4rg">新增客戶</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" data-oid="jjjzpp9">
            <DialogHeader data-oid="a2t_a61">
              <DialogTitle data-oid="nxg63:a">新增客戶</DialogTitle>
            </DialogHeader>
            <CustomerForm
              isSubmitting={isCreating}
              onSubmit={handleCreateSubmit}
              data-oid=":93cfk2"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 🎯 【Task 2 - 完整實現】編輯客戶 Modal，包含 loading 和 error 狀態處理 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              編輯客戶 - {editingCustomer?.name}
              {/* 🎯 【Task 2.3】後台同步狀態指示器 */}
              {isBackgroundSyncing && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              )}
            </DialogTitle>
            {/* 🎯 【Task 2.3】提供額外的上下文說明 */}
            <DialogDescription>
              {isBackgroundSyncing 
                ? "正在同步最新客戶資料..." 
                : "修改客戶資料並儲存變更"
              }
            </DialogDescription>
          </DialogHeader>

          {/* 🎯 【Task 2.3】錯誤狀態處理 */}
          {syncError && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{syncError}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetrySync}
                  disabled={isBackgroundSyncing}
                >
                  {isBackgroundSyncing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "重試"
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* 🎯 【Task 2.3】載入骨架屏 - 當客戶詳情正在載入時 */}
          {isLoadingDetail && !editingCustomer ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ) : (
            /* 🎯 【Task 2.1 & 2.2】完整的表單組件，與新增 Modal 樣式保持一致 */
            <CustomerForm
              initialData={editingCustomer || undefined}
              isSubmitting={isUpdating}
              onSubmit={handleEditSubmit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 表格容器 */}
      <div className="rounded-md border" data-oid="ncku7l0">
        <Table data-oid="db:8idg">
          <TableHeader data-oid="fpapqj5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b hover:bg-transparent"
                data-oid="62npwkv"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      data-oid="wj.coop"
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
          <TableBody data-oid="6jywpyl">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-oid="nd84i3m"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} data-oid="foizz6:">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow data-oid="vq8bfs6">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                  data-oid="q7t853m"
                >
                  暫無客戶資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁邏輯將在後續與 meta 對象連接 */}
    </div>
  );
}
