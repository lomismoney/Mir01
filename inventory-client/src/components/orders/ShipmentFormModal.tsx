"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateOrderShipment } from "@/hooks";
import { toast } from "sonner";

/**
 * 出貨表單 Zod 驗證 Schema
 *
 * 定義出貨資訊的驗證規則，確保數據完整性
 */
const shipmentFormSchema = z.object({
  carrier: z.string().min(1, "物流公司為必填項目"),
  tracking_number: z.string().min(1, "追蹤單號為必填項目"),
});

/**
 * 表單數據類型定義
 */
type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;

/**
 * 元件 Props 介面定義
 *
 * @param orderId - 要建立出貨記錄的訂單 ID
 * @param open - 控制 Modal 開關狀態
 * @param onOpenChange - 當 Modal 開關狀態改變時的回調函數
 */
interface ShipmentFormModalProps {
  orderId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 出貨表單模態元件
 *
 * 功能說明：
 * 1. 提供物流公司和追蹤單號的輸入介面
 * 2. 使用 Zod 進行表單驗證
 * 3. 整合 useCreateOrderShipment hook 處理出貨API調用
 * 4. 提供完整的成功/錯誤回饋機制
 * 5. 自動關閉並重置表單狀態
 *
 * @param props - 元件屬性
 * @returns 出貨表單模態元件
 */
export function ShipmentFormModal({
  orderId,
  open,
  onOpenChange,
}: ShipmentFormModalProps) {
  // 🎯 調用出貨建立的 mutation hook
  const createShipment = useCreateOrderShipment();

  // 🎯 初始化 react-hook-form，整合 Zod 驗證
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      carrier: "",
      tracking_number: "",
    },
  });

  /**
   * 表單提交處理函數
   *
   * @param values - 經過驗證的表單數據
   */
  const handleSubmit = (values: ShipmentFormValues) => {
    // 🚀 調用 mutation，傳遞正確的參數結構
    createShipment.mutate(
      {
        orderId: orderId,
        data: {
          carrier: values.carrier,
          tracking_number: values.tracking_number,
        },
      },
      {
        onSuccess: () => {
          // 🎉 成功時的處理邏輯
          toast.success("出貨資訊已建立", {
            description: `追蹤單號：${values.tracking_number}`,
          });

          // 🔄 重置表單狀態
          form.reset();

          // 🚪 關閉 Modal
          onOpenChange(false);
        },
        onError: (error) => {
          // 🚨 錯誤時的處理邏輯
          toast.error("建立出貨資訊失敗", {
            description: error.message || "請檢查網路連接後重試",
          });
        },
      },
    );
  };

  /**
   * Modal 關閉處理函數
   * 確保關閉時重置表單狀態
   */
  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} data-oid="mpbjo-4">
      <DialogContent className="sm:max-w-md" data-oid="qc--ll4">
        <DialogHeader data-oid="e77lkqq">
          <DialogTitle data-oid="sr0y4m0">建立出貨資訊</DialogTitle>
        </DialogHeader>

        <Form {...form} data-oid="nc1.fkf">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            data-oid="lzdr25d"
          >
            {/* 物流公司欄位 */}
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem data-oid="j2:7:5r">
                  <FormLabel data-oid="99enhuq">物流公司</FormLabel>
                  <FormControl data-oid="uvnhrv-">
                    <Input
                      placeholder="請輸入物流公司名稱（如：黑貓宅急便、新竹貨運）"
                      {...field}
                      data-oid="ha5akqv"
                    />
                  </FormControl>
                  <FormMessage data-oid="7qjawuz" />
                </FormItem>
              )}
              data-oid="aa23_g-"
            />

            {/* 追蹤單號欄位 */}
            <FormField
              control={form.control}
              name="tracking_number"
              render={({ field }) => (
                <FormItem data-oid="03ct5t2">
                  <FormLabel data-oid="y-oxyta">追蹤單號</FormLabel>
                  <FormControl data-oid="-7rz.n3">
                    <Input
                      placeholder="請輸入追蹤單號"
                      {...field}
                      data-oid="t8yvjdx"
                    />
                  </FormControl>
                  <FormMessage data-oid="b0:gcg0" />
                </FormItem>
              )}
              data-oid="hb5afsq"
            />

            {/* 表單操作按鈕 */}
            <DialogFooter className="gap-2" data-oid="ocldaol">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createShipment.isPending}
                data-oid="ge_u1ez"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createShipment.isPending}
                data-oid="j0dakvo"
              >
                {createShipment.isPending ? "建立中..." : "建立出貨"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
