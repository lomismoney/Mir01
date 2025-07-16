"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
  value?: string | number; // 🎯 支援數字和字串類型
  onValueChange: (value: number) => void; // 🎯 改為傳遞數字類型
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
    ? stores.find((store) => store.id === Number(value)) // 🎯 轉換為數字進行比較
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
         
        >
          {selectedStore ? selectedStore.name : placeholder}
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
           
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="搜尋分店名稱..."
            className="h-9"
           
          />

          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {/* 全部選項 */}
              <CommandItem
                value=""
                onSelect={() => {
                  onValueChange(0); // 🎯 傳遞數字 0 表示未選擇
                  setOpen(false);
                }}
               
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value || value === 0 ? "opacity-100" : "opacity-0", // 🎯 檢查是否為空或 0
                  )}
                 
                />
                全部分店
              </CommandItem>

              {/* 分店選項 */}
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name || ""}
                  onSelect={() => {
                    onValueChange(store.id || 0); // 🎯 直接傳遞數字 ID
                    setOpen(false);
                  }}
                 
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      Number(value) === store.id // 🎯 轉換為數字進行比較
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                   
                  />

                  {store.name}
                  {store.address && (
                    <span
                      className="ml-2 text-xs text-muted-foreground"
                     
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
