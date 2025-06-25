"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCreateInventoryTransfer,
  useStores,
} from "@/hooks/queries/useEntityQueries";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight } from "lucide-react";
import { ProductSelector } from "./ProductSelector";

interface TransferFormValues {
  from_store_id: string;
  to_store_id: string;
  product_variant_id: number;
  quantity: string;
  notes: string;
  status: string;
}

interface InventoryTransferFormProps {
  onSuccess?: () => void;
}

export function InventoryTransferForm({
  onSuccess,
}: InventoryTransferFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentStock, setCurrentStock] = useState<number>(0);

  const form = useForm<TransferFormValues>({
    defaultValues: {
      from_store_id: "",
      to_store_id: "",
      product_variant_id: 0,
      quantity: "",
      notes: "",
      status: "pending", // 預設為待處理
    },
  });

  const { data: storesData, isLoading: isLoadingStores } = useStores();

  const transferMutation = useCreateInventoryTransfer();

  const onSubmit = (data: TransferFormValues) => {
    // 驗證
    if (data.from_store_id === data.to_store_id) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: "來源門市與目標門市不能相同",
      });
      return;
    }

    const quantity = parseInt(data.quantity, 10);
    if (quantity > currentStock) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: `轉移數量不能超過現有庫存 ${currentStock} 件`,
      });
      return;
    }

    if (currentStock === 0) {
      toast({
        variant: "destructive",
        title: "驗證錯誤",
        description: "來源門市庫存不足，無法進行轉移",
      });
      return;
    }

    setIsSubmitting(true);

    // 轉換值為適當的類型
    transferMutation.mutate(
      {
        from_store_id: parseInt(data.from_store_id),
        to_store_id: parseInt(data.to_store_id),
        product_variant_id: data.product_variant_id,
        quantity: quantity,
        notes: data.notes,
        status: data.status,
      },
      {
        onSuccess: () => {
          toast({
            title: "成功",
            description: "庫存轉移已創建",
          });
          queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] });
          form.reset();
          setIsSubmitting(false);
          onSuccess?.();
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: `創建庫存轉移失敗: ${error instanceof Error ? error.message : "未知錯誤"}`,
          });
          setIsSubmitting(false);
        },
      },
    );
  };

  return (
    <Form {...form} data-oid="w-c-1vj">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        data-oid="1biukix"
      >
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-oid="20k9s7h"
        >
          <FormField
            control={form.control}
            name="from_store_id"
            render={({ field }) => (
              <FormItem data-oid="x-llag7">
                <FormLabel data-oid="x7o1_i5">來源門市</FormLabel>
                <Select
                  disabled={isLoadingStores || isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // 重置商品選擇和庫存信息
                    form.setValue("product_variant_id", 0);
                    // 重置目標門市如果與來源門市相同
                    if (form.watch("to_store_id") === value) {
                      form.setValue("to_store_id", "");
                    }
                    setSelectedVariant(null);
                    setCurrentStock(0);
                  }}
                  value={field.value}
                  data-oid="tsl2gfy"
                >
                  <FormControl data-oid="lucxizr">
                    <SelectTrigger data-oid="fu0_05u">
                      <SelectValue
                        placeholder="選擇來源門市"
                        data-oid="1qb:uz."
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent data-oid=".0hlweu">
                    {storesData?.data?.map((store) => (
                      <SelectItem
                        key={store.id}
                        value={store.id?.toString() || ""}
                        data-oid="rcfsk70"
                      >
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage data-oid="dldu40d" />
              </FormItem>
            )}
            data-oid="bxbk.1s"
          />

          <div className="flex items-center justify-center" data-oid="0vk_-n:">
            <ArrowRight
              className="h-6 w-6 text-muted-foreground"
              data-oid="gpfvtv."
            />
          </div>

          <FormField
            control={form.control}
            name="to_store_id"
            render={({ field }) => (
              <FormItem data-oid="wbkf0co">
                <FormLabel data-oid="zdgzhgs">目標門市</FormLabel>
                <Select
                  disabled={isLoadingStores || isSubmitting}
                  onValueChange={field.onChange}
                  value={field.value}
                  data-oid="1o:m1y1"
                >
                  <FormControl data-oid="jx4invu">
                    <SelectTrigger data-oid="823k5l_">
                      <SelectValue
                        placeholder="選擇目標門市"
                        data-oid="9c:ghk7"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent data-oid="6dlgpn0">
                    {storesData?.data
                      ?.filter(
                        (store) =>
                          store.id?.toString() !== form.watch("from_store_id"),
                      )
                      ?.map((store) => (
                        <SelectItem
                          key={store.id}
                          value={store.id?.toString() || ""}
                          data-oid="luoa7a:"
                        >
                          {store.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage data-oid="vkws.r." />
              </FormItem>
            )}
            data-oid="114zywu"
          />
        </div>

        <FormField
          control={form.control}
          name="product_variant_id"
          render={({ field }) => (
            <FormItem data-oid="5zvgq5h">
              <FormLabel data-oid="y0twe.6">產品</FormLabel>
              <FormControl data-oid="f3hwn57">
                <ProductSelector
                  value={field.value}
                  onValueChange={(productVariantId, variant) => {
                    field.onChange(productVariantId);
                    setSelectedVariant(variant);

                    // 獲取來源門市 ID
                    const fromStoreIdStr = form.watch("from_store_id");
                    if (
                      fromStoreIdStr &&
                      variant?.inventory &&
                      Array.isArray(variant.inventory)
                    ) {
                      const fromStoreId = parseInt(fromStoreIdStr);
                      // Debugging log removed: fromStoreId and variant inventory

                      const inventory = variant.inventory.find((inv: any) => {
                        // Debugging log removed: comparing store_id with fromStoreId
                        return inv.store_id === fromStoreId;
                      });

                      const stockQuantity = inventory?.quantity || 0;
                      // Debugging log removed: found inventory and stock quantity
                      setCurrentStock(stockQuantity);
                    } else {
                      // Debugging log removed: no store selected or no inventory data
                      setCurrentStock(0);
                    }
                  }}
                  storeId={
                    form.watch("from_store_id")
                      ? parseInt(form.watch("from_store_id"))
                      : undefined
                  }
                  disabled={isSubmitting || !form.watch("from_store_id")}
                  placeholder="先選擇來源門市，再選擇產品"
                  showCurrentStock={true}
                  data-oid="jdxf4b-"
                />
              </FormControl>
              <FormDescription data-oid="x4od3vz">
                {!form.watch("from_store_id")
                  ? "請先選擇來源門市"
                  : selectedVariant && currentStock === 0
                    ? "所選商品在來源門市無庫存"
                    : selectedVariant && currentStock > 0
                      ? `可轉移數量：${currentStock} 件`
                      : "請選擇要轉移的商品"}
              </FormDescription>
              <FormMessage data-oid="6qb5fdq" />
            </FormItem>
          )}
          data-oid=":345xwl"
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem data-oid="59f958e">
              <FormLabel data-oid="0y-kh61">轉移數量</FormLabel>
              <FormControl data-oid="tm:jlzo">
                <Input
                  {...field}
                  type="number"
                  min="1"
                  max={currentStock > 0 ? currentStock : undefined}
                  disabled={isSubmitting || !selectedVariant}
                  placeholder={
                    selectedVariant
                      ? `最多可轉移 ${currentStock} 件`
                      : "請先選擇商品"
                  }
                  data-oid="5c:gw8u"
                />
              </FormControl>
              <FormDescription data-oid="rkvia5b">
                {selectedVariant && currentStock > 0
                  ? `來源門市現有庫存：${currentStock} 件`
                  : selectedVariant && currentStock === 0
                    ? "來源門市庫存不足，無法轉移"
                    : "請先選擇商品與來源門市"}
              </FormDescription>
              <FormMessage data-oid="_vdtff-" />
            </FormItem>
          )}
          data-oid="3pyqqny"
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem data-oid="g8gay20">
              <FormLabel data-oid="2pqfroh">初始狀態</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                data-oid="hz944s6"
              >
                <FormControl data-oid=":v:s9ja">
                  <SelectTrigger data-oid="vm7dqc4">
                    <SelectValue
                      placeholder="選擇初始狀態"
                      data-oid="wyd9rwl"
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent data-oid="0bxg61j">
                  <SelectItem value="pending" data-oid="6l_w_gw">
                    待處理
                  </SelectItem>
                  <SelectItem value="in_transit" data-oid="sskk.we">
                    運送中
                  </SelectItem>
                  <SelectItem value="completed" data-oid="z_.0e1a">
                    已完成
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription data-oid="oh6visc">
                設定為「已完成」會立即執行庫存轉移操作
              </FormDescription>
              <FormMessage data-oid="ju02gew" />
            </FormItem>
          )}
          data-oid="d3z:oq9"
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem data-oid="ylq3xi3">
              <FormLabel data-oid="q7clx16">備註</FormLabel>
              <FormControl data-oid="6f53l1k">
                <Textarea
                  {...field}
                  placeholder="輸入此次轉移的備註資訊（選填）"
                  disabled={isSubmitting}
                  data-oid="10mn__4"
                />
              </FormControl>
              <FormMessage data-oid="9deuzvt" />
            </FormItem>
          )}
          data-oid="0-:_o9m"
        />

        <div className="flex justify-end" data-oid="b4gcn9m">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedVariant ||
              currentStock === 0 ||
              form.watch("from_store_id") === form.watch("to_store_id")
            }
            data-oid="bfkdgxs"
          >
            {isSubmitting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                data-oid="e2rvuix"
              />
            )}
            創建轉移
          </Button>
        </div>
      </form>
    </Form>
  );
}
