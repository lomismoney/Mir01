import React from 'react';
import { OrderClientComponent } from '@/components/orders/OrderClientComponent'; // <-- 新增導入

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">訂單管理</h2>
        <p className="text-muted-foreground">
          管理您的所有銷售訂單、追蹤出貨與付款狀態。
        </p>
      </div>
      
      {/* 渲染我們的主力部隊組件 */}
      <OrderClientComponent /> 
    </div>
  );
} 