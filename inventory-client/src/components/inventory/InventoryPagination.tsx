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
    <Pagination data-oid="ma:v.c:">
      <PaginationContent data-oid="fz1krxl">
        <PaginationItem data-oid="-jxuj_r">
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
            data-oid="4g51-7s"
          />
        </PaginationItem>
        {[...Array(last_page)].map((_, i) => (
          <PaginationItem key={i} data-oid="0vghi.g">
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(i + 1);
              }}
              isActive={current_page === i + 1}
              data-oid="2oly5w3"
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem data-oid=":g65hak">
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
            data-oid="rlq95d0"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
