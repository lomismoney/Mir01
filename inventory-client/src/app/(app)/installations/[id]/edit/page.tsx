"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useInstallation, useUpdateInstallation } from "@/hooks/queries/useEntityQueries";
import { InstallationForm, InstallationFormValues } from "@/components/installations";
import { UpdateInstallationRequest } from "@/types/installation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 安裝單編輯頁面
 * 
 * 提供安裝單的編輯功能，包括：
 * - 載入現有安裝單資料
 * - 更新安裝單資訊
 * - 修改安裝項目
 * - 調整安裝排程
 */
export default function EditInstallationPage() {
  const params = useParams();
  const router = useRouter();
  const installationId = parseInt(params.id as string, 10);
  
  const { data: installation, isLoading, isError, error } = useInstallation(installationId);
  const { mutate: updateInstallation, isPending } = useUpdateInstallation();

  if (!installationId || isNaN(installationId)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">錯誤</h2>
        <p className="text-muted-foreground mt-2">無效的安裝單 ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-red-600">載入失敗</h2>
        <p className="text-muted-foreground mt-2">
          無法載入安裝單資料：{error?.message}
        </p>
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">找不到安裝單</h2>
        <p className="text-muted-foreground mt-2">
          請檢查安裝單 ID 是否正確。
        </p>
      </div>
    );
  }

  const handleSubmit = (values: InstallationFormValues) => {
    console.log("準備提交的表單資料:", JSON.stringify(values, null, 2));
    
    // 轉換表單資料為 API 期望的格式（包含項目更新）
    const installationData: UpdateInstallationRequest = {
      customer_name: values.customer_name,
      customer_phone: values.customer_phone || null,
      installation_address: values.installation_address,
      installer_user_id: values.installer_user_id || null,
      scheduled_date: values.scheduled_date || null,
      notes: values.notes || null,
      // 加入項目更新
      items: values.items.map((item) => ({
        product_variant_id: item.product_variant_id,
        product_name: item.product_name || "",
        sku: item.sku || "",
        quantity: item.quantity,
        specifications: item.specifications || null,
        notes: item.notes || null,
      })),
    };

    console.log("轉換後的 API 資料:", JSON.stringify(installationData, null, 2));

    updateInstallation(
      {
        id: installationId,
        ...installationData,
      },
      {
        onSuccess: (data) => {
          console.log("更新成功回應:", data);
          toast.success("安裝單更新成功");
          // 返回安裝單詳情頁
          router.push(`/installations/${installationId}`);
        },
        onError: (error) => {
          console.error("更新失敗錯誤:", error);
          toast.error("安裝單更新失敗", {
            description: error.message || "請檢查輸入資料並重試。"
          });
        },
      }
    );
  };

  // 準備初始資料供表單使用
  const initialData: Partial<InstallationFormValues> = {
    customer_name: installation.customer_name || "",
    customer_phone: installation.customer_phone || "",
    installation_address: installation.installation_address || "",
    installer_user_id: installation.installer_user_id || undefined,
    scheduled_date: installation.scheduled_date || "",
    notes: installation.notes || "",
    items: installation.items?.length > 0 
      ? installation.items.map((item: any) => ({
          product_variant_id: item.product_variant_id || 0,
          product_name: item.product_name || "",
          sku: item.sku || "",
          quantity: item.quantity || 1,
          specifications: item.specifications || "",
          notes: item.notes || "",
        }))
      : [
          // 如果沒有項目，提供一個空項目讓用戶可以編輯
          {
            product_variant_id: 0,
            product_name: "",
            sku: "",
            quantity: 1,
            specifications: "",
            notes: "",
          }
        ],
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題區 */}
      <div>
        <h2 className="text-2xl font-bold">
          編輯安裝單 #{installation.installation_number}
        </h2>
        <p className="text-muted-foreground">
          修改安裝單的資訊與項目設定。
        </p>
      </div>

      {/* 安裝單編輯表單 */}
      <InstallationForm
        initialData={initialData}
        isSubmitting={isPending}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/installations/${installationId}`)}
      />
    </div>
  );
} 