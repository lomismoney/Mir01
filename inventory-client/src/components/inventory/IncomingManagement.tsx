"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PackagePlus, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog";

// 導入重構後的hooks和組件
import { useIncomingManagement } from "./hooks/useIncomingManagement";
import { useIncomingStatistics } from "./hooks/useIncomingStatistics";
import { StatisticsCards } from "./components/StatisticsCards";
import { IncomingFilters } from "./components/IncomingFilters";
import { TransactionsList } from "./components/TransactionsList";

export function IncomingManagement() {
  // 使用重構後的hooks
  const {
    purchaseDialogOpen,
    setPurchaseDialogOpen,
    filters,
    productNameInput,
    setProductNameInput,
    storesData,
    transactionsData,
    isLoadingStores,
    isLoadingTransactions,
    transactionsError,
    handleStoreChange,
    handleDateChange,
    handleResetFilters,
    handleRefresh,
    getActiveFiltersCount,
    handlePageChange,
  } = useIncomingManagement();

  // 統計數據
  const statistics = useIncomingStatistics(transactionsData);

  // 顯示錯誤狀態
  if (transactionsError) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">商品入庫管理</h1>
          <p className="text-muted-foreground">
            專注處理商品入庫操作和歷史記錄管理
          </p>
        </div>

        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>載入失敗</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>無法載入入庫數據，請稍後再試</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題區 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PackagePlus className="h-7 w-7 text-green-600" />
            商品入庫管理
          </h1>
          <p className="text-muted-foreground mt-1">
            專注處理商品入庫操作、查看入庫歷史記錄和追蹤入庫進度
          </p>
        </div>

        <Button
          onClick={() => setPurchaseDialogOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          新增進貨單
        </Button>
      </div>

      {/* 統計卡片區 */}
      <StatisticsCards
        todayCount={statistics.todayCount}
        weekCount={statistics.weekCount}
        totalCount={statistics.totalCount}
        pendingCount={statistics.pendingCount}
      />

      {/* 篩選器 */}
      <IncomingFilters
        productNameInput={productNameInput}
        setProductNameInput={setProductNameInput}
        storesData={storesData}
        isLoadingStores={isLoadingStores}
        filters={filters}
        handleStoreChange={handleStoreChange}
        handleDateChange={handleDateChange}
        handleResetFilters={handleResetFilters}
        handleRefresh={handleRefresh}
        getActiveFiltersCount={getActiveFiltersCount}
      />

      {/* 交易記錄列表 */}
      <TransactionsList
        transactionsData={transactionsData}
        isLoadingTransactions={isLoadingTransactions}
        handlePageChange={handlePageChange}
      />

      {/* 新增進貨單對話框 */}
      <CreatePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
      />
    </div>
  );
}