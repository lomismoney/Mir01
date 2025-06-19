import React from 'react';
import { CustomerClientComponent } from '@/components/customers/CustomerClientComponent'; // <-- 新增導入

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">客戶管理</h2>
        <p className="text-muted-foreground">
          管理您的所有客戶資料、地址與訂單歷史。
        </p>
      </div>
      
      {/* 渲染我們的主力部隊組件 */}
      <CustomerClientComponent /> 
    </div>
  );
} 