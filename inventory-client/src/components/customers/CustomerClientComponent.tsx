"use client";

import React, { useState, useEffect } from "react";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerDetail,
  useStandardTable,
} from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useCustomerModalManager, CUSTOMER_MODAL_TYPES } from "@/hooks/useModalManager";
import { useApiErrorHandler } from "@/hooks/useErrorHandler";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import { Customer } from "@/types/api-helpers";
import { columns } from "./columns";
import { CustomerForm } from "./CustomerForm";

export function CustomerClientComponent() {
  // 【升級】搜尋功能實現
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🎯 統一的 Modal 管理器
  const modalManager = useCustomerModalManager();
  const { handleError, handleSuccess } = useApiErrorHandler();

  // API 查詢 Hook - 現在支援搜尋參數
  const {
    data: customerResponse,
    isLoading,
    isError,
    error,
  } = useCustomers({
    search: debouncedSearchQuery || undefined, // 僅在有值時傳遞
  });

  // 創建和更新客戶的 Mutation Hook
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();


  // 🎯 純淨消費：直接從 Hook 返回的物件中解構出 data 和 meta
  const customers = customerResponse?.data ?? [];
  const pageMeta = customerResponse?.meta;

  // 表單提交處理邏輯
  const handleCreateSubmit = (values: any) => {
    createCustomer(values, {
      onSuccess: () => {
        modalManager.handleSuccess();
        handleSuccess('客戶新增成功');
      },
      onError: (error) => handleError(error),
    });
  };

  // 簡化的編輯處理函數
  const handleEditCustomer = (customer: Customer) => {
    modalManager.openModal(CUSTOMER_MODAL_TYPES.EDIT, customer);
  };

  // 編輯提交處理邏輯
  const handleEditSubmit = (values: any) => {
    const customer = modalManager.currentData;
    if (!customer) return;
    
    updateCustomer(
      { id: customer.id!, data: values },
      {
        onSuccess: () => {
          modalManager.handleSuccess();
          handleSuccess('客戶更新成功');
        },
        onError: (error) => handleError(error),
      }
    );
  };

  // 🎯 使用標準表格 Hook
  const tableManager = useStandardTable({
    data: customerResponse,
    columns: columns({ onEditCustomer: handleEditCustomer }),
    enablePagination: true,
    enableSorting: true,
    enableRowSelection: false,
    initialPageSize: 15,
  });

  // 【修復】現在才進行條件性渲染，所有 Hooks 都已調用完畢
  if (isLoading) {
    // 顯示骨架屏，提升加載體驗。6 列包含：名稱、電話、行業、付款、時間、操作
    return (
      <DataTableSkeleton
        columns={6}
        rows={5}
        showHeader={false}
       
      />
    );
  }

  if (isError) {
    return (
      <div className="text-red-500">
        無法加載客戶資料: {error?.message || "未知錯誤"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 【升級】工具列 - 搜尋與操作按鈕 */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜尋客戶名稱、電話或統編..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
         
        />

        {/* 新增客戶按鈕與對話框 */}
        <Dialog
          open={modalManager.isModalOpen(CUSTOMER_MODAL_TYPES.CREATE)}
          onOpenChange={(isOpen) => {
            if (isOpen) {
              modalManager.openModal(CUSTOMER_MODAL_TYPES.CREATE, null);
            } else {
              modalManager.closeModal();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>新增客戶</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>新增客戶</DialogTitle>
            </DialogHeader>
            <CustomerForm
              isSubmitting={isCreating}
              onSubmit={handleCreateSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 編輯客戶 Modal */}
      <Dialog 
        open={modalManager.isModalOpen(CUSTOMER_MODAL_TYPES.EDIT)} 
        onOpenChange={(isOpen) => !isOpen && modalManager.closeModal()}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              編輯客戶 - {modalManager.currentData?.name}
            </DialogTitle>
            <DialogDescription>
              修改客戶資料並儲存變更
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            initialData={modalManager.currentData || undefined}
            isSubmitting={isUpdating}
            onSubmit={handleEditSubmit}
          />
        </DialogContent>
      </Dialog>

      {/* 🎯 使用標準表格組件 */}
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              {tableManager.table.getHeaderGroups().map((headerGroup) => (
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
              {tableManager.table.getRowModel().rows?.length ? (
                tableManager.table.getRowModel().rows.map((row) => (
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
                  <td colSpan={columns({ onEditCustomer: handleEditCustomer }).length} className="h-24 text-center">
                    暫無客戶資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分頁邏輯將在後續與 meta 對象連接 */}
    </div>
  );
}
