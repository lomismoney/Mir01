"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCreateInventoryTransfer, useStores, useProductVariants } from "@/hooks/queries/useEntityQueries"
import { Store } from "@/types/store"
import { ProductVariant } from "@/types/api-helpers"
import { PaginatedResponse } from "@/types/inventory"
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

interface TransferFormValues {
  from_store_id: string;
  to_store_id: string;
  product_variant_id: string;
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

  const form = useForm<TransferFormValues>({
    defaultValues: {
      from_store_id: "",
      to_store_id: "",
      product_variant_id: "",
      quantity: "",
      notes: "",
    },
  })

  const { data: storesData, isLoading: isLoadingStores } = useStores()
  const { data: productsData, isLoading: isLoadingProducts } = useProductVariants()

  const transferMutation = useCreateInventoryTransfer()

  const onSubmit = (data: TransferFormValues) => {
    setIsSubmitting(true)
    
    // 轉換值為適當的類型
    transferMutation.mutate({
      from_store_id: parseInt(data.from_store_id),
      to_store_id: parseInt(data.to_store_id),
      product_variant_id: parseInt(data.product_variant_id),
      quantity: parseInt(data.quantity),
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
                      onValueChange={field.onChange} 
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
            </div>

            <FormField
              control={form.control}
              name="product_variant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>產品</FormLabel>
                  <Select 
                    disabled={isLoadingProducts || isSubmitting} 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇產品" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {productsData?.data?.map((variant: ProductVariant) => (
                        <SelectItem key={variant.id} value={variant.id?.toString() || ''}>
                          {variant.product?.name} - {variant.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>數量</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1" 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    請輸入大於 0 的正整數
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                創建轉移
              </Button>
            </div>
          </form>
        </Form>
  )
} 