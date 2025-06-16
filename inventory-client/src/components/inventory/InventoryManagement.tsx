"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useInventoryList, useStores } from "@/hooks/queries/useEntityQueries"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RotateCw as RefreshIcon, Search } from "lucide-react"
import { InventoryListTable } from "@/components/inventory/InventoryListTable"
import { InventoryAdjustmentDialog } from "@/components/inventory/InventoryAdjustmentDialog"

export function InventoryManagement() {
  const { toast } = useToast()
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [showLowStock, setShowLowStock] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  // 獲取門市列表
  const { data: storesData, isLoading: isLoadingStores } = useStores()

  // 獲取庫存列表
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    refetch: refetchInventory,
  } = useInventoryList({
    store_id: selectedStoreId,
    low_stock: showLowStock,
    out_of_stock: showOutOfStock,
    product_name: searchTerm || undefined,
  })

  const handleRefresh = () => {
    refetchInventory()
    toast({
      title: "重新整理",
      description: "已重新載入庫存資料",
    })
  }

  const handleInventoryUpdateSuccess = () => {
    refetchInventory()
    toast({
      title: "庫存更新成功",
      description: "庫存已成功更新",
    })
  }

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">庫存管理</h2>
          <p className="text-muted-foreground">管理和監控商品庫存狀況</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshIcon className="h-4 w-4 mr-2" />
            重新整理
          </Button>
          <InventoryAdjustmentDialog onSuccess={handleInventoryUpdateSuccess} />
        </div>
      </div>

      {/* 篩選控制區塊 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* 門市選擇 */}
            <div className="space-y-2">
              <Label htmlFor="store-select">門市</Label>
              <Select
                disabled={isLoadingStores}
                value={selectedStoreId?.toString() || "all"}
                onValueChange={(value) => setSelectedStoreId(value === "all" ? undefined : Number(value))}
              >
                <SelectTrigger id="store-select">
                  <SelectValue placeholder="所有門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有門市</SelectItem>
                  {storesData?.data?.map((store) => (
                    <SelectItem key={store.id} value={store.id?.toString() || ''}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 產品搜尋 */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">搜尋產品</Label>
              <div className="flex w-full items-center space-x-2">
                <Input
                  id="search"
                  placeholder="輸入產品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button size="sm" onClick={() => refetchInventory()}>
                  <Search className="h-4 w-4 mr-2" />
                  搜尋
                </Button>
              </div>
            </div>
          </div>

          {/* 篩選選項 */}
          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="low-stock"
                checked={showLowStock}
                onCheckedChange={(checked) => setShowLowStock(checked === true)}
              />
              <Label htmlFor="low-stock" className="text-sm font-normal">
                只顯示低庫存商品
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="out-of-stock"
                checked={showOutOfStock}
                onCheckedChange={(checked) => setShowOutOfStock(checked === true)}
              />
              <Label htmlFor="out-of-stock" className="text-sm font-normal">
                只顯示缺貨商品
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 庫存列表 */}
      <Card>
        <CardContent className="p-0">
          <InventoryListTable
            data={inventoryData?.data || []}
            isLoading={isLoadingInventory}
            onSelectInventory={(inventoryId, productVariantId, quantity) => {
              toast({
                title: "功能提示",
                description: "庫存調整功能可以透過右上角的「新增入庫」來實現",
              })
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
} 