"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProducts, useStores, useCategories } from "@/hooks/queries/useEntityQueries"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/components/ui/use-toast"
import { InventoryNestedTable } from "@/components/inventory/InventoryNestedTable"
import { ProductItem, ProductFilters } from "@/types/api-helpers"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Store, Tag, AlertTriangle, PackageX, RotateCcw } from "lucide-react"

/**
 * API 回傳的商品數據結構
 * 與 useProducts hook 返回的數據完全匹配
 */
interface ApiProductVariant {
  id?: number;
  sku?: string;
  price?: number; // API 回傳 number 類型
  product_id?: number;
  created_at?: string;
  updated_at?: string;
  attribute_values?: {
    id?: number;
    value?: string;
    attribute_id?: number;
    attribute?: {
      id?: number;
      name?: string;
    };
  }[];
}

interface ApiProduct {
  id?: number;
  name?: string;
  description?: string;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
  variants?: ApiProductVariant[];
  price_range?: {
    min?: number;
    max?: number;
    count?: number;
  };
  category?: {
    id?: number;
    name?: string;
    description?: string;
  };
}

export function InventoryManagement() {
  const { toast } = useToast()
  const router = useRouter()

  // 篩選器狀態管理
  const [filters, setFilters] = useState<ProductFilters>({})
  const [productNameInput, setProductNameInput] = useState("")

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300)

  // 獲取基礎資料
  const { data: storesData, isLoading: isLoadingStores } = useStores()
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()

  // 獲取商品列表數據 (包含變體和庫存資訊)
  const {
    data: productData,
    isLoading: isLoadingProducts,
    isError,
    error,
    refetch: refetchProducts,
  } = useProducts(filters)

  /**
   * 監聽 debouncedProductName 變化，更新篩選器
   * 實現防抖搜尋功能，避免頻繁 API 請求
   */
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      product_name: debouncedProductName || undefined
    }))
  }, [debouncedProductName])

  /**
   * 轉換 API 數據為 ProductItem 格式
   * 主要處理 price 字段的類型轉換 (number -> string)
   * 確保端到端類型安全，嚴格禁止使用 any 類型
   */
  const transformProductData = (data: ApiProduct[]): ProductItem[] => {
    return data.map((product: ApiProduct) => ({
      ...product,
      variants: product.variants?.map((variant: ApiProductVariant) => ({
        ...variant,
        price: variant.price?.toString() || undefined, // 將 number 轉為 string
      })) || []
    }))
  }

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      store_id: value === "all" ? undefined : Number(value)
    }))
  }

  /**
   * 處理分類篩選變更
   */
  const handleCategoryChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      category_id: value === "all" ? undefined : Number(value)
    }))
  }

  /**
   * 處理低庫存篩選變更
   */
  const handleLowStockChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      low_stock: checked || undefined
    }))
  }

  /**
   * 處理缺貨篩選變更
   */
  const handleOutOfStockChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      out_of_stock: checked || undefined
    }))
  }

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({})
    setProductNameInput("")
  }

  /**
   * 處理商品管理操作
   * @param spuId - 商品 SPU ID
   */
  const handleManageProduct = (spuId: number) => {
    router.push(`/products/${spuId}/edit`)
  }

  /**
   * 處理庫存調整操作
   * @param skuId - SKU ID (變體 ID)
   * @param currentQuantity - 當前庫存數量
   * 
   * 注意：此功能的完整實現已記錄在技術債務 TD-003 中
   */
  const handleAdjustInventory = (skuId: number, currentQuantity: number) => {
    console.log('調整庫存:', { skuId, currentQuantity })
    toast({
      title: "庫存調整",
      description: `準備調整 SKU ${skuId} 的庫存 (當前: ${currentQuantity})`,
    })
  }

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.product_name) count++
    if (filters.store_id) count++
    if (filters.category_id) count++
    if (filters.low_stock) count++
    if (filters.out_of_stock) count++
    return count
  }

  // 顯示錯誤狀態
  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">載入失敗</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || '無法載入商品資料'}
          </p>
          <button 
            onClick={() => refetchProducts()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            重試
          </button>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingProducts || isLoadingStores || isLoadingCategories

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">庫存管理</h2>
          <p className="text-muted-foreground">管理和監控商品庫存狀況</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 商品名稱搜尋 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
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
              <label className="text-sm font-medium flex items-center gap-2">
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
                  <SelectItem value="all">所有門市</SelectItem>
                  {storesData?.data?.map((store) => (
                    <SelectItem key={store.id} value={store.id?.toString() || ""}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分類篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
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
                  <SelectItem value="all">所有分類</SelectItem>
                  {categoriesData?.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id?.toString() || ""}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 低庫存篩選 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
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
              <label className="text-sm font-medium flex items-center gap-2">
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

          {/* 重置按鈕 */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                重置篩選器
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 巢狀庫存表格 */}
      <InventoryNestedTable
        data={transformProductData(productData?.data || [])}
        isLoading={isLoading}
        onAdjustInventory={handleAdjustInventory}
        onManageProduct={handleManageProduct}
      />
    </div>
  )
} 