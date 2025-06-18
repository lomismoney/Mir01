"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useInventoryList } from "@/hooks/queries/useEntityQueries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StoreCombobox } from "@/components/ui/store-combobox"
import { 
  Search, 
  History, 
  Package, 
  Building,
  Eye,
  Filter
} from "lucide-react"

export default function InventoryHistoryOverviewPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [storeFilter, setStoreFilter] = useState<string>("")
  
  const { data: inventoryData, isLoading, error } = useInventoryList({
    per_page: 50,
    product_name: searchTerm || undefined,
    store_id: storeFilter ? parseInt(storeFilter) : undefined,
  })

  const handleViewHistory = (sku: string, productName: string) => {
    const params = new URLSearchParams({
      productName,
      sku
    })
    router.push(`/inventory/history/sku/${sku}?${params.toString()}`)
  }

  // 將庫存數據按 SKU 分組，合併不同分店的數據
  const groupedInventory = inventoryData?.data ? 
    inventoryData.data.reduce((acc, inventory) => {
      const sku = inventory.product_variant?.sku || 'N/A'
      const productName = inventory.product_variant?.product?.name || '未知商品'
      
      if (!acc[sku]) {
        acc[sku] = {
          sku,
          productName,
          totalQuantity: 0,
          stores: [],
          minLowStockThreshold: Infinity,
          inventoryIds: []
        }
      }
      
      acc[sku].totalQuantity += inventory.quantity || 0
      acc[sku].stores.push({
        id: inventory.store_id,
        name: inventory.store?.name || `分店 ${inventory.store_id}`,
        quantity: inventory.quantity || 0,
        lowStockThreshold: inventory.low_stock_threshold || 0
      })
      
      if (inventory.low_stock_threshold && inventory.low_stock_threshold < acc[sku].minLowStockThreshold) {
        acc[sku].minLowStockThreshold = inventory.low_stock_threshold
      }
      
      if (inventory.id) {
        acc[sku].inventoryIds.push(inventory.id)
      }
      
      return acc
    }, {} as Record<string, {
      sku: string
      productName: string
      totalQuantity: number
      stores: Array<{
        id?: number
        name: string
        quantity: number
        lowStockThreshold: number
      }>
      minLowStockThreshold: number
      inventoryIds: number[]
    }>)
    : {}

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            載入庫存數據失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            庫存變動歷史
          </h1>
          <p className="text-muted-foreground mt-2">
            選擇庫存項目查看詳細的變動歷史記錄
          </p>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">商品名稱</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋商品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分店篩選</label>
              <StoreCombobox
                value={storeFilter}
                onValueChange={(value) => setStoreFilter(value)}
                placeholder="全部分店"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 庫存列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            庫存項目
          </CardTitle>
          <CardDescription>
            {Object.keys(groupedInventory).length > 0 && `共 ${Object.keys(groupedInventory).length} 個 SKU`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-9 w-[100px]" />
                </div>
              ))}
            </div>
          ) : inventoryData?.data && inventoryData.data.length > 0 ? (
            <div className="space-y-4">
              {Object.values(groupedInventory).map((group) => (
                <div key={group.sku} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {group.productName}
                        </h3>
                        <Badge variant="outline">
                          SKU: {group.sku}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>分店數: {group.stores.length}</span>
                        </div>
                        <div>
                          <span>總庫存: </span>
                          <span className={`font-medium ${
                            group.totalQuantity <= (group.minLowStockThreshold === Infinity ? 0 : group.minLowStockThreshold)
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {group.totalQuantity}
                          </span>
                        </div>
                        {group.minLowStockThreshold !== Infinity && (
                          <div>
                            <span>最低門檻: {group.minLowStockThreshold}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 分店詳細資訊 */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {group.stores.map((store, index) => (
                          <Badge key={`${store.id}-${index}`} variant="secondary" className="text-xs">
                            {store.name}: {store.quantity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleViewHistory(
                      group.sku,
                      group.productName
                    )}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    查看歷史
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>沒有找到庫存項目</p>
              <p className="text-sm">請嘗試調整搜尋條件</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
