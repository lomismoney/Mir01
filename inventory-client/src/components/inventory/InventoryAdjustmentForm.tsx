"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useInventoryAdjustment, useStores, useProductVariants } from "@/hooks/queries/useEntityQueries"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface AdjustmentFormValues {
  storeId: string;
  productVariantId: string;
  action: 'add' | 'reduce' | 'set';
  quantity: string;
  notes: string;
}

interface InventoryAdjustmentFormProps {
  productVariantId: number;
  storeId?: number;
  currentQuantity: number;
  onSuccess?: () => void;
}

export function InventoryAdjustmentForm({
  productVariantId,
  storeId,
  currentQuantity,
  onSuccess,
}: InventoryAdjustmentFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProductVariantId, setSelectedProductVariantId] = useState<number>(productVariantId)
  const isNewProduct = productVariantId === 0

  // 獲取門市列表
  const { data: storesData, isLoading: isLoadingStores } = useStores()

  // 獲取商品變體列表，當需要選擇產品時
  const { data: productsData, isLoading: isLoadingProducts } = useProductVariants({})

  const form = useForm<AdjustmentFormValues>({
    defaultValues: {
      storeId: storeId ? storeId.toString() : "",
      productVariantId: isNewProduct ? "" : productVariantId.toString(),
      action: 'add',
      quantity: '',
      notes: '',
    },
  })

  // 更新表單當產品ID變化時
  useEffect(() => {
    if (productVariantId > 0) {
      setSelectedProductVariantId(productVariantId)
    }
  }, [productVariantId])

  const adjustmentMutation = useInventoryAdjustment()

  const onSubmit = (data: AdjustmentFormValues) => {
    setIsSubmitting(true)
    
    // 驗證門市 ID
    if (!data.storeId || parseInt(data.storeId) <= 0) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請選擇門市",
      })
      setIsSubmitting(false)
      return
    }
    
    const finalProductVariantId = isNewProduct 
      ? parseInt(data.productVariantId)
      : selectedProductVariantId
    
    // 驗證產品 ID
    if (finalProductVariantId <= 0 || isNaN(finalProductVariantId)) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "請選擇有效的產品",
      })
      setIsSubmitting(false)
      return
    }
    
    // 轉換值為適當的類型
    adjustmentMutation.mutate({
      product_variant_id: finalProductVariantId,
      store_id: parseInt(data.storeId),
      action: data.action,
      quantity: parseInt(data.quantity),
      notes: data.notes,
    }, {
      onSuccess: () => {
        toast({
          title: "成功",
          description: isNewProduct ? "新增庫存成功" : "庫存調整已完成",
        })
        queryClient.invalidateQueries({ queryKey: ["inventory"] })
        form.reset()
        setIsSubmitting(false)
        if (onSuccess) onSuccess()
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: `庫存調整失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
        })
        setIsSubmitting(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentQuantity > 0 ? "調整庫存" : "新增庫存"}</CardTitle>
        <CardDescription>
          {currentQuantity > 0 ? `當前庫存: ${currentQuantity} 件` : "添加產品到庫存中"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>選擇門市</FormLabel>
                  <Select 
                    disabled={isLoadingStores || isSubmitting} 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇入庫門市" />
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

            {isNewProduct && (
              <FormField
                control={form.control}
                name="productVariantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>選擇產品</FormLabel>
                    <Select 
                      disabled={isLoadingProducts || isSubmitting} 
                      onValueChange={(value) => {
                        field.onChange(value)
                        setSelectedProductVariantId(parseInt(value))
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇產品" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsData?.data?.map((variant) => (
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
            )}

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>調整方式</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="add" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          增加庫存
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="reduce" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          減少庫存
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="set" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          設定為特定數量
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                      placeholder="輸入此次調整的原因或備註（選填）" 
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
                {isNewProduct ? "新增庫存" : "確認調整"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 