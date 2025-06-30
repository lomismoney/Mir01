"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCreateInstallation } from "@/hooks/queries/useEntityQueries";
import { InstallationForm, InstallationFormValues } from "@/components/installations";
import { CreateInstallationRequest } from "@/types/installation";
import { toast } from "sonner";

/**
 * 新增安裝單頁面
 * 
 * 提供完整的安裝單建立功能，包括：
 * - 客戶資訊填寫或選擇
 * - 安裝地址設定
 * - 安裝項目管理
 * - 安裝師傅分配
 * - 預計安裝日期設定
 */
export default function NewInstallationPage() {
  const router = useRouter();
  const { mutate: createInstallation, isPending } = useCreateInstallation();

  const handleSubmit = (values: InstallationFormValues) => {
    console.log("準備提交的表單資料:", values);
    
    // 轉換表單資料為 API 期望的格式
    const installationData: CreateInstallationRequest = {
      customer_name: values.customer_name,
      customer_phone: values.customer_phone || null,
      installation_address: values.installation_address,
      installer_user_id: values.installer_user_id || null,
      scheduled_date: values.scheduled_date || null,
      notes: values.notes || null,
      items: values.items.map((item: InstallationFormValues['items'][0]) => ({
        product_variant_id: item.product_variant_id,
        product_name: item.product_name || "",
        sku: item.sku || "",
        quantity: item.quantity,
        specifications: item.specifications || null,
        notes: item.notes || null,
      })),
    };

    console.log("轉換後的 API 資料:", installationData);

    createInstallation(installationData, {
      onSuccess: (data) => {
        console.log("創建成功回應:", data);
        
        const newInstallationId = (data as any)?.data?.id;
        if (newInstallationId) {
          // 跳轉到新建立的安裝單詳情頁
          router.push(`/installations/${newInstallationId}`);
        } else {
          // 回到安裝單列表頁
          router.push("/installations");
        }
      },
      onError: (error) => {
        console.error("創建失敗錯誤:", error);
        toast.error("安裝單建立失敗", {
          description: error.message || "請檢查輸入資料並重試。"
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題區 */}
      <div>
        <h2 className="text-2xl font-bold">
          新增安裝單
        </h2>
        <p className="text-muted-foreground">
          填寫以下資訊以建立一筆新的安裝單。
        </p>
      </div>

      {/* 安裝單表單 */}
      <InstallationForm
        isSubmitting={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 