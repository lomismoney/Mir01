"use client";

import React from "react";
import { useCustomerManagement } from "@/hooks/useCustomerManagement";
import { CUSTOMER_MODAL_TYPES } from "@/hooks/useModalManager";
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
import { flexRender } from "@tanstack/react-table";
import { columns } from "./columns";
import { CustomerForm } from "./CustomerForm";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";

export function CustomerClientComponent() {
  // === 使用業務邏輯 Hook ===
  const {
    // 資料狀態
    isLoading,
    isError,
    error,
    
    // 搜尋狀態
    searchQuery,
    setSearchQuery,
    clearSearch,
    
    // 表格狀態
    tableManager,
    
    // Modal 狀態
    modalManager,
    isCreating,
    isUpdating,
    
    // 空狀態配置
    emptyConfig,
    suggestions,
    
    // 操作函數
    handleCreateSubmit,
    handleEditSubmit,
    handleEditCustomer,
    openCreateModal,
    closeModal,
  } = useCustomerManagement();

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
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <EmptyError
          title="載入客戶資料失敗"
          description="無法載入客戶列表，請稍後再試"
          onRetry={() => window.location.reload()}
          showDetails={true}
          error={error}
        />
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
              openCreateModal();
            } else {
              closeModal();
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
        onOpenChange={(isOpen) => !isOpen && closeModal()}
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
                  <td colSpan={columns({ onEditCustomer: handleEditCustomer }).length} className="p-0">
                    {searchQuery ? (
                      <EmptySearch
                        searchTerm={searchQuery}
                        onClearSearch={clearSearch}
                        suggestions={suggestions}
                      />
                    ) : (
                      <EmptyTable
                        title={emptyConfig.title}
                        description={emptyConfig.description}
                        actionLabel={emptyConfig.actionLabel}
                        onAction={openCreateModal}
                      />
                    )}
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
