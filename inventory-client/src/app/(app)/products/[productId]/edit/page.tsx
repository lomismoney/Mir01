"use client";

import { use } from "react";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";

/**
 * 商品編輯頁面
 *
 * 動態路由：/products/[productId]/edit
 * 使用已有的 CreateProductWizard 組件在編輯模式下運行
 */
export default function ProductEditPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  // Next.js 15: params 現在是 Promise，需要使用 React.use() 解包
  const { productId } = use(params);

  return <CreateProductWizard productId={productId} data-oid="hp6bn4r" />;
}
