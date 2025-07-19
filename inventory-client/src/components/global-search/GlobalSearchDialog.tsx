"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import {
  Package,
  ShoppingCart,
  Users,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data, isLoading } = useGlobalSearch(searchQuery);

  /**
   * 處理選擇項目導航
   */
  const handleSelect = React.useCallback(
    (type: "product" | "order" | "customer", id: string | number) => {
      onOpenChange(false);
      setSearchQuery("");

      switch (type) {
        case "product":
          router.push(`/products/${id}`);
          break;
        case "order":
          router.push(`/orders/${id}`);
          break;
        case "customer":
          router.push(`/customers/${id}`);
          break;
      }
    },
    [router, onOpenChange]
  );

  /**
   * 當對話框關閉時清空搜索
   */
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const hasResults =
    data &&
    (data.products.length > 0 ||
      data.orders.length > 0 ||
      data.customers.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="mx-4 max-w-2xl"
    >
      <CommandInput
        placeholder="搜尋產品、訂單、客戶..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />

      <CommandList className="max-h-[400px] overflow-y-auto">
        {/* 載入狀態 */}
        {isLoading && searchQuery.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">搜索中...</p>
          </div>
        )}

        {/* 空結果狀態 */}
        {!isLoading && searchQuery.length >= 2 && !hasResults && (
          <div className="flex flex-col items-center justify-center py-8">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <CommandEmpty className="mt-4 text-base font-medium">找不到相關結果</CommandEmpty>
            <p className="mt-2 text-sm text-muted-foreground">
              嘗試使用不同的關鍵詞搜尋
            </p>
          </div>
        )}

        {/* 搜尋結果 */}
        {!isLoading && data && hasResults && (
          <div className="overflow-hidden p-1">
            {/* 產品組 */}
            {data.products.length > 0 && (
              <>
                <CommandGroup heading="產品" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {data.products.map((product) => (
                    <CommandItem
                      key={`product-${product.id}`}
                      value={`product-${product.id}-${product.name}-${product.sku}`}
                      onSelect={() => handleSelect("product", product.id)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="ml-3 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium leading-none">{product.name}</span>
                          <Badge variant="secondary" className="h-5 text-xs">
                            {product.sku}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium text-primary">{formatCurrency(Number(product.price))}</span>
                          <span>庫存 {product.stock}</span>
                        </div>
                      </div>
                      <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {(data.orders.length > 0 || data.customers.length > 0) && (
                  <CommandSeparator className="my-1" />
                )}
              </>
            )}

            {/* 訂單組 */}
            {data.orders.length > 0 && (
              <>
                <CommandGroup heading="訂單" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {data.orders.map((order) => (
                    <CommandItem
                      key={`order-${order.id}`}
                      value={`order-${order.id}-${order.order_number}-${order.customer_name}`}
                      onSelect={() => handleSelect("order", order.id)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="ml-3 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium leading-none">{order.order_number}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{order.customer_name}</span>
                          <span className="font-medium text-primary">{formatCurrency(Number(order.total_amount))}</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>
                      <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {data.customers.length > 0 && (
                  <CommandSeparator className="my-1" />
                )}
              </>
            )}

            {/* 客戶組 */}
            {data.customers.length > 0 && (
              <CommandGroup heading="客戶" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {data.customers.map((customer) => (
                  <CommandItem
                    key={`customer-${customer.id}`}
                    value={`customer-${customer.id}-${customer.name}-${customer.phone || ""}-${customer.email || ""}`}
                    onSelect={() => handleSelect("customer", customer.id)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="ml-3 flex-1 space-y-1">
                      <div className="font-medium leading-none">{customer.name}</div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.email && <span>{customer.email}</span>}
                        <span>{customer.total_orders} 筆訂單</span>
                        <span className="font-medium text-primary">{formatCurrency(Number(customer.total_spent))}</span>
                      </div>
                    </div>
                    <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </div>
        )}

        {/* 提示信息 */}
        {searchQuery.length < 2 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              開始搜尋
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              輸入至少 2 個字符開始搜尋產品、訂單或客戶
            </p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * 狀態標籤組件 - 使用 shadcn/UI 官方色彩規範
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "待處理", variant: "outline" },
    processing: { label: "處理中", variant: "default" },
    completed: { label: "已完成", variant: "secondary" },
    cancelled: { label: "已取消", variant: "destructive" },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className="h-5 text-xs">
      {config.label}
    </Badge>
  );
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}