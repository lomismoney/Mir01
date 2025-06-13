'use client';

import withAuth from '@/components/auth/withAuth';
import InventoryTransfer from '@/components/inventory/InventoryTransfer';

function InventoryTransferPage() {
  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">庫存轉移</h1>
      </div>
      <InventoryTransfer />
    </div>
  );
}

export default withAuth(InventoryTransferPage); 