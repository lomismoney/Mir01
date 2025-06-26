"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/**
 * 商品編輯表單骨架屏組件
 *
 * 提供與實際表單結構一致的載入佔位符，
 * 避免載入完成後的佈局跳躍，提升用戶體驗。
 */
export function EditProductFormSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8" data-oid="kc:.h1u">
      {/* --- 頁面標題骨架 --- */}
      <div className="mb-8" data-oid="_aq6-y8">
        <Skeleton className="h-9 w-32 mb-2" data-oid="kxg0h3-" /> {/* 標題 */}
        <Skeleton className="h-5 w-64" data-oid="qbfqgg5" /> {/* 副標題 */}
      </div>

      {/* --- 統一的內容容器 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8" data-oid="ki_as3m">
        {/* --- 左欄：步驟指示器骨架 --- */}
        <aside className="md:col-span-1" data-oid="w:s7yy2">
          {/* 進度概覽骨架 */}
          <div className="mb-6" data-oid="hk-w4x:">
            <div
              className="flex items-center justify-between mb-2"
              data-oid="rk87dik"
            >
              <Skeleton className="h-4 w-20" data-oid="2pqw0jx" />{" "}
              {/* "創建進度" 文字 */}
              <Skeleton
                className="h-5 w-16 rounded-full"
                data-oid="o4lhtg1"
              />{" "}
              {/* Badge */}
            </div>
            <Progress value={25} className="w-full h-2" data-oid="j1j8wfd" />
          </div>

          {/* 步驟列表骨架 */}
          <div className="space-y-2" data-oid="48c.66r">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                  step === 1
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-transparent"
                }`}
                data-oid="rls_c9e"
              >
                {/* 步驟圖標骨架 */}
                <div className="flex-shrink-0 mt-0.5" data-oid="e-371qm">
                  <Skeleton
                    className="h-5 w-5 rounded-full"
                    data-oid="efaxv8g"
                  />
                </div>

                {/* 步驟資訊骨架 */}
                <div className="flex-1 min-w-0 space-y-1" data-oid="r.-y_c6">
                  <Skeleton className="h-4 w-24" data-oid="z6no4pu" />{" "}
                  {/* 步驟標題 */}
                  <Skeleton className="h-3 w-32" data-oid="05uy_x1" />{" "}
                  {/* 步驟描述 */}
                  {step === 1 && (
                    <div
                      className="flex items-center mt-1.5"
                      data-oid="nloaix6"
                    >
                      <Skeleton className="h-3 w-12" data-oid=":3tihfv" />{" "}
                      {/* "進行中" */}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- 右欄：表單內容區骨架 --- */}
        <main className="md:col-span-3" data-oid=":gmu4k:">
          {/* 基本資訊表單骨架 */}
          <Card
            className="bg-card text-card-foreground border border-border/40 shadow-sm"
            data-oid="_ncme:t"
          >
            <CardHeader data-oid="bk9iw8.">
              <div className="flex items-center gap-2" data-oid="nzqtexp">
                <Skeleton className="h-5 w-5" data-oid=":dkrhjh" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" data-oid="_8ow81n" />{" "}
                {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent className="space-y-6" data-oid="pxzogep">
              {/* 商品名稱輸入框骨架 */}
              <div className="space-y-2" data-oid="xtie0-f">
                <Skeleton className="h-4 w-20" data-oid="zh684r1" />{" "}
                {/* Label */}
                <Skeleton className="h-10 w-full" data-oid="20uf7.h" />{" "}
                {/* Input */}
              </div>

              {/* 商品描述文本域骨架 */}
              <div className="space-y-2" data-oid="gp2nfu4">
                <Skeleton className="h-4 w-20" data-oid="7e4si8g" />{" "}
                {/* Label */}
                <Skeleton className="h-24 w-full" data-oid="_r3iza_" />{" "}
                {/* Textarea */}
              </div>

              {/* 商品分類選擇器骨架 */}
              <div className="space-y-2" data-oid="1dzn34e">
                <Skeleton className="h-4 w-20" data-oid="_vyok1i" />{" "}
                {/* Label */}
                <Skeleton className="h-10 w-full" data-oid="bywsgpj" />{" "}
                {/* Select */}
              </div>
            </CardContent>
          </Card>

          {/* 圖片上傳區域骨架 */}
          <Card
            className="mt-6 bg-card text-card-foreground border border-border/40 shadow-sm"
            data-oid="p521sy-"
          >
            <CardHeader data-oid="ew.xlwf">
              <div className="flex items-center gap-2" data-oid="6i6t9op">
                <Skeleton className="h-5 w-5" data-oid="qy6cy30" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" data-oid="pnw6dd1" />{" "}
                {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent data-oid="d_e.uzw">
              <Skeleton className="h-48 w-full rounded-lg" data-oid="ps475-f" />{" "}
              {/* 上傳區域 */}
            </CardContent>
          </Card>

          {/* 底部導航控制骨架 */}
          <div
            className="mt-6 flex items-center justify-between"
            data-oid="u9iqfeu"
          >
            <Skeleton className="h-10 w-24" data-oid="5moq03t" />{" "}
            {/* 上一步按鈕 */}
            <Skeleton className="h-4 w-20" data-oid="9scpdwl" />{" "}
            {/* 步驟指示 */}
            <Skeleton className="h-10 w-24" data-oid="41--vd_" />{" "}
            {/* 下一步按鈕 */}
          </div>
        </main>
      </div>
    </div>
  );
}
