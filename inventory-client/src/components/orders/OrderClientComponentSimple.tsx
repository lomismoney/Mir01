"use client";

import React from "react";
import { useOrders } from "@/hooks";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

export function OrderClientComponentSimple() {
  console.log("OrderClientComponentSimple render");
  
  // 最簡單的查詢
  const { data: response, isLoading, isError, error } = useOrders({});
  
  console.log("Orders data:", { response, isLoading, isError, error });

  if (isLoading) {
    return <DataTableSkeleton columns={8} />;
  }

  if (isError) {
    return (
      <div className="text-red-500">
        無法加載訂單資料: {error?.message}
      </div>
    );
  }

  return (
    <div>
      <h3>簡化版訂單列表</h3>
      <p>訂單數量: {response?.data?.length || 0}</p>
      <pre>{JSON.stringify(response?.meta, null, 2)}</pre>
    </div>
  );
}