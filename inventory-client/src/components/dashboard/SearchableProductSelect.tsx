"use client";

import { useState, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import type { DashboardProductVariant } from "@/types/dashboard";

interface SearchableProductSelectProps {
  variants: DashboardProductVariant[];
  value?: number | null;
  onValueChange: (value: number | null) => void;
  isLoading?: boolean;
}

export function SearchableProductSelect({
  variants,
  value,
  onValueChange,
  isLoading = false,
}: SearchableProductSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // 過濾商品變體
  const filteredVariants = useMemo(() => {
    if (!debouncedSearch) return variants;
    
    const query = debouncedSearch.toLowerCase();
    return variants.filter((variant) => {
      const productName = variant.product?.name?.toLowerCase() || "";
      const sku = variant.sku?.toLowerCase() || "";
      const attributes = variant.attribute_values
        ?.map((av) => av.value?.toLowerCase())
        .join(" ") || "";
      
      return (
        productName.includes(query) ||
        sku.includes(query) ||
        attributes.includes(query)
      );
    });
  }, [variants, debouncedSearch]);

  // 獲取選中的商品變體
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === value),
    [variants, value]
  );

  const handleSelect = useCallback((variantId: string) => {
    const id = parseInt(variantId, 10);
    onValueChange(id === value ? null : id);
    setOpen(false);
  }, [value, onValueChange]);

  const getVariantLabel = (variant: DashboardProductVariant) => {
    const attributes = variant.attribute_values
      ?.map((av) => av.value)
      .filter(Boolean)
      .join(" / ");
    
    return `${variant.product?.name || "未知商品"} - ${variant.sku}${
      attributes ? ` (${attributes})` : ""
    }`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : selectedVariant ? (
            <span className="truncate">{getVariantLabel(selectedVariant)}</span>
          ) : (
            <span className="text-muted-foreground">選擇商品...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="搜索商品名稱、SKU 或屬性..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  找不到符合的商品
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredVariants.slice(0, 50).map((variant) => {
                const attributes = variant.attribute_values
                  ?.map((av) => av.value)
                  .filter(Boolean);
                const totalStock = variant.inventory?.reduce(
                  (sum, inv) => sum + (inv.quantity || 0),
                  0
                ) || 0;

                return (
                  <CommandItem
                    key={variant.id}
                    value={variant.id?.toString() || ""}
                    onSelect={handleSelect}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === variant.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {variant.product?.name || "未知商品"}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{variant.sku}</span>
                          {attributes && attributes.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {attributes.join(" / ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={totalStock > 10 ? "default" : totalStock > 0 ? "secondary" : "destructive"}
                      className="ml-2 shrink-0"
                    >
                      庫存: {totalStock}
                    </Badge>
                  </CommandItem>
                );
              })}
              {filteredVariants.length > 50 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  顯示前 50 個結果，請輸入更多關鍵字縮小範圍
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}