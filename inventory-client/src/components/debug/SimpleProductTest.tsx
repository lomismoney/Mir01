"use client";

import { useSession } from "next-auth/react";
import { useProducts } from "@/hooks/queries/useEntityQueries";
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
    <Card className="w-full max-w-2xl mx-auto" data-oid="tu5wnjx">
      <CardHeader data-oid="u5:zlq1">
        <CardTitle data-oid="0-f2ngi">簡化商品測試</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="._wmsnw">
        {/* 登入狀態 */}
        <div className="p-4 border rounded" data-oid="f:-42dd">
          <h3 className="font-semibold mb-2" data-oid="j5rfue3">
            登入狀態
          </h3>
          <Badge
            variant={status === "authenticated" ? "default" : "destructive"}
            data-oid="xplt5pf"
          >
            {status}
          </Badge>
          {session?.user?.email && (
            <p className="text-sm mt-1" data-oid="subwo18">
              用戶: {session.user.email}
            </p>
          )}
        </div>

        {/* 搜尋框 */}
        <div className="p-4 border rounded" data-oid="61z0dcp">
          <h3 className="font-semibold mb-2" data-oid="c35g7qb">
            商品搜尋
          </h3>
          <input
            type="text"
            placeholder="輸入商品名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded"
            data-oid="g25og3k"
          />
        </div>

        {/* API 狀態 */}
        <div className="p-4 border rounded" data-oid="lka-ted">
          <h3 className="font-semibold mb-2" data-oid="3:gyq3z">
            API 狀態
          </h3>
          <div className="space-y-2" data-oid="qcxtn03">
            <div data-oid="dr:6zlx">
              <strong data-oid="7r37tt7">載入中:</strong>{" "}
              {isLoading ? "是" : "否"}
            </div>
            <div data-oid="t9qplxq">
              <strong data-oid="xeqscy-">有錯誤:</strong> {error ? "是" : "否"}
            </div>
            {error && (
              <div className="text-red-600" data-oid="7:akh_j">
                <strong data-oid="zucruyb">錯誤訊息:</strong> {error.message}
              </div>
            )}
            <div data-oid="eosqulu">
              <strong data-oid="01wc8f6">數據類型:</strong> {typeof products}
            </div>
            <div data-oid="77n:rng">
              <strong data-oid="8019l-r">是陣列:</strong>{" "}
              {Array.isArray(products) ? "是" : "否"}
            </div>
            <div data-oid="wr_z.w1">
              <strong data-oid="dj74:fc">商品數量:</strong>{" "}
              {Array.isArray(products) ? products.length : "N/A"}
            </div>
          </div>
        </div>

        {/* 原始數據 */}
        <div className="p-4 border rounded" data-oid="uni5k.n">
          <h3 className="font-semibold mb-2" data-oid="7zsgal3">
            原始數據
          </h3>
          <pre
            className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40"
            data-oid="f70v:8x"
          >
            {JSON.stringify(products, null, 2)}
          </pre>
        </div>

        {/* 商品列表 */}
        {Array.isArray(products) && products.length > 0 && (
          <div className="p-4 border rounded" data-oid="nagsg.x">
            <h3 className="font-semibold mb-2" data-oid="f49ifv_">
              商品列表
            </h3>
            <div className="space-y-2" data-oid="k6lorf_">
              {products.slice(0, 3).map((product: any) => (
                <div
                  key={product.id}
                  className="p-2 bg-gray-50 rounded"
                  data-oid="6wm1bv6"
                >
                  <div className="font-medium" data-oid="hskhfv7">
                    {product.name}
                  </div>
                  <div className="text-sm text-gray-600" data-oid="ksjwcvv">
                    ID: {product.id} | 變體: {product.variants?.length || 0}
                  </div>
                </div>
              ))}
              {products.length > 3 && (
                <div className="text-sm text-gray-600" data-oid="wij78nh">
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
            <div className="p-4 border rounded bg-yellow-50" data-oid="x243e8w">
              <h3
                className="font-semibold mb-2 text-yellow-800"
                data-oid="ximji2f"
              >
                暫無商品資料
              </h3>
              <p className="text-sm text-yellow-700" data-oid="x64mj-i">
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
