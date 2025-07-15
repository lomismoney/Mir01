import React from "react";
import { CustomerClientComponent } from "@/components/customers/CustomerClientComponent"; // <-- 新增導入

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* 渲染我們的主力部隊組件 */}
      <CustomerClientComponent />
    </div>
  );
}
