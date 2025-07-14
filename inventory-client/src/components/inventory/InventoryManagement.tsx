"use client";

import { useInventoryManagement } from "@/hooks/useInventoryManagement";
import { InventoryNestedTable } from "@/components/inventory/InventoryNestedTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCw as RefreshIcon,
  Search,
  AlertCircle,
  LogIn,
  Store,
  Tag,
  AlertTriangle,
  PackageX,
  Package,
} from "lucide-react";

import Link from "next/link";
import { InventoryPagination } from "./InventoryPagination";
import { useEmptyState } from "@/hooks/use-empty-state";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";

export function InventoryManagement() {
  // 使用自定義 hook 獲取所有業務邏輯
  const {
    // 狀態
    filters,
    productNameInput,
    
    // 數據
    stores,
    categories,
    inventoryData,
    
    // 載入狀態
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
  } = useInventoryManagement();

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('inventory');

  // 顯示錯誤狀態
  if (inventoryError) {
    return (
      <div className="space-y-6 p-6">
        {/* 頁面標題區 */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">
            庫存管理
          </h1>
          <p className="text-muted-foreground">
            管理商品庫存數量、監控庫存水位和處理庫存調整
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <EmptyError
              title="載入庫存資料失敗"
              description="無法載入庫存列表，請稍後再試"
              onRetry={handleRefresh}
              showDetails={true}
              error={inventoryError}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 頁面標題區 */}
      <div
        className="flex items-center justify-between mb-6"
       
      >
        <div>
          <h1 className="text-2xl font-bold">
            庫存管理
          </h1>
          <p className="text-muted-foreground">
            管理商品庫存數量、監控庫存水位和處理庫存調整
          </p>
        </div>
      </div>

      {/* 篩選器區域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            篩選器
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} 項篩選
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            使用以下篩選器來精確查找您需要的商品和庫存資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
           
          >
            {/* 商品名稱搜尋 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium flex items-center gap-2"
               
              >
                <Search className="h-4 w-4" />
                商品名稱
              </label>
              <Input
                placeholder="搜尋商品名稱..."
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                className="w-full"
               
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium flex items-center gap-2"
               
              >
                <Store className="h-4 w-4" />
                門市
              </label>
              <Select
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
               
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    所有門市
                  </SelectItem>
                  {stores.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id?.toString() || ""}
                     
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分類篩選 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium flex items-center gap-2"
               
              >
                <Tag className="h-4 w-4" />
                分類
              </label>
              <Select
                value={filters.category_id?.toString() || "all"}
                onValueChange={handleCategoryChange}
               
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    所有分類
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id?.toString() || ""}
                     
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 低庫存篩選 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium flex items-center gap-2"
               
              >
                <AlertTriangle className="h-4 w-4" />
                庫存狀態
              </label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="low-stock"
                  checked={!!filters.low_stock}
                  onCheckedChange={handleLowStockChange}
                 
                />

                <label
                  htmlFor="low-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                 
                >
                  低庫存
                </label>
              </div>
            </div>

            {/* 缺貨篩選 */}
            <div className="space-y-2">
              <label
                className="text-sm font-medium flex items-center gap-2"
               
              >
                <PackageX className="h-4 w-4" />
                缺貨狀態
              </label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="out-of-stock"
                  checked={!!filters.out_of_stock}
                  onCheckedChange={handleOutOfStockChange}
                 
                />

                <label
                  htmlFor="out-of-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                 
                >
                  缺貨
                </label>
              </div>
            </div>
          </div>

          {/* 操作按鈕區域 */}
          <div
            className="flex items-center justify-between pt-4"
           
          >
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleResetFilters}
               
              >
                重置篩選
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
               
              >
                <RefreshIcon className="h-4 w-4 mr-2" />
                重新整理
              </Button>
            </div>
            {getActiveFiltersCount() > 0 && (
              <p className="text-sm text-muted-foreground">
                找到 {inventoryData?.data?.length || 0} 筆結果
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 商品庫存明細 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            商品庫存明細
          </CardTitle>
          <CardDescription>
            按商品分組顯示庫存詳情，支援展開查看各變體的庫存狀況
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {inventoryError ? (
            <div className="p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>載入失敗</AlertTitle>
                <AlertDescription
                  className="flex items-center justify-between"
                 
                >
                  <span>無法載入庫存資料</span>
                  <Button asChild size="sm" className="ml-4">
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      立即登入
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <InventoryNestedTable
              data={inventoryData?.data || []}
              isLoading={isLoadingInventory}
              onAdjustInventory={handleAdjustInventory}
              onManageProduct={handleManageProduct}
              emptyState={
                productNameInput || filters.store_id || filters.category_id || filters.show_low_stock || filters.show_out_of_stock ? (
                  <EmptySearch
                    searchTerm={productNameInput}
                    onClearSearch={handleResetFilters}
                    suggestions={[
                      '嘗試搜尋商品名稱或 SKU',
                      '調整倉庫或分類篩選',
                      '檢查庫存警示篩選條件',
                    ]}
                  />
                ) : (
                  <EmptyTable
                    title={emptyConfig.title}
                    description={emptyConfig.description}
                    actionLabel={emptyConfig.actionLabel}
                    onAction={handleAction}
                  />
                )
              }
             
            />
          )}
        </CardContent>
        {inventoryData?.meta && (
          <CardFooter
            className="flex items-center justify-center border-t pt-6"
           
          >
            <InventoryPagination
              meta={{
                current_page: inventoryData.meta.current_page || 1,
                last_page: inventoryData.meta.last_page || 1,
                per_page: inventoryData.meta.per_page || 15,
                total: inventoryData.meta.total || 0,
              }}
              onPageChange={setPage}
             
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
