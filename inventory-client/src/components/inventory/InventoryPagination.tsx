import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface InventoryPaginationProps {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  onPageChange: (page: number) => void;
}

export function InventoryPagination({
  meta,
  onPageChange,
}: InventoryPaginationProps) {
  if (!meta || meta.total <= meta.per_page) {
    return null;
  }

  const { current_page, last_page } = meta;

  // A more sophisticated pagination logic could be implemented here
  // to show ellipsis for many pages. For now, we show all pages.

  return (
    <Pagination data-oid="uid3c:j">
      <PaginationContent data-oid=":y50s94">
        <PaginationItem data-oid="851:-a6">
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current_page > 1) {
                onPageChange(current_page - 1);
              }
            }}
            className={
              current_page === 1 ? "pointer-events-none opacity-50" : undefined
            }
            data-oid=".7lecj7"
          />
        </PaginationItem>
        {[...Array(last_page)].map((_, i) => (
          <PaginationItem key={i} data-oid="6h5m1pk">
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i + 1);
              }}
              isActive={current_page === i + 1}
              data-oid="zueh-ds"
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem data-oid="gwegn-s">
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (current_page < last_page) {
                onPageChange(current_page + 1);
              }
            }}
            className={
              current_page === last_page
                ? "pointer-events-none opacity-50"
                : undefined
            }
            data-oid="cul7d8c"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
