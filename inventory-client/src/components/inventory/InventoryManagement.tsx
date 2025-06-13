"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useInventoryList, useStores } from "@/hooks/useApi"
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>庫存管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <Label htmlFor="store-select">選擇門市</Label>
              <Select
                disabled={isLoadingStores}
                value={selectedStoreId?.toString() || "all"}
                onValueChange={(value) => setSelectedStoreId(value === "all" ? undefined : Number(value))}
              >
                <SelectTrigger id="store-select">
                  <SelectValue placeholder="所有分店" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分店</SelectItem>
                  {storesData?.data?.map((store) => (
                    <SelectItem key={store.id} value={store.id?.toString() || ''}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-2/3">
              <Label htmlFor="search">搜尋產品</Label>
              <div className="flex w-full items-center space-x-2">
                <Input
                  id="search"
                  placeholder="輸入產品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  onClick={() => refetchInventory()}
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">搜尋</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                  >
                    <RefreshIcon className="h-4 w-4" />
                    <span className="sr-only">重新整理</span>
                  </Button>
                  <InventoryAdjustmentDialog
                    onSuccess={handleInventoryUpdateSuccess}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="low-stock"
                checked={showLowStock}
                onCheckedChange={(checked) =>
                  setShowLowStock(checked === true)
                }
              />
              <Label htmlFor="low-stock">顯示低庫存</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="out-of-stock"
                checked={showOutOfStock}
                onCheckedChange={(checked) =>
                  setShowOutOfStock(checked === true)
                }
              />
              <Label htmlFor="out-of-stock">顯示缺貨</Label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <InventoryListTable
            data={inventoryData?.data || []}
            isLoading={isLoadingInventory}
            onSelectInventory={(inventoryId, productVariantId, quantity) => {
              // 保留原有的調整庫存功能，這裡可以擴展為另一個對話框
              toast({
                title: "功能提示",
                description: "庫存調整功能可以透過新增入庫來實現",
              })
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
} 