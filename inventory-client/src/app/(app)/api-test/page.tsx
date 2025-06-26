"use client";

import { SimpleProductTest } from "@/components/debug/SimpleProductTest";

/**
 * API 測試頁面
 * 用於診斷商品 API 相關問題
 */
export default function ApiTestPage() {
  return (
    <div className="container mx-auto p-6" data-oid="2usk5as">
      <h1 className="text-2xl font-bold mb-6" data-oid="gdlzogl">
        商品 API 診斷測試
      </h1>
      <SimpleProductTest data-oid="-lx09_9" />
    </div>
  );
}
