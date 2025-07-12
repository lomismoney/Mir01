import { InventoryHistory } from "@/components/inventory/InventoryHistory";

interface InventoryHistoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    productName?: string;
    sku?: string;
  }>;
}

export default async function InventoryHistoryPage({
  params,
  searchParams,
}: InventoryHistoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const inventoryId = parseInt(resolvedParams.id);

  if (isNaN(inventoryId)) {
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
       
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            無效的庫存ID
          </h2>
          <p className="text-muted-foreground">
            請檢查URL中的庫存ID是否正確
          </p>
        </div>
      </div>
    );
  }

  return (
    <InventoryHistory
      inventoryId={inventoryId}
      productName={resolvedSearchParams.productName}
      sku={resolvedSearchParams.sku}
     
    />
  );
}
