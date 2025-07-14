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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

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

  // 處理選擇項目
  const handleSelect = React.useCallback(
    (type: "product" | "order" | "customer", id: number) => {
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

  // 當對話框關閉時清空搜索
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
      title="全局搜索"
      description="搜索產品、訂單、客戶"
    >
      <CommandInput
        placeholder="輸入關鍵詞搜索..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading && searchQuery.length >= 2 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!isLoading && searchQuery.length >= 2 && !hasResults && (
          <CommandEmpty>找不到相關結果</CommandEmpty>
        )}

        {!isLoading && data && hasResults && (
          <>
            {/* 產品組 */}
            {data.products.length > 0 && (
              <CommandGroup heading="產品">
                {data.products.map((product) => (
                  <CommandItem
                    key={`product-${product.id}`}
                    value={`product-${product.id}-${product.name}-${product.sku}`}
                    onSelect={() => handleSelect("product", product.id)}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatCurrency(product.price)}</span>
                        <span>庫存: {product.stock}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 分隔線 */}
            {data.products.length > 0 &&
              (data.orders.length > 0 || data.customers.length > 0) && (
                <CommandSeparator />
              )}

            {/* 訂單組 */}
            {data.orders.length > 0 && (
              <CommandGroup heading="訂單">
                {data.orders.map((order) => (
                  <CommandItem
                    key={`order-${order.id}`}
                    value={`order-${order.id}-${order.order_number}-${order.customer_name}`}
                    onSelect={() => handleSelect("order", order.id)}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {order.order_number}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{order.customer_name}</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 分隔線 */}
            {data.orders.length > 0 && data.customers.length > 0 && (
              <CommandSeparator />
            )}

            {/* 客戶組 */}
            {data.customers.length > 0 && (
              <CommandGroup heading="客戶">
                {data.customers.map((customer) => (
                  <CommandItem
                    key={`customer-${customer.id}`}
                    value={`customer-${customer.id}-${customer.name}-${customer.phone || ""}-${customer.email || ""}`}
                    onSelect={() => handleSelect("customer", customer.id)}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.email && <span>{customer.email}</span>}
                        <span>訂單: {customer.total_orders}</span>
                        <span>消費: {formatCurrency(customer.total_spent)}</span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* 提示信息 */}
        {searchQuery.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            輸入至少 2 個字符開始搜索
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// 狀態標籤組件
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "待處理", variant: "default" },
    processing: { label: "處理中", variant: "default" },
    completed: { label: "已完成", variant: "secondary" },
    cancelled: { label: "已取消", variant: "destructive" },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("zh-TW", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}