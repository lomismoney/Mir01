"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCreateInventoryTransfer, useStores } from "@/hooks/queries/useEntityQueries"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowRight } from "lucide-react"
import { ProductSelector } from "./ProductSelector"

interface TransferFormValues {
  from_store_id: string;
  to_store_id: string;
  product_variant_id: number;
  quantity: string;
  notes: string;
}

interface InventoryTransferFormProps {
  onSuccess?: () => void;
}

export function InventoryTransferForm({ onSuccess }: InventoryTransferFormProps = {}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [currentStock, setCurrentStock] = useState<number>(0)

  const form = useForm<TransferFormValues>({
    defaultValues: {
      from_store_id: "",
      to_store_id: "",
      product_variant_id: 0,
      quantity: "",
      notes: "",
    },
  })

  const { data: storesData, isLoading: isLoadingStores } = useStores()

  const transferMutation = useCreateInventoryTransfer()

  const onSubmit = (data: TransferFormValues) => {
    // 驗證
    if (data.from_store_id === data.to_store_id) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: "來源門市與目標門市不能相同",
      })
      return
    }

    const quantity = parseInt(data.quantity, 10)
    if (quantity > currentStock) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: `轉移數量不能超過現有庫存 ${currentStock} 件`,
      })
      return
    }

    if (currentStock === 0) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: "來源門市庫存不足，無法進行轉移",
      })
      return
    }

    setIsSubmitting(true)
    
    // 轉換值為適當的類型
    transferMutation.mutate({
      from_store_id: parseInt(data.from_store_id),
      to_store_id: parseInt(data.to_store_id),
      product_variant_id: data.product_variant_id,
      quantity: quantity,
      notes: data.notes,
    }, {
      onSuccess: () => {
        toast({
          title: "成功",
          description: "庫存轉移已創建",
        })
        queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })
        form.reset()
        setIsSubmitting(false)
        onSuccess?.()
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: `創建庫存轉移失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        })
        setIsSubmitting(false)
      },
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="from_store_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>來源門市</FormLabel>
                <Select 
                  disabled={isLoadingStores || isSubmitting} 
                      onValueChange={(value) => {
                        field.onChange(value)
                        // 重置商品選擇和庫存信息
                        form.setValue("product_variant_id", 0)
                        // 重置目標門市如果與來源門市相同
                        if (form.watch("to_store_id") === value) {
                          form.setValue("to_store_id", "")
                        }
                        setSelectedVariant(null)
                        setCurrentStock(0)
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇來源門市" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storesData?.data?.map((store) => (
                          <SelectItem key={store.id} value={store.id?.toString() || ''}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <FormField
                control={form.control}
                name="to_store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>目標門市</FormLabel>
                    <Select 
                      disabled={isLoadingStores || isSubmitting} 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇目標門市" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storesData?.data
                          ?.filter((store) => store.id?.toString() !== form.watch("from_store_id"))
                          ?.map((store) => (
                          <SelectItem key={store.id} value={store.id?.toString() || ''}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="product_variant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>產品</FormLabel>
                  <FormControl>
                    <ProductSelector
                      value={field.value}
                      onValueChange={(productVariantId, variant) => {
                        field.onChange(productVariantId)
                        setSelectedVariant(variant)
                        
                        // 獲取來源門市 ID
                        const fromStoreIdStr = form.watch("from_store_id")
                        if (fromStoreIdStr && variant?.inventory && Array.isArray(variant.inventory)) {
                          const fromStoreId = parseInt(fromStoreIdStr)
                          // Debugging log removed: fromStoreId and variant inventory
                          
                          const inventory = variant.inventory.find((inv: any) => {
                            // Debugging log removed: comparing store_id with fromStoreId
                            return inv.store_id === fromStoreId
                          })
                          
                          const stockQuantity = inventory?.quantity || 0
                          // Debugging log removed: found inventory and stock quantity
                          setCurrentStock(stockQuantity)
                        } else {
                          // Debugging log removed: no store selected or no inventory data
                          setCurrentStock(0)
                        }
                      }}
                      storeId={form.watch("from_store_id") ? parseInt(form.watch("from_store_id")) : undefined}
                      disabled={isSubmitting || !form.watch("from_store_id")}
                      placeholder="先選擇來源門市，再選擇產品"
                      showCurrentStock={true}
                    />
                  </FormControl>
                  <FormDescription>
                    {!form.watch("from_store_id") 
                      ? "請先選擇來源門市"
                      : selectedVariant && currentStock === 0
                      ? "所選商品在來源門市無庫存"
                      : selectedVariant && currentStock > 0
                      ? `可轉移數量：${currentStock} 件`
                      : "請選擇要轉移的商品"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>轉移數量</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1" 
                      max={currentStock > 0 ? currentStock : undefined}
                      disabled={isSubmitting || !selectedVariant}
                      placeholder={selectedVariant ? `最多可轉移 ${currentStock} 件` : "請先選擇商品"}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedVariant && currentStock > 0 
                      ? `來源門市現有庫存：${currentStock} 件`
                      : selectedVariant && currentStock === 0
                      ? "來源門市庫存不足，無法轉移"
                      : "請先選擇商品與來源門市"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="輸入此次轉移的備註資訊（選填）" 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={
                  isSubmitting || 
                  !selectedVariant || 
                  currentStock === 0 || 
                  form.watch("from_store_id") === form.watch("to_store_id")
                }
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                創建轉移
              </Button>
            </div>
          </form>
        </Form>
  )
} 