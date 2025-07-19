"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  useInstallations,
  useAssignInstaller,
  useUpdateInstallationStatus,
  useDeleteInstallation,
  useErrorHandler,
} from "@/hooks";
import { useUsers } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInstallationColumns } from "./columns";
import { 
  InstallationWithRelations, 
  InstallationFilters,
  InstallationStatus 
} from "@/types/installation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState,
  type RowSelectionState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InstallationPreviewContent } from "./InstallationPreviewContent";
import { InstallationProgressTracker } from "./InstallationProgressTracker";
import { useEmptyState } from "@/hooks/use-empty-state";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";

/**
 * 安裝管理主要客戶端組件
 * 
 * 提供安裝單的列表檢視、篩選、操作等功能
 */
export function InstallationClientComponent() {
  // 分頁狀態管理
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  // 行選擇狀態管理
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 篩選狀態管理
  const [filters, setFilters] = useState<InstallationFilters>({
    search: "",
    status: undefined,
    installer_user_id: undefined,
  });
  const debouncedSearch = useDebounce(filters.search || "", 500);

  // Modal 狀態管理
  const [previewingInstallationId, setPreviewingInstallationId] = useState<number | null>(null);
  const [assigningInstaller, setAssigningInstaller] = useState<InstallationWithRelations | null>(null);
  const [selectedInstallerId, setSelectedInstallerId] = useState<number | undefined>(undefined);
  const [updatingStatus, setUpdatingStatus] = useState<{
    installation: InstallationWithRelations;
    status: InstallationStatus;
  } | null>(null);
  const [statusUpdateReason, setStatusUpdateReason] = useState("");
  const [deletingInstallation, setDeletingInstallation] = useState<InstallationWithRelations | null>(null);

  // API Hooks
  const assignInstallerMutation = useAssignInstaller();
  const updateStatusMutation = useUpdateInstallationStatus();
  const deleteInstallationMutation = useDeleteInstallation();
  
  // 統一錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();
  // 只載入角色為 installer 的用戶作為師傅選項
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    role: 'installer'
  });

  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // 構建查詢參數
  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      installer_user_id: filters.installer_user_id || undefined,
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    }),
    [
      debouncedSearch,
      filters.status,
      filters.installer_user_id,
      pagination.pageIndex,
      pagination.pageSize,
    ],
  );

  // 使用真實的資料獲取 Hook
  const { data: response, isLoading, isError, error } = useInstallations(queryFilters);

  // 從響應中解析資料
  const pageData = ((response as any)?.data || []) as InstallationWithRelations[];
  const meta = (response as any)?.meta;

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('installations');

  // 建立確認分配師傅的處理函式
  const handleConfirmAssignInstaller = () => {
    if (!assigningInstaller || !selectedInstallerId) {
      handleError("請選擇安裝師傅");
      return;
    }

    assignInstallerMutation.mutate(
      { 
        installationId: assigningInstaller.id, 
        installer_user_id: selectedInstallerId 
      },
      {
        onSuccess: () => {
          setAssigningInstaller(null);
          setSelectedInstallerId(undefined);
          handleSuccess("師傅分配成功");
        },
        onError: (error) => {
          handleError(error);
        },
      },
    );
  };

  // 建立確認狀態更新的處理函式
  const handleConfirmStatusUpdate = () => {
    if (!updatingStatus) return;

    updateStatusMutation.mutate(
      {
        installationId: updatingStatus.installation.id,
        status: updatingStatus.status,
        reason: updatingStatus.status === 'cancelled' ? statusUpdateReason : undefined,
      },
      {
        onSuccess: () => {
          setUpdatingStatus(null);
          setStatusUpdateReason("");
          handleSuccess("狀態更新成功");
        },
        onError: (error) => {
          handleError(error);
        },
      },
    );
  };

  // 建立確認刪除安裝單的處理函式
  const handleConfirmDelete = () => {
    if (!deletingInstallation) return;

    deleteInstallationMutation.mutate(deletingInstallation.id, {
      onSuccess: () => {
        setDeletingInstallation(null);
        handleSuccess("安裝單已刪除");
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };

  // 建立 columns 回調函式
  const columns = useMemo(
    () =>
      createInstallationColumns({
        onPreview: setPreviewingInstallationId,
        onAssignInstaller: setAssigningInstaller,
        onUpdateStatus: (installation, status) => 
          setUpdatingStatus({ installation, status }),
        onEdit: (id: number) => {
          window.location.href = `/installations/${id}/edit`;
        },
        onDelete: (id: number) => {
          // 找到要刪除的安裝單並設置到狀態中
          const installationToDelete = pageData.find(installation => installation.id === id);
          if (installationToDelete) {
            setDeletingInstallation(installationToDelete);
          }
        },
      }),
    [pageData],
  );

  // 配置表格
  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    enableRowSelection: true,
    pageCount: meta?.last_page ?? -1,
    state: {
      sorting,
      pagination,
      rowSelection,
    },
  });

  if (isLoading) {
    return <DataTableSkeleton columns={8} />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <EmptyError
          title="載入安裝記錄失敗"
          description="無法載入安裝記錄列表，請稍後再試"
          onRetry={() => window.location.reload()}
          showDetails={true}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🔍 篩選與操作工具欄 - 現代化設計 */}
      <div className="bg-gradient-to-r from-card to-card/95 border border-border/40 rounded-xl p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* 左側篩選區域 */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            {/* 搜尋框 */}
            <div className="relative">
              <Input
                placeholder="搜尋安裝單號、客戶姓名、地址..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full lg:w-80 bg-background/60 border-border/50 placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-md"
                disabled={isLoading}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* 狀態篩選 */}
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => {
                const newValue = value === "all" ? undefined : (value as InstallationStatus);
                setFilters((prev) => ({ ...prev, status: newValue }));
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full lg:w-48 bg-background/60 border-border/50 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-md">
                <SelectValue placeholder="篩選狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    全部狀態
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    待處理
                  </div>
                </SelectItem>
                <SelectItem value="scheduled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    已排程
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    進行中
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    已完成
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    已取消
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* 師傅篩選 */}
            <Select
              value={filters.installer_user_id?.toString() || "all"}
              onValueChange={(value) => {
                const newValue = value === "all" ? undefined : parseInt(value, 10);
                setFilters((prev) => ({ ...prev, installer_user_id: newValue }));
              }}
              disabled={isLoadingUsers || isLoading}
            >
              <SelectTrigger className="w-full lg:w-48 bg-background/60 border-border/50 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-md">
                <SelectValue placeholder={isLoadingUsers ? "載入中..." : "篩選師傅"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    全部師傅
                  </div>
                </SelectItem>
                <SelectItem value="0">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    未分配
                  </div>
                </SelectItem>
                {usersData?.data?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {user.name || user.username}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 右側操作按鈕 */}
          <div className="flex items-center space-x-3">
            <Link href="/installations/new" passHref>
              <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 transform">
                <PlusCircle className="mr-2 h-4 w-4" />
                新增安裝單
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 📊 統計與選擇資訊欄 */}
      <div className="bg-gradient-to-r from-muted/20 to-muted/10 border border-border/30 rounded-lg p-4 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* 左側統計資訊 */}
          <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              已選擇 <span className="font-semibold text-foreground">{table.getFilteredSelectedRowModel().rows.length}</span> 筆 / 
              總計 <span className="font-semibold text-foreground">{meta?.total ?? 0}</span> 筆安裝單
            </div>
            {meta?.total && (
              <div className="text-xs text-muted-foreground/80 bg-muted/40 px-3 py-1.5 rounded-full border border-border/20">
                第 {pagination.pageIndex + 1} 頁 / 共 {meta.last_page} 頁
              </div>
            )}
          </div>

          {/* 右側批量操作 */}
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/90 hover:bg-background border-border/60 hover:border-primary/60 transition-all duration-300 shadow-sm hover:shadow-md"
                    disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    批量操作 ({table.getFilteredSelectedRowModel().rows.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 shadow-xl">
                  <DropdownMenuLabel className="flex items-center gap-2 text-sm font-semibold">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    批量更新狀態
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    設為已排程
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    設為進行中
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    設為已完成
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    取消安裝
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* 📋 資料表格區域 - 現代化設計 */}
      <div className="rounded-xl border border-border/40 bg-gradient-to-b from-card to-card/95 shadow-xl overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow 
                key={headerGroup.id} 
                className="border-b border-border/50 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 hover:from-muted/70 hover:via-muted/50 hover:to-muted/70 transition-all duration-300"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-14 px-6 text-left align-middle font-semibold text-foreground/90 tracking-wide text-sm"
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
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                const installation = row.original;
                
                return (
                  <React.Fragment key={row.id}>
                    {/* 主要資料行 */}
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className={`
                        border-b-0 transition-all duration-300 group cursor-pointer
                        ${index % 2 === 0 ? 'bg-background/70' : 'bg-muted/25'}
                        hover:bg-accent/60 hover:shadow-sm hover:scale-[1.005]
                        data-[state=selected]:bg-accent/80 data-[state=selected]:shadow-md
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-4 border-b-0 text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* 進度條行 */}
                    <TableRow
                      className={`
                        border-b border-border/30 transition-all duration-300
                        ${index % 2 === 0 ? 'bg-background/70' : 'bg-muted/25'}
                        hover:bg-accent/60 group-hover:bg-accent/60
                      `}
                    >
                      <TableCell 
                        colSpan={columns.length} 
                        className="px-6 py-3 border-b border-border/30"
                      >
                        <div className="flex justify-center">
                          <div className="w-full max-w-6xl">
                            <InstallationProgressTracker 
                              installation={installation} 
                              variant="compact" 
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {filters.search || filters.status || filters.installer_user_id ? (
                    <EmptySearch
                      searchTerm={filters.search}
                      onClearSearch={() => setFilters({ search: "", status: undefined, installer_user_id: undefined })}
                      suggestions={[
                        '嘗試搜尋安裝單編號',
                        '使用客戶名稱搜尋',
                        '調整狀態篩選條件',
                      ]}
                    />
                  ) : (
                    <EmptyTable
                      title={emptyConfig.title}
                      description={emptyConfig.description}
                      actionLabel={emptyConfig.actionLabel}
                      onAction={handleAction}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁器 */}
      <DataTablePagination table={table} />

      {/* 🎨 分配師傅確認對話框 - 美化版 */}
      <AlertDialog 
        open={!!assigningInstaller} 
        onOpenChange={(open) => {
          if (!open) {
            setAssigningInstaller(null);
            setSelectedInstallerId(undefined);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              分配安裝師傅
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2">
              為安裝單「<span className="font-semibold text-foreground">{assigningInstaller?.installation_number}</span>」選擇合適的安裝師傅。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="installer-select" className="text-sm font-medium flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                選擇安裝師傅
              </Label>
              <Select
                value={selectedInstallerId?.toString() || ""}
                onValueChange={(value) => setSelectedInstallerId(parseInt(value, 10))}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="h-11 bg-background/60 border-border/60 focus:border-primary/60 transition-all duration-200">
                  <SelectValue placeholder={
                    isLoadingUsers ? "載入師傅列表中..." : "請選擇安裝師傅"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {usersData?.data?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {(user.name || user.username)?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name || user.username}</span>
                          {user.email && (
                            <span className="text-muted-foreground text-xs">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:bg-muted">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssignInstaller}
              disabled={assignInstallerMutation.isPending || !selectedInstallerId}
              className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
            >
              {assignInstallerMutation.isPending ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4V1m6 6l-3-3M8 8l-3 3m3 3l3-3m6 6l-3 3" />
                  </svg>
                  分配中...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  確定分配
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🎨 狀態更新確認對話框 - 美化版 */}
      <AlertDialog 
        open={!!updatingStatus} 
        onOpenChange={(open) => !open && setUpdatingStatus(null)}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              更新安裝狀態
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2">
              即將將安裝單「<span className="font-semibold text-foreground">{updatingStatus?.installation.installation_number}</span>」的狀態更新為「<span className="font-semibold text-foreground">{updatingStatus?.status}</span>」。
            </AlertDialogDescription>
          </AlertDialogHeader>

          {updatingStatus?.status === 'cancelled' && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label htmlFor="cancel-reason" className="text-sm font-medium flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  取消原因 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="請詳細說明取消安裝的原因，例如：客戶要求延期、設備問題、天氣因素等..."
                  value={statusUpdateReason}
                  onChange={(e) => setStatusUpdateReason(e.target.value)}
                  className="min-h-[100px] bg-background/60 border-border/60 focus:border-primary/60 transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  取消原因將記錄在安裝單中，以便後續查詢和統計分析。
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:bg-muted">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusUpdate}
              disabled={updateStatusMutation.isPending || (updatingStatus?.status === 'cancelled' && !statusUpdateReason.trim())}
              className="bg-orange-500 hover:bg-orange-600 transition-colors duration-200"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  更新中...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  確定更新
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🗑️ 刪除安裝單確認對話框 - 美化版 */}
      <AlertDialog 
        open={!!deletingInstallation} 
        onOpenChange={(open) => !open && setDeletingInstallation(null)}
      >
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              確認刪除安裝單
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-2">
              您確定要刪除安裝單「<span className="font-semibold text-foreground">{deletingInstallation?.installation_number}</span>」嗎？
              <br /><br />
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  警告：此操作無法復原
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  安裝單及其相關的所有資料（包括進度記錄、師傅分配、客戶資訊等）將被永久刪除。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:bg-muted">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteInstallationMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200"
            >
              {deleteInstallationMutation.isPending ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  刪除中...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  確定刪除
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 👁️ 安裝單預覽對話框 - 美化版 */}
      <Dialog 
        open={!!previewingInstallationId} 
        onOpenChange={(open) => !open && setPreviewingInstallationId(null)}
      >
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden bg-gradient-to-b from-card to-card/95 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/30">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              安裝單詳細預覽
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh] pr-2">
            {previewingInstallationId && (
              <InstallationPreviewContent installationId={previewingInstallationId} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 