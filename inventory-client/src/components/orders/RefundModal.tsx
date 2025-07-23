"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { useOrderDetail } from "@/hooks";
import { ProcessedOrder } from "@/types/api-helpers";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 導入重構後的hooks
import { useRefundForm } from "./refund-modal/hooks/useRefundForm";
import { useRefundCalculations } from "./refund-modal/hooks/useRefundCalculations";
import { useRefundItems } from "./refund-modal/hooks/useRefundItems";
import { useRefundSubmission } from "./refund-modal/hooks/useRefundSubmission";

// 導入重構後的組件
import { RefundItemsTable } from "./refund-modal/components/RefundItemsTable";
import { RefundInfoForm } from "./refund-modal/components/RefundInfoForm";
import { RefundSummary } from "./refund-modal/components/RefundSummary";
import { RefundModalStates } from "./refund-modal/components/RefundModalStates";
import { formatPrice } from "@/lib/utils";
import { MoneyHelper } from "@/lib/money-helper";

/**
 * RefundModal Props 介面
 */
interface RefundModalProps {
  order: ProcessedOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * RefundModal 組件 - 重構後的退款處理系統
 * 
 * 簡化後的架構：
 * - 使用自定義hooks管理狀態和邏輯
 * - 分離UI組件提高可讀性
 * - 保持所有原有功能和UI呈現
 */
export default function RefundModal({
  order,
  open,
  onOpenChange,
}: RefundModalProps) {
  // 獲取完整的訂單詳情
  const { data: orderDetail, isLoading: isLoadingDetail } = useOrderDetail(
    open && order ? order.id : null,
  );

  const fullOrder = orderDetail || order;

  // 使用重構後的hooks
  const { form, fields, update } = useRefundForm({ open, fullOrder });
  
  const watchedItems = form.watch("items");
  
  const { 
    totalRefundAmount, 
    selectedItemsCount, 
    totalRefundQuantity, 
    refundPercentage 
  } = useRefundCalculations({ 
    watchedItems, 
    orderTotal: fullOrder?.grand_total || 0 
  });

  const {
    handleItemSelect,
    handleQuantityChange,
    handleSelectAll,
    isAllSelected,
  } = useRefundItems({ fields, update });

  const { handleSubmit, isSubmitting } = useRefundSubmission({
    fullOrder,
    onOpenChange,
    form,
  });

  // 處理載入和空狀態 - 簡化條件渲染
  if (!order || isLoadingDetail) {
    return (
      <RefundModalStates
        open={open}
        onOpenChange={onOpenChange}
        orderNumber={order?.order_number}
        type="loading"
      />
    );
  }

  if (!fullOrder?.items?.length) {
    return (
      <RefundModalStates
        open={open}
        onOpenChange={onOpenChange}
        orderNumber={fullOrder?.order_number || order?.order_number}
        type="no-items"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-destructive" />
            處理訂單退款
          </DialogTitle>
          <DialogDescription>
            訂單編號: {fullOrder.order_number} | 客戶: {fullOrder.customer?.name}
          </DialogDescription>
        </DialogHeader>

        {/* 核心：雙欄式佈局 */}
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-1 overflow-hidden"
        >
          <div className="grid md:grid-cols-3 gap-6 h-full overflow-y-auto pr-2">
            {/* 左欄：操作區 (佔 2/3) */}
            <div className="md:col-span-2 space-y-6">
              <RefundItemsTable
                form={form}
                fields={fields}
                watchedItems={watchedItems}
                onItemSelect={handleItemSelect}
                onQuantityChange={handleQuantityChange}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelected}
              />

              <RefundInfoForm form={form} />
            </div>

            {/* 右欄：資訊區 (佔 1/3) */}
            <div className="space-y-6">
              <RefundSummary
                orderTotal={fullOrder.grand_total}
                paidAmount={fullOrder.paid_amount}
                totalRefundAmount={totalRefundAmount}
                selectedItemsCount={selectedItemsCount}
                totalRefundQuantity={totalRefundQuantity}
                refundPercentage={refundPercentage}
              />
            </div>
          </div>

          {/* 底部操作按鈕 */}
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={selectedItemsCount === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  處理中...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  確認退款 {MoneyHelper.format(totalRefundAmount, '$')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 工具函數：格式化金額顯示 - 使用統一的 formatPrice 函式
 */
export function formatCurrency(amount: number): string {
  return formatPrice(amount);
}