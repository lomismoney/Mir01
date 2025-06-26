"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCustomerDetail,
  useUpdateCustomer,
} from "@/hooks/queries/useEntityQueries";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/**
 * 客戶編輯頁面表單骨架屏組件
 *
 * 🎨 功能：在客戶數據載入期間提供視覺回饋
 * 用於模擬表單的載入狀態，提升用戶體驗
 */
const FormSkeleton = () => (
  <div className="space-y-8" data-oid="6dt.6uo">
    {/* 客戶名稱字段骨架 */}
    <div className="space-y-2" data-oid="rqd1r26">
      <Skeleton className="h-4 w-1/4" data-oid="i9jtzy:" />
      <Skeleton className="h-10 w-full" data-oid="n11n_kn" />
    </div>

    {/* 聯絡電話字段骨架 */}
    <div className="space-y-2" data-oid="1_1:om4">
      <Skeleton className="h-4 w-1/4" data-oid="j2:jbr8" />
      <Skeleton className="h-10 w-full" data-oid="kn_1dab" />
    </div>

    {/* 其他字段骨架 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-oid="n_.qrpq">
      <div className="space-y-2" data-oid="ljjifaj">
        <Skeleton className="h-4 w-1/3" data-oid="ryrt4oc" />
        <Skeleton className="h-10 w-full" data-oid=".fw2bpy" />
      </div>
      <div className="space-y-2" data-oid="m5-d0i1">
        <Skeleton className="h-4 w-1/3" data-oid="xd5mgo." />
        <Skeleton className="h-10 w-full" data-oid="pazv49c" />
      </div>
    </div>

    {/* 地址管理區塊骨架 */}
    <div className="space-y-4" data-oid="um0iq46">
      <Skeleton className="h-6 w-1/3" data-oid="y:rq5l8" />
      <div className="space-y-2" data-oid="g2yapo7">
        <Skeleton className="h-4 w-1/4" data-oid="kqc.b6w" />
        <Skeleton className="h-10 w-full" data-oid="8wwcg1x" />
      </div>
    </div>

    {/* 提交按鈕骨架 */}
    <Skeleton className="h-10 w-32" data-oid="tm0p7ay" />
  </div>
);

/**
 * 客戶編輯頁面主組件
 *
 * 🎯 戰術功能：作為編輯流程的協調者和容器
 *
 * 核心職責：
 * 1. 從 URL 參數中提取客戶 ID
 * 2. 協調數據獲取 (useCustomerDetail) 與數據更新 (useUpdateCustomer)
 * 3. 管理載入狀態、錯誤狀態和成功狀態
 * 4. 將數據和邏輯注入到通用的 CustomerForm 組件
 * 5. 處理導航和用戶回饋
 *
 * 設計模式：協調者模式 (Coordinator Pattern)
 * - 頁面組件不直接處理 UI 邏輯，而是協調各個 Hook 和組件
 * - 實現了關注點分離：數據層、邏輯層、展示層各司其職
 */
export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = Number(params.id);

  // 🔍 數據獲取：使用 useCustomerDetail 獲取客戶完整資料
  const {
    data: customerResponse,
    isLoading: isLoadingCustomer,
    isError,
    error,
  } = useCustomerDetail(customerId);

  // ✏️ 數據更新：使用 useUpdateCustomer 準備更新邏輯
  const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  /**
   * 表單提交處理函數
   *
   * @param values - 表單數據，包含客戶基本資訊和地址列表
   */
  const handleUpdateSubmit = (values: any) => {
    updateCustomer(
      { id: customerId, data: values },
      {
        onSuccess: () => {
          // 🎯 成功後的導航策略：返回客戶列表頁
          router.push("/customers");

          // 🔔 額外的成功通知（雙重回饋保險）
          toast.success("客戶資料已成功更新", {
            description: `客戶「${values.name}」的資料已同步至系統`,
          });
        },
        onError: (error) => {
          // 🔴 錯誤處理已在 useUpdateCustomer 中統一處理
          // 這裡可以添加頁面特定的錯誤邏輯（如果需要）
          console.error("編輯頁面：更新失敗", error);
        },
      },
    );
  };

  // 🔄 載入狀態：顯示表單骨架屏
  if (isLoadingCustomer) {
    return (
      <div className="space-y-6" data-oid="etsvtel">
        <div data-oid="bc-79pn">
          <Skeleton className="h-8 w-1/3" data-oid="iehm_sg" />
          <Skeleton className="h-4 w-2/3 mt-2" data-oid="57vx7dr" />
        </div>
        <FormSkeleton data-oid="fr-lwuy" />
      </div>
    );
  }

  // ❌ 錯誤狀態：顯示友善的錯誤訊息
  if (isError) {
    return (
      <div className="space-y-6" data-oid="ar40xhk">
        <div data-oid="-lfnm8y">
          <h2
            className="text-2xl font-bold text-destructive"
            data-oid="hvkwnr8"
          >
            載入失敗
          </h2>
          <p className="text-muted-foreground" data-oid="q5j6-n5">
            無法載入客戶資料，請檢查網路連線或稍後再試。
          </p>
        </div>
        <div
          className="p-4 border border-destructive/20 rounded-md bg-destructive/5"
          data-oid="y579mt3"
        >
          <p className="text-sm text-destructive" data-oid="-fdhxic">
            錯誤詳情：{error?.message || "未知錯誤"}
          </p>
        </div>
        <div className="flex gap-2" data-oid=".05iqbw">
          <button
            onClick={() => router.push("/customers")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            data-oid="b0o9d9d"
          >
            返回客戶列表
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            data-oid="0wz-yz:"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // ✅ 正常狀態：渲染編輯表單
  return (
    <div className="space-y-6" data-oid="emx8pv9">
      {/* 📋 頁面標題與描述 */}
      <div data-oid="qk_-mc6">
        <h2 className="text-2xl font-bold" data-oid="d-r7ime">
          編輯客戶
        </h2>
        <p className="text-muted-foreground" data-oid="alo455h">
          修改客戶「{customerResponse?.data?.name}」的詳細資料。
        </p>
      </div>

      {/* 🎨 表單組件：組件複用的終極體現 */}
      <CustomerForm
        initialData={customerResponse?.data}
        isSubmitting={isUpdating}
        onSubmit={handleUpdateSubmit}
        data-oid="l1bksa_"
      />
    </div>
  );
}
