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
        data-oid="1.s6ea9"
      >
        <div className="text-center" data-oid=":1dpp:a">
          <h2 className="text-xl font-semibold mb-2" data-oid="i10z048">
            無效的庫存ID
          </h2>
          <p className="text-muted-foreground" data-oid="c30b4h.">
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
      data-oid="eblnz1r"
    />
  );
}
