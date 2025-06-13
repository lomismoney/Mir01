'use client';

import withAuth from '@/components/auth/withAuth';
import { InventoryManagement } from '@/components/inventory/InventoryManagement';

function InventoryManagementPage() {
  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">庫存管理</h1>
      </div>
      <InventoryManagement />
    </div>
  );
}

export default withAuth(InventoryManagementPage); 