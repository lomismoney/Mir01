import React from "react";
import { CustomerClientComponent } from "@/components/customers/CustomerClientComponent"; // <-- 新增導入

export default function CustomersPage() {
  return (
    <div className="space-y-6" data-oid="5mjn3mv">
      <div data-oid="za1wn3v">
        <h2 className="text-2xl font-bold" data-oid="kw0omgh">
          客戶管理
        </h2>
        <p className="text-muted-foreground" data-oid="00rgbtq">
          管理您的所有客戶資料、地址與訂單歷史。
        </p>
      </div>

      {/* 渲染我們的主力部隊組件 */}
      <CustomerClientComponent data-oid="1z5_fnu" />
    </div>
  );
}
