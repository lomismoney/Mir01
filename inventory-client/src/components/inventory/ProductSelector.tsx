"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, ChevronDown, Search, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useProducts, useProductVariants } from "@/hooks/queries/useEntityQueries"
import { useSession } from "next-auth/react"

interface ProductSelectorProps {
  value?: number // 選中的 product_variant_id
  onValueChange?: (productVariantId: number, productVariant?: any) => void
  placeholder?: string
  disabled?: boolean
  showCurrentStock?: boolean // 是否顯示當前庫存
  storeId?: number // 如果傳入，會顯示該門市的庫存量
}

export function ProductSelector({
  value,
  onValueChange,
  placeholder = "搜尋並選擇商品",
  disabled = false,
  showCurrentStock = false,
  storeId,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const { status: sessionStatus } = useSession()
  interface ProductVariant {
    id?: number // Allow id to be optional to match API response
    sku?: string
    price?: string // Allow price to be string and optional, to match API and parse later
    product_id?: number
    created_at?: string
    updated_at?: string
    product?: {
      id: number
      name: string
      description?: string
    }
    attribute_values?: Array<{
      attribute?: { name?: string }
      value?: string
    }>
    inventory?: Array<{
      store_id?: number
      quantity?: number
      store?: { name?: string }
    }> | {
      quantity?: number
      store?: { name?: string }
    }
  }

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  // 獲取商品列表（支援搜尋）
  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useProducts({
    product_name: searchTerm,
  })



  // 獲取選中商品的變體列表
  const { data: variants = [], isLoading: isLoadingVariants, error: variantsError } = useProductVariants(
    selectedProductId ? { product_id: selectedProductId } : {},
    { enabled: !!selectedProductId }
  )

  // 當 selectedProductId 變化時，立即清除之前的變體選擇
  useEffect(() => {
    if (selectedProductId) {
      setSelectedVariant(null);
      // 清除選擇，但不調用回調避免無限循環
    }
  }, [selectedProductId]);

  // 找到當前選中的變體
  useEffect(() => {
    if (value && variants.length > 0) {
      const variant = variants.find((v: any) => v.id === value)
      if (variant) {
        // 確保變體屬於當前選中的商品
        if (variant.product_id === selectedProductId) {
          setSelectedVariant({
              id: variant.id,
              sku: variant.sku,
              price: variant.price?.toString(),
              product_id: variant.product_id,
              created_at: variant.created_at,
              updated_at: variant.updated_at,
              product: variant.product ? {
                  id: variant.product.id!,
                  name: variant.product.name!,
                  description: variant.product.description
              } : undefined,
              attribute_values: variant.attribute_values,
              inventory: variant.inventory
          })
          setSelectedProductId(variant.product_id || null)
                 } else {
           // 如果變體不屬於當前商品，清除選擇
           setSelectedVariant(null);
           setSelectedProductId(null);
           onValueChange?.(0);
         }
      }
    } else if (value === 0 || !value) {
      // 如果 value 為 0 或空，清除選擇
      setSelectedVariant(null);
    }
  }, [value, variants, selectedProductId])

  // 處理商品選擇
  const handleProductSelect = (productId: number) => {
    // 只有當選擇不同商品時才清除變體選擇
    if (productId !== selectedProductId) {
      setSelectedProductId(productId)
      setSelectedVariant(null)
      // 清除當前選擇的變體
      onValueChange?.(0)
    }
  }

  // 處理變體選擇
  const handleVariantSelect = (variant: any) => {
    // 確保變體屬於當前選中的商品
    if (variant.product_id === selectedProductId) {
      setSelectedVariant(variant)
      onValueChange?.(variant.id, variant)
      setOpen(false)
    }
  }

  // 重置選擇
  const handleReset = () => {
    setSelectedProductId(null)
    setSelectedVariant(null)
    onValueChange?.(0)
  }

  // 格式化顯示文字
  const getDisplayText = () => {
    if (selectedVariant) {
      const productName = selectedVariant.product?.name || "未知商品"
      const sku = selectedVariant.sku || "未知SKU"
      
      // 組合屬性值顯示
      const attributes = selectedVariant.attribute_values
        ?.map((av: any) => av.value)
        .join(" • ") || ""
      
      return `${productName} ${attributes ? `(${attributes})` : ""} - ${sku}`
    }
    return placeholder
  }

  // 獲取庫存資訊顯示
  const getStockInfo = (variant: any) => {
    if (!showCurrentStock || !variant.inventory) return null
    
    if (Array.isArray(variant.inventory)) {
      if (storeId) {
        // 如果指定了門市，只顯示該門市的庫存
        const inventory = variant.inventory.find((inv: any) => inv.store_id === storeId)
        if (!inventory) return (
          <div className="text-xs text-muted-foreground">
            此門市無庫存
          </div>
        )
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>庫存: {inventory.quantity || 0}</span>
            <span>@ {inventory.store?.name || ""}</span>
          </div>
        )
      } else {
        // 如果沒有指定門市，顯示所有門市的庫存總覽
        const totalStock = variant.inventory.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0)
        return (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>總庫存: {totalStock}</div>
            <div className="flex flex-wrap gap-1">
              {variant.inventory.map((inv: any) => (
                <span key={inv.store_id} className="inline-flex items-center gap-1 px-1 py-0.5 bg-muted rounded text-xs">
                  {inv.store?.name}: {inv.quantity || 0}
                </span>
              ))}
            </div>
          </div>
        )
      }
    } else {
      // 向後兼容：如果是單個庫存物件
      const quantity = variant.inventory.quantity || 0
      const storeName = variant.inventory.store?.name || ""
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>庫存: {quantity}</span>
          {storeName && <span>@ {storeName}</span>}
        </div>
      )
    }
  }

  // 過濾只顯示屬於當前選中商品的變體
  const filteredVariants = useMemo(() => {
    if (!selectedProductId) return [];
    return variants.filter((variant: any) => variant.product_id === selectedProductId);
  }, [variants, selectedProductId]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || sessionStatus === "unauthenticated"}
          >
            <span className="truncate">
              {sessionStatus === "unauthenticated" 
                ? "請先登入系統" 
                : getDisplayText()}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="搜尋商品名稱..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[400px] overflow-y-auto">
              <CommandEmpty>
                {isLoadingProducts ? (
                  "載入中..."
                ) : productsError ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-sm text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div className="text-center">
                      {sessionStatus === "unauthenticated" 
                        ? "請先登入系統才能搜尋商品" 
                        : "載入商品失敗，請稍後再試"}
                    </div>
                  </div>
                ) : !productsData || (Array.isArray(productsData) && productsData.length === 0) ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-sm text-muted-foreground">
                    <div className="text-center">
                      {searchTerm 
                        ? `找不到包含「${searchTerm}」的商品` 
                        : "暫無商品資料"}
                    </div>
                    {searchTerm && (
                      <div className="text-xs">
                        請確認商品名稱或嘗試其他關鍵字
                      </div>
                    )}
                  </div>
                ) : (
                  "找不到商品"
                )}
              </CommandEmpty>
              
              {/* 商品列表 */}
              {!selectedProductId && productsData && Array.isArray(productsData) && productsData.length > 0 && (
                <CommandGroup heading="選擇商品">
                  {productsData.map((product: any) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleProductSelect(product.id)}
                      className="flex flex-col items-start gap-1"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground">
                              {product.description}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {product.variants?.length || 0} 個規格
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {/* 變體列表 */}
              {selectedProductId && (
                <CommandGroup heading="選擇規格">
                  <CommandItem
                    onSelect={handleReset}
                    className="text-sm text-muted-foreground border-b"
                  >
                    ← 返回商品選擇
                  </CommandItem>
                  
                  {isLoadingVariants ? (
                    <CommandItem disabled>載入規格中...</CommandItem>
                  ) : variantsError ? (
                    <CommandItem disabled className="text-red-500">
                      載入規格失敗: {variantsError.message}
                    </CommandItem>
                  ) : filteredVariants.length === 0 ? (
                    <CommandItem disabled>
                      此商品暫無規格 (商品ID: {selectedProductId})
                    </CommandItem>
                  ) : (
                    filteredVariants.map((variant: any) => (
                      <CommandItem
                        key={variant.id}
                        onSelect={() => handleVariantSelect(variant)}
                        className="flex flex-col items-start gap-1"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value === variant.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{variant.sku}</span>
                              <span className="text-sm">
                                ${variant.price}
                              </span>
                            </div>
                            {variant.attribute_values && variant.attribute_values.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {variant.attribute_values
                                  .map((av: any) => `${av.attribute?.name}: ${av.value}`)
                                  .join(" • ")}
                              </div>
                            )}
                            {getStockInfo(variant)}
                          </div>
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* 選中的商品資訊顯示 */}
      {selectedVariant && (
        <div className="p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">
                {selectedVariant.product?.name}
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {selectedVariant.sku} • 價格: ${selectedVariant.price}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              清除
            </Button>
          </div>
          {showCurrentStock && getStockInfo(selectedVariant)}
        </div>
      )}
    </div>
  )
}
