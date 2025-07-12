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
import { useCreateOrderShipment, useErrorHandler } from "@/hooks";

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
  const { handleError, handleSuccess } = useErrorHandler();

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
          handleSuccess(`出貨資訊已建立 - 追蹤單號：${values.tracking_number}`);

          // 🔄 重置表單狀態
          form.reset();

          // 🚪 關閉 Modal
          onOpenChange(false);
        },
        onError: (error) => handleError(error),
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>建立出貨資訊</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
           
          >
            {/* 物流公司欄位 */}
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>物流公司</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="請輸入物流公司名稱（如：黑貓宅急便、新竹貨運）"
                      {...field}
                     
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
             
            />

            {/* 追蹤單號欄位 */}
            <FormField
              control={form.control}
              name="tracking_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>追蹤單號</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="請輸入追蹤單號"
                      {...field}
                     
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
             
            />

            {/* 表單操作按鈕 */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createShipment.isPending}
               
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createShipment.isPending}
               
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
