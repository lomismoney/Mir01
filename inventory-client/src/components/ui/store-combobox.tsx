"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
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
import { useStores } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";

// Store 類型定義
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

interface StoreComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function StoreCombobox({
  value,
  onValueChange,
  placeholder = "選擇分店...",
  emptyText = "未找到分店",
  className,
}: StoreComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { data: storesResponse, isLoading } = useStores();

  // 🎯 標準化數據獲取 - 直接從 Hook 返回的結構中解構
  const stores = (storesResponse?.data ?? []) as Store[];

  const selectedStore = value
    ? stores.find((store) => store.id?.toString() === value)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen} data-oid="oc4accy">
      <PopoverTrigger asChild data-oid="hsabdjy">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
          data-oid=".7mumki"
        >
          {selectedStore ? selectedStore.name : placeholder}
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            data-oid="z6wxje4"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" data-oid="uu_mqpd">
        <Command data-oid="nz18uqz">
          <CommandInput
            placeholder="搜尋分店名稱..."
            className="h-9"
            data-oid="8nzxibw"
          />

          <CommandList data-oid="ql4:-qr">
            <CommandEmpty data-oid="kvyergf">{emptyText}</CommandEmpty>
            <CommandGroup data-oid="g736..y">
              {/* 全部選項 */}
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                }}
                data-oid="i2qp355"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "" ? "opacity-100" : "opacity-0",
                  )}
                  data-oid="37hzc6_"
                />
                全部分店
              </CommandItem>

              {/* 分店選項 */}
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name || ""}
                  onSelect={() => {
                    onValueChange(store.id?.toString() || "");
                    setOpen(false);
                  }}
                  data-oid="k5nhod_"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === store.id?.toString()
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                    data-oid="gfrgqax"
                  />

                  {store.name}
                  {store.address && (
                    <span
                      className="ml-2 text-xs text-muted-foreground"
                      data-oid="zssx:p-"
                    >
                      {store.address}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
