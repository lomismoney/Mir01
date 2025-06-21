"use client";

import { SimpleProductTest } from "@/components/debug/SimpleProductTest";

/**
 * API 測試頁面
 * 用於診斷商品 API 相關問題
 */
export default function ApiTestPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">商品 API 診斷測試</h1>
      <SimpleProductTest />
    </div>
  );
}
