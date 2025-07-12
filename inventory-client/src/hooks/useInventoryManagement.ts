/**
 * 庫存管理業務邏輯 Hook
 * 
 * 提取 InventoryManagement 組件的業務邏輯，實現關注點分離：
 * 1. 篩選器狀態管理
 * 2. 搜尋和分頁處理
 * 3. 數據獲取和緩存
 * 4. 操作處理函數
 * 5. 計算屬性
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStores, useCategories, useInventoryList } from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/use-toast";
import { ProductFilters, InventoryProductItem } from "@/types/api-helpers";

export interface UseInventoryManagementReturn {
  // 狀態
  filters: ProductFilters;
  productNameInput: string;
  page: number;
  
  // 數據
  stores: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  inventoryData: {
    data: InventoryProductItem[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  } | undefined;
  
  // 載入狀態
  isLoadingStores: boolean;
  isLoadingCategories: boolean;
  isLoadingInventory: boolean;
  inventoryError: unknown;
  
  // 操作函數
  setProductNameInput: (value: string) => void;
  setPage: (page: number) => void;
  handleStoreChange: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleLowStockChange: (checked: boolean) => void;
  handleOutOfStockChange: (checked: boolean) => void;
  handleResetFilters: () => void;
  handleRefresh: () => void;
  handleManageProduct: (spuId: number) => void;
  handleAdjustInventory: (skuId: number, currentQuantity: number) => void;
  
  // 計算屬性
  getActiveFiltersCount: () => number;
}

export function useInventoryManagement(): UseInventoryManagementReturn {
  const { toast } = useToast();
  const router = useRouter();

  // 篩選器狀態管理
  const [filters, setFilters] = useState<ProductFilters>({});
  const [productNameInput, setProductNameInput] = useState("");
  const [page, setPage] = useState(1);

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300);

  // 將 debounced 值同步到 filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      product_name: debouncedProductName || undefined,
    }));
  }, [debouncedProductName]);

  // 獲取基礎資料
  const { data: storesResponse, isLoading: isLoadingStores } = useStores();
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories();

  // 🎯 標準化數據獲取 - 統一處理 API 回傳的結構化資料
  const stores = storesResponse?.data ?? [];
  const categories = categoriesResponse ?? [];

  // 獲取庫存列表數據
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventoryList({
    store_id: filters.store_id,
    low_stock: filters.low_stock,
    out_of_stock: filters.out_of_stock,
    product_name: filters.product_name,
    page,
    per_page: 15,
  });

  const handleRefresh = () => {
    refetchInventory();
    toast({
      title: "重新整理",
      description: "已重新載入庫存資料",
    });
  };

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      store_id: storeId,
    }));
  };

  /**
   * 處理分類篩選變更
   */
  const handleCategoryChange = (value: string) => {
    const categoryId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      category_id: categoryId,
    }));
  };

  /**
   * 處理低庫存篩選變更
   */
  const handleLowStockChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      low_stock: checked || undefined,
    }));
  };

  /**
   * 處理缺貨篩選變更
   */
  const handleOutOfStockChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      out_of_stock: checked || undefined,
    }));
  };

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({});
    setProductNameInput("");
  };

  /**
   * 處理商品管理操作
   * @param spuId - 商品 SPU ID
   */
  const handleManageProduct = (spuId: number) => {
    router.push(`/products/${spuId}/edit`);
  };

  /**
   * 處理庫存調整操作
   * @param skuId - SKU ID (變體 ID)
   * @param currentQuantity - 當前庫存數量
   *
   * 現在庫存修改功能已整合到表格中，此函數主要用於資料刷新
   */
  const handleAdjustInventory = (skuId: number, currentQuantity: number) => {
    // 刷新庫存資料
    refetchInventory();
  };

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.product_name) count++;
    if (filters.store_id) count++;
    if (filters.category_id) count++;
    if (filters.low_stock) count++;
    if (filters.out_of_stock) count++;
    return count;
  };

  return {
    // 狀態
    filters,
    productNameInput,
    page,
    
    // 數據
    stores,
    categories,
    inventoryData,
    
    // 載入狀態
    isLoadingStores,
    isLoadingCategories,
    isLoadingInventory,
    inventoryError,
    
    // 操作函數
    setProductNameInput,
    setPage,
    handleStoreChange,
    handleCategoryChange,
    handleLowStockChange,
    handleOutOfStockChange,
    handleResetFilters,
    handleRefresh,
    handleManageProduct,
    handleAdjustInventory,
    
    // 計算屬性
    getActiveFiltersCount,
  };
}