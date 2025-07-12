"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  useInstallations,
  useAssignInstaller,
  useUpdateInstallationStatus,
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

  // API Hooks
  const assignInstallerMutation = useAssignInstaller();
  const updateStatusMutation = useUpdateInstallationStatus();
  
  // 統一錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();
  // 只載入角色為 installer 的用戶作為師傅選項
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    'filter[role]': 'installer'
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
          // 刪除功能已在 columns 中實現
        },
      }),
    [],
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
      <div className="text-red-500">
        無法載入安裝資料: {error?.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 篩選與操作按鈕區域 */}
      <div className="bg-gradient-to-r from-card to-card/95 border border-border/40 rounded-xl p-6 shadow-md backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* 左側的篩選/搜尋區域 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                placeholder="搜尋安裝單號、客戶姓名..."
                value={filters.search || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-72 bg-background/50 border-border/60 placeholder:text-muted-foreground/60 focus:bg-background focus:border-primary/50 transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => {
                const newValue = value === "all" ? undefined : (value as InstallationStatus);
                setFilters((prev) => ({ ...prev, status: newValue }));
              }}
            >
              <SelectTrigger className="w-44 bg-background/50 border-border/60 hover:bg-background transition-colors duration-200">
                <SelectValue placeholder="安裝狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔄 全部狀態</SelectItem>
                <SelectItem value="pending">⏳ 待處理</SelectItem>
                <SelectItem value="scheduled">📅 已排程</SelectItem>
                <SelectItem value="in_progress">🚧 進行中</SelectItem>
                <SelectItem value="completed">✅ 已完成</SelectItem>
                <SelectItem value="cancelled">❌ 已取消</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.installer_user_id?.toString() || "all"}
              onValueChange={(value) => {
                const newValue = value === "all" ? undefined : parseInt(value, 10);
                setFilters((prev) => ({ ...prev, installer_user_id: newValue }));
              }}
              disabled={isLoadingUsers}
            >
              <SelectTrigger className="w-44 bg-background/50 border-border/60 hover:bg-background transition-colors duration-200">
                <SelectValue placeholder={isLoadingUsers ? "載入中..." : "安裝師傅"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 全部師傅</SelectItem>
                <SelectItem value="0">❓ 未分配</SelectItem>
                {usersData?.data?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    👨‍🔧 {user.name || user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 右側的操作按鈕區域 */}
          <Link href="/installations/new" passHref>
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105">
              <PlusCircle className="mr-2 h-4 w-4" />
              新增安裝單
            </Button>
          </Link>
        </div>
      </div>

      {/* 統計與批量操作欄 */}
      <div className="bg-muted/20 border border-border/30 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            已選擇 <span className="font-medium text-foreground">{table.getFilteredSelectedRowModel().rows.length}</span> 筆 / 
            總計 <span className="font-medium text-foreground">{meta?.total ?? 0}</span> 筆
          </div>
          {meta?.total && (
            <div className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded">
              第 {pagination.pageIndex + 1} 頁 / 共 {meta.last_page} 頁
            </div>
          )}
        </div>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/80 hover:bg-background border-border/60 hover:border-primary/50 transition-all duration-200"
                  disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  批量操作
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  批量更新狀態為
                </DropdownMenuLabel>
                <DropdownMenuItem>📅 已排程</DropdownMenuItem>
                <DropdownMenuItem>🚧 進行中</DropdownMenuItem>
                <DropdownMenuItem>✅ 已完成</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  ❌ 取消安裝
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 表格容器 */}
      <div className="rounded-xl border border-border/40 bg-gradient-to-b from-card to-card/95 shadow-lg overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/50 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 hover:from-muted/60 hover:via-muted/40 hover:to-muted/60">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-14 px-6 text-left align-middle font-semibold text-foreground/90 tracking-wide"
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
                        border-b-0 transition-all duration-200
                        ${index % 2 === 0 ? 'bg-background/60' : 'bg-muted/20'}
                        hover:bg-accent/50 hover:shadow-sm
                        data-[state=selected]:bg-accent/80
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-3 border-b-0">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* 進度條行 */}
                    <TableRow
                      className={`
                        border-b border-border/30 transition-all duration-200
                        ${index % 2 === 0 ? 'bg-background/60' : 'bg-muted/20'}
                        hover:bg-accent/50
                      `}
                    >
                      <TableCell 
                        colSpan={columns.length} 
                        className="px-6 py-3 border-b border-border/30"
                      >
                        <div className="flex justify-center">
                          <div className="w-full max-w-5xl">
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
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="rounded-full bg-muted/50 p-3 mb-4">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">暫無安裝資料</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      點擊上方「新增安裝單」按鈕開始建立第一個安裝單
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁器 */}
      <DataTablePagination table={table} />

      {/* 分配師傅確認對話框 */}
      <AlertDialog 
        open={!!assigningInstaller} 
        onOpenChange={(open) => {
          if (!open) {
            setAssigningInstaller(null);
            setSelectedInstallerId(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>分配安裝師傅</AlertDialogTitle>
            <AlertDialogDescription>
              為安裝單「{assigningInstaller?.installation_number}」選擇安裝師傅。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="installer-select">選擇安裝師傅</Label>
              <Select
                value={selectedInstallerId?.toString() || ""}
                onValueChange={(value) => setSelectedInstallerId(parseInt(value, 10))}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoadingUsers ? "載入師傅列表中..." : "請選擇安裝師傅"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {usersData?.data?.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.username}
                      {user.email && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({user.email})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssignInstaller}
              disabled={assignInstallerMutation.isPending || !selectedInstallerId}
            >
              {assignInstallerMutation.isPending ? "分配中..." : "確定分配"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 狀態更新確認對話框 */}
      <AlertDialog 
        open={!!updatingStatus} 
        onOpenChange={(open) => !open && setUpdatingStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>更新安裝狀態</AlertDialogTitle>
            <AlertDialogDescription>
              即將將安裝單「{updatingStatus?.installation.installation_number}」的狀態更新為「{updatingStatus?.status}」。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {updatingStatus?.status === 'cancelled' && (
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">取消原因</Label>
              <Textarea
                id="cancel-reason"
                placeholder="請輸入取消原因..."
                value={statusUpdateReason}
                onChange={(e) => setStatusUpdateReason(e.target.value)}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusUpdate}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "更新中..." : "確定更新"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 安裝單預覽 Modal */}
      <Dialog 
        open={!!previewingInstallationId} 
        onOpenChange={(open) => !open && setPreviewingInstallationId(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>安裝單預覽</DialogTitle>
          </DialogHeader>
          {previewingInstallationId && (
            <InstallationPreviewContent installationId={previewingInstallationId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 