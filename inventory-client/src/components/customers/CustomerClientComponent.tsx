"use client";

import React, { useState } from "react";
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  Shield
} from "lucide-react";
import { useCustomerManagement } from "@/hooks/useCustomerManagement";
import { CUSTOMER_MODAL_TYPES } from "@/hooks/useModalManager";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
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
import { CustomerBatchOperationsBar } from "./CustomerBatchOperationsBar";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";

export function CustomerClientComponent() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.isAdmin || false;
  
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
    isBatchDeleting,
    
    // 空狀態配置
    emptyConfig,
    suggestions,
    
    // 操作函數
    handleCreateSubmit,
    handleEditSubmit,
    handleEditCustomer,
    handleBatchDeleteCustomers,
    openCreateModal,
    closeModal,
  } = useCustomerManagement();

  // 從響應中提取 customers 數據
  const allCustomers = tableManager.table.getCoreRowModel().rows.map(row => row.original) || [];
  
  // 🔍 客戶端搜尋過濾功能
  const customers = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allCustomers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allCustomers.filter((customer: any) => {
      return (
        customer.name?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.tax_id?.toLowerCase().includes(query) ||
        customer.industry_type?.toLowerCase().includes(query)
      );
    });
  }, [allCustomers, searchQuery]);

  // 計算客戶統計數據（使用真實 API 數據）
  const getCustomerStats = () => {
    const totalCustomers = allCustomers.length;
    const companyCustomers = allCustomers.filter((customer: any) => customer.is_company).length;
    const totalUnpaidAmount = allCustomers.reduce((sum: number, customer: any) => sum + (customer.total_unpaid_amount || 0), 0);
    const totalCompletedAmount = allCustomers.reduce((sum: number, customer: any) => sum + (customer.total_completed_amount || 0), 0);

    return {
      total: totalCustomers,
      companies: companyCustomers,
      individuals: totalCustomers - companyCustomers,
      unpaidAmount: totalUnpaidAmount,
      completedAmount: totalCompletedAmount,
    };
  };

  const stats = getCustomerStats();

  // 獲取選中的客戶
  const selectedRows = tableManager.table.getFilteredSelectedRowModel().rows;
  const selectedCustomers = selectedRows.map(row => row.original);

  // 批量操作處理函數
  const handleClearSelection = () => {
    tableManager.table.resetRowSelection();
  };

  // 計算百分比變化（模擬數據，未來可接入真實趨勢數據）
  const percentageChanges = {
    total: 6.8,
    companies: 4.2,
    individuals: 8.1,
    unpaidAmount: -3.5,
    completedAmount: 12.4,
  };

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
    <div className="space-y-6">
      {/* 📱 頁面標題區域 - 與 stores 頁面一致的簡潔設計 */}
      <div>
        <h2 className="text-2xl font-bold">
          客戶管理
        </h2>
        <p className="text-muted-foreground">
          管理您的所有客戶資料、地址與訂單歷史。
        </p>
      </div>

      {/* 🎯 統計卡片區域 - 與 stores 頁面相同樣式 */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              總客戶數量
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.total}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                系統中所有客戶
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              企業客戶
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.companies}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                公司或企業客戶
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.companies}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              未付金額
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : `$${stats.unpaidAmount.toLocaleString()}`}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                待收款總金額
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingDown className="h-3 w-3 mr-1" />
                {percentageChanges.unpaidAmount}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              已收金額
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : `$${stats.completedAmount.toLocaleString()}`}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                已完成收款總額
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.completedAmount}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 📊 客戶資料表格區域 */}
      <div className="space-y-4">
        {/* 🎯 批量操作工具欄 - 只在有選擇客戶時顯示 */}
        {selectedCustomers.length > 0 && (
          <CustomerBatchOperationsBar
            selectedCustomers={selectedCustomers}
            onBatchDelete={handleBatchDeleteCustomers}
            onClearSelection={handleClearSelection}
            isBatchOperating={isBatchDeleting}
          />
        )}

        {/* 🔍 搜尋與操作工具列 */}
        <div className="flex items-center justify-between">
          <Input
            placeholder="搜尋客戶名稱、電話或統編..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            disabled={isLoading}
          />

          {/* 新增客戶按鈕 */}
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
    </div>
  );
}
