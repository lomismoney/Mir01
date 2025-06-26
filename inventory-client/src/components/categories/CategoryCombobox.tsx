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
import { Category } from "@/types/category";

/**
 * 升級版分類選擇下拉框元件的屬性介面
 *
 * 支援完整路徑顯示和父分類禁用功能
 */
interface CategoryComboboxProps {
  /** 帶有顯示路徑和子分類標識的分類列表 */
  categories: (Category & { displayPath: string; hasChildren: boolean })[];
  /** 當前選中的分類 ID */
  value: number | null;
  /** 分類變更時的回調函數 */
  onChange: (value: number | null) => void;
  /** 是否禁用元件 */
  disabled?: boolean;
}

/**
 * 路徑顯示版分類選擇下拉框元件
 *
 * 功能特色：
 * 1. 完整路徑顯示 - 顯示分類的完整層級路徑（如：電子產品 > 手機 > 智慧型手機）
 * 2. 父分類禁用 - 有子分類的父分類無法被選擇，確保數據完整性
 * 3. 視覺區分 - 父分類以粗體和灰色文字顯示，清楚標示其狀態
 * 4. 路徑搜尋 - 支援按完整路徑進行搜尋，提高查找效率
 * 5. 取消選擇 - 支援「不指定分類」選項
 * 6. 響應式設計 - 長路徑自動截斷，保持界面整潔
 *
 * @param categories - 帶有路徑和子分類標識的分類列表
 * @param value - 當前選中的分類 ID
 * @param onChange - 分類變更回調函數
 * @param disabled - 是否禁用元件
 */
export function CategoryCombobox({
  categories,
  value,
  onChange,
  disabled,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // 根據當前選中的值找到對應的分類路徑
  const selectedCategoryName = value
    ? categories.find((category) => category.id === value)?.displayPath
    : "選擇分類...";

  return (
    <Popover open={open} onOpenChange={setOpen} data-oid="_k.e.bv">
      <PopoverTrigger asChild data-oid=":ywpp4w">
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
          disabled={disabled}
          data-oid="3s_8u6f"
        >
          <span className="truncate" data-oid="-:2cm4i">
            {selectedCategoryName}
          </span>
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            data-oid="2km-m-i"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0"
        data-oid="4hq5j6q"
      >
        <Command data-oid="vxkb3ru">
          <CommandInput placeholder="搜尋分類..." data-oid="3a-hhb6" />
          <CommandList data-oid="z68u8jd">
            <CommandEmpty data-oid="4uj_am:">找不到分類。</CommandEmpty>
            <CommandGroup data-oid="cw4xpl7">
              {/* 不指定分類選項 */}
              <CommandItem
                value="null"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
                data-oid="xz5l2_w"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === null ? "opacity-100" : "opacity-0",
                  )}
                  data-oid="egk6s.d"
                />
                不指定分類
              </CommandItem>

              {/* 分類選項列表 */}
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.displayPath} // 讓搜尋功能作用於完整路徑
                  onSelect={() => {
                    if (!category.hasChildren) {
                      // 只有在不是父分類時才可選
                      onChange(category.id);
                      setOpen(false);
                    }
                  }}
                  // 如果是父分類，則禁用點擊
                  disabled={category.hasChildren}
                  className={cn({
                    "font-bold text-muted-foreground cursor-not-allowed":
                      category.hasChildren,
                    "hover:bg-muted": !category.hasChildren,
                  })}
                  data-oid="vmryl5t"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0",
                    )}
                    data-oid="trbsi:f"
                  />

                  <span className="truncate" data-oid="h7352vf">
                    {category.displayPath}
                  </span>
                  {category.hasChildren && (
                    <span
                      className="ml-auto text-xs text-muted-foreground"
                      data-oid="xcsqym1"
                    >
                      （含子分類）
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
