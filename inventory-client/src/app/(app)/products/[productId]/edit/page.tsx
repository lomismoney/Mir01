"use client";

import { use, lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/ui/skeleton";

// 動態導入產品嚮導組件
const CreateProductWizard = lazy(() => import("@/components/products/CreateProductWizard").then(module => ({ default: module.CreateProductWizard })));

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

  return (
    <Suspense fallback={<LoadingFallback type="page" text="載入商品編輯器..." />}>
      <CreateProductWizard productId={productId} />
    </Suspense>
  );
}
