import React from "react";
import { CustomerClientComponent } from "@/components/customers/CustomerClientComponent"; // <-- 新增導入

export default function CustomersPage() {
  return (
    <div className="space-y-6" data-oid="88j-8:b">
      <div data-oid="wni:vr2">
        <h2 className="text-2xl font-bold" data-oid="xj8sxpl">
          客戶管理
        </h2>
        <p className="text-muted-foreground" data-oid="j3lk8ov">
          管理您的所有客戶資料、地址與訂單歷史。
        </p>
      </div>

      {/* 渲染我們的主力部隊組件 */}
      <CustomerClientComponent data-oid=".jbacg8" />
    </div>
  );
}
