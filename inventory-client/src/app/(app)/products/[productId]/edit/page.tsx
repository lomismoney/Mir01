"use client";

import { use, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">載入商品編輯器...</p>
          </div>
        </div>
      }
    >
      <CreateProductWizard productId={productId} />
    </Suspense>
  );
}
