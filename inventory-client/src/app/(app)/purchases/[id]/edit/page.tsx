'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { usePurchase, useUpdatePurchase, useStores } from '@/hooks/queries/useEntityQueries'
import { useAppFieldArray } from '@/hooks/useAppFieldArray'
import { 
  PURCHASE_STATUS_LABELS, 
  PURCHASE_STATUS_COLORS, 
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus,
  PURCHASE_STATUS 
} from '@/types/purchase'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { 
  ArrowLeft,
  Save,
  Package,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react'
import { ProductSelector } from '@/components/inventory/ProductSelector'

interface PurchaseEditFormData {
  store_id: string
  order_number: string
  purchased_at: string
  shipping_cost: string
  status: string
  items: {
    id?: number
    product_variant_id: number
    quantity: string
    cost_price: string
  }[]
}

export default function PurchaseEditPage() {
  const params = useParams()
  const router = useRouter()
  const purchaseId = params.id as string

  const { data: purchase, isLoading, error } = usePurchase(purchaseId)
  const { data: storesData } = useStores()
  const updatePurchaseMutation = useUpdatePurchase()

  const form = useForm<PurchaseEditFormData>({
    defaultValues: {
      store_id: '',
      order_number: '',
      purchased_at: '',
      shipping_cost: '0',
      status: PURCHASE_STATUS.PENDING,
      items: []
    }
  })

  const { fields, append, remove } = useAppFieldArray({
    control: form.control,
    name: 'items'
  })

  // 當進貨單數據載入後，更新表單預設值
  useEffect(() => {
    if (purchase) {
      const purchaseData = purchase as any
      form.reset({
        store_id: purchaseData.store_id?.toString() || '',
        order_number: purchaseData.order_number || '',
        purchased_at: purchaseData.purchased_at 
          ? new Date(purchaseData.purchased_at).toISOString().split('T')[0]
          : '',
        shipping_cost: purchaseData.shipping_cost?.toString() || '0',
        status: purchaseData.status || PURCHASE_STATUS.PENDING,
        items: purchaseData.items?.map((item: any) => ({
          id: item.id,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity?.toString() || '0',
          cost_price: item.cost_price?.toString() || '0'
        })) || []
      })
    }
  }, [purchase, form])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !purchase) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">找不到進貨單</h1>
          <p className="text-muted-foreground mb-6">
            進貨單不存在或已被刪除
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    )
  }

  const purchaseData = purchase as any
  const permissions = getPurchasePermissions(purchaseData.status as PurchaseStatus)
  const validStatusTransitions = getValidStatusTransitions(purchaseData.status as PurchaseStatus)

  if (!permissions.canModify) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">無法編輯</h1>
          <p className="text-muted-foreground mb-6">
            進貨單狀態為「{PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}」，無法編輯
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
      </div>
    )
  }

  const onSubmit = (data: PurchaseEditFormData) => {
    // 驗證必填欄位
    if (!data.store_id) {
      toast.error('請選擇門市')
      return
    }

    if (data.items.some(item => !item.product_variant_id)) {
      toast.error('請為所有項目選擇商品')
      return
    }

    // 轉換資料格式
    const updateData = {
      store_id: parseInt(data.store_id),
      order_number: data.order_number,
      purchased_at: data.purchased_at ? `${data.purchased_at}T10:00:00+08:00` : undefined,
      shipping_cost: parseFloat(data.shipping_cost) || 0,
      status: data.status,
      items: data.items.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: parseInt(item.quantity),
        cost_price: parseFloat(item.cost_price)
      }))
    }

    updatePurchaseMutation.mutate(
      { id: purchaseId, data: updateData },
      {
        onSuccess: () => {
          toast.success('進貨單已更新')
          router.push(`/purchases/${purchaseId}`)
        },
        onError: (error) => {
          toast.error(`更新進貨單失敗: ${error.message}`)
        }
      }
    )
  }

  const addItem = () => {
    append({
      product_variant_id: 0,
      quantity: '',
      cost_price: ''
    })
  }

  const calculateTotal = () => {
    const shippingCost = parseFloat(form.watch('shipping_cost')) || 0
    const itemsTotal = form.watch('items').reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0
      const costPrice = parseFloat(item.cost_price) || 0
      return total + (quantity * costPrice)
    }, 0)
    return itemsTotal + shippingCost
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="space-y-6">
        {/* 頁面標題區 */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-600" />
              編輯進貨單
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                {purchaseData.order_number}
              </p>
              <Badge className={PURCHASE_STATUS_COLORS[purchaseData.status as PurchaseStatus]}>
                {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]}
              </Badge>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle>基本資訊</CardTitle>
                <CardDescription>
                  修改進貨單的基本資訊和狀態
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>門市 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇門市" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(storesData as any)?.data?.map((store: any) => (
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

                  <FormField
                    control={form.control}
                    name="order_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>進貨單號 *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="例：PO-20240101-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchased_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>進貨日期</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>運費</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>狀態</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="選擇狀態" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* 顯示當前狀態 */}
                            <SelectItem value={purchaseData.status}>
                              {PURCHASE_STATUS_LABELS[purchaseData.status as PurchaseStatus]} (目前)
                            </SelectItem>
                            {/* 顯示可轉換的狀態 */}
                            {validStatusTransitions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {PURCHASE_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 商品項目 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>商品項目</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    新增商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.key} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">商品 {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.product_variant_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>商品 *</FormLabel>
                            <FormControl>
                              <ProductSelector
                                value={field.value}
                                onValueChange={(variantId, variant) => {
                                  field.onChange(variantId)
                                  if (variant?.price) {
                                    form.setValue(`items.${index}.cost_price`, variant.price.toString())
                                  }
                                }}
                                placeholder="搜尋並選擇商品規格"
                                disabled={updatePurchaseMutation.isPending}
                                showCurrentStock={false}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>數量 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" placeholder="0" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.cost_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>進貨價 *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                {/* 總計顯示 */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">預估總金額</div>
                      <div className="text-lg font-semibold">
                        NT$ {calculateTotal().toLocaleString('zh-TW', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button type="submit" disabled={updatePurchaseMutation.isPending}>
                {updatePurchaseMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                保存變更
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 