"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProducts, useStores, useCategories, useInventoryList } from "@/hooks/queries/useEntityQueries"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/components/ui/use-toast"
import { InventoryNestedTable } from "@/components/inventory/InventoryNestedTable"
import { ProductFilters } from "@/types/api-helpers"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  RotateCw as RefreshIcon, 
  Search, 
  AlertCircle, 
  LogIn, 
  Store, 
  Tag, 
  AlertTriangle, 
  PackageX,
  Package
} from "lucide-react"
import { InventoryListTable } from "@/components/inventory/InventoryListTable"
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog"
import Link from "next/link"

export function InventoryManagement() {
  const { toast } = useToast()
  const router = useRouter()

  // 篩選器狀態管理
  const [filters, setFilters] = useState<ProductFilters>({})
  const [productNameInput, setProductNameInput] = useState("")

  // 對話框狀態管理
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300)

  // 將 debounced 值同步到 filters
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      product_name: debouncedProductName || undefined
    }))
  }, [debouncedProductName])

  // 獲取基礎資料
  const { data: storesData, isLoading: isLoadingStores } = useStores()
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories()
  const { data: productData, isLoading: isLoadingProducts, error, isError, refetch: refetchProducts } = useProducts(filters)

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
  })

  const handleRefresh = () => {
    refetchInventory()
    refetchProducts()
    toast({
      title: "重新整理",
      description: "已重新載入庫存資料",
    })
  }

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value)
    setFilters(prev => ({
      ...prev,
      store_id: storeId
    }))
  }

  /**
   * 處理分類篩選變更
   */
  const handleCategoryChange = (value: string) => {
    const categoryId = value === "all" ? undefined : parseInt(value)
    setFilters(prev => ({
      ...prev,
      category_id: categoryId
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
   * 現在庫存修改功能已整合到表格中，此函數主要用於資料刷新
   */
  const handleAdjustInventory = (skuId: number, currentQuantity: number) => {
    // 刷新庫存資料
    refetchInventory()
    refetchProducts()
  }

  /**
   * 轉換庫存資料為商品分組的巢狀表格格式
   * @param inventoryData - 庫存列表資料
   * @returns 轉換後的商品分組資料格式
   */
  const transformInventoryToProductData = (inventoryData: unknown[]) => {
    if (!Array.isArray(inventoryData)) {
      return []
    }
    
    // 按商品分組庫存資料
    const productGroups = new Map<number, any>()
    
    inventoryData.forEach((inventory: any) => {
      if (!inventory?.product_variant?.product) {
        return
      }
      
      const product = inventory.product_variant.product
      const productId = product.id
      const variantId = inventory.product_variant.id
      
      if (!productGroups.has(productId)) {
        // 創建商品分組
        productGroups.set(productId, {
          id: product.id,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          category: product.category,
          created_at: product.created_at,
          updated_at: product.updated_at,
          variants: new Map() // 使用 Map 來避免重複的 variant
        })
      }
      
      const productGroup = productGroups.get(productId)
      
      // 檢查是否已有此 variant
      if (!productGroup.variants.has(variantId)) {
        // 創建新的 variant
        productGroup.variants.set(variantId, {
          id: inventory.product_variant.id,
          sku: inventory.product_variant.sku,
          price: inventory.product_variant.price,
          product_id: inventory.product_variant.product_id,
          created_at: inventory.product_variant.created_at,
          updated_at: inventory.product_variant.updated_at,
          product: product,
          attribute_values: inventory.product_variant.attribute_values || [],
          inventory: []
        })
      }
      
      // 添加庫存資訊到現有 variant
      const variant = productGroup.variants.get(variantId)
      variant.inventory.push({
        id: inventory.id,
        quantity: inventory.quantity,
        low_stock_threshold: inventory.low_stock_threshold,
        store: inventory.store
      })
    })
    
    // 轉換 Map 為 Array
    return Array.from(productGroups.values()).map(product => ({
      ...product,
      variants: Array.from(product.variants.values())
    }))
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
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">庫存管理</h2>
          <p className="text-muted-foreground mb-4">
          此功能正在開發中，請稍後再試。
          </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            📋 技術債務：需要修復庫存管理頁面的狀態管理和 UI 組件導入問題
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setPurchaseDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            商品入庫
          </Button>
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

          {/* 操作按鈕區域 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetFilters}>
                重置篩選
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
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

      {/* 庫存列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            庫存總覽
          </CardTitle>
          <CardDescription>
            顯示各商品變體的庫存狀況，包含成本與利潤分析
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {inventoryError ? (
            <div className="p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>載入失敗</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{inventoryError.message}</span>
                  {inventoryError.message?.includes('請先登入') && (
                    <Button asChild size="sm" className="ml-4">
                      <Link href="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        立即登入
                      </Link>
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <InventoryListTable
              data={inventoryData?.data || []}
              isLoading={isLoadingInventory}
              onSelectInventory={() => {
                toast({
                  title: "功能提示",
                  description: "請使用下方巢狀表格中的修改庫存按鈕來調整個別商品的庫存數量",
                })
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* 巢狀庫存表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            商品庫存明細
          </CardTitle>
          <CardDescription>
            按商品分組顯示庫存詳情，支援展開查看各變體的庫存狀況
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <InventoryNestedTable
            data={transformInventoryToProductData(inventoryData?.data || [])}
            isLoading={isLoadingInventory}
            onAdjustInventory={handleAdjustInventory}
            onManageProduct={handleManageProduct}
          />
        </CardContent>
      </Card>

      {/* 商品入庫對話框 */}
      <CreatePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSuccess={() => {
          refetchInventory()
          refetchProducts()
          toast({
            title: "進貨成功",
            description: "商品已成功入庫，庫存已更新",
          })
        }}
      />
    </div>
  );
} 