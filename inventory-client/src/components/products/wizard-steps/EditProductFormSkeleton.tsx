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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8" data-oid="l3kn7h7">
      {/* --- 頁面標題骨架 --- */}
      <div className="mb-8" data-oid="wbdull5">
        <Skeleton className="h-9 w-32 mb-2" data-oid="il8dyxx" /> {/* 標題 */}
        <Skeleton className="h-5 w-64" data-oid="3:3y87-" /> {/* 副標題 */}
      </div>

      {/* --- 統一的內容容器 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8" data-oid="4:0lrgs">
        {/* --- 左欄：步驟指示器骨架 --- */}
        <aside className="md:col-span-1" data-oid="ohlvp_4">
          {/* 進度概覽骨架 */}
          <div className="mb-6" data-oid="p.nkh_q">
            <div
              className="flex items-center justify-between mb-2"
              data-oid="xenk:fv"
            >
              <Skeleton className="h-4 w-20" data-oid="u76:h8v" />{" "}
              {/* "創建進度" 文字 */}
              <Skeleton
                className="h-5 w-16 rounded-full"
                data-oid="he44a46"
              />{" "}
              {/* Badge */}
            </div>
            <Progress value={25} className="w-full h-2" data-oid="ku:zz_u" />
          </div>

          {/* 步驟列表骨架 */}
          <div className="space-y-2" data-oid="i3p7j60">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                  step === 1
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-transparent"
                }`}
                data-oid="jo7krkm"
              >
                {/* 步驟圖標骨架 */}
                <div className="flex-shrink-0 mt-0.5" data-oid="imgt7ct">
                  <Skeleton
                    className="h-5 w-5 rounded-full"
                    data-oid="zhntqkq"
                  />
                </div>

                {/* 步驟資訊骨架 */}
                <div className="flex-1 min-w-0 space-y-1" data-oid="whkq2n6">
                  <Skeleton className="h-4 w-24" data-oid="3gw-nfo" />{" "}
                  {/* 步驟標題 */}
                  <Skeleton className="h-3 w-32" data-oid="2z4eclv" />{" "}
                  {/* 步驟描述 */}
                  {step === 1 && (
                    <div
                      className="flex items-center mt-1.5"
                      data-oid="el605hj"
                    >
                      <Skeleton className="h-3 w-12" data-oid="kief2cv" />{" "}
                      {/* "進行中" */}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- 右欄：表單內容區骨架 --- */}
        <main className="md:col-span-3" data-oid="qyh.r:8">
          {/* 基本資訊表單骨架 */}
          <Card
            className="bg-card text-card-foreground border border-border/40 shadow-sm"
            data-oid="td5-l.s"
          >
            <CardHeader data-oid="1cqqkwl">
              <div className="flex items-center gap-2" data-oid="ypcuxzk">
                <Skeleton className="h-5 w-5" data-oid="mty56f0" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" data-oid="jtjfv19" />{" "}
                {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent className="space-y-6" data-oid="yrv0eib">
              {/* 商品名稱輸入框骨架 */}
              <div className="space-y-2" data-oid="8g_ko8o">
                <Skeleton className="h-4 w-20" data-oid="kvbwlct" />{" "}
                {/* Label */}
                <Skeleton className="h-10 w-full" data-oid="5ky1hpc" />{" "}
                {/* Input */}
              </div>

              {/* 商品描述文本域骨架 */}
              <div className="space-y-2" data-oid="dn:y-ce">
                <Skeleton className="h-4 w-20" data-oid="8-1.6e-" />{" "}
                {/* Label */}
                <Skeleton className="h-24 w-full" data-oid="l.z:wmb" />{" "}
                {/* Textarea */}
              </div>

              {/* 商品分類選擇器骨架 */}
              <div className="space-y-2" data-oid="l57cm6q">
                <Skeleton className="h-4 w-20" data-oid="y96jv2e" />{" "}
                {/* Label */}
                <Skeleton className="h-10 w-full" data-oid="sa7b987" />{" "}
                {/* Select */}
              </div>
            </CardContent>
          </Card>

          {/* 圖片上傳區域骨架 */}
          <Card
            className="mt-6 bg-card text-card-foreground border border-border/40 shadow-sm"
            data-oid="psk0x.b"
          >
            <CardHeader data-oid="mzxoobu">
              <div className="flex items-center gap-2" data-oid="e_r2kok">
                <Skeleton className="h-5 w-5" data-oid="hnuuyw:" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" data-oid="3l.ruq1" />{" "}
                {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent data-oid="x-j.hue">
              <Skeleton className="h-48 w-full rounded-lg" data-oid="bmz2hyx" />{" "}
              {/* 上傳區域 */}
            </CardContent>
          </Card>

          {/* 底部導航控制骨架 */}
          <div
            className="mt-6 flex items-center justify-between"
            data-oid="5d3o7uq"
          >
            <Skeleton className="h-10 w-24" data-oid=":boow4t" />{" "}
            {/* 上一步按鈕 */}
            <Skeleton className="h-4 w-20" data-oid="qpqvo2d" />{" "}
            {/* 步驟指示 */}
            <Skeleton className="h-10 w-24" data-oid="r-8xbdd" />{" "}
            {/* 下一步按鈕 */}
          </div>
        </main>
      </div>
    </div>
  );
}
