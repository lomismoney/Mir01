import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useStores, useAllInventoryTransactions } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/use-toast";

interface IncomingFilters {
  store_id?: number;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  order_number?: string;
  page?: number;
  per_page?: number;
}

/**
 * 入庫管理核心邏輯 Hook
 */
export function useIncomingManagement() {
  const { toast } = useToast();
  const router = useRouter();

  // 狀態管理
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [filters, setFilters] = useState<IncomingFilters>({
    page: 1,
    per_page: 20,
  });
  const [productNameInput, setProductNameInput] = useState("");

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300);

  // 獲取門市列表
  const { data: storesData, isLoading: isLoadingStores } = useStores();

  // 獲取入庫歷史（只查詢 addition 類型的交易記錄）
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useAllInventoryTransactions({
    type: "addition", // 只查詢入庫記錄
    store_id: filters.store_id,
    start_date: filters.start_date,
    end_date: filters.end_date,
    product_name: debouncedProductName || undefined,
    page: filters.page,
    per_page: filters.per_page,
  });

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      store_id: storeId,
      page: 1,
    }));
  };

  /**
   * 處理日期篩選變更
   */
  const handleDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1,
    }));
  };

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      per_page: 20,
    });
    setProductNameInput("");
  };

  /**
   * 刷新數據
   */
  const handleRefresh = () => {
    refetchTransactions();
    toast({
      title: "重新整理",
      description: "已重新載入入庫數據",
    });
  };

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0;
    if (debouncedProductName) count++;
    if (filters.store_id) count++;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    return count;
  };

  /**
   * 分頁處理
   */
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  return {
    // 狀態
    purchaseDialogOpen,
    setPurchaseDialogOpen,
    filters,
    productNameInput,
    setProductNameInput,
    
    // 數據
    storesData,
    transactionsData,
    isLoadingStores,
    isLoadingTransactions,
    transactionsError,
    
    // 處理函數
    handleStoreChange,
    handleDateChange,
    handleResetFilters,
    handleRefresh,
    getActiveFiltersCount,
    handlePageChange,
    refetchTransactions,
    
    // 工具
    router,
    toast,
  };
}