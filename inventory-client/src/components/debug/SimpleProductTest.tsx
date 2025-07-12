"use client";

import { useSession } from "next-auth/react";
import { useProducts } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

/**
 * 簡化的商品測試組件
 * 用於快速診斷商品 API 問題
 */
export function SimpleProductTest() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    product_name: searchTerm,
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>簡化商品測試</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 登入狀態 */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">
            登入狀態
          </h3>
          <Badge
            variant={status === "authenticated" ? "default" : "destructive"}
           
          >
            {status}
          </Badge>
          {session?.user?.email && (
            <p className="text-sm mt-1">
              用戶: {session.user.email}
            </p>
          )}
        </div>

        {/* 搜尋框 */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">
            商品搜尋
          </h3>
          <input
            type="text"
            placeholder="輸入商品名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
           
          />
        </div>

        {/* API 狀態 */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">
            API 狀態
          </h3>
          <div className="space-y-2">
            <div>
              <strong>載入中:</strong>{" "}
              {isLoading ? "是" : "否"}
            </div>
            <div>
              <strong>有錯誤:</strong> {error ? "是" : "否"}
            </div>
            {error && (
              <div className="text-red-600">
                <strong>錯誤訊息:</strong> {error.message}
              </div>
            )}
            <div>
              <strong>數據類型:</strong> {typeof products}
            </div>
            <div>
              <strong>是陣列:</strong>{" "}
              {Array.isArray(products) ? "是" : "否"}
            </div>
            <div>
              <strong>商品數量:</strong>{" "}
              {Array.isArray(products) ? products.length : "N/A"}
            </div>
          </div>
        </div>

        {/* 原始數據 */}
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">
            原始數據
          </h3>
          <pre
            className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40"
           
          >
            {JSON.stringify(products, null, 2)}
          </pre>
        </div>

        {/* 商品列表 */}
        {Array.isArray(products) && products.length > 0 && (
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">
              商品列表
            </h3>
            <div className="space-y-2">
              {products.slice(0, 3).map((product: any) => (
                <div
                  key={product.id}
                  className="p-2 bg-gray-50 rounded"
                 
                >
                  <div className="font-medium">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    ID: {product.id} | 變體: {product.variants?.length || 0}
                  </div>
                </div>
              ))}
              {products.length > 3 && (
                <div className="text-sm text-gray-600">
                  還有 {products.length - 3} 個商品...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 無數據提示 */}
        {!isLoading &&
          !error &&
          (!products || (Array.isArray(products) && products.length === 0)) && (
            <div className="p-4 border rounded bg-yellow-50">
              <h3
                className="font-semibold mb-2 text-yellow-800"
               
              >
                暫無商品資料
              </h3>
              <p className="text-sm text-yellow-700">
                {searchTerm
                  ? `找不到包含「${searchTerm}」的商品`
                  : "系統中沒有商品資料"}
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
